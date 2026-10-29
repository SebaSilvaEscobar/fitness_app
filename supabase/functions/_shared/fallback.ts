// Modo sin costo: generadores con reglas fijas para cuando no hay clave de Anthropic configurada.
// Dan resultados razonables, pero menos personalizados que la IA.

// ---------- Alimentos (valores por 100 g, aproximados) ----------

type Food = {
  name: string;
  keys: string[]; // palabras para reconocerlo en texto libre
  portion: number; // gramos de una porción o unidad típica
  unit: string; // cómo se describe una porción
  kcal: number;
  p: number;
  c: number;
  f: number;
};

const FOODS: Food[] = [
  { name: "Pan marraqueta", keys: ["marraqueta", "pan batido", "pan"], portion: 100, unit: "1 unidad", kcal: 270, p: 9, c: 56, f: 1.3 },
  { name: "Pan hallulla", keys: ["hallulla"], portion: 90, unit: "1 unidad", kcal: 300, p: 8, c: 55, f: 5 },
  { name: "Pan integral", keys: ["pan integral", "integral"], portion: 30, unit: "1 rebanada", kcal: 250, p: 12, c: 41, f: 4 },
  { name: "Palta", keys: ["palta", "aguacate"], portion: 50, unit: "2 cdas", kcal: 160, p: 2, c: 8.5, f: 14.7 },
  { name: "Huevo", keys: ["huevo", "huevos"], portion: 50, unit: "1 unidad", kcal: 143, p: 12.6, c: 0.7, f: 9.5 },
  { name: "Clara de huevo", keys: ["clara", "claras"], portion: 33, unit: "1 clara", kcal: 52, p: 10.9, c: 0.7, f: 0.2 },
  { name: "Quesillo", keys: ["quesillo"], portion: 40, unit: "1 lámina gruesa", kcal: 100, p: 12, c: 3, f: 4.5 },
  { name: "Queso gauda", keys: ["queso"], portion: 20, unit: "1 lámina", kcal: 356, p: 25, c: 2, f: 27 },
  { name: "Jamón de pavo", keys: ["jamon", "jamón"], portion: 20, unit: "1 lámina", kcal: 110, p: 18, c: 2, f: 3 },
  { name: "Leche descremada", keys: ["leche"], portion: 200, unit: "1 taza", kcal: 35, p: 3.4, c: 5, f: 0.1 },
  { name: "Yogur natural", keys: ["yogur", "yogurt"], portion: 125, unit: "1 pote", kcal: 60, p: 4, c: 6, f: 2 },
  { name: "Avena", keys: ["avena"], portion: 40, unit: "4 cdas", kcal: 380, p: 13, c: 60, f: 7 },
  { name: "Plátano", keys: ["platano", "plátano", "banana"], portion: 120, unit: "1 unidad", kcal: 89, p: 1.1, c: 23, f: 0.3 },
  { name: "Manzana", keys: ["manzana"], portion: 150, unit: "1 unidad", kcal: 52, p: 0.3, c: 14, f: 0.2 },
  { name: "Naranja", keys: ["naranja"], portion: 150, unit: "1 unidad", kcal: 47, p: 0.9, c: 12, f: 0.1 },
  { name: "Frutillas", keys: ["frutilla", "frutillas"], portion: 150, unit: "1 taza", kcal: 32, p: 0.7, c: 7.7, f: 0.3 },
  { name: "Arroz cocido", keys: ["arroz"], portion: 150, unit: "1 taza", kcal: 130, p: 2.7, c: 28, f: 0.3 },
  { name: "Fideos cocidos", keys: ["fideos", "tallarines", "pasta"], portion: 180, unit: "1 plato", kcal: 158, p: 5.8, c: 31, f: 0.9 },
  { name: "Papas cocidas", keys: ["papa", "papas"], portion: 200, unit: "2 unidades medianas", kcal: 87, p: 1.9, c: 20, f: 0.1 },
  { name: "Papas fritas", keys: ["papas fritas"], portion: 150, unit: "1 porción", kcal: 312, p: 3.4, c: 41, f: 15 },
  { name: "Porotos cocidos", keys: ["porotos", "frijoles", "porotos con riendas"], portion: 200, unit: "1 plato", kcal: 127, p: 8.7, c: 22.8, f: 0.5 },
  { name: "Lentejas cocidas", keys: ["lentejas"], portion: 200, unit: "1 plato", kcal: 116, p: 9, c: 20, f: 0.4 },
  { name: "Garbanzos cocidos", keys: ["garbanzos"], portion: 150, unit: "1 taza", kcal: 164, p: 8.9, c: 27, f: 2.6 },
  { name: "Pechuga de pollo", keys: ["pollo", "pechuga"], portion: 150, unit: "1 filete", kcal: 165, p: 31, c: 0, f: 3.6 },
  { name: "Carne de vacuno magra", keys: ["carne", "vacuno", "bistec", "posta", "asado"], portion: 150, unit: "1 bistec", kcal: 200, p: 27, c: 0, f: 10 },
  { name: "Carne molida 10% grasa", keys: ["carne molida", "molida"], portion: 120, unit: "1 porción", kcal: 176, p: 20, c: 0, f: 10 },
  { name: "Merluza", keys: ["merluza", "pescado", "reineta"], portion: 150, unit: "1 filete", kcal: 90, p: 18, c: 0, f: 1.5 },
  { name: "Salmón", keys: ["salmon", "salmón"], portion: 150, unit: "1 filete", kcal: 208, p: 20, c: 0, f: 13 },
  { name: "Atún en agua", keys: ["atun", "atún"], portion: 120, unit: "1 lata", kcal: 116, p: 26, c: 0, f: 1 },
  { name: "Ensalada chilena", keys: ["ensalada chilena", "tomate"], portion: 150, unit: "1 plato", kcal: 40, p: 1, c: 5, f: 2 },
  { name: "Ensalada verde", keys: ["ensalada", "lechuga"], portion: 100, unit: "1 plato", kcal: 20, p: 1.3, c: 3, f: 0.2 },
  { name: "Aceite de oliva", keys: ["aceite"], portion: 10, unit: "1 cda", kcal: 884, p: 0, c: 0, f: 100 },
  { name: "Mantequilla de maní", keys: ["mantequilla de mani", "mani", "maní"], portion: 16, unit: "1 cda", kcal: 588, p: 25, c: 20, f: 50 },
  { name: "Nueces", keys: ["nueces", "nuez", "almendras"], portion: 30, unit: "1 puñado", kcal: 654, p: 15, c: 14, f: 65 },
  { name: "Cazuela de vacuno", keys: ["cazuela"], portion: 450, unit: "1 plato", kcal: 75, p: 6, c: 7, f: 2.5 },
  { name: "Charquicán", keys: ["charquican", "charquicán"], portion: 350, unit: "1 plato", kcal: 105, p: 6, c: 12, f: 3.5 },
  { name: "Pastel de choclo", keys: ["pastel de choclo"], portion: 400, unit: "1 plato", kcal: 160, p: 8, c: 16, f: 7 },
  { name: "Humita", keys: ["humita", "humitas"], portion: 200, unit: "1 unidad", kcal: 150, p: 4, c: 25, f: 4 },
  { name: "Empanada de pino", keys: ["empanada"], portion: 250, unit: "1 unidad", kcal: 280, p: 10, c: 28, f: 14 },
  { name: "Completo italiano", keys: ["completo", "italiano", "hot dog"], portion: 250, unit: "1 unidad", kcal: 260, p: 7, c: 24, f: 15 },
  { name: "Sopaipilla", keys: ["sopaipilla", "sopaipillas"], portion: 60, unit: "1 unidad", kcal: 340, p: 5, c: 40, f: 18 },
  { name: "Arepa", keys: ["arepa", "arepas"], portion: 100, unit: "1 unidad", kcal: 218, p: 4.5, c: 39, f: 4.5 },
  { name: "Café con leche", keys: ["cafe con leche", "café con leche"], portion: 250, unit: "1 taza", kcal: 30, p: 2, c: 3, f: 1 },
  { name: "Café o té sin azúcar", keys: ["cafe", "café", "te", "té"], portion: 250, unit: "1 taza", kcal: 1, p: 0.1, c: 0, f: 0 },
  { name: "Bebida azucarada", keys: ["bebida", "coca", "gaseosa"], portion: 350, unit: "1 lata", kcal: 42, p: 0, c: 10.6, f: 0 },
  { name: "Azúcar", keys: ["azucar", "azúcar"], portion: 5, unit: "1 cdta", kcal: 400, p: 0, c: 100, f: 0 },
  { name: "Mermelada", keys: ["mermelada"], portion: 20, unit: "1 cda", kcal: 250, p: 0.4, c: 63, f: 0.1 },
  { name: "Proteína whey", keys: ["proteina", "proteína", "whey"], portion: 30, unit: "1 scoop", kcal: 380, p: 78, c: 8, f: 5 },
];

const WORD_NUMBERS: Record<string, number> = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, media: 0.5, medio: 0.5,
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const COMPOUND_KEYS = [...new Set(FOODS.flatMap((f) => f.keys.map(norm)).filter((k) => k.includes(" ")))].sort(
  (a, b) => b.length - a.length,
);

const macros = (f: Food, grams: number) => ({
  kcal: Math.round((f.kcal * grams) / 100),
  protein_g: Math.round((f.p * grams) / 10) / 10,
  carbs_g: Math.round((f.c * grams) / 10) / 10,
  fat_g: Math.round((f.f * grams) / 10) / 10,
});

/** Reconoce alimentos de una base fija en un texto como "2 huevos, una marraqueta con palta". */
export function parseFoodFallback(text: string) {
  // Las claves de varias palabras ("cafe con leche", "papas fritas") se unen con "_" para no cortarlas al separar
  let t = norm(text);
  for (const k of COMPOUND_KEYS) t = t.replaceAll(k, k.replaceAll(" ", "_"));
  const parts = t.split(/,|\by\b|\bcon\b|\+|\n/).map((s) => s.trim()).filter(Boolean);
  const items = [];
  for (const part of parts) {
    // La palabra clave más larga que aparezca gana ("papas fritas" antes que "papas")
    let best: Food | null = null;
    let bestLen = 0;
    for (const f of FOODS) {
      for (const k of f.keys) {
        const nk = norm(k).replaceAll(" ", "_");
        if (new RegExp(`\\b${nk}\\b`).test(part) && nk.length > bestLen) {
          best = f;
          bestLen = nk.length;
        }
      }
    }
    if (!best) continue;
    const grams = part.match(/(\d+(?:[.,]\d+)?)\s*(g|gr|gramos)\b/);
    const count = part.match(/^(\d+(?:[.,]\d+)?)/)?.[1] ?? part.split(/\s+/).map((w) => WORD_NUMBERS[w]).find(Boolean);
    const quantity_g = grams ? Number(grams[1].replace(",", ".")) : best.portion * Number(String(count ?? 1).replace(",", "."));
    items.push({ name: best.name, quantity_g, ...macros(best, quantity_g) });
  }
  return { items };
}

// ---------- Plan nutricional ----------

type Meal = { slot: "breakfast" | "lunch" | "dinner" | "snack"; name: string; recipe: string; foods: [string, number][] };

// Cada comida: [nombre del alimento, porciones base]. Las porciones se escalan a la meta de calorías.
const MEALS: Record<Meal["slot"], Meal[]> = {
  breakfast: [
    { slot: "breakfast", name: "Marraqueta con palta y huevo", recipe: "Huevo a la copa o revuelto sin aceite.", foods: [["Pan marraqueta", 0.5], ["Palta", 1], ["Huevo", 2], ["Café con leche", 1]] },
    { slot: "breakfast", name: "Avena con plátano", recipe: "Cocer la avena en leche y agregar el plátano en rodajas.", foods: [["Avena", 1], ["Leche descremada", 1], ["Plátano", 1]] },
    { slot: "breakfast", name: "Tostadas con quesillo", recipe: "Pan integral tostado con quesillo y tomate.", foods: [["Pan integral", 2], ["Quesillo", 1], ["Yogur natural", 1], ["Frutillas", 1]] },
    { slot: "breakfast", name: "Hallulla con huevo y jamón", recipe: "Huevo revuelto con jamón de pavo.", foods: [["Pan hallulla", 0.5], ["Huevo", 2], ["Jamón de pavo", 1], ["Naranja", 1]] },
  ],
  lunch: [
    { slot: "lunch", name: "Pollo con arroz y ensalada chilena", recipe: "Pechuga a la plancha, arroz graneado y ensalada de tomate con cebolla.", foods: [["Pechuga de pollo", 1], ["Arroz cocido", 1], ["Ensalada chilena", 1], ["Aceite de oliva", 0.5]] },
    { slot: "lunch", name: "Porotos con riendas", recipe: "Porotos guisados con zapallo y fideos.", foods: [["Porotos cocidos", 1.2], ["Fideos cocidos", 0.4], ["Ensalada verde", 1]] },
    { slot: "lunch", name: "Cazuela de vacuno", recipe: "Cazuela con papa, zapallo, choclo y arroz.", foods: [["Cazuela de vacuno", 1], ["Ensalada verde", 1]] },
    { slot: "lunch", name: "Merluza con papas cocidas", recipe: "Merluza al horno con limón y papas cocidas.", foods: [["Merluza", 1.2], ["Papas cocidas", 1], ["Ensalada chilena", 1], ["Aceite de oliva", 0.5]] },
    { slot: "lunch", name: "Lentejas con arroz", recipe: "Lentejas guisadas con verduras y un poco de arroz.", foods: [["Lentejas cocidas", 1.2], ["Arroz cocido", 0.5], ["Huevo", 1], ["Ensalada verde", 1]] },
    { slot: "lunch", name: "Charquicán con huevo", recipe: "Charquicán de carne molida con un huevo frito en poco aceite.", foods: [["Charquicán", 1], ["Huevo", 1], ["Ensalada chilena", 1]] },
    { slot: "lunch", name: "Tallarines con carne molida", recipe: "Salsa de tomate casera con carne molida.", foods: [["Fideos cocidos", 1], ["Carne molida 10% grasa", 1], ["Ensalada verde", 1]] },
  ],
  snack: [
    { slot: "snack", name: "Yogur con fruta y nueces", recipe: "", foods: [["Yogur natural", 1], ["Manzana", 1], ["Nueces", 0.5]] },
    { slot: "snack", name: "Once: marraqueta con quesillo", recipe: "Con té o café.", foods: [["Pan marraqueta", 0.5], ["Quesillo", 1], ["Café o té sin azúcar", 1]] },
    { slot: "snack", name: "Batido de proteína con plátano", recipe: "Licuar con agua o leche.", foods: [["Proteína whey", 1], ["Plátano", 1]] },
  ],
  dinner: [
    { slot: "dinner", name: "Omelette con ensalada", recipe: "Omelette de huevo con quesillo y verduras.", foods: [["Huevo", 2], ["Clara de huevo", 2], ["Quesillo", 1], ["Ensalada verde", 1]] },
    { slot: "dinner", name: "Salmón con ensalada", recipe: "Salmón al horno con limón y eneldo.", foods: [["Salmón", 1], ["Ensalada verde", 1], ["Papas cocidas", 0.5]] },
    { slot: "dinner", name: "Ensalada de atún", recipe: "Atún con lechuga, tomate, huevo duro y palta.", foods: [["Atún en agua", 1], ["Ensalada chilena", 1], ["Huevo", 1], ["Palta", 0.5]] },
    { slot: "dinner", name: "Bistec con verduras", recipe: "Bistec a la plancha con verduras salteadas.", foods: [["Carne de vacuno magra", 1], ["Ensalada verde", 1], ["Arroz cocido", 0.5], ["Aceite de oliva", 0.5]] },
  ],
};

const SHARE: Record<Meal["slot"], number> = { breakfast: 0.25, lunch: 0.35, snack: 0.12, dinner: 0.28 };
const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const byName = new Map(FOODS.map((f) => [f.name, f]));

export function mealPlanFallback(opts: { kcal: number; days: number; restrictions: string[] }) {
  const vegetarian = opts.restrictions.some((r) => /vegetarian|vegano/i.test(r));
  const meat = /pollo|vacuno|carne|merluza|salm|at[uú]n|jam[oó]n|cazuela|charquic/i;
  const days = [];
  for (let d = 0; d < opts.days; d++) {
    const meals = (Object.keys(MEALS) as Meal["slot"][]).map((slot) => {
      const options = MEALS[slot].filter((m) => !vegetarian || !m.foods.some(([n]) => meat.test(n)));
      const meal = options[d % options.length] ?? MEALS[slot][0];
      const baseKcal = meal.foods.reduce((acc, [n, k]) => acc + (byName.get(n)!.kcal * byName.get(n)!.portion * k) / 100, 0);
      const scale = (opts.kcal * SHARE[slot]) / baseKcal;
      return {
        slot,
        name: meal.name,
        recipe: meal.recipe,
        foods: meal.foods.map(([n, k]) => {
          const f = byName.get(n)!;
          const grams = Math.round((f.portion * k * scale) / 5) * 5;
          return { name: f.name, quantity: `${grams} g`, ...macros(f, grams) };
        }),
      };
    });
    days.push({ day: DAYS[d % 7], meals });
  }
  return { title: `Plan ${Math.round(opts.kcal)} kcal`, days };
}

// ---------- Rutina ----------

type Exercise = { name: string; primary_muscle: string; equipment: string };
type Profile = { goal: string; experience: string; training_days: number; training_place: string; equipment?: string[] };

const SPLITS: Record<number, { name: string; muscles: string[] }[]> = {
  2: [
    { name: "Cuerpo completo A", muscles: ["Cuádriceps", "Pecho", "Espalda", "Hombros", "Bíceps", "Abdomen"] },
    { name: "Cuerpo completo B", muscles: ["Isquiotibiales", "Glúteos", "Espalda", "Pecho", "Tríceps", "Abdomen"] },
  ],
  3: [
    { name: "Empuje", muscles: ["Pecho", "Pecho", "Hombros", "Hombros", "Tríceps", "Abdomen"] },
    { name: "Tirón", muscles: ["Espalda", "Espalda", "Espalda", "Hombros", "Bíceps", "Bíceps"] },
    { name: "Pierna", muscles: ["Cuádriceps", "Cuádriceps", "Isquiotibiales", "Glúteos", "Pantorrillas", "Abdomen"] },
  ],
  4: [
    { name: "Torso A", muscles: ["Pecho", "Espalda", "Hombros", "Espalda", "Bíceps", "Tríceps"] },
    { name: "Pierna A", muscles: ["Cuádriceps", "Isquiotibiales", "Glúteos", "Cuádriceps", "Pantorrillas", "Abdomen"] },
    { name: "Torso B", muscles: ["Espalda", "Pecho", "Hombros", "Pecho", "Tríceps", "Bíceps"] },
    { name: "Pierna B", muscles: ["Isquiotibiales", "Cuádriceps", "Glúteos", "Glúteos", "Pantorrillas", "Abdomen"] },
  ],
};

export function workoutFallback(p: Profile, library: Exercise[]) {
  const days = Math.min(Math.max(Number(p.training_days) || 3, 1), 7);
  const base = SPLITS[days] ?? (days === 1 ? SPLITS[2].slice(0, 1) : [...SPLITS[3], ...SPLITS[3]].slice(0, days));
  const owned = new Set(["bodyweight", ...(p.equipment ?? [])]);
  const usable = library.filter((e) => p.training_place === "gym" || owned.has(e.equipment));

  const sets = p.experience === "beginner" ? 3 : 4;
  const scheme =
    p.goal === "gain_muscle" ? { reps: "8-12", rest: 90 } : p.goal === "lose_fat" ? { reps: "12-15", rest: 60 } : { reps: "10-12", rest: 75 };

  const routineDays = base.map((day, di) => {
    const used = new Set<string>();
    const exercises = day.muscles.flatMap((muscle, i) => {
      const options = usable.filter((e) => e.primary_muscle === muscle && !used.has(e.name));
      // Rotar entre opciones para que los días repetidos no sean idénticos
      const pick = options[(di + i) % Math.max(options.length, 1)];
      if (!pick) return [];
      used.add(pick.name);
      const isCore = muscle === "Abdomen";
      return [{
        name: pick.name,
        sets: isCore ? 3 : sets,
        reps: isCore ? (pick.name === "Plancha" ? "30-45 s" : "15") : scheme.reps,
        rest_seconds: isCore ? 45 : scheme.rest,
        notes: "",
      }];
    });
    return { name: day.name, exercises };
  });

  const goalLabel = p.goal === "gain_muscle" ? "Hipertrofia" : p.goal === "lose_fat" ? "Quema de grasa" : "Acondicionamiento";
  return {
    title: `${goalLabel} ${days} días · ${p.training_place === "home" ? "casa" : "gimnasio"}`,
    description: "Rutina base. Sube el peso cuando completes todas las series con buena técnica.",
    weeks: 6,
    days: routineDays,
  };
}
