# AGENTS.md — Metaheuristik AOA: Implementasi (Java/CloudSim) + Situs Presentasi Interaktif

Baca berkas ini PENUH di awal setiap sesi, lalu `PROGRESS.md`. `AGENTS.md` = aturan main; `docs/` = spesifikasi.

## 1. Misi

Repo ini punya dua bagian yang saling bergantung:

1. **Implementasi** (milik manusia, sudah jadi): proyek Maven Java dengan CloudSim 7.0.1 yang menjalankan AOA untuk penjadwalan cloudlet
   (`pom.xml`, `src/main/java/AOASchedulingSim.java`, `plot_metrics.py`, hasil di `hasil_aoa/`).
2. **Situs presentasi** (pekerjaanmu): aplikasi web interaktif di `web/` untuk **mempresentasikan** algoritma itu di kelas (Strategi Optimasi Komputasi Awan, ITS)
   dan dibuka publik lewat GitHub Pages.

Permintaan manusia untuk situs: **se-interaktif, semenarik, dan seunik mungkin; bukan dinding teks.** Pembaca harus *melihat* cara AOA bekerja
(kawanan agen bergerak, operator yang dipakai, fase eksplorasi → eksploitasi) dan *melihat* bagaimana implementasinya berjalan (kode ↔ visual,
dataset → AOA → CloudSim → metrik). Teknologi bebas selama aturan di bawah dipenuhi. Tema sudah diputuskan: **"Mesin Hitung Awan"** (`docs/02`).

## 2. Sumber kebenaran (urutan prioritas saat konflik)

1. `web/public/data/*.json` — satu-satunya sumber angka hasil eksperimen (dihasilkan dari `hasil_aoa/` oleh `tools/csv_to_json.py`).
2. `src/main/java/AOASchedulingSim.java` — sumber rumus/parameter implementasi.
3. `web/src/engine/*` — port TypeScript yang **harus** sama perilakunya dengan Java (dijaga oleh `npm run parity`).
4. `docs/04-konten-akademik.md` — isi akademik, istilah, klaim yang boleh/tidak boleh.
5. `docs/02`, `web/src/styles/tokens.css` — desain. `docs/01`, `03`, `05` — narasi, komponen, kontrak data.

Bila bertentangan atau belum tercakup: **berhenti dan tanya manusia**.

## 3. Aturan keras

1. **Jangan mengarang angka.** Semua angka hasil dibaca dari JSON (atau dihitung darinya/dari engine saat runtime). Tidak ada angka hasil yang diketik di JSX/CSS. Persentase turunan dihitung di kode.
2. **Jangan ubah rumus AOA** di `web/src/engine/` (`operators.ts`, `aoaCore.ts`, `scheduling.ts`). Setelah menyentuhnya, `npm run parity` dan `npm test` harus lolos.
3. **Proyek Java adalah milik manusia.** Jangan mengubah `pom.xml`, `src/main/java/*`, `plot_metrics.py` kecuali diminta. Jika Java berubah (parameter/VM/fungsi objektif),
   perbarui `web/public/data/config.json` + engine, regenerasi data, lalu jalankan paritas.
4. **Klaim hanya yang didukung data.** Pembanding eksperimen = Random Scheduling. Jangan klaim "AOA terbaik" atau unggul atas GA/PSO/SA.
5. **Jujur soal keterbatasan.** Bab Analisis wajib menampilkan hal yang kurang menguntungkan AOA (lihat `docs/04` §6).
6. **Visual-first, teks irit** (lihat §4). Ini sama pentingnya dengan kebenaran konten.
7. **Tahan banting saat presentasi:** semua aset (font, ikon, pustaka) dibundel lewat npm/Vite — **dilarang CDN saat runtime**. Situs harus berfungsi tanpa internet setelah dimuat.
8. **URL relatif.** `base: './'` di Vite sudah diatur; jangan memakai path absolut (`/assets/...`) atau mengubah `base`. Muat data dengan `import.meta.env.BASE_URL`.
9. **Tanpa pelacak/analytics/iklan.** Tidak menyalin teks/gambar/kode dari situs kelompok lain.
10. **Warna operator dilindungi** (`--op-mul/div/add/sub`): hanya untuk operator × ÷ + − (dan hal yang secara langsung merepresentasikannya). Peta warna di `docs/02`.
11. **Aksesibilitas wajib:** semantik HTML, fokus terlihat, keyboard penuh, kontras AA, `prefers-reduced-motion`, alternatif teks untuk visual (§6).
12. **Tandai ketidakpastian** dengan komentar `// VERIFIKASI: ...` dan catat di `PROGRESS.md`.

## 4. Aturan visual-first (anggaran teks)

- Tiap bab: **satu visual/interaksi utama** menjadi isi bab. Teks hanya pendamping.
- **Anggaran teks tubuh ≤ 45 kata per layar** (judul, tagline, label, anotasi pada visual tidak dihitung). Selebihnya masuk "Lihat lebih dalam" (drawer/akordeon) atau tooltip.
- Penjelasan diletakkan **di atas visualnya** sebagai anotasi/callout bertanda panah, bukan paragraf di sampingnya.
- Setiap konsep punya "mainan": sesuatu yang bisa ditekan/digeser/diputar. Dilarang bab yang isinya hanya paragraf + gambar diam.
- Tiap bab punya satu **momen khas** (animasi/interaksi yang diingat). Dilarang komponen generik tanpa identitas (kartu putih + ikon stok).
- Gerak harus menjelaskan, bukan menghias (`docs/02` §6). Semua gerak punya padanan statis saat reduced motion.

## 5. Stack & struktur

Stack baku (boleh ditambah dengan alasan, lihat §5.1): **Vite + React 19 + TypeScript (strict)**, **GSAP + ScrollTrigger** (scrollytelling), **Canvas 2D** (kawanan, datacenter, partikel),
**SVG buatan sendiri + d3-scale/d3-shape/d3-array** (grafik; d3 hanya untuk matematika skala/bentuk, bukan DOM), **KaTeX** (rumus), **Zustand** (state bersama kecil),
**prism-react-renderer** (sorotan kode), font via `@fontsource-variable/*`, **Vitest** (uji). Web Worker untuk komputasi AOA.

```
Metaheuristik_AOA_Implementasi/
├── pom.xml  src/main/java/AOASchedulingSim.java  plot_metrics.py     ← implementasi (milik manusia)
├── hasil_aoa/                     keluaran simulasi (CSV, log, grafik PNG)
├── tools/csv_to_json.py           hasil_aoa/ → web/public/data/ (+ salin kode Java)
├── web/                           ← situs
│   ├── index.html  vite.config.ts  tsconfig.json  package.json
│   ├── public/data/               JSON + raw/ (CSV, log, Java) — HASIL GENERATOR, jangan diedit manual
│   └── src/
│       ├── engine/                mesin AOA TS: operators, aoaCore, scheduling, worker (+ uji, paritas)
│       ├── lib/                   data.ts (loader bertipe), format.ts, util umum
│       ├── styles/                tokens.css, base.css
│       ├── components/            Shell, ThemeToggle, dan komponen UI bersama
│       ├── sections/              registry.ts (12 bab) + satu folder per bab
│       └── viz/                   renderer visual: swarm/, datacenter/, charts/, code/
├── docs/  AGENTS.md  CLAUDE.md  README.md  PROGRESS.md
└── .github/workflows/pages.yml    build + uji + deploy web/dist
```

### 5.1 Menambah dependensi
Boleh bila perlu (mis. three.js untuk datacenter 3D, Motion, Rough.js). Syarat: (a) manfaat nyata untuk pengalaman, (b) muat malas (`import()`) bila > 50 KB gz,
(c) lisensi permisif, (d) dicatat di `PROGRESS.md` ("Keputusan") beserta ukuran bundelnya, (e) tetap ada fallback saat WebGL/fitur tidak tersedia. Jangan menambah pustaka UI besar (MUI, Chakra, dll.) — identitas visual harus milik sendiri.

### 5.2 Konvensi kode
- TypeScript strict, tanpa `any` (gunakan `unknown` + penyempit). Komponen fungsi + hook. Satu komponen = satu berkas (+ CSS Module atau berkas `.css` bernama sama).
- Identifier bahasa Inggris; **teks UI, komentar penjelas, dan commit berbahasa Indonesia**.
- CSS hanya memakai variabel `tokens.css` (tanpa hex/px ajaib). Animasi hanya `transform`/`opacity` (atau Canvas).
- Visual berat (Canvas/WebGL) di komponen terpisah di `viz/`, dengan `requestAnimationFrame` yang **berhenti saat di luar layar** (`IntersectionObserver`) dan menyesuaikan `devicePixelRatio`.
- Komputasi AOA besar (Lab, N≥200) di Web Worker (`engine/aoa.worker.ts`); demo kecil (Arena 2D, Tantang AOA) boleh di thread utama.
- Format angka UI: `fmt()` dari `lib/format.ts` (id-ID, koma desimal).
- Hash URL hanya `#id-bab`.

## 6. Aksesibilitas visual

Canvas/SVG interaktif harus punya: ringkasan teks yang diperbarui lewat `aria-live="polite"` (mis. "Iterasi 120: eksploitasi, 41 dari 50 agen memakai +/−"), kontrol dapat difokus dengan label,
tombol "lihat sebagai tabel" bila datanya numerik, dan `prefers-reduced-motion` → tampilkan keadaan statis + kontrol langkah manual.

## 7. Perintah

```bash
# Implementasi (akar repo)
mvn -q compile exec:java                 # jalankan simulasi → hasil_aoa/
python plot_metrics.py hasil_aoa         # grafik PNG hasil_aoa/grafik/
python tools/csv_to_json.py              # hasil_aoa/ → web/public/data/ (+ salin Java)

# Situs (cd web)
npm install                              # sekali
npm run dev                              # http://localhost:5173
npm run build                            # typecheck + build produksi → web/dist
npm test                                 # uji unit mesin (cepat)
npm run parity                           # paritas TS vs Java (±45 dtk) — wajib lolos sebelum commit yang menyentuh engine/data
```

## 8. Cara kerja per sesi

1. Baca `AGENTS.md` → `PROGRESS.md` → fase di `docs/06`. Tulis rencana 3–7 butir. Kerjakan **satu fase/komponen** per sesi.
2. Bangun kecil-kecil, lihat di browser (`npm run dev`) pada 390 / 1024 / 1920 px, terang & gelap.
3. Verifikasi (`docs/07`): `npm run build`, `npm test`, `npm run parity` (bila menyentuh engine/data), cek console bersih.
4. Perbarui `PROGRESS.md`. Commit kecil berbahasa Indonesia: `fitur:`, `perbaikan:`, `gaya:`, `konten:`, `data:`, `dokumen:`, `rapikan:`.
5. Jangan mengubah `docs/` untuk membenarkan pekerjaanmu; usulkan dulu ke manusia.

## 9. Definisi selesai (tiap komponen)

- Memenuhi semua kriteria penerimaan di `docs/03`.
- Teks tubuh dalam anggaran §4; ada momen khas; ada padanan reduced-motion.
- Keyboard + pembaca layar (§6); terang/gelap; 390/1024/1920 px; tanpa error/peringatan console; tanpa permintaan jaringan ke domain lain.
- Angka dari JSON/engine; tidak ada "Lorem/TODO" tersisa di tampilan.
- Visual interaktif tetap lancar (≥ 50 fps di laptop biasa untuk Arena/Datacenter; tidak ada tugas utama > 50 ms berturut-turut).

## 10. Anggaran kinerja

- JS muat awal (hero + bab 1) ≤ 200 KB tergzip; komponen berat (Lab, Gantt/Datacenter, penampil kode, 3D bila ada) dimuat malas.
- Lighthouse mobile ≥ 90 (Performance, Accessibility, Best Practices, SEO). CLS < 0,05.

## 11. Data ini sudah aku isi sendiri, tidak perlu tanya kembali, dan sudah aku konfirmasi

Nama anggota | NRP : 
Elgracito Iryanda Endia | 5027231057
Dimas Satya A | 5027241032
Moch. Rizki NMasrullah | 5027241038
Hanif Mawla Faizi | 5027241064
Muhammad Ardiansyah Tri Wibowo | 5027241091
M. Faqih Ridho | 5027241123

Nomor kelompok & kelas (Kelas C, Kelompok 1).
izin menampilkan nama/NRP di situs publik (izin diberikan), dan `hasil_aoa/` sudah dari run milik saya sendiri.

## 12. Bila buntu

Tulis di `PROGRESS.md` → "Hambatan": yang dicoba, yang terjadi, opsi. Lalu tanya manusia. Jangan mengakali dengan angka palsu, mematikan uji, atau melanggar aturan keras.
