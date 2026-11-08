# 03 — Spesifikasi Komponen & Visual Khas

Format: **lokasi**, **data/engine**, **perilaku**, **a11y**, **KP** (kriteria penerimaan). Semua angka dari `web/public/data` atau `web/src/engine`.
Aturan umum (lihat `AGENTS.md` §4–6, 9): teks irit, momen khas, padanan reduced-motion, rAF berhenti di luar layar, ringkasan teks via `aria-live`.

Antarmuka engine yang dipakai (ringkas; sumber: `web/src/engine/`):
```ts
new AoaOptimizer({ dim, lb, ub, fitness, params?, seed?, recordOps? }) // .init() .step() .positions .previous .best .lastOps .operatorAt(i,j)
createSchedulingOptimizer(lengths, mips, opts)   // → { optimizer, decodeBest(), evaluateBest(), lowerBound }
evaluateAssign(vm, lengths, mips)                // → { fitness, makespan, lbi, loads, util }
moa(t,T), mop(t,T,alpha), applyOperator(op,bestJ,mop,scale), OPERATOR_GLYPH/ORDER/PHASE
createAoaWorker(onMessage)                       // Lab: run/stop/terminate
```

---

# Visual khas (bangun sebagai modul `viz/` yang dipakai ulang)

## V1 — Arena Kawanan (`viz/swarm/`)
- **Engine:** `AoaOptimizer` dim=2, `lb=0`, `ub=10`, `recordOps: true`, populasi 40 (dapat diubah), fitness = lanskap 2D (`viz/swarm/landscapes.ts`).
- **Lanskap:** fungsi dengan optimum global di dalam ruang dan 3–5 lembah lokal (mis. jumlah Gaussian terbalik). Digambar sebagai peta panas + garis kontur ke Canvas offscreen sekali.
  **Uji:** AOA 2D menemukan lembah utama pada ≥ 70% seed. Bila tidak, **jangan ubah AOA**; ganti lanskap atau tampilkan apa adanya dengan anotasi jujur.
- **Gambar:** agen = titik; langkah terakhir digambar sebagai **jalur-L**: segmen horizontal berwarna operator gen-X, lalu segmen vertikal berwarna operator gen-Y (`optimizer.operatorAt`).
  Bintang = `best`. Jejak memudar. Agen yang terkena clamp diberi cincin kecil + anotasi "menempel di tepi (clamp)" bila ≥ 20% agen terkena.
- **Mode:** (a) *Operator* (bab 3): tampilkan hanya 8 agen hantu + `best`; empat keycap memaksa satu operator untuk semua gen pada langkah itu memakai `applyOperator` (bukan memanggil `step()`); slider MOP. (b) *Kawanan* (bab 2, 4, 5): jalankan AOA penuh dengan Putar/Jeda/Langkah/Reset, seed, kecepatan.
- **Riwayat:** simpan posisi + kode operator per iterasi (≤ 501 × pop × 2) agar penggeser waktu bab 4 dapat memutar ulang keadaan mana pun.
- **Pengukur:** MOA, MOP, iterasi, jumlah gen per operator (4 batang warna operator), fitness terbaik (LCD).
- **A11y:** ringkasan teks tiap 10 iterasi ("Iterasi 120: eksploitasi dominan, fitness 0,31"); kontrol fokus; saat reduced motion hanya tampil keadaan pada iterasi terpilih (tanpa animasi lintasan).
- **KP:** (1) posisi tiap agen = keluaran engine (uji: salin 3 iterasi dan bandingkan); (2) lintasan jalur-L warnanya benar (uji visual + data `lastOps`); (3) 50 fps untuk 40 agen di laptop biasa; (4) penggeser waktu memutar keadaan identik dengan run asli; (5) tidak ada tugas utama > 50 ms.

## V2 — Datacenter Isometrik (`viz/datacenter/`)
- **Data:** `config.json` (MIPS VM), `timeline_100.json` (replay), engine (mode Tantang).
- **Gambar (Canvas 2D isometrik; 3D opsional lewat three.js dimuat malas):** 4 rak (tinggi ∝ MIPS, label MIPS, lampu LED), peti tugas (lebar ∝ MI, pola ∝ kategori kecil/sedang/besar — bukan warna operator), ban berjalan, awan di atas.
- **Mode 1 — Tantang AOA (bab 1):** 14 peti deterministik (seed tetap). Seret/ketuk peti ke rak; keyboard: pilih peti (Tab/Enter) lalu tekan 1–4. Bar makespan hidup + garis batas bawah.
  Tombol **Serahkan ke AOA** (`runAOA` pop 50, iter 200) menganimasikan peti berpindah ke susunan AOA; **Acak**; **Ulang**. LCD berkomentar membandingkan (persentase di atas batas bawah dihitung).
- **Mode 2 — Replay CloudSim (bab 9, 8):** dua datacenter berdampingan (AOA vs Random, N=100, run-1). Waktu simulasi diputar dengan kecepatan 1×–50×; peti "diproses" sesuai `start`→`finish` nyata; penghitung makespan berhenti di nilai JSON. Scrubber + Jeda.
- **A11y:** tiap rak = daftar dengan `aria-label`; pemindahan diumumkan ("Peti 5 ke rak 3. Makespan 41,2 detik."). Reduced motion → keadaan akhir + scrubber manual.
- **KP:** (1) tidak ada peti hilang/ganda setelah pemindahan berulang (uji invarian); (2) makespan Tantang = `evaluateAssign`; (3) pada ≥ 95% seed uji AOA ≤ Random; (4) replay: akhir peti terakhir = `makespan` di JSON untuk kedua sisi, skala waktu sama; (5) dapat dipakai dengan sentuh, mouse, keyboard.

## V3 — Kode ↔ Visual (`viz/code/` + `sections/alur`, `sections/eksperimen`)
- **Data:** `public/data/raw/AOASchedulingSim.java` (di-fetch sekali), nomor baris ditemukan otomatis dari nama metode (`runAOA`, `evaluateAssign`, `simulate`, `hitungMetrik`, `generateDataset`) — **jangan hardcode nomor baris**.
- **Perilaku:** layout dua kolom; kiri kode (sticky, prism-react-renderer, nomor baris, tombol salin); kanan panel visual. GSAP ScrollTrigger membagi bab menjadi "pijakan"; tiap pijakan menyorot rentang baris, menampilkan 1 kalimat, dan mengganti visual:
  `generateDataset` → histogram panjang MI; `runAOA` → V1; `evaluateAssign` → bar beban VM; `simulate` → V2 replay; `hitungMetrik` → enam meteran + rumus (KaTeX).
- **Nilai variabel hidup (bab 5):** satu agen dipilih; panel kecil di samping kode menampilkan r1, r2, r3, MOA, MOP, operator terpilih untuk gen itu, dihitung dari engine.
- **A11y:** daftar pijakan juga tersedia sebagai tombol "langkah berikutnya/sebelumnya"; kode dapat dipilih/disalin.
- **KP:** (1) baris yang disorot benar-benar baris metode tersebut (uji: cari nama metode); (2) tanpa lompatan layout saat berganti visual; (3) mobile: kode di atas, visual di bawah (tidak sticky), tetap berfungsi.

## V4 — Jalur Implementasi (`viz/pipeline/`)
- **Stasiun (7):** `Dataset` (generateDataset → dataset_N.csv) → `AOA` (runAOA) → `Bind` (bindCloudletToVm) → `CloudSim` (startSimulation) → `Metrik` (hitungMetrik) → `CSV/JSON` (hasil_per_run.csv → csv_to_json.py) → `Situs` (halaman ini).
- **Perilaku:** SVG jalur; paket data (titik berwarna netral + label ukuran) mengalir antar stasiun; klik stasiun membuka laci: nama berkas, potongan kode (diambil dari Java), **baris data nyata** (mis. 3 baris pertama `dataset_100.csv`, satu baris `hasil_per_run.csv`, 3 baris terakhir `output_simulasi.txt`) dari `public/data/raw/`.
- **KP:** (1) semua potongan/baris dari berkas asli (tidak diketik); (2) laci dapat dibuka dengan keyboard; (3) tanpa animasi saat reduced motion (paket statis di tiap stasiun).

## V5 — Penjelajah Hasil (`viz/charts/` + `sections/hasil`)
- **Data:** `hasil_ringkasan.json`, `hasil_per_run.json`, `konvergensi_aoa.json`, `config.json`.
- **Metrik:** 6 *small multiples* (grid 3×2 desktop, 1 kolom ponsel); klik satu untuk membesar. Batang berkelompok 4 ukuran × 2 algoritma tumbuh saat masuk layar; error bar = std; titik tiap run (saklar); badge selisih dihitung dari rata-rata (↓/↑ sesuai arah metrik).
  AOA `--alg-aoa`, Random `--alg-random` **dan** pola diagonal untuk Random (tidak bergantung warna). Saklar "tampilkan: AOA | Random | keduanya" menganimasikan transisi.
- **Konvergensi:** pilih N; garis mean + pita ±std; **anotasi otomatis** pada iterasi penurunan mean terbesar dan pada titik mulai mendatar (definisi: iterasi pertama setelah puncak di mana selisih 20 iterasi < 0,1% dari rentang total). Teks anotasi mengaitkan ke bab 4.
- **Kejujuran:** callout "Utilisasi VM = RUR CPU"; stempel "Hasil CloudSim 7.0.1"; "pembanding: Random Scheduling"; "rata-rata 10 run".
- **A11y:** tabel data setara ("lihat tabel") untuk tiap grafik; fokus keyboard pada batang; `<desc>` SVG.
- **KP:** (1) nilai grafik = tabel = JSON (uji kecil otomatis); (2) formatting id-ID; (3) anotasi dihitung, bukan diketik; (4) nilai awal/akhir konvergensi di teks alternatif.

---

# Komponen bab

## C1 — Hero "Layar Menyala" (`sections/mulai`)
LCD menampilkan ekspresi bergilir yang dibangkitkan dari `applyOperator` (nilai asli, bukan karangan); empat keycap melayang. Klik keycap → `scrollIntoView('#empat-tombol')` dengan operator terpilih (state Zustand `selectedOperator`).
**KP:** tanpa loop animasi saat reduced motion; CLS 0; keycap dapat diaktifkan Enter/Space; terbaca di 390 px.

## C2 — Peta Metaheuristik (`sections/kenalan`)
Peta 2 sumbu; kartu SA, GA, PSO, AOA dapat diseret/difokus (panah menggeser); kartu AOA menyala; kawanan mini V1 sebagai latar (dekoratif, `aria-hidden`).
Label wajib "posisi pendekatan, bukan peringkat". Referensi di laci. **KP:** keyboard dapat memindahkan kartu; tidak ada klaim performa.

## C3 — MOA/MOP (`sections/pengatur`)
Grafik SVG MOA(t) (garis `--ink`) dan MOP(t) (`--ink-2` putus-putus), label langsung; penggeser t terhubung ke riwayat V1; batang peluang eksplorasi (1−MOA) vs eksploitasi (MOA); slider α (1–10), μ (0,1–1), T (50–1000) menjalankan ulang V1 dengan parameter baru.
**KP:** kurva = `moa()`/`mop()` engine; t=T menampilkan MOP=0; geser t memutar keadaan V1 identik; keyboard (panah).

## C4 — Dari Angka ke Jadwal (`sections/jadwal`)
Agen 8 cloudlet/4 VM: baris vektor x (angka dapat diedit/digeser), baris `floor`, chip VM, bar beban tiap VM, `makespan_est`, `LBI_est`, `F` (`evaluateAssign`); nilai di luar [0, M) di-clamp dan ditandai.
**KP:** F = engine; tooltip "mengapa dibagi 0,25"; perubahan 1 slider memperbarui semua ≤ 16 ms.

## C5 — Laboratorium (`sections/laboratorium`)
- Dataset: 100/200/500/1000 asli (`datasets.json`) atau acak (N & seed). Kontrol: populasi 10–100, iterasi 50–1000, α, μ, seed. Jalankan/Jeda/Reset. Worker: `createAoaWorker`.
- Panel: konvergensi hidup (+ garis batas bawah + garis rata-rata Random); bar beban VM + garis rata-rata; area bertumpuk operator terpakai (4 warna operator, hangat di bawah); LCD (makespan est., rasio ke batas bawah, LBI, iterasi, ms).
- Stempel "Estimasi di browser" + catatan beda dengan CloudSim. Tautan ke bab Hasil.
- **A11y:** ringkasan `aria-live` tiap 10 iterasi; kontrol terkunci sesuai kebutuhan.
- **KP:** (1) UI responsif untuk N=1000/pop 50/iter 500 (kerja di Worker); (2) seed sama → hasil identik; (3) rata-rata 10 seed ≈ `hasil_ringkasan.json` (paritas); (4) Jeda/Reset menghentikan worker tanpa kebocoran; (5) fallback bila Worker tak tersedia; (6) dimuat malas.

## C6 — Kartu Eksperimen (`sections/eksperimen`)
Selain V4: rak VM (MIPS), batang komposisi dataset per ukuran, tabel parameter AOA, 6 kartu metrik yang dapat di-flip (depan: nama+satuan+arah; belakang: rumus KaTeX dari `config.metrics` + arti satu kalimat).
**KP:** flip dengan keyboard; rumus = `config.json`; tanpa angka diketik.

## C7 — Temuan (`sections/analisis`)
Enam kartu (3 kekuatan, 3 keterbatasan; `docs/04` §6) dengan chip "bukti" yang men-scroll dan menyalakan visual V5/V2 terkait. Persentase di kartu dihitung dari JSON.
**KP:** semua chip bukti berfungsi; tanpa superlatif; keterbatasan setara mencolok dengan kekuatan.

## C8 — Mode Presentasi (`components/Presenter.tsx`)
`P` masuk/keluar; bab = satu layar dengan snap; ←/→/PgUp/PgDn/Spasi pindah; `N` catatan + pewaktu total & per bab (dari `sections/<bab>/notes.ts`); `F` fullscreen; `T` tema; `?` bantuan; progres di hash.
**KP:** pintasan nonaktif saat fokus di input/slider/kode; fokus pindah ke judul bab baru; pewaktu dapat di-reset; semua fungsi tersedia tanpa pintasan.

## C9 — Penutup & Bukti (`sections/penutup`)
Penampil kode Java penuh (reuse `viz/code/`) dengan lompat ke metode; daftar unduhan dari `public/data/raw/*` (nama, deskripsi, ukuran); kredit; referensi; tautan repo.
**KP:** semua tautan relatif & hidup di GitHub Pages; tombol salin memberi umpan balik; terbaca terang/gelap.

## C10 — Kerangka (`components/Shell.tsx` — sudah ada)
Rel navigasi 12 bab, pengalih tema, "lompat ke konten". Tambahan: bilah progres, transisi antarbab, footer kredit + lisensi pustaka.
**KP:** `#bab` bekerja saat muat ulang & Back; tanpa skrol horizontal pada 320 px.

---

## Stretch (setelah semua KP lolos)
- **S1** Datacenter 3D (three.js, dimuat malas, fallback ke isometrik 2D).
- **S2** Bunyi klik keycap (default mati).
- **S3** Mode adu seed Tantang AOA (lokal).
- **S4** Gaya cetak `@media print` + gambar OG 1200×630 untuk berbagi.
- **S5** Bab 2 dan 3 versi English.
- **S6** "Bandingkan parameter": dua Lab berdampingan (mis. α=3 vs α=8) dengan seed sama.
