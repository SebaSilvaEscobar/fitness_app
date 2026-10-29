import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';

import { Button, Card, Chips, Input, Row, Screen, Subtitle, Txt, useTheme } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { sumMacros } from '@/lib/nutrition';
import { supabase } from '@/lib/supabase';
import { SLOT_LABEL, type MealPlan, type PlanFood, type PlanMeal, type Slot } from '@/lib/types';

type DayDraft = { day: string; meals: PlanMeal[] };

const emptyFood = (): PlanFood => ({ name: '', quantity: '', kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
const emptyMeal = (slot: Slot): PlanMeal => ({ slot, name: SLOT_LABEL[slot], recipe: '', foods: [emptyFood()] });
const emptyDay = (n: number): DayDraft => ({
  day: `Día ${n}`,
  meals: (['breakfast', 'lunch', 'dinner'] as Slot[]).map(emptyMeal),
});

/** Crea o edita un plan nutricional (a mano o ajustando un borrador de la IA). */
export default function PlanEditor() {
  const c = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [days, setDays] = useState<DayDraft[]>([emptyDay(1)]);
  const [dayIdx, setDayIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('meal_plans')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        const p = data as MealPlan | null;
        if (!p) return;
        setTitle(p.title);
        setDays(p.plan.days);
      });
  }, [id]);

  const day = days[dayIdx];
  const setDay = (patch: Partial<DayDraft>) => setDays(days.map((d, i) => (i === dayIdx ? { ...d, ...patch } : d)));
  const setMeal = (mi: number, patch: Partial<PlanMeal>) => setDay({ meals: day.meals.map((m, i) => (i === mi ? { ...m, ...patch } : m)) });
  const setFood = (mi: number, fi: number, patch: Partial<PlanFood>) =>
    setMeal(mi, { foods: day.meals[mi].foods.map((f, i) => (i === fi ? { ...f, ...patch } : f)) });

  async function save() {
    if (!title.trim()) return Alert.alert('Ponle un nombre al plan');
    // Quitar alimentos vacíos
    const clean = days.map((d) => ({
      ...d,
      meals: d.meals.map((m) => ({ ...m, foods: m.foods.filter((f) => f.name.trim()) })).filter((m) => m.foods.length),
    }));
    const avg = clean.length ? sumMacros(clean.map((d) => sumMacros(d.meals.map((m) => sumMacros(m.foods))))) : null;
    const n = clean.length || 1;
    const fields = {
      title: title.trim(),
      plan: { days: clean },
      target_kcal: avg ? Math.round(avg.kcal / n) : null,
      target_protein_g: avg ? Math.round(avg.protein_g / n) : null,
      target_carbs_g: avg ? Math.round(avg.carbs_g / n) : null,
      target_fat_g: avg ? Math.round(avg.fat_g / n) : null,
    };
    setSaving(true);
    const { error } = id
      ? await supabase.from('meal_plans').update(fields).eq('id', id)
      : await supabase.from('meal_plans').insert({
          ...fields,
          owner_id: profile!.id,
          source: profile!.role === 'trainer' ? 'trainer' : 'manual',
          is_template: profile!.role === 'trainer',
        });
    setSaving(false);
    if (error) return Alert.alert('Error', error.message);
    router.back();
  }

  const num = (v: string) => Number(v.replace(',', '.')) || 0;
  const cell = { borderWidth: 1, borderColor: c.border, borderRadius: 8, color: c.text, padding: 6, fontSize: 14 };
  const dayTotals = sumMacros(day?.meals.map((m) => sumMacros(m.foods)) ?? []);

  return (
    <Screen>
      <Input label="Nombre del plan" value={title} onChangeText={setTitle} placeholder="Ej. Definición 1800 kcal" />
      <Row style={{ flexWrap: 'wrap' }}>
        <Chips options={days.map((d, i) => ({ label: d.day, value: i }))} value={dayIdx} onChange={setDayIdx} />
        <Button
          variant="outline"
          title="+ Día"
          onPress={() => {
            setDays([...days, emptyDay(days.length + 1)]);
            setDayIdx(days.length);
          }}
        />
        {days.length > 1 && (
          <Button
            variant="outline"
            title="Duplicar día"
            onPress={() => {
              setDays([...days, { ...structuredClone(day), day: `Día ${days.length + 1}` }]);
              setDayIdx(days.length);
            }}
          />
        )}
      </Row>
      {day && (
        <>
          <Row>
            <View style={{ flex: 1 }}>
              <Input value={day.day} onChangeText={(v) => setDay({ day: v })} />
            </View>
            {days.length > 1 && (
              <Pressable
                onPress={() => {
                  setDays(days.filter((_, i) => i !== dayIdx));
                  setDayIdx(0);
                }}>
                <Txt style={{ color: c.danger }}>Quitar día</Txt>
              </Pressable>
            )}
          </Row>
          <Txt muted>
            Total del día: {Math.round(dayTotals.kcal)} kcal · P {Math.round(dayTotals.protein_g)} g · C{' '}
            {Math.round(dayTotals.carbs_g)} g · G {Math.round(dayTotals.fat_g)} g
          </Txt>
          {day.meals.map((meal, mi) => (
            <Card key={mi}>
              <Row>
                <TextInput
                  value={meal.name}
                  onChangeText={(v) => setMeal(mi, { name: v })}
                  style={{ flex: 1, color: c.text, fontSize: 17, fontWeight: '600' }}
                />
                <Pressable onPress={() => setDay({ meals: day.meals.filter((_, i) => i !== mi) })}>
                  <Txt style={{ color: c.danger }}>Quitar</Txt>
                </Pressable>
              </Row>
              <Chips
                options={(Object.keys(SLOT_LABEL) as Slot[]).map((s) => ({ label: SLOT_LABEL[s], value: s }))}
                value={meal.slot}
                onChange={(s) => setMeal(mi, { slot: s })}
              />
              <Row>
                <Txt muted style={{ flex: 3, fontSize: 13 }}>Alimento</Txt>
                <Txt muted style={{ flex: 2, fontSize: 13 }}>Cantidad</Txt>
                <Txt muted style={{ flex: 1, fontSize: 13 }}>kcal</Txt>
                <Txt muted style={{ flex: 1, fontSize: 13 }}>P</Txt>
                <Txt muted style={{ flex: 1, fontSize: 13 }}>C</Txt>
                <Txt muted style={{ flex: 1, fontSize: 13 }}>G</Txt>
                <View style={{ width: 16 }} />
              </Row>
              {meal.foods.map((f, fi) => (
                <Row key={fi}>
                  <TextInput style={[cell, { flex: 3 }]} value={f.name} onChangeText={(v) => setFood(mi, fi, { name: v })} placeholder="Pan marraqueta" placeholderTextColor={c.muted} />
                  <TextInput style={[cell, { flex: 2 }]} value={f.quantity} onChangeText={(v) => setFood(mi, fi, { quantity: v })} placeholder="1 unidad" placeholderTextColor={c.muted} />
                  {(['kcal', 'protein_g', 'carbs_g', 'fat_g'] as const).map((k) => (
                    <TextInput
                      key={k}
                      style={[cell, { flex: 1, minWidth: 0 }]}
                      keyboardType="decimal-pad"
                      value={f[k] ? String(f[k]) : ''}
                      onChangeText={(v) => setFood(mi, fi, { [k]: num(v) })}
                    />
                  ))}
                  <Pressable style={{ width: 16 }} onPress={() => setMeal(mi, { foods: meal.foods.filter((_, i) => i !== fi) })}>
                    <Txt style={{ color: c.danger }}>✕</Txt>
                  </Pressable>
                </Row>
              ))}
              <Pressable onPress={() => setMeal(mi, { foods: [...meal.foods, emptyFood()] })}>
                <Txt style={{ color: c.primary }}>+ Alimento</Txt>
              </Pressable>
              <Input value={meal.recipe} onChangeText={(v) => setMeal(mi, { recipe: v })} placeholder="Preparación o indicaciones (opcional)" multiline />
            </Card>
          ))}
          <Button variant="outline" title="+ Comida" onPress={() => setDay({ meals: [...day.meals, emptyMeal('snack')] })} />
        </>
      )}
      <Subtitle> </Subtitle>
      <Button title="Guardar plan" onPress={save} loading={saving} />
    </Screen>
  );
}
