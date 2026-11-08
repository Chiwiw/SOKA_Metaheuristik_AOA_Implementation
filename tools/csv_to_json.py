#!/usr/bin/env python3
"""Ubah keluaran AOASchedulingSim (folder hasil_aoa/) menjadi JSON untuk situs web.

Pemakaian:  python tools/csv_to_json.py [folder_hasil_aoa] [folder_data_tujuan]
Default  :  hasil_aoa  ->  web/public/data   (jalankan dari akar repo)

Jalankan ulang setiap kali simulasi Java dijalankan ulang. Jangan edit JSON hasilnya dengan tangan.
Hanya butuh pustaka standar Python.
"""
import csv
import json
import shutil
import statistics
import sys
from pathlib import Path

TIMELINE_SIZES = (100,)  # ukuran yang dibuatkan data timeline (Gantt); 1000 terlalu padat


def num(v):
    try:
        f = float(v)
        return int(f) if f.is_integer() and "." not in v else f
    except ValueError:
        return v


def read_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        return [{k: num(v) for k, v in row.items()} for row in csv.DictReader(f)]


def dump(obj, path):
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"  {path.name:34s} {path.stat().st_size/1024:7.1f} KB")


def main():
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "hasil_aoa")
    dst = Path(sys.argv[2] if len(sys.argv) > 2 else "web/public/data")
    if not (src / "hasil_per_run.csv").exists():
        sys.exit(f"Folder hasil tidak valid: {src}")
    dst.mkdir(parents=True, exist_ok=True)
    (dst / "raw").mkdir(exist_ok=True)
    print(f"Sumber: {src.resolve()}\nTujuan: {dst.resolve()}")

    dump(read_csv(src / "hasil_ringkasan.csv"), dst / "hasil_ringkasan.json")
    dump(read_csv(src / "hasil_per_run.csv"), dst / "hasil_per_run.json")
    dump(read_csv(src / "dataset_ringkasan.csv"), dst / "dataset_ringkasan.json")

    # dataset penuh (panjang cloudlet dalam MI) untuk playground
    datasets = {}
    for f in sorted((src / "dataset").glob("dataset_*.csv")):
        n = f.stem.split("_")[1]
        rows = read_csv(f)
        datasets[n] = {"length_mi": [r["length_mi"] for r in rows], "kategori": [r["kategori"] for r in rows]}
    dump(datasets, dst / "datasets.json")

    # konvergensi: mean/std/min/max antar-run per iterasi
    by = {}
    for r in read_csv(src / "konvergensi_aoa.csv"):
        by.setdefault(r["jumlah_cloudlet"], {}).setdefault(r["iterasi"], []).append(r["fitness_terbaik"])
    konv = {}
    for n, its in by.items():
        ks = sorted(its)
        konv[str(n)] = {
            "iterasi": ks,
            "mean": [round(statistics.fmean(its[k]), 6) for k in ks],
            "std": [round(statistics.stdev(its[k]) if len(its[k]) > 1 else 0, 6) for k in ks],
            "min": [round(min(its[k]), 6) for k in ks],
            "max": [round(max(its[k]), 6) for k in ks],
        }
    dump(konv, dst / "konvergensi_aoa.json")

    # timeline run-1 untuk Gantt (AOA vs Random)
    for n in TIMELINE_SIZES:
        tl = {}
        for alg in ("aoa", "random"):
            f = src / "detail" / f"{alg}_{n}_run1.csv"
            if f.exists():
                tl[alg] = [{"id": r["cloudlet_id"], "vm": r["vm_id"], "start": r["start_s"], "finish": r["finish_s"],
                            "mi": r["length_mi"]} for r in read_csv(f)]
        dump(tl, dst / f"timeline_{n}.json")

    # salinan mentah untuk tombol unduh "bukti dokumentasi"
    for f in [src / "hasil_per_run.csv", src / "hasil_ringkasan.csv", src / "dataset_ringkasan.csv",
              src / "konvergensi_aoa.csv", src / "output_simulasi.txt"] + sorted((src / "dataset").glob("*.csv")):
        if f.exists():
            shutil.copy(f, dst / "raw" / f.name)
    java = Path("src/main/java/AOASchedulingSim.java")
    if java.exists():
        shutil.copy(java, dst / "raw" / java.name)
        print(f"  (kode Java disalin ke raw/{java.name})")
    print("Selesai.")


if __name__ == "__main__":
    main()
