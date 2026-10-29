export type Goal = 'lose_fat' | 'gain_muscle' | 'maintain';
export type Place = 'gym' | 'home';
export type Slot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type Profile = {
  id: string;
  role: 'user' | 'trainer';
  full_name: string | null;
  sex: 'male' | 'female' | null;
  birth_date: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: number;
  goal: Goal;
  experience: 'beginner' | 'intermediate' | 'advanced';
  training_place: Place;
  training_days: number;
  equipment: string[];
  dietary_restrictions: string[];
  target_kcal: number | null;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;
  trainer_invite_code: string | null;
  onboarded: boolean;
};

export type FoodLog = {
  id: string;
  slot: Slot;
  name: string;
  quantity_g: number | null;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type PlanFood = { name: string; quantity: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number };
export type PlanMeal = { slot: Slot; name: string; recipe: string; foods: PlanFood[] };
export type MealPlan = {
  id: string;
  owner_id: string;
  title: string;
  target_kcal: number | null;
  plan: { days: { day: string; meals: PlanMeal[] }[] };
  source: 'manual' | 'ai' | 'trainer';
  is_template: boolean;
};

export type RoutineExercise = {
  id: string;
  exercise_id: string | null;
  exercise_name: string;
  position: number;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes: string | null;
};
export type RoutineDay = { id: string; day_index: number; name: string; routine_exercises: RoutineExercise[] };
export type Routine = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  weeks: number | null;
  source: 'manual' | 'ai' | 'trainer';
  is_template: boolean;
  routine_days?: RoutineDay[];
};

export const SLOT_LABEL: Record<Slot, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Snacks',
};

export const GOAL_LABEL: Record<Goal, string> = {
  lose_fat: 'Bajar grasa',
  gain_muscle: 'Ganar músculo',
  maintain: 'Mantenerme',
};
