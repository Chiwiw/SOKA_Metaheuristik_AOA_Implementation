#!/usr/bin/env python3
"""Grafik metrik hasil AOASchedulingSim.

Pemakaian:  python plot_metrics.py [folder_hasil]      (default: hasil_aoa)
Butuh    :  pip install pandas matplotlib
Keluaran :  <folder_hasil>/grafik/*.png
"""
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

# (kolom di CSV, judul, satuan, arah yang lebih baik)
METRIK = [
    ("makespan_s",            "Makespan",                      "detik",     "lebih rendah lebih baik"),
    ("utilisasi_vm_pct",      "Utilisasi VM",                  "%",         "lebih tinggi lebih baik"),
    ("throughput_task_per_s", "Throughput",                    "task/detik", "lebih tinggi lebih baik"),
    ("respons_rata2_s",       "Waktu Respons Rata-rata",       "detik",     "lebih rendah lebih baik"),
    ("lbi",                   "Load Balancing Index",          "",          "0 = seimbang, lebih rendah lebih baik"),
    ("rur_cpu_pct",           "RUR CPU",                       "%",         "lebih tinggi lebih baik"),
]
WARNA = {"AOA": "#1f77b4", "Random": "#d95f02"}
MARKER = {"AOA": "o", "Random": "s"}
DPI = 200


def gaya(alg):
    return WARNA.get(alg, None), MARKER.get(alg, "^")


def gambar_metrik(ax, ringkasan, per_run, kolom, judul, satuan, arah, sizes):
    pos = np.arange(len(sizes))
    algs = list(ringkasan["algoritma"].unique())
    lebar = 0.8 / len(algs)
    for k, alg in enumerate(algs):
        warna, _ = gaya(alg)
        r = ringkasan[ringkasan["algoritma"] == alg].set_index("jumlah_cloudlet").loc[sizes]
        x = pos - 0.4 + lebar * (k + 0.5)
        ax.bar(x, r[kolom + "_mean"], lebar * 0.92, yerr=r[kolom + "_std"], capsize=3,
               color=warna, alpha=0.85, label=alg, error_kw={"elinewidth": 1.0})
        # titik tiap run (sebaran antar-run)
        p = per_run[per_run["algoritma"] == alg]
        for i, n in enumerate(sizes):
            v = p.loc[p["jumlah_cloudlet"] == n, kolom].to_numpy()
            jit = np.linspace(-lebar * 0.25, lebar * 0.25, len(v))
            ax.scatter(x[i] + jit, v, s=7, color="black", alpha=0.45, zorder=3, linewidths=0)
    ax.set_xticks(pos)
    ax.set_xticklabels([str(n) for n in sizes])
    ax.set_xlabel("Jumlah cloudlet")
    ax.set_ylabel(f"{judul} ({satuan})" if satuan else judul)
    ax.set_title(f"{judul}\n({arah})", fontsize=10)
    ax.grid(axis="y", alpha=0.3)
    ax.set_axisbelow(True)
    ax.legend(fontsize=8, ncol=len(algs), loc="upper center", bbox_to_anchor=(0.5, -0.2), frameon=False)


def main():
    folder = Path(sys.argv[1] if len(sys.argv) > 1 else "hasil_aoa")
    f_ring, f_run, f_konv = folder / "hasil_ringkasan.csv", folder / "hasil_per_run.csv", folder / "konvergensi_aoa.csv"
    for f in (f_ring, f_run):
        if not f.exists():
            sys.exit(f"Berkas tidak ditemukan: {f}\nJalankan AOASchedulingSim dulu.")
    ringkasan, per_run = pd.read_csv(f_ring), pd.read_csv(f_run)
    sizes = sorted(ringkasan["jumlah_cloudlet"].unique())
    out = folder / "grafik"
    out.mkdir(parents=True, exist_ok=True)

    # 1) satu gambar per metrik
    for no, (kol, judul, sat, arah) in enumerate(METRIK, start=1):
        fig, ax = plt.subplots(figsize=(6.2, 4.4))
        gambar_metrik(ax, ringkasan, per_run, kol, judul, sat, arah, sizes)
        fig.tight_layout()
        fig.savefig(out / f"{no:02d}_{kol}.png", dpi=DPI)
        plt.close(fig)

    # 2) panel ringkasan semua metrik
    fig, axes = plt.subplots(2, 3, figsize=(16, 8.5))
    for ax, (kol, judul, sat, arah) in zip(axes.ravel(), METRIK):
        gambar_metrik(ax, ringkasan, per_run, kol, judul, sat, arah, sizes)
    fig.suptitle("Perbandingan Metrik Penjadwalan Cloudlet (mean ± std, titik = tiap run)", fontsize=13)
    fig.tight_layout(rect=(0, 0, 1, 0.96))
    fig.savefig(out / "00_ringkasan_semua_metrik.png", dpi=DPI)
    plt.close(fig)

    # 3) kurva konvergensi AOA (mean ± std antar-run)
    if f_konv.exists():
        konv = pd.read_csv(f_konv)
        ukuran = sorted(konv["jumlah_cloudlet"].unique())
        fig, axes = plt.subplots(2, 2, figsize=(11, 7.5), squeeze=False)
        for ax, n in zip(axes.ravel(), ukuran):
            d = konv[konv["jumlah_cloudlet"] == n].groupby("iterasi")["fitness_terbaik"].agg(["mean", "std"]).fillna(0)
            ax.plot(d.index, d["mean"], color=WARNA["AOA"], lw=1.6, label="AOA (mean)")
            ax.fill_between(d.index, d["mean"] - d["std"], d["mean"] + d["std"], color=WARNA["AOA"], alpha=0.2, label="± std")
            ax.set_title(f"{n} cloudlet")
            ax.set_xlabel("Iterasi")
            ax.set_ylabel("Fitness terbaik (lebih rendah lebih baik)")
            ax.grid(alpha=0.3)
            ax.legend(fontsize=8)
        fig.suptitle("Konvergensi AOA", fontsize=13)
        fig.tight_layout(rect=(0, 0, 1, 0.96))
        fig.savefig(out / "07_konvergensi_aoa.png", dpi=DPI)
        plt.close(fig)

    print(f"Grafik tersimpan di: {out.resolve()}")
    for p in sorted(out.glob("*.png")):
        print(" -", p.name)


if __name__ == "__main__":
    main()
