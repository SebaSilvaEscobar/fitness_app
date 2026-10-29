// Utilidades compartidas por las funciones de IA.
import Anthropic from "npm:@anthropic-ai/sdk@1";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const MODEL = Deno.env.get("CLAUDE_MODEL") ?? "claude-opus-5-5";

const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
/** Sin clave de Anthropic las funciones usan el modo sin costo (reglas fijas en fallback.ts). */
export const hasAi = !!apiKey;
const anthropic = new Anthropic({ apiKey: apiKey ?? "missing" });

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Cliente de Supabase que actúa como el usuario que hizo la petición (respeta RLS). */
export async function userClient(req: Request): Promise<{ supabase: SupabaseClient; userId: string }> {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new HttpError(401, "No autenticado");
  return { supabase, userId: data.user.id };
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Pide a Claude una respuesta JSON que cumpla `schema`. */
export async function generateJson<T>(opts: {
  system: string;
  prompt: string;
  schema: Record<string, unknown>;
  effort?: "low" | "medium" | "high";
}): Promise<T> {
  const stream = anthropic.beta.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: opts.effort ?? "medium",
      format: { type: "json_schema", schema: opts.schema },
    },
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });
  const msg = await stream.finalMessage();

  if (msg.stop_reason === "refusal") throw new HttpError(422, "La IA no pudo generar esta respuesta.");
  if (msg.stop_reason === "max_tokens") throw new HttpError(502, "La respuesta de la IA quedó incompleta.");
  const text = msg.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new HttpError(502, "La IA no devolvió contenido.");
  return JSON.parse(text.text) as T;
}

/** Envuelve un handler con CORS y manejo de errores. */
export function serve(handler: (req: Request) => Promise<Response>) {
  Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    try {
      return await handler(req);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      if (e instanceof Anthropic.RateLimitError) return json({ error: "Demasiadas solicitudes, intenta en un momento." }, 429);
      if (e instanceof Anthropic.APIError) return json({ error: "Error del servicio de IA." }, 502);
      console.error(e);
      return json({ error: "Error inesperado." }, 500);
    }
  });
}

export const SAFETY_NOTE =
  "No eres médico. Si el usuario menciona lesiones, embarazo, enfermedades o medicación, " +
  "sé conservador y recomiéndale consultar a un profesional de la salud.";

/** Copia solo las claves permitidas de un objeto recibido del cliente. */
export function pick(obj: unknown, keys: string[]): Record<string, unknown> {
  if (!obj || typeof obj !== "object") return {};
  const src = obj as Record<string, unknown>;
  return Object.fromEntries(keys.filter((k) => src[k] !== undefined && src[k] !== null && src[k] !== "").map((k) => [k, src[k]]));
}
