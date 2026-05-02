'use client';

import React, { useState, useMemo, useRef } from 'react';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Building2, Search, Trash2, Plus, Save, CheckCircle2, ChevronRight, Activity, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import SignaturePad from 'react-signature-canvas';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/components/providers';
import { uploadImagesToSupabase } from '@/lib/upload';

// --- Interfaces ---
interface ChecklistItem {
  id: string;
  section: string;
  label: string;
  value: 'Ya' | 'Tidak' | 'N/A' | null;
}

export default function KamarJenazahInputPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  
  // Basic Info State
  const [waktu, setWaktu] = useState(new Date().toISOString().slice(0, 16));
  const ruangan = "Kamar Jenazah"; // Fixed room
  
  // Supervisor Management State
  const [supervisors, setSupervisors] = useState<string[]>(['IPCN_Adi Tresa Purnama']);
  const [selectedSupervisor, setSelectedSupervisor] = useState('IPCN_Adi Tresa Purnama');
  const [isManagingSupervisors, setIsManagingSupervisors] = useState(false);
  const [newSupervisor, setNewSupervisor] = useState('');

  // Form Data State
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [fotos, setFotos] = useState<DocImage[]>([]);
  const [namaPj, setNamaPj] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{title: string, desc: string, type: 'success' | 'error'} | null>(null);

  // Signatures
  const sigPadPJ = useRef<SignaturePad>(null);
  const sigPadIPCN = useRef<SignaturePad>(null);

  // --- Checklist Data ---
  const initialChecklist: ChecklistItem[] = [
    // KEBERSIHAN RUANGAN DAN PERALATAN
    { id: 'kebersihan_a', section: 'KEBERSIHAN RUANGAN DAN PERALATAN', label: 'Lantai bersih dan tidak licin', value: null },
    { id: 'kebersihan_b', section: 'KEBERSIHAN RUANGAN DAN PERALATAN', label: 'Permukaan tidak berdebu', value: null },
    { id: 'kebersihan_c', section: 'KEBERSIHAN RUANGAN DAN PERALATAN', label: 'Tidak ada laba-laba / sarang kotoran', value: null },
    { id: 'kebersihan_d', section: 'KEBERSIHAN RUANGAN DAN PERALATAN', label: 'Tempat sampah tertutup', value: null },
    { id: 'kebersihan_e', section: 'KEBERSIHAN RUANGAN DAN PERALATAN', label: 'Wastafel cuci tangan selalu bersih dan bebas dari peralatan', value: null },
    { id: 'kebersihan_f', section: 'KEBERSIHAN RUANGAN DAN PERALATAN', label: 'Keran selalu bersih dan tidak berkarat', value: null },
    { id: 'kebersihan_g', section: 'KEBERSIHAN RUANGAN DAN PERALATAN', label: 'Penutup keranda bersih', value: null },
    { id: 'kebersihan_h', section: 'KEBERSIHAN RUANGAN DAN PERALATAN', label: 'Mobil jenazah bersih', value: null },
    { id: 'kebersihan_i', section: 'KEBERSIHAN RUANGAN DAN PERALATAN', label: 'Mobil jenazah dibersihkan setiap habis pakai', value: null },

    // FASILITAS
    { id: 'fasilitas_a', section: 'FASILITAS', label: 'Tersedia APD lengkap (sarung tangan, masker, tutup kepala, goggles, apron, sepatu boot)', value: null },
    { id: 'fasilitas_b', section: 'FASILITAS', label: 'Alat cuci tangan lengkap (wastafel, sabun antiseptik, tissue, handrub)', value: null },
    { id: 'fasilitas_c', section: 'FASILITAS', label: 'Tersedia handrub di mobil jenazah', value: null },
    { id: 'fasilitas_d', section: 'FASILITAS', label: 'Tersedia spillkit di mobil jenazah', value: null },
    { id: 'fasilitas_e', section: 'FASILITAS', label: 'Tersedia tempat sampah infeksius dan non infeksius', value: null },
    { id: 'fasilitas_f', section: 'FASILITAS', label: 'Tersedia tempat linen kotor', value: null },
  ];

  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);

  // Group checklist by section for rendering
  const sections = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const item of checklist) {
      if (!map.has(item.section)) {
        map.set(item.section, []);
      }
      map.get(item.section)!.push(item);
    }
    return Array.from(map.entries());
  }, [checklist]);

  // --- Statistics Calculation (Real-time) ---
  const stats = useMemo(() => {
    let totalDinilai = 0;
    let totalPatuh = 0;
    let totalTidakPatuh = 0;

    checklist.forEach(item => {
      if (item.value === 'Ya') {
        totalDinilai++;
        totalPatuh++;
      } else if (item.value === 'Tidak') {
        totalDinilai++;
        totalTidakPatuh++;
      }
    });

    const persentase = totalDinilai === 0 ? 0 : Math.round((totalPatuh / totalDinilai) * 100);
    
    let statusText = 'Perlu Tindak Lanjut';
    let statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (persentase >= 85) {
      statusText = 'Baik';
      statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    } else if (persentase >= 70) {
      statusText = 'Cukup';
      statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }

    return { totalDinilai, totalPatuh, totalTidakPatuh, persentase, statusText, statusColor };
  }, [checklist]);

  // --- Handlers ---
  const handleAddSupervisor = () => {
    if (newSupervisor.trim() && !supervisors.includes(newSupervisor.trim())) {
      setSupervisors(prev => [...prev, newSupervisor.trim()]);
      setSelectedSupervisor(newSupervisor.trim());
      setNewSupervisor('');
    }
  };

  const handleDeleteSupervisor = (sup: string) => {
    if (supervisors.length > 1) {
      setSupervisors(prev => prev.filter(s => s !== sup));
      if (selectedSupervisor === sup) {
        setSelectedSupervisor(supervisors.filter(s => s !== sup)[0]);
      }
    }
  };

  const handleChecklistChange = (id: string, val: 'Ya' | 'Tidak' | 'N/A') => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, value: val } : item));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setToastMessage(null);

    try {
      const isComplete = checklist.every(item => item.value !== null) && !!namaPj.trim();
      if (!isComplete) {
        throw new Error('Mohon lengkapi semua item checklist dan nama PJ.');
      }
      
      const ttdPj = !sigPadPJ.current?.isEmpty() ? sigPadPJ.current?.getCanvas().toDataURL('image/png') : null;
      const ttdIpcn = !sigPadIPCN.current?.isEmpty() ? sigPadIPCN.current?.getCanvas().toDataURL('image/png') : null;

      const supabase = getSupabase();
      
      const uploadedImageUrls = await uploadImagesToSupabase(supabase, fotos, 'monitoring', 'jenazah');

      // Store checklist as JSON field checklist_json
      const checklistJson = checklist.reduce((acc, item) => {
        acc[item.id] = item.value;
        return acc;
      }, {} as any);

      // Save to audit_kamar_jenazah table using JSON payload structure
      const insertData = {
        waktu: new Date(waktu).toISOString(),
        ruangan: ruangan,
        supervisor: selectedSupervisor,
        checklist_json: checklistJson,
        persentase: stats.persentase,
        status: stats.statusText,
        temuan: temuan.trim() || null,
        rekomendasi: rekomendasi.trim() || null,
        dokumentasi: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
        nama_pj: namaPj.trim(),
        ttd_pj: ttdPj,
        ttd_ipcn: ttdIpcn,
      };

      const { error } = await supabase
        .from('audit_kamar_jenazah')
        .insert([insertData]);

      if (error) { console.error('Observer DB Error:', error); throw error; } // Ignore table missing for dev gracefully

      setToastMessage({ title: 'Berhasil', desc: 'Data Audit Kamar Jenazah berhasil disimpan!', type: 'success' });
      
      setTimeout(() => {
        router.push('/dashboard/input/isolasi');
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setToastMessage({ title: 'Gagal', desc: err.message || 'Terjadi kesalahan saat menyimpan data.', type: 'error' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 pb-32">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 z-[100] p-4 rounded-2xl shadow-2xl flex items-start gap-4 border max-w-sm w-full backdrop-blur-md ${
              toastMessage.type === 'success' 
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-100' 
              : 'bg-rose-500/20 border-rose-500/50 text-rose-100'
            }`}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /> : <Trash2 className="w-6 h-6 text-rose-400 shrink-0" />}
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
            onClick={() => router.push('/dashboard/input/isolasi')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors flex items-center justify-center group"
          >
            <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
          
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl lg:text-3xl font-heading font-bold tracking-wide text-gradient">
              Input Audit Kamar Jenazah
            </h1>
            <p className="text-sm text-slate-400 tracking-wider font-medium">
              Audit kepatuhan Pencegahan dan Pengendalian Infeksi area Kamar Jenazah
            </p>
          </div>
        </div>
      </div>

      {/* Basic Setup Card */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Waktu Audit</label>
            <input 
              type="datetime-local" 
              value={waktu}
              onChange={(e) => setWaktu(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50 hover:bg-white/10 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[0.6]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Ruangan</label>
            <div className="relative group">
              <select 
                value={ruangan}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-slate-300 text-sm outline-none focus:border-blue-500/50 appearance-none hover:bg-white/10 transition-colors cursor-not-allowed opacity-80"
              >
                <option value={ruangan} className="bg-[#0f172a] text-white">{ruangan}</option>
              </select>
              <Building2 className="w-4 h-4 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronRight className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Supervisor / IPCN</label>
              {(userRole === 'IPCN' || userRole === 'Admin') && (
                <button 
                  onClick={() => setIsManagingSupervisors(!isManagingSupervisors)}
                  className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300 tracking-widest flex items-center gap-1"
                >
                  <Search className="w-3 h-3" /> Kelola Supervisor
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
                    className="px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Tambah
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {supervisors.map(sup => (
                    <div key={sup} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-sm text-slate-300">{sup}</span>
                      <button onClick={() => handleDeleteSupervisor(sup)} className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-md transition-colors flex items-center gap-2 text-xs">
                        <Trash2 className="w-4 h-4" /> Hapus
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
                  {supervisors.map(sup => <option key={sup} value={sup} className="bg-[#0f172a] text-white">{sup}</option>)}
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
          <CheckCircle2 className="w-5 h-5 text-blue-400" /> CEKLIST KAMAR JENAZAH
        </h3>

        <div className="space-y-8 mb-8">
          {sections.map(([section, items]) => (
            <div key={section} className="space-y-4">
              <h4 className="text-blue-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2 border-b border-white/10 pb-2">
                <Sparkles className="w-4 h-4" /> {section}
              </h4>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="p-4 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                    <p className="text-sm font-medium text-slate-200 mb-4">{item.label}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Ya', 'Tidak', 'N/A'] as const).map(option => (
                        <label key={option} className="cursor-pointer relative">
                          <input
                            type="radio"
                            name={item.id}
                            value={option}
                            checked={item.value === option}
                            onChange={() => handleChecklistChange(item.id, option)}
                            className="peer sr-only"
                          />
                          <div className={`py-2 rounded-xl text-xs font-bold text-center transition-all ${
                            item.value === option
                            ? option === 'Ya' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                              : option === 'Tidak' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                              : 'bg-slate-500 text-white shadow-lg shadow-slate-500/20'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5 peer-checked:bg-white/10'
                          }`}>
                            {option === 'Ya' ? 'Ya' : option === 'Tidak' ? 'Tidak' : 'N/A'}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <LiveStatisticsCard 
          totalDinilai={stats.totalDinilai}
          totalPatuh={stats.totalPatuh}
          totalTidakPatuh={stats.totalTidakPatuh}
          persentase={stats.persentase}
          statusText={stats.statusText}
          title="HASIL OBSERVASI JENAZAH"
        />
      </div>
      {/* Temuan & Rekomendasi */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 space-y-6">
        <h3 className="text-lg font-bold text-white mb-2">Temuan & Rekomendasi</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Temuan Lapangan</label>
            <textarea 
              value={temuan}
              onChange={e => setTemuan(e.target.value)}
              placeholder="Contoh: Spillkit belum tersedia di mobil jenazah, Tempat sampah tidak tertutup..."
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500/50 min-h-[120px] resize-y placeholder:text-slate-600"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Rekomendasi Tindak Lanjut</label>
            <textarea 
              value={rekomendasi}
              onChange={e => setRekomendasi(e.target.value)}
              placeholder="Contoh: Lengkapi spillkit mobil jenazah, Ganti tempat sampah tertutup..."
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500/50 min-h-[120px] resize-y placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Dokumentasi */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5">
        <h3 className="text-lg font-bold text-white mb-6">Fotografi Bukti / Dokumentasi (Opsional)</h3>
        <DocumentationUploader 
          images={fotos}
          setImages={setFotos}
        />
      </div>

      {/* Tanda Tangan */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 space-y-6">
        <h3 className="text-lg font-bold text-white mb-6">Verifikasi Digital</h3>
        
        <div className="space-y-4 md:col-span-2 mb-8">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Nama PJ Ruangan</label>
          <input 
            type="text" 
            value={namaPj}
            onChange={e => setNamaPj(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50"
            placeholder="Ketik nama PJ ruangan"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex justify-between">
              Tanda Tangan PJ Ruangan
              <button onClick={() => sigPadPJ.current?.clear()} className="hover:text-amber-400 text-[10px]">Clear Signature</button>
            </label>
            <div className="bg-white rounded-2xl overflow-hidden border-2 border-white/10">
              <SignaturePad 
                ref={sigPadPJ}
                canvasProps={{ className: "w-full h-40 cursor-crosshair touch-none" }} 
                penColor="black"
              />
            </div>
            <div className="flex justify-end pt-1">
               <button onClick={() => sigPadPJ.current?.clear()} className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300">Ulangi</button>
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex justify-between">
              IPCN / IPCLN (Supervisor)
              <button onClick={() => sigPadIPCN.current?.clear()} className="hover:text-amber-400 text-[10px]">Clear Signature</button>
            </label>
            <div className="bg-white rounded-2xl overflow-hidden border-2 border-white/10">
              <SignaturePad 
                ref={sigPadIPCN}
                canvasProps={{ className: "w-full h-40 cursor-crosshair touch-none" }} 
                penColor="black"
              />
            </div>
            <div className="flex justify-end pt-1">
               <button onClick={() => sigPadIPCN.current?.clear()} className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300">Ulangi</button>
            </div>
          </div>
        </div>
      </div>

      {/* TOMBOL SIMPAN - PERMANEN DI BAWAH */}
      <div className="pt-6">
        <motion.button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(37, 99, 235, 0)",
              "0 0 0 15px rgba(37, 99, 235, 0.3)",
              "0 0 0 0 rgba(37, 99, 235, 0)"
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white text-base font-bold uppercase tracking-[0.2em] rounded-2xl transition-all border border-blue-400/30 group disabled:opacity-50 overflow-hidden relative shadow-[0_0_20px_rgba(37,99,235,0.4)] glow-blue"
        >
          <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out" />
          {isSubmitting ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Simpan Data Audit</span>
            </>
          )}
        </motion.button>
      </div>

    </div>
  );
}
