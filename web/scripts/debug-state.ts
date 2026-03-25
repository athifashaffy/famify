import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vqyqygnhencugzavuffh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeXF5Z25oZW5jdWd6YXZ1ZmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTU1MjcsImV4cCI6MjA4NzI3MTUyN30.OBcI69s4Fr2zN4pDQGx3WzOMO8gyeH5CdU8Mn1sWWeE'
);

async function run() {
  // Login as demo user
  const { data: auth } = await supabase.auth.signInWithPassword({
    email: 'john@famify-demo.com',
    password: 'Demo123!',
  });
  const userId = auth!.user!.id;

  // Check family 1620dc56 details
  const { data: family } = await supabase.from('families').select('*').eq('id', '1620dc56-c9c2-4f3d-bfc2-39b18e1ce47c').single();
  console.log('Family 1620:', JSON.stringify(family, null, 2));

  // Check the other user's profile (verify if update worked)
  const { data: otherProfile } = await supabase.from('profiles').select('id, name').eq('id', '85f9135d-4341-47e4-9bb9-867521524d20').single();
  console.log('Other profile:', JSON.stringify(otherProfile, null, 2));

  // Check children for this family
  const { data: children } = await supabase.from('child_profiles').select('id, name, family_id, parent_id').eq('family_id', '1620dc56-c9c2-4f3d-bfc2-39b18e1ce47c');
  console.log('Children in family:', JSON.stringify(children, null, 2));
}

run().catch(console.error);
