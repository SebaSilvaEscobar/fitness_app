import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button, Card, Empty, Input, Row, Screen, Subtitle, Txt, useTheme } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useFocusData } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';

type Metric = { id: string; measured_on: string; weight_kg: number | null };
type Pr = { exercise_name: string; weight_kg: number; reps: number | null };

export default function Progress() {
  const c = useTheme();
  const { session } = useAuth();
  const userId = session!.user.id;
  const [weight, setWeight] = useState('');

  const { data, reload } = useFocusData(async () => {
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const [metrics, week, sets] = await Promise.all([
      supabase.from('body_metrics').select('id, measured_on, weight_kg').eq('user_id', userId).order('measured_on').limit(60),
      supabase.from('workout_sessions').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('started_at', weekAgo),
      supabase
        .from('workout_sets')
        .select('exercise_name, weight_kg, reps, workout_sessions!inner(user_id)')
        .eq('workout_sessions.user_id', userId)
        .not('weight_kg', 'is', null)
        .order('weight_kg', { ascending: false })
        .limit(300),
    ]);
    // Mejor peso por ejercicio
    const prs = new Map<string, Pr>();
    for (const s of sets.data ?? []) if (!prs.has(s.exercise_name)) prs.set(s.exercise_name, s as Pr);
    return { metrics: (metrics.data ?? []) as Metric[], weekCount: week.count ?? 0, prs: [...prs.values()].slice(0, 8) };
  }, { metrics: [] as Metric[], weekCount: 0, prs: [] as Pr[] });

  async function addWeight() {
    const w = Number(weight.replace(',', '.'));
    if (!w) return;
    const { error } = await supabase.from('body_metrics').insert({ user_id: userId, weight_kg: w });
    if (error) return Alert.alert('Error', error.message);
    await supabase.from('profiles').update({ weight_kg: w }).eq('id', userId);
    setWeight('');
    reload();
  }

  const weights = data.metrics.filter((m) => m.weight_kg != null);
  const min = Math.min(...weights.map((m) => Number(m.weight_kg)));
  const max = Math.max(...weights.map((m) => Number(m.weight_kg)));
  const first = weights[0]?.weight_kg;
  const last = weights.at(-1)?.weight_kg;

  return (
    <Screen>
      <Card>
        <Subtitle>Esta semana</Subtitle>
        <Txt style={{ fontSize: 28, fontWeight: '800', color: c.primary }}>{data.weekCount} entrenamientos</Txt>
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Subtitle>Peso</Subtitle>
          {first != null && last != null && (
            <Txt muted>
              {last} kg ({Number(last) - Number(first) >= 0 ? '+' : ''}
              {(Number(last) - Number(first)).toFixed(1)} kg)
            </Txt>
          )}
        </Row>
        {weights.length > 1 ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 3 }}>
            {weights.map((m) => (
              <View
                key={m.id}
                style={{
                  flex: 1,
                  backgroundColor: c.primary,
                  borderRadius: 3,
                  height: 20 + (max > min ? ((Number(m.weight_kg) - min) / (max - min)) * 80 : 40),
                }}
              />
            ))}
          </View>
        ) : (
          <Empty text="Registra tu peso para ver tu evolución." />
        )}
        <Row>
          <View style={{ flex: 1 }}>
            <Input value={weight} onChangeText={setWeight} placeholder="Peso de hoy (kg)" keyboardType="decimal-pad" />
          </View>
          <Button title="Guardar" onPress={addWeight} />
        </Row>
      </Card>

      <Card>
        <Subtitle>Récords personales</Subtitle>
        {data.prs.length === 0 && <Empty text="Entrena para empezar a romper récords." />}
        {data.prs.map((p) => (
          <Row key={p.exercise_name} style={{ justifyContent: 'space-between' }}>
            <Txt style={{ flex: 1 }}>🏆 {p.exercise_name}</Txt>
            <Txt muted>
              {p.weight_kg} kg × {p.reps ?? '?'}
            </Txt>
          </Row>
        ))}
      </Card>
    </Screen>
  );
}
