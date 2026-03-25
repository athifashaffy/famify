import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vqyqygnhencugzavuffh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeXF5Z25oZW5jdWd6YXZ1ZmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTU1MjcsImV4cCI6MjA4NzI3MTUyN30.OBcI69s4Fr2zN4pDQGx3WzOMO8gyeH5CdU8Mn1sWWeE'
);

async function run() {
  // Login as demo user
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'john@famify-demo.com',
    password: 'Demo123!',
  });
  if (authErr) { console.error('Demo login failed:', authErr.message); }
  else {
    console.log('Demo user ID:', auth.user?.id);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', auth.user!.id).single();
    console.log('Demo profile:', JSON.stringify(profile, null, 2));

    const { data: members } = await supabase.from('family_members').select('*').eq('user_id', auth.user!.id);
    console.log('Demo memberships:', JSON.stringify(members, null, 2));

    const { data: children } = await supabase.from('child_profiles').select('*');
    console.log('Children:', JSON.stringify(children, null, 2));

    const { data: routines } = await supabase.from('routines').select('*');
    console.log('Routines:', JSON.stringify(routines, null, 2));

    // Check all profiles visible to this user
    const { data: allProfiles } = await supabase.from('profiles').select('id, name, email');
    console.log('All visible profiles:', JSON.stringify(allProfiles, null, 2));
  }

  // Try login as athif
  await supabase.auth.signOut();
  const { data: auth2, error: authErr2 } = await supabase.auth.signInWithPassword({
    email: 'athifshaffy@gmail.com',
    password: 'Demo123!',
  });
  if (authErr2) { console.log('athif login with Demo123! failed:', authErr2.message); }
  else { console.log('athif user ID:', auth2.user?.id); }
}

run().catch(console.error);
