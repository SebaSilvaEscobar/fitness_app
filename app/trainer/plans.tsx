import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { Button, Card, Empty, Row, Screen, Title, Txt, useWide } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useFocusData } from '@/lib/hooks';
import { fetchTemplates } from '@/lib/trainer';

export default function TrainerPlans() {
  const wide = useWide();
  const { profile } = useAuth();
  const { data, loading } = useFocusData(() => fetchTemplates(profile!.id), { routines: [], plans: [] });

  return (
    <Screen>
      {wide && <Title>Planes nutricionales</Title>}
      <Txt muted>Planes que puedes asignar a tus clientes.</Txt>
      <Button title="+ Nuevo plan" onPress={() => router.push('/trainer/plan-editor')} />
      <Card>
        {!loading && data.plans.length === 0 && <Empty text="Todavía no tienes planes." />}
        {data.plans.map((p) => (
          <Row key={p.id} style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
            <Pressable style={{ flex: 1 }} onPress={() => router.push(`/meal-plan/${p.id}`)}>
              <Txt style={{ fontWeight: '600' }}>{p.title}</Txt>
              <Txt muted style={{ fontSize: 13 }}>
                {p.plan.days.length} días · {p.target_kcal ?? '?'} kcal{p.source === 'ai' ? ' · borrador IA' : ''}
              </Txt>
            </Pressable>
            <Button
              variant="outline"
              title="Editar"
              onPress={() => router.push({ pathname: '/trainer/plan-editor', params: { id: p.id } })}
            />
          </Row>
        ))}
      </Card>
    </Screen>
  );
}
