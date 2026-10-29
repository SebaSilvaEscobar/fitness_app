import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';

import { Button, Input, Screen, Title, Txt, useTheme } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const c = useTheme();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() } } });
    setBusy(false);
    if (error) Alert.alert('Ups', error.message);
    else if (mode === 'signup') Alert.alert('¡Listo!', 'Revisa tu correo si te pedimos confirmarlo.');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View style={{ height: 80 }} />
        <Txt style={{ fontSize: 40, fontWeight: '800', color: c.primary }}>Pulso</Txt>
        <Title>{mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</Title>
        <Txt muted>Tu nutrición y entrenamiento, guiados por IA.</Txt>
        {mode === 'signup' && <Input label="Nombre" value={name} onChangeText={setName} autoComplete="name" />}
        <Input
          label="Correo"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Input label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
        <Button title={mode === 'login' ? 'Entrar' : 'Registrarme'} onPress={submit} loading={busy} />
        <Button
          variant="outline"
          title={mode === 'login' ? '¿No tienes cuenta? Regístrate' : 'Ya tengo cuenta'}
          onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
