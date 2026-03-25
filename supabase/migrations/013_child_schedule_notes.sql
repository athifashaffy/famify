-- Create child_schedule_notes table for the Daily Schedule / Notes feature
CREATE TABLE IF NOT EXISTS child_schedule_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by child
CREATE INDEX IF NOT EXISTS idx_child_schedule_notes_child_id ON child_schedule_notes(child_id);
CREATE INDEX IF NOT EXISTS idx_child_schedule_notes_created_at ON child_schedule_notes(child_id, created_at DESC);

-- Enable RLS
ALTER TABLE child_schedule_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies: family members can read/write notes for children in their family
CREATE POLICY "Family members can view child schedule notes"
  ON child_schedule_notes FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can insert child schedule notes"
  ON child_schedule_notes FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can delete child schedule notes"
  ON child_schedule_notes FOR DELETE
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );
