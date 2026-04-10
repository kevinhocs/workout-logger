export const KG_TO_LB = 2.20462;

export const toLbs = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? num * KG_TO_LB : NaN;
};

export const round1 = (n) => {
  return Math.round(n * 10) / 10;
};

export const toKg = (weightLbs) => {
  const n = Number(weightLbs);
  if (!Number.isFinite(n)) return NaN;
  return n / KG_TO_LB;
};
