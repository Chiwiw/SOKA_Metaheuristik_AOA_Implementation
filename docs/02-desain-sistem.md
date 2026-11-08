# 02 — Sistem Desain: "Mesin Hitung Awan"

Nilai konkret (warna, ukuran, gerak) ada di `web/src/styles/tokens.css` — itu sumber tunggal. Dokumen ini menjelaskan **maksud** dan **aturan pemakaian**.

## 1. Bahasa visual

Tiga metafora yang selalu hadir bersama:
1. **Kertas milimeter** (latar): buku catatan insinyur; menandakan "di sini kita menghitung".
2. **Kalkulator** (komponen): tombol 3D (`.keycap`) yang turun saat ditekan, layar LCD (`.lcd`) untuk angka penting.
3. **Awan** (konteks): biru langit lembut, bentuk bulat, VM digambarkan sebagai rak/kotak di awan. Awan dipakai hemat (aksen, bukan dekorasi di mana-mana).

Kesan akhir: hangat, analog, cermat — kontras dengan dashboard biru-ungu generik. Hindari: gradien ungu-biru, kartu kaca (glassmorphism), ikon stok yang seragam, bayangan berlebihan.

## 2. Peta warna (aturan penggunaan)

| Peran | Token | Boleh dipakai untuk | Dilarang |
|---|---|---|---|
| Latar | `--paper`, `--paper-2/3` | Latar halaman, kartu, permukaan tombol netral | — |
| Teks | `--ink`, `--ink-2` | Semua teks | Teks kecil dengan warna operator |
| Operator × | `--op-mul` (jingga-merah) | Tombol/glyph ×, lompatan perkalian, batang "× dipakai" | Hal selain perkalian |
| Operator ÷ | `--op-div` (amber) | Tombol/glyph ÷, lompatan pembagian | Teks kecil di atas kertas (kontras rendah) |
| Operator + | `--op-add` (teal) | Tombol/glyph +, langkah penjumlahan | Status "sukses" umum (pakai `--good`) |
| Operator − | `--op-sub` (indigo) | Tombol/glyph −, langkah pengurangan | — |
| AOA | `--alg-aoa` (biru langit) | Seri data AOA di semua grafik | Dipakai sebagai warna operator |
| Random | `--alg-random` (terakota) | Seri data Random di semua grafik | — |
| LCD | `--lcd-bg`, `--lcd-ink` | Angka ringkas penting, ekspresi hero | Paragraf panjang |
| Status | `--good`, `--warn` | Lencana "dalam batas", peringatan | Menggantikan warna seri |

Makna warna operator: **hangat (× ÷) = eksplorasi, dingin (+ −) = eksploitasi**. Setiap legenda yang menjelaskan fase harus memakai pengelompokan ini.
Kategori cloudlet (kecil/sedang/besar) **tidak** memakai warna operator; bedakan dengan *ukuran* dan *pola* (garis tipis, titik, kosong) dalam nada `--paper-3`/`--ink-2` agar tidak bentrok makna.
Jangan mengandalkan warna saja: setiap seri/kategori juga punya bentuk atau label.

## 3. Tipografi

| Peran | Font | Catatan |
|---|---|---|
| Judul/hero | **Fraunces** (variable) | Serif berkarakter; pakai berat 600–800 dan opsi `SOFT`/`WONK` rendah untuk kehangatan |
| Isi | **DM Sans** | Terbaca di proyektor; ukuran dasar `--step-0` |
| Angka & kode | **JetBrains Mono** | Semua angka LCD, rumus inline kode, tabel angka (`font-variant-numeric: tabular-nums`) |

Self-host woff2 (subset Latin, gunakan `unicode-range` bila perlu). Fallback stack sudah ada di token. Skala: `--step--1 … --step-4`. Panjang baris teks ≤ `--measure` (68ch).
Font dibundel lewat `@fontsource-variable/*` (tanpa CDN). Rumus memakai KaTeX (paket npm, dimuat malas).

## 4. Tata letak

- Satu halaman, bab-bab penuh lebar dengan kolom konten maks `--page-max` (1180 px). Di mode presentasi tiap bab = tinggi layar (`min-height: 100svh`).
- Grid 12 kolom (desktop), 4 kolom (ponsel). Komponen interaktif besar boleh "keluar" dari kolom teks sampai lebar penuh.
- Rel navigasi: titik progres vertikal di kiri (desktop) / bilah progres atas (ponsel), menandai 12 bab dengan nama saat hover/fokus.
- Ritme: bab selang-seling antara latar kertas milimeter (`.paper-grid`) dan kertas polos `--paper-2` agar mata beristirahat.
- Breakpoint acuan: 640, 960, 1280. Uji wajib 390, 1024, 1920 px, dan 1280×720 (proyektor).

## 5. Komponen dasar

- **Keycap** (`.keycap`): 3D; `data-op="mul|div|add|sub"` mewarnai; `aria-pressed` bila toggle. Target sentuh ≥ 48 px.
- **LCD** (`.lcd`): angka tabular; segmen "mati" `88888` samar di belakang angka aktif (`--lcd-ghost`); animasi hitung-naik saat nilai berubah (matikan saat reduced motion).
- **Kartu** (`--radius-card`, `--shadow-card`): permukaan `--paper-2`, garis `--line`. Judul kartu serif kecil.
- **Lencana bukti** ("bukti" chip): pil kecil bergaya label cetak; mengarah ke grafik yang menjadi dasar klaim.
- **Slider**: jalur seperti penggaris dengan tanda skala; gagang berbentuk keycap kecil.
- **Grafik**: SVG buatan sendiri (d3-scale/d3-shape hanya untuk matematika skala/bentuk); sumbu bergaya kertas milimeter, garis 1,5–2 px, label langsung (bukan hanya legenda), tooltip dapat difokus lewat keyboard.

## 6. Gerak

Prinsip: gerak **menjelaskan**, bukan menghias.
- **Tekan** (140 ms, `--ease-press`): tombol turun & kembali; angka LCD menghitung naik.
- **Reveal** saat scroll: elemen muncul dengan geser 12–16 px + fade (320 ms); satu kali, tidak berulang.
- **Operator**: agen di garis bilangan berpindah dengan interpolasi 500–700 ms; lompatan besar (÷ ×) melengkung (arc), langkah halus (+ −) lurus pendek — bentuk lintasan sendiri sudah menjelaskan eksplorasi vs eksploitasi.
- **Gantt putar ulang**: bar tumbuh sesuai waktu simulasi (dapat dipercepat 1×–50×).
- Hormati `prefers-reduced-motion`: ganti animasi dengan keadaan akhir + transisi opasitas singkat; semua informasi tetap tersedia.
- Anggaran: animasi hanya `transform`/`opacity`; jangan menganimasikan layout.

## 7. Elemen khas (identitas)

- **Glyph operator besar** (× ÷ + −) sebagai ornamen bab: dipakai sebagai nomor bab, penanda bagian, dan latar samar.
- **Garis ukur** di tepi bab (seperti penggaris) yang berubah mengikuti progres scroll.
- **Awan kecil** sebagai penanda "ini kembali ke dunia cloud" pada bab 1, 8, 9.
- **Stempel "Hasil CloudSim"** (bulat, bergaya cap) pada elemen yang datang dari simulasi resmi vs **stempel "Estimasi di browser"** pada Laboratorium — pembeda tegas antara dua sumber angka.
- Opsional (stretch): bunyi "klik" halus saat tombol ditekan; **default mati**, ada pengalih jelas, tidak pernah otomatis.

## 8. Mode terang & gelap

Terang = "Kertas Milimeter" (default bila sistem terang). Gelap = "Malam Lab": papan tulis gelap, LCD berpendar hijau fosfor.
Keduanya harus diuji kontras. Tombol tema (`T`) menyimpan pilihan di `localStorage` bila tersedia (dengan try/catch); jika tidak, ikut sistem.

## 9. Ikonografi & ilustrasi

- Semua ilustrasi SVG inline dengan `role="img"` + `<title>`; dekoratif memakai `aria-hidden="true"`.
- VM = kotak rak dengan lampu LED kecil dan label MIPS. Cloudlet = balok berwarna netral dengan lebar proporsional MI.
- Hindari gambar bitmap; bila perlu (OG image), buat satu gambar 1200×630 tema yang sama.

## 10. Metadata & berbagi

`<title>`, deskripsi, `theme-color` (ikut tema), favicon SVG (tombol "÷" kecil), Open Graph/Twitter card dengan gambar 1200×630, `lang="id"`.

## 11. Gaya visual khas (V1–V5; spesifikasi perilaku di `docs/03`)

- **Arena Kawanan:** lanskap peta panas bernada `--paper-3` → `--sky` (netral, agar warna operator menonjol). Agen = titik tinta `--ink`; `best` = bintang kecil bergaris tebal. Jalur-L dua warna operator, ketebalan 2 px, ujung bulat, jejak memudar 600 ms.
- **Datacenter:** isometrik 30°, rak bernada `--paper-2` dengan garis `--ink`, lampu LED kecil (hijau `--good` = idle, `--warn` = sibuk). Peti netral dengan pola per kategori. Awan bulat lembut `--sky` di latar (statis, tidak bergerak berlebihan).
- **Kode:** latar `--paper-2`/`--lcd-bg` bergantian bergantung tema; sorotan baris memakai garis kiri tebal berwarna `--ink` + latar transparan, **bukan** warna operator.
- **Jalur Implementasi:** stasiun = kotak keycap besar; paket = titik tinta; jalur = garis putus-putus yang bergerak pelan (statis bila reduced motion).
- **Kepadatan teks:** judul serif besar, tagline satu baris, selebihnya visual. Ruang kosong disengaja; jangan mengisinya dengan paragraf.
- **Momen kejutan kecil** (pilih secukupnya, jangan berlebihan): LCD "meluap" jika pembaca mengalahkan AOA di Tantang; keycap berbunyi klik (opsional, default mati); kawanan hero bereaksi pada pointer.

