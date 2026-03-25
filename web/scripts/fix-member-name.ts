import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vqyqygnhencugzavuffh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeXF5Z25oZW5jdWd6YXZ1ZmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTU1MjcsImV4cCI6MjA4NzI3MTUyN30.OBcI69s4Fr2zN4pDQGx3WzOMO8gyeH5CdU8Mn1sWWeE'
);

async function run() {
  // Login as demo user to get access
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'john@famify-demo.com',
    password: 'Demo123!',
  });
  if (authErr || !auth.user) { console.error('Login failed:', authErr); return; }

  const userId = auth.user.id;
  const familyId = '1620dc56-c9c2-4f3d-bfc2-39b18e1ce47c';

  // Find the other member (not the demo user)
  const { data: members } = await supabase.from('family_members').select('user_id').eq('family_id', familyId);
  if (members) {
    for (const m of members) {
      if (m.user_id !== userId) {
        console.log('Other member user_id:', m.user_id);
        const { error } = await supabase.from('profiles').update({ name: 'Jane Doe' }).eq('id', m.user_id);
        if (error) {
          console.error('Update failed:', error.message);
        } else {
          console.log('Updated to Jane Doe');
        }
      }
    }
  }

  console.log('Done!');
}

run().catch(console.error);
