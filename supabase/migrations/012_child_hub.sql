-- Child Hub: Secure child information vault with sharing

-- 1. Child Health Info (1:1 with child_profiles)
CREATE TABLE IF NOT EXISTS child_health_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  medications TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT[] DEFAULT '{}',
  pediatrician TEXT,
  immunization_status TEXT,
  emergency_contacts JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Child Routine Info (1:1 with child_profiles)
CREATE TABLE IF NOT EXISTS child_routine_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  sleep_schedule JSONB DEFAULT '{}',
  feeding_schedule JSONB DEFAULT '{}',
  comfort_methods TEXT[] DEFAULT '{}',
  triggers TEXT[] DEFAULT '{}',
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Child Documents
CREATE TABLE IF NOT EXISTS child_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Child Secure Shares
CREATE TABLE IF NOT EXISTS child_secure_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  access_code TEXT NOT NULL,
  share_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  max_views INTEGER DEFAULT 3,
  current_views INTEGER DEFAULT 0,
  is_revoked BOOLEAN DEFAULT FALSE,
  watermark_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Child Share Access Logs
CREATE TABLE IF NOT EXISTS child_share_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID REFERENCES child_secure_shares(id) ON DELETE CASCADE NOT NULL,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_info TEXT,
  user_agent TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_child_health_child ON child_health_info(child_id);
CREATE INDEX IF NOT EXISTS idx_child_routine_child ON child_routine_info(child_id);
CREATE INDEX IF NOT EXISTS idx_child_docs_child ON child_documents(child_id);
CREATE INDEX IF NOT EXISTS idx_child_docs_family ON child_documents(family_id);
CREATE INDEX IF NOT EXISTS idx_child_shares_token ON child_secure_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_child_shares_child ON child_secure_shares(child_id);
CREATE INDEX IF NOT EXISTS idx_child_access_logs_share ON child_share_access_logs(share_id);

-- RLS
ALTER TABLE child_health_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_routine_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_secure_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_share_access_logs ENABLE ROW LEVEL SECURITY;

-- Health info: family members can read/write
CREATE POLICY "Family members can manage health info" ON child_health_info
  FOR ALL USING (
    child_id IN (
      SELECT cp.id FROM child_profiles cp
      JOIN family_members fm ON fm.family_id = cp.family_id
      WHERE fm.user_id = auth.uid()
    )
  );

-- Routine info: family members can read/write
CREATE POLICY "Family members can manage routine info" ON child_routine_info
  FOR ALL USING (
    child_id IN (
      SELECT cp.id FROM child_profiles cp
      JOIN family_members fm ON fm.family_id = cp.family_id
      WHERE fm.user_id = auth.uid()
    )
  );

-- Documents: family members can manage
CREATE POLICY "Family members can manage documents" ON child_documents
  FOR ALL USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Secure shares: family members can manage
CREATE POLICY "Family members can manage shares" ON child_secure_shares
  FOR ALL USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Access logs: family members can read
CREATE POLICY "Family members can view access logs" ON child_share_access_logs
  FOR SELECT USING (
    share_id IN (
      SELECT cs.id FROM child_secure_shares cs
      JOIN family_members fm ON fm.family_id = cs.family_id
      WHERE fm.user_id = auth.uid()
    )
  );

-- Access logs: anyone can insert (for public share page)
CREATE POLICY "Anyone can log share access" ON child_share_access_logs
  FOR INSERT WITH CHECK (true);

-- Secure share RPC function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.access_child_share(p_token UUID, p_access_code TEXT, p_user_agent TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_share RECORD;
  v_child RECORD;
  v_health RECORD;
  v_routine RECORD;
BEGIN
  SELECT * INTO v_share FROM child_secure_shares
  WHERE share_token = p_token AND access_code = p_access_code
    AND is_revoked = FALSE AND expires_at > NOW() AND current_views < max_views;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invalid or expired share link');
  END IF;

  UPDATE child_secure_shares SET current_views = current_views + 1 WHERE id = v_share.id;

  INSERT INTO child_share_access_logs (share_id, user_agent) VALUES (v_share.id, p_user_agent);

  SELECT * INTO v_child FROM child_profiles WHERE id = v_share.child_id;
  SELECT * INTO v_health FROM child_health_info WHERE child_id = v_share.child_id;
  SELECT * INTO v_routine FROM child_routine_info WHERE child_id = v_share.child_id;

  RETURN jsonb_build_object(
    'child', to_jsonb(v_child),
    'health', COALESCE(to_jsonb(v_health), '{}'::jsonb),
    'routine', COALESCE(to_jsonb(v_routine), '{}'::jsonb),
    'watermark_note', v_share.watermark_note,
    'expires_at', v_share.expires_at,
    'views_remaining', v_share.max_views - v_share.current_views - 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NOTE: Create a 'child-documents' storage bucket in Supabase Dashboard
-- Settings: Private, max file size 10MB
