import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';

import { Button, Card, Chips, Row, Screen, Subtitle, Title, Txt } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useFocusData } from '@/lib/hooks';
import { sumMacros, today } from '@/lib/nutrition';
import { supabase } from '@/lib/supabase';
import { SLOT_LABEL, type MealPlan, type PlanMeal } from '@/lib/types';

export default function MealPlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [dayIdx, setDayIdx] = useState(0);
  const { data: plan } = useFocusData(async () => {
    const { data } = await supabase.from('meal_plans').select('*').eq('id', id).single();
    return data as MealPlan | null;
  }, null);

  if (!plan) return null;
  const day = plan.plan.days[dayIdx];
  const dayTotals = sumMacros(day?.meals.map((m) => sumMacros(m.foods)) ?? []);

  async function logMeal(meal: PlanMeal) {
    const { error } = await supabase.from('food_logs').insert(
      meal.foods.map((f) => ({
        user_id: session!.user.id,
        logged_on: today(),
        slot: meal.slot,
        name: `${f.name} (${f.quantity})`,
        kcal: f.kcal,
        protein_g: f.protein_g,
        carbs_g: f.carbs_g,
        fat_g: f.fat_g,
        source: 'plan',
      })),
    );
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Registrado', `${meal.name} se agregó a hoy.`);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: plan.title }} />
      <Title>{plan.title}</Title>
      {plan.owner_id === session!.user.id && (
        <Button
          variant="outline"
          title="Editar plan"
          onPress={() => router.push({ pathname: '/trainer/plan-editor', params: { id: plan.id } })}
        />
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Chips options={plan.plan.days.map((d, i) => ({ label: d.day, value: i }))} value={dayIdx} onChange={setDayIdx} />
      </ScrollView>
      <Txt muted>
        {Math.round(dayTotals.kcal)} kcal · P {Math.round(dayTotals.protein_g)} g · C {Math.round(dayTotals.carbs_g)} g · G{' '}
        {Math.round(dayTotals.fat_g)} g
      </Txt>
      {day?.meals.map((meal, i) => {
        const t = sumMacros(meal.foods);
        return (
          <Card key={i}>
            <Txt muted>{SLOT_LABEL[meal.slot]}</Txt>
            <Row style={{ justifyContent: 'space-between' }}>
              <Subtitle>{meal.name}</Subtitle>
              <Txt muted>{Math.round(t.kcal)} kcal</Txt>
            </Row>
            {meal.foods.map((f, j) => (
              <Txt key={j}>
                • {f.name} — {f.quantity}
              </Txt>
            ))}
            {meal.recipe ? <Txt muted>{meal.recipe}</Txt> : null}
            <Button variant="outline" title="Lo comí, registrar" onPress={() => logMeal(meal)} />
          </Card>
        );
      })}
    </Screen>
  );
}
