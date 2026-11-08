# 01 — Narasi & Struktur (versi visual-first)

## Konsep: "Mesin Hitung Awan"

> Sebuah kalkulator raksasa yang menghitung jalan menuju jadwal terbaik untuk tugas-tugas di awan.

AOA terinspirasi empat operator hitung; cloud computing adalah "awan". Seluruh situs adalah **kalkulator yang hidup**: layar LCD, tombol 3D, kertas milimeter.
Empat operator × ÷ + − jadi motif dan kode warna (hangat = eksplorasi, dingin = eksploitasi).

**Pembaca tidak membaca algoritma, mereka menontonnya bekerja lalu menekan tombolnya.** Tiga benang cerita yang dijalin sepanjang halaman:

1. **Cara kerja** — kawanan agen bergerak di lanskap; operator terlihat; fase berganti dari melompat ke menyempurnakan.
2. **Implementasi** — kode Java asli ↔ visual yang sedang dijalankannya; jalur dataset → AOA → CloudSim → metrik → CSV → situs ini.
3. **Bukti** — balapan Random vs AOA di datacenter berdasarkan log CloudSim nyata, enam metrik, kurva konvergensi, dan keterbatasan.

## Visual khas (signature) — jantung situs

Lima visual ini dibangun sekali lalu dipakai ulang di banyak bab. Spesifikasi rinci di `docs/03`.

| Kode | Nama | Ide | Dipakai di bab |
|---|---|---|---|
| **V1** | **Arena Kawanan** | Lanskap 2D (peta panas). 40 agen AOA bergerak; tiap langkah digambar sebagai jalur-L dua warna: komponen X berwarna operator gen-X, komponen Y berwarna operator gen-Y. Bintang = solusi terbaik. Eksplorasi tampak sebagai lompatan panjang, eksploitasi sebagai langkah kecil menyempit. Efek *clamp* (agen menempel di tepi) terlihat jelas dan diberi anotasi | 2, 3, 4, 5 |
| **V2** | **Datacenter Isometrik** | 4 rak server (tinggi ∝ MIPS), tugas = peti (lebar ∝ MI) di ban berjalan. Pembaca menjatuhkan peti ke rak (Tantang AOA); atau menonton **replay log CloudSim nyata** AOA vs Random berdampingan, dengan penghitung makespan | 1, 8, 9 |
| **V3** | **Kode ↔ Visual** | Kode Java asli di kiri (sticky), panel visual di kanan. Saat menggulir, baris kode yang sedang dibahas menyala dan visual berubah: `generateDataset` → histogram; `runAOA` → kawanan; `evaluateAssign` → bar beban VM; `simulate` → replay datacenter; `hitungMetrik` → enam meteran menyala dengan rumusnya | 5, 8 |
| **V4** | **Jalur Implementasi** | Diagram jalur 7 stasiun dengan paket data mengalir: Dataset → AOA → Bind → CloudSim → Metrik → CSV → Situs. Klik stasiun → laci berisi nama berkas, potongan kode, dan **baris data nyata** | 8 |
| **V5** | **Penjelajah Hasil** | Enam metrik sebagai "small multiples" yang bergerak (batang tumbuh, error bar, titik tiap run), saklar AOA/Random, balapan Gantt, kurva konvergensi beranotasi otomatis | 9, 10 |

Bab 7 (Laboratorium) menggabungkan visual bergaya V1 (beban VM + operator + konvergensi) dengan **AOA sungguhan di browser**.

## Alur bab

Durasi = rencana presenter (total ±21 menit; durasi dari dosen **belum diketahui** → tanyakan). Versi 15 menit: ringkas bab 5 dan 8 menjadi satu layar tiap bab.
**Teks tubuh ≤ 45 kata per layar.** Kolom "Momen khas" adalah hal yang harus diingat pembaca.

| # | id | Bab | Visual utama | Momen khas | Menit |
|---|---|---|---|---|---|
| 0 | `mulai` | Layar Menyala | LCD yang "menghitung" ekspresi, 4 keycap melayang | Tekan keycap → layar menggulir ke bab 3 dengan operator itu terpilih | 0,75 |
| 1 | `masalah` | Siapa Kerja di VM Mana? | **V2** mode Tantang AOA | Susun jadwalmu sendiri → LCD membandingkan dengan AOA & Random | 2,5 |
| 2 | `kenalan` | Kenalan dengan AOA | Peta Metaheuristik (2 sumbu) + kawanan mini V1 | Menyeret kartu algoritma di peta; kawanan hidup di latar | 1,5 |
| 3 | `empat-tombol` | Empat Tombol | **V1** mode operator | Tekan ×/÷/+/−: agen melompat, lintasan melengkung vs lurus | 2 |
| 4 | `pengatur` | Dua Pengatur | Kurva MOA/MOP terhubung ke **V1** | Geser waktu: Arena berubah dari "melompat" ke "menyempurnakan" seiring kurva | 2 |
| 5 | `alur` | Alur Lengkap | **V3** (bagian `runAOA`) | Satu iterasi diputar per baris kode | 1,5 |
| 6 | `jadwal` | Dari Angka ke Jadwal | Vektor x → `floor` → chip VM + bar beban | Geser satu x_j, jadwal & fitness berubah langsung | 1,5 |
| 7 | `laboratorium` | Laboratorium | Lab AOA sungguhan (Web Worker) | Jalankan N=1000 di browser sendiri, tonton beban VM menyeimbang | 2,5 |
| 8 | `eksperimen` | Eksperimen CloudSim | **V4** + **V3** (bagian simulasi & metrik) | Paket data mengalir; klik stasiun lihat baris data asli | 1,5 |
| 9 | `hasil` | Hasil | **V5** + replay **V2** | Balapan AOA vs Random dari log CloudSim nyata | 3 |
| 10 | `analisis` | Analisis & Keterbatasan | Kartu temuan + chip "bukti" | Klik bukti → grafik terkait menyala | 1,5 |
| 11 | `penutup` | Penutup & Bukti | Penampil kode + unduhan | Kode Java asli dengan lompat-ke-metode | 1 |

## Rincian bab (ringkas; teks di layar harus lebih pendek dari ini)

**0. Layar Menyala.** Judul serif besar. LCD menyala menampilkan ekspresi bergilir (`best × MOP`, `best − 0,37 × 2`). Keycap melayang pelan. Info kelompok kecil di pojok.

**1. Siapa Kerja di VM Mana?** Satu kalimat masalah. 14 peti + 4 rak. Bar makespan dengan garis batas bawah. Tombol *Serahkan ke AOA* menganimasikan peti berpindah ke susunan AOA.
Komentar LCD dinamis: "Kamu +12% dari batas bawah. AOA: +1,3%." (angka dihitung, bukan diketik). Detail "mengapa sulit" ($M^N$ kemungkinan) ada di laci "Lihat lebih dalam".

**2. Kenalan dengan AOA.** Peta: sumbu X "satu solusi ↔ populasi", sumbu Y "inspirasi alam ↔ inspirasi matematika/fisika". Kartu SA, GA, PSO, AOA dapat diseret; label "posisi pendekatan, bukan peringkat".
Satu kalimat: "AOA memakai empat operator hitung untuk menjelajah dan menyempurnakan." Referensi paper di laci.

**3. Empat Tombol.** V1 dalam mode operator: lanskap, `best` bintang, agen hantu. Empat keycap menerapkan operator; panjang lompatan dikendalikan slider MOP. Rumus operator aktif tampil di LCD (KaTeX).
Anotasi pada layar: "÷ dan × → lompat jauh (eksplorasi)", "+ dan − → langkah kecil (eksploitasi)", "menempel di tepi = clamp".

**4. Dua Pengatur.** Kurva MOA(t) & MOP(t) di bawah Arena; penggeser waktu t menggerakkan penanda dan memutar-ulang keadaan kawanan pada iterasi itu. Batang "peluang eksplorasi vs eksploitasi" berubah.
Slider α, μ. Pesan: "makin larut, langkah makin kecil dan makin sering menyempurnakan."

**5. Alur Lengkap.** V3 mode `runAOA`: sticky code + Arena. Tiap pijakan scroll = satu baris/blok: ambil r1,r2,r3 → pilih operator → hitung posisi → clamp → evaluasi → perbarui best. Satu agen disorot, nilai variabelnya tampil di samping kode (mis. r1 > MOA → eksplorasi).

**6. Dari Angka ke Jadwal.** Satu agen kecil: vektor angka → `floor` → chip VM → bar beban → fitness dengan rumus bernilai. Slider per dimensi. Tooltip: mengapa LBI dibagi 0,25.

**7. Laboratorium.** Kontrol ringkas (dataset, populasi, iterasi, seed) + Jalankan. Panel: konvergensi hidup (+ garis batas bawah & Random), bar beban VM, area operator terpakai, LCD (makespan estimasi, rasio ke batas bawah, LBI).
Stempel **"Estimasi di browser"** dan tautan "bandingkan dengan hasil CloudSim".

**8. Eksperimen CloudSim.** V4: jalur 7 stasiun; klik → laci (berkas, potongan kode, baris data nyata). Di bawahnya: rak VM (MIPS), komposisi dataset, parameter AOA, enam kartu metrik (flip → rumus).
Callout: "Utilisasi VM = RUR CPU pada konfigurasi ini."

**9. Hasil.** (a) Enam metrik small-multiples dengan saklar AOA/Random dan badge "turun X%" (dihitung). (b) Balapan datacenter dari `timeline_100.json`. (c) Konvergensi rata-rata ± std dengan anotasi otomatis.
Stempel **"Hasil CloudSim 7.0.1"**.

**10. Analisis & Keterbatasan.** Enam kartu: 3 kekuatan + 3 keterbatasan (lihat `docs/04` §6), masing-masing dengan chip "bukti" yang menyalakan visual terkait.

**11. Penutup & Bukti.** Tiga takeaway. Penampil kode Java dengan sorotan dan lompat ke `runAOA` / `evaluateAssign` / `hitungMetrik`. Unduhan dataset, `hasil_per_run.csv`, `output_simulasi.txt`. Referensi, kredit, tautan repo.

## Mode presentasi

`P` masuk/keluar (bab = satu layar, snap scroll) · ←/→ pindah bab · `N` catatan presenter + pewaktu per bab · `F` layar penuh · `T` tema · `?` daftar pintasan.
Catatan presenter per bab disimpan sebagai data di `sections/<bab>/notes.ts` (bukan di DOM), memuat poin bicara + anggaran waktu dari tabel di atas.

## Nada bahasa

Indonesia jernih dan hangat, sedikit jenaka. Kalimat pendek. Istilah teknis dipertahankan (makespan, cloudlet, fitness) dengan penjelasan satu baris saat pertama muncul.
Tanpa superlatif ("terbaik", "revolusioner").
