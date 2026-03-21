-- Allow parents to update profiles of other parents in the same family
-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policy: users can update their own profile OR profiles of family members
CREATE POLICY "Users can update family member profiles" ON profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR id IN (
      SELECT fm2.user_id FROM family_members fm1
      JOIN family_members fm2 ON fm1.family_id = fm2.family_id
      WHERE fm1.user_id = auth.uid()
    )
  );
