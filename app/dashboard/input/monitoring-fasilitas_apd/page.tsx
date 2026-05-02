'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import { useRouter } from 'next/navigation';
import { 
  Activity,
  ArrowLeft, 
  Save, 
  CheckCircle2,
  Clock,
  User,
  Building2,
  Settings,
  Camera,
  Upload,
  Signature,
  FileText,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Plus,
  X,
  Search,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  ClipboardCheck,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';
import { getSupabase } from '@/lib/supabase';
import { uploadImagesToSupabase } from '@/lib/upload';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import { useAppContext } from '@/components/providers';

const units = [
  'IGD', 'ICU', 'IBS', 'Rawat Jalan', 'Ranap Aisyah', 'Ranap Fatimah', 
  'Ranap Khadijah', 'Ranap Usman', 'Radiologi', 'Laboratorium', 
  'Farmasi', 'Rekam Medis', 'Pantry'
];

const checklistItems = [
  { id: '1', label: 'Tersedia masker di ruangan' },
  { id: '2', label: 'Tersedia sarung tangan on steril' },
  { id: '3', label: 'Tersedia sarung tangan steril di ruangan sesuai kebutuhan' },
  { id: '4', label: 'Tersedia penutup kepala di ruangan' },
  { id: '5', label: 'Tersedia gaun di ruang perawatan, intensif, ruang tindakan sesuai kebutuhan' },
  { id: '6', label: 'Tersedia apron di ruang perawatan, intensif, ruang tindakan sesuai kebutuhan' },
  { id: '7', label: 'Tersedia kaca mata pelindung / goggle di ruangan sesuai kebutuhan' },
  { id: '8', label: 'Tersedia pelindung kaki di ruang perawatan, intensif, ruang tindakan sesuai kebutuhan' },
  { id: '9', label: 'Penyimpanan APD dilakukan dengan cara yang benar' },
];

type AuditStatus = 'ya' | 'tidak' | 'na' | null;
type Observer = { id: string; nama: string };

export default function FasilitasAPDMonitoringPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState('');
  const [unit, setUnit] = useState('');
  
  const [data, setData] = useState<Record<string, AuditStatus>>({});
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');

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
    fetchObservers();
    // Initialize data
    const initialData: Record<string, AuditStatus> = {};
    checklistItems.forEach(item => {
      initialData[item.id] = null;
    });
    
    requestAnimationFrame(() => {
      setStartTime(new Date());
      setData(initialData);
    });
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

  const toggleItem = (id: string, stat: AuditStatus) => {
    setData(prev => ({ ...prev, [id]: stat }));
  };

  const stats = useMemo(() => {
    let patuh = 0;
    let dinilai = 0;
    Object.values(data).forEach(val => {
      if (val === 'ya') {
        patuh++;
        dinilai++;
      } else if (val === 'tidak') {
        dinilai++;
      }
    });

    const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;
    let color = 'text-slate-400';
    let bg = 'bg-slate-500/10';
    let strokeColor = 'rgba(148, 163, 184, 1)';
    let status = 'Belum Dinilai';
    
    if (dinilai > 0) {
      if (persentase >= 85) { color = 'text-blue-400'; bg = 'bg-blue-500/10'; strokeColor = '#3b82f6'; status = 'Patuh'; }
      else if (persentase >= 75) { color = 'text-amber-400'; bg = 'bg-amber-500/10'; strokeColor = '#f59e0b'; status = 'Cukup'; }
      else { color = 'text-red-400'; bg = 'bg-red-500/10'; strokeColor = '#f87171'; status = 'Tidak Patuh'; }
    }

    return { patuh, dinilai, persentase, color, bg, strokeColor, status };
  }, [data]);

  
  
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observer || !unit) {
      alert('Harap pilih Supervisor dan Unit.');
      return;
    }

    const unanswered = checklistItems.some(item => data[item.id] === null);
    if (unanswered) {
      alert('Harap isi semua item monitoring.');
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabase();
      const ttd_pj = sigPadPJ.current?.getTrimmedCanvas().toDataURL('image/png') || null;
      const ttd_ipcn = sigPadIPCN.current?.getTrimmedCanvas().toDataURL('image/png') || null;

      const uploadedUrls = await uploadImagesToSupabase(supabase, images, 'dokumentasi', 'audit');
      const payload = {
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer,
        unit,
        data_indikator: data,
        dinilai: stats.dinilai,
        patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.status,
        temuan,
        rekomendasi,
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn,
        created_at: new Date().toISOString(),
        dokumentasi: uploadedUrls
      };

      const { error } = await supabase.from('monitoring_fasilitas_apd').insert([payload]);
      if (error) throw error;

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push('/dashboard/input/isolasi');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan data.');
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
    <div className="space-y-8 max-w-4xl mx-auto pb-24 px-4 sm:px-6 relative mt-4">
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-white/20 glow-blue shadow-blue-500/20"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            Data Berhasil Disimpan
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4 relative py-4 z-10 border-b border-white/5 bg-navy-dark/50 backdrop-blur-md rounded-b-[2rem]">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all shadow-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-gradient">Input Monitoring Fasilitas APD</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-400 mt-1">Monitoring ketersediaan alat pelindung diri sesuai standar PPI Rumah Sakit.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* IDENTITAS */}
        <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 shadow-xl space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Waktu Monitoring
              </label>
              <input 
                type="datetime-local" 
                value={getLocalIsoString(startTime)}
                onChange={(e) => setStartTime(new Date(e.target.value))}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-mono shadow-inner accent-blue-600"
              />
            </div>

            <div className="space-y-3">
              <label className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <span className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-blue-400" /> Supervisor / Auditor</span>
                {userRole === 'admin' && (
                  <button 
                    type="button" 
                    onClick={() => setIsObserverModalOpen(true)}
                    className="text-[9px] text-blue-400 hover:text-blue-300 underline"
                  >
                    Kelola
                  </button>
                )}
              </label>
              <div className="relative group">
                <select 
                  value={observer}
                  onChange={(e) => setObserver(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900">Pilih Supervisor</option>
                  {observers.map(o => (
                    <option key={o.id} value={o.id} className="bg-slate-900">{o.nama}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <Plus className="w-3 h-3 rotate-45" />
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> Unit Kerja
              </label>
              <div className="relative group">
                <select 
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900">Pilih Unit Kerja</option>
                  {units.map(u => (
                    <option key={u} value={u} className="bg-slate-900">{u}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CHECKLIST */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-blue-400" /> Checklist Fasilitas APD
            </h3>
            <p className="text-[9px] font-medium text-slate-600 uppercase tracking-widest">Total 9 Items</p>
          </div>
          <div className="grid gap-4">
            {checklistItems.map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                key={item.id}
                className="glass-card p-5 sm:p-6 rounded-[2.5rem] border-white/5 hover:border-blue-500/20 transition-all group overflow-hidden relative shadow-lg shadow-black/20"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-black text-xs group-hover:scale-110 transition-transform">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-semibold text-slate-200 leading-relaxed group-hover:text-white transition-colors pt-1">
                      {item.label}
                    </p>
                  </div>
                  <div className="flex p-1.5 bg-slate-900/50 rounded-[1.25rem] self-end sm:self-center shrink-0 border border-white/5 scale-90 sm:scale-100">
                    {(['ya', 'tidak', 'na'] as const).map((stat) => (
                      <button
                        key={stat}
                        type="button"
                        onClick={() => toggleItem(item.id, stat)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden ${
                          data[item.id] === stat
                            ? stat === 'ya' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500/20' :
                              stat === 'tidak' ? 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30 ring-2 ring-red-500/20' :
                              'bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-lg shadow-slate-600/30 ring-2 ring-slate-500/20'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        {stat}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* HASIL PERSENTASE STANDARDIZED */}
        <LiveStatisticsCard 
          totalDinilai={stats.dinilai}
          totalPatuh={stats.patuh}
          totalTidakPatuh={stats.dinilai - stats.patuh}
          persentase={stats.persentase}
          statusText={stats.status}
          title="HASIL PERSENTASE"
        />


        {/* DOKUMENTASI */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 space-y-6 flex flex-col items-center">
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        {/* TANDA TANGAN */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 space-y-6">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Signature className="w-3.5 h-3.5 text-blue-400" /> Penanggung Jawab Ruangan
                </label>
                <button 
                type="button"
                onClick={() => sigPadPJ.current?.clear()}
                className="text-[9px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-400 transition-colors"
                >
                Clear
                </button>
            </div>
            <div className="bg-white rounded-[2rem] overflow-hidden h-40 shadow-inner group">
              <SignatureCanvas 
                ref={sigPadPJ as any}
                penColor="black"
                canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
              />
            </div>
          </div>

          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 space-y-6">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Signature className="w-3.5 h-3.5 text-blue-400" /> Auditor / IPCN / IPCLN
                </label>
                <button 
                type="button"
                onClick={() => sigPadIPCN.current?.clear()}
                className="text-[9px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-400 transition-colors"
                >
                Clear
                </button>
            </div>
            <div className="bg-white rounded-[2rem] overflow-hidden h-40 shadow-inner group">
              <SignatureCanvas 
                ref={sigPadIPCN as any}
                penColor="black"
                canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-6 pb-20">
          <motion.button
            type="submit"
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
            className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] text-white text-base font-bold uppercase tracking-[0.2em] rounded-2xl transition-all border border-blue-400/30 group disabled:opacity-50 overflow-hidden relative"
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
          
          <div className="flex items-center justify-center gap-4 mt-6 opacity-30">
            <div className="h-px w-8 bg-slate-500" />
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Security Standard Audit PPI</span>
            <ShieldAlert className="w-4 h-4 text-slate-500" />
            <div className="h-px w-8 bg-slate-500" />
          </div>
        </div>

      </form>

      {/* OBSERVER MANAGEMENT MODAL */}
      <AnimatePresence>
        {isObserverModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsObserverModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-navy-dark border border-white/10 rounded-[3rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
                  <div className="p-2 bg-blue-500/10 rounded-xl">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  Kelola Supervisor
                </h3>
                <button onClick={() => setIsObserverModalOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-8 bg-white/2 p-5 rounded-[2rem] border border-white/5 shadow-inner">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newObserverName}
                    onChange={(e) => setNewObserverName(e.target.value)}
                    placeholder="Nama Supervisor Baru..."
                    className="flex-1 bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500/50 shadow-inner"
                  />
                  <button 
                    onClick={saveObserver}
                    className="px-5 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all shadow-lg active:scale-95 flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-3 custom-scrollbar px-1">
                {observers.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-4 bg-white/2 rounded-[1.5rem] border border-white/5 transition-all hover:bg-white/5 hover:border-blue-500/20 group">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/5 flex items-center justify-center text-[10px] font-black text-blue-400/50 group-hover:bg-blue-500 group-hover:text-white transition-colors capitalize">
                            {o.nama.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{o.nama}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditObserverId(o.id);
                          setNewObserverName(o.nama);
                        }}
                        className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => deleteObserver(o.id)}
                        className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .text-gradient {
          background: linear-gradient(135deg, #fff 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .glass-card {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .glow-blue {
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.15);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  );
}
