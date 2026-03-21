import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vqyqygnhencugzavuffh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeXF5Z25oZW5jdWd6YXZ1ZmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTU1MjcsImV4cCI6MjA4NzI3MTUyN30.OBcI69s4Fr2zN4pDQGx3WzOMO8gyeH5CdU8Mn1sWWeE'
);

async function seed() {
  // 1. Login as demo user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'john@famify-demo.com',
    password: 'Demo123!',
  });

  if (authError || !authData.user) {
    console.error('Login failed:', authError);
    return;
  }

  const userId = authData.user.id;
  console.log('Logged in as:', userId);

  // 2. Get family (use the first one created - "The Johnsons")
  const { data: memberData } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1);

  if (!memberData || memberData.length === 0) {
    console.error('No family found');
    return;
  }

  const familyId = memberData[0].family_id;
  console.log('Family ID:', familyId);

  // 3. Update profile with demo details
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({
      name: 'John',
      location: 'Toronto, ON',
      bio: 'Dad of two amazing kids. Love weekend hikes and cooking together as a family.',
      parenting_stage: 'Toddler (1-3)',
    })
    .eq('id', userId);
  console.log('Profile updated:', profileErr ? profileErr.message : 'OK');

  // 4. Seed child profiles
  const { data: existingChildren } = await supabase
    .from('child_profiles')
    .select('id')
    .eq('family_id', familyId);

  if (!existingChildren || existingChildren.length === 0) {
    const { error: childErr } = await supabase.from('child_profiles').insert([
      {
        parent_id: userId,
        family_id: familyId,
        name: 'Emma',
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
        parent_id: userId,
        family_id: familyId,
        name: 'Lucas',
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
    console.log('Children seeded:', childErr ? childErr.message : 'OK');
  } else {
    console.log('Children already exist, skipping');
  }

  // 5. Seed events
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 5);

  const { error: eventErr } = await supabase.from('events').insert([
    {
      family_id: familyId,
      created_by: userId,
      title: 'Emma - Pediatrician Checkup',
      description: 'Annual checkup with Dr. Chen at KidsCare Clinic',
      start_time: new Date(today.setHours(10, 0, 0)).toISOString(),
      end_time: new Date(today.setHours(11, 0, 0)).toISOString(),
      location: '123 Main St, Toronto',
      category: 'health',
    },
    {
      family_id: familyId,
      created_by: userId,
      title: 'Family Movie Night',
      description: 'Watching Finding Nemo with popcorn!',
      start_time: new Date(today.setHours(19, 0, 0)).toISOString(),
      end_time: new Date(today.setHours(21, 0, 0)).toISOString(),
      category: 'family',
    },
    {
      family_id: familyId,
      created_by: userId,
      title: 'Soccer Practice - Emma',
      description: 'SuperKids Soccer Academy, bring water bottle',
      start_time: new Date(tomorrow.setHours(15, 0, 0)).toISOString(),
      end_time: new Date(tomorrow.setHours(16, 30, 0)).toISOString(),
      location: '321 Bloor St W',
      category: 'activity',
    },
    {
      family_id: familyId,
      created_by: userId,
      title: 'Grocery Run',
      description: 'Weekly groceries - check the list in Planner',
      start_time: new Date(dayAfter.setHours(9, 0, 0)).toISOString(),
      category: 'chores',
    },
    {
      family_id: familyId,
      created_by: userId,
      title: 'Playdate with Sofia',
      description: 'At High Park playground',
      start_time: new Date(nextWeek.setHours(14, 0, 0)).toISOString(),
      end_time: new Date(nextWeek.setHours(16, 0, 0)).toISOString(),
      location: 'High Park, Toronto',
      category: 'family',
    },
  ]);
  console.log('Events seeded:', eventErr ? eventErr.message : 'OK');

  // 6. Seed tasks
  const { error: taskErr } = await supabase.from('tasks').insert([
    {
      family_id: familyId,
      created_by: userId,
      title: 'Book summer camp for Emma',
      description: 'Art camp at Harbourfront Centre - registration closes April 1',
      due_date: '2026-04-01T17:00:00',
      priority: 'high',
    },
    {
      family_id: familyId,
      created_by: userId,
      title: 'Buy diapers and wipes',
      description: 'Running low - size 5 for Lucas',
      due_date: '2026-03-22T12:00:00',
      priority: 'high',
    },
    {
      family_id: familyId,
      created_by: userId,
      title: 'Organize toy room',
      description: 'Donate outgrown toys, reorganize shelves',
      due_date: '2026-03-28T10:00:00',
      priority: 'medium',
    },
    {
      family_id: familyId,
      created_by: userId,
      title: 'Update family photo album',
      description: 'Print and add photos from March',
      due_date: '2026-03-30T18:00:00',
      priority: 'low',
    },
    {
      family_id: familyId,
      created_by: userId,
      title: 'Schedule dentist appointment for Emma',
      due_date: '2026-04-05T09:00:00',
      priority: 'medium',
    },
  ]);
  console.log('Tasks seeded:', taskErr ? taskErr.message : 'OK');

  // 7. Seed meal plans
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfterStr = new Date(Date.now() + 172800000).toISOString().split('T')[0];

  const { error: mealErr } = await supabase.from('meal_plans').insert([
    { family_id: familyId, created_by: userId, date: todayStr, meal_type: 'breakfast', description: 'Pancakes with blueberries, scrambled eggs, orange juice' },
    { family_id: familyId, created_by: userId, date: todayStr, meal_type: 'lunch', description: 'Grilled cheese sandwiches, tomato soup, apple slices' },
    { family_id: familyId, created_by: userId, date: todayStr, meal_type: 'dinner', description: 'Baked salmon, rice, steamed broccoli (Emma gets chicken instead)' },
    { family_id: familyId, created_by: userId, date: todayStr, meal_type: 'snack', description: 'Yogurt with granola, banana' },
    { family_id: familyId, created_by: userId, date: tomorrowStr, meal_type: 'breakfast', description: 'Oatmeal with honey and strawberries' },
    { family_id: familyId, created_by: userId, date: tomorrowStr, meal_type: 'lunch', description: 'Pasta with marinara sauce, side salad' },
    { family_id: familyId, created_by: userId, date: tomorrowStr, meal_type: 'dinner', description: 'Taco night! Ground turkey, cheese, lettuce, mild salsa' },
    { family_id: familyId, created_by: userId, date: dayAfterStr, meal_type: 'breakfast', description: 'French toast with maple syrup, fruit salad' },
    { family_id: familyId, created_by: userId, date: dayAfterStr, meal_type: 'dinner', description: 'Homemade pizza - margherita for adults, cheese for kids' },
  ]);
  console.log('Meals seeded:', mealErr ? mealErr.message : 'OK');

  // 8. Seed reminders
  const { error: reminderErr } = await supabase.from('reminders').insert([
    { family_id: familyId, user_id: userId, title: 'Give Emma allergy medication - 8 AM', remind_at: new Date(Date.now() + 3600000).toISOString() },
    { family_id: familyId, user_id: userId, title: 'Lucas nap time - 1 PM', remind_at: new Date(Date.now() + 7200000).toISOString() },
    { family_id: familyId, user_id: userId, title: 'Pick up dry cleaning', remind_at: new Date(Date.now() + 86400000).toISOString() },
    { family_id: familyId, user_id: userId, title: 'Pay daycare tuition - due March 25', remind_at: '2026-03-25T09:00:00' },
  ]);
  console.log('Reminders seeded:', reminderErr ? reminderErr.message : 'OK');

  // 9. Seed notes
  const { error: noteErr } = await supabase.from('notes').insert([
    {
      family_id: familyId,
      created_by: userId,
      title: 'Emergency Contacts',
      content: 'Pediatrician: Dr. Sarah Chen (416-555-0101)\nPoison Control: 1-800-268-9017\nNanny (Maria): 416-555-0199\nGrandma: 416-555-0155',
    },
    {
      family_id: familyId,
      created_by: userId,
      title: 'Emma\'s Bedtime Routine Notes',
      content: '1. Bath at 7:00 PM\n2. Pajamas and brush teeth\n3. Two bedtime stories (she picks)\n4. Night light ON, door cracked open\n5. Asleep by 7:45 PM',
    },
    {
      family_id: familyId,
      created_by: userId,
      title: 'Grocery Staples',
      content: 'Always keep stocked:\n- Milk (oat for Emma, whole for Lucas)\n- Bananas, apples, berries\n- Bread, eggs, cheese\n- Chicken breasts\n- Pasta + sauce\n- Baby food pouches\n- Diapers size 5',
    },
  ]);
  console.log('Notes seeded:', noteErr ? noteErr.message : 'OK');

  // 10. Seed lists
  const { data: listData, error: listErr } = await supabase.from('lists').insert([
    { family_id: familyId, created_by: userId, title: 'Weekly Groceries', type: 'grocery' },
    { family_id: familyId, created_by: userId, title: 'Emma\'s Birthday Party Supplies', type: 'shopping' },
    { family_id: familyId, created_by: userId, title: 'Summer Camp Packing List', type: 'custom' },
  ]).select();
  console.log('Lists seeded:', listErr ? listErr.message : 'OK');

  // 11. Seed routines (may fail if table doesn't exist yet)
  const { error: routineErr } = await supabase.from('routines').insert([
    {
      family_id: familyId,
      created_by: userId,
      title: 'Brush teeth & wash face',
      description: 'Use the dinosaur toothbrush for Emma',
      category: 'morning',
      time_of_day: '07:00',
      days_of_week: [1, 2, 3, 4, 5, 6, 7],
      is_active: true,
      sort_order: 1,
    },
    {
      family_id: familyId,
      created_by: userId,
      title: 'Get dressed for school',
      description: 'Lay out clothes the night before',
      category: 'morning',
      time_of_day: '07:15',
      days_of_week: [1, 2, 3, 4, 5],
      is_active: true,
      sort_order: 2,
    },
    {
      family_id: familyId,
      created_by: userId,
      title: 'Pack school bag & lunch',
      description: 'Check for homework, water bottle, snack',
      category: 'school',
      time_of_day: '07:30',
      days_of_week: [1, 2, 3, 4, 5],
      is_active: true,
      sort_order: 1,
    },
    {
      family_id: familyId,
      created_by: userId,
      title: 'Bath time',
      description: 'Emma first, then Lucas. Use the gentle soap for Lucas.',
      category: 'bedtime',
      time_of_day: '19:00',
      days_of_week: [1, 2, 3, 4, 5, 6, 7],
      is_active: true,
      sort_order: 1,
    },
    {
      family_id: familyId,
      created_by: userId,
      title: 'Bedtime stories',
      description: 'Two stories - Emma gets to pick',
      category: 'bedtime',
      time_of_day: '19:30',
      days_of_week: [1, 2, 3, 4, 5, 6, 7],
      is_active: true,
      sort_order: 2,
    },
    {
      family_id: familyId,
      created_by: userId,
      title: 'Family breakfast together',
      description: 'Everyone sits at the table, no screens',
      category: 'mealtime',
      time_of_day: '07:45',
      days_of_week: [6, 7],
      is_active: true,
      sort_order: 1,
    },
    {
      family_id: familyId,
      created_by: userId,
      title: 'Park or outdoor play',
      description: 'Weather permitting - High Park or backyard',
      category: 'weekend',
      time_of_day: '10:00',
      days_of_week: [6, 7],
      is_active: true,
      sort_order: 1,
    },
  ]);
  console.log('Routines seeded:', routineErr ? routineErr.message : 'OK (table may not exist yet - run migration first)');

  // 12. Seed notifications
  const { error: notifErr } = await supabase.from('notifications').upsert([
    {
      user_id: userId,
      family_id: familyId,
      type: 'planner',
      title: 'Upcoming Event',
      message: 'Soccer Practice tomorrow at 3 PM',
      is_read: false,
      data: {},
    },
    {
      user_id: userId,
      family_id: familyId,
      type: 'system',
      title: 'New Comment',
      message: 'Patricia commented on your post',
      is_read: false,
      data: {},
    },
    {
      user_id: userId,
      family_id: familyId,
      type: 'planner',
      title: 'Task Due Tomorrow',
      message: 'Buy diapers and wipes - due March 22',
      is_read: false,
      data: {},
    },
    {
      user_id: userId,
      family_id: familyId,
      type: 'child_hub',
      title: 'Lucas Milestone',
      message: 'Don\'t forget to update Lucas\'s milestone - first steps!',
      is_read: false,
      data: {},
    },
    {
      user_id: userId,
      family_id: familyId,
      type: 'needle',
      title: 'New Place Nearby',
      message: 'A new kids activity centre opened within 2 km',
      is_read: false,
      data: {},
    },
  ]);
  console.log('Notifications seeded:', notifErr ? notifErr.message : 'OK');

  console.log('\n✅ Demo data seeded successfully! Refresh the app to see everything.');
}

seed().catch(console.error);
