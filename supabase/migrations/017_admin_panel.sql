-- Founder admin panel: is_admin flag + read-only admin RPCs.
-- RLS is untouched; cross-family reads happen only inside SECURITY DEFINER
-- functions that hard-fail for non-admin callers.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'admin only' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN json_build_object(
    'total_users',    (SELECT COUNT(*) FROM profiles),
    'total_families', (SELECT COUNT(*) FROM families),
    'total_children', (SELECT COUNT(*) FROM child_profiles),
    'new_users_7d',   (SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '7 days'),
    'new_users_30d',  (SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '30 days'),
    'active_users_7d', (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at > NOW() - INTERVAL '7 days')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_users(p_limit INT DEFAULT 100, p_offset INT DEFAULT 0)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  role TEXT,
  family_name TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'admin only' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    u.email::TEXT,
    p.role,
    f.name AS family_name,
    p.created_at,
    u.last_sign_in_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  LEFT JOIN family_members fm ON fm.user_id = p.id
  LEFT JOIN families f ON f.id = fm.family_id
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_get_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_users(INT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users(INT, INT) TO authenticated;

-- Founder admin access for George (account created 2026-07-24, pre-confirmed)
UPDATE profiles SET is_admin = TRUE
WHERE id IN (SELECT id FROM auth.users WHERE email = 'georgeobiora51@yahoo.com');
