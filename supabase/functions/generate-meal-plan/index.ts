// Genera un plan nutricional semanal según las metas de calorías y macros del usuario.
import { generateJson, hasAi, HttpError, json, pick, SAFETY_NOTE, serve, userClient } from "../_shared/claude.ts";
import { mealPlanFallback } from "../_shared/fallback.ts";

const food = {
  type: "object",
  additionalProperties: false,
  required: ["name", "quantity", "kcal", "protein_g", "carbs_g", "fat_g"],
  properties: {
    name: { type: "string" },
    quantity: { type: "string", description: "Ej. '150 g', '1 taza', '2 unidades'" },
    kcal: { type: "number" },
    protein_g: { type: "number" },
    carbs_g: { type: "number" },
    fat_g: { type: "number" },
  },
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "days"],
  properties: {
    title: { type: "string" },
    days: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["day", "meals"],
        properties: {
          day: { type: "string" },
          meals: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["slot", "name", "recipe", "foods"],
              properties: {
                slot: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] },
                name: { type: "string" },
                recipe: { type: "string", description: "Preparación breve" },
                foods: { type: "array", items: food },
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
  const days = Math.min(Math.max(Number(body.days) || 7, 1), 7);
  const asTemplate = body.as_template === true;

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error || !profile) throw new HttpError(404, "Perfil no encontrado");
  // El entrenador puede indicar las metas del cliente tipo en vez de usar las suyas.
  const p = {
    ...profile,
    ...pick(body.overrides, ["goal", "target_kcal", "target_protein_g", "target_carbs_g", "target_fat_g", "dietary_restrictions"]),
  };
  if (!p.target_kcal) throw new HttpError(400, "Completa tu perfil para calcular tus metas primero.");

  const plan = hasAi ? await generateJson<{ title: string; days: unknown[] }>({
    system:
      "Eres nutricionista deportivo. Creas planes de comida variados, sabrosos, económicos y fáciles de " +
      "preparar, con alimentos y preparaciones comunes en Chile y Latinoamérica (por ejemplo marraqueta, palta, porotos, " +
      "charquicán, cazuela, quesillo), en español de Chile, con productos fáciles de encontrar en supermercados y ferias. " +
      "Los valores nutricionales deben " +
      "ser realistas y cada día debe acercarse a la meta (±5%). " + SAFETY_NOTE,
    prompt: `Crea un plan de ${days} días.
Meta diaria: ${p.target_kcal} kcal, ${p.target_protein_g} g proteína, ${p.target_carbs_g} g carbohidratos, ${p.target_fat_g} g grasa.
Objetivo: ${p.goal}
Restricciones o preferencias: ${(p.dietary_restrictions ?? []).join(", ") || "ninguna"}
Pedido adicional: ${extra || "ninguno"}`,
    schema,
  }) : mealPlanFallback({ kcal: p.target_kcal, days, restrictions: p.dietary_restrictions ?? [] });

  const { data, error: insErr } = await supabase
    .from("meal_plans")
    .insert({
      owner_id: userId,
      title: plan.title,
      target_kcal: p.target_kcal,
      target_protein_g: p.target_protein_g,
      target_carbs_g: p.target_carbs_g,
      target_fat_g: p.target_fat_g,
      plan: { days: plan.days },
      source: "ai",
      is_template: asTemplate,
    })
    .select("id")
    .single();
  if (insErr) throw insErr;

  return json({ meal_plan_id: data.id });
});
