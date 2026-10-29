import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { Button, Card, Empty, Row, Screen, Title, Txt, useWide } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useFocusData } from '@/lib/hooks';
import { fetchTemplates } from '@/lib/trainer';

export default function TrainerRoutines() {
  const wide = useWide();
  const { profile } = useAuth();
  const { data, loading } = useFocusData(() => fetchTemplates(profile!.id), { routines: [], plans: [] });

  return (
    <Screen>
      {wide && <Title>Rutinas</Title>}
      <Txt muted>Rutinas que puedes asignar a tus clientes. Si las editas, el cambio les llega a todos los que la tienen.</Txt>
      <Button
        title="+ Nueva rutina"
        onPress={() => router.push({ pathname: '/trainer/routine-editor', params: { template: '1' } })}
      />
      <Card>
        {!loading && data.routines.length === 0 && <Empty text="Todavía no tienes rutinas." />}
        {data.routines.map((r) => (
          <Row key={r.id} style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
            <Pressable style={{ flex: 1 }} onPress={() => router.push(`/routine/${r.id}`)}>
              <Txt style={{ fontWeight: '600' }}>{r.title}</Txt>
              <Txt muted style={{ fontSize: 13 }}>
                {r.routine_days?.length ?? 0} días{r.source === 'ai' ? ' · borrador IA' : ''}
              </Txt>
            </Pressable>
            <Button
              variant="outline"
              title="Editar"
              onPress={() => router.push({ pathname: '/trainer/routine-editor', params: { id: r.id } })}
            />
          </Row>
        ))}
      </Card>
    </Screen>
  );
}
