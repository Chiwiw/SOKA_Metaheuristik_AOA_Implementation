import org.cloudbus.cloudsim.*;
import org.cloudbus.cloudsim.core.CloudSim;
import org.cloudbus.cloudsim.provisioners.BwProvisionerSimple;
import org.cloudbus.cloudsim.provisioners.PeProvisionerSimple;
import org.cloudbus.cloudsim.provisioners.RamProvisionerSimple;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

/**
 * Penjadwalan cloudlet dengan Arithmetic Optimization Algorithm (AOA) di CloudSim.
 *
 * Alur: generate dataset sintetis (100/200/500/1000 cloudlet) -> simpan CSV -> jalankan AOA
 * (dan Random Scheduling sebagai pembanding) -> simulasi CloudSim -> hitung 6 metrik -> simpan CSV + log.
 *
 * Jalankan: mvn -q compile exec:java   (opsional argumen: folder output, default "hasil_aoa")
 */
public class AOASchedulingSim {

    // ======================= KONFIGURASI =======================
    // Samakan blok VM ini dengan RandomSchedulingSim.java agar perbandingan adil.
    static final int[] CLOUDLET_COUNTS = {100, 200, 500, 1000};
    static final int RUNS_PER_SIZE = 10;            // pengulangan independen per ukuran dataset
    static final long DATASET_SEED = 2026L;          // seed dataset (tetap -> dataset bisa direproduksi)
    static final long ALGO_SEED = 7L;                // seed dasar algoritma

    static final double[] VM_MIPS = {1000, 1500, 2000, 2500}; // 4 VM x 1 vCPU = 4 vCPU
    static final int VM_PES = 1;
    static final int VM_RAM = 1024;                  // MB
    static final long VM_BW = 1000;
    static final long VM_SIZE = 10000;               // MB

    static final boolean RUN_RANDOM_BASELINE = true; // pembanding Random Scheduling pada dataset yang sama

    // Parameter AOA (Abualigah et al., 2021)
    static final int POP_SIZE = 50;
    static final int MAX_ITER = 500;
    static final double ALPHA = 5.0;                 // sensitivitas eksploitasi
    static final double MU = 0.5;                    // parameter kontrol pencarian
    static final double MOA_MIN = 0.2, MOA_MAX = 1.0;
    static final double EPS = 2.220446049250313e-16;

    // Fungsi objektif: F = W_MK * (makespan_est / batas_bawah) + W_LB * (LBI_est / 0.25)
    static final double W_MK = 0.7, W_LB = 0.3;

    static final String ALG_AOA = "AOA", ALG_RANDOM = "Random";

    // ======================= DATA =======================
    static final class Task {
        int id; String kategori; long length; int pes; long fileSize, outputSize;
    }

    static final class Metrics {
        double makespan, utilPct, throughput, respMean, lbi, rurPct;
        int sukses;
    }

    static final class Schedule {
        int[] vmOf; double fitness, makespanEst; double[] konvergensi; long ms;
    }

    // ======================= MAIN =======================
    public static void main(String[] args) throws Exception {
        Path out = Paths.get(args.length > 0 ? args[0] : "hasil_aoa");
        Files.createDirectories(out.resolve("dataset"));
        Files.createDirectories(out.resolve("detail"));
        PrintStream fileLog = setupTee(out.resolve("output_simulasi.txt"));
        Log.disable(); // log internal CloudSim dimatikan; ringkasan dicetak oleh program ini

        int totalVcpu = VM_MIPS.length * VM_PES;
        double totalMips = 0; for (double m : VM_MIPS) totalMips += m * VM_PES;
        System.out.println("=== AOA Task Scheduling di CloudSim ===");
        System.out.println("Waktu mulai   : " + new Date());
        System.out.println("VM (MIPS)     : " + Arrays.toString(VM_MIPS) + "  | total vCPU = " + totalVcpu);
        System.out.println("AOA           : pop=" + POP_SIZE + ", iterasi=" + MAX_ITER + ", alpha=" + ALPHA + ", mu=" + MU
                + ", MOA=[" + MOA_MIN + "," + MOA_MAX + "]");
        System.out.println("Objektif      : " + W_MK + " x makespan/batas_bawah + " + W_LB + " x LBI/0.25");
        System.out.println("Pengulangan   : " + RUNS_PER_SIZE + " run per ukuran, ukuran = " + Arrays.toString(CLOUDLET_COUNTS));
        System.out.println();

        // 1) Dataset sintetis: dibuat, lalu LANGSUNG disimpan sebelum simulasi dijalankan
        Map<Integer, List<Task>> datasets = new LinkedHashMap<>();
        try (PrintWriter ds = writer(out.resolve("dataset_ringkasan.csv"))) {
            ds.println("jumlah_cloudlet,total_mi,mean_mi,std_mi,min_mi,max_mi,n_kecil,n_sedang,n_besar,batas_bawah_makespan_s");
            for (int n : CLOUDLET_COUNTS) {
                List<Task> tasks = generateDataset(n, DATASET_SEED + n);
                datasets.put(n, tasks);
                saveDataset(out.resolve("dataset").resolve("dataset_" + n + ".csv"), tasks);
                double[] len = new double[n]; int k = 0, s = 0, b = 0; double sum = 0, mn = Double.MAX_VALUE, mx = 0;
                for (int i = 0; i < n; i++) {
                    Task t = tasks.get(i); len[i] = t.length; sum += t.length;
                    mn = Math.min(mn, t.length); mx = Math.max(mx, t.length);
                    if (t.kategori.equals("kecil")) k++; else if (t.kategori.equals("sedang")) s++; else b++;
                }
                double lb = sum / totalMips;
                ds.printf(Locale.US, "%d,%.0f,%.2f,%.2f,%.0f,%.0f,%d,%d,%d,%.4f%n", n, sum, mean(len), std(len), mn, mx, k, s, b, lb);
                System.out.printf(Locale.US, "Dataset %4d cloudlet disimpan -> dataset_%d.csv (total %.0f MI, batas bawah makespan %.2f s)%n",
                        n, n, sum, lb);
            }
        }
        System.out.println();

        // 2) Eksperimen
        List<String> algs = new ArrayList<>(Arrays.asList(ALG_AOA));
        if (RUN_RANDOM_BASELINE) algs.add(ALG_RANDOM);

        Map<String, List<double[]>> hasil = new LinkedHashMap<>(); // key "alg|n" -> baris metrik per run
        try (PrintWriter pr = writer(out.resolve("hasil_per_run.csv"));
             PrintWriter cv = writer(out.resolve("konvergensi_aoa.csv"))) {
            pr.println("algoritma,jumlah_cloudlet,run,seed,makespan_s,utilisasi_vm_pct,throughput_task_per_s,"
                    + "respons_rata2_s,lbi,rur_cpu_pct,makespan_estimasi_s,fitness,waktu_komputasi_ms,task_sukses");
            cv.println("jumlah_cloudlet,run,iterasi,fitness_terbaik");

            for (int n : CLOUDLET_COUNTS) {
                List<Task> tasks = datasets.get(n);
                double[] len = new double[n];
                for (int i = 0; i < n; i++) len[i] = tasks.get(i).length;

                for (String alg : algs) {
                    for (int run = 1; run <= RUNS_PER_SIZE; run++) {
                        long seed = ALGO_SEED + 1000L * n + run;
                        Schedule sc = alg.equals(ALG_AOA) ? runAOA(len, VM_MIPS, seed) : runRandom(len, VM_MIPS, seed);

                        boolean simpanDetail = (run == 1);
                        Metrics m = simulate(tasks, sc.vmOf, totalVcpu,
                                simpanDetail ? out.resolve("detail").resolve(alg.toLowerCase() + "_" + n + "_run1.csv") : null);

                        pr.printf(Locale.US, "%s,%d,%d,%d,%.4f,%.4f,%.6f,%.4f,%.8f,%.4f,%.4f,%.6f,%d,%d%n",
                                alg, n, run, seed, m.makespan, m.utilPct, m.throughput, m.respMean, m.lbi, m.rurPct,
                                sc.makespanEst, sc.fitness, sc.ms, m.sukses);
                        pr.flush();
                        if (alg.equals(ALG_AOA)) {
                            for (int it = 0; it < sc.konvergensi.length; it++)
                                cv.printf(Locale.US, "%d,%d,%d,%.8f%n", n, run, it, sc.konvergensi[it]);
                            cv.flush();
                        }
                        hasil.computeIfAbsent(alg + "|" + n, x -> new ArrayList<>())
                                .add(new double[]{m.makespan, m.utilPct, m.throughput, m.respMean, m.lbi, m.rurPct, sc.ms});

                        System.out.printf(Locale.US,
                                "[%-6s n=%4d run=%2d] makespan=%9.2f s | util=%6.2f%% | thr=%7.4f task/s | resp=%9.2f s | LBI=%.6f | RUR=%6.2f%% | %d ms%n",
                                alg, n, run, m.makespan, m.utilPct, m.throughput, m.respMean, m.lbi, m.rurPct, sc.ms);
                    }
                }
            }
        }

        // 3) Ringkasan (mean & std sampel)
        String[] namaMetrik = {"makespan_s", "utilisasi_vm_pct", "throughput_task_per_s", "respons_rata2_s", "lbi", "rur_cpu_pct", "waktu_komputasi_ms"};
        try (PrintWriter rs = writer(out.resolve("hasil_ringkasan.csv"))) {
            StringBuilder h = new StringBuilder("algoritma,jumlah_cloudlet,runs");
            for (String nm : namaMetrik) h.append(',').append(nm).append("_mean,").append(nm).append("_std");
            rs.println(h);
            System.out.println();
            System.out.println("=============== RINGKASAN (mean +- std, " + RUNS_PER_SIZE + " run) ===============");
            for (int n : CLOUDLET_COUNTS) {
                for (String alg : algs) {
                    List<double[]> rows = hasil.get(alg + "|" + n);
                    StringBuilder line = new StringBuilder(String.format("%s,%d,%d", alg, n, rows.size()));
                    double[] mean = new double[namaMetrik.length], sd = new double[namaMetrik.length];
                    for (int c = 0; c < namaMetrik.length; c++) {
                        double[] col = new double[rows.size()];
                        for (int r = 0; r < col.length; r++) col[r] = rows.get(r)[c];
                        mean[c] = mean(col); sd[c] = std(col);
                        line.append(String.format(Locale.US, ",%.6f,%.6f", mean[c], sd[c]));
                    }
                    rs.println(line);
                    System.out.printf(Locale.US,
                            "%-6s n=%4d | makespan %9.2f+-%7.2f | util %6.2f%% | thr %7.4f | resp %9.2f | LBI %.6f | RUR %6.2f%%%n",
                            alg, n, mean[0], sd[0], mean[1], mean[2], mean[3], mean[4], mean[5]);
                }
            }
        }

        System.out.println();
        System.out.println("Selesai. Semua hasil tersimpan di folder: " + out.toAbsolutePath());
        System.out.println("Waktu selesai : " + new Date());
        fileLog.flush();
        fileLog.close();
    }

    // ======================= DATASET SINTETIS =======================
    /** Campuran 3 kelas beban: kecil 50%, sedang 35%, besar 15% (panjang dalam MI). */
    static List<Task> generateDataset(int n, long seed) {
        Random r = new Random(seed);
        List<Task> list = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            Task t = new Task();
            double p = r.nextDouble();
            if (p < 0.50)      { t.kategori = "kecil";  t.length = 2000 + r.nextInt(8001); }
            else if (p < 0.85) { t.kategori = "sedang"; t.length = 10000 + r.nextInt(30001); }
            else               { t.kategori = "besar";  t.length = 40000 + r.nextInt(80001); }
            t.id = i;
            t.pes = 1;
            t.fileSize = 100 + r.nextInt(401);
            t.outputSize = 50 + r.nextInt(251);
            list.add(t);
        }
        return list;
    }

    static void saveDataset(Path f, List<Task> tasks) throws IOException {
        try (PrintWriter w = writer(f)) {
            w.println("cloudlet_id,kategori,length_mi,pes,file_size,output_size");
            for (Task t : tasks) w.println(t.id + "," + t.kategori + "," + t.length + "," + t.pes + "," + t.fileSize + "," + t.outputSize);
        }
    }

    // ======================= AOA =======================
    /**
     * AOA kontinu + decoding diskret. Posisi x_j in [0, M) ; VM cloudlet j = floor(x_j).
     * Operator: Pembagian/Perkalian (eksplorasi, r1 > MOA) dan Pengurangan/Penjumlahan (eksploitasi, r1 <= MOA).
     */
    static Schedule runAOA(double[] len, double[] mips, long seed) {
        long t0 = System.nanoTime();
        int n = len.length, m = mips.length;
        Random rnd = new Random(seed);
        double lb = 0.0, ub = m - 1e-9;
        double batasBawah = sum(len) / sum(mips);
        double scale = (ub - lb) * MU + lb;

        double[][] X = new double[POP_SIZE][n];
        double[] best = new double[n];
        double bestFit = Double.MAX_VALUE, bestMk = 0;
        double[] konv = new double[MAX_ITER + 1];

        for (int i = 0; i < POP_SIZE; i++) {
            for (int j = 0; j < n; j++) X[i][j] = lb + rnd.nextDouble() * (ub - lb);
            double[] fm = evaluate(X[i], len, mips, batasBawah);
            if (fm[0] < bestFit) { bestFit = fm[0]; bestMk = fm[1]; System.arraycopy(X[i], 0, best, 0, n); }
        }
        konv[0] = bestFit;

        for (int it = 1; it <= MAX_ITER; it++) {
            double moa = MOA_MIN + it * ((MOA_MAX - MOA_MIN) / MAX_ITER);
            double mop = 1.0 - Math.pow(it, 1.0 / ALPHA) / Math.pow(MAX_ITER, 1.0 / ALPHA);
            for (int i = 0; i < POP_SIZE; i++) {
                for (int j = 0; j < n; j++) {
                    double r1 = rnd.nextDouble(), r2 = rnd.nextDouble(), r3 = rnd.nextDouble();
                    double x;
                    if (r1 > moa) { // eksplorasi
                        x = (r2 > 0.5) ? best[j] / (mop + EPS) * scale   // Pembagian
                                       : best[j] * mop * scale;          // Perkalian
                    } else {        // eksploitasi
                        x = (r3 > 0.5) ? best[j] - mop * scale           // Pengurangan
                                       : best[j] + mop * scale;          // Penjumlahan
                    }
                    X[i][j] = Math.min(ub, Math.max(lb, x));
                }
                double[] fm = evaluate(X[i], len, mips, batasBawah);
                if (fm[0] < bestFit) { bestFit = fm[0]; bestMk = fm[1]; System.arraycopy(X[i], 0, best, 0, n); }
            }
            konv[it] = bestFit;
        }

        Schedule s = new Schedule();
        s.vmOf = decode(best, m);
        s.fitness = bestFit; s.makespanEst = bestMk; s.konvergensi = konv;
        s.ms = (System.nanoTime() - t0) / 1_000_000;
        return s;
    }

    static Schedule runRandom(double[] len, double[] mips, long seed) {
        long t0 = System.nanoTime();
        Random rnd = new Random(seed);
        int[] vm = new int[len.length];
        for (int j = 0; j < vm.length; j++) vm[j] = rnd.nextInt(mips.length);
        Schedule s = new Schedule();
        s.vmOf = vm;
        double[] fm = evaluateAssign(vm, len, mips, sum(len) / sum(mips));
        s.fitness = fm[0]; s.makespanEst = fm[1];
        s.ms = (System.nanoTime() - t0) / 1_000_000;
        return s;
    }

    static int[] decode(double[] x, int m) {
        int[] vm = new int[x.length];
        for (int j = 0; j < x.length; j++) vm[j] = Math.min(m - 1, Math.max(0, (int) Math.floor(x[j])));
        return vm;
    }

    static double[] evaluate(double[] x, double[] len, double[] mips, double batasBawah) {
        return evaluateAssign(decode(x, mips.length), len, mips, batasBawah);
    }

    /** Estimasi analitik: beban VM = sum(length/MIPS). Mengembalikan {fitness, makespan_estimasi}. */
    static double[] evaluateAssign(int[] vm, double[] len, double[] mips, double batasBawah) {
        int m = mips.length;
        double[] load = new double[m];
        for (int j = 0; j < vm.length; j++) load[vm[j]] += len[j] / mips[vm[j]];
        double mk = 0; for (double l : load) mk = Math.max(mk, l);
        double meanU = 0; double[] u = new double[m];
        for (int v = 0; v < m; v++) { u[v] = mk > 0 ? load[v] / mk : 0; meanU += u[v]; }
        meanU /= m;
        double lbi = 0; for (int v = 0; v < m; v++) lbi += (u[v] - meanU) * (u[v] - meanU);
        lbi /= m;
        double fit = W_MK * (mk / batasBawah) + W_LB * (lbi / 0.25);
        return new double[]{fit, mk};
    }

    // ======================= SIMULASI CLOUDSIM =======================
    static Metrics simulate(List<Task> tasks, int[] vmOf, int totalVcpu, Path detailFile) throws Exception {
        CloudSim.init(1, Calendar.getInstance(), false);
        createDatacenter("Datacenter_0");
        DatacenterBroker broker = new DatacenterBroker("Broker_0");
        int brokerId = broker.getId();

        List<Vm> vmList = new ArrayList<>();
        for (int v = 0; v < VM_MIPS.length; v++)
            vmList.add(new Vm(v, brokerId, VM_MIPS[v], VM_PES, VM_RAM, VM_BW, VM_SIZE, "Xen", new CloudletSchedulerSpaceShared()));
        broker.submitGuestList(vmList); // CloudSim 7.x (di 4.x: submitVmList)

        List<Cloudlet> cloudlets = new ArrayList<>();
        UtilizationModel full = new UtilizationModelFull();
        for (Task t : tasks) {
            Cloudlet c = new Cloudlet(t.id, t.length, t.pes, t.fileSize, t.outputSize, full, full, full);
            c.setUserId(brokerId);
            cloudlets.add(c);
        }
        broker.submitCloudletList(cloudlets);
        for (Task t : tasks) broker.bindCloudletToVm(t.id, vmOf[t.id]); // harus setelah submitCloudletList

        CloudSim.startSimulation();
        CloudSim.stopSimulation();

        List<Cloudlet> done = broker.getCloudletReceivedList();
        return hitungMetrik(done, totalVcpu, detailFile);
    }

    static Metrics hitungMetrik(List<Cloudlet> done, int totalVcpu, Path detailFile) throws IOException {
        Metrics m = new Metrics();
        double minStart = Double.MAX_VALUE, maxFinish = 0, sumResp = 0, sumCpu = 0;
        double[] busy = new double[VM_MIPS.length];
        List<Cloudlet> urut = new ArrayList<>(done);
        urut.sort(Comparator.comparingInt(Cloudlet::getCloudletId));

        for (Cloudlet c : urut) {
            if (c.getStatus() != Cloudlet.CloudletStatus.SUCCESS) continue;
            m.sukses++;
            double start = c.getExecStartTime(), finish = c.getFinishTime(), submit = c.getSubmissionTime();
            minStart = Math.min(minStart, start);
            maxFinish = Math.max(maxFinish, finish);
            sumResp += finish - submit;
            sumCpu += c.getActualCPUTime() * c.getNumberOfPes();
            busy[c.getVmId()] += (finish - start) * c.getNumberOfPes();
        }
        double T = maxFinish - minStart;
        m.makespan = T;
        m.throughput = T > 0 ? m.sukses / T : 0;
        m.respMean = m.sukses > 0 ? sumResp / m.sukses : 0;

        double[] u = new double[VM_MIPS.length];
        double meanU = 0;
        for (int v = 0; v < u.length; v++) {
            u[v] = Math.min(1.0, busy[v] / (T * VM_PES));   // delta busy / delta total CPU
            meanU += u[v];
        }
        meanU /= u.length;
        double lbi = 0; for (double x : u) lbi += (x - meanU) * (x - meanU);
        m.lbi = lbi / u.length;
        m.utilPct = 100.0 * meanU;
        m.rurPct = 100.0 * sumCpu / (totalVcpu * T);

        if (detailFile != null) {
            try (PrintWriter w = writer(detailFile)) {
                w.println("cloudlet_id,vm_id,status,length_mi,submit_s,start_s,finish_s,cpu_time_s");
                for (Cloudlet c : urut)
                    w.printf(Locale.US, "%d,%d,%s,%d,%.4f,%.4f,%.4f,%.4f%n", c.getCloudletId(), c.getVmId(),
                            c.getStatus() == Cloudlet.CloudletStatus.SUCCESS ? "SUCCESS" : "FAILED", c.getCloudletLength(),
                            c.getSubmissionTime(), c.getExecStartTime(), c.getFinishTime(), c.getActualCPUTime());
            }
        }
        return m;
    }

    static Datacenter createDatacenter(String name) throws Exception {
        List<Host> hostList = new ArrayList<>();
        int hostPes = VM_MIPS.length * VM_PES;
        double peMips = 0; for (double x : VM_MIPS) peMips = Math.max(peMips, x);
        List<Pe> peList = new ArrayList<>();
        for (int i = 0; i < hostPes; i++) peList.add(new Pe(i, new PeProvisionerSimple(peMips)));
        hostList.add(new Host(0, new RamProvisionerSimple(65536), new BwProvisionerSimple(100000),
                1_000_000, peList, new VmSchedulerTimeShared(peList)));

        DatacenterCharacteristics ch = new DatacenterCharacteristics("x86", "Linux", "Xen", hostList,
                7.0, 3.0, 0.05, 0.001, 0.0);
        return new Datacenter(name, ch, new VmAllocationPolicySimple(hostList), new LinkedList<Storage>(), 0);
    }

    // ======================= UTIL =======================
    static PrintWriter writer(Path f) throws IOException {
        return new PrintWriter(Files.newBufferedWriter(f, StandardCharsets.UTF_8));
    }

    /** Semua System.out digandakan ke file log agar output run tersimpan sebagai bukti. */
    static PrintStream setupTee(Path logFile) throws IOException {
        final PrintStream console = System.out;
        final PrintStream file = new PrintStream(new FileOutputStream(logFile.toFile()), true, "UTF-8");
        OutputStream tee = new OutputStream() {
            @Override public void write(int b) { console.write(b); file.write(b); }
            @Override public void write(byte[] b, int off, int len) { console.write(b, off, len); file.write(b, off, len); }
            @Override public void flush() { console.flush(); file.flush(); }
        };
        System.setOut(new PrintStream(tee, true, "UTF-8"));
        return file;
    }

    static double sum(double[] a) { double s = 0; for (double x : a) s += x; return s; }
    static double mean(double[] a) { return a.length == 0 ? 0 : sum(a) / a.length; }
    static double std(double[] a) {
        if (a.length < 2) return 0;
        double mu = mean(a), s = 0;
        for (double x : a) s += (x - mu) * (x - mu);
        return Math.sqrt(s / (a.length - 1));
    }
}
