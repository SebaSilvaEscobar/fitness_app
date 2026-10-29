import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable } from 'react-native';

import { Button, Card, Empty, Input, Row, Screen, Subtitle, Txt } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fetchMyRoutines, useFocusData } from '@/lib/hooks';
import { callFunction, supabase } from '@/lib/supabase';

type HistoryItem = { id: string; started_at: string; finished_at: string | null; routine_days: { name: string } | null };

export default function Train() {
  const { session, profile } = useAuth();
  const userId = session!.user.id;
  const routines = useFocusData(() => fetchMyRoutines(userId), []);
  const history = useFocusData(async () => {
    const { data } = await supabase
      .from('workout_sessions')
      .select('id, started_at, finished_at, routine_days(name)')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(10);
    return (data ?? []) as unknown as HistoryItem[];
  }, []);
  const [request, setRequest] = useState('');
  const [generating, setGenerating] = useState(false);

  async function generate() {
    setGenerating(true);
    try {
      const { routine_id } = await callFunction<{ routine_id: string }>('generate-workout', { request });
      setRequest('');
      router.push(`/routine/${routine_id}`);
    } catch (e) {
      Alert.alert('No se pudo crear la rutina', (e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Screen>
      <Card>
        <Subtitle>Mis rutinas</Subtitle>
        {routines.data.length === 0 && <Empty text="Aún no tienes rutinas." />}
        {routines.data.map((r) => (
          <Pressable key={r.id} onPress={() => router.push(`/routine/${r.id}`)}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt style={{ flex: 1, fontWeight: '600' }}>{r.title}</Txt>
              <Txt muted>
                {r.routine_days?.length ?? 0} días{r.owner_id !== userId ? ' · Entrenador' : r.source === 'ai' ? ' · IA' : ''}
              </Txt>
            </Row>
          </Pressable>
        ))}
      </Card>

      <Card>
        <Subtitle>Crear rutina con IA</Subtitle>
        <Txt muted>
          Usaremos tu perfil: {profile?.training_place === 'home' ? 'casa' : 'gimnasio'}, {profile?.training_days} días por
          semana.
        </Txt>
        <Input
          value={request}
          onChangeText={setRequest}
          placeholder="Ej. enfocada en glúteos, sesiones de 45 min, tengo dolor de rodilla"
          multiline
        />
        <Button title={generating ? 'Diseñando tu rutina…' : 'Generar rutina'} onPress={generate} loading={generating} />
      </Card>

      <Card>
        <Subtitle>Historial</Subtitle>
        {history.data.length === 0 && <Empty text="Tus entrenamientos aparecerán aquí." />}
        {history.data.map((h) => (
          <Row key={h.id} style={{ justifyContent: 'space-between' }}>
            <Txt>{h.routine_days?.name ?? 'Entrenamiento libre'}</Txt>
            <Txt muted>{new Date(h.started_at).toLocaleDateString()}</Txt>
          </Row>
        ))}
      </Card>
    </Screen>
  );
}
