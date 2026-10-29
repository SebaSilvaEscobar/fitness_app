# FitApp

App móvil (iOS y Android) con panel web para entrenadores de nutrición y entrenamiento con IA, con modo para entrenadores personales.

## Qué incluye este MVP

- **Cuenta y perfil:** registro con correo, onboarding con objetivo, datos físicos, lugar de entrenamiento, equipo y preferencias de comida. Calcula calorías y macros (Mifflin-St Jeor).
- **Nutrición:** registro diario por comida escribiendo en lenguaje natural ("2 huevos y una arepa"), la IA lo convierte en alimentos con macros. Planes semanales generados por IA con recetas, y botón para registrar una comida del plan.
- **Entrenamiento:** rutinas generadas por IA para gym o casa usando una biblioteca de ejercicios, registro de series (peso y reps) con la referencia de la última sesión, temporizador de descanso, aviso de récord personal e historial.
- **Progreso:** peso corporal con gráfica, entrenamientos de la semana y récords.
- **Entrenador personal (en el teléfono o en el panel web desde el computador):** activa el modo entrenador, comparte un código de invitación, crea rutinas y planes nutricionales a mano o con borrador de IA, ve el avance de cada cliente y le asigna rutinas y planes.

## Stack

- Expo (React Native) + Expo Router + TypeScript
- Supabase: Postgres con seguridad por filas (RLS), autenticación y Edge Functions
- Claude (API de Anthropic) en las Edge Functions; la clave nunca llega al teléfono

```
app/                    pantallas (Expo Router)
components/             componentes de interfaz
lib/                    cliente de Supabase, auth, cálculos de nutrición, tipos
supabase/migrations/    esquema de la base de datos y políticas de seguridad
supabase/seed.sql       biblioteca base de ejercicios
supabase/functions/     funciones de IA: generate-workout, generate-meal-plan, parse-food
```

## Puesta en marcha

1. Crea un proyecto en [supabase.com](https://supabase.com) y una clave en [console.anthropic.com](https://console.anthropic.com).
2. Instala la CLI de Supabase y vincula el proyecto:
   ```bash
   npx supabase login
   npx supabase link --project-ref TU-PROYECTO
   npx supabase db push                      # crea las tablas
   npx supabase db execute -f supabase/seed.sql   # o pégalo en el SQL editor
   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   npx supabase functions deploy generate-workout generate-meal-plan parse-food
   ```
3. Copia `.env.example` a `.env` y pon la URL y la anon key de tu proyecto.
4. Corre la app:
   ```bash
   npm install
   npx expo start      # escanea el QR con Expo Go en tu teléfono
   npx expo start --web   # panel web (en pantallas anchas el modo entrenador muestra menú lateral)
   ```

   Para publicar el panel web: `npx expo export --platform web` genera la carpeta `dist/`, que puedes subir a Vercel, Netlify o similar.

Modelo de IA: por defecto `claude-opus-5-5`. Puedes cambiarlo con el secreto `CLAUDE_MODEL` (por ejemplo `claude-sonnet-5-5` o `claude-haiku-5-5` para bajar costos).

## Próximos pasos sugeridos

Escaneo de código de barras (Open Food Facts), foto de comida analizada por IA, videos de ejercicios, pagos y suscripciones a entrenadores, chat entrenador–cliente, Apple Health / Google Fit.
