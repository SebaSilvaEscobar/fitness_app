import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Share } from 'react-native';

import { Button, Card, Chips, Empty, Input, Row, Screen, Subtitle, Txt, useTheme } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useFocusData } from '@/lib/hooks';
import { callFunction, supabase } from '@/lib/supabase';
import type { Goal, MealPlan, Place, Routine } from '@/lib/types';

type Client = { client_id: string; profiles: { full_name: string | null; goal: Goal } | null };

export default function TrainerHome() {
  const c = useTheme();
  const { profile } = useAuth();
  const userId = profile!.id;
  const { data } = useFocusData(async () => {
    const [clients, routines, plans] = await Promise.all([
      supabase
        .from('trainer_clients')
        .select('client_id, profiles!trainer_clients_client_id_fkey(full_name, goal)')
        .eq('trainer_id', userId)
        .eq('status', 'active'),
      supabase.from('routines').select('*').eq('owner_id', userId).eq('is_template', true).order('created_at', { ascending: false }),
      supabase.from('meal_plans').select('*').eq('owner_id', userId).eq('is_template', true).order('created_at', { ascending: false }),
    ]);
    return {
      clients: (clients.data ?? []) as unknown as Client[],
      routines: (routines.data ?? []) as Routine[],
      plans: (plans.data ?? []) as MealPlan[],
    };
  }, { clients: [] as Client[], routines: [] as Routine[], plans: [] as MealPlan[] });

  // Datos del "cliente tipo" para los borradores con IA
  const [goal, setGoal] = useState<Goal>('gain_muscle');
  const [place, setPlace] = useState<Place>('gym');
  const [days, setDays] = useState(4);
  const [kcal, setKcal] = useState('2200');
  const [request, setRequest] = useState('');
  const [busy, setBusy] = useState<'routine' | 'plan' | null>(null);

  async function draftRoutine() {
    setBusy('routine');
    try {
      const { routine_id } = await callFunction<{ routine_id: string }>('generate-workout', {
        as_template: true,
        request,
        overrides: { goal, training_place: place, training_days: days, experience: 'intermediate' },
      });
      router.push({ pathname: '/trainer/routine-editor', params: { id: routine_id } });
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function draftPlan() {
    const k = Number(kcal);
    if (!k) return Alert.alert('Indica las calorías del plan');
    // Reparto estándar: 30% proteína, 40% carbos, 30% grasa
    const overrides = {
      goal,
      target_kcal: k,
      target_protein_g: Math.round((k * 0.3) / 4),
      target_carbs_g: Math.round((k * 0.4) / 4),
      target_fat_g: Math.round((k * 0.3) / 9),
    };
    setBusy('plan');
    try {
      const { meal_plan_id } = await callFunction<{ meal_plan_id: string }>('generate-meal-plan', {
        as_template: true,
        request,
        overrides,
      });
      router.push(`/meal-plan/${meal_plan_id}`);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen>
      <Card>
        <Subtitle>Tu código de invitación</Subtitle>
        <Txt style={{ fontSize: 32, fontWeight: '800', letterSpacing: 4, color: c.primary }}>
          {profile?.trainer_invite_code}
        </Txt>
        <Button
          variant="outline"
          title="Compartir con un cliente"
          onPress={() =>
            Share.share({ message: `Entrena conmigo en FitApp. Usa mi código: ${profile?.trainer_invite_code}` })
          }
        />
      </Card>

      <Card>
        <Subtitle>Clientes ({data.clients.length})</Subtitle>
        {data.clients.length === 0 && <Empty text="Comparte tu código para sumar clientes." />}
        {data.clients.map((cl) => (
          <Pressable key={cl.client_id} onPress={() => router.push(`/trainer/client/${cl.client_id}`)}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt style={{ flex: 1, fontWeight: '600' }}>{cl.profiles?.full_name ?? 'Cliente'}</Txt>
              <Txt muted>→</Txt>
            </Row>
          </Pressable>
        ))}
      </Card>

      <Card>
        <Subtitle>Mis rutinas</Subtitle>
        {data.routines.map((r) => (
          <Pressable key={r.id} onPress={() => router.push(`/routine/${r.id}`)}>
            <Txt>• {r.title}</Txt>
          </Pressable>
        ))}
        <Button
          variant="outline"
          title="+ Crear rutina a mano"
          onPress={() => router.push({ pathname: '/trainer/routine-editor', params: { template: '1' } })}
        />
      </Card>

      <Card>
        <Subtitle>Mis planes nutricionales</Subtitle>
        {data.plans.map((p) => (
          <Pressable key={p.id} onPress={() => router.push(`/meal-plan/${p.id}`)}>
            <Txt>• {p.title}</Txt>
          </Pressable>
        ))}
        {data.plans.length === 0 && <Empty text="Crea un borrador con IA abajo." />}
      </Card>

      <Card>
        <Subtitle>Borrador con IA</Subtitle>
        <Txt muted>Describe al cliente tipo. Luego puedes editar la rutina antes de asignarla.</Txt>
        <Chips
          options={[
            { label: 'Bajar grasa', value: 'lose_fat' },
            { label: 'Ganar músculo', value: 'gain_muscle' },
            { label: 'Mantener', value: 'maintain' },
          ]}
          value={goal}
          onChange={setGoal}
        />
        <Chips
          options={[
            { label: 'Gimnasio', value: 'gym' },
            { label: 'Casa', value: 'home' },
          ]}
          value={place}
          onChange={setPlace}
        />
        <Chips options={[2, 3, 4, 5, 6].map((d) => ({ label: `${d} días`, value: d }))} value={days} onChange={setDays} />
        <Input label="Calorías del plan nutricional" value={kcal} onChangeText={setKcal} keyboardType="number-pad" />
        <Input value={request} onChangeText={setRequest} placeholder="Indicaciones extra (opcional)" multiline />
        <Button title="Generar rutina" onPress={draftRoutine} loading={busy === 'routine'} disabled={!!busy} />
        <Button variant="outline" title="Generar plan nutricional" onPress={draftPlan} loading={busy === 'plan'} disabled={!!busy} />
      </Card>
    </Screen>
  );
}
