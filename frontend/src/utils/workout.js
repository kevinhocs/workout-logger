import { toLbs, round1 } from "./units";

export function buildSetsPayload(sets, unit) {
  return sets.map((s) => {
    const weightInput = Number(s.weight);

    const weightInLbs =
      unit === "kg" ? round1(toLbs(weightInput)) : weightInput;

    return {
      weight: weightInLbs,
      reps: Number(s.reps),
      notes: s.notes || null,
    };
  });
}
