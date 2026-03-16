  const KG_TO_LB = 2.20462;
  function toLbs(n) {
    const num = Number(n);
    return Number.isFinite(num) ? num * KG_TO_LB : NaN;
  }
  function round1(n) {
    return Math.round(n * 10) / 10;
  }
  function toKg(weightLbs) {
    const n = Number(weightLbs);
    if (!Number.isFinite(n)) return NaN;
    return n / KG_TO_LB;
  }