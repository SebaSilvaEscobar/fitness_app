import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from './auth';
import { today } from './nutrition';
import { supabase } from './supabase';
import type { FoodLog, MealPlan, Routine } from './types';

/** Ejecuta `load` cada vez que la pantalla gana foco. */
export function useFocusData<T>(load: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await load());
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  return { data, loading, reload };
}

export function useTodayFood(date = today()) {
  const { session } = useAuth();
  return useFocusData(async () => {
    const { data } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', session!.user.id)
      .eq('logged_on', date)
      .order('created_at');
    return (data ?? []) as FoodLog[];
  }, [] as FoodLog[]);
}

/** Rutinas propias (no plantillas) + las asignadas por un entrenador. */
export async function fetchMyRoutines(userId: string): Promise<Routine[]> {
  const { data } = await supabase
    .from('routines')
    .select('*, routine_days(id, day_index, name, routine_exercises(id))')
    .or(`and(owner_id.eq.${userId},is_template.eq.false),owner_id.neq.${userId}`)
    .order('created_at', { ascending: false });
  return (data ?? []) as Routine[];
}

export async function fetchMyMealPlans(userId: string): Promise<MealPlan[]> {
  const { data } = await supabase
    .from('meal_plans')
    .select('*')
    .or(`and(owner_id.eq.${userId},is_template.eq.false),owner_id.neq.${userId}`)
    .order('created_at', { ascending: false });
  return (data ?? []) as MealPlan[];
}

export async function fetchRoutine(id: string) {
  const { data } = await supabase
    .from('routines')
    .select('*, routine_days(*, routine_exercises(*))')
    .eq('id', id)
    .single();
  const r = data as Routine | null;
  r?.routine_days?.sort((a, b) => a.day_index - b.day_index);
  r?.routine_days?.forEach((d) => d.routine_exercises.sort((a, b) => a.position - b.position));
  return r;
}
