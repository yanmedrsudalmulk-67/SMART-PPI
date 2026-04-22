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
  Activity,
  Settings,
  AlertCircle,
  FileText,
  Camera,
  Upload,
  Plus,
  Trash2,
  Edit2,
  X,
  Signature,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';
import { getSupabase } from '@/lib/supabase';
import { uploadImagesToSupabase } from '@/lib/upload';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import { useAppContext } from '@/components/providers';

const units = [
  'IGD', 'ICU', 'IBS', 'Ranap Aisyah', 'Ranap Fatimah', 'Ranap Khadijah', 'Ranap Usman'
];

const checklistItems = [
  { id: 'item_1', label: '1. Linen bersih disimpan di lemari tertutup dengan jarak setidaknya dari lantai 30 cm, dinding 20 cm, langit-langit 60 cm, di area bersih terlindung dari kontaminasi' },
  { id: 'item_2', label: '2. Tersedia troli/tempat linen kotor dalam kondisi baik dan tertutup' },
  { id: 'item_3', label: '3. Tersedia kantung linen berwarna kuning untuk linen infeksius / tercemar / basah' },
  { id: 'item_4', label: '4. Linen kotor dipisahkan sesuai dengan SPO' },
  { id: 'item_5', label: '5. Petugas menggunakan APD saat menangani linen infeksius / tercemar / basah' },
];

type AuditStatus = 'ya' | 'tidak' | 'na' | null;
type Observer = { id: string; nama: string };

export default function PenatalaksanaanLinenPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState('');
  const [unit, setUnit] = useState('');
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [images, setImages] = useState<DocImage[]>([]);
  
  // Observer Management
  const [observers, setObservers] = useState<Observer[]>([]);
  const [isObserverModalOpen, setIsObserverModalOpen] = useState(false);
  const [newObserverName, setNewObserverName] = useState('');
  const [editObserverId, setEditObserverId] = useState<string | null>(null);
  
  // Signature pads
  const sigPadPj = useRef<SignatureCanvas>(null);
  const sigPadIpcn = useRef<SignatureCanvas>(null);
  
  const [data, setData] = useState<Record<string, AuditStatus>>({
    item_1: null, item_2: null, item_3: null, item_4: null, item_5: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const getLocalIsoString = (val: Date | null) => {
    if (!val) return '';
    const tzoffset = val.getTimezoneOffset() * 60000;
    return new Date(val.getTime() - tzoffset).toISOString().slice(0, 16);
  };

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
      // Fallback initial list
      setObservers([
        { id: '1', nama: 'IPCN_Adi Tresa Purnama' },
        { id: '2', nama: 'IPCLN_Syefira Salsabila' },
        { id: '3', nama: 'IPCLN_Siti Hapsoh Roditubillah' },
        { id: '4', nama: 'IPCLN_Ria Meliani' },
        { id: '5', nama: 'IPCLN_Ema Mahmudah' },
        { id: '6', nama: 'IPCLN_Putri Audia' },
        { id: '7', nama: 'IPCLN_Seli Marselina' },
        { id: '8', nama: 'IPCLN_Rahmat Hidayat' },
        { id: '9', nama: 'IPCLN_Rickha Ilnia' }
      ]);
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

  const toggleItem = (itemId: string, status: AuditStatus) => {
    setData(prev => ({ ...prev, [itemId]: status }));
  };

  const stats = useMemo(() => {
    let patuh = 0;
    let dinilai = 0;
    
    Object.entries(data).forEach(([_, val]) => {
      if (val === null || val === 'na') return;
      dinilai++;
      if (val === 'ya') patuh++;
    });

    const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;
    let color = 'text-slate-400';
    let bg = 'bg-slate-500/10';
    let status = 'Belum Dinilai';
    
    if (dinilai > 0) {
      if (persentase === 100) { 
        color = 'text-blue-400'; 
        bg = 'bg-blue-500/10'; 
        status = 'Patuh'; 
      } else if (persentase >= 85) { 
        color = 'text-amber-400'; 
        bg = 'bg-amber-500/10'; 
        status = 'Cukup'; 
      } else { 
        color = 'text-red-400'; 
        bg = 'bg-red-500/10'; 
        status = 'Tidak Patuh'; 
      }
    }

    return { patuh, dinilai, persentase, color, bg, status };
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const supabase = getSupabase();

      const ttdPj = sigPadPj.current && !sigPadPj.current.isEmpty() ? sigPadPj.current.getCanvas().toDataURL('image/png') : null;
      const ttdIpcn = sigPadIpcn.current && !sigPadIpcn.current.isEmpty() ? sigPadIpcn.current.getCanvas().toDataURL('image/png') : null;

      const uploadedUrls = await uploadImagesToSupabase(supabase, images, 'dokumentasi', 'audit');
      const payload = {
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer,
        unit,
        data_indikator: data,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.status,
        temuan,
        rekomendasi,
        ttd_pj_ruangan: ttdPj,
        ttd_ipcn: ttdIpcn,
        created_at: new Date().toISOString(),
        foto: uploadedUrls
      };

      const { error } = await supabase
        .from('audit_penatalaksanaan_linen')
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

  const calculateDashOffset = (percent: number) => {
    const circumference = 2 * Math.PI * 36;
    return circumference - (percent / 100) * circumference;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24 px-4 sm:px-6">
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
      <div className="flex items-center gap-6 relative py-4 z-10 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-white/5 bg-navy-dark/50 backdrop-blur-md rounded-b-[2rem]">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-gradient">Audit Penatalaksanaan Linen</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-400 mt-1">Audit kepatuhan pengelolaan linen bersih dan linen kotor sesuai standar PPI RS</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* WAKTU OBSERVASI */}
          <div className="glass-card p-6 rounded-[24px] border-white/5 shadow-sm">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 font-heading">
              <Clock className="w-4 h-4 text-blue-400" /> Waktu Observasi
            </h2>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold">Waktu Input (Otomatis)</p>
                <p className="text-base font-bold text-white font-heading tracking-wide">
                  {startTime ? `${startTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} | ${startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : '-'}
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

          {/* OBSERVER & UNIT */}
          <div className="glass-card p-6 rounded-[24px] border-white/5 shadow-sm">
            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <User className="w-3.5 h-3.5 text-blue-400" /> Supervisor / Observer
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

              <div>
                <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
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
          </div>

          {/* CEKLIST */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-slate-400 ml-2 font-heading">
              <FileText className="w-4 h-4 text-blue-400" /> Checklist Penatalaksanaan Linen
            </h2>
            <div className="grid gap-4">
              {checklistItems.map((item, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  key={item.id} 
                  className="glass-card p-5 rounded-[24px] border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group shadow-sm"
                >
                  <p className="text-sm sm:text-base font-medium text-white/90 leading-relaxed md:max-w-md lg:max-w-lg group-hover:text-white transition-colors">
                    {item.label}
                  </p>
                  <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/10 w-fit shrink-0 shadow-inner">
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id, 'ya')}
                      className={`px-4 sm:px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                        data[item.id] === 'ya' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Ya
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id, 'tidak')}
                      className={`px-4 sm:px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                        data[item.id] === 'tidak' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Tidak
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id, 'na')}
                      className={`px-4 sm:px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                        data[item.id] === 'na' ? 'bg-white/10 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      N/A
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* SIDEBAR ANALYTICS FOR MOBILE */}
          <div className="lg:hidden">
            <StatsCard stats={stats} calculateDashOffset={calculateDashOffset} />
          </div>

          {/* TEMUAN & REKOMENDASI */}
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="glass-card p-6 rounded-[24px] border-white/5 shadow-sm">
              <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 font-heading">
                <FileText className="w-3.5 h-3.5 text-blue-400" /> Temuan Audit
              </h2>
              <textarea 
                value={temuan}
                onChange={(e) => setTemuan(e.target.value)}
                placeholder="Tuliskan temuan audit linen..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white min-h-[160px] outline-none focus:border-blue-500/50 transition-all font-medium placeholder:text-slate-600 shadow-inner"
              />
            </div>
            <div className="glass-card p-6 rounded-[24px] border-white/5 relative overflow-hidden group shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 font-heading">
                  <Edit2 className="w-3.5 h-3.5 text-blue-400" /> Rekomendasi
                </h2>
              </div>
              <textarea 
                value={rekomendasi}
                onChange={(e) => setRekomendasi(e.target.value)}
                placeholder="Tuliskan rekomendasi rencana tindak lanjut..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white min-h-[160px] outline-none focus:border-blue-500/50 transition-all font-medium placeholder:text-slate-600 shadow-inner"
              />
            </div>
          </div>

          {/* DOKUMENTASI */}
          <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 shadow-xl space-y-6 flex flex-col items-center">
            <DocumentationUploader images={images} setImages={setImages} />
          </div>

          {/* TANDA TANGAN SECTION */}
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="glass-card p-6 rounded-[2rem] border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Signature className="w-3.5 h-3.5 text-blue-400" /> PJ Ruangan
                </h3>
                <button 
                  type="button" 
                  onClick={() => sigPadPj.current?.clear()} 
                  className="text-[9px] font-bold text-red-400 uppercase tracking-widest hover:underline"
                >
                  Reset
                </button>
              </div>
              <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden h-40 touch-none shadow-inner">
                <SignatureCanvas 
                  ref={sigPadPj}
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
                <button 
                  type="button" 
                  onClick={() => sigPadIpcn.current?.clear()} 
                  className="text-[9px] font-bold text-red-400 uppercase tracking-widest hover:underline"
                >
                  Reset
                </button>
              </div>
              <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden h-40 touch-none shadow-inner">
                <SignatureCanvas 
                  ref={sigPadIpcn}
                  penColor="#3b82f6"
                  canvasProps={{ className: 'sigCanvas w-full h-full' }}
                />
              </div>
            </div>
          </div>

          {/* SIMPAN DATA BUTTON */}
          <div className="pt-8 mb-12">
            <button
              type="submit"
              disabled={isSubmitting || !observer || !unit || stats.dinilai === 0}
              className="w-full flex justify-center items-center gap-4 py-5 bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 shadow-[0_10px_30px_rgba(59,130,246,0.4)] hover:shadow-[0_15px_40px_rgba(59,130,246,0.6)] text-white text-base font-bold uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-[1.01] disabled:opacity-50 group active:scale-[0.98] border border-white/10 relative overflow-hidden"
            >
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out" />
              {isSubmitting ? (
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <>
                  <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Simpan Data</span>
                </>
              )}
            </button>
            <div className="flex flex-col items-center justify-center mt-6 text-slate-600 uppercase tracking-widest font-bold">
               <p className="text-[10px]">SMART-PPI Audit | RSUD AL-MULK</p>
               <div className="w-12 h-1 bg-blue-600/20 rounded-full mt-2" />
            </div>
          </div>

        </div>

        {/* Sidebar Summary (Desktop Only) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-32">
          <StatsCard stats={stats} calculateDashOffset={calculateDashOffset} />
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

              <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 scrollbar-premium">
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

function StatsCard({ stats, calculateDashOffset }: any) {
  return (
    <div className="glass-card p-8 rounded-[32px] border-white/5 flex flex-col items-center justify-center relative overflow-hidden bg-white/2 shadow-xl">
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 blur-[80px] rounded-full -z-10 transition-colors duration-1000 ${stats.bg.replace('/10', '/30')}`} />
      
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-8 w-full text-left font-bold">Live Data Analytics</h3>
      
      {/* Circular Progress */}
      <div className="relative w-48 h-48 flex items-center justify-center mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <motion.circle 
            cx="40" cy="40" r="36" 
            fill="transparent" 
            stroke="currentColor" 
            strokeWidth="8" 
            strokeDasharray={2 * Math.PI * 36}
            strokeLinecap="round"
            className={`${stats.color} drop-shadow-[0_0_8px_currentColor]`}
            initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
            animate={{ strokeDashoffset: calculateDashOffset(stats.persentase) }}
            transition={{ duration: 1.5, ease: 'circOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center drop-shadow-lg">
          <span className="text-5xl font-heading font-extrabold text-white tracking-tighter">{stats.persentase}%</span>
          <span className={`text-[10px] font-extrabold uppercase tracking-widest mt-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 ${stats.color} shadow-sm`}>{stats.status}</span>
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-4 mt-2">
        <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5 shadow-inner">
          <p className="text-3xl font-extrabold text-white mb-1 font-heading">{stats.patuh}</p>
          <p className="text-[9px] uppercase tracking-widest text-slate-500 font-extrabold">Ya (Patuh)</p>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5 shadow-inner">
          <p className="text-3xl font-extrabold text-white mb-1 font-heading">{stats.dinilai}</p>
          <p className="text-[9px] uppercase tracking-widest text-slate-500 font-extrabold">Dinilai</p>
        </div>
      </div>

      <AnimatePresence>
        {stats.persentase < 85 && stats.dinilai > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-5 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-500">Critical Warning</span>
            </div>
            <p className="text-xs text-red-200 font-bold leading-relaxed">Kepatuhan di bawah standar PPI. Segera lakukan evaluasi dan perbaikan fasilitas pengelolaan linen.</p>
            <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/10 blur-[20px] rounded-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
