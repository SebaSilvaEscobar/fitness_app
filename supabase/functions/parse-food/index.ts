// Convierte una descripción libre ("2 huevos revueltos y una arepa") en alimentos con macros.
import { generateJson, hasAi, HttpError, json, serve, userClient } from "../_shared/claude.ts";
import { parseFoodFallback } from "../_shared/fallback.ts";

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "quantity_g", "kcal", "protein_g", "carbs_g", "fat_g"],
        properties: {
          name: { type: "string" },
          quantity_g: { type: "number" },
          kcal: { type: "number" },
          protein_g: { type: "number" },
          carbs_g: { type: "number" },
          fat_g: { type: "number" },
        },
      },
    },
  },
};

serve(async (req) => {
  await userClient(req);
  const { text } = await req.json().catch(() => ({}));
  if (!text || typeof text !== "string") throw new HttpError(400, "Describe lo que comiste.");

  if (!hasAi) {
    const result = parseFoodFallback(text);
    if (result.items.length === 0) {
      throw new HttpError(422, "No reconocí esos alimentos. Prueba con nombres simples, por ejemplo: 2 huevos, 1 marraqueta.");
    }
    return json(result);
  }

  const result = await generateJson<{ items: unknown[] }>({
    system:
      "Eres un experto en composición de alimentos. Separa la descripción en alimentos individuales y " +
      "estima porciones típicas en gramos cuando no se indiquen, con valores nutricionales realistas. " +
      "Usa nombres en español de Chile. Reconoce comidas chilenas y latinoamericanas (completo, sopaipilla, " +
      "humita, pastel de choclo, once, etc.) y sus porciones típicas.",
    prompt: text.slice(0, 2000),
    schema,
    effort: "low",
  });
  return json(result);
});
