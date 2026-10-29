import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';

import { Button, Card, Row, Screen, Subtitle, Txt, useTheme } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { RoutineDay } from '@/lib/types';

type SetEntry = { weight: string; reps: string; done: boolean };
type ExerciseState = {
  name: string;
  exerciseId: string | null;
  target: string;
  rest: number;
  notes: string | null;
  sets: SetEntry[];
  previous: { weight_kg: number | null; reps: number | null }[];
  bestWeight: number;
};

function useRestTimer() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return { left, start: setLeft, stop: () => setLeft(0) };
}

export default function Workout() {
  const c = useTheme();
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const { session } = useAuth();
  const userId = session!.user.id;
  const [day, setDay] = useState<RoutineDay | null>(null);
  const [exercises, setExercises] = useState<ExerciseState[]>([]);
  const [saving, setSaving] = useState(false);
  const startedAt = useRef(new Date());
  const timer = useRestTimer();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('routine_days').select('*, routine_exercises(*)').eq('id', dayId).single();
      const d = data as RoutineDay;
      d.routine_exercises.sort((a, b) => a.position - b.position);
      setDay(d);

      // Última vez que hizo cada ejercicio, para mostrar referencia y detectar récords
      const names = d.routine_exercises.map((e) => e.exercise_name);
      const { data: past } = await supabase
        .from('workout_sets')
        .select('session_id, exercise_name, set_number, reps, weight_kg, workout_sessions!inner(user_id, started_at)')
        .in('exercise_name', names)
        .eq('workout_sessions.user_id', userId)
        .order('started_at', { referencedTable: 'workout_sessions', ascending: false })
        .limit(500);

      setExercises(
        d.routine_exercises.map((e) => {
          const history = (past ?? []).filter((p) => p.exercise_name === e.exercise_name);
          const lastSession = history[0]?.session_id;
          const previous = history.filter((h) => h.session_id === lastSession).sort((a, b) => a.set_number - b.set_number);
          return {
            name: e.exercise_name,
            exerciseId: e.exercise_id ?? null,
            target: e.reps,
            rest: e.rest_seconds,
            notes: e.notes,
            previous,
            bestWeight: Math.max(0, ...history.map((h) => Number(h.weight_kg ?? 0))),
            sets: Array.from({ length: e.sets }, (_, i) => ({
              weight: previous[i]?.weight_kg?.toString() ?? '',
              reps: '',
              done: false,
            })),
          };
        }),
      );
    })();
  }, [dayId, userId]);

  function update(ei: number, si: number, patch: Partial<SetEntry>) {
    setExercises((prev) =>
      prev.map((ex, i) => (i !== ei ? ex : { ...ex, sets: ex.sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) })),
    );
  }

  function toggleDone(ei: number, si: number) {
    const ex = exercises[ei];
    const set = ex.sets[si];
    if (!set.done) {
      if (!set.reps) update(ei, si, { reps: ex.target.match(/\d+/)?.[0] ?? '' });
      timer.start(ex.rest);
      const w = Number(set.weight.replace(',', '.'));
      if (ex.bestWeight > 0 && w > ex.bestWeight) Alert.alert('🏆 ¡Nuevo récord!', `${ex.name}: ${w} kg`);
    }
    update(ei, si, { done: !set.done });
  }

  function addSet(ei: number) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i !== ei ? ex : { ...ex, sets: [...ex.sets, { weight: ex.sets.at(-1)?.weight ?? '', reps: '', done: false }] },
      ),
    );
  }

  async function finish() {
    const done = exercises.flatMap((ex) =>
      ex.sets
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.done)
        .map(({ s, i }) => ({
          exercise_name: ex.name,
          exercise_id: ex.exerciseId,
          set_number: i + 1,
          reps: Number(s.reps) || null,
          weight_kg: Number(s.weight.replace(',', '.')) || null,
        })),
    );
    if (done.length === 0) {
      Alert.alert('Sin series', 'Marca al menos una serie como hecha.');
      return;
    }
    setSaving(true);
    const { data: sessionRow, error } = await supabase
      .from('workout_sessions')
      .insert({ user_id: userId, routine_day_id: dayId, started_at: startedAt.current.toISOString(), finished_at: new Date().toISOString() })
      .select('id')
      .single();
    if (!error) {
      const { error: setsErr } = await supabase.from('workout_sets').insert(done.map((d) => ({ ...d, session_id: sessionRow.id })));
      if (setsErr) Alert.alert('Error', setsErr.message);
    } else {
      Alert.alert('Error', error.message);
    }
    setSaving(false);
    if (!error) {
      const volume = done.reduce((acc, d) => acc + (d.weight_kg ?? 0) * (d.reps ?? 0), 0);
      Alert.alert('¡Buen trabajo! 💪', `${done.length} series · ${Math.round(volume)} kg de volumen total`);
      router.back();
    }
  }

  function quit() {
    Alert.alert('Salir', '¿Descartar este entrenamiento?', [
      { text: 'Seguir entrenando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  if (!day) return null;

  const inputStyle = {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 8,
    color: c.text,
    paddingVertical: 6,
    width: 64,
    textAlign: 'center' as const,
    fontSize: 16,
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen
        options={{
          title: day.name,
          headerLeft: () => (
            <Pressable onPress={quit}>
              <Txt style={{ color: c.danger }}>Salir</Txt>
            </Pressable>
          ),
        }}
      />
      <Screen>
        {exercises.map((ex, ei) => (
          <Card key={ei}>
            <Subtitle>{ex.name}</Subtitle>
            <Txt muted>
              Objetivo: {ex.sets.length} × {ex.target} · descanso {ex.rest}s
            </Txt>
            {ex.notes ? <Txt muted>{ex.notes}</Txt> : null}
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt muted style={{ width: 36 }}>Serie</Txt>
              <Txt muted style={{ flex: 1 }}>Anterior</Txt>
              <Txt muted style={{ width: 64, textAlign: 'center' }}>kg</Txt>
              <Txt muted style={{ width: 64, textAlign: 'center' }}>Reps</Txt>
              <View style={{ width: 36 }} />
            </Row>
            {ex.sets.map((s, si) => (
              <Row key={si} style={{ justifyContent: 'space-between', opacity: s.done ? 0.6 : 1 }}>
                <Txt style={{ width: 36, fontWeight: '700' }}>{si + 1}</Txt>
                <Txt muted style={{ flex: 1 }}>
                  {ex.previous[si] ? `${ex.previous[si].weight_kg ?? 0} × ${ex.previous[si].reps ?? 0}` : '—'}
                </Txt>
                <TextInput
                  style={inputStyle}
                  keyboardType="decimal-pad"
                  value={s.weight}
                  onChangeText={(v) => update(ei, si, { weight: v })}
                  placeholder="0"
                  placeholderTextColor={c.muted}
                />
                <TextInput
                  style={inputStyle}
                  keyboardType="number-pad"
                  value={s.reps}
                  onChangeText={(v) => update(ei, si, { reps: v })}
                  placeholder={ex.target}
                  placeholderTextColor={c.muted}
                />
                <Pressable
                  onPress={() => toggleDone(ei, si)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: s.done ? c.primary : c.border,
                  }}>
                  <Txt style={{ color: s.done ? c.onPrimary : c.muted, fontWeight: '700' }}>✓</Txt>
                </Pressable>
              </Row>
            ))}
            <Button variant="outline" title="+ Serie" onPress={() => addSet(ei)} />
          </Card>
        ))}
        <Button title="Terminar entrenamiento" onPress={finish} loading={saving} />
      </Screen>
      {timer.left > 0 && (
        <Pressable
          onPress={timer.stop}
          style={{
            position: 'absolute',
            bottom: 24,
            alignSelf: 'center',
            backgroundColor: c.primary,
            borderRadius: 999,
            paddingVertical: 12,
            paddingHorizontal: 24,
          }}>
          <Txt style={{ color: c.onPrimary, fontWeight: '700', fontSize: 18 }}>
            Descanso {Math.floor(timer.left / 60)}:{String(timer.left % 60).padStart(2, '0')} · Saltar
          </Txt>
        </Pressable>
      )}
    </View>
  );
}
