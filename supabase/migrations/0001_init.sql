-- Esquema inicial de la app fitness.
-- Roles: 'user' (cliente) y 'trainer' (entrenador personal).

create type user_role as enum ('user', 'trainer');
create type goal_type as enum ('lose_fat', 'gain_muscle', 'maintain');
create type training_place as enum ('gym', 'home');
create type meal_slot as enum ('breakfast', 'lunch', 'dinner', 'snack');

-- Perfil de cada usuario (1:1 con auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null default 'user',
  full_name text,
  sex text check (sex in ('male', 'female')),
  birth_date date,
  height_cm numeric,
  weight_kg numeric,
  activity_level numeric default 1.375,        -- factor de actividad (1.2 a 1.9)
  goal goal_type default 'maintain',
  experience text check (experience in ('beginner', 'intermediate', 'advanced')) default 'beginner',
  training_place training_place default 'gym',
  training_days int default 3 check (training_days between 1 and 7),
  equipment text[] default '{}',
  dietary_restrictions text[] default '{}',
  -- Metas diarias calculadas
  target_kcal int,
  target_protein_g int,
  target_carbs_g int,
  target_fat_g int,
  trainer_invite_code text unique,              -- solo entrenadores
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- Relación entrenador ↔ cliente
create table trainer_clients (
  trainer_id uuid not null references profiles on delete cascade,
  client_id uuid not null references profiles on delete cascade,
  status text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz not null default now(),
  primary key (trainer_id, client_id)
);

create or replace function is_trainer_of(client uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from trainer_clients
    where trainer_id = auth.uid() and client_id = client and status = 'active'
  );
$$;

-- Biblioteca de ejercicios (globales con owner_id null, o personalizados de un entrenador)
create table exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles on delete cascade,
  name text not null,
  primary_muscle text not null,
  secondary_muscles text[] default '{}',
  equipment text not null default 'bodyweight',
  place training_place[] not null default '{gym,home}',
  instructions text,
  video_url text
);

-- Rutinas (programas). Pueden ser de un usuario, generadas por IA o publicadas por un entrenador.
create table routines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles on delete cascade,
  title text not null,
  description text,
  goal goal_type,
  place training_place,
  weeks int default 4,
  source text not null default 'manual' check (source in ('manual', 'ai', 'trainer')),
  is_template boolean not null default false,   -- plantilla de entrenador para asignar
  created_at timestamptz not null default now()
);

create table routine_days (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references routines on delete cascade,
  day_index int not null,
  name text not null                             -- ej. "Empuje", "Pierna"
);

create table routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_day_id uuid not null references routine_days on delete cascade,
  exercise_id uuid references exercises,
  exercise_name text not null,                   -- copia por si no está en la biblioteca
  position int not null,
  sets int not null default 3,
  reps text not null default '8-12',
  rest_seconds int not null default 90,
  notes text
);

-- Registro de entrenamientos
create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  routine_day_id uuid references routine_days on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  notes text
);

create table workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions on delete cascade,
  exercise_name text not null,
  exercise_id uuid references exercises,
  set_number int not null,
  reps int,
  weight_kg numeric,
  rpe numeric,
  completed boolean not null default true
);

-- Planes nutricionales (el contenido del plan vive en JSON: días → comidas → alimentos)
create table meal_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles on delete cascade,
  title text not null,
  target_kcal int,
  target_protein_g int,
  target_carbs_g int,
  target_fat_g int,
  plan jsonb not null,
  source text not null default 'manual' check (source in ('manual', 'ai', 'trainer')),
  is_template boolean not null default false,
  created_at timestamptz not null default now()
);

-- Registro de comidas
create table food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  logged_on date not null default current_date,
  slot meal_slot not null,
  name text not null,
  quantity_g numeric,
  kcal numeric not null,
  protein_g numeric not null default 0,
  carbs_g numeric not null default 0,
  fat_g numeric not null default 0,
  source text not null default 'manual' check (source in ('manual', 'ai', 'barcode', 'plan')),
  created_at timestamptz not null default now()
);

-- Asignación de rutinas/planes del entrenador a clientes
create table assignments (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references profiles on delete cascade,
  client_id uuid not null references profiles on delete cascade,
  routine_id uuid references routines on delete cascade,
  meal_plan_id uuid references meal_plans on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (routine_id is not null or meal_plan_id is not null)
);

-- Progreso corporal
create table body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  measured_on date not null default current_date,
  weight_kg numeric,
  body_fat_pct numeric,
  waist_cm numeric,
  photo_path text
);

-- ---------- Seguridad (RLS) ----------
alter table profiles enable row level security;
alter table trainer_clients enable row level security;
alter table exercises enable row level security;
alter table routines enable row level security;
alter table routine_days enable row level security;
alter table routine_exercises enable row level security;
alter table workout_sessions enable row level security;
alter table workout_sets enable row level security;
alter table meal_plans enable row level security;
alter table food_logs enable row level security;
alter table assignments enable row level security;
alter table body_metrics enable row level security;

create policy "perfil propio o de mi cliente" on profiles for select
  using (id = auth.uid() or is_trainer_of(id)
         or exists (select 1 from trainer_clients tc where tc.client_id = auth.uid() and tc.trainer_id = profiles.id));
create policy "editar mi perfil" on profiles for update using (id = auth.uid());
create policy "crear mi perfil" on profiles for insert with check (id = auth.uid());

create policy "ver mis vínculos" on trainer_clients for select
  using (trainer_id = auth.uid() or client_id = auth.uid());
create policy "terminar vínculo" on trainer_clients for update
  using (trainer_id = auth.uid() or client_id = auth.uid());

create policy "ver ejercicios" on exercises for select using (owner_id is null or owner_id = auth.uid());
create policy "gestionar mis ejercicios" on exercises for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Una rutina se ve si es mía o si mi entrenador me la asignó
create or replace function can_view_routine(r uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from routines where id = r and owner_id = auth.uid())
      or exists (select 1 from assignments where routine_id = r and client_id = auth.uid() and active);
$$;
create or replace function owns_routine(r uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from routines where id = r and owner_id = auth.uid());
$$;

create policy "ver rutinas" on routines for select using (can_view_routine(id));
create policy "gestionar mis rutinas" on routines for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "ver días" on routine_days for select using (can_view_routine(routine_id));
create policy "gestionar días" on routine_days for all using (owns_routine(routine_id)) with check (owns_routine(routine_id));
create policy "ver ejercicios de rutina" on routine_exercises for select
  using (can_view_routine((select routine_id from routine_days d where d.id = routine_day_id)));
create policy "gestionar ejercicios de rutina" on routine_exercises for all
  using (owns_routine((select routine_id from routine_days d where d.id = routine_day_id)))
  with check (owns_routine((select routine_id from routine_days d where d.id = routine_day_id)));

create policy "mis sesiones" on workout_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sesiones de mis clientes" on workout_sessions for select using (is_trainer_of(user_id));
create policy "mis series" on workout_sets for all
  using (exists (select 1 from workout_sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from workout_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "series de mis clientes" on workout_sets for select
  using (exists (select 1 from workout_sessions s where s.id = session_id and is_trainer_of(s.user_id)));

create policy "ver planes" on meal_plans for select
  using (owner_id = auth.uid()
         or exists (select 1 from assignments a where a.meal_plan_id = meal_plans.id and a.client_id = auth.uid() and a.active));
create policy "gestionar mis planes" on meal_plans for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "mis comidas" on food_logs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "comidas de mis clientes" on food_logs for select using (is_trainer_of(user_id));

create policy "ver asignaciones" on assignments for select using (trainer_id = auth.uid() or client_id = auth.uid());
create policy "entrenador asigna" on assignments for all
  using (trainer_id = auth.uid()) with check (trainer_id = auth.uid() and is_trainer_of(client_id));

create policy "mis medidas" on body_metrics for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "medidas de mis clientes" on body_metrics for select using (is_trainer_of(user_id));

-- Crear el perfil automáticamente al registrarse
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Un cliente se une a un entrenador con su código de invitación
create or replace function join_trainer(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  select id into t from profiles where trainer_invite_code = upper(code) and role = 'trainer';
  if t is null then raise exception 'Código de entrenador no válido'; end if;
  if t = auth.uid() then raise exception 'No puedes unirte a ti mismo'; end if;
  insert into trainer_clients (trainer_id, client_id) values (t, auth.uid())
    on conflict (trainer_id, client_id) do update set status = 'active';
  return t;
end;
$$;

-- Activar el modo entrenador y generar código
create or replace function become_trainer() returns text
language plpgsql security definer set search_path = public as $$
declare code text := upper(substr(md5(random()::text), 1, 6));
begin
  update profiles set role = 'trainer', trainer_invite_code = coalesce(trainer_invite_code, code)
    where id = auth.uid() returning trainer_invite_code into code;
  return code;
end;
$$;

-- Evitar que un usuario se cambie el rol directamente: solo puede editar columnas normales.
-- become_trainer() corre como dueño de la tabla, así que sí puede cambiarlas.
revoke update on profiles from authenticated;
grant update (full_name, sex, birth_date, height_cm, weight_kg, activity_level, goal, experience,
  training_place, training_days, equipment, dietary_restrictions, target_kcal, target_protein_g,
  target_carbs_g, target_fat_g, onboarded) on profiles to authenticated;
