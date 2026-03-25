export interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  role: 'parent' | 'child' | 'caregiver' | null;
  date_of_birth: string | null;
  location: string | null;
  bio: string | null;
  parenting_stage: string | null;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  created_by: string | null;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: 'parent' | 'child' | 'caregiver';
  joined_at: string;
}

export interface FamilyMemberWithProfile extends FamilyMember {
  name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
}

export interface ChildProfile {
  id: string;
  user_id: string | null;
  parent_id: string | null;
  family_id: string | null;
  name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  allergies: string[];
  medical_notes: string | null;
  food_preferences: string[];
  hobbies: string[];
  likes: string | null;
  dislikes: string | null;
  custom_notes: string | null;
  permissions: Record<string, any>;
  interests: string[];
  age_group: string | null;
  created_at: string;
}

export type RoutineCategory = 'morning' | 'bedtime' | 'mealtime' | 'school' | 'afterschool' | 'weekend' | 'custom';

export interface Routine {
  id: string;
  family_id: string;
  child_id: string | null;
  title: string;
  description: string | null;
  category: RoutineCategory;
  time_of_day: string | null;
  days_of_week: number[];
  is_active: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type EventCategory = 'health' | 'family' | 'activity' | 'chores' | 'other';

export interface Event {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  category: EventCategory;
  created_by: string | null;
  assigned_to: string[];
  recurrence: Record<string, any> | null;
  created_at: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  assigned_to: string | null;
  created_by: string | null;
  priority: TaskPriority;
  created_at: string;
}

export type ListType = 'grocery' | 'shopping' | 'custom';

export interface List {
  id: string;
  family_id: string;
  title: string;
  type: ListType;
  created_by: string | null;
  created_at: string;
}

export interface ListItem {
  id: string;
  list_id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  is_checked: boolean;
  sort_order: number;
  created_at: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlan {
  id: string;
  family_id: string;
  date: string;
  meal_type: MealType | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  family_id: string;
  user_id: string | null;
  title: string;
  remind_at: string;
  is_completed: boolean;
  created_at: string;
}

export interface Note {
  id: string;
  family_id: string;
  title: string | null;
  content: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  family_id: string | null;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface SavedPlace {
  id: string;
  user_id: string | null;
  family_id: string | null;
  place_name: string | null;
  category: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  notes: string | null;
  created_at: string;
}

// Child Hub types
export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  is_primary: boolean;
}

export interface ChildHealthInfo {
  id: string;
  child_id: string;
  medications: string[];
  dietary_restrictions: string[];
  pediatrician: string | null;
  immunization_status: string | null;
  emergency_contacts: EmergencyContact[];
  created_at: string;
  updated_at: string;
}

export interface ChildRoutineInfo {
  id: string;
  child_id: string;
  sleep_schedule: Record<string, any>;
  feeding_schedule: Record<string, any>;
  comfort_methods: string[];
  triggers: string[];
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChildDocument {
  id: string;
  child_id: string;
  family_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface ChildSecureShare {
  id: string;
  child_id: string;
  family_id: string;
  created_by: string | null;
  access_code: string;
  share_token: string;
  expires_at: string;
  max_views: number;
  current_views: number;
  is_revoked: boolean;
  watermark_note: string | null;
  created_at: string;
}

export interface ChildShareAccessLog {
  id: string;
  share_id: string;
  accessed_at: string;
  ip_info: string | null;
  user_agent: string | null;
}

// Extended types with joined data
export interface TaskWithAssignee extends Task {
  assignee?: Profile;
}

export interface EventWithAssignees extends Event {
  assignees?: Profile[];
}
