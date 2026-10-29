import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { Button, Card, Chips, Column, Columns, Input, Screen, Subtitle, Title, Txt, useWide } from '@/components/ui';
import { callFunction } from '@/lib/supabase';
import type { Goal, Place } from '@/lib/types';

/** Borradores con IA para un "cliente tipo"; el entrenador los revisa y edita antes de asignarlos. */
export default function TrainerAi() {
  const wide = useWide();
  const [goal, setGoal] = useState<Goal>('gain_muscle');
  const [place, setPlace] = useState<Place>('gym');
  const [days, setDays] = useState(4);
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [kcal, setKcal] = useState('2200');
  const [routineRequest, setRoutineRequest] = useState('');
  const [planRequest, setPlanRequest] = useState('');
  const [busy, setBusy] = useState<'routine' | 'plan' | null>(null);

  async function draftRoutine() {
    setBusy('routine');
    try {
      const { routine_id } = await callFunction<{ routine_id: string }>('generate-workout', {
        as_template: true,
        request: routineRequest,
        overrides: { goal, training_place: place, training_days: days, experience: level },
      });
      router.push({ pathname: '/trainer/routine-editor', params: { id: routine_id } });
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function draftPlan() {
    const k = Number(kcal);
    if (!k) return Alert.alert('Indica las calorías del plan');
    // Reparto estándar: 30% proteína, 40% carbohidratos, 30% grasa
    const overrides = {
      goal,
      target_kcal: k,
      target_protein_g: Math.round((k * 0.3) / 4),
      target_carbs_g: Math.round((k * 0.4) / 4),
      target_fat_g: Math.round((k * 0.3) / 9),
    };
    setBusy('plan');
    try {
      const { meal_plan_id } = await callFunction<{ meal_plan_id: string }>('generate-meal-plan', {
        as_template: true,
        request: planRequest,
        overrides,
      });
      router.push({ pathname: '/trainer/plan-editor', params: { id: meal_plan_id } });
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen>
      {wide && <Title>Crear con IA</Title>}
      <Txt muted>La IA arma un borrador para tu cliente tipo. Después lo revisas y editas antes de asignarlo.</Txt>
      <Card>
        <Subtitle>Cliente tipo</Subtitle>
        <Chips
          options={[
            { label: 'Bajar grasa', value: 'lose_fat' },
            { label: 'Ganar músculo', value: 'gain_muscle' },
            { label: 'Mantener', value: 'maintain' },
          ]}
          value={goal}
          onChange={setGoal}
        />
      </Card>
      <Columns>
        <Column>
          <Card>
            <Subtitle>Rutina</Subtitle>
            <Chips
              options={[
                { label: 'Gimnasio', value: 'gym' },
                { label: 'Casa', value: 'home' },
              ]}
              value={place}
              onChange={setPlace}
            />
            <Chips
              options={[
                { label: 'Principiante', value: 'beginner' },
                { label: 'Intermedio', value: 'intermediate' },
                { label: 'Avanzado', value: 'advanced' },
              ]}
              value={level}
              onChange={setLevel}
            />
            <Chips options={[2, 3, 4, 5, 6].map((d) => ({ label: `${d} días`, value: d }))} value={days} onChange={setDays} />
            <Input value={routineRequest} onChangeText={setRoutineRequest} placeholder="Indicaciones (opcional)" multiline />
            <Button title="Generar rutina" onPress={draftRoutine} loading={busy === 'routine'} disabled={!!busy} />
          </Card>
        </Column>
        <Column>
          <Card>
            <Subtitle>Plan nutricional</Subtitle>
            <Input label="Calorías diarias" value={kcal} onChangeText={setKcal} keyboardType="number-pad" />
            <Input value={planRequest} onChangeText={setPlanRequest} placeholder="Indicaciones (opcional)" multiline />
            <Button title="Generar plan" onPress={draftPlan} loading={busy === 'plan'} disabled={!!busy} />
          </Card>
        </Column>
      </Columns>
    </Screen>
  );
}
