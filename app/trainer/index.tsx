import { router } from 'expo-router';
import { Pressable, Share, View } from 'react-native';

import { Button, Card, Empty, Row, Screen, Subtitle, Title, Txt, useTheme, useWide } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useFocusData } from '@/lib/hooks';
import { today } from '@/lib/nutrition';
import { supabase } from '@/lib/supabase';
import { GOAL_LABEL, type Goal } from '@/lib/types';

type ClientRow = {
  id: string;
  name: string;
  goal: Goal;
  targetKcal: number | null;
  kcalToday: number;
  lastWorkout: string | null;
  workoutsWeek: number;
};

export default function TrainerHome() {
  const c = useTheme();
  const wide = useWide();
  const { profile } = useAuth();
  const userId = profile!.id;

  const { data: clients, loading } = useFocusData(async (): Promise<ClientRow[]> => {
    const { data: links } = await supabase
      .from('trainer_clients')
      .select('client_id, profiles!trainer_clients_client_id_fkey(full_name, goal, target_kcal)')
      .eq('trainer_id', userId)
      .eq('status', 'active');
    const rows = (links ?? []) as unknown as {
      client_id: string;
      profiles: { full_name: string | null; goal: Goal; target_kcal: number | null } | null;
    }[];
    const ids = rows.map((r) => r.client_id);
    if (ids.length === 0) return [];

    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const [sessions, food] = await Promise.all([
      supabase.from('workout_sessions').select('user_id, started_at').in('user_id', ids).order('started_at', { ascending: false }).limit(1000),
      supabase.from('food_logs').select('user_id, kcal').in('user_id', ids).eq('logged_on', today()),
    ]);
    return rows.map((r) => {
      const s = (sessions.data ?? []).filter((x) => x.user_id === r.client_id);
      return {
        id: r.client_id,
        name: r.profiles?.full_name ?? 'Cliente',
        goal: r.profiles?.goal ?? 'maintain',
        targetKcal: r.profiles?.target_kcal ?? null,
        kcalToday: (food.data ?? []).filter((f) => f.user_id === r.client_id).reduce((a, f) => a + Number(f.kcal), 0),
        lastWorkout: s[0]?.started_at ?? null,
        workoutsWeek: s.filter((x) => x.started_at >= weekAgo).length,
      };
    });
  }, []);

  const share = () =>
    Share.share({ message: `Entrena conmigo en Pulso. Descarga la app y usa mi código: ${profile?.trainer_invite_code}` });

  return (
    <Screen>
      {wide && <Title>Clientes</Title>}
      {!wide && (
        <Card>
          <Subtitle>Tu código de invitación</Subtitle>
          <Txt style={{ fontSize: 32, fontWeight: '800', letterSpacing: 4, color: c.primary }}>{profile?.trainer_invite_code}</Txt>
          <Button variant="outline" title="Compartir con un cliente" onPress={share} />
        </Card>
      )}

      <Card>
        {!wide && <Subtitle>Clientes ({clients.length})</Subtitle>}
        {wide && (
          <Row style={{ borderBottomWidth: 1, borderColor: c.border, paddingBottom: 8 }}>
            <Txt muted style={{ flex: 2 }}>Cliente</Txt>
            <Txt muted style={{ flex: 1 }}>Objetivo</Txt>
            <Txt muted style={{ flex: 1 }}>Calorías hoy</Txt>
            <Txt muted style={{ flex: 1 }}>Entrenos (7 días)</Txt>
            <Txt muted style={{ flex: 1 }}>Último entreno</Txt>
          </Row>
        )}
        {!loading && clients.length === 0 && <Empty text="Aún no tienes clientes. Comparte tu código de invitación." />}
        {clients.map((cl) => (
          <Pressable key={cl.id} onPress={() => router.push(`/trainer/client/${cl.id}`)}>
            {wide ? (
              <Row style={{ paddingVertical: 8 }}>
                <Txt style={{ flex: 2, fontWeight: '600' }}>{cl.name}</Txt>
                <Txt style={{ flex: 1 }}>{GOAL_LABEL[cl.goal]}</Txt>
                <Txt style={{ flex: 1 }}>
                  {Math.round(cl.kcalToday)} / {cl.targetKcal ?? '?'}
                </Txt>
                <Txt style={{ flex: 1, color: cl.workoutsWeek === 0 ? c.danger : c.text }}>{cl.workoutsWeek}</Txt>
                <Txt style={{ flex: 1 }} muted>
                  {cl.lastWorkout ? new Date(cl.lastWorkout).toLocaleDateString() : '—'}
                </Txt>
              </Row>
            ) : (
              <View style={{ paddingVertical: 6 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt style={{ fontWeight: '600' }}>{cl.name}</Txt>
                  <Txt muted>→</Txt>
                </Row>
                <Txt muted style={{ fontSize: 13 }}>
                  {GOAL_LABEL[cl.goal]} · {cl.workoutsWeek} entrenos esta semana · {Math.round(cl.kcalToday)} kcal hoy
                </Txt>
              </View>
            )}
          </Pressable>
        ))}
      </Card>

      {!wide && (
        <>
          <Button variant="outline" title="Mis rutinas" onPress={() => router.push('/trainer/routines')} />
          <Button variant="outline" title="Mis planes nutricionales" onPress={() => router.push('/trainer/plans')} />
          <Button title="Crear con IA" onPress={() => router.push('/trainer/ai')} />
        </>
      )}
      {wide && <Button variant="outline" title="Compartir mi código" onPress={share} />}
    </Screen>
  );
}
