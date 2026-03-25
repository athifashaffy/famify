import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vqyqygnhencugzavuffh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeXF5Z25oZW5jdWd6YXZ1ZmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTU1MjcsImV4cCI6MjA4NzI3MTUyN30.OBcI69s4Fr2zN4pDQGx3WzOMO8gyeH5CdU8Mn1sWWeE'
);

async function run() {
  const { data: auth } = await supabase.auth.signInWithPassword({
    email: 'john@famify-demo.com',
    password: 'Demo123!',
  });

  // List all families this user is in
  const { data: memberships } = await supabase.from('family_members')
    .select('family_id, role, joined_at')
    .eq('user_id', auth!.user!.id)
    .order('joined_at', { ascending: true });

  console.log('All memberships:');
  for (const m of memberships || []) {
    const { data: fam } = await supabase.from('families').select('*').eq('id', m.family_id).single();
    console.log(`  ${m.family_id} - name: "${fam?.name}" invite: ${fam?.invite_code} joined: ${m.joined_at}`);

    // Check members
    const { data: members } = await supabase.from('family_members').select('user_id').eq('family_id', m.family_id);
    for (const mem of members || []) {
      const { data: prof } = await supabase.from('profiles').select('name').eq('id', mem.user_id).single();
      console.log(`    member: ${mem.user_id} - ${prof?.name}`);
    }
  }
}

run().catch(console.error);
