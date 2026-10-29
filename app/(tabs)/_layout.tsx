import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

function icon(name: SymbolViewProps['name']) {
  return ({ color }: { color: ColorValue }) => <SymbolView name={name} tintColor={color} size={26} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const c = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.tint,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border },
        headerStyle: { backgroundColor: c.background },
        headerTintColor: c.text,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Hoy', tabBarIcon: icon({ ios: 'sun.max', android: 'today', web: 'today' }) }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{ title: 'Nutrición', tabBarIcon: icon({ ios: 'fork.knife', android: 'restaurant', web: 'restaurant' }) }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: 'Entrenar',
          tabBarIcon: icon({ ios: 'dumbbell', android: 'fitness_center', web: 'fitness_center' }),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progreso',
          tabBarIcon: icon({ ios: 'chart.line.uptrend.xyaxis', android: 'monitoring', web: 'monitoring' }),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Perfil', tabBarIcon: icon({ ios: 'person.crop.circle', android: 'person', web: 'person' }) }}
      />
    </Tabs>
  );
}
