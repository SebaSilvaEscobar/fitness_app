import { Stack, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

import { Button, Card, Empty, Row, Screen, Subtitle, Title, Txt } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useFocusData } from '@/lib/hooks';
import { sumMacros, today } from '@/lib/nutrition';
import { supabase } from '@/lib/supabase';
import { GOAL_LABEL, type FoodLog, type MealPlan, type Profile, type Routine } from '@/lib/types';

type Assignment = { id: string; routine_id: string | null; meal_plan_id: string | null };
type SessionRow = { id: string; started_at: string; routine_days: { name: string } | null };

export default function ClientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile: me } = useAuth();
  const trainerId = me!.id;

  const { data, reload } = useFocusData(async () => {
    const [client, sessions, food, assignments, routines, plans] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase
        .from('workout_sessions')
        .select('id, started_at, routine_days(name)')
        .eq('user_id', id)
        .order('started_at', { ascending: false })
        .limit(7),
      supabase.from('food_logs').select('*').eq('user_id', id).eq('logged_on', today()),
      supabase.from('assignments').select('id, routine_id, meal_plan_id').eq('client_id', id).eq('trainer_id', trainerId).eq('active', true),
      supabase.from('routines').select('id, title').eq('owner_id', trainerId).eq('is_template', true),
      supabase.from('meal_plans').select('id, title').eq('owner_id', trainerId).eq('is_template', true),
    ]);
    return {
      client: client.data as Profile | null,
      sessions: (sessions.data ?? []) as unknown as SessionRow[],
      food: (food.data ?? []) as FoodLog[],
      assignments: (assignments.data ?? []) as Assignment[],
      routines: (routines.data ?? []) as Pick<Routine, 'id' | 'title'>[],
      plans: (plans.data ?? []) as Pick<MealPlan, 'id' | 'title'>[],
    };
  }, null as null | {
    client: Profile | null;
    sessions: SessionRow[];
    food: FoodLog[];
    assignments: Assignment[];
    routines: Pick<Routine, 'id' | 'title'>[];
    plans: Pick<MealPlan, 'id' | 'title'>[];
  });

  if (!data?.client) return null;
  const { client } = data;
  const totals = sumMacros(data.food);
  const assignedRoutine = new Map(data.assignments.filter((a) => a.routine_id).map((a) => [a.routine_id, a.id]));
  const assignedPlan = new Map(data.assignments.filter((a) => a.meal_plan_id).map((a) => [a.meal_plan_id, a.id]));

  async function assign(field: 'routine_id' | 'meal_plan_id', value: string) {
    const { error } = await supabase.from('assignments').insert({ trainer_id: trainerId, client_id: id, [field]: value });
    if (error) Alert.alert('Error', error.message);
    reload();
  }

  async function unassign(assignmentId: string) {
    await supabase.from('assignments').update({ active: false }).eq('id', assignmentId);
    reload();
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: client.full_name ?? 'Cliente' }} />
      <Title>{client.full_name ?? 'Cliente'}</Title>
      <Txt muted>
        {GOAL_LABEL[client.goal]} · {client.weight_kg ?? '?'} kg · {client.training_days} días/semana ·{' '}
        {client.training_place === 'home' ? 'casa' : 'gimnasio'}
      </Txt>

      <Card>
        <Subtitle>Nutrición de hoy</Subtitle>
        <Txt>
          {Math.round(totals.kcal)} / {client.target_kcal ?? '?'} kcal · P {Math.round(totals.protein_g)} /{' '}
          {client.target_protein_g ?? '?'} g
        </Txt>
      </Card>

      <Card>
        <Subtitle>Últimos entrenamientos</Subtitle>
        {data.sessions.length === 0 && <Empty text="Sin entrenamientos registrados." />}
        {data.sessions.map((s) => (
          <Row key={s.id} style={{ justifyContent: 'space-between' }}>
            <Txt>{s.routine_days?.name ?? 'Entrenamiento'}</Txt>
            <Txt muted>{new Date(s.started_at).toLocaleDateString()}</Txt>
          </Row>
        ))}
      </Card>

      <Card>
        <Subtitle>Rutinas</Subtitle>
        {data.routines.length === 0 && <Empty text="Crea una rutina en el modo entrenador." />}
        {data.routines.map((r) => {
          const a = assignedRoutine.get(r.id);
          return (
            <Row key={r.id} style={{ justifyContent: 'space-between' }}>
              <Txt style={{ flex: 1 }}>{r.title}</Txt>
              <Button
                variant={a ? 'outline' : 'primary'}
                title={a ? 'Quitar' : 'Asignar'}
                onPress={() => (a ? unassign(a) : assign('routine_id', r.id))}
              />
            </Row>
          );
        })}
      </Card>

      <Card>
        <Subtitle>Planes nutricionales</Subtitle>
        {data.plans.length === 0 && <Empty text="Crea un plan en el modo entrenador." />}
        {data.plans.map((p) => {
          const a = assignedPlan.get(p.id);
          return (
            <Row key={p.id} style={{ justifyContent: 'space-between' }}>
              <Txt style={{ flex: 1 }}>{p.title}</Txt>
              <Button
                variant={a ? 'outline' : 'primary'}
                title={a ? 'Quitar' : 'Asignar'}
                onPress={() => (a ? unassign(a) : assign('meal_plan_id', p.id))}
              />
            </Row>
          );
        })}
      </Card>
    </Screen>
  );
}
