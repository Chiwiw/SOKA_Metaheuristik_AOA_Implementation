const cache = new Map<number, Intl.NumberFormat>();

/** Format angka lokal Indonesia (koma desimal, titik ribuan). */
export function fmt(value: number, digits = 1): string {
  let f = cache.get(digits);
  if (!f) { f = new Intl.NumberFormat('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits }); cache.set(digits, f); }
  return f.format(value);
}

/** LBI sangat kecil → notasi ilmiah agar tidak tampil 0,0000. */
export function fmtLbi(value: number): string {
  if (value === 0) return '0';
  return value < 0.0001 ? value.toExponential(1).replace('.', ',').replace('e-', '×10⁻') : fmt(value, 4);
}

export const pct = (a: number, b: number): number => 100 * (1 - a / b);
