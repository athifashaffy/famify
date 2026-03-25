import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vqyqygnhencugzavuffh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeXF5Z25oZW5jdWd6YXZ1ZmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTU1MjcsImV4cCI6MjA4NzI3MTUyN30.OBcI69s4Fr2zN4pDQGx3WzOMO8gyeH5CdU8Mn1sWWeE'
);

async function run() {
  const { data: profiles } = await supabase.from('profiles').select('id, name, email');
  console.log('Profiles:', JSON.stringify(profiles, null, 2));

  const { data: families } = await supabase.from('families').select('id, name');
  console.log('Families:', JSON.stringify(families, null, 2));

  const { data: members } = await supabase.from('family_members').select('user_id, family_id, role');
  console.log('Members:', JSON.stringify(members, null, 2));
}

run().catch(console.error);
