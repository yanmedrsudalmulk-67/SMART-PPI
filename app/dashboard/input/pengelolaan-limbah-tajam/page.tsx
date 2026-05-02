'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
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
  { id: 'item_1', label: '1. Tersedia safety box sesuai standar WHO' },
  { id: 'item_2', label: '2. Wadah limbah tajam diletakkan di tempat yang aman' },
  { id: 'item_3', label: '3. Wadah limbah tajam tidak lebih dari 3/4 penuh' },
  { id: 'item_4', label: '4. Tidak ada benda tajam yang keluar dari wadah' },
  { id: 'item_5', label: '5. Limbah tajam langsung dibuang ke wadah limbah tajam' },
  { id: 'item_6', label: '6. Tempat sampah khusus benda tajam tersedia pada troli tindakan' },
  { id: 'item_7', label: '7. Pengelolaan jarum suntik kontak minimal dan apabila menutup menggunakan metode 1 tangan' },
  { id: 'item_8', label: '8. Tersedia jalur pasca pajanan apabila terjadi tusukan benda tajam' },
];

type AuditStatus = 'ya' | 'tidak' | 'na' | null;
type Observer = { id: string; nama: string };

export default function PengelolaanLimbahTajamPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  const isIPCN = userRole === 'IPCN' || userRole === 'Admin';
  
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
    item_1: null, item_2: null, item_3: null, item_4: null,
    item_5: null, item_6: null, item_7: null, item_8: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

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
      
      const hasAdi = data?.some(s => s.nama === 'IPCN_Adi Tresa Purnama');
      let finalData = data || [];
      if (!hasAdi) {
        finalData = [{ nama: 'IPCN_Adi Tresa Purnama' }, ...finalData];
      }
      setObservers(finalData);
      if (finalData.length > 0 && !observer) {
        setObserver(finalData[0].nama);
      }
    } catch (err) {
      setObservers([{ id: '1', nama: 'IPCN_Adi Tresa Purnama' }]);
      setObserver('IPCN_Adi Tresa Purnama');
    }
  };

  const saveObserver = async () => {
    if (!newObserverName.trim()) return;
    try {
      const supabase = getSupabase();
      if (editObserverId) {
        if (!editObserverId.startsWith('local-')) {
          await supabase.from('master_observers').update({ nama: newObserverName }).eq('id', editObserverId);
        }
        setObservers(prev => prev.map(o => o.id === editObserverId ? { ...o, nama: newObserverName } : o).sort((a,b) => a.nama.localeCompare(b.nama)));
      } else {
        const { data, error } = await supabase.from('master_observers').insert([{ nama: newObserverName }]).select();
        if (!error && data && data.length > 0) {
          setObservers(prev => [...prev, data[0]].sort((a,b) => a.nama.localeCompare(b.nama)));
        } else {
          setObservers(prev => [...prev, { id: 'local-' + Date.now().toString(), nama: newObserverName }].sort((a,b) => a.nama.localeCompare(b.nama)));
        }
      }
      setNewObserverName('');
      setEditObserverId(null);
    } catch (err) {
      console.error('Save observer non-fatal fallback:', err);
      // Fallback local update
      if (editObserverId) {
        setObservers(prev => prev.map(o => o.id === editObserverId ? { ...o, nama: newObserverName } : o).sort((a,b) => a.nama.localeCompare(b.nama)));
      } else {
        setObservers(prev => [...prev, { id: 'local-' + Date.now().toString(), nama: newObserverName }].sort((a,b) => a.nama.localeCompare(b.nama)));
      }
      setNewObserverName('');
      setEditObserverId(null);
    }
  };

  const deleteObserver = async (id: string) => {
    if (!confirm('Hapus observer ini?')) return;
    try {
      const supabase = getSupabase();
      if (!id.startsWith('local-')) {
        await supabase.from('master_observers').delete().eq('id', id);
      }
      setObservers(prev => prev.filter(o => o.id !== id));
      if (observer === (observers.find(o => o.id === id)?.nama)) {
        setObserver('');
      }
    } catch (err) {
      console.error('Delete observer fallback:', err);
      setObservers(prev => prev.filter(o => o.id !== id));
      if (observer === (observers.find(o => o.id === id)?.nama)) {
        setObserver('');
      }
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
    let status = 'Belum Dinilai';
    
    if (dinilai > 0) {
      if (persentase === 100) { 
        status = 'Patuh'; 
      } else if (persentase >= 85) { 
        status = 'Cukup'; 
      } else { 
        status = 'Tidak Patuh'; 
      }
    }

    return { patuh, dinilai, persentase, status };
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { getSupabase } = await import('@/lib/supabase');
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
        dokumentasi: uploadedUrls
      };

      const { error } = await supabase
        .from('audit_pengelolaan_limbah_tajam')
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
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-white/20 glow-blue"
          >
            <CheckCircle2 className="w-5 h-5" />
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
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-gradient">Audit Pengelolaan Limbah Tajam</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-400 mt-1">Standar Pencegahan Risiko Pajanan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* WAKTU OBSERVASI */}
          <div className="glass-card p-6 rounded-[24px] border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[50px] -z-10 group-hover:bg-blue-500/10 transition-colors" />
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
              <Clock className="w-4 h-4 text-blue-400" /> Waktu Observasi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Tanggal & Waktu</label>
                <input 
                  type="datetime-local" 
                  value={getLocalIsoString(startTime)}
                  onChange={(e) => setStartTime(new Date(e.target.value))}
                  className="w-full bg-navy-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none"
                />
              </div>
            </div>
          </div>

          {/* OBSERVER & UNIT */}
          <div className="glass-card p-6 rounded-[24px] border-white/5">
            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <User className="w-3.5 h-3.5 text-blue-400" /> Observer
                  </h2>
                  {isIPCN && (
                    <button 
                      type="button" 
                      onClick={() => setIsObserverModalOpen(true)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-blue-400 transition-all"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <select 
                    value={observer}
                    onChange={(e) => setObserver(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all pr-10 cursor-pointer"
                    required
                  >
                    <option value="" className="bg-navy-dark text-slate-400">Pilih Observer...</option>
                    {observers.map(o => <option key={o.id || o.nama} value={o.nama} className="bg-navy-dark">{o.nama}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Plus className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" /> Unit
                </h2>
                <div className="relative">
                  <select 
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all pr-10"
                    required
                  >
                    <option value="" className="bg-navy-dark text-slate-400">Cari Unit...</option>
                    {units.map(u => <option key={u} value={u} className="bg-navy-dark">{u}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Building2 className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CEKLIST */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-slate-400 ml-2">
              <FileText className="w-4 h-4 text-blue-400" /> Checklist Limbah Tajam
            </h2>
            <div className="grid gap-4">
              {checklistItems.map((item, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={item.id} 
                  className="glass-card p-5 rounded-[24px] border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-col justify-between gap-4"
                >
                  <p className="text-sm sm:text-base font-bold text-white/90 leading-relaxed md:max-w-md lg:max-w-lg">
                    {item.label}
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full shrink-0">
<button
                      type="button"
                      onClick={() => toggleItem(item.id, 'ya')}
                      className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                        data[item.id] === 'ya' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                      }`}
                    >
                      Ya
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id, 'tidak')}
                      className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                        data[item.id] === 'tidak' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                      }`}
                    >
                      Tidak
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id, 'na')}
                      className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                        data[item.id] === 'na' ? 'bg-white/10 text-white' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                      }`}
                    >
                      N/A
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* STATS FOR MOBILE */}
          <div className="lg:hidden mt-8 mb-8">
            <LiveStatisticsCard 
              totalDinilai={stats.dinilai}
              totalPatuh={stats.patuh}
              totalTidakPatuh={stats.dinilai - stats.patuh}
              persentase={stats.persentase}
              statusText={stats.status}
              title="HASIL OBSERVASI LIMBAH"
            />
          </div>

          {/* TEMUAN & REKOMENDASI */}
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="glass-card p-6 rounded-[24px] border-white/5">
              <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                <FileText className="w-3.5 h-3.5 text-blue-400" /> Temuan
              </h2>
              <textarea 
                value={temuan}
                onChange={(e) => setTemuan(e.target.value)}
                placeholder="Tuliskan temuan audit..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white min-h-[160px] outline-none focus:border-blue-500/50 transition-all font-medium placeholder:text-slate-600"
              />
            </div>
            <div className="glass-card p-6 rounded-[24px] border-white/5 relative overflow-hidden group">
              <div className="flex justify-between items-center mb-4">
                <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <Edit2 className="w-3.5 h-3.5 text-blue-400" /> Rekomendasi
                </h2>
              </div>
              <textarea 
                value={rekomendasi}
                onChange={(e) => setRekomendasi(e.target.value)}
                placeholder="Tuliskan rekomendasi rencana tindak lanjut..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white min-h-[160px] outline-none focus:border-blue-500/50 transition-all font-medium placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* DOKUMENTASI */}
          <div className="glass-card p-6 rounded-[24px] border-white/5">
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

          {/* SAVE BUTTON AT BOTTOM */}
          <div className="pt-8">
            <motion.button
              type="submit"
              disabled={isSubmitting || !observer || !unit || stats.dinilai === 0}
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
            <p className="text-center text-[10px] text-slate-600 mt-4 font-bold uppercase tracking-widest">
              SMART-PPI Audit Ver. 2.0 | RSUD AL-MULK
            </p>
          </div>

        </div>

        {/* Sidebar Summary (Desktop Only) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-40">
          <LiveStatisticsCard 
            totalDinilai={stats.dinilai}
            totalPatuh={stats.patuh}
            totalTidakPatuh={stats.dinilai - stats.patuh}
            persentase={stats.persentase}
            statusText={stats.status}
            title="HASIL OBSERVASI LIMBAH"
          />
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-navy-light border border-white/10 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" /> Kelola Observer
                </h3>
                <button onClick={() => setIsObserverModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={newObserverName}
                  onChange={(e) => setNewObserverName(e.target.value)}
                  placeholder="Nama Observer baru..."
                  disabled={!isIPCN}
                  className="flex-1 bg-navy-dark border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500/50 disabled:opacity-50"
                  onKeyDown={(e) => e.key === 'Enter' && saveObserver()}
                />
                {isIPCN && (
                  <button 
                    onClick={saveObserver}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-500"
                  >
                    {editObserverId ? 'Update' : 'Tambah'}
                  </button>
                )}
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {observers.map(o => (
                  <div key={o.id || o.nama} className="flex items-center justify-between p-3 bg-navy-dark border border-white/5 rounded-xl group">
                    <span className="text-sm font-medium text-slate-300">{o.nama}</span>
                    {isIPCN && (
                      <div className="flex gap-1">
                        <button onClick={() => { setNewObserverName(o.nama); setEditObserverId(o.id); }} className="p-2 text-slate-500 hover:text-blue-400 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteObserver(o.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
