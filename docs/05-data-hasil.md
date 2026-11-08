# 05 — Kontrak Data & Spesifikasi Grafik

Semua berkas ada di `web/public/data/` dan dihasilkan oleh `tools/csv_to_json.py` dari folder `hasil_aoa/` milik simulasi Java. **Jangan edit manual.**
Memuat data: `useAppData()` / `loadAppData()` di `web/src/lib/data.ts` (bertipe, di-cache, URL relatif via `import.meta.env.BASE_URL`).

## 1. Berkas dan skema

| Berkas | Isi | Dipakai oleh |
|---|---|---|
| `config.json` | Konfigurasi eksperimen & definisi 6 metrik (ditulis tangan, sinkron dengan Java) | V2, C4, C5, C6 |
| `hasil_ringkasan.json` | Array 8 objek (2 algoritma × 4 ukuran): `algoritma`, `jumlah_cloudlet`, `runs`, lalu `<metrik>_mean` & `<metrik>_std` | V5, C7 |
| `hasil_per_run.json` | Array 80 objek (tiap run): `algoritma`, `jumlah_cloudlet`, `run`, `seed`, 6 metrik, `makespan_estimasi_s`, `fitness`, `waktu_komputasi_ms`, `task_sukses` | V5 (titik), uji paritas |
| `dataset_ringkasan.json` | Per ukuran: `total_mi`, `mean_mi`, `std_mi`, `min_mi`, `max_mi`, `n_kecil/sedang/besar`, `batas_bawah_makespan_s` | C6, C7, C5 (garis LB) |
| `datasets.json` | `{ "100": { "length_mi": [...], "kategori": [...] }, ... }` | C5 (Lab), V3 (histogram) |
| `konvergensi_aoa.json` | `{ "100": { "iterasi": [0..500], "mean": [...], "std": [...], "min": [...], "max": [...] }, ... }` (fitness terbaik per iterasi) | V5 (konvergensi) |
| `timeline_100.json` | `{ "aoa": [{id, vm, start, finish, mi}], "random": [...] }` hasil run-1 CloudSim | V2 (replay), V5 |
| `raw/*` | CSV asli, `output_simulasi.txt`, `AOASchedulingSim.java` | V3, V4, C9 (unduhan, penampil kode, baris data nyata) |

Nama metrik (kolom): `makespan_s`, `utilisasi_vm_pct`, `throughput_task_per_s`, `respons_rata2_s`, `lbi`, `rur_cpu_pct`, plus `waktu_komputasi_ms`.
Nilai `algoritma`: `"AOA"` dan `"Random"` (huruf persis). Std adalah simpangan baku sampel (n−1) dari 10 run.

## 2. Nilai turunan (hitung di kode, jangan diketik)

- Persentase penurunan: `100 * (1 - aoa_mean / random_mean)` untuk metrik berarah "turun"; untuk metrik "naik", tampilkan selisih poin persentase atau rasio, dengan label jelas.
- Rasio ke batas bawah: `makespan_s_mean / batas_bawah_makespan_s`.
- Iterasi penurunan terbesar (V5 konvergensi): argmax dari `mean[i-1] - mean[i]`.
- Pembulatan tampilan: makespan/respons 1 desimal, utilisasi/RUR 1 desimal, throughput 3 desimal, LBI 4 angka signifikan (pakai notasi ilmiah bila < 0,0001).
- Lokal: `new Intl.NumberFormat('id-ID', { maximumFractionDigits: k })` → koma desimal, titik ribuan.

## 3. Spesifikasi grafik (gaya seragam)

Semua grafik: SVG inline, `viewBox` responsif, latar transparan (kertas terlihat), garis kisi tipis `--grid-strong`, font `--font-mono` untuk angka sumbu, label sumbu & satuan dalam bahasa Indonesia.

| Grafik | Jenis | Sumbu X | Sumbu Y | Seri/warna | Catatan |
|---|---|---|---|---|---|
| Metrik (V5) | Batang berkelompok + error bar (±std) + titik tiap run (opsional) | Jumlah cloudlet (100, 200, 500, 1000; kategorikal) | Nilai metrik (mulai 0) | AOA `--alg-aoa`, Random `--alg-random` | Beri pola garis diagonal pada Random agar tidak bergantung warna; label langsung nilai mean di atas batang |
| Replay datacenter (V2) | Bar horizontal per jalur VM | Waktu (detik, skala sama di kedua panel) | 4 jalur VM (label MIPS) | Bar netral per kategori (ukuran/pola), garis makespan berwarna seri | Hover/fokus: id & MI |
| Konvergensi (V5) | Garis + pita | Iterasi (0–500) | Fitness terbaik (lebih rendah lebih baik) | `--alg-aoa` | Anotasi dihitung; skala Y tidak mulai 0 (jelaskan di sumbu) |
| Lab: konvergensi (C5) | Garis hidup | Iterasi | Fitness | `--alg-aoa` + garis putus LB dan Random | Update per frame, maks 60 fps |
| Lab: pemakaian operator (C5) | Area bertumpuk 100% | Iterasi | Proporsi | `--op-div`, `--op-mul`, `--op-sub`, `--op-add` | Urutan tumpukan hangat di bawah, dingin di atas |
| MOA/MOP (C3) | Dua garis | Iterasi | 0–1 | MOA = `--ink` garis penuh, MOP = `--ink-2` garis putus, dengan label langsung | MOA/MOP bukan operator, jadi **tidak boleh memakai warna operator** (aturan keras 10) |

Setiap grafik wajib menyediakan: judul, deskripsi teks alternatif (`<desc>`), tabel data setara yang dapat dibuka ("lihat tabel"), dan fokus keyboard pada titik/batang penting.

## 4. Kejujuran data (wajib terlihat di UI)

1. **Sumber angka:** stempel "Hasil CloudSim 7.0.1" pada bab 9; stempel "Estimasi di browser" pada Laboratorium dan Tantang AOA.
2. **Pembanding:** teks "pembanding: Random Scheduling" di judul grafik. Tidak ada klaim terhadap algoritma lain.
3. **Utilisasi = RUR:** callout pada kartu metrik dan penjelajah: keduanya identik pada konfigurasi ini.
4. **Run:** tulis "rata-rata 10 run, tiap run seed berbeda, dataset tetap".
5. **Waktu komputasi** (`waktu_komputasi_ms`) bergantung perangkat; sajikan sebagai indikasi kasar, bukan metrik utama.
6. **Reproduksibilitas:** pada bab Penutup, jelaskan seed (dataset 2026+N; algoritma 7+1000N+run) dan tautkan CSV mentah.

## 5. Regenerasi data (alur kerja)

```bash
# dari akar repo
mvn -q compile exec:java                 # simulasi Java -> hasil_aoa/
python plot_metrics.py hasil_aoa         # (opsional) grafik PNG
python tools/csv_to_json.py              # hasil_aoa/ -> web/public/data/ (+ salin AOASchedulingSim.java ke raw/)
cd web && npm run parity                 # paritas mesin TS terhadap data baru
```

Jika `config.json` berbeda dari Java (mis. MIPS VM atau parameter AOA diubah), perbarui `config.json` dan engine (bila perlu), lalu jalankan paritas.
Data di repo saat ini berasal dari run pembuat blueprint (CloudSim 7.0.1 dikompilasi dari source). Seed tetap sehingga seharusnya identik dengan run di komputer kelompok
kecuali kolom `waktu_komputasi_ms`. **Sebelum presentasi, jalankan ulang di komputer kelompok dan regenerasi data** agar bukti dokumentasi milik sendiri.
