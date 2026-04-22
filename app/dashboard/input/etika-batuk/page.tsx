'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle2,
  Clock,
  User,
  Building2,
  Settings,
  FileText,
  Plus,
  Trash2,
  Edit2,
  X,
  RefreshCw,
  Camera,
  Upload,
  Signature,
  FileCheck2,
  Users2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';
import { getSupabase } from '@/lib/supabase';
import { uploadImagesToSupabase } from '@/lib/upload';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import { useAppContext } from '@/components/providers';

const units = [
  'IGD', 'ICU', 'Ranap Aisyah', 'Ranap Fatimah', 'Ranap Khadijah', 'Ranap Usman'
];

const materiOptions = [
  'Etika batuk',
  'Cuci tangan 5 momen dan 6 langkah'
];

const sasaranOptions = [
  'Pasien',
  'Keluarga pasien',
  'Pengunjung'
];

type Observer = { id: string; nama: string };

export default function EtikaBatukPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState('');
  const [unit, setUnit] = useState('');
  
  // Materi & Sasaran
  const [materiSelected, setMateriSelected] = useState<string[]>([]);
  const [sasaranSelected, setSasaranSelected] = useState<string[]>([]);
  
  // Dokumentasi
  const [images, setImages] = useState<DocImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Observer Management
  const [observers, setObservers] = useState<Observer[]>([]);
  const [isObserverModalOpen, setIsObserverModalOpen] = useState(false);
  const [newObserverName, setNewObserverName] = useState('');
  const [editObserverId, setEditObserverId] = useState<string | null>(null);
  
  // Signatures
  const sigPadPJ = useRef<SignatureCanvas | null>(null);
  const sigPadIPCN = useRef<SignatureCanvas | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setStartTime(new Date());
    });
    fetchObservers();
  }, []);

  const fetchObservers = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('master_observers').select('*').order('nama');
      if (error) throw error;
      if (data) setObservers(data);
    } catch (err) {
      setObservers([{ id: '1', nama: 'IPCN_Adi Tresa Purnama' }]);
    }
  };

  const saveObserver = async () => {
    if (!newObserverName.trim()) return;
    try {
      const supabase = getSupabase();
      if (editObserverId) {
        const { error } = await supabase.from('master_observers').update({ nama: newObserverName }).eq('id', editObserverId);
        if (error) throw error;
        setObservers(prev => prev.map(o => o.id === editObserverId ? { ...o, nama: newObserverName } : o));
      } else {
        const { data, error } = await supabase.from('master_observers').insert([{ nama: newObserverName }]).select();
        if (error) throw error;
        if (data && data.length > 0) {
          setObservers(prev => [...prev, data[0]].sort((a,b) => a.nama.localeCompare(b.nama)));
        }
      }
      setNewObserverName('');
      setEditObserverId(null);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan observer.');
    }
  };

  const deleteObserver = async (id: string) => {
    if (!confirm('Hapus observer ini?')) return;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('master_observers').delete().eq('id', id);
      if (error) throw error;
      setObservers(prev => prev.filter(o => o.id !== id));
      if (observer === id) setObserver('');
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus observer.');
    }
  };

  const toggleMateri = (val: string) => {
    setMateriSelected(prev => 
      prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]
    );
  };

  const toggleSasaran = (val: string) => {
    setSasaranSelected(prev => 
      prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]
    );
  };

  
  const dataURLToBlob = (dataURL: string) => {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  };

  
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observer || !unit || materiSelected.length === 0 || sasaranSelected.length === 0) {
      alert('Harap lengkapi semua field wajib (Supervisor, Unit, Materi, dan Sasaran).');
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabase();

      // Signature data URLs
      const ttd_pj = sigPadPJ.current?.getTrimmedCanvas().toDataURL('image/png') || null;
      const ttd_ipcn = sigPadIPCN.current?.getTrimmedCanvas().toDataURL('image/png') || null;

      // Handle Image Uploads to Storage if needed, or just convert to base64/URL
      // For simplicity and matching other patterns, we'll store metadata
      // In a real app, images would go to Supabase Storage

      const uploadedUrls = await uploadImagesToSupabase(supabase, images, 'dokumentasi', 'audit');
      const payload = {
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer,
        unit,
        materi_edukasi: materiSelected,
        sasaran_edukasi: sasaranSelected,
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn,
        created_at: new Date().toISOString(),
        dokumentasi: uploadedUrls
      };

      const { error } = await supabase
        .from('audit_etika_batuk')
        .insert([payload]);

      if (error) throw error;

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push('/dashboard/input/isolasi');
      }, 2000);
    } catch (err: any) {
      console.error("Gagal menyimpan:", err);
      alert(`Gagal menyimpan data: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLocalIsoString = (val: Date | null) => {
    if (!val) return '';
    const tzoffset = val.getTimezoneOffset() * 60000;
    return new Date(val.getTime() - tzoffset).toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-24 px-4 sm:px-6 mt-4">
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-white/20 glow-blue text-center"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            Data Berhasil Disimpan
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-6 relative py-4 z-10 border-b border-white/5 bg-navy-dark/50 backdrop-blur-md rounded-b-[2rem]">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-gradient">Input Audit Etika Batuk</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-400 mt-1">Audit kepatuhan etika batuk dan edukasi lapangan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* CARD INPUT UTAMA */}
        <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 shadow-xl space-y-8">
          
          {/* WAKTU OBSERVASI */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 font-heading">
              <Clock className="w-4 h-4 text-blue-400" /> Waktu Audit
            </h2>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold">Waktu Real-time</p>
                <p className="text-base font-bold text-white font-heading tracking-wide">
                  {startTime ? `${startTime.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')} – ${startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : '-'}
                </p>
              </div>
              <input 
                type="datetime-local" 
                value={getLocalIsoString(startTime)}
                onChange={(e) => setStartTime(new Date(e.target.value))}
                className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-blue-400 outline-none focus:border-blue-500/50 transition-all font-mono shadow-inner accent-blue-600"
              />
            </div>
          </div>

          {/* SUPERVISOR & UNIT */}
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <User className="w-3.5 h-3.5 text-blue-400" /> Supervisor
                </h2>
                {(userRole === 'IPCN' || userRole === 'Admin') && (
                  <button 
                    type="button" 
                    onClick={() => setIsObserverModalOpen(true)}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-blue-400 transition-all shadow-sm"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="relative group">
                <select 
                  value={observer}
                  onChange={(e) => setObserver(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all pr-10 hover:bg-white/8"
                  required
                >
                  <option value="" className="bg-navy-dark text-slate-400">Pilih Supervisor...</option>
                  {observers.map(o => <option key={o.id} value={o.nama} className="bg-navy-dark">{o.nama}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> Unit Kerja
              </h2>
              <div className="relative group">
                <select 
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all pr-10 hover:bg-white/8"
                  required
                >
                  <option value="" className="bg-navy-dark text-slate-400">Pilih Unit...</option>
                  {units.map(u => <option key={u} value={u} className="bg-navy-dark">{u}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform">
                  <Building2 className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: CEKLIST ETIKA BATUK */}
          <div className="border-t border-white/5 pt-8 space-y-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 font-heading">
              Ceklist Etika Batuk
            </h2>

            {/* Materi Edukasi */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <FileCheck2 className="w-4 h-4 text-emerald-400" /> Materi Edukasi
              </h3>
              <div className="grid gap-3">
                {materiOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleMateri(opt)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      materiSelected.includes(opt) 
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300' 
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm font-medium">{opt}</span>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      materiSelected.includes(opt) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                    }`}>
                      {materiSelected.includes(opt) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sasaran Edukasi */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Users2 className="w-4 h-4 text-purple-400" /> Sasaran Edukasi
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {sasaranOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleSasaran(opt)}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                      sasaranSelected.includes(opt) 
                        ? 'bg-purple-500/10 border-purple-500/50 text-purple-300' 
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-widest">{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: DOKUMENTASI */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 space-y-6 flex flex-col items-center">
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        {/* SECTION: TANDA TANGAN */}
        <div className="grid sm:grid-cols-2 gap-8">
          <div className="glass-card p-6 rounded-[2rem] border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Signature className="w-3.5 h-3.5 text-blue-400" /> PJ Ruangan
              </h3>
              <button type="button" onClick={() => sigPadPJ.current?.clear()} className="text-[9px] font-bold text-red-400 uppercase tracking-widest hover:underline">Reset</button>
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden h-40 touch-none shadow-inner">
              <SignatureCanvas 
                ref={sigPadPJ}
                penColor="#3b82f6"
                canvasProps={{ className: 'sigCanvas w-full h-full' }}
              />
            </div>
          </div>

          <div className="glass-card p-6 rounded-[2rem] border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Signature className="w-3.5 h-3.5 text-blue-400" /> IPCN / IPCLN
              </h3>
              <button type="button" onClick={() => sigPadIPCN.current?.clear()} className="text-[9px] font-bold text-red-400 uppercase tracking-widest hover:underline">Reset</button>
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden h-40 touch-none shadow-inner">
              <SignatureCanvas 
                ref={sigPadIPCN}
                penColor="#3b82f6"
                canvasProps={{ className: 'sigCanvas w-full h-full' }}
              />
            </div>
          </div>
        </div>

        {/* BUTTON SIMPAN */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !observer || !unit || materiSelected.length === 0 || sasaranSelected.length === 0}
            className="w-full flex justify-center items-center gap-4 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-[0_10px_30px_rgba(59,130,246,0.4)] hover:shadow-[0_15px_40px_rgba(59,130,246,0.6)] text-white text-base font-bold uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.98] border border-white/10 relative overflow-hidden group disabled:opacity-50"
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
          </button>
          <div className="flex flex-col items-center justify-center mt-6 text-slate-600 uppercase tracking-widest font-bold">
            <p className="text-[10px]">SMART-PPI | RSUD AL-MULK</p>
          </div>
        </div>
      </form>

      {/* OBSERVER MODAL */}
      <AnimatePresence>
        {isObserverModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsObserverModalOpen(false)}
              className="absolute inset-0 bg-navy-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-md bg-navy-light border border-white/10 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden bg-gradient-to-b from-navy-light to-navy-dark"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-3 font-heading">
                  <User className="w-5 h-5 text-blue-400" /> Kelola Supervisor
                </h3>
                <button onClick={() => setIsObserverModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={newObserverName}
                  onChange={(e) => setNewObserverName(e.target.value)}
                  placeholder="Nama Supervisor baru..."
                  className="flex-1 bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 shadow-inner"
                  onKeyDown={(e) => e.key === 'Enter' && saveObserver()}
                />
                <button 
                  onClick={saveObserver}
                  className="px-5 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                >
                  {editObserverId ? <RefreshCw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>

              <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {observers.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-4 bg-navy-dark/40 border border-white/5 rounded-2xl group hover:border-blue-500/20 transition-all hover:bg-navy-dark/60">
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{o.nama}</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setNewObserverName(o.nama); setEditObserverId(o.id); }} className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteObserver(o.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
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
