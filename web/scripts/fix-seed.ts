import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vqyqygnhencugzavuffh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeXF5Z25oZW5jdWd6YXZ1ZmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTU1MjcsImV4cCI6MjA4NzI3MTUyN30.OBcI69s4Fr2zN4pDQGx3WzOMO8gyeH5CdU8Mn1sWWeE'
);

const CORRECT_FAMILY_ID = 'eb0c8721-5943-4069-a3d4-f514ade21e13';
const ATHIF_USER_ID = 'd5b4df4b-6e4b-4171-a58c-b989ad7ccf1c';

async function run() {
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'john@famify-demo.com',
    password: 'Demo123!',
  });
  if (authErr || !auth.user) { console.error('Login failed:', authErr); return; }
  const userId = auth.user.id;

  // Update family name to "The Martins"
  const { error: famErr } = await supabase.from('families').update({ name: 'The Martins' }).eq('id', CORRECT_FAMILY_ID);
  console.log('Family name:', famErr ? famErr.message : 'OK');

  // Seed children for the CORRECT family
  const { data: existingChildren } = await supabase.from('child_profiles').select('id').eq('family_id', CORRECT_FAMILY_ID);
  if (!existingChildren || existingChildren.length === 0) {
    const { error: childErr } = await supabase.from('child_profiles').insert([
      {
        parent_id: userId, family_id: CORRECT_FAMILY_ID, name: 'Emma',
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
        parent_id: userId, family_id: CORRECT_FAMILY_ID, name: 'Lucas',
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

  // Seed routines for the CORRECT family
  const { data: existingRoutines } = await supabase.from('routines').select('id').eq('family_id', CORRECT_FAMILY_ID);
  if (!existingRoutines || existingRoutines.length === 0) {
    const { error: routineErr } = await supabase.from('routines').insert([
      { family_id: CORRECT_FAMILY_ID, created_by: userId, title: 'Brush teeth & wash face', description: 'Use the dinosaur toothbrush for Emma', category: 'morning', time_of_day: '07:00', days_of_week: [1,2,3,4,5,6,7], is_active: true, sort_order: 1 },
      { family_id: CORRECT_FAMILY_ID, created_by: userId, title: 'Get dressed for school', description: 'Lay out clothes the night before', category: 'morning', time_of_day: '07:15', days_of_week: [1,2,3,4,5], is_active: true, sort_order: 2 },
      { family_id: CORRECT_FAMILY_ID, created_by: userId, title: 'Pack school bag & lunch', description: 'Check for homework, water bottle, snack', category: 'school', time_of_day: '07:30', days_of_week: [1,2,3,4,5], is_active: true, sort_order: 1 },
      { family_id: CORRECT_FAMILY_ID, created_by: userId, title: 'Bath time', description: 'Emma first, then Lucas. Use gentle soap for Lucas.', category: 'bedtime', time_of_day: '19:00', days_of_week: [1,2,3,4,5,6,7], is_active: true, sort_order: 1 },
      { family_id: CORRECT_FAMILY_ID, created_by: userId, title: 'Bedtime stories', description: 'Two stories - Emma gets to pick', category: 'bedtime', time_of_day: '19:30', days_of_week: [1,2,3,4,5,6,7], is_active: true, sort_order: 2 },
      { family_id: CORRECT_FAMILY_ID, created_by: userId, title: 'Family breakfast together', description: 'Everyone sits at the table, no screens', category: 'mealtime', time_of_day: '07:45', days_of_week: [6,7], is_active: true, sort_order: 1 },
      { family_id: CORRECT_FAMILY_ID, created_by: userId, title: 'Park or outdoor play', description: 'Weather permitting - Bell Park or backyard', category: 'weekend', time_of_day: '10:00', days_of_week: [6,7], is_active: true, sort_order: 1 },
    ]);
    console.log('Routines:', routineErr ? routineErr.message : 'OK');
  } else {
    console.log('Routines already exist, skipping');
  }

  // Seed events/tasks for the CORRECT family
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const { data: existingEvents } = await supabase.from('events').select('id').eq('family_id', CORRECT_FAMILY_ID);
  if (!existingEvents || existingEvents.length === 0) {
    await supabase.from('events').insert([
      { family_id: CORRECT_FAMILY_ID, created_by: userId, title: 'Emma Pediatric Checkup', description: 'Dr. Sarah Chen - bring vaccination records', date: tomorrow, time: '10:00', category: 'health' },
      { family_id: CORRECT_FAMILY_ID, created_by: userId, title: 'Lucas Swimming Class', description: 'Bring swim diapers and towel', date: tomorrow, time: '14:00', category: 'activity' },
      { family_id: CORRECT_FAMILY_ID, created_by: userId, title: 'Family Grocery Run', description: 'Need milk, eggs, Emma snacks (nut-free)', date: today, time: '17:00', category: 'errand' },
      { family_id: CORRECT_FAMILY_ID, created_by: userId, title: 'Parent-Teacher Meeting', description: 'Emma preschool progress review', date: nextWeek, time: '15:30', category: 'school' },
    ]);
    console.log('Events: OK');
  }

  const { data: existingTasks } = await supabase.from('tasks').select('id').eq('family_id', CORRECT_FAMILY_ID);
  if (!existingTasks || existingTasks.length === 0) {
    await supabase.from('tasks').insert([
      { family_id: CORRECT_FAMILY_ID, created_by: userId, assigned_to: userId, title: 'Book Emma dental appointment', priority: 'high', status: 'pending', due_date: tomorrow },
      { family_id: CORRECT_FAMILY_ID, created_by: userId, assigned_to: userId, title: 'Buy Lucas new shoes (size 5)', priority: 'medium', status: 'pending', due_date: nextWeek },
      { family_id: CORRECT_FAMILY_ID, created_by: userId, assigned_to: userId, title: 'Prepare school lunches for the week', priority: 'medium', status: 'completed', due_date: today },
      { family_id: CORRECT_FAMILY_ID, created_by: userId, assigned_to: userId, title: 'Schedule family photo session', priority: 'low', status: 'pending', due_date: nextWeek },
    ]);
    console.log('Tasks: OK');
  }

  // Try to update Athif's profile name to Jane Doe
  // Note: RLS may block this since only users can update their own profile
  const { error: nameErr, count } = await supabase.from('profiles')
    .update({ name: 'Jane Doe' })
    .eq('id', ATHIF_USER_ID);
  console.log('Athif -> Jane Doe:', nameErr ? nameErr.message : 'attempted (may be blocked by RLS)');

  console.log('\nDone! Refresh the app.');
}

run().catch(console.error);
