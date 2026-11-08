/**
 * Fungsi lanskap 2D untuk Arena Kawanan.
 * Gaussian campuran terbalik — optimum global [5,5], ada 4 lembah lokal.
 */

export interface Landscape {
  name: string;
  fitness: (x: Float64Array) => number;
  /** Posisi optimum global [x, y] untuk verifikasi */
  globalOptimum: [number, number];
}

/** G(x,y) = exp(-((x-cx)^2/(2*sx^2) + (y-cy^2)/(2*sy^2))) */
function gauss(x: number, y: number, cx: number, cy: number, sx: number, sy: number): number {
  return Math.exp(-(((x - cx) ** 2) / (2 * sx * sx) + ((y - cy) ** 2) / (2 * sy * sy)));
}

/**
 * fitness = -(G_main + 0.6*G2 + 0.5*G3 + 0.4*G4 + 0.3*G5)
 * Main Gaussian di (5,5) σ=1.5; lembah lokal menyebar di sudut-sudut.
 */
export const DEFAULT_LANDSCAPE: Landscape = {
  name: 'Gaussian Campuran',
  fitness: (x: Float64Array): number => {
    const [px, py] = [x[0], x[1]];
    const g1 = gauss(px, py, 5.0, 5.0, 1.5, 1.5); // lembah utama
    const g2 = gauss(px, py, 2.0, 2.0, 1.0, 1.0); // lembah lokal 1
    const g3 = gauss(px, py, 8.0, 2.5, 1.0, 1.0); // lembah lokal 2
    const g4 = gauss(px, py, 2.5, 8.0, 1.0, 1.0); // lembah lokal 3
    const g5 = gauss(px, py, 7.5, 7.5, 1.0, 1.0); // lembah lokal 4
    return -(g1 + 0.6 * g2 + 0.5 * g3 + 0.4 * g4 + 0.3 * g5);
  },
  globalOptimum: [5, 5],
};

/** Hitung min/max dari lanskap pada grid NxN untuk normalisasi heatmap */
export function computeLandscapeRange(
  landscape: Landscape,
  lb: number,
  ub: number,
  n = 64,
): { min: number; max: number } {
  let min = Infinity, max = -Infinity;
  const step = (ub - lb) / (n - 1);
  const pt = new Float64Array(2);
  for (let i = 0; i < n; i++) {
    pt[1] = lb + i * step;
    for (let j = 0; j < n; j++) {
      pt[0] = lb + j * step;
      const v = landscape.fitness(pt);
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  return { min, max };
}

/** Render heatmap ke ImageData (tinggi x lebar, row-major) */
export function renderHeatmap(
  landscape: Landscape,
  lb: number,
  ub: number,
  width: number,
  height: number,
  range: { min: number; max: number },
): ImageData {
  const img = new ImageData(width, height);
  const { min, max } = range;
  const span = max - min || 1;
  const pt = new Float64Array(2);
  for (let row = 0; row < height; row++) {
    // row 0 = atas = ub; row H-1 = bawah = lb
    pt[1] = ub - (row / (height - 1)) * (ub - lb);
    for (let col = 0; col < width; col++) {
      pt[0] = lb + (col / (width - 1)) * (ub - lb);
      const v = landscape.fitness(pt);
      // nilai rendah (baik) = terang (paper-like), nilai tinggi (buruk) = gelap
      const t = (v - min) / span; // 0 = baik, 1 = buruk
      // warna: baik = #f3eee1 (paper terang), buruk = #3a3020 (gelap coklat)
      const r = Math.round(243 - t * (243 - 58));
      const g = Math.round(238 - t * (238 - 48));
      const b = Math.round(225 - t * (225 - 32));
      const idx = (row * width + col) * 4;
      img.data[idx] = r;
      img.data[idx + 1] = g;
      img.data[idx + 2] = b;
      img.data[idx + 3] = 220;
    }
  }
  return img;
}
