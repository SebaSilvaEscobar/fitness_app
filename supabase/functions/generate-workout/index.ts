// Genera una rutina de entrenamiento personalizada y la guarda en la base de datos.
import { generateJson, hasAi, HttpError, json, pick, SAFETY_NOTE, serve, userClient } from "../_shared/claude.ts";
import { workoutFallback } from "../_shared/fallback.ts";

type AiRoutine = {
  title: string;
  description: string;
  weeks: number;
  days: {
    name: string;
    exercises: { name: string; sets: number; reps: string; rest_seconds: number; notes: string }[];
  }[];
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "weeks", "days"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    weeks: { type: "integer" },
    days: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "exercises"],
        properties: {
          name: { type: "string" },
          exercises: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "sets", "reps", "rest_seconds", "notes"],
              properties: {
                name: { type: "string", description: "Nombre exacto de la biblioteca si existe" },
                sets: { type: "integer" },
                reps: { type: "string", description: "Ej. '8-12', '15', '30 s'" },
                rest_seconds: { type: "integer" },
                notes: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
};

serve(async (req) => {
  const { supabase, userId } = await userClient(req);
  const body = await req.json().catch(() => ({}));
  const extra: string = (body.request ?? "").toString().slice(0, 1000);
  // Un entrenador puede generar un borrador para usarlo como plantilla.
  const asTemplate = body.as_template === true;

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error || !profile) throw new HttpError(404, "Perfil no encontrado");
  // El entrenador puede indicar los datos del cliente tipo en vez de usar su propio perfil.
  const p = { ...profile, ...pick(body.overrides, ["goal", "experience", "training_place", "training_days", "equipment", "sex", "weight_kg"]) };

  const { data: library } = await supabase
    .from("exercises")
    .select("id, name, primary_muscle, equipment, place")
    .contains("place", [p.training_place]);

  const routine = !hasAi ? workoutFallback(p, library ?? []) : await generateJson<AiRoutine>({
    system:
      "Eres un entrenador personal certificado. Diseñas rutinas seguras, progresivas y realistas, " +
      "en español de Chile. Prefiere ejercicios de la biblioteca dada, usando su nombre exacto. " +
      SAFETY_NOTE,
    prompt: `Crea una rutina para esta persona.
Objetivo: ${p.goal}
Nivel: ${p.experience}
Lugar: ${p.training_place === "home" ? "casa" : "gimnasio"}
Días por semana: ${p.training_days} (crea exactamente ${p.training_days} días)
Equipo disponible: ${(p.equipment ?? []).join(", ") || "ninguno / peso corporal"}
Sexo: ${p.sex ?? "no indicado"}, peso: ${p.weight_kg ?? "?"} kg
Pedido adicional: ${extra || "ninguno"}

Biblioteca de ejercicios disponible:
${(library ?? []).map((e) => `- ${e.name} (${e.primary_muscle}, ${e.equipment})`).join("\n")}`,
    schema,
  });

  const byName = new Map((library ?? []).map((e) => [e.name.toLowerCase(), e.id]));

  const { data: r, error: rErr } = await supabase
    .from("routines")
    .insert({
      owner_id: userId,
      title: routine.title,
      description: routine.description,
      goal: p.goal,
      place: p.training_place,
      weeks: routine.weeks,
      source: "ai",
      is_template: asTemplate,
    })
    .select()
    .single();
  if (rErr) throw rErr;

  for (const [i, day] of routine.days.entries()) {
    const { data: d, error: dErr } = await supabase
      .from("routine_days")
      .insert({ routine_id: r.id, day_index: i, name: day.name })
      .select()
      .single();
    if (dErr) throw dErr;
    const { error: eErr } = await supabase.from("routine_exercises").insert(
      day.exercises.map((ex, pos) => ({
        routine_day_id: d.id,
        exercise_id: byName.get(ex.name.toLowerCase()) ?? null,
        exercise_name: ex.name,
        position: pos,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
      })),
    );
    if (eErr) throw eErr;
  }

  return json({ routine_id: r.id });
});
