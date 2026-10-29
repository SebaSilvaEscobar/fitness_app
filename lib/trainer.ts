import { supabase } from './supabase';
import type { MealPlan, Routine } from './types';

export async function fetchTemplates(trainerId: string) {
  const [routines, plans] = await Promise.all([
    supabase
      .from('routines')
      .select('*, routine_days(id)')
      .eq('owner_id', trainerId)
      .eq('is_template', true)
      .order('created_at', { ascending: false }),
    supabase.from('meal_plans').select('*').eq('owner_id', trainerId).eq('is_template', true).order('created_at', { ascending: false }),
  ]);
  return { routines: (routines.data ?? []) as Routine[], plans: (plans.data ?? []) as MealPlan[] };
}
