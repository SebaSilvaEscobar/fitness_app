import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { Button, Card, Chips, Input, Row, Screen, Subtitle, Txt } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { today } from '@/lib/nutrition';
import { callFunction, supabase } from '@/lib/supabase';
import { SLOT_LABEL, type Slot } from '@/lib/types';

type Item = { name: string; quantity_g: number; kcal: number; protein_g: number; carbs_g: number; fat_g: number };

function defaultSlot(): Slot {
  const h = new Date().getHours();
  return h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 21 ? 'dinner' : 'snack';
}

export default function LogFood() {
  const { session } = useAuth();
  const params = useLocalSearchParams<{ slot?: Slot }>();
  const [slot, setSlot] = useState<Slot>(params.slot ?? defaultSlot());
  const [text, setText] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);

  async function analyze() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await callFunction<{ items: Item[] }>('parse-food', { text });
      setItems(res.items);
    } catch (e) {
      Alert.alert('No pudimos analizarlo', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    const { error } = await supabase.from('food_logs').insert(
      items.map((i) => ({ ...i, user_id: session!.user.id, slot, logged_on: today(), source: 'ai' })),
    );
    setBusy(false);
    if (error) return Alert.alert('Error', error.message);
    router.back();
  }

  return (
    <Screen>
      <Chips
        options={(Object.keys(SLOT_LABEL) as Slot[]).map((s) => ({ label: SLOT_LABEL[s], value: s }))}
        value={slot}
        onChange={setSlot}
      />
      <Input
        label="¿Qué comiste? Escríbelo como se lo dirías a un amigo"
        value={text}
        onChangeText={setText}
        placeholder="Ej. 2 huevos revueltos, una arepa con queso y un café con leche"
        multiline
        style={{ minHeight: 90, textAlignVertical: 'top' }}
      />
      <Button title="Calcular con IA" onPress={analyze} loading={busy && items.length === 0} />

      {items.length > 0 && (
        <Card>
          <Subtitle>Revisa antes de guardar</Subtitle>
          {items.map((i, idx) => (
            <Row key={idx} style={{ justifyContent: 'space-between' }}>
              <Txt style={{ flex: 1 }}>
                {i.name} · {Math.round(i.quantity_g)} g
              </Txt>
              <Txt muted>
                {Math.round(i.kcal)} kcal · P{Math.round(i.protein_g)} C{Math.round(i.carbs_g)} G{Math.round(i.fat_g)}
              </Txt>
              <Button variant="outline" title="✕" onPress={() => setItems(items.filter((_, j) => j !== idx))} />
            </Row>
          ))}
          <Button title="Guardar" onPress={save} loading={busy} />
        </Card>
      )}
    </Screen>
  );
}
