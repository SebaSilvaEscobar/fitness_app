import { useState } from 'react';
import { Alert } from 'react-native';

import { Button, Card, Chips, Input, Subtitle, Txt } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { ageFrom, calculateTargets } from '@/lib/nutrition';
import { supabase } from '@/lib/supabase';
import type { Goal, Place, Profile } from '@/lib/types';

const EQUIPMENT = [
  { label: 'Mancuernas', value: 'dumbbell' },
  { label: 'Barra', value: 'barbell' },
  { label: 'Bandas', value: 'band' },
  { label: 'Barra de dominadas', value: 'pullup_bar' },
  { label: 'Kettlebell', value: 'kettlebell' },
  { label: 'Máquinas', value: 'machine' },
  { label: 'Poleas', value: 'cable' },
];

const DIET = ['Vegetariano', 'Vegano', 'Sin lactosa', 'Sin gluten', 'Sin cerdo', 'Alergia a frutos secos'];

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

/** Formulario de perfil usado en el onboarding y al editar el perfil. */
export function ProfileForm({ initial, onSaved }: { initial: Profile; onSaved?: () => void }) {
  const { refreshProfile } = useAuth();
  const [sex, setSex] = useState<'male' | 'female'>(initial.sex ?? 'male');
  const [birth, setBirth] = useState(initial.birth_date ?? '');
  const [height, setHeight] = useState(initial.height_cm?.toString() ?? '');
  const [weight, setWeight] = useState(initial.weight_kg?.toString() ?? '');
  const [activity, setActivity] = useState(Number(initial.activity_level ?? 1.375));
  const [goal, setGoal] = useState<Goal>(initial.goal ?? 'maintain');
  const [experience, setExperience] = useState(initial.experience ?? 'beginner');
  const [place, setPlace] = useState<Place>(initial.training_place ?? 'gym');
  const [days, setDays] = useState(initial.training_days ?? 3);
  const [equipment, setEquipment] = useState<string[]>(initial.equipment ?? []);
  const [diet, setDiet] = useState<string[]>(initial.dietary_restrictions ?? []);
  const [busy, setBusy] = useState(false);

  async function save() {
    const h = Number(height.replace(',', '.'));
    const w = Number(weight.replace(',', '.'));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth) || !h || !w) {
      Alert.alert('Faltan datos', 'Completa fecha de nacimiento (AAAA-MM-DD), estatura y peso.');
      return;
    }
    const t = calculateTargets({ sex, weightKg: w, heightCm: h, age: ageFrom(birth), activity, goal });
    setBusy(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        sex,
        birth_date: birth,
        height_cm: h,
        weight_kg: w,
        activity_level: activity,
        goal,
        experience,
        training_place: place,
        training_days: days,
        equipment: place === 'gym' ? [...new Set([...equipment, 'barbell', 'machine', 'cable', 'dumbbell'])] : equipment,
        dietary_restrictions: diet,
        target_kcal: t.kcal,
        target_protein_g: t.protein_g,
        target_carbs_g: t.carbs_g,
        target_fat_g: t.fat_g,
        onboarded: true,
      })
      .eq('id', initial.id);
    setBusy(false);
    if (error) return Alert.alert('Error', error.message);
    await refreshProfile();
    onSaved?.();
  }

  return (
    <>
      <Card>
        <Subtitle>Sobre ti</Subtitle>
        <Chips
          options={[
            { label: 'Hombre', value: 'male' },
            { label: 'Mujer', value: 'female' },
          ]}
          value={sex}
          onChange={setSex}
        />
        <Input label="Fecha de nacimiento (AAAA-MM-DD)" value={birth} onChangeText={setBirth} placeholder="1995-04-21" />
        <Input label="Estatura (cm)" value={height} onChangeText={setHeight} keyboardType="decimal-pad" />
        <Input label="Peso (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
        <Txt muted>Actividad diaria (sin contar el entrenamiento)</Txt>
        <Chips
          options={[
            { label: 'Sedentaria', value: 1.2 },
            { label: 'Ligera', value: 1.375 },
            { label: 'Moderada', value: 1.55 },
            { label: 'Alta', value: 1.725 },
          ]}
          value={activity}
          onChange={setActivity}
        />
      </Card>
      <Card>
        <Subtitle>Tu objetivo</Subtitle>
        <Chips
          options={[
            { label: 'Bajar grasa', value: 'lose_fat' },
            { label: 'Ganar músculo', value: 'gain_muscle' },
            { label: 'Mantenerme', value: 'maintain' },
          ]}
          value={goal}
          onChange={setGoal}
        />
      </Card>
      <Card>
        <Subtitle>Entrenamiento</Subtitle>
        <Chips
          options={[
            { label: 'Principiante', value: 'beginner' },
            { label: 'Intermedio', value: 'intermediate' },
            { label: 'Avanzado', value: 'advanced' },
          ]}
          value={experience}
          onChange={setExperience}
        />
        <Txt muted>¿Dónde entrenas?</Txt>
        <Chips
          options={[
            { label: 'Gimnasio', value: 'gym' },
            { label: 'Casa', value: 'home' },
          ]}
          value={place}
          onChange={setPlace}
        />
        <Txt muted>Días por semana</Txt>
        <Chips options={[2, 3, 4, 5, 6].map((d) => ({ label: String(d), value: d }))} value={days} onChange={setDays} />
        {place === 'home' && (
          <>
            <Txt muted>Equipo que tienes</Txt>
            <Chips options={EQUIPMENT} value={equipment} onChange={(v) => setEquipment(toggle(equipment, v))} />
          </>
        )}
      </Card>
      <Card>
        <Subtitle>Alimentación</Subtitle>
        <Txt muted>Restricciones o preferencias</Txt>
        <Chips
          options={DIET.map((d) => ({ label: d, value: d }))}
          value={diet}
          onChange={(v) => setDiet(toggle(diet, v))}
        />
      </Card>
      <Button title="Guardar y calcular mis metas" onPress={save} loading={busy} />
    </>
  );
}
