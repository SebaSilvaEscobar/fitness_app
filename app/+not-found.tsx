import { Link, Stack } from 'expo-router';

import { Screen, Title, Txt, useTheme } from '@/components/ui';

export default function NotFoundScreen() {
  const c = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Ups' }} />
      <Screen>
        <Title>Esta pantalla no existe.</Title>
        <Link href="/">
          <Txt style={{ color: c.primary }}>Volver al inicio</Txt>
        </Link>
      </Screen>
    </>
  );
}
