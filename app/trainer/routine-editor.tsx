import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, TextInput } from 'react-native';

import { Button, Card, Input, Row, Screen, Subtitle, Txt, useTheme } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fetchRoutine } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';

type ExerciseDraft = {
  exercise_id: string | null;
  exercise_name: string;
  sets: string;
  reps: string;
  rest_seconds: string;
  notes: string;
};
type DayDraft = { name: string; exercises: ExerciseDraft[] };
type LibraryItem = { id: string; name: string; primary_muscle: string };

/** Crea o edita una rutina (usado por entrenadores y por usuarios para ajustar sus rutinas). */
export default function RoutineEditor() {
  const c = useTheme();
  const { id, template } = useLocalSearchParams<{ id?: string; template?: string }>();
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isTemplate, setIsTemplate] = useState(template === '1');
  const [days, setDays] = useState<DayDraft[]>([{ name: 'Día 1', exercises: [] }]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [picker, setPicker] = useState<{ day: number; query: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('exercises')
      .select('id, name, primary_muscle')
      .order('name')
      .then(({ data }) => setLibrary((data ?? []) as LibraryItem[]));
    if (!id) return;
    fetchRoutine(id).then((r) => {
      if (!r) return;
      setTitle(r.title);
      setDescription(r.description ?? '');
      setIsTemplate(r.is_template);
      setDays(
        (r.routine_days ?? []).map((d) => ({
          name: d.name,
          exercises: d.routine_exercises.map((e) => ({
            exercise_id: e.exercise_id,
            exercise_name: e.exercise_name,
            sets: String(e.sets),
            reps: e.reps,
            rest_seconds: String(e.rest_seconds),
            notes: e.notes ?? '',
          })),
        })),
      );
    });
  }, [id]);

  const updateDay = (i: number, patch: Partial<DayDraft>) => setDays(days.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const updateEx = (di: number, ei: number, patch: Partial<ExerciseDraft>) =>
    updateDay(di, { exercises: days[di].exercises.map((e, j) => (j === ei ? { ...e, ...patch } : e)) });

  function addExercise(di: number, item: { id: string | null; name: string }) {
    updateDay(di, {
      exercises: [
        ...days[di].exercises,
        { exercise_id: item.id, exercise_name: item.name, sets: '3', reps: '8-12', rest_seconds: '90', notes: '' },
      ],
    });
    setPicker(null);
  }

  async function save() {
    if (!title.trim()) return Alert.alert('Ponle un nombre a la rutina');
    setSaving(true);
    try {
      let routineId = id;
      const fields = { title: title.trim(), description: description.trim() || null, is_template: isTemplate };
      if (routineId) {
        const { error } = await supabase.from('routines').update(fields).eq('id', routineId);
        if (error) throw error;
        // Reemplazamos los días completos: más simple que sincronizar cambios uno a uno
        await supabase.from('routine_days').delete().eq('routine_id', routineId);
      } else {
        const { data, error } = await supabase
          .from('routines')
          .insert({ ...fields, owner_id: profile!.id, source: profile!.role === 'trainer' ? 'trainer' : 'manual' })
          .select('id')
          .single();
        if (error) throw error;
        routineId = data.id;
      }
      for (const [i, d] of days.entries()) {
        const { data: day, error } = await supabase
          .from('routine_days')
          .insert({ routine_id: routineId, day_index: i, name: d.name || `Día ${i + 1}` })
          .select('id')
          .single();
        if (error) throw error;
        if (d.exercises.length === 0) continue;
        const { error: exErr } = await supabase.from('routine_exercises').insert(
          d.exercises.map((e, pos) => ({
            routine_day_id: day.id,
            exercise_id: e.exercise_id,
            exercise_name: e.exercise_name,
            position: pos,
            sets: Number(e.sets) || 3,
            reps: e.reps || '10',
            rest_seconds: Number(e.rest_seconds) || 90,
            notes: e.notes || null,
          })),
        );
        if (exErr) throw exErr;
      }
      router.back();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const small = { borderWidth: 1, borderColor: c.border, borderRadius: 8, color: c.text, padding: 6, width: 56, textAlign: 'center' as const };
  const results = picker
    ? library.filter((l) => l.name.toLowerCase().includes(picker.query.toLowerCase())).slice(0, 8)
    : [];

  return (
    <Screen>
      <Input label="Nombre" value={title} onChangeText={setTitle} placeholder="Ej. Hipertrofia 4 días" />
      <Input label="Descripción" value={description} onChangeText={setDescription} multiline />
      {profile?.role === 'trainer' && (
        <Pressable onPress={() => setIsTemplate(!isTemplate)}>
          <Txt>{isTemplate ? '☑' : '☐'} Rutina para asignar a clientes</Txt>
        </Pressable>
      )}

      {days.map((d, di) => (
        <Card key={di}>
          <Row>
            <Txt muted>Día {di + 1}</Txt>
            <TextInput
              value={d.name}
              onChangeText={(name) => updateDay(di, { name })}
              style={{ flex: 1, color: c.text, fontSize: 17, fontWeight: '600' }}
            />
            <Pressable onPress={() => setDays(days.filter((_, j) => j !== di))}>
              <Txt style={{ color: c.danger }}>Quitar</Txt>
            </Pressable>
          </Row>
          {d.exercises.map((e, ei) => (
            <Card key={ei} style={{ padding: 10 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt style={{ flex: 1, fontWeight: '600' }}>{e.exercise_name}</Txt>
                <Pressable onPress={() => updateDay(di, { exercises: d.exercises.filter((_, j) => j !== ei) })}>
                  <Txt style={{ color: c.danger }}>✕</Txt>
                </Pressable>
              </Row>
              <Row>
                <Txt muted>Series</Txt>
                <TextInput style={small} value={e.sets} onChangeText={(v) => updateEx(di, ei, { sets: v })} keyboardType="number-pad" />
                <Txt muted>Reps</Txt>
                <TextInput style={small} value={e.reps} onChangeText={(v) => updateEx(di, ei, { reps: v })} />
                <Txt muted>Desc. (s)</Txt>
                <TextInput
                  style={small}
                  value={e.rest_seconds}
                  onChangeText={(v) => updateEx(di, ei, { rest_seconds: v })}
                  keyboardType="number-pad"
                />
              </Row>
              <TextInput
                placeholder="Notas para el cliente (técnica, tempo…)"
                placeholderTextColor={c.muted}
                value={e.notes}
                onChangeText={(v) => updateEx(di, ei, { notes: v })}
                style={{ color: c.text }}
              />
            </Card>
          ))}
          {picker?.day === di ? (
            <>
              <Input autoFocus value={picker.query} onChangeText={(q) => setPicker({ day: di, query: q })} placeholder="Buscar ejercicio" />
              {results.map((r) => (
                <Pressable key={r.id} onPress={() => addExercise(di, r)}>
                  <Txt>
                    {r.name} <Txt muted>· {r.primary_muscle}</Txt>
                  </Txt>
                </Pressable>
              ))}
              {picker.query.trim() !== '' && (
                <Pressable onPress={() => addExercise(di, { id: null, name: picker.query.trim() })}>
                  <Txt style={{ color: c.primary }}>+ Usar “{picker.query.trim()}” como ejercicio nuevo</Txt>
                </Pressable>
              )}
            </>
          ) : (
            <Button variant="outline" title="+ Ejercicio" onPress={() => setPicker({ day: di, query: '' })} />
          )}
        </Card>
      ))}
      <Button
        variant="outline"
        title="+ Agregar día"
        onPress={() => setDays([...days, { name: `Día ${days.length + 1}`, exercises: [] }])}
      />
      <Subtitle> </Subtitle>
      <Button title="Guardar rutina" onPress={save} loading={saving} />
    </Screen>
  );
}
