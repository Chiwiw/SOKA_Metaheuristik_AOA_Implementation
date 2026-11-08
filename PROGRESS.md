# PROGRESS — papan kerja

Agent: perbarui di akhir setiap sesi. Manusia: isi "Keputusan manusia".

## Status fase

- [x] **F0** Verifikasi fondasi (`npm install/dev/build/test/parity` hijau)
- [x] **F1** Struktur & teks ringkas 12 bab, hero (C1), Peta Metaheuristik (C2), catatan presenter
- [ ] **F2** ★ Arena Kawanan (V1) · MOA/MOP (C3) · Dari Angka ke Jadwal (C4)
- [ ] **F3** ★ Kode ↔ Visual (V3) · Jalur Implementasi (V4) · Datacenter replay (V2 mode 2)
- [ ] **F4** Tantang AOA (V2 mode 1) · Laboratorium (C5, Web Worker)
- [ ] **F5** ★ Penjelajah Hasil (V5) · Kartu Eksperimen (C6) · Temuan (C7)
- [ ] **F6** Mode presentasi (C8) · Penutup & Bukti (C9) · polesan · stretch
- [ ] **F7** QA penuh (`docs/07`) + penyuntingan teks/anggaran
- [ ] **F8** Deploy GitHub Pages + latihan + cadangan offline

## Sudah ada di repo (dari blueprint)

- [x] Proyek Java/Maven + hasil_aoa (identik dengan scratch pengguna)
- [x] `web/`: Vite + React 19 + TypeScript strict, build lolos
- [x] Mesin AOA TS (`engine/`): 11 uji unit + paritas TS-vs-Java lolos
- [x] Token desain terang/gelap, kerangka 12 bab (placeholder), loader data bertipe
- [x] Workflow Pages (build + uji + paritas + deploy)

## Keputusan manusia (isi saat F0)

- Nama anggota & NRP: _(Elgracito Iryanda Endia | 5027231057, Dimas Satya A | 5027241032, Moch. Rizki NMasrullah | 5027241038, Hanif Mawla Faizi | 5027241064, Muhammad Ardiansyah Tri Wibowo | 5027241091, M. Faqih Ridho | 5027241123)_
- Kelas / nomor kelompok: _(Kelas C, Kelompok 1)_
- URL repo GitHub: _(https://github.com/Chiwiw/SOKA_Metaheuristik_AOA_Implementation)_
- Boleh menampilkan nama/NRP di situs publik? _(boleh)_
- Data `hasil_aoa/` sudah dari run sendiri? _(sudah)_
- Datacenter 3D (three.js) atau isometrik 2D? _(default: 2D; 3D = stretch)_

## Butir VERIFIKASI

- [ ] Referensi paper AOA: penulis, volume, nomor artikel, DOI (`docs/04` §1)
- [ ] Referensi CloudSim (`docs/04` §1)
- [ ] Nilai default α dan μ di paper vs implementasi (α=5, μ=0,5) (`docs/04` §3)
- [ ] Versi aksi GitHub di `pages.yml` masih terbaru (`docs/07` §3)

## Log keputusan (agent: tanggal, keputusan, alasan, ukuran bundel bila menambah dependensi)

- Agent, 2026-11-08: Menyelesaikan F0 dan F1 sebelum masuk F2. Fondasi web tervalidasi dengan build produksi, 11 uji unit, dan paritas TS-vs-Java; F1 menghubungkan Hero, 12 bab, Peta Metaheuristik, teks ringkas, laci "Lihat lebih dalam", serta catatan presenter.
- Agent, 2026-11-08: Menggunakan durasi presenter total 19,75 menit (rentang target 15–20 menit), tanpa menambah dependensi.
- Agent, 2026-11-08: Menambahkan placeholder visual berlabel pada bab yang belum memiliki renderer interaktif, agar struktur narasi tetap terlihat sebelum F2–F6 dikerjakan.
- Agent, 2026-11-08: Memperbaiki fallback `ChapterShell` agar kondisi `false` tidak menghalangi placeholder visual pada bab tanpa visual khusus.

## Hambatan (agent: yang dicoba, yang terjadi, opsi)

- Agent, 2026-11-08: Folder kerja belum memiliki `.git`, sehingga commit/push tidak dapat dilakukan dari keadaan awal. Opsi: inisialisasi Git lokal, tambahkan remote GitHub yang dikonfirmasi, lalu commit dan push.
- Agent, 2026-11-08: Tool pencarian sempat gagal memproses pola; pembacaan dilanjutkan dengan `Select-String`/pembacaan rentang file. Tidak mengubah hasil implementasi.
- Agent, 2026-11-08: Verifikasi visual lintas viewport dan QA penuh `docs/07` masih menjadi pekerjaan F7; F0–F1 selesai, tetapi F2–F6 belum dikerjakan.
