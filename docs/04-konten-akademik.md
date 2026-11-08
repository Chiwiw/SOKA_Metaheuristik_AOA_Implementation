# 04 — Konten Akademik (sumber kebenaran isi)

Semua teks penjelasan di situs harus konsisten dengan dokumen ini. Butir bertanda **[VERIFIKASI]** harus dicek manusia
terhadap paper asli sebelum dipublikasikan; jangan dinyatakan sebagai fakta mutlak sebelum itu.

## 1. Referensi

- Abualigah, L., Diabat, A., Mirjalili, S., Abd Elaziz, M., & Gandomi, A. H. (2021). *The Arithmetic Optimization Algorithm.*
  Computer Methods in Applied Mechanics and Engineering, 376, 113609. **[VERIFIKASI: penulis, volume, nomor artikel, DOI]**
- Calheiros, R. N., Ranjan, R., Beloglazov, A., De Rose, C. A. F., & Buyya, R. (2011). *CloudSim: a toolkit for modeling and simulation of cloud
  computing environments and evaluation of resource provisioning algorithms.* Software: Practice and Experience, 41(1), 23–50. **[VERIFIKASI]**
- Proposal kelompok (Tugas 3): Hybrid GA-SA untuk penjadwalan — dirujuk sebagai kelanjutan, bukan bagian eksperimen ini.

## 2. Ide inti AOA (bahasa sederhana)

- AOA adalah algoritma **metaheuristik berbasis populasi**: banyak kandidat solusi ("agen") dicari bersama, tanpa gradien.
- Terinspirasi **empat operator aritmetika**: perkalian (×) dan pembagian (÷) membuat lompatan besar → **eksplorasi**;
  penjumlahan (+) dan pengurangan (−) membuat langkah halus → **eksploitasi**.
- Dua pengendali:
  - **MOA** (Math Optimizer Accelerated) menentukan *fase*: makin besar, makin condong ke eksploitasi.
  - **MOP** (Math Optimizer Probability) menentukan *panjang langkah*: mengecil seiring iterasi.
- Awalnya agen tersebar acak; tiap iterasi agen diperbarui **relatif terhadap solusi terbaik sejauh ini**.

## 3. Rumus (yang dipakai di kode; sama persis dengan `AOASchedulingSim.java` dan `web/src/engine/`)

Iterasi `t = 1..T`, `T = maxIter`. Batas pencarian `LB = 0`, `UB = M − 10⁻⁹` (M = jumlah VM).

$$MOA(t) = MOA_{min} + t\cdot\frac{MOA_{max}-MOA_{min}}{T},\quad MOA_{min}=0{,}2,\; MOA_{max}=1$$

$$MOP(t) = 1 - \frac{t^{1/\alpha}}{T^{1/\alpha}},\quad \alpha = 5$$

Untuk tiap agen $i$, tiap dimensi $j$, ambil tiga bilangan acak seragam $r_1, r_2, r_3 \in [0,1)$ dan
$s = (UB-LB)\,\mu + LB$ dengan $\mu = 0{,}5$:

| Kondisi | Fase | Operator | Pembaruan posisi $x_{ij}$ |
|---|---|---|---|
| $r_1 > MOA$, $r_2 > 0{,}5$ | eksplorasi | pembagian (÷) | $\dfrac{best_j}{MOP+\varepsilon}\cdot s$ |
| $r_1 > MOA$, $r_2 \le 0{,}5$ | eksplorasi | perkalian (×) | $best_j \cdot MOP \cdot s$ |
| $r_1 \le MOA$, $r_3 > 0{,}5$ | eksploitasi | pengurangan (−) | $best_j - MOP \cdot s$ |
| $r_1 \le MOA$, $r_3 \le 0{,}5$ | eksploitasi | penjumlahan (+) | $best_j + MOP \cdot s$ |

Lalu hasil dipotong ke $[LB, UB]$ (*clamp*). Solusi terbaik global diperbarui bila fitness agen lebih kecil.

Catatan penulisan: pada paper, arah ketidaksamaan untuk $r_2$ dan $r_3$ bisa tertulis berbeda dari kode (mis. `< 0,5`).
Karena $r$ seragam di [0,1), kedua konvensi setara secara statistik. Di situs, tulis rumus seperti tabel ini dan sebutkan "sesuai implementasi kami".
**[VERIFIKASI: nilai default paper untuk α dan μ; implementasi kami memakai α = 5, μ = 0,5.]**

Perilaku yang menjelaskan hasil (boleh diceritakan, bersumber dari rumus):
- Pada awal iterasi, MOP besar → langkah ÷ dan × sangat besar; setelah di-*clamp*, nilai menumpuk di batas atas/bawah → agen praktis acak. Ini fase eksplorasi.
- Makin besar $t$, MOA naik (eksploitasi makin sering) dan MOP turun (langkah makin kecil). Pada iterasi akhir MOP → 0 sehingga agen praktis sama dengan solusi terbaik.
- Agen **tidak** diperbarui relatif terhadap posisinya sendiri, melainkan terhadap `best`. Akibatnya populasi cepat mengerucut di sekitar solusi terbaik.

## 4. Dari AOA kontinu ke penjadwalan diskret (inti implementasi kami)

- Satu agen = vektor panjang N (jumlah cloudlet): $x_j \in [0, M)$.
- **Decoding:** cloudlet $j$ dijalankan di VM `floor(x_j)` (dibatasi ke 0..M−1).
- **Fungsi objektif (diminimalkan), dihitung secara analitik:**
  $$F = 0{,}7\cdot\frac{makespan_{est}}{LB_{teoretis}} + 0{,}3\cdot\frac{LBI_{est}}{0{,}25}$$
  - $makespan_{est} = \max_v \sum_{j\to v} length_j / MIPS_v$ (semua cloudlet dikirim bersamaan, antrean FIFO per VM).
  - $LB_{teoretis} = \sum length / \sum MIPS$ (batas bawah makespan jika beban terbagi sempurna).
  - $LBI_{est}$: variansi $u_v = load_v / makespan_{est}$ antar VM; dibagi 0,25 (variansi maksimum untuk nilai di [0,1]).
  - Bobot 0,7/0,3 adalah pilihan kelompok. Jangan klaim bobot ini "optimal".
- Hasil akhir **tidak** dihitung dari rumus, tetapi dari **simulasi CloudSim** (penugasan terbaik dibind ke VM lewat broker, lalu semua metrik diukur dari waktu mulai/selesai nyata).
  Selisih makespan simulasi vs estimasi analitik ≤ 0,05% (cek di kolom `makespan_estimasi_s` vs `makespan_s`).

### Pseudocode (versi presentasi)

```
Inisialisasi populasi X (50 agen), tiap x_j acak di [0, M)
Evaluasi semua agen -> catat best
untuk t = 1 sampai T:
    hitung MOA(t), MOP(t)
    untuk tiap agen i, tiap dimensi j:
        ambil r1, r2, r3
        jika r1 > MOA:                      # eksplorasi
            jika r2 > 0,5: x = best_j / (MOP + eps) * s     # ÷
            selain itu:    x = best_j * MOP * s             # ×
        selain itu:                         # eksploitasi
            jika r3 > 0,5: x = best_j - MOP * s             # −
            selain itu:    x = best_j + MOP * s             # +
        potong x ke [LB, UB]
    evaluasi agen; perbarui best bila lebih baik
kembalikan best -> decode -> penjadwalan cloudlet ke VM
```

## 5. Setup eksperimen (fakta tetap; sumber: `web/public/data/config.json`)

- Simulator: CloudSim 7.0.1. 1 datacenter, 1 host, **4 VM × 1 vCPU** (1000, 1500, 2000, 2500 MIPS) → total 4 vCPU. Scheduler VM: `CloudletSchedulerSpaceShared`.
- Dataset **sintetis**, dibangkitkan dengan seed tetap (2026 + N): 50% cloudlet kecil (2.000–10.000 MI), 35% sedang (10.000–40.000), 15% besar (40.000–120.000). Ukuran: 100, 200, 500, 1000. Semua dikirim sekaligus.
- Tiap ukuran dijalankan **10 kali** (seed berbeda), dilaporkan rata-rata ± simpangan baku sampel. Pembanding: Random Scheduling pada dataset dan seed-skema yang sama.
- AOA: populasi 50, 500 iterasi, α=5, μ=0,5, MOA ∈ [0,2; 1].

### Enam metrik (definisi dari penugas; jangan diubah)

| Metrik | Rumus | Satuan | Arah |
|---|---|---|---|
| Makespan | T = max(finish) − min(start) | detik | lebih rendah lebih baik |
| Utilisasi VM | 100 × mean(u_v), u_v = Δbusy / Δtotal CPU | % | lebih tinggi lebih baik |
| Throughput | task sukses / T | task/detik | lebih tinggi lebih baik |
| Waktu respons rata-rata | mean(finish − submit) | detik | lebih rendah lebih baik |
| Load Balancing Index | mean((u_v − mean(u))²) | tanpa satuan | 0 = seimbang |
| RUR CPU | 100 × Σ(CPU seconds task) / (4 × T) | % | lebih tinggi lebih baik |

**Catatan wajib tampil:** pada konfigurasi ini (setiap VM 1 vCPU) *Utilisasi VM* dan *RUR CPU* bernilai identik karena keduanya
sama-sama "CPU terpakai dibagi 4·T". Tampilkan keduanya, tetapi jangan sajikan sebagai dua bukti independen.

## 6. Temuan (rujukan narasi; ANGKA tetap dibaca dari JSON, jangan diketik)

Per hasil run pada `web/public/data` (dihitung dari `hasil_ringkasan.json`, rata-rata 10 run):

| N | Makespan AOA | Makespan Random | Turun | AOA / batas bawah | Util. AOA | Util. Random |
|---|---|---|---|---|---|---|
| 100 | ≈ 336,9 s | ≈ 565,6 s | ≈ 40,4% | ≈ 1,008 | ≈ 99,2% | ≈ 67,2% |
| 200 | ≈ 746,0 s | ≈ 1251,4 s | ≈ 40,4% | ≈ 1,013 | ≈ 98,8% | ≈ 67,6% |
| 500 | ≈ 1812,2 s | ≈ 3049,0 s | ≈ 40,6% | ≈ 1,064 | ≈ 94,1% | ≈ 63,7% |
| 1000 | ≈ 3656,0 s | ≈ 5784,6 s | ≈ 36,8% | ≈ 1,097 | ≈ 91,7% | ≈ 64,8% |

Tabel ini hanya untuk orientasi penulis narasi. Di situs, semua dihitung dari JSON.

Hal yang **boleh** ditekankan:
1. AOA menurunkan makespan sekitar 37–41% dibanding Random di keempat ukuran; LBI mendekati 0 pada N kecil.
2. Pada N=100 AOA hanya ±1% di atas batas bawah teoretis — hampir seimbang sempurna.
3. Variasi antar-run AOA jauh lebih kecil daripada Random (lihat simpangan baku) → hasil lebih dapat diandalkan.

Hal yang **wajib jujur** disampaikan (bab Analisis):
1. **Kualitas turun saat N membesar:** AOA/batas bawah naik dari ±1,008 ke ±1,097; utilisasi turun dari ±99% ke ±92%. Ruang pencarian membesar, sementara iterasi dan populasi tetap.
2. **Konvergensi mandek:** kurva fitness turun tajam di sekitar iterasi 45–60 lalu hampir datar sampai ±iterasi 400 (cek angka persis dari `konvergensi_aoa.json`). Ini sifat AOA murni: setelah fase eksplorasi, populasi mengerucut di sekitar `best` sehingga sedikit peluang menemukan perbaikan.
3. **Waktu respons rata-rata tidak banyak membaik** (±9–13% saja, bandingkan dengan makespan ±37–41%): AOA mengoptimalkan makespan/keseimbangan, bukan urutan antrean FIFO. Mengurutkan antrean (mis. tugas pendek dulu) adalah jalur perbaikan terpisah.
4. Waktu komputasi AOA naik dengan N (±0,3 s → ±2 s per run) — tidak signifikan untuk skala ini, tetapi bukan nol.
5. Pembanding hanya Random Scheduling. Perbandingan dengan GA, SA, atau Hybrid GA-SA (proposal Tugas 3) adalah pekerjaan lanjutan.

Arah perbaikan yang boleh disebut sebagai *usulan* (bukan hasil): menaikkan populasi/iterasi, hibridisasi dengan pencarian lokal atau SA/GA, penggantian
agen secara greedy, serta optimasi urutan antrean.

## 7. Glosarium (gunakan konsisten)

- **Cloudlet**: satu tugas/pekerjaan; panjangnya dalam MI (juta instruksi).
- **VM**: mesin virtual penerima tugas; kecepatan dalam MIPS.
- **Makespan**: waktu dari tugas pertama mulai sampai tugas terakhir selesai.
- **Eksplorasi / eksploitasi**: menjelajah area baru / memperhalus area yang sudah menjanjikan.
- **Agen**: satu kandidat solusi dalam populasi.
- **Metaheuristik**: kerangka pencarian umum yang tidak menjamin optimum global, tetapi efektif untuk masalah NP-hard seperti penjadwalan.
