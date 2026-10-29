import type { Goal } from './types';

type Input = {
  sex: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  age: number;
  activity: number; // 1.2 sedentario … 1.9 muy activo
  goal: Goal;
};

export type Targets = { kcal: number; protein_g: number; carbs_g: number; fat_g: number };

/** Metas diarias con Mifflin-St Jeor y un reparto de macros según el objetivo. */
export function calculateTargets({ sex, weightKg, heightCm, age, activity, goal }: Input): Targets {
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);
  const tdee = bmr * activity;
  const adjust = goal === 'lose_fat' ? 0.8 : goal === 'gain_muscle' ? 1.1 : 1;
  const kcal = Math.round((tdee * adjust) / 10) * 10;

  const protein_g = Math.round(weightKg * (goal === 'maintain' ? 1.6 : 2.0));
  const fat_g = Math.round((kcal * 0.27) / 9);
  const carbs_g = Math.max(0, Math.round((kcal - protein_g * 4 - fat_g * 9) / 4));
  return { kcal, protein_g, carbs_g, fat_g };
}

export function ageFrom(birthDate: string): number {
  const b = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) age--;
  return age;
}

export function sumMacros<T extends { kcal: number; protein_g: number; carbs_g: number; fat_g: number }>(items: T[]) {
  return items.reduce(
    (acc, i) => ({
      kcal: acc.kcal + Number(i.kcal),
      protein_g: acc.protein_g + Number(i.protein_g),
      carbs_g: acc.carbs_g + Number(i.carbs_g),
      fat_g: acc.fat_g + Number(i.fat_g),
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}

export const today = () => new Date().toISOString().slice(0, 10);
