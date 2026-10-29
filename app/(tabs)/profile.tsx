import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { Button, Card, Input, Row, Screen, Subtitle, Title, Txt } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useFocusData } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import { GOAL_LABEL } from '@/lib/types';

export default function ProfileTab() {
  const { profile, refreshProfile } = useAuth();
  const [code, setCode] = useState('');
  const { data: trainers, reload } = useFocusData(async () => {
    const { data } = await supabase
      .from('trainer_clients')
      .select('trainer_id, profiles!trainer_clients_trainer_id_fkey(full_name)')
      .eq('client_id', profile!.id)
      .eq('status', 'active');
    return (data ?? []) as unknown as { trainer_id: string; profiles: { full_name: string | null } | null }[];
  }, []);

  if (!profile) return null;

  async function join() {
    const { error } = await supabase.rpc('join_trainer', { code: code.trim() });
    if (error) return Alert.alert('No se pudo', error.message);
    setCode('');
    reload();
    Alert.alert('¡Listo!', 'Ya estás conectado con tu entrenador.');
  }

  async function becomeTrainer() {
    const { error } = await supabase.rpc('become_trainer');
    if (error) return Alert.alert('Error', error.message);
    await refreshProfile();
    router.push('/trainer');
  }

  return (
    <Screen>
      <Title>{profile.full_name ?? 'Mi perfil'}</Title>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt muted>Objetivo</Txt>
          <Txt>{GOAL_LABEL[profile.goal]}</Txt>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt muted>Meta diaria</Txt>
          <Txt>
            {profile.target_kcal} kcal · P{profile.target_protein_g} C{profile.target_carbs_g} G{profile.target_fat_g}
          </Txt>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt muted>Entreno</Txt>
          <Txt>
            {profile.training_days} días · {profile.training_place === 'home' ? 'casa' : 'gimnasio'}
          </Txt>
        </Row>
        <Button variant="outline" title="Editar perfil y metas" onPress={() => router.push('/edit-profile')} />
      </Card>

      <Card>
        <Subtitle>Mi entrenador</Subtitle>
        {trainers.map((t) => (
          <Txt key={t.trainer_id}>💪 {t.profiles?.full_name ?? 'Entrenador'}</Txt>
        ))}
        <Input value={code} onChangeText={setCode} placeholder="Código de invitación" autoCapitalize="characters" />
        <Button variant="outline" title="Unirme a un entrenador" onPress={join} disabled={!code.trim()} />
      </Card>

      <Card>
        <Subtitle>¿Eres entrenador personal?</Subtitle>
        {profile.role === 'trainer' ? (
          <>
            <Txt>
              Tu código para clientes: <Txt style={{ fontWeight: '800' }}>{profile.trainer_invite_code}</Txt>
            </Txt>
            <Button title="Abrir modo entrenador" onPress={() => router.push('/trainer')} />
          </>
        ) : (
          <>
            <Txt muted>Crea rutinas y planes, y asígnalos a tus clientes.</Txt>
            <Button variant="outline" title="Activar modo entrenador" onPress={becomeTrainer} />
          </>
        )}
      </Card>

      <Button variant="danger" title="Cerrar sesión" onPress={() => supabase.auth.signOut()} />
    </Screen>
  );
}
