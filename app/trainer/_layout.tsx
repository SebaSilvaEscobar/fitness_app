import { Slot, Stack, router, usePathname } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Txt, useTheme, useWide } from '@/components/ui';
import { useAuth } from '@/lib/auth';

const NAV = [
  { href: '/trainer', label: 'Clientes' },
  { href: '/trainer/routines', label: 'Rutinas' },
  { href: '/trainer/plans', label: 'Planes nutricionales' },
  { href: '/trainer/ai', label: 'Crear con IA' },
] as const;

/**
 * En el teléfono las pantallas del entrenador van en una pila normal.
 * En pantallas anchas (panel web) se muestran con un menú lateral fijo.
 */
export default function TrainerLayout() {
  const wide = useWide();
  if (!wide) {
    return (
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="index" options={{ title: 'Modo entrenador' }} />
        <Stack.Screen name="routines" options={{ title: 'Mis rutinas' }} />
        <Stack.Screen name="plans" options={{ title: 'Mis planes' }} />
        <Stack.Screen name="ai" options={{ title: 'Crear con IA' }} />
        <Stack.Screen name="client/[id]" options={{ title: 'Cliente' }} />
        <Stack.Screen name="routine-editor" options={{ title: 'Editor de rutina' }} />
        <Stack.Screen name="plan-editor" options={{ title: 'Editor de plan' }} />
      </Stack>
    );
  }
  return <DesktopShell />;
}

function DesktopShell() {
  const c = useTheme();
  const { profile } = useAuth();
  const path = usePathname();
  const active = (href: string) => (href === '/trainer' ? path === href || path.startsWith('/trainer/client') : path.startsWith(href));

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: c.background }}>
      <View style={{ width: 240, backgroundColor: c.card, borderRightWidth: 1, borderColor: c.border, padding: 20, gap: 6 }}>
        <Txt style={{ fontSize: 24, fontWeight: '800', color: c.primary }}>FitApp</Txt>
        <Txt muted style={{ marginBottom: 16 }}>Panel del entrenador</Txt>
        {NAV.map((n) => (
          <Pressable
            key={n.href}
            onPress={() => router.navigate(n.href)}
            style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: active(n.href) ? c.primary : 'transparent' }}>
            <Txt style={{ color: active(n.href) ? c.onPrimary : c.text, fontWeight: '600' }}>{n.label}</Txt>
          </Pressable>
        ))}
        <View style={{ flex: 1 }} />
        <Txt muted>Código de invitación</Txt>
        <Txt style={{ fontSize: 22, fontWeight: '800', letterSpacing: 3 }}>{profile?.trainer_invite_code}</Txt>
        <Pressable onPress={() => router.navigate('/')} style={{ paddingVertical: 10 }}>
          <Txt muted>← Volver a mi app</Txt>
        </Pressable>
      </View>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
    </View>
  );
}
