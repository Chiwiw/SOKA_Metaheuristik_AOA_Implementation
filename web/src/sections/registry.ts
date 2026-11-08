import type { Operator } from '../engine';

/** Daftar bab. Urutan = urutan di halaman. `komponen` + `fase` mengacu ke docs/03 dan docs/06. */
export interface Chapter {
  id: string;
  no: number;
  judul: string;
  /** satu baris pendek (≤ 8 kata) — teks bab sengaja minim, visual yang bercerita */
  tagline: string;
  glyph: Operator | null;
  komponen: string;
  fase: number;
}

export const CHAPTERS: readonly Chapter[] = [
  { id: 'mulai', no: 0, judul: 'Layar Menyala', tagline: 'Kalkulator yang menghitung jadwal terbaik.', glyph: null, komponen: 'Hero · Layar LCD & kunci operator', fase: 1 },
  { id: 'masalah', no: 1, judul: 'Siapa Kerja di VM Mana?', tagline: 'Coba susun sendiri. Lalu lawan AOA.', glyph: 'mul', komponen: 'Tantang AOA · Datacenter Isometrik', fase: 3 },
  { id: 'kenalan', no: 2, judul: 'Kenalan dengan AOA', tagline: 'Empat operator, satu kawanan.', glyph: 'div', komponen: 'Peta Metaheuristik', fase: 1 },
  { id: 'empat-tombol', no: 3, judul: 'Empat Tombol', tagline: 'Tekan, lihat agen melompat.', glyph: 'add', komponen: 'Arena Kawanan (lanskap 2D)', fase: 2 },
  { id: 'pengatur', no: 4, judul: 'Dua Pengatur', tagline: 'MOA memilih fase, MOP mengecilkan langkah.', glyph: 'sub', komponen: 'Kurva MOA/MOP + Arena', fase: 2 },
  { id: 'alur', no: 5, judul: 'Alur Lengkap', tagline: 'Satu iterasi, langkah demi langkah.', glyph: 'mul', komponen: 'Kode ↔ Visual (scrollytelling)', fase: 2 },
  { id: 'jadwal', no: 6, judul: 'Dari Angka ke Jadwal', tagline: 'floor(x) = nomor VM.', glyph: 'div', komponen: 'Encoding & Fitness hidup', fase: 2 },
  { id: 'laboratorium', no: 7, judul: 'Laboratorium', tagline: 'Jalankan AOA sungguhan di browser-mu.', glyph: 'add', komponen: 'Lab (Web Worker)', fase: 3 },
  { id: 'eksperimen', no: 8, judul: 'Eksperimen CloudSim', tagline: 'Dari dataset sampai CSV, satu jalur.', glyph: 'sub', komponen: 'Pipeline Implementasi', fase: 4 },
  { id: 'hasil', no: 9, judul: 'Hasil', tagline: 'Enam metrik, empat ukuran, dua algoritma.', glyph: 'mul', komponen: 'Metrik · Balapan Gantt · Konvergensi', fase: 4 },
  { id: 'analisis', no: 10, judul: 'Analisis & Keterbatasan', tagline: 'Yang berhasil, dan yang belum.', glyph: 'div', komponen: 'Temuan + bukti', fase: 4 },
  { id: 'penutup', no: 11, judul: 'Penutup & Bukti', tagline: 'Semua data dan kode bisa diunduh.', glyph: 'add', komponen: 'Bukti & penampil kode', fase: 5 },
] as const;
