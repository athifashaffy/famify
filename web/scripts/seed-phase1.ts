import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vqyqygnhencugzavuffh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeXF5Z25oZW5jdWd6YXZ1ZmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTU1MjcsImV4cCI6MjA4NzI3MTUyN30.OBcI69s4Fr2zN4pDQGx3WzOMO8gyeH5CdU8Mn1sWWeE'
);

async function run() {
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'john@famify-demo.com',
    password: 'Demo123!',
  });
  if (authErr || !auth.user) { console.error('Login failed:', authErr); return; }

  const userId = auth.user.id;
  const familyId = '1620dc56-c9c2-4f3d-bfc2-39b18e1ce47c';

  // Update profile to George in Sudbury
  const { error: profErr } = await supabase.from('profiles').update({
    name: 'George',
    location: 'Sudbury, ON',
    bio: 'Dad of two amazing kids. Love weekend hikes at Lake Ramsey and cooking together as a family.',
    parenting_stage: 'Toddler (1-3)',
  }).eq('id', userId);
  console.log('Profile:', profErr ? profErr.message : 'OK');

  // Update family name
  await supabase.from('families').update({ name: 'The Martins' }).eq('id', familyId);

  // Seed children
  const { data: existingChildren } = await supabase.from('child_profiles').select('id').eq('family_id', familyId);
  if (!existingChildren || existingChildren.length === 0) {
    const { error: childErr } = await supabase.from('child_profiles').insert([
      {
        parent_id: userId, family_id: familyId, name: 'Emma',
        date_of_birth: '2022-06-15',
        allergies: ['Peanuts', 'Dairy'],
        medical_notes: 'Carries EpiPen. Pediatrician: Dr. Sarah Chen',
        food_preferences: ['Pasta', 'Berries', 'Chicken nuggets'],
        hobbies: ['Drawing', 'Dancing', 'Puzzles'],
        likes: 'Dinosaurs, the color purple, bedtime stories',
        dislikes: 'Loud noises, broccoli',
        custom_notes: 'Starting preschool in September',
      },
      {
        parent_id: userId, family_id: familyId, name: 'Lucas',
        date_of_birth: '2024-01-10',
        allergies: [],
        medical_notes: 'Next checkup: April 2026',
        food_preferences: ['Bananas', 'Sweet potato', 'Rice cereal'],
        hobbies: ['Stacking blocks', 'Music'],
        likes: 'Peek-a-boo, his stuffed bear',
        dislikes: 'Getting dressed',
        custom_notes: 'Starting to walk! First steps March 2026',
      },
    ]);
    console.log('Children:', childErr ? childErr.message : 'OK');
  } else {
    console.log('Children already exist, skipping');
  }

  // Seed routines
  const { data: existingRoutines } = await supabase.from('routines').select('id').eq('family_id', familyId);
  if (!existingRoutines || existingRoutines.length === 0) {
    const { error: routineErr } = await supabase.from('routines').insert([
      { family_id: familyId, created_by: userId, title: 'Brush teeth & wash face', description: 'Use the dinosaur toothbrush for Emma', category: 'morning', time_of_day: '07:00', days_of_week: [1,2,3,4,5,6,7], is_active: true, sort_order: 1 },
      { family_id: familyId, created_by: userId, title: 'Get dressed for school', description: 'Lay out clothes the night before', category: 'morning', time_of_day: '07:15', days_of_week: [1,2,3,4,5], is_active: true, sort_order: 2 },
      { family_id: familyId, created_by: userId, title: 'Pack school bag & lunch', description: 'Check for homework, water bottle, snack', category: 'school', time_of_day: '07:30', days_of_week: [1,2,3,4,5], is_active: true, sort_order: 1 },
      { family_id: familyId, created_by: userId, title: 'Bath time', description: 'Emma first, then Lucas. Use gentle soap for Lucas.', category: 'bedtime', time_of_day: '19:00', days_of_week: [1,2,3,4,5,6,7], is_active: true, sort_order: 1 },
      { family_id: familyId, created_by: userId, title: 'Bedtime stories', description: 'Two stories - Emma gets to pick', category: 'bedtime', time_of_day: '19:30', days_of_week: [1,2,3,4,5,6,7], is_active: true, sort_order: 2 },
      { family_id: familyId, created_by: userId, title: 'Family breakfast together', description: 'Everyone sits at the table, no screens', category: 'mealtime', time_of_day: '07:45', days_of_week: [6,7], is_active: true, sort_order: 1 },
      { family_id: familyId, created_by: userId, title: 'Park or outdoor play', description: 'Weather permitting - Bell Park or backyard', category: 'weekend', time_of_day: '10:00', days_of_week: [6,7], is_active: true, sort_order: 1 },
    ]);
    console.log('Routines:', routineErr ? routineErr.message : 'OK');
  } else {
    console.log('Routines already exist, skipping');
  }

  // Update the other family member name to Jane
  const { data: members } = await supabase.from('family_members').select('user_id').eq('family_id', familyId);
  if (members) {
    for (const m of members) {
      if (m.user_id !== userId) {
        await supabase.from('profiles').update({ name: 'Jane' }).eq('id', m.user_id);
        console.log('Updated other member to Jane');
      }
    }
  }

  console.log('\nDone! Refresh the app.');
}

run().catch(console.error);
