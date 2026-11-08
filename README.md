# Metaheuristik AOA — Implementasi (CloudSim) + Situs Presentasi Interaktif

Satu repo, dua bagian:

| Bagian | Isi | Pemilik |
|---|---|---|
| **Implementasi** | `pom.xml`, `src/main/java/AOASchedulingSim.java` (AOA + Random di CloudSim 7.0.1), `plot_metrics.py`, `hasil_aoa/` | kamu (scratch awalmu, tidak diubah) |
| **Situs presentasi** | `web/` — Vite + React + TypeScript; mesin AOA TS yang teruji; kerangka 12 bab | dikerjakan bersama agent AI |
| **Blueprint** | `AGENTS.md`, `docs/`, `PROGRESS.md`, `tools/` | panduan agent |

## Mulai cepat

```bash
# 1) Implementasi (akar repo) — jalankan sendiri agar data milikmu
mvn -q compile exec:java            # -> hasil_aoa/
python plot_metrics.py hasil_aoa    # -> hasil_aoa/grafik/*.png
python tools/csv_to_json.py         # -> web/public/data/ (+ salin kode Java)

# 2) Situs
cd web
npm install
npm run parity                      # mesin TS vs Java: harus semua lulus
npm run dev                         # http://localhost:5173
```

Lalu buka agent AI di akar repo (Claude Code membaca `CLAUDE.md`; alat lain membaca `AGENTS.md`), tempel **prompt pembuka** dari `docs/06`, dan kerjakan **Fase 0** → **Fase 8**.

## Kondisi saat ini

- Java/Maven: identik dengan scratch awalmu (tidak ada yang diubah). Hasil di `hasil_aoa/` berasal dari run pembuat blueprint; **jalankan ulang di komputermu**.
- `web/`: build produksi lolos, 11 uji unit lolos, uji paritas TS-vs-Java lolos (8 skenario). Bab-bab masih *placeholder* ("BELUM DIBANGUN") — itu tugas agent.
- Path Maven: `pom.xml` milikmu tetap dipakai apa adanya (repo lokal Maven di drive D diatur di luar pom, seperti sebelumnya).

## Peta berkas

```
pom.xml  src/main/java/AOASchedulingSim.java  plot_metrics.py  hasil_aoa/     implementasi
tools/csv_to_json.py                                                          hasil_aoa -> web/public/data
web/src/engine/        mesin AOA TS (operators, aoaCore, scheduling, worker) + uji + paritas
web/src/styles/        tokens.css (tema "Mesin Hitung Awan", terang/gelap), base.css
web/src/sections/      registry.ts (12 bab)      web/src/lib/  data.ts (loader bertipe), format.ts
AGENTS.md  docs/01–07  PROGRESS.md               aturan agent, spesifikasi, papan kerja
.github/workflows/pages.yml                      build + uji + deploy ke GitHub Pages
```

## Tiga hal yang membuat hasil akhirnya bagus

1. **Satu fase per sesi, periksa sendiri hasilnya.** Fase 2 (Arena Kawanan, cara kerja algoritma) dan Fase 3 (Kode ↔ Visual, implementasi) adalah jantungnya.
2. **Visual-first.** Aturan di `AGENTS.md` §4: teks tubuh ≤ 45 kata per layar; konsep dijelaskan lewat visual yang bisa dimainkan.
3. **Jujur.** Angka dari data, keterbatasan AOA ditampilkan. Itu yang membuat presentasi tahan pertanyaan dosen.
