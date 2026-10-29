import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export function useTheme() {
  return Colors[useColorScheme()];
}

export function Screen({ children, padded = true }: { children: ReactNode; padded?: boolean }) {
  const c = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={padded ? { padding: 16, gap: 12, paddingBottom: 48 } : undefined}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const c = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, style]}>{children}</View>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Txt style={{ fontSize: 22, fontWeight: '700' }}>{children}</Txt>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <Txt style={{ fontSize: 16, fontWeight: '600' }}>{children}</Txt>;
}

export function Txt({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: object }) {
  const c = useTheme();
  return <Text style={[{ color: muted ? c.muted : c.text, fontSize: 15 }, style]}>{children}</Text>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}) {
  const c = useTheme();
  const bg = variant === 'primary' ? c.primary : variant === 'danger' ? c.danger : 'transparent';
  const fg = variant === 'outline' ? c.primary : c.onPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: variant === 'outline' ? c.primary : bg, opacity: pressed || disabled ? 0.6 : 1 },
      ]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontWeight: '600', fontSize: 16 }}>{title}</Text>}
    </Pressable>
  );
}

export function Input({ label, ...props }: TextInputProps & { label?: string }) {
  const c = useTheme();
  return (
    <View style={{ gap: 4 }}>
      {label ? <Txt muted>{label}</Txt> : null}
      <TextInput
        placeholderTextColor={c.muted}
        {...props}
        style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.card }, props.style]}
      />
    </View>
  );
}

/** Grupo de opciones donde se elige una (o varias con `multi`). */
export function Chips<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T | T[];
  onChange: (v: T) => void;
}) {
  const c = useTheme();
  const selected = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => (
        <Pressable
          key={String(o.value)}
          onPress={() => onChange(o.value)}
          style={[
            styles.chip,
            { borderColor: selected(o.value) ? c.primary : c.border, backgroundColor: selected(o.value) ? c.primary : c.card },
          ]}>
          <Text style={{ color: selected(o.value) ? c.onPrimary : c.text }}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const c = useTheme();
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: c.border, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color ?? c.primary }} />
    </View>
  );
}

export function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  return (
    <View style={{ gap: 4, flex: 1 }}>
      <Txt muted style={{ fontSize: 13 }}>{label}</Txt>
      <ProgressBar value={value} max={target} color={color} />
      <Txt style={{ fontSize: 13 }}>
        {Math.round(value)} / {target} g
      </Txt>
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}>{children}</View>;
}

export function Icon({ name, color, size = 24 }: { name: SymbolViewProps['name']; color?: string; size?: number }) {
  const c = useTheme();
  return <SymbolView name={name} tintColor={color ?? c.text} size={size} />;
}

export function Empty({ text }: { text: string }) {
  return (
    <Txt muted style={{ textAlign: 'center', paddingVertical: 16 }}>
      {text}
    </Txt>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  button: { borderRadius: 12, borderWidth: 1.5, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
});
