import { Link, router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Button, Card, MacroBar, ProgressBar, Row, Screen, Subtitle, Title, Txt, useTheme } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fetchMyRoutines, useFocusData, useTodayFood } from '@/lib/hooks';
import { sumMacros } from '@/lib/nutrition';
import { supabase } from '@/lib/supabase';

export default function Today() {
  const c = useTheme();
  const { profile, session } = useAuth();
  const { data: food } = useTodayFood();
  const { data } = useFocusData(async () => {
    const userId = session!.user.id;
    const [routines, last] = await Promise.all([
      fetchMyRoutines(userId),
      supabase
        .from('workout_sessions')
        .select('routine_day_id, started_at')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    return { routine: routines[0], lastDayId: last.data?.routine_day_id as string | undefined };
  }, { routine: undefined, lastDayId: undefined } as { routine?: Awaited<ReturnType<typeof fetchMyRoutines>>[number]; lastDayId?: string });

  if (!profile) return null;
  const totals = sumMacros(food);
  const target = profile.target_kcal ?? 2000;
  const remaining = Math.round(target - totals.kcal);

  // Siguiente día de la rutina: el que sigue al último entrenado
  const days = [...(data.routine?.routine_days ?? [])].sort((a, b) => a.day_index - b.day_index);
  const lastIdx = days.findIndex((d) => d.id === data.lastDayId);
  const nextDay = days.length ? days[(lastIdx + 1) % days.length] : undefined;

  return (
    <Screen>
      <Title>Hola{profile.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋</Title>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Subtitle>Calorías</Subtitle>
          <Txt muted>
            {Math.round(totals.kcal)} / {target}
          </Txt>
        </Row>
        <ProgressBar value={totals.kcal} max={target} />
        <Txt style={{ fontSize: 28, fontWeight: '800', color: remaining >= 0 ? c.primary : c.danger }}>
          {Math.abs(remaining)} kcal {remaining >= 0 ? 'restantes' : 'de más'}
        </Txt>
        <Row style={{ gap: 12 }}>
          <MacroBar label="Proteína" value={totals.protein_g} target={profile.target_protein_g ?? 0} color={c.protein} />
          <MacroBar label="Carbos" value={totals.carbs_g} target={profile.target_carbs_g ?? 0} color={c.carbs} />
          <MacroBar label="Grasa" value={totals.fat_g} target={profile.target_fat_g ?? 0} color={c.fat} />
        </Row>
        <Button title="Registrar comida" onPress={() => router.push('/log-food')} />
      </Card>

      <Card>
        <Subtitle>Entrenamiento de hoy</Subtitle>
        {nextDay ? (
          <>
            <Txt muted>{data.routine!.title}</Txt>
            <Txt style={{ fontSize: 20, fontWeight: '700' }}>{nextDay.name}</Txt>
            <Txt muted>{nextDay.routine_exercises?.length ?? 0} ejercicios</Txt>
            <Button title="Empezar" onPress={() => router.push(`/workout/${nextDay.id}`)} />
          </>
        ) : (
          <>
            <Txt muted>Todavía no tienes una rutina.</Txt>
            <Button title="Crear rutina con IA" onPress={() => router.push('/train')} />
          </>
        )}
      </Card>

      {profile.role === 'trainer' && (
        <Link href="/trainer" asChild>
          <Pressable>
            <Card>
              <Subtitle>Modo entrenador →</Subtitle>
              <Txt muted>Gestiona tus clientes, rutinas y planes.</Txt>
            </Card>
          </Pressable>
        </Link>
      )}
      <View />
    </Screen>
  );
}
