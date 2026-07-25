import { EventCategory, MealType } from './types';

export const CATEGORY_COLORS: Record<EventCategory, { bg: string; text: string; border: string }> = {
  health: {
    bg: 'bg-rose-100',
    text: 'text-rose-700',
    border: 'border-rose-300',
  },
  family: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
  },
  activity: {
    bg: 'bg-sky-100',
    text: 'text-sky-700',
    border: 'border-sky-300',
  },
  chores: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-300',
  },
  other: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
  },
};

export const MEAL_COLORS: Record<MealType, { bg: string; text: string }> = {
  breakfast: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
  },
  lunch: {
    bg: 'bg-green-100',
    text: 'text-green-700',
  },
  dinner: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
  },
  snack: {
    bg: 'bg-pink-100',
    text: 'text-pink-700',
  },
};

export const MEMBER_COLORS: Record<string, string> = {
  John: '#3B82F6', // blue-500
  Patricia: '#10B981', // emerald-500
  Julia: '#F97316', // orange-500
};

export const DEMO_CREDENTIALS = {
  email: 'john@famify-demo.com',
  password: 'Demo123!',
};

// localStorage key carrying an invite code through registration
export const PENDING_INVITE_KEY = 'famify-pending-invite';

export const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
};
