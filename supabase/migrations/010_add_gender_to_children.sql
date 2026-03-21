-- Add gender column to child_profiles
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS gender TEXT;
