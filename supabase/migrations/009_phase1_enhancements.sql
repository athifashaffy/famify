-- Phase 1: Enhanced Profiles, Child Profiles, and Routines
-- Run this in Supabase SQL Editor

-- ============================================
-- ENHANCE PROFILES TABLE
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parenting_stage TEXT;

-- ============================================
-- ENHANCE CHILD_PROFILES TABLE
-- ============================================
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}';
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS medical_notes TEXT;
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS food_preferences TEXT[] DEFAULT '{}';
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS hobbies TEXT[] DEFAULT '{}';
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS likes TEXT;
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS dislikes TEXT;
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS custom_notes TEXT;

-- ============================================
-- ROUTINES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES child_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('morning', 'bedtime', 'mealtime', 'school', 'afterschool', 'weekend', 'custom')) DEFAULT 'custom',
  time_of_day TIME,
  days_of_week INTEGER[] DEFAULT '{1,2,3,4,5,6,7}',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_routines_family_id ON routines(family_id);
CREATE INDEX IF NOT EXISTS idx_routines_child_id ON routines(child_id);
CREATE INDEX IF NOT EXISTS idx_child_profiles_family_id ON child_profiles(family_id);

-- Enable RLS
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for routines
CREATE POLICY "Family members can view routines"
  ON routines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = routines.family_id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create routines"
  ON routines FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = routines.family_id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can update routines"
  ON routines FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = routines.family_id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can delete routines"
  ON routines FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = routines.family_id
      AND family_members.user_id = auth.uid()
    )
  );

-- Also allow parents to insert into child_profiles (fix for adding children)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can insert child profiles'
  ) THEN
    CREATE POLICY "Parents can insert child profiles"
      ON child_profiles FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM family_members
          WHERE family_members.family_id = child_profiles.family_id
          AND family_members.user_id = auth.uid()
          AND family_members.role = 'parent'
        )
      );
  END IF;
END $$;

-- Allow parents to update child profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can update child profiles'
  ) THEN
    CREATE POLICY "Parents can update child profiles"
      ON child_profiles FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM family_members
          WHERE family_members.family_id = child_profiles.family_id
          AND family_members.user_id = auth.uid()
          AND family_members.role = 'parent'
        )
      );
  END IF;
END $$;

-- Allow parents to delete child profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Parents can delete child profiles'
  ) THEN
    CREATE POLICY "Parents can delete child profiles"
      ON child_profiles FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM family_members
          WHERE family_members.family_id = child_profiles.family_id
          AND family_members.user_id = auth.uid()
          AND family_members.role = 'parent'
        )
      );
  END IF;
END $$;
