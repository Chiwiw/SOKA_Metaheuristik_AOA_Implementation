# 07 — QA, Latihan, & Deploy GitHub Pages

## 1. Checklist QA (centang di `PROGRESS.md`)

### Fungsi
- [ ] `cd web && npm run build` hijau (typecheck + build)
- [ ] `npm test` hijau; `npm run parity` hijau
- [ ] Semua KP komponen di `docs/03` lolos
- [ ] Console bersih (tanpa error/peringatan) saat muat awal dan setelah memakai semua komponen
- [ ] DevTools → Network: tidak ada permintaan ke domain selain situs sendiri (font, pustaka, data semuanya lokal)
- [ ] Mode offline: muat sekali, putuskan jaringan, situs tetap berfungsi
- [ ] Tautan & unduhan berfungsi dari URL publik; Back/Forward dan muat ulang di `#bab` bekerja

### Kebenaran konten
- [ ] Setiap angka di UI cocok dengan `web/public/data` (uji beberapa titik tiap grafik + tabel setara)
- [ ] Rumus di situs = tabel `docs/04` §3
- [ ] Callout "Utilisasi VM = RUR CPU" tampil; stempel sumber angka benar ("Hasil CloudSim 7.0.1" vs "Estimasi di browser")
- [ ] Bab Analisis memuat keterbatasan setara kekuatan; tanpa superlatif/klaim terhadap algoritma lain
- [ ] Potongan kode & baris data di V3/V4 berasal dari berkas asli
- [ ] Semua `VERIFIKASI` terselesaikan (referensi, α/μ default paper, nama/kelas)
- [ ] Data berasal dari run milik kelompok (lihat §4)

### Teks & visual-first
- [ ] Tiap bab: visual/interaksi utama ada; teks tubuh ≤ 45 kata per layar; detail di laci
- [ ] Tiap bab punya momen khas; tidak ada layar berisi paragraf + gambar diam
- [ ] Tidak ada teks sisa ("Lorem", "TODO", "BELUM DIBANGUN")

### Aksesibilitas
- [ ] Keyboard penuh; urutan fokus logis; fokus terlihat
- [ ] Kontras AA (terang & gelap), termasuk teks di atas warna operator
- [ ] `prefers-reduced-motion` dihormati (emulasi DevTools); semua informasi tetap tersedia
- [ ] Visual interaktif punya ringkasan `aria-live`, label kontrol, tabel setara untuk data numerik
- [ ] Judul berjenjang (h1 tunggal, h2 per bab); zoom 200% tidak merusak tata letak

### Kinerja
- [ ] Lighthouse mobile ≥ 90: Performance, Accessibility, Best Practices, SEO
- [ ] JS muat awal ≤ 200 KB gz; komponen berat dimuat malas (cek tab Network)
- [ ] Arena/Datacenter ≥ 50 fps di laptop biasa; rAF berhenti saat di luar layar (cek Performance)
- [ ] Lab N=1000/pop 50/iter 500 tidak membekukan UI; CLS < 0,05

### Lintas peramban & perangkat
- [ ] Chrome, Firefox, Safari (macOS/iOS), Edge terbaru
- [ ] Ponsel 390 px (sentuh: seret peti Tantang AOA), tablet 768 px
- [ ] Proyektor/layar kelas 1280×720 dan 1920×1080; teks terbaca dari jarak jauh
- [ ] Mode presentasi: ←/→, N, F, T, ? bekerja; fullscreen

## 2. Latihan presentasi
1. Latihan penuh hanya dengan keyboard dan pewaktu bab; catat bab yang melebihi anggaran `docs/01`.
2. Bagi giliran bicara; tentukan siapa mengoperasikan Tantang AOA, Arena, Lab, dan balapan hasil.
3. Siapkan 5 pertanyaan sulit & jawabannya: mengapa bobot 0,7/0,3? mengapa hanya Random sebagai pembanding? mengapa AOA mandek? beda estimasi vs CloudSim? mengapa dataset sintetis? mengapa clamp membuat agen menempel di tepi?
4. **Rencana cadangan:** (a) `npm run build` lalu salin `web/dist` ke flashdisk; jalankan `npx vite preview` atau `python -m http.server --directory web/dist`; (b) tangkapan layar/PDF tiap bab (`@media print`); (c) hotspot ponsel.
5. Uji di perangkat/proyektor yang akan dipakai, termasuk keterbacaan tema di ruangan terang.

## 3. Deploy ke GitHub Pages

Workflow `.github/workflows/pages.yml` membangun `web/` (`npm ci` → build → uji → paritas) lalu mengunggah `web/dist`.

1. Buat repositori GitHub baru (publik), mis. `metaheuristik-aoa`. URL: `https://<username>.github.io/<nama-repo>/`.
2. Di akar repo ini: `git init`, `git add .`, `git commit -m "dokumen: repo gabungan awal"`, tambahkan remote, `git push -u origin main`.
   (`.gitignore` sudah mengecualikan `target/`, `web/node_modules/`, `web/dist/`.)
3. GitHub → **Settings → Pages → Build and deployment → Source = "GitHub Actions"** (sekali saja).
4. Push ke `main` memicu workflow (tab **Actions**). Setelah hijau, URL tampil di ringkasan job.
5. Buka URL publik; ulangi checklist fungsi singkat (navigasi, Arena, Lab, unduhan).

Catatan penting:
- **`base: './'`** di `vite.config.ts` membuat semua aset relatif — jangan diubah, dan jangan memakai path absolut di kode.
- Nama berkas **peka huruf besar-kecil** di server (lokal Windows tidak). Cocokkan persis pada `import` dan `fetch`.
- Workflow menjalankan `npm run parity` (±45 dtk); bila paritas gagal, deploy dibatalkan (disengaja).
- `package-lock.json` harus ikut di-commit (workflow memakai `npm ci`).
- Versi aksi (checkout v4, setup-node v4, configure-pages v5, upload-pages-artifact v3, deploy-pages v4) adalah yang dikenal saat blueprint ditulis — **VERIFIKASI** bila ada peringatan.
- Jangan publikasikan data pribadi (NRP, foto) tanpa persetujuan anggota. Domain kustom (opsional): `web/public/CNAME` + DNS.
- `hasil_aoa/` ikut ter-commit sebagai bukti dokumentasi; folder `target/` tidak.

## 4. Sebelum presentasi: jadikan data milik sendiri

Data bawaan berasal dari run pembuat blueprint (CloudSim 7.0.1 dikompilasi dari source). Seed tetap, jadi seharusnya identik, tetapi sebagai "bukti dokumentasi" kelompok harus punya run sendiri:
1. `mvn -q compile exec:java` di akar repo → `hasil_aoa/` baru.
2. `python tools/csv_to_json.py` (default: `hasil_aoa` → `web/public/data`, sekaligus menyalin Java ke `raw/`).
3. `cd web && npm run parity`; bandingkan angka utama dengan tabel orientasi `docs/04` §6. Bila berbeda signifikan, **jangan publikasikan**: selidiki (versi CloudSim, konfigurasi VM, seed).
4. Simpan tangkapan layar `hasil_aoa/output_simulasi.txt` (berisi tanggal/waktu run) sebagai bukti tambahan.
