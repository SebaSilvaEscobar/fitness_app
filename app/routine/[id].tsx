import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

import { Button, Card, Row, Screen, Subtitle, Title, Txt } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fetchRoutine, useFocusData } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';

export default function RoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { data: routine } = useFocusData(() => fetchRoutine(id), null);

  if (!routine) return null;
  const mine = routine.owner_id === session!.user.id;

  function remove() {
    Alert.alert('Eliminar rutina', '¿Seguro? Tu historial de entrenamientos se conserva.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('routines').delete().eq('id', routine!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: routine.title }} />
      <Title>{routine.title}</Title>
      {routine.description ? <Txt muted>{routine.description}</Txt> : null}
      {routine.routine_days?.map((day) => (
        <Card key={day.id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Subtitle>
              Día {day.day_index + 1}: {day.name}
            </Subtitle>
          </Row>
          {day.routine_exercises.map((ex) => (
            <Row key={ex.id} style={{ justifyContent: 'space-between' }}>
              <Txt style={{ flex: 1 }}>{ex.exercise_name}</Txt>
              <Txt muted>
                {ex.sets} × {ex.reps}
              </Txt>
            </Row>
          ))}
          <Button title="Empezar este día" onPress={() => router.push(`/workout/${day.id}`)} />
        </Card>
      ))}
      {mine && (
        <>
          <Button
            variant="outline"
            title="Editar rutina"
            onPress={() => router.push({ pathname: '/trainer/routine-editor', params: { id: routine.id } })}
          />
          <Button variant="danger" title="Eliminar rutina" onPress={remove} />
        </>
      )}
    </Screen>
  );
}
