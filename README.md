# Pulso

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

## Probar la app en tu teléfono

La base de datos y las funciones ya están publicadas en el proyecto de Supabase `fitness_app`, y la app ya apunta a él.

1. Instala [Node.js](https://nodejs.org) (versión LTS) en tu computador y la app **Expo Go** en tu teléfono.
2. Descarga este repositorio (botón verde **Code → Download ZIP** en GitHub) y descomprímelo.
3. En una terminal, dentro de la carpeta:
   ```bash
   npm install
   npx expo start
   ```
4. Escanea el código QR con la cámara (iPhone) o con Expo Go (Android). El teléfono y el computador deben estar en la misma red wifi.
5. Para el panel web del entrenador, presiona `w` en esa misma terminal.

## Modo sin costo y modo IA

Si no hay clave de Anthropic configurada, las funciones usan un **modo sin costo**: rutinas armadas con reglas (división por días, series y repeticiones según el objetivo), planes con comidas chilenas escaladas a tus calorías, y registro de comidas que reconoce una lista de alimentos comunes. Para activar la IA basta con agregar la clave como secreto en Supabase (Edge Functions → Secrets → `ANTHROPIC_API_KEY`); no hay que cambiar código.

## Desplegar en otro proyecto de Supabase

```bash
npx supabase link --project-ref TU-PROYECTO
npx supabase db push
npx supabase db execute -f supabase/seed.sql   # o pégalo en el SQL editor
npx supabase functions deploy generate-workout generate-meal-plan parse-food
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...   # opcional
```
Luego crea un `.env` a partir de `.env.example` con la URL y la anon key de ese proyecto.

Modelo de IA: por defecto `claude-opus-5-5`. Puedes cambiarlo con el secreto `CLAUDE_MODEL` (por ejemplo `claude-sonnet-5-5` o `claude-haiku-5-5` para bajar costos).

## Próximos pasos sugeridos

Escaneo de código de barras (Open Food Facts), foto de comida analizada por IA, videos de ejercicios, pagos y suscripciones a entrenadores, chat entrenador–cliente, Apple Health / Google Fit.
