import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// La anon key es pública por diseño (va dentro de la app); la seguridad la ponen las políticas RLS.
// Se puede reemplazar con un archivo .env para apuntar a otro proyecto.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fpkcgfuqqvdwxebayrwz.supabase.co';
const anonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwa2NnZnVxcXZkd3hlYmF5cnd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyODQxOTIsImV4cCI6MjEwODg2MDE5Mn0.AKkEy86V3Mm6jkcr5Bfapc2_OarSW4FGE4dp8SSfDls';

export const supabase = createClient(url, anonKey, {
  auth: {
    // En el render del servidor (web) no hay AsyncStorage
    storage: Platform.OS === 'web' && typeof window === 'undefined' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** Llama una función de IA del servidor y devuelve su JSON, o lanza un error legible. */
export async function callFunction<T>(name: string, body: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    const detail = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(detail?.error ?? 'No se pudo completar la solicitud.');
  }
  return data as T;
}
