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

export default function LaboratoriumInputPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  
  // Basic Info State
  const [waktu, setWaktu] = useState(new Date().toISOString().slice(0, 16));
  const ruangan = "Laboratorium"; // Fixed room
  
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
    // A. PERSONAL
    { id: 'personal_a', section: 'A. PERSONAL', label: 'Kuku pendek dan bersih', value: null },
    { id: 'personal_b', section: 'A. PERSONAL', label: 'Tidak menggunakan perhiasan/aksesoris tangan', value: null },
    { id: 'personal_c', section: 'A. PERSONAL', label: 'Menggunakan APD lengkap', value: null },
    { id: 'personal_d', section: 'A. PERSONAL', label: 'Melakukan cuci tangan sesuai dengan prosedur', value: null },
    { id: 'personal_e', section: 'A. PERSONAL', label: 'Pemeriksaan kesehatan secara berkala', value: null },
    { id: 'personal_f', section: 'A. PERSONAL', label: 'Mengetahui cara penanganan tumpahan cairan tubuh dengan menggunakan spill kit', value: null },
    { id: 'personal_g', section: 'A. PERSONAL', label: 'Sudah mendapatkan imunisasi vaksin penyakit menular', value: null },
    { id: 'personal_h', section: 'A. PERSONAL', label: 'Melapor bila terpajan limbah infeksius (cair, tajam)', value: null },

    // B. FASILITAS
    { id: 'fasilitas_a', section: 'B. FASILITAS', label: 'Tersedia IPAL dan berfungsi dengan baik', value: null },
    { id: 'fasilitas_b', section: 'B. FASILITAS', label: 'Tersedia spill kit untuk penanganan tumpahan cairan tubuh', value: null },
    { id: 'fasilitas_c', section: 'B. FASILITAS', label: 'Trolley pengangkutan sampah tertutup', value: null },
    { id: 'fasilitas_d', section: 'B. FASILITAS', label: 'Trolley pengangkutan sampah dibersihkan setelah selesai digunakan', value: null },
    { id: 'fasilitas_e', section: 'B. FASILITAS', label: 'Tersedia APD petugas', value: null },

    // C. PROSES PENGELOLAAN LIMBAH CAIR (INFEKSIUS)
    { id: 'limbah_cair_a', section: 'C. PROSES PENGELOLAAN LIMBAH CAIR (INFEKSIUS)', label: 'Limbah cair dibuang ke IPAL melalui spoelhoek', value: null },
    { id: 'limbah_cair_b', section: 'C. PROSES PENGELOLAAN LIMBAH CAIR (INFEKSIUS)', label: 'Saluran pembuangan ke IPAL lancar', value: null },
    { id: 'limbah_cair_c', section: 'C. PROSES PENGELOLAAN LIMBAH CAIR (INFEKSIUS)', label: 'Tidak ada limbah cair di dalam tempat limbah padat', value: null },
    { id: 'limbah_cair_d', section: 'C. PROSES PENGELOLAAN LIMBAH CAIR (INFEKSIUS)', label: 'Baku mutu limbah sesuai dengan standar', value: null },
    { id: 'limbah_cair_e', section: 'C. PROSES PENGELOLAAN LIMBAH CAIR (INFEKSIUS)', label: 'Sampel feces dan sputum dibuang ke limbah infeksius bersama tabungnya', value: null },
    { id: 'limbah_cair_f', section: 'C. PROSES PENGELOLAAN LIMBAH CAIR (INFEKSIUS)', label: 'Sampel urine dibuang ke spoelhoek, wadah dibuang ke limbah infeksius', value: null },

    // D. PROSES PEMBUANGAN DARAH DAN KOMPONEN DARAH
    { id: 'pembuangan_darah_a', section: 'D. PROSES PEMBUANGAN DARAH DAN KOMPONEN DARAH', label: 'Darah dan komponen darah yang sudah diambil ke ruangan dan tidak terpakai, dikembalikan ke unit pelayanan darah', value: null },
    { id: 'pembuangan_darah_b', section: 'D. PROSES PEMBUANGAN DARAH DAN KOMPONEN DARAH', label: 'Darah dan komponen darah yang rusak atau kadaluwarsa dikumpulkan di tempat khusus penyimpanan darah di unit pelayanan darah', value: null },
    { id: 'pembuangan_darah_c', section: 'D. PROSES PEMBUANGAN DARAH DAN KOMPONEN DARAH', label: 'Petugas kebersihan melakukan kebersihan tangan saat mengolah limbah darah dan komponen darah', value: null },
    { id: 'pembuangan_darah_d', section: 'D. PROSES PEMBUANGAN DARAH DAN KOMPONEN DARAH', label: 'Petugas menggunakan APD', value: null },
    { id: 'pembuangan_darah_e', section: 'D. PROSES PEMBUANGAN DARAH DAN KOMPONEN DARAH', label: 'Petugas membuang darah dan komponen darah yang rusak/kadaluwarsa ke IPAL melalui spoelhoek', value: null },
    { id: 'pembuangan_darah_f', section: 'D. PROSES PEMBUANGAN DARAH DAN KOMPONEN DARAH', label: 'Ada berita acara pembuangan sisa darah rusak dan kadaluwarsa', value: null },
    { id: 'pembuangan_darah_g', section: 'D. PROSES PEMBUANGAN DARAH DAN KOMPONEN DARAH', label: 'Sampel darah dibuang ke limbah infeksius bersama tabungnya', value: null },

    // E. PROSES PENGELOLAAN LIMBAH BENDA TAJAM
    { id: 'limbah_tajam_a', section: 'E. PROSES PENGELOLAAN LIMBAH BENDA TAJAM', label: 'Tidak menekuk dan mematahkan benda tajam dan jarum', value: null },
    { id: 'limbah_tajam_b', section: 'E. PROSES PENGELOLAAN LIMBAH BENDA TAJAM', label: 'Tidak menutup kembali jarum suntik bekas pakai', value: null },
    { id: 'limbah_tajam_c', section: 'E. PROSES PENGELOLAAN LIMBAH BENDA TAJAM', label: 'Pemisahan limbah benda tajam dilakukan segera oleh penghasil limbah', value: null },
    { id: 'limbah_tajam_d', section: 'E. PROSES PENGELOLAAN LIMBAH BENDA TAJAM', label: 'Tidak memberikan benda tajam habis pakai ke orang lain', value: null },
    { id: 'limbah_tajam_e', section: 'E. PROSES PENGELOLAAN LIMBAH BENDA TAJAM', label: 'Jika harus memberikan benda tajam ke orang lain gunakan container', value: null },
    { id: 'limbah_tajam_f', section: 'E. PROSES PENGELOLAAN LIMBAH BENDA TAJAM', label: 'Limbah benda tajam dimasukkan ke safety box', value: null },
    { id: 'limbah_tajam_g', section: 'E. PROSES PENGELOLAAN LIMBAH BENDA TAJAM', label: 'Safety box sesuai standar, posisi aman dan tertutup', value: null },
    { id: 'limbah_tajam_h', section: 'E. PROSES PENGELOLAAN LIMBAH BENDA TAJAM', label: 'Safety box jika ¾ penuh (atau >48 jam) ditutup rapat dan dibuang', value: null },
    { id: 'limbah_tajam_i', section: 'E. PROSES PENGELOLAAN LIMBAH BENDA TAJAM', label: 'Ada bukti data limbah benda tajam yang diangkut', value: null },

    // F. PROSES PENGELOLAAN LIMBAH PADAT
    { id: 'limbah_padat_a', section: 'F. PROSES PENGELOLAAN LIMBAH PADAT', label: 'Isi tempat sampah berkantong kuning hanya limbah infeksius', value: null },
    { id: 'limbah_padat_b', section: 'F. PROSES PENGELOLAAN LIMBAH PADAT', label: 'Isi tempat sampah berkantong hitam hanya limbah non infeksius', value: null },
    { id: 'limbah_padat_c', section: 'F. PROSES PENGELOLAAN LIMBAH PADAT', label: 'Bila sudah ¾ penuh, kantong plastik diikat dan diangkut petugas', value: null },
    { id: 'limbah_padat_d', section: 'F. PROSES PENGELOLAAN LIMBAH PADAT', label: 'Tidak dilakukan pengosongan sampah dari satu kantong ke kantong lainnya', value: null },
    { id: 'limbah_padat_e', section: 'F. PROSES PENGELOLAAN LIMBAH PADAT', label: 'Lakukan penggantian kresek tempat sampah setelah diangkut', value: null },
    { id: 'limbah_padat_f', section: 'F. PROSES PENGELOLAAN LIMBAH PADAT', label: 'Tidak ada penumpukan sampah di ruangan/area publik', value: null },
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
      
      const uploadedImageUrls = await uploadImagesToSupabase(supabase, fotos, 'monitoring', 'laboratorium');

      // Store checklist as JSON
      const checklistJson = checklist.reduce((acc, item) => {
        acc[item.id] = item.value;
        return acc;
      }, {} as any);

      // Save to audit_laboratorium_monitoring
      const insertData = {
        waktu: new Date(waktu).toISOString(),
        ruangan: ruangan,
        supervisor: selectedSupervisor,
        
        // Form Checklist Map
        personal_a: checklistJson['personal_a'],
        personal_b: checklistJson['personal_b'],
        personal_c: checklistJson['personal_c'],
        personal_d: checklistJson['personal_d'],
        personal_e: checklistJson['personal_e'],
        personal_f: checklistJson['personal_f'],
        personal_g: checklistJson['personal_g'],
        personal_h: checklistJson['personal_h'],

        fasilitas_a: checklistJson['fasilitas_a'],
        fasilitas_b: checklistJson['fasilitas_b'],
        fasilitas_c: checklistJson['fasilitas_c'],
        fasilitas_d: checklistJson['fasilitas_d'],
        fasilitas_e: checklistJson['fasilitas_e'],

        limbah_cair_a: checklistJson['limbah_cair_a'],
        limbah_cair_b: checklistJson['limbah_cair_b'],
        limbah_cair_c: checklistJson['limbah_cair_c'],
        limbah_cair_d: checklistJson['limbah_cair_d'],
        limbah_cair_e: checklistJson['limbah_cair_e'],
        limbah_cair_f: checklistJson['limbah_cair_f'],

        pembuangan_darah_a: checklistJson['pembuangan_darah_a'],
        pembuangan_darah_b: checklistJson['pembuangan_darah_b'],
        pembuangan_darah_c: checklistJson['pembuangan_darah_c'],
        pembuangan_darah_d: checklistJson['pembuangan_darah_d'],
        pembuangan_darah_e: checklistJson['pembuangan_darah_e'],
        pembuangan_darah_f: checklistJson['pembuangan_darah_f'],
        pembuangan_darah_g: checklistJson['pembuangan_darah_g'],

        limbah_tajam_a: checklistJson['limbah_tajam_a'],
        limbah_tajam_b: checklistJson['limbah_tajam_b'],
        limbah_tajam_c: checklistJson['limbah_tajam_c'],
        limbah_tajam_d: checklistJson['limbah_tajam_d'],
        limbah_tajam_e: checklistJson['limbah_tajam_e'],
        limbah_tajam_f: checklistJson['limbah_tajam_f'],
        limbah_tajam_g: checklistJson['limbah_tajam_g'],
        limbah_tajam_h: checklistJson['limbah_tajam_h'],
        limbah_tajam_i: checklistJson['limbah_tajam_i'],

        limbah_padat_a: checklistJson['limbah_padat_a'],
        limbah_padat_b: checklistJson['limbah_padat_b'],
        limbah_padat_c: checklistJson['limbah_padat_c'],
        limbah_padat_d: checklistJson['limbah_padat_d'],
        limbah_padat_e: checklistJson['limbah_padat_e'],
        limbah_padat_f: checklistJson['limbah_padat_f'],
        
        persentase: stats.persentase,
        temuan: temuan.trim() || null,
        rekomendasi: rekomendasi.trim() || null,
        dokumentasi: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
        nama_pj: namaPj.trim(),
        ttd_pj: ttdPj,
        ttd_ipcn: ttdIpcn,
      };

      const { error } = await supabase
        .from('audit_laboratorium_monitoring')
        .insert([insertData]);

      if (error) { console.error('Observer DB Error:', error); throw error; } // Ignore if table doesn't exist yet

      setToastMessage({ title: 'Berhasil', desc: 'Data Audit Laboratorium berhasil disimpan!', type: 'success' });
      
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
              AUDIT LABORATORIUM
            </h1>
            <p className="text-sm text-slate-400 tracking-wider font-medium">
              Monitoring Pencegahan dan Pengendalian Infeksi Area Laboratorium
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
          <CheckCircle2 className="w-5 h-5 text-blue-400" /> CEKLIST LABORATORIUM
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
                            {option === 'Ya' ? '✅ Ya' : option === 'Tidak' ? '❌ Tidak' : '➖ N/A'}
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
              placeholder="Tulis temuan audit..."
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500/50 min-h-[120px] resize-y placeholder:text-slate-600"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Rekomendasi Tindak Lanjut</label>
            <textarea 
              value={rekomendasi}
              onChange={e => setRekomendasi(e.target.value)}
              placeholder="Tulis rekomendasi perbaikan..."
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
      <div className="pt-6 sticky bottom-6 z-50">
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
