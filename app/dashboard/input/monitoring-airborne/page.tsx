"use client";

import React, { useState, useMemo, useRef } from "react";
import { LiveStatisticsCard } from "@/components/LiveStatisticsCard";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import {
  Activity,
  Calendar,
  Building2,
  User,
  Search,
  Trash2,
  Plus,
  Users,
  Save,
  CheckCircle2,
  ChevronRight,
  Wind,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import SignaturePad from "react-signature-canvas";
import {
  DocumentationUploader,
  DocImage,
} from "@/components/DocumentationUploader";
import { motion, AnimatePresence } from "motion/react";
import { useAppContext } from "@/components/providers";
import { uploadImagesToSupabase } from "@/lib/upload";

// --- Interfaces ---
interface ChecklistItem {
  id: number;
  key: string;
  label: string;
  value: "Ya" | "Tidak" | "N/A" | null;
}

export default function AirborneInputPage() {
  const router = useRouter();
  const { userRole } = useAppContext();

  // Basic Info State
  const [waktu, setWaktu] = useState(new Date().toISOString().slice(0, 16));
  const ruangan = "Ruang Isolasi"; // Fixed room

  // Supervisor Management State
  const [supervisors, setSupervisors] = useState<string[]>([
    "IPCN_Adi Tresa Purnama",
  ]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(
    "IPCN_Adi Tresa Purnama",
  );
  const [isManagingSupervisors, setIsManagingSupervisors] = useState(false);
  const [newSupervisor, setNewSupervisor] = useState("");

  // Form Data State
  const [temuan, setTemuan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");
  const [fotos, setFotos] = useState<DocImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    desc: string;
    type: "success" | "error";
  } | null>(null);

  // Signatures
  const sigPadPJ = useRef<SignaturePad>(null);
  const sigPadIPCN = useRef<SignaturePad>(null);

  // --- Checklist Data ---
  const initialChecklist: ChecklistItem[] = [
    {
      id: 1,
      key: "item_1",
      label: "1. Ruangan terpisah (sendiri) / cohorting jarak > 1 meter",
      value: null,
    },
    {
      id: 2,
      key: "item_2",
      label: "2. Ventilasi memadai (sirkulasi udara 6–12 x / jam)",
      value: null,
    },
    {
      id: 3,
      key: "item_3",
      label: "3. Sinar matahari masuk ke ruangan",
      value: null,
    },
    {
      id: 4,
      key: "item_4",
      label: "4. Jendela bisa dibuka ke area luar (terbuka)",
      value: null,
    },
    {
      id: 5,
      key: "item_5",
      label: "5. Pintu ruangan selalu tertutup",
      value: null,
    },
    {
      id: 6,
      key: "item_6",
      label: "6. Transport pasien bila diperlukan saja",
      value: null,
    },
    {
      id: 7,
      key: "item_7",
      label: "7. Pasien memakai masker saat keluar ruangan",
      value: null,
    },
    {
      id: 8,
      key: "item_8",
      label: "8. Tersedia fasilitas cuci tangan",
      value: null,
    },
    {
      id: 9,
      key: "item_9",
      label: "9. Petugas melakukan cuci tangan sesuai 5 momen",
      value: null,
    },
    {
      id: 10,
      key: "item_10",
      label: "10. Menggunakan masker saat kontak dengan pasien",
      value: null,
    },
    {
      id: 11,
      key: "item_11",
      label: "11. Memakai sarung tangan bila akan kontak dengan cairan tubuh",
      value: null,
    },
    {
      id: 12,
      key: "item_12",
      label: "12. Memakai kacamata goggle bila perlu",
      value: null,
    },
    {
      id: 13,
      key: "item_13",
      label: "13. Memakai gaun pelindung bila perlu",
      value: null,
    },
    {
      id: 14,
      key: "item_14",
      label: "14. Memberikan edukasi kepada pasien",
      value: null,
    },
    {
      id: 15,
      key: "item_15",
      label: "15. Memberikan edukasi kepada keluarga pasien",
      value: null,
    },
    {
      id: 16,
      key: "item_16",
      label:
        "16. Setelah pasien pulang, bersihkan ruangan dengan cairan desinfektan sesuai standar",
      value: null,
    },
  ];

  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);

  // --- Statistics Calculation (Real-time) ---
  const stats = useMemo(() => {
    let totalDinilai = 0;
    let totalPatuh = 0;
    let totalTidakPatuh = 0;

    checklist.forEach((item) => {
      if (item.value === "Ya") {
        totalDinilai++;
        totalPatuh++;
      } else if (item.value === "Tidak") {
        totalDinilai++;
        totalTidakPatuh++;
      }
    });

    const persentase =
      totalDinilai === 0 ? 0 : Math.round((totalPatuh / totalDinilai) * 100);

    let statusText = "Perlu Tindak Lanjut";
    let statusColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
    if (persentase >= 85) {
      statusText = "Baik";
      statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    } else if (persentase >= 70) {
      statusText = "Cukup";
      statusColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
    }

    return {
      totalDinilai,
      totalPatuh,
      totalTidakPatuh,
      persentase,
      statusText,
      statusColor,
    };
  }, [checklist]);

  // --- Handlers ---
  const handleAddSupervisor = () => {
    if (newSupervisor.trim() && !supervisors.includes(newSupervisor.trim())) {
      setSupervisors((prev) => [...prev, newSupervisor.trim()]);
      setSelectedSupervisor(newSupervisor.trim());
      setNewSupervisor("");
    }
  };

  const handleDeleteSupervisor = (sup: string) => {
    if (supervisors.length > 1) {
      setSupervisors((prev) => prev.filter((s) => s !== sup));
      if (selectedSupervisor === sup) {
        setSelectedSupervisor(supervisors.filter((s) => s !== sup)[0]);
      }
    }
  };

  const handleChecklistChange = (id: number, val: "Ya" | "Tidak" | "N/A") => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value: val } : item)),
    );
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setToastMessage(null);

    try {
      const isComplete = checklist.every((item) => item.value !== null);
      if (!isComplete) {
        throw new Error("Mohon lengkapi semua item checklist (Ya/Tidak/N/A).");
      }

      const ttdPj = !sigPadPJ.current?.isEmpty()
        ? sigPadPJ.current?.getCanvas().toDataURL("image/png")
        : null;
      const ttdIpcn = !sigPadIPCN.current?.isEmpty()
        ? sigPadIPCN.current?.getCanvas().toDataURL("image/png")
        : null;

      const supabase = getSupabase();

      const uploadedImageUrls = await uploadImagesToSupabase(
        supabase,
        fotos,
        "monitoring",
        "airborne",
      );

      // Store checklist as JSON
      const checklistJson = checklist.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as any);

      const { error } = await supabase
        .from("penempatan_pasien_airbone")
        .insert([
          {
            waktu: new Date(waktu).toISOString(),
            ruangan: ruangan,
            supervisor: selectedSupervisor,
            checklist_json: checklistJson,
            persentase: stats.persentase,
            temuan: temuan.trim() || null,
            rekomendasi: rekomendasi.trim() || null,
            foto: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
            ttd_pj: ttdPj,
            ttd_ipcn: ttdIpcn,
          },
        ]);

      if (error) throw error;

      setToastMessage({
        title: "Berhasil",
        desc: "Data penempatan pasien airbone berhasil disimpan!",
        type: "success",
      });

      setTimeout(() => {
        router.push("/dashboard/input");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setToastMessage({
        title: "Gagal",
        desc: err.message || "Terjadi kesalahan saat menyimpan data.",
        type: "error",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 pb-32">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 z-[100] p-4 rounded-2xl shadow-2xl flex items-start gap-4 border max-w-sm w-full backdrop-blur-md ${
              toastMessage.type === "success"
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-100"
                : "bg-rose-500/20 border-rose-500/50 text-rose-100"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <Trash2 className="w-6 h-6 text-rose-400 shrink-0" />
            )}
            <div>
              <h4 className="font-bold">{toastMessage.title}</h4>
              <p className="text-sm opacity-90">{toastMessage.desc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Info Card */}
      <div className="glass-card p-6 lg:p-10 rounded-[2.5rem] border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
          <button
            onClick={() => router.push("/dashboard/input/isolasi")}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors flex items-center justify-center group"
          >
            <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>

          <div className="flex flex-col gap-1">
            <h1 className="text-2xl lg:text-3xl font-heading font-bold tracking-wide text-gradient">
              Input Penempatan Pasien Airbone
            </h1>
            <p className="text-sm text-slate-400 mt-1 uppercase tracking-wider font-medium">
              Monitoring kepatuhan penempatan pasien dengan transmisi airborne
              sesuai standar PPI Rumah Sakit.
            </p>
          </div>
        </div>
      </div>

      {/* Basic Setup Card */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
              Waktu Input
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="datetime-local"
                value={waktu}
                onChange={(e) => setWaktu(e.target.value)}
                className="w-full bg-navy-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Ruangan
            </label>
            <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-300 text-sm flex items-center gap-2 cursor-not-allowed opacity-80">
              <Building2 className="w-4 h-4 text-blue-400" /> {ruangan}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Supervisor / Observer
              </label>
              {(userRole === "IPCN" || userRole === "Admin") && (
                <button
                  onClick={() =>
                    setIsManagingSupervisors(!isManagingSupervisors)
                  }
                  className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300 tracking-widest"
                >
                  Kelola Inspector
                </button>
              )}
            </div>

            {isManagingSupervisors ? (
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nama supervisor baru..."
                    value={newSupervisor}
                    onChange={(e) => setNewSupervisor(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 text-sm text-white focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={handleAddSupervisor}
                    className="px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors"
                  >
                    Tambah
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {supervisors.map((sup) => (
                    <div
                      key={sup}
                      className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5"
                    >
                      <span className="text-sm text-slate-300">{sup}</span>
                      <button
                        onClick={() => handleDeleteSupervisor(sup)}
                        className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative group">
                <select
                  value={selectedSupervisor}
                  onChange={(e) => setSelectedSupervisor(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-white text-sm outline-none focus:border-blue-500/50 appearance-none hover:bg-white/10 transition-colors"
                >
                  {supervisors.map((sup) => (
                    <option
                      key={sup}
                      value={sup}
                      className="bg-[#0f172a] text-white"
                    >
                      {sup}
                    </option>
                  ))}
                </select>
                <ChevronRight className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checklist Card */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 shadow-xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" /> CHECKLIST
          PENEMPATAN PASIEN AIRBONE
        </h3>

        <div className="space-y-4">
          {checklist.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
            >
              <p className="text-sm font-medium text-slate-200 mb-4">
                {item.label}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(["Ya", "Tidak", "N/A"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => handleChecklistChange(item.id, option)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      item.value === option
                        ? option === "Ya"
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                          : option === "Tidak"
                            ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                            : "bg-slate-500 text-white shadow-lg shadow-slate-500/20"
                        : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <LiveStatisticsCard
        totalDinilai={stats.totalDinilai}
        totalPatuh={stats.totalPatuh}
        totalTidakPatuh={stats.totalTidakPatuh}
        persentase={stats.persentase}
        statusText={stats.statusText}
      />
      {/* Temuan & Rekomendasi */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 space-y-6">
        <h3 className="text-lg font-bold text-white mb-2">
          Temuan & Rekomendasi
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">
              Temuan Lapangan
            </label>
            <textarea
              value={temuan}
              onChange={(e) => setTemuan(e.target.value)}
              placeholder="Contoh: Pintu ruang isolasi ditemukan terbuka saat observasi..."
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500/50 min-h-[100px] resize-y placeholder:text-slate-600"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">
              Rekomendasi Tindak Lanjut
            </label>
            <textarea
              value={rekomendasi}
              onChange={(e) => setRekomendasi(e.target.value)}
              placeholder="Contoh: Edukasi ulang petugas terkait manajemen pintu isolasi airbone..."
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500/50 min-h-[100px] resize-y placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Dokumentasi */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5">
        <h3 className="text-lg font-bold text-white mb-6">
          Fotografi Bukti / Dokumentasi (Opsional)
        </h3>
        <DocumentationUploader images={fotos} setImages={setFotos} />
      </div>

      {/* Tanda Tangan */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5">
        <h3 className="text-lg font-bold text-white mb-6">
          Verifikasi Digital
        </h3>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex justify-between">
              PJ Ruang Isolasi
              <button
                onClick={() => sigPadPJ.current?.clear()}
                className="hover:text-amber-400"
              >
                Clear
              </button>
            </label>
            <div className="bg-white rounded-2xl overflow-hidden border-2 border-white/10">
              <SignaturePad
                ref={sigPadPJ}
                canvasProps={{ className: "w-full h-40 cursor-crosshair" }}
                penColor="black"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex justify-between">
              IPCN / IPCLN (Supervisor)
              <button
                onClick={() => sigPadIPCN.current?.clear()}
                className="hover:text-amber-400"
              >
                Clear
              </button>
            </label>
            <div className="bg-white rounded-2xl overflow-hidden border-2 border-white/10">
              <SignaturePad
                ref={sigPadIPCN}
                canvasProps={{ className: "w-full h-40 cursor-crosshair" }}
                penColor="black"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TOMBOL SIMPAN - PERMANEN DI BAWAH (No fixed/sticky footer) */}
      <div className="pt-6">
        <motion.button
          onClick={handleSubmit}
          disabled={isSubmitting}
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(37, 99, 235, 0)",
              "0 0 0 15px rgba(37, 99, 235, 0.3)",
              "0 0 0 0 rgba(37, 99, 235, 0)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white text-base font-bold uppercase tracking-[0.2em] rounded-2xl transition-all border border-blue-400/30 group disabled:opacity-50 overflow-hidden relative shadow-[0_0_20px_rgba(37,99,235,0.4)] glow-blue"
        >
          <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out" />
          {isSubmitting ? (
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Menyimpan...</span>
            </div>
          ) : (
            <>
              <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="tracking-[0.2em]">Simpan Data</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
