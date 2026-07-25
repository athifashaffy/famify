-- Consolidated catch-up migration (2026-07-25).
-- Live-schema audit found migrations 010 and 016 were never applied to
-- production. This file is idempotent — safe to run even if parts exist.

-- From 010: gender on child profiles (Child Hub cards + add-child form use it)
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS gender TEXT;

-- From 016: routine assignee ('parent' | 'family' | 'child')
ALTER TABLE routines ADD COLUMN IF NOT EXISTS assignee_type TEXT DEFAULT 'family';
UPDATE routines SET assignee_type = 'child' WHERE child_id IS NOT NULL AND (assignee_type IS NULL OR assignee_type = 'family');
UPDATE routines SET assignee_type = 'family' WHERE assignee_type IS NULL;

-- From 016: notes edit timestamp (harmless if already present)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
