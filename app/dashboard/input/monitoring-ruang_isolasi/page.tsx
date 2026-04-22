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
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';
import { getSupabase } from '@/lib/supabase';
import { uploadImagesToSupabase } from '@/lib/upload';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import { useAppContext } from '@/components/providers';

const units = [
  'Ruang Isolasi A', 'Ruang Isolasi B', 'Ruang Isolasi C', 'IGD Isolasi', 'ICU Isolasi'
];

const checklistItems = [
  { id: '1', label: 'Pintu ruang isolasi selalu dalam keadaan tertutup rapat' },
  { id: '2', label: 'Tanda kewaspadaan isolasi terpasang jelas di pintu masuk' },
  { id: '3', label: 'Fasilitas ante-room tersedia dan berfungsi dengan baik' },
  { id: '4', label: 'APD tersedia lengkap di area bersih/ante-room' },
  { id: '5', label: 'Tekanan udara (negatif/positif) terpantau sesuai standar' },
  { id: '6', label: 'Fasilitas kebersihan tangan tersedia dan mencukupi di dalam ruang' },
  { id: '7', label: 'Pengelolaan limbah medis dan tajam sesuai prosedur isolasi' },
  { id: '8', label: 'Kebersihan lingkungan dan peralatan medis terpelihara' },
  { id: '9', label: 'Alur petugas, pasien, dan barang terpisah sesuai standar' },
];

type AuditStatus = 'ya' | 'tidak' | 'na' | null;
type Observer = { id: string; nama: string };

export default function RuangIsolasiMonitoringPage() {
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
    requestAnimationFrame(() => {
        setStartTime(new Date());
        // Initialize data
        const initialData: Record<string, AuditStatus> = {};
        checklistItems.forEach(item => {
          initialData[item.id] = null;
        });
        setData(initialData);
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
      alert('Gagal menyimpan supervisor.');
    }
  };

  const deleteObserver = async (id: string) => {
    if (!confirm('Hapus supervisor ini?')) return;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('master_observers').delete().eq('id', id);
      if (error) throw error;
      setObservers(prev => prev.filter(o => o.id !== id));
      if (observer === id) setObserver('');
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus supervisor.');
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
    let status = 'Belum Dinilai';
    
    if (dinilai > 0) {
      if (persentase >= 85) { color = 'text-blue-400'; bg = 'bg-blue-500/10'; status = 'Baik'; }
      else if (persentase >= 70) { color = 'text-amber-400'; bg = 'bg-amber-500/10'; status = 'Cukup'; }
      else { color = 'text-red-400'; bg = 'bg-red-500/10'; status = 'Perlu Perbaikan'; }
    }

    return { patuh, dinilai, persentase, color, bg, status };
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
        compliance_score: stats.persentase,
        temuan,
        rekomendasi,
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn,
        kategori: 'ibs',
        dokumentasi: uploadedUrls
      };

      const { error } = await supabase.from('audit_monitoring_ppi').insert([payload]);
      if (error && error.code !== '42P01') throw error;

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
    <div className="space-y-8 max-w-4xl mx-auto pb-24 px-4 sm:px-6 mt-4 relative">
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

      <div className="flex items-center gap-6 relative py-4 z-10 border-b border-white/5 bg-navy-dark/50 backdrop-blur-md rounded-b-[2rem]">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-gradient">Input Monitoring Ruang Isolasi</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-400 mt-1">Audit fasilitas dan kepatuhan prosedur di dalam ruang isolasi</p>
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
              <select 
                value={observer}
                onChange={(e) => setObserver(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all appearance-none"
              >
                <option value="" className="bg-slate-900">Pilih Supervisor</option>
                {observers.map(o => (
                  <option key={o.id} value={o.id} className="bg-slate-900">{o.nama}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> Ruangan / Unit Isolasi
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {units.map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`py-2 px-3 rounded-xl text-[10px] font-bold transition-all border ${
                      unit === u 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* STATS FLOATING CARD */}
        <div className="sticky top-6 z-20">
          <div className="glass-card p-4 rounded-2xl border-blue-500/20 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stats.bg} ${stats.color} transition-colors duration-500`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Compliance Rate</p>
                <h2 className={`text-2xl font-heading font-bold ${stats.color} transition-colors duration-500`}>{stats.persentase}%</h2>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Status</p>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${stats.bg.replace('/10', '/30')} ${stats.color}`}>
                {stats.status}
              </span>
            </div>
            <div className="h-10 w-px bg-white/5 hidden sm:block" />
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Audit Score</p>
              <p className="text-sm font-bold text-white font-mono">{stats.patuh} / {stats.dinilai}</p>
            </div>
          </div>
        </div>

        {/* CHECKLIST */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-2 flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-400" /> Indikator Monitoring
          </h3>
          <div className="grid gap-4">
            {checklistItems.map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                key={item.id}
                className="glass-card p-5 sm:p-6 rounded-[2rem] border-white/5 hover:border-white/10 transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-medium text-slate-200 leading-relaxed group-hover:text-white transition-colors pt-1">
                      {item.label}
                    </p>
                  </div>
                  <div className="flex p-1 bg-white/5 rounded-2xl self-end sm:self-center shrink-0">
                    {(['ya', 'tidak', 'na'] as const).map((stat) => (
                      <button
                        key={stat}
                        type="button"
                        onClick={() => toggleItem(item.id, stat)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                          data[item.id] === stat
                            ? stat === 'ya' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' :
                              stat === 'tidak' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' :
                              'bg-slate-600 text-white shadow-lg shadow-slate-600/30'
                            : 'text-slate-500 hover:text-slate-300'
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

        {/* TEMUAN & REKOMENDASI */}
        <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-blue-400" /> Temuan / Masalah
            </label>
            <textarea 
              value={temuan}
              onChange={(e) => setTemuan(e.target.value)}
              placeholder="Jelaskan temuan ketidakpatuhan jika ada..."
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all min-h-[120px] resize-none shadow-inner opacity-80"
            />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Rekomendasi / Tindak Lanjut
            </label>
            <textarea 
              value={rekomendasi}
              onChange={(e) => setRekomendasi(e.target.value)}
              placeholder="Berikan saran perbaikan..."
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all min-h-[120px] resize-none shadow-inner opacity-80"
            />
          </div>
        </div>

        {/* DOKUMENTASI */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 space-y-6 flex flex-col items-center">
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        {/* TANDA TANGAN */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Signature className="w-3.5 h-3.5 text-blue-400" /> PJ Ruangan
            </label>
            <div className="bg-white rounded-2xl overflow-hidden h-40">
              <SignatureCanvas 
                ref={sigPadPJ as any}
                penColor="black"
                canvasProps={{ className: 'w-full h-full' }}
              />
            </div>
            <button 
              type="button"
              onClick={() => sigPadPJ.current?.clear()}
              className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
            >
              Hapus Tanda Tangan
            </button>
          </div>

          <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Signature className="w-3.5 h-3.5 text-blue-400" /> Auditor / IPCN
            </label>
            <div className="bg-white rounded-2xl overflow-hidden h-40">
              <SignatureCanvas 
                ref={sigPadIPCN as any}
                penColor="black"
                canvasProps={{ className: 'w-full h-full' }}
              />
            </div>
            <button 
              type="button"
              onClick={() => sigPadIPCN.current?.clear()}
              className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
            >
              Hapus Tanda Tangan
            </button>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4 pb-12">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-blue-600 to-blue-800 text-white font-heading font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group disabled:opacity-50 border border-white/10 glow-blue"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Simpan Data Audit
              </>
            )}
          </button>
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
              className="relative w-full max-w-md bg-navy-dark border border-white/10 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                  <User className="w-5 h-5 text-blue-400" /> Kelola Supervisor
                </h3>
                <button onClick={() => setIsObserverModalOpen(false)} className="p-2 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newObserverName}
                    onChange={(e) => setNewObserverName(e.target.value)}
                    placeholder="Nama Supervisor..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50"
                  />
                  <button 
                    onClick={saveObserver}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {observers.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 transition-all hover:bg-white/10">
                    <span className="text-sm text-slate-200">{o.nama}</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => {
                          setEditObserverId(o.id);
                          setNewObserverName(o.nama);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-400"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteObserver(o.id)}
                        className="p-2 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
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
        .text-gradient {
          background: linear-gradient(135deg, #fff 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .glass-card {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .glow-blue {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

// Re-using edit/trash icon from parent scope or imported
const Edit2 = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
);
