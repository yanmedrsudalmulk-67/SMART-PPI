'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { 
  Building2, Search, Trash2, Plus, Save, 
  CheckCircle2, ChevronRight, Activity, 
  ArrowLeft, RefreshCw, Sparkles, User, 
  X, Edit2, AlertCircle, Trash 
} from 'lucide-react';
import SignaturePad from 'react-signature-canvas';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/components/providers';
import { uploadImagesToSupabase } from '@/lib/upload';

// --- Interfaces ---
interface ChecklistItem {
  id: string;
  label: string;
  value: 'Ya' | 'Tidak' | 'N/A' | null;
  category: string;
}

interface Supervisor {
  id?: string;
  nama: string;
}

export default function TPSAuditPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  const isIPCN = userRole === 'IPCN' || userRole === 'Admin';
  
  // Basic Info State
  const [waktu, setWaktu] = useState(new Date().toISOString().slice(0, 16));
  const [ruangan, setRuangan] = useState("TPS");
  
  // Supervisor Management State
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
  const [newSupervisorName, setNewSupervisorName] = useState('');
  const [editSupervisorId, setEditSupervisorId] = useState<string | null>(null);
  const [isLoadingSup, setIsLoadingSup] = useState(false);

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
    // Area TPS dan Bangunan
    { id: 'a1', label: 'Lokasi TPS terpisah dari area pelayanan pasien', value: null, category: 'A. Area TPS dan Bangunan' },
    { id: 'a2', label: 'TPS memiliki akses terbatas / terkunci', value: null, category: 'A. Area TPS dan Bangunan' },
    { id: 'a3', label: 'Bangunan TPS tertutup dan aman', value: null, category: 'A. Area TPS dan Bangunan' },
    { id: 'a4', label: 'Lantai kuat, rata, kedap air, dan mudah dibersihkan', value: null, category: 'A. Area TPS dan Bangunan' },
    { id: 'a5', label: 'Lantai tidak licin', value: null, category: 'A. Area TPS dan Bangunan' },
    { id: 'a6', label: 'Dinding dalam kondisi baik dan bersih', value: null, category: 'A. Area TPS dan Bangunan' },
    { id: 'a7', label: 'Atap tidak bocor', value: null, category: 'A. Area TPS dan Bangunan' },
    { id: 'a8', label: 'Pencahayaan cukup', value: null, category: 'A. Area TPS dan Bangunan' },
    { id: 'a9', label: 'Ventilasi memadai', value: null, category: 'A. Area TPS dan Bangunan' },
    { id: 'a10', label: 'Tersedia drainase / saluran pembuangan baik', value: null, category: 'A. Area TPS dan Bangunan' },
    
    // Kebersihan Lingkungan
    { id: 'b1', label: 'Area TPS bersih dan rapi', value: null, category: 'B. Kebersihan Lingkungan' },
    { id: 'b2', label: 'Tidak ada tumpahan sampah di lantai', value: null, category: 'B. Kebersihan Lingkungan' },
    { id: 'b3', label: 'Tidak ada bau menyengat berlebihan', value: null, category: 'B. Kebersihan Lingkungan' },
    { id: 'b4', label: 'Tidak ada genangan air', value: null, category: 'B. Kebersihan Lingkungan' },
    { id: 'b5', label: 'Tidak ada debu berlebihan', value: null, category: 'B. Kebersihan Lingkungan' },
    { id: 'b6', label: 'Tidak ditemukan vektor (lalat/tikus/kucing liar)', value: null, category: 'B. Kebersihan Lingkungan' },
    { id: 'b7', label: 'Jadwal pembersihan rutin tersedia', value: null, category: 'B. Kebersihan Lingkungan' },
    { id: 'b8', label: 'Disinfeksi area dilakukan berkala', value: null, category: 'B. Kebersihan Lingkungan' },
    
    // Pemilahan dan Penyimpanan Sampah
    { id: 'c1', label: 'Sampah medis dan non medis dipisahkan', value: null, category: 'C. Pemilahan dan Penyimpanan Sampah' },
    { id: 'c2', label: 'Sampah infeksius menggunakan kantong kuning', value: null, category: 'C. Pemilahan dan Penyimpanan Sampah' },
    { id: 'c3', label: 'Sampah non medis menggunakan kantong hitam', value: null, category: 'C. Pemilahan dan Penyimpanan Sampah' },
    { id: 'c4', label: 'Limbah tajam menggunakan safety box/container khusus', value: null, category: 'C. Pemilahan dan Penyimpanan Sampah' },
    { id: 'c5', label: 'Safety box tidak lebih dari 3/4 penuh', value: null, category: 'C. Pemilahan dan Penyimpanan Sampah' },
    { id: 'c6', label: 'Sampah diberi label sesuai jenis', value: null, category: 'C. Pemilahan dan Penyimpanan Sampah' },
    { id: 'c7', label: 'Wadah sampah tertutup', value: null, category: 'C. Pemilahan dan Penyimpanan Sampah' },
    { id: 'c8', label: 'Wadah sampah dalam kondisi baik', value: null, category: 'C. Pemilahan dan Penyimpanan Sampah' },
    { id: 'c9', label: 'Tidak ada pencampuran limbah', value: null, category: 'C. Pemilahan dan Penyimpanan Sampah' },
    
    // Pengangkutan Sampah
    { id: 'd1', label: 'Jadwal pengangkutan sampah tersedia', value: null, category: 'D. Pengangkutan Sampah' },
    { id: 'd2', label: 'Sampah diangkut rutin sesuai jadwal', value: null, category: 'D. Pengangkutan Sampah' },
    { id: 'd3', label: 'Troli/alat angkut khusus tersedia', value: null, category: 'D. Pengangkutan Sampah' },
    { id: 'd4', label: 'Troli dalam kondisi bersih', value: null, category: 'D. Pengangkutan Sampah' },
    { id: 'd5', label: 'Jalur pengangkutan aman dan tidak melewati area bersih', value: null, category: 'D. Pengangkutan Sampah' },
    { id: 'd6', label: 'Petugas mengikat kantong sebelum diangkut', value: null, category: 'D. Pengangkutan Sampah' },
    
    // Petugas dan APD
    { id: 'e1', label: 'Petugas menggunakan sarung tangan', value: null, category: 'E. Petugas dan APD' },
    { id: 'e2', label: 'Petugas menggunakan masker', value: null, category: 'E. Petugas dan APD' },
    { id: 'e3', label: 'Petugas menggunakan sepatu boot', value: null, category: 'E. Petugas dan APD' },
    { id: 'e4', label: 'Petugas menggunakan apron / pelindung', value: null, category: 'E. Petugas dan APD' },
    { id: 'e5', label: 'Petugas melakukan hand hygiene setelah bekerja', value: null, category: 'E. Petugas dan APD' },
    { id: 'e6', label: 'Petugas mengetahui SOP pengelolaan limbah', value: null, category: 'E. Petugas dan APD' },
    { id: 'e7', label: 'Petugas mengetahui penanganan tumpahan limbah', value: null, category: 'E. Petugas dan APD' },
    
    // Sarana Pendukung
    { id: 'f1', label: 'Tersedia handrub / fasilitas cuci tangan', value: null, category: 'F. Sarana Pendukung' },
    { id: 'f2', label: 'Tersedia sabun antiseptik', value: null, category: 'F. Sarana Pendukung' },
    { id: 'f3', label: 'Tersedia tissue / pengering tangan', value: null, category: 'F. Sarana Pendukung' },
    { id: 'f4', label: 'Tersedia spill kit limbah', value: null, category: 'F. Sarana Pendukung' },
    { id: 'f5', label: 'Tersedia APAR bila diperlukan', value: null, category: 'F. Sarana Pendukung' },
    { id: 'f6', label: 'Tersedia papan peringatan biohazard', value: null, category: 'F. Sarana Pendukung' },
  ];

  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);

  const fetchSupervisors = useCallback(async () => {
    setIsLoadingSup(true);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('supervisors_tps')
      .select('*')
      .order('nama', { ascending: true });
    
    if (!error && data) {
      const hasAdi = data.some(s => s.nama === 'IPCN_Adi Tresa Purnama');
      let finalData = data;
      if (!hasAdi) {
        finalData = [{ nama: 'IPCN_Adi Tresa Purnama' }, ...data];
      }
      setSupervisors(finalData);
      
      setSelectedSupervisor(prev => {
        if (prev) return prev;
        return finalData.length > 0 ? finalData[0].nama : '';
      });
    } else if (error) {
      setSupervisors([{ nama: 'IPCN_Adi Tresa Purnama' }]);
      setSelectedSupervisor('IPCN_Adi Tresa Purnama');
    }
    setIsLoadingSup(false);
  }, []);

  // --- Fetch Supervisors ---
  useEffect(() => {
    fetchSupervisors();
  }, [fetchSupervisors]);

  const saveSupervisor = async () => {
    if (!newSupervisorName.trim()) return;
    const supabase = getSupabase();
    
    if (editSupervisorId) {
      const { error } = await supabase
        .from('supervisors_tps')
        .update({ nama: newSupervisorName.trim() })
        .eq('id', editSupervisorId);
      if (!error) fetchSupervisors();
    } else {
      const { error } = await supabase
        .from('supervisors_tps')
        .insert([{ nama: newSupervisorName.trim() }]);
      if (!error) fetchSupervisors();
    }
    setNewSupervisorName('');
    setEditSupervisorId(null);
  };

  const deleteSupervisor = async (id: string) => {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('supervisors_tps')
      .delete()
      .eq('id', id);
    if (!error) fetchSupervisors();
  };

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    const filtered = checklist.filter(item => item.value !== 'N/A');
    const dinilaiCount = filtered.filter(item => item.value !== null).length;
    const patuhCount = filtered.filter(item => item.value === 'Ya').length;
    
    const persentase = dinilaiCount === 0 ? 0 : Math.round((patuhCount / dinilaiCount) * 100);
    
    let statusText = 'Perlu Tindak Lanjut';
    if (persentase >= 85) statusText = 'Baik';
    else if (persentase >= 70) statusText = 'Cukup';

    return { 
      totalDinilai: dinilaiCount, 
      totalPatuh: patuhCount, 
      totalTidakPatuh: dinilaiCount - patuhCount, 
      persentase, 
      statusText 
    };
  }, [checklist]);

  // --- Handlers ---
  const handleChecklistChange = (id: string, val: 'Ya' | 'Tidak' | 'N/A') => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, value: val } : item));
  };
  
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (checklist.some(item => item.value === null)) {
        throw new Error('Mohon lengkapi semua item checklist (Pilih Ya, Tidak, atau N/A).');
      }
      if (!namaPj.trim()) throw new Error('Mohon isi nama PJ Ruangan.');

      const supabase = getSupabase();
      const uploadedImageUrls = await uploadImagesToSupabase(supabase, fotos, 'monitoring', 'tps');

      const checklistJson = checklist.reduce((acc, item) => {
        acc[item.id] = item.value;
        return acc;
      }, {} as any);
      
      const keteranganJson = {};

      const ttdPj = !sigPadPJ.current?.isEmpty() ? sigPadPJ.current?.getCanvas().toDataURL('image/png') : null;
      const ttdIpcn = !sigPadIPCN.current?.isEmpty() ? sigPadIPCN.current?.getCanvas().toDataURL('image/png') : null;

      const { error } = await supabase
        .from('audit_tps')
        .insert([{
          waktu: new Date(waktu).toISOString(),
          ruangan,
          supervisor: selectedSupervisor,
          checklist_json: checklistJson,
          keterangan_json: keteranganJson,
          persentase: stats.persentase,
          status: stats.statusText,
          temuan: temuan.trim(),
          rekomendasi: rekomendasi.trim(),
          dokumentasi: uploadedImageUrls,
          nama_pj: namaPj.trim(),
          ttd_pj: ttdPj,
          ttd_ipcn: ttdIpcn
        }]);

      if (error) throw error;

      setToastMessage({ title: 'Berhasil', desc: 'Data Audit TPS berhasil disimpan!', type: 'success' });
      setTimeout(() => router.push('/dashboard/input/isolasi'), 2000);

    } catch (err: any) {
      setToastMessage({ title: 'Gagal', desc: err.message, type: 'error' });
      setIsSubmitting(false);
    }
  };

  const categories = Array.from(new Set(checklist.map(i => i.category)));

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 pb-32 px-4 sm:px-6">
      
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 z-[100] p-4 rounded-2xl shadow-2xl flex items-start gap-4 border max-w-sm w-full backdrop-blur-md ${
              toastMessage.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-100' : 'bg-rose-500/20 border-rose-500/50 text-rose-100'
            }`}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /> : <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />}
            <div>
              <h4 className="font-bold">{toastMessage.title}</h4>
              <p className="text-sm opacity-90">{toastMessage.desc}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="glass-card p-6 lg:p-10 rounded-[2.5rem] border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
          <button onClick={() => router.push('/dashboard/input/isolasi')} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors group">
            <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-white" />
          </button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold tracking-wide text-gradient">Audit TPS</h1>
            <p className="text-sm text-slate-400 tracking-wider">Audit kepatuhan PPI area Tempat Pembuangan Sampah</p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Waktu Audit</label>
          <input type="datetime-local" value={waktu} onChange={e => setWaktu(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ruangan</label>
          <div className="relative">
            <select value={ruangan} onChange={e => setRuangan(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-blue-500/50 appearance-none">
              <option value="TPS" className="bg-[#0f172a]">TPS</option>
              <option value="TPS Infeksius" className="bg-[#0f172a]">TPS Infeksius</option>
              <option value="TPS Domestik" className="bg-[#0f172a]">TPS Domestik</option>
            </select>
            <Building2 className="w-4 h-4 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        <div className="space-y-2 md:col-span-2">
          <div className="flex justify-between">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Supervisor / IPCN</label>
            {isIPCN && (
              <button 
                onClick={() => setIsSupervisorModalOpen(true)} 
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Kelola Supervisor
              </button>
            )}
          </div>
          <div className="relative">
            <select 
              value={selectedSupervisor} 
              onChange={e => setSelectedSupervisor(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
            >
              {supervisors.length === 0 ? (
                <option value="" className="bg-[#0f172a]">Memuat...</option>
              ) : (
                supervisors.map(s => <option key={s.id || s.nama} value={s.nama} className="bg-[#0f172a]">{s.nama}</option>)
              )}
            </select>
            <User className="w-4 h-4 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-8">
        {categories.map((cat, idx) => (
          <div key={cat} className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 shadow-xl">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs">{idx + 1}</span>
              {cat}
            </h3>
            <div className="space-y-4">
              {checklist.filter(i => i.category === cat).map(item => (
                <div key={item.id} className="p-5 bg-black/20 rounded-[1.5rem] border border-white/5 hover:border-white/10 transition-all">
                  <p className="text-sm font-medium text-slate-200 mb-4">{item.label}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Ya', 'Tidak', 'N/A'] as const).map(opt => (
                      <button 
                        key={opt}
                        onClick={() => handleChecklistChange(item.id, opt)}
                        className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                          item.value === opt
                          ? opt === 'Ya' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : opt === 'Tidak' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-600 text-white'
                          : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Results */}
      <LiveStatisticsCard 
        totalDinilai={stats.totalDinilai}
        totalPatuh={stats.totalPatuh}
        totalTidakPatuh={stats.totalTidakPatuh}
        persentase={stats.persentase}
        statusText={stats.statusText}
        title="HASIL OBSERVASI TPS"
      />

      {/* Temuan & Rekomendasi */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Temuan Audit</label>
          <textarea value={temuan} onChange={e => setTemuan(e.target.value)} placeholder="Contoh: Safety box penuh, Lantai TPS licin..." className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500/50 min-h-[120px]" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Rekomendasi</label>
          <textarea value={rekomendasi} onChange={e => setRekomendasi(e.target.value)} placeholder="Contoh: Ganti safety box segera, Lakukan disinfeksi harian..." className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500/50 min-h-[120px]" />
        </div>
      </div>

      {/* Dokumentasi */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5">
        <h3 className="text-lg font-bold text-white mb-6">Dokumentasi</h3>
        <DocumentationUploader images={fotos} setImages={setFotos} />
      </div>

      {/* Tanda Tangan */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 space-y-8">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Nama PJ TPS</label>
          <input type="text" value={namaPj} onChange={e => setNamaPj(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50" placeholder="Ketik nama PJ ruangan" />
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Tanda Tangan PJ</label>
              <button onClick={() => sigPadPJ.current?.clear()} className="p-1 hover:bg-rose-500/10 rounded text-rose-400 transition-colors"><RefreshCw className="w-4 h-4" /></button>
            </div>
            <div className="bg-white rounded-[1.5rem] overflow-hidden border-4 border-white/5 shadow-2xl">
              <SignaturePad ref={sigPadPJ} canvasProps={{ className: "w-full h-48 cursor-crosshair touch-none" }} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">IPCN / IPCLN</label>
              <button onClick={() => sigPadIPCN.current?.clear()} className="p-1 hover:bg-rose-500/10 rounded text-rose-400 transition-colors"><RefreshCw className="w-4 h-4" /></button>
            </div>
            <div className="bg-white rounded-[1.5rem] overflow-hidden border-4 border-white/5 shadow-2xl">
              <SignaturePad ref={sigPadIPCN} canvasProps={{ className: "w-full h-48 cursor-crosshair touch-none" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button 
        onClick={handleSubmit} 
        disabled={isSubmitting} 
        className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl font-bold uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {isSubmitting ? <RefreshCw className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6" /> Simpan Data Audit</>}
      </button>

      {/* Supervisor Modal */}
      <AnimatePresence>
        {isSupervisorModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSupervisorModalOpen(false)} className="absolute inset-0 bg-navy-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-navy-light border border-white/10 rounded-[2.5rem] shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><User className="w-5 h-5 text-blue-400" /> Kelola Supervisor</h3>
                <button onClick={() => setIsSupervisorModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={newSupervisorName}
                  onChange={(e) => setNewSupervisorName(e.target.value)}
                  placeholder="Nama Supervisor..."
                  disabled={!isIPCN}
                  className="flex-1 bg-navy-dark border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
                />
                {isIPCN && (
                  <button onClick={saveSupervisor} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Save className="w-3 h-3" /> Simpan
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {supervisors.map(s => (
                  <div key={s.id || s.nama} className="flex items-center justify-between p-3 bg-navy-dark border border-white/5 rounded-xl group">
                    <span className="text-sm text-slate-300">{s.nama}</span>
                    {isIPCN && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setNewSupervisorName(s.nama); setEditSupervisorId(s.id!); }} className="p-2 text-slate-500 hover:text-blue-400"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteSupervisor(s.id!)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
