import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable } from 'react-native';

import { Button, Card, Empty, Input, MacroBar, Row, Screen, Subtitle, Txt, useTheme } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fetchMyMealPlans, useFocusData, useTodayFood } from '@/lib/hooks';
import { sumMacros } from '@/lib/nutrition';
import { callFunction, supabase } from '@/lib/supabase';
import { SLOT_LABEL, type FoodLog, type Slot } from '@/lib/types';

export default function Nutrition() {
  const c = useTheme();
  const { profile, session } = useAuth();
  const { data: food, reload } = useTodayFood();
  const plans = useFocusData(() => fetchMyMealPlans(session!.user.id), []);
  const [request, setRequest] = useState('');
  const [generating, setGenerating] = useState(false);

  if (!profile) return null;
  const totals = sumMacros(food);

  async function generate() {
    setGenerating(true);
    try {
      const { meal_plan_id } = await callFunction<{ meal_plan_id: string }>('generate-meal-plan', { request });
      setRequest('');
      router.push(`/meal-plan/${meal_plan_id}`);
    } catch (e) {
      Alert.alert('No se pudo crear el plan', (e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  function remove(item: FoodLog) {
    Alert.alert('Eliminar', `¿Quitar ${item.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('food_logs').delete().eq('id', item.id);
          reload();
        },
      },
    ]);
  }

  return (
    <Screen>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Subtitle>Hoy</Subtitle>
          <Txt muted>
            {Math.round(totals.kcal)} / {profile.target_kcal} kcal
          </Txt>
        </Row>
        <Row style={{ gap: 12 }}>
          <MacroBar label="Proteína" value={totals.protein_g} target={profile.target_protein_g ?? 0} color={c.protein} />
          <MacroBar label="Carbos" value={totals.carbs_g} target={profile.target_carbs_g ?? 0} color={c.carbs} />
          <MacroBar label="Grasa" value={totals.fat_g} target={profile.target_fat_g ?? 0} color={c.fat} />
        </Row>
      </Card>

      {(Object.keys(SLOT_LABEL) as Slot[]).map((slot) => {
        const items = food.filter((f) => f.slot === slot);
        const kcal = Math.round(sumMacros(items).kcal);
        return (
          <Card key={slot}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Subtitle>{SLOT_LABEL[slot]}</Subtitle>
              <Txt muted>{kcal} kcal</Txt>
            </Row>
            {items.map((i) => (
              <Pressable key={i.id} onLongPress={() => remove(i)}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt style={{ flex: 1 }}>
                    {i.name}
                    {i.quantity_g ? ` · ${Math.round(i.quantity_g)} g` : ''}
                  </Txt>
                  <Txt muted>{Math.round(i.kcal)} kcal</Txt>
                </Row>
              </Pressable>
            ))}
            <Button variant="outline" title="+ Agregar" onPress={() => router.push({ pathname: '/log-food', params: { slot } })} />
          </Card>
        );
      })}

      <Card>
        <Subtitle>Planes nutricionales</Subtitle>
        {plans.data.length === 0 && <Empty text="Aún no tienes planes." />}
        {plans.data.map((p) => (
          <Pressable key={p.id} onPress={() => router.push(`/meal-plan/${p.id}`)}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt style={{ flex: 1 }}>{p.title}</Txt>
              <Txt muted>{p.owner_id !== profile.id ? 'De tu entrenador' : p.source === 'ai' ? 'IA' : ''}</Txt>
            </Row>
          </Pressable>
        ))}
        <Input
          label="¿Algo especial para tu plan? (opcional)"
          value={request}
          onChangeText={setRequest}
          placeholder="Ej. comidas rápidas, presupuesto bajo, me gusta el pollo"
          multiline
        />
        <Button title={generating ? 'Creando tu plan…' : 'Crear plan con IA'} onPress={generate} loading={generating} />
      </Card>
    </Screen>
  );
}
