# 06 — Rencana Kerja & Prompt untuk Agent

Kerjakan berurutan; satu fase per sesi (fase besar dipecah). Setelah tiap fase: checklist `docs/07`, perbarui `PROGRESS.md`, commit.
Estimasi: ±10–14 sesi agent. **Fase 2 dan 3 menentukan kesan "unik dan niat"** — jangan dipangkas; pangkas stretch dulu.

## Kondisi awal (sudah ada di repo)

- Proyek Java/Maven + `hasil_aoa/` + `plot_metrics.py` (milik manusia).
- `web/`: Vite + React 19 + TypeScript strict yang **sudah bisa di-build**; mesin AOA TS (`src/engine/`) dengan 11 uji unit + uji paritas terhadap Java; token desain; kerangka 12 bab berisi *placeholder* bertanda "BELUM DIBANGUN"; loader data bertipe; workflow Pages.
- Pegangan cepat: `cd web && npm install && npm run dev`.

## Prompt pembuka (tempel di awal SETIAP sesi)

```
Kamu mengerjakan situs presentasi AOA "Mesin Hitung Awan" di folder web/ pada repo ini.
Baca AGENTS.md sampai habis, lalu PROGRESS.md, lalu bagian fase yang kukerjakan di docs/06 dan komponen terkait di docs/03.
Patuhi aturan keras (tidak mengarang angka, jangan ubah rumus engine, jangan sentuh proyek Java, tanpa CDN, URL relatif)
dan aturan visual-first (teks tubuh ≤ 45 kata per layar, satu momen khas per bab).
Sebelum mengubah berkas, tulis rencana 3–7 butir; tanyakan bila ada keputusan yang perlu aku ambil.
Setelah selesai: jalankan npm run build, npm test (dan npm run parity bila menyentuh engine/data), cek di browser 390/1024/1920 px terang & gelap,
perbarui PROGRESS.md, ringkas perubahan dan hal yang perlu kucek.
Fase hari ini: <ISI>.
```

---

## Fase 0 — Verifikasi fondasi & keputusan awal  (±1 sesi, singkat)
**Tugas:** jalankan `npm install`, `npm run dev`, `npm run build`, `npm test`, `npm run parity`; pastikan semuanya hijau. Tanyakan ke manusia data di `AGENTS.md` §11 dan catat di `PROGRESS.md`.
Putuskan (dan catat) apakah memakai three.js untuk datacenter 3D (default: tidak, mulai dari isometrik 2D). Tambah `base.css` untuk tipografi bab, transisi bab, dan bilah progres bila diperlukan.
**Selesai bila:** semua perintah hijau; `PROGRESS.md` terisi keputusan awal.

```
Fase 0 (docs/06): verifikasi fondasi. Jalankan semua perintah di AGENTS.md §7 dan laporkan hasilnya. Lalu tanyakan padaku data yang kosong (AGENTS.md §11).
Jangan membangun komponen apa pun dulu.
```

## Fase 1 — Konten statis & hero (C1, C2 sederhana)
**Tugas:** isi bab 0–11 dengan teks super-ringkas (tagline + ≤ 45 kata) dan struktur akhir (grid, ritme latar selang-seling, glyph operator besar), laci "Lihat lebih dalam" untuk detail dari `docs/04`.
Bangun hero (C1) dengan LCD hidup berbasis `applyOperator`, empat keycap, transisi bab. Catatan presenter per bab di `sections/<bab>/notes.ts`. Peta Metaheuristik (C2).
**Selesai bila:** halaman terbaca sebagai alur cerita yang rapi walau visual utama masih placeholder; semua angka di teks diikat ke data.

```
Fase 1 (docs/06): isi struktur & teks ringkas semua bab, bangun hero (C1) dan Peta Metaheuristik (C2). Patuhi anggaran teks. Detail panjang masuk laci "Lihat lebih dalam"
(sumber: docs/04). Buat sections/<bab>/notes.ts untuk catatan presenter. Daftar semua klaim yang perlu kuverifikasi ke paper.
```

## Fase 2 — Cara kerja algoritma ★ (V1, C3, C4)
**Tugas:** Arena Kawanan (V1) lengkap: lanskap, jalur-L berwarna operator, mode Operator & Kawanan, riwayat + penggeser waktu, pengukur. Lalu C3 (MOA/MOP terhubung ke V1) dan C4 (Dari Angka ke Jadwal).
**Selesai bila:** KP V1, C3, C4 lolos; V1 ≥ 50 fps; uji bahwa posisi yang digambar = keluaran engine; AOA 2D menemukan lembah utama ≥ 70% seed (atau lanskap disesuaikan, bukan AOA).

```
Fase 2 (docs/06): bangun Arena Kawanan (V1) di web/src/viz/swarm/ memakai AoaOptimizer (jangan salin rumus). Gambar langkah sebagai jalur-L berwarna operator per dimensi.
Tambahkan mode Operator (bab 3), mode Kawanan, riwayat untuk penggeser waktu (bab 4), pengukur MOA/MOP/operator. Lalu C3 dan C4. Tambahkan uji bahwa data yang digambar = engine,
dan laporkan fps. Perhatikan reduced-motion dan keyboard.
```

## Fase 3 — Implementasi yang bisa ditonton ★ (V3, V4, V2 mode replay)
**Tugas:** Kode ↔ Visual (V3) dengan nomor baris yang ditemukan otomatis dari Java; Jalur Implementasi (V4) dengan baris data nyata; Datacenter Isometrik (V2) mode replay dari `timeline_100.json`.
Bab 5 (Alur Lengkap) dan bab 8 (Eksperimen) selesai di fase ini.
**Selesai bila:** KP V3, V4, V2-mode-2 lolos; potongan kode/baris data semuanya dari berkas asli; mobile tetap berfungsi.

```
Fase 3 (docs/06): bangun V3 (Kode ↔ Visual) dengan GSAP ScrollTrigger, V4 (Jalur Implementasi) dan V2 mode replay. Nomor baris kode harus ditemukan otomatis dari nama metode
di AOASchedulingSim.java (jangan hardcode). Baris data di laci V4 diambil dari web/public/data/raw. Replay memakai timeline_100.json dengan skala waktu sama untuk AOA dan Random.
```

## Fase 4 — Interaktif langsung (V2 mode Tantang, C5 Lab)
**Tugas:** Tantang AOA (bab 1) dan Laboratorium (bab 7) dengan Web Worker (`createAoaWorker`), fallback tanpa Worker, stempel "Estimasi di browser".
**Selesai bila:** KP V2-mode-1 dan C5 lolos; N=1000/pop 50/iter 500 tidak membekukan UI (laporkan waktu & frame drop); seed sama → hasil identik.

```
Fase 4 (docs/06): bangun Tantang AOA (V2 mode 1) dan Laboratorium (C5). Lab memakai createAoaWorker dari web/src/engine (jangan ubah rumus). Tampilkan stempel "Estimasi di browser".
Uji performa N=1000 dan laporkan. Pastikan Jeda/Reset menghentikan worker. Sediakan fallback tanpa Worker.
```

## Fase 5 — Hasil & Analisis ★ (V5, C6, C7)
**Tugas:** Penjelajah Hasil (V5): 6 small multiples animasi, saklar AOA/Random, konvergensi beranotasi otomatis, tabel setara; kartu eksperimen (C6); kartu temuan jujur (C7) dengan chip bukti.
**Selesai bila:** KP V5, C6, C7 lolos; uji kecil memastikan nilai grafik = JSON; keterbatasan tampil setara kekuatan.

```
Fase 5 (docs/06): bangun V5, C6, C7. Semua angka dari web/public/data lewat lib/data.ts. Grafik SVG buatan sendiri + tabel setara + teks alternatif. Anotasi konvergensi dihitung dari data.
Kartu temuan wajib memuat keterbatasan AOA (docs/04 §6). Callout "Utilisasi VM = RUR CPU" wajib ada.
```

## Fase 6 — Mode presentasi, bukti, polesan (C8, C9, stretch)
**Tugas:** Mode presentasi (C8), Penutup & Bukti (C9), polesan gerak & momen khas, favicon/OG, `@media print`. Pilih 1–2 stretch (S1/S4 paling bermanfaat).
**Selesai bila:** latihan penuh 15–20 menit hanya dengan keyboard berjalan mulus; pewaktu & catatan bekerja.

```
Fase 6 (docs/06): bangun mode presentasi (C8) dan Penutup & Bukti (C9). Pintasan P, N, F, T, ?, panah tidak boleh bentrok dengan slider/kode. Lakukan latihan penuh dan laporkan bab yang melebihi
anggaran waktu di docs/01. Poles gerak dan momen khas tiap bab.
```

## Fase 7 — QA, aksesibilitas, kinerja, penyuntingan
**Tugas:** semua checklist `docs/07`; audit teks (ejaan, istilah `docs/04` §7, kejujuran klaim); pangkas teks yang melebihi anggaran.
**Selesai bila:** semua butir hijau; Lighthouse ≥ 90 (4 kategori); tidak ada `VERIFIKASI` tersisa tanpa keputusan manusia.

```
Fase 7 (docs/06): audit penuh memakai docs/07. Laporkan dalam tabel (butir, status, bukti, perbaikan). Perbaiki yang bisa; tandai yang butuh keputusanku.
Periksa anggaran teks per layar dan kejujuran tiap klaim terhadap web/public/data.
```

## Fase 8 — Deploy & latihan
**Tugas:** buat repo GitHub, aktifkan Pages (Source = GitHub Actions), push, cek URL publik, uji di perangkat lain, siapkan cadangan offline (`npm run build` → zip `web/dist` + `npx vite preview`).
**Selesai bila:** URL publik berfungsi di Chrome/Firefox/Safari dan ponsel; cadangan offline teruji.

```
Fase 8 (docs/06): siapkan deploy. Pandu aku membuat repo dan mengaktifkan GitHub Pages (Source: GitHub Actions). Verifikasi workflow hijau, tidak ada URL absolut, dan situs publik memuat semua aset.
Buat cadangan offline dan petunjuknya.
```

---

## Prompt pendukung

**Tinjau kode:**
```
Tinjau perubahan terakhir sebagai reviewer ketat terhadap AGENTS.md dan docs/03. Cari: angka yang diketik manual, rumus yang menyimpang dari engine, warna operator di luar fungsinya,
URL absolut, permintaan jaringan eksternal, teks melebihi anggaran, kontrol tanpa label/keyboard, rAF yang tidak berhenti di luar layar, any di TypeScript. Beri daftar berprioritas.
```

**Perbaiki bug:**
```
Bug: <deskripsi + langkah + yang diharapkan>. Reproduksi dulu, jelaskan akar masalah, perbaiki seminimal mungkin, tambahkan uji bila masuk akal. Jangan merombak komponen lain.
```

**Bila terasa generik:**
```
Tampilan <komponen> terasa generik. Dalam batas tokens.css dan docs/02, usulkan 3 perbaikan yang memperkuat metafora kalkulator/kertas milimeter (tekstur, ritme tipografi, gerak, detail mikro,
momen khas). Implementasikan yang paling berdampak; tunjukkan sebelum/sesudah di 390 dan 1280 px.
```

**Pangkas teks:**
```
Audit semua teks di layar <bab>. Hitung kata tubuh per layar (di luar judul/tagline/label visual). Yang melebihi 45 kata: pindahkan detail ke laci "Lihat lebih dalam" atau jadikan anotasi pada visual.
Pertahankan makna dan klaim yang didukung data.
```

**Cek kejujuran:**
```
Audit semua klaim di bab Hasil dan Analisis. Untuk tiap klaim tunjukkan sumbernya di web/public/data atau docs/04. Tandai klaim tanpa dukungan dan usulkan kata-kata yang benar.
```
