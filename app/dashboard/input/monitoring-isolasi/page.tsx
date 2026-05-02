'use client';

import React, { useState, useMemo, useRef } from 'react';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Calendar, Building2, User, Search, Trash2, Plus, Users, Save, CheckCircle2, ChevronRight, ShieldAlert, Wind, Activity, ArrowLeft, RefreshCw } from 'lucide-react';
import SignaturePad from 'react-signature-canvas';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/components/providers';
import { uploadImagesToSupabase } from '@/lib/upload';

// --- Interfaces ---
interface ChecklistItem {
  id: number;
  key: string;
  label: string;
  value: 'Ya' | 'Tidak' | 'N/A' | null;
}

export default function IsolasiPPIInputPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  
  // Basic Info State
  const [waktu, setWaktu] = useState(new Date().toISOString().slice(0, 16));
  const ruangan = "Ruang Isolasi"; // Fixed room
  
  // Supervisor Management State
  const [supervisors, setSupervisors] = useState<string[]>(['IPCN_Adi Tresa Purnama']);
  const [selectedSupervisor, setSelectedSupervisor] = useState('IPCN_Adi Tresa Purnama');
  const [isManagingSupervisors, setIsManagingSupervisors] = useState(false);
  const [newSupervisor, setNewSupervisor] = useState('');

  // Form Data State
  const [namaPasien, setNamaPasien] = useState('');
  const [umur, setUmur] = useState('');
  const [noRm, setNoRm] = useState('');
  const [tekananNegatif, setTekananNegatif] = useState<'Ya' | 'Tidak' | null>(null);
  const [tekananPositif, setTekananPositif] = useState<'Ya' | 'Tidak' | null>(null);

  const [temuan, setTemuan] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [fotos, setFotos] = useState<DocImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{title: string, desc: string, type: 'success' | 'error'} | null>(null);

  // Signatures
  const sigPadPJ = useRef<SignaturePad>(null);
  const sigPadIPCN = useRef<SignaturePad>(null);

  // --- Checklist Data ---
  const initialChecklist: ChecklistItem[] = [
    { id: 1, key: 'penggunaan_apd', label: 'Penggunaan APD yang sesuai', value: null },
    { id: 2, key: 'ketersediaan_apd', label: 'Ketersediaan APD yang sesuai', value: null },
    { id: 3, key: 'fasilitas_hh', label: 'Kelengkapan Fasilitas Hand Hygiene', value: null },
    { id: 4, key: 'edukasi_batuk', label: 'Edukasi Etika Batuk / Pembuangan Sputum', value: null },
    { id: 5, key: 'edukasi_hh', label: 'Edukasi Hand Hygiene', value: null },
  ];

  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);

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

    if (tekananNegatif === 'Ya') {
      totalDinilai++;
      totalPatuh++;
    } else if (tekananNegatif === 'Tidak') {
      totalDinilai++;
      totalTidakPatuh++;
    }

    if (tekananPositif === 'Ya') {
      totalDinilai++;
      totalPatuh++;
    } else if (tekananPositif === 'Tidak') {
      totalDinilai++;
      totalTidakPatuh++;
    }

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
  }, [checklist, tekananNegatif, tekananPositif]);

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

  const handleChecklistChange = (id: number, val: 'Ya' | 'Tidak' | 'N/A') => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, value: val } : item));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setToastMessage(null);

    try {
      const isComplete = checklist.every(item => item.value !== null) && tekananNegatif !== null && tekananPositif !== null;
      if (!isComplete) {
        throw new Error('Mohon lengkapi semua item checklist dan tekanan udara (Ya/Tidak/N/A).');
      }
      
      const ttdPj = !sigPadPJ.current?.isEmpty() ? sigPadPJ.current?.getCanvas().toDataURL('image/png') : null;
      const ttdIpcn = !sigPadIPCN.current?.isEmpty() ? sigPadIPCN.current?.getCanvas().toDataURL('image/png') : null;

      const supabase = getSupabase();
      
      const uploadedImageUrls = await uploadImagesToSupabase(supabase, fotos, 'monitoring', 'ppi_isolasi');

      // Store checklist as JSON
      const checklistJson = checklist.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as any);

      checklistJson['tekanan_negatif'] = tekananNegatif;
      checklistJson['tekanan_positif'] = tekananPositif;

      const { error } = await supabase
        .from('ppi_ruang_isolasi')
        .insert([{
          waktu: new Date(waktu).toISOString(),
          ruangan: ruangan,
          supervisor: selectedSupervisor,
          nama_pasien: namaPasien.trim() || null,
          umur: umur.trim() || null,
          no_rm: noRm.trim() || null,
          tekanan_udara: `Negatif: ${tekananNegatif}, Positif: ${tekananPositif}`,
          checklist_json: checklistJson,
          keterangan: keterangan.trim() || null,
          persentase: stats.persentase,
          temuan: temuan.trim() || null,
          rekomendasi: rekomendasi.trim() || null,
          foto: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
          ttd_pj: ttdPj,
          ttd_ipcn: ttdIpcn,
        }]);

      // Note: error code 42P01 means table does not exist, which indicates we need to wait for migrations or mock backend if needed.
      if (error) { console.error('Observer DB Error:', error); throw error; }

      setToastMessage({ title: 'Berhasil', desc: 'Data PPI ruang isolasi berhasil disimpan!', type: 'success' });
      
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
              Input PPI di Ruang Isolasi
            </h1>
            <p className="text-sm text-slate-400 tracking-wider font-medium">
              Monitoring kepatuhan PPI pasien dan fasilitas di ruang isolasi sesuai standar rumah sakit.
            </p>
          </div>
        </div>
      </div>

      {/* Basic Setup Card */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Waktu Input</label>
            <input 
              type="datetime-local" 
              value={waktu}
              onChange={(e) => setWaktu(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50 hover:bg-white/10 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[0.6]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Ruangan</label>
            <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-300 text-sm flex items-center gap-2 cursor-not-allowed opacity-80">
              <Building2 className="w-4 h-4 text-blue-400" /> {ruangan}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Supervisor / Observer</label>
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

      {/* Identitas Pasien & Tekanan Udara */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-blue-400" /> Data Pasien
          </h3>
          <div className="space-y-4">
             <div className="space-y-2">
               <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Nama Pasien</label>
               <input 
                 type="text" 
                 value={namaPasien}
                 onChange={e => setNamaPasien(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50"
                 placeholder="Cth: Tn. Budi"
               />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Umur</label>
                  <input 
                    type="text" 
                    value={umur}
                    onChange={e => setUmur(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50"
                    placeholder="Cth: 45 Tahun"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">No. RM</label>
                  <input 
                    type="text" 
                    value={noRm}
                    onChange={e => setNoRm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50"
                    placeholder="00-12-34-56"
                  />
                </div>
             </div>
          </div>
        </div>

        <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 space-y-4">
           <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Wind className="w-5 h-5 text-blue-400" /> Tekanan Udara
          </h3>
          <div className="space-y-4">
            {/* Negatif */}
            <div className="p-4 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <p className={`text-sm font-bold mb-4 uppercase tracking-widest ${tekananNegatif === 'Tidak' ? 'text-rose-500' : 'text-slate-300'}`}>Negatif</p>
              <div className="grid grid-cols-2 gap-2">
                {(['Ya', 'Tidak'] as const).map(option => (
                  <button
                    key={option}
                    onClick={() => setTekananNegatif(option)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      tekananNegatif === option
                      ? option === 'Ya' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Positif */}
            <div className="p-4 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <p className={`text-sm font-bold mb-4 uppercase tracking-widest ${tekananPositif === 'Tidak' ? 'text-rose-500' : 'text-slate-300'}`}>Positif</p>
              <div className="grid grid-cols-2 gap-2">
                {(['Ya', 'Tidak'] as const).map(option => (
                  <button
                    key={option}
                    onClick={() => setTekananPositif(option)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      tekananPositif === option
                      ? option === 'Ya' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Card */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 shadow-xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
          <CheckCircle2 className="w-5 h-5 text-blue-400" /> CHECKLIST PPI
        </h3>

        <div className="space-y-4 mb-8">
          {checklist.map((item) => (
            <div key={item.id} className="p-4 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <p className="text-sm font-medium text-slate-200 mb-4">{item.label}</p>
              <div className="grid grid-cols-3 gap-2">
                {(['Ya', 'Tidak', 'N/A'] as const).map(option => (
                  <button
                    key={option}
                    onClick={() => handleChecklistChange(item.id, option)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      item.value === option
                      ? option === 'Ya' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : option === 'Tidak' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                        : 'bg-slate-500 text-white shadow-lg shadow-slate-500/20'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    {option}
                  </button>
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
      {/* Keterangan, Temuan & Rekomendasi */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 space-y-6">
        <h3 className="text-lg font-bold text-white mb-2">Keterangan & Catatan</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Keterangan (Diagnosa/Kasus)</label>
            <input 
              value={keterangan}
              onChange={e => setKeterangan(e.target.value)}
              placeholder="Contoh: Susp. TB Paru, COVID Suspek..."
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500/50 placeholder:text-slate-600"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Temuan Lapangan</label>
            <textarea 
              value={temuan}
              onChange={e => setTemuan(e.target.value)}
              placeholder="Contoh: APD tidak lengkap, Handrub kosong..."
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500/50 min-h-[100px] resize-y placeholder:text-slate-600"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Rekomendasi Tindak Lanjut</label>
            <textarea 
              value={rekomendasi}
              onChange={e => setRekomendasi(e.target.value)}
              placeholder="Contoh: Lengkapi stok masker N95, Pastikan handrub tersedia..."
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500/50 min-h-[100px] resize-y placeholder:text-slate-600"
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
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5">
         <h3 className="text-lg font-bold text-white mb-6">Verifikasi Digital</h3>
         <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex justify-between">
                PJ Ruang Isolasi
                <button onClick={() => sigPadPJ.current?.clear()} className="hover:text-amber-400 text-[10px]">Clear</button>
              </label>
              <div className="bg-white rounded-2xl overflow-hidden border-2 border-white/10">
                <SignaturePad 
                  ref={sigPadPJ}
                  canvasProps={{ className: "w-full h-40 cursor-crosshair touch-none" }} 
                  penColor="black"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex justify-between">
                IPCN / IPCLN (Supervisor)
                <button onClick={() => sigPadIPCN.current?.clear()} className="hover:text-amber-400 text-[10px]">Clear</button>
              </label>
              <div className="bg-white rounded-2xl overflow-hidden border-2 border-white/10">
                <SignaturePad 
                  ref={sigPadIPCN}
                  canvasProps={{ className: "w-full h-40 cursor-crosshair touch-none" }} 
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
              <span>Simpan Data</span>
            </>
          )}
        </motion.button>
      </div>

    </div>
  );
}
