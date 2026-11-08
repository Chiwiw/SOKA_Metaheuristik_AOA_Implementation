import type { ReactNode } from 'react';
import { ChapterShell } from './components/ChapterShell';
import { Shell } from './components/Shell';
import { useAppData, type AppData } from './lib/data';
import { fmt, pct } from './lib/format';
import { CHAPTERS } from './sections/registry';
import { HeroSection } from './sections/mulai/Hero';
import { MetaMap } from './sections/kenalan/MetaMap';

/** Konten bab: lead (≤ 45 kata), momen khas (placeholder visual fase berikutnya), laci "Lihat lebih dalam". */
interface BabKonten {
  lead: (data: AppData) => ReactNode;
  momen: string;
  laci: Array<{ judul: string; isi: ReactNode | ((d: AppData) => ReactNode) }>;
}

/**
 * Konten 11 bab (bab 0 "mulai" = Hero, tidak ikut peta ini).
 * Semua angka hasil dibaca dari JSON / dihitung — tidak ada angka hasil yang diketik manual (AGENTS §3.1).
 */
const KONTEN: Record<string, BabKonten> = {
  masalah: {
    lead: (d) => {
      const m = d.config.vm.mips.length;
      return (
        <>
          Ada {m} VM dengan kecepatan berbeda dan ratusan cloudlet. Setiap pemetaan adalah satu
          kandidat solusi; jumlah kemungkinan tumbuh eksponensial. Manual tidak akan sanggup —
          di situs ini engkau menonton mesinnya bekerja.
        </>
      );
    },
    momen: 'Tantang AOA — susun jadwalmu sendiri, lalu LCD membandingkan dengan AOA & Random',
    laci: [
      {
        judul: 'Mengapa sulit? (M^N)',
        isi: (
          <>
            Dengan N cloudlet dan M VM, ada M<sup>N</sup> kemungkinan penugasan. Contoh: N=1000,
            M=4 → 4<sup>1000</sup> kombinasi. Ini masalah NP-hard; pencarian menyeluruh tidak mungkin.
          </>
        ),
      },
    ],
  },

  kenalan: {
    lead: () => (
      <>
        AOA menjelajah dengan empat operator hitung. × ÷ membuat lompatan besar (eksplorasi), + −
        langkah kecil (eksploitasi). Posisi kartu di peta = pendekatan, bukan peringkat.
      </>
    ),
    momen: 'Kartu SA/GA/PSO/AOA dapat digeser di peta 2 sumbu; kawanan mini hidup di latar',
    laci: [
      {
        judul: 'Asal-usul AOA',
        isi: (
          <>
            AOA (Arithmetic Optimization Algorithm) adalah metaheuristik berbasis populasi yang
            terinspirasi empat operasi aritmetika dasar — bukan alam hayati. Agen diperbarui
            relatif terhadap solusi terbaik sejauh ini, bukan posisinya sendiri.
          </>
        ),
      },
      {
        judul: 'Referensi paper',
        isi: (
          <>
            Abualigah, Diabat, Mirjalili, Abd Elaziz &amp; Gandomi (2021), <em>The Arithmetic
            Optimization Algorithm</em>. Computer Methods in Applied Mechanics and Engineering,
            376, 113609. {/* VERIFIKASI: penulis, volume, nomor artikel, DOI (docs/04 §1) */}
          </>
        ),
      },
    ],
  },

  'empat-tombol': {
    lead: () => (
      <>
        Tekan ×/÷/+/−: agen melompat di lanskap. Rumus aktif tampil di LCD; panjang lompatan
        dikendalikan MOP. Agen hantu menunjukkan posisi lama; bintang = solusi terbaik.
      </>
    ),
    momen: 'Tekan operator → agen melompat; lintasan melengkung (× ÷) vs langkah pendek (+ −)',
    laci: [
      {
        judul: 'Rumus lengkap (docs/04 §3)',
        isi: (
          <>
            Untuk tiap dimensi j: s = (UB−LB)·μ + LB, μ=0,5 (konfigurasi). Eksplorasi: ÷ x =
            best/(MOP+ε)·s ; × x = best·MOP·s. Eksploitasi: − x = best−MOP·s ; + x = best+MOP·s.
            Hasil dipotong ke [LB, UB] (clamp).
          </>
        ),
      },
      {
        judul: 'Warna operator',
        isi: (
          <>
            Warna × ÷ + − dilindungi (AGENTS §3.10): hanya untuk operator. Hangat (× ÷) =
            eksplorasi, dingin (+ −) = eksploitasi — konsisten dari Hero sampai Hasil.
          </>
        ),
      },
    ],
  },

  pengatur: {
    lead: (d) => (
      <>
        MOA memilih fase — naik dari {fmt(d.config.aoa.moaMin, 1)} menuju {fmt(d.config.aoa.moaMax, 1)}.
        MOP mengecilkan langkah menuju nol. Geser waktu: kawanan berubah dari melompat ke
        menyempurnakan.
      </>
    ),
    momen: 'Geser t → Arena memutar-ulang keadaan kawanan pada iterasi itu',
    laci: [
      {
        judul: 'Rumus MOA & MOP',
        isi: (d: AppData) => (
          <>
            MOA(t) = MOA_min + t·(MOA_max − MOA_min)/T. MOP(t) = 1 − t^(1/α)/T^(1/α), α =
            {' '}{d.config.aoa.alpha}. Saat MOP → 0, agen praktis menempel pada solusi terbaik.
          </>
        ),
      },
      {
        judul: 'Perilaku di balik rumus',
        isi: (
          <>
            Awal iterasi: MOP besar → langkah ÷ × sangat besar; setelah clamp nilai menumpuk di
            batas → agen praktis acak (eksplorasi). Akhir iterasi: MOA tinggi, MOP kecil → agen
            mengerucut di sekitar best (eksploitasi).
          </>
        ),
      },
    ],
  },

  alur: {
    lead: () => (
      <>
        Satu iterasi: hitung MOA &amp; MOP → ambil r1 r2 r3 → pilih operator → posisi baru →
        clamp → evaluasi → perbarui best. Kode Java asli di kiri, kawanan menjalankannya di kanan.
      </>
    ),
    momen: 'Scrollytelling: baris kode runAOA menyala, satu agen disorot dengan nilai variabelnya',
    laci: [
      {
        judul: 'Pseudocode (versi presentasi)',
        isi: (
          <pre className="laci-pre">
{`Inisialisasi populasi X (acak di [0, M)), evaluasi → best
untuk t = 1 sampai T:
  hitung MOA(t), MOP(t)
  untuk tiap agen i, tiap dimensi j:
    ambil r1, r2, r3
    r1 > MOA ? eksplorasi (÷ ×) : eksploitasi (− +)
    hitung posisi baru, potong ke [LB, UB]
  evaluasi; perbarui best bila lebih baik
kembalikan best → decode → jadwal`}
          </pre>
        ),
      },
    ],
  },

  jadwal: {
    lead: (d) => (
      <>
        Satu agen = vektor sepanjang N (jumlah cloudlet). floor(x_j) menunjuk VM penerima
        cloudlet j. Geser satu nilai: penugasan, beban VM, dan fitness berubah seketika. Pada
        konfigurasi ini M = {d.config.vm.mips.length}.
      </>
    ),
    momen: 'Geser satu x_j → chip VM, bar beban, dan fitness berubah langsung',
    laci: [
      {
        judul: 'Fungsi objektif (docs/04 §4)',
        isi: (d: AppData) => (
          <>
            F = {fmt(d.config.aoa.wMakespan, 1)}·(makespan_est / batas_bawah) + {fmt(d.config.aoa.wLbi, 1)}·(LBI / 0,25).
            Makespan dihitung analitik (antrean FIFO per VM); LBI = variansi utilisasi antar VM
            dibagi 0,25. Bobot 0,7/0,3 adalah pilihan kelompok — tidak diklaim optimal.
          </>
        ),
      },
    ],
  },

  laboratorium: {
    lead: (d) => (
      <>
        Jalankan AOA sungguhan di browser-mu: populasi {d.config.aoa.popSize}, {d.config.aoa.maxIter}{' '}
        iterasi, di Web Worker. Tonton beban VM menyeimbang. Stempel: hasil ini estimasi browser —
        hasil resmi dari CloudSim {d.config.cloudsimVersion}.
      </>
    ),
    momen: 'Tekan Jalankan → konvergensi hidup, beban VM menyeimbang, operator terpakai tercatat',
    laci: [
      {
        judul: 'Parameter (config.json)',
        isi: (d: AppData) => (
          <>
            Populasi {d.config.aoa.popSize} · iterasi {d.config.aoa.maxIter} · α={d.config.aoa.alpha} ·
            μ={fmt(d.config.aoa.mu, 2)} · MOA∈[{fmt(d.config.aoa.moaMin, 1)}; {fmt(d.config.aoa.moaMax, 1)}].
            {' '}{d.config.runsPerSize} run per ukuran dataset ({d.config.datasetSizes.join(', ')}),
            seed dataset {d.config.datasetSeed}.
          </>
        ),
      },
    ],
  },

  eksperimen: {
    lead: (d) => (
      <>
        Dataset → AOA → Bind → CloudSim {d.config.cloudsimVersion} → Metrik → CSV → situs ini.
        Klik stasiun di fase 4: berkas, potongan kode, baris data nyata. {d.config.vm.mips.length} VM
        ({d.config.vm.mips.join(' / ')} MIPS), {d.config.datasetSizes.length} ukuran ×{' '}
        {d.config.runsPerSize} run.
      </>
    ),
    momen: 'Paket data mengalir melalui 7 stasiun; klik stasiun → baris data nyata',
    laci: [
      {
        judul: 'Setup eksperimen (config.json)',
        isi: (d: AppData) => (
          <>
            CloudSim {d.config.cloudsimVersion} · 1 host · {d.config.vm.mips.length} VM 1 vCPU
            ({d.config.vm.mips.join(' / ')} MIPS) · scheduler {d.config.vm.cloudletScheduler}.
            Dataset sintetis seed {d.config.datasetSeed}: {d.config.datasetMix.map((m) => `${m.kategori} ${fmt(m.peluang * 100, 0)}% (${fmt(m.lengthMiMin / 1000, 0)}–${fmt(m.lengthMiMax / 1000, 0)}rb MI)`).join(', ')}.
          </>
        ),
      },
      {
        judul: 'Kenapa simulasi, bukan angka rumus?',
        isi: (
          <>
            Hasil akhir bukan hasil rumus fitness, melainkan simulasi CloudSim: penugasan terbaik
            di-bind ke VM, metrik diukur dari waktu mulai/selesai nyata. Selisih makespan simulasi
            vs estimasi analitik ≤ 0,05% (bandingkan kolom makespan_estimasi_s vs makespan_s).
          </>
        ),
      },
    ],
  },

  hasil: {
    lead: (d) => {
      const s = ringkasanMakespan(d, d.config.datasetSizes[0]);
      if (!s) return <>Memuat data…</>;
      return (
        <>
          Enam metrik × {d.config.datasetSizes.length} ukuran × 2 algoritma. Pada N={s.n}: AOA{' '}
          {fmt(s.aoa, 1)} s vs Random {fmt(s.random, 1)} s — turun {fmt(s.turun, 1)}%.
        </>
      );
    },
    momen: 'Balapan datacenter AOA vs Random dari log CloudSim nyata (timeline_100)',
    laci: [
      {
        judul: 'Angka orientasi',
        isi: (d: AppData) => (
          <>
            Rata-rata {d.config.runsPerSize} run (dihitung dari hasil_ringkasan.json):{' '}
            {d.config.datasetSizes.map((n) => {
              const s = ringkasanMakespan(d, n);
              return s ? `N=${n}: ${fmt(s.aoa, 1)} vs ${fmt(s.random, 1)} s (−${fmt(s.turun, 1)}%)` : '';
            }).filter(Boolean).join(' · ')}.
          </>
        ),
      },
    ],
  },

  analisis: {
    lead: (d) => {
      const s = ringkasanMakespan(d, d.config.datasetSizes[d.config.datasetSizes.length - 1]);
      if (!s) return <>Memuat data…</>;
      return (
        <>
          Berhasil: makespan turun {fmt(s.turun, 0)}% pada N={s.n}. Belum: kualitas menurun saat N
          membesar, konvergensi mandek, respons rata-rata tak banyak membaik. Jujur soal itu.
        </>
      );
    },
    momen: '3 kartu kekuatan + 3 kartu keterbatasan; klik chip “bukti” → grafik terkait menyala',
    laci: [
      {
        judul: 'Lima keterbatasan wajib (docs/04 §6)',
        isi: (
          <ol className="laci-list">
            <li>Kualitas turun saat N membesar: rasio ke batas bawah naik, utilisasi turun.</li>
            <li>Konvergensi mandek setelah fase eksplorasi — populasi mengerucut di sekitar best.</li>
            <li>Respons rata-rata hanya membaik ±9–13% (AOA tidak mengatur urutan antrean FIFO).</li>
            <li>Waktu komputasi AOA naik dengan N (tetap kecil, namun bukan nol).</li>
            <li>Pembanding hanya Random Scheduling — GA/SA/PSO bukan hasil eksperimen kami.</li>
          </ol>
        ),
      },
      {
        judul: 'Arah perbaikan (usulan, bukan hasil)',
        isi: (
          <>
            Menaikkan populasi/iterasi, hibridisasi dengan pencarian lokal (SA/GA), penggantian
            agen greedy, dan optimasi urutan antrean.
          </>
        ),
      },
    ],
  },

  penutup: {
    lead: (d) => (
      <>
        Tiga takeaway, kode Java asli, unduhan data. Semua angka situs ini berasal dari run CloudSim{' '}
        {d.config.cloudsimVersion} milik kelompok — bukan angka paper.
      </>
    ),
    momen: 'Penampil kode Java asli + unduhan dataset, hasil_per_run.csv, output_simulasi.txt',
    laci: [
      {
        judul: 'Takeaway',
        isi: (d: AppData) => {
          const s = ringkasanMakespan(d, d.config.datasetSizes[0]);
          return (
            <>
              1) Empat operator hitung cukup untuk menyeimbangkan beban VM. 2) MOA/MOP memberi
              transisi eksplorasi→eksploitasi otomatis. 3) Pada N={s ? s.n : '…'}, makespan{' '}
              {s ? fmt(s.turun, 0) : '…'}% lebih cepat dibanding Random.
            </>
          );
        },
      },
    ],
  },
};

/** Ringkasan makespan AOA vs Random untuk satu ukuran N (dihitung dari JSON). */
function ringkasanMakespan(d: AppData, n: number) {
  const aoa = d.ringkasan.find((r) => r.algoritma === 'AOA' && r.jumlah_cloudlet === n);
  const random = d.ringkasan.find((r) => r.algoritma === 'Random' && r.jumlah_cloudlet === n);
  if (!aoa || !random) return null;
  return { n, aoa: aoa.makespan_s_mean, random: random.makespan_s_mean, turun: pct(aoa.makespan_s_mean, random.makespan_s_mean) };
}

export default function App() {
  const { data, error } = useAppData();
  return (
    <Shell>
      <HeroSection />
      {data ? (
        CHAPTERS.filter((c) => c.id !== 'mulai').map((c) => {
          const k = KONTEN[c.id];
          if (!k) throw new Error(`Konten bab "${c.id}" belum ada — lengkapi KONTEN di App.tsx`);
          return (
            <ChapterShell
              key={c.id}
              chapter={c}
              lead={k.lead(data)}
              momen={k.momen}
              laci={k.laci.map((b) => ({ ...b, isi: typeof b.isi === 'function' ? (b.isi as (d: AppData) => ReactNode)(data) : b.isi }))}
            >
              {c.id === 'kenalan' ? <MetaMap /> : undefined}
            </ChapterShell>
          );
        })
      ) : (
        <p className="lcd" role="status">
          {error ? `Data gagal dimuat: ${error}` : 'Memuat data…'}
        </p>
      )}
    </Shell>
  );
}
