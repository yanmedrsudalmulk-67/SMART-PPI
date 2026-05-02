'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, CheckCircle2, Clock, User, Building2, Activity,
  Camera, Upload, Plus, Edit2, Trash2, X, Settings, AlertCircle, Signature, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';
import { getSupabase } from '@/lib/supabase';
import { uploadImagesToSupabase } from '@/lib/upload';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';

import { useAppContext } from '@/components/providers';

const initialUnits = [
  'IGD', 'ICU', 'IBS', 'Ranap Aisyah', 'Ranap Fatimah', 
  'Ranap Khadijah', 'Ranap Usman'
];

const checklistItems = [
  { id: 'item_1', label: '1. Kursi/meja/dan loker tampak bersih dan dalam kondisi baik', key: 'item_1', isNegative: false },
  { id: 'item_2', label: '2. Troli tindakan tampak bersih', key: 'item_2', isNegative: false },
  { id: 'item_3', label: '3. Troli tindakan dibersihkan dan didesinfeksi setiap hari', key: 'item_3', isNegative: false },
  { id: 'item_4', label: '4. Lantai bersih dan dalam kondisi baik', key: 'item_4', isNegative: false },
  { id: 'item_5', label: '5. Ditemukan debu di permukaan kerja', key: 'item_5', isNegative: true },
  { id: 'item_6', label: '6. Tirai pemisah dan tirai jendela bersih dalam kondisi baik', key: 'item_6', isNegative: false },
  { id: 'item_7', label: '7. Kipas angin dan AC bersih', key: 'item_7', isNegative: false },
  { id: 'item_8', label: '8. Dinding dan langit-langit bebas jamur', key: 'item_8', isNegative: false },
  { id: 'item_9', label: '9. Ventilasi/jendela bersih', key: 'item_9', isNegative: false },
  { id: 'item_10', label: '10. Area tunggu/publik bersih', key: 'item_10', isNegative: false },
  { id: 'item_11', label: '11. Terdapat tanaman hidup di dalam ruang rawat inap', key: 'item_11', isNegative: true },
  { id: 'item_12', label: '12. Area WC/toilet bebas dari benda-benda yang tidak seharusnya ada', key: 'item_12', isNegative: false },
  { id: 'item_13', label: '13. Perlengkapan WC/toilet dalam kondisi baik dan tidak bau', key: 'item_13', isNegative: false },
  { id: 'item_14', label: '14. Tersedia fasilitas pembuangan sampah', key: 'item_14', isNegative: false },
  { id: 'item_15', label: '15. Dinding dan langit-langit WC/toilet bebas jamur', key: 'item_15', isNegative: false }
] as const;

type AuditStatus = 'ya' | 'tidak' | 'na' | null;

interface Observer {
  id: string;
  nama: string;
}

export default function PengendalianLingkunganPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  const isIPCN = userRole === 'IPCN' || userRole === 'Admin';
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  const [observers, setObservers] = useState<Observer[]>([]);
  const [observer, setObserver] = useState('');
  const [unit, setUnit] = useState('');
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [images, setImages] = useState<DocImage[]>([]);
  
  // Observer Management Modal State
  const [showObserverModal, setShowObserverModal] = useState(false);
  const [newObserverName, setNewObserverName] = useState('');
  const [editObserverId, setEditObserverId] = useState<string | null>(null);
  
  // Signature pads
  const sigPadPj = useRef<SignatureCanvas>(null);
  const sigPadIpcn = useRef<SignatureCanvas>(null);
  
  const [data, setData] = useState<Record<string, AuditStatus>>({
    item_1: null, item_2: null, item_3: null, item_4: null, item_5: null,
    item_6: null, item_7: null, item_8: null, item_9: null, item_10: null,
    item_11: null, item_12: null, item_13: null, item_14: null, item_15: null
  });

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

  // Convert Date to local datetime-local string
  const getLocalIsoString = (val: Date | null) => {
      if (!val) return '';
      const tzoffset = val.getTimezoneOffset() * 60000;
      return new Date(val.getTime() - tzoffset).toISOString().slice(0, 16);
  };

  const handleActionClick = (id: string, stat: AuditStatus) => {
    setData(prev => ({ ...prev, [id]: stat }));
  };

  const stats = useMemo(() => {
    let patuh = 0;
    let dinilai = 0;
    
    Object.entries(data).forEach(([key, val]) => {
      if (val === null || val === 'na') return;
      dinilai++;
      
      const itemDef = checklistItems.find(i => i.key === key);
      if (itemDef?.isNegative) {
         if (val === 'tidak') patuh++;
      } else {
         if (val === 'ya') patuh++;
      }
    });

    const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;
    let color = 'text-slate-400';
    let bg = 'bg-slate-500/10';
    let status = 'Belum Dinilai';
    
    if (dinilai > 0) {
      if (persentase === 100) { 
        color = 'text-green-400'; 
        bg = 'bg-green-500/10'; 
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
        .from('audit_pengendalian_lingkungan')
        .insert([payload]);

      if (error) throw error;

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push('/dashboard/input/isolasi');
      }, 2000);
    } catch (err: any) {
      console.error("Gagal menyimpan ke Supabase:", err);
      if (err.message && err.message.includes('row-level security policy')) {
        alert('Gagal menyimpan: Akses Ditolak oleh keamanan Supabase (RLS). Harap nonaktifkan Row-Level Security (RLS) pada tabel "audit_pengendalian_lingkungan" atau tambahkan Policy (Insert) di dashboard Supabase agar aplikasi bisa mengisi data.');
      } else {
        alert(`Gagal menyimpan data: ${err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDashOffset = (percent: number) => {
    const circumference = 2 * Math.PI * 36;
    return circumference - (percent / 100) * circumference;
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 px-4 sm:px-0">
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-green-400/30 shadow-[0_0_20px_rgba(22,163,74,0.4)]"
          >
            <CheckCircle2 className="w-5 h-5" />
            Data berhasil disimpan!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6 mb-8 relative bg-navy-dark/90 backdrop-blur-xl py-6 z-10 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-white/5">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-[24px] sm:text-[30px] font-heading font-bold tracking-tight text-gradient drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">Input Audit Pengendalian Lingkungan</h1>
          <p className="text-[12px] sm:text-[15px] font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">Audit kebersihan, keamanan, dan pengendalian lingkungan ruangan sesuai standar PPI Rumah Sakit.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* SECTION 1: Waktu Observasi */}
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
                className="w-full bg-navy-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2 & 3: Profil Audit */}
        <div className="glass-card p-6 rounded-[24px] border-white/5">
          <div className="flex items-center justify-between mb-6">
             <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
               <User className="w-4 h-4 text-blue-400" /> Profil Audit
             </h2>
             <button 
               onClick={() => setShowObserverModal(true)}
               className="text-[10px] bg-white/5 hover:bg-blue-600/20 text-slate-300 hover:text-blue-400 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 transition-all"
             >
               <Settings className="w-3 h-3" /> Kelola Observer
             </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Pilih Observer</label>
              <div className="relative">
                <select 
                  value={observer}
                  onChange={(e) => setObserver(e.target.value)}
                  className="w-full bg-navy-dark/50 border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none"
                >
                  <option value="">Pilih Observer...</option>
                  {observers.map(o => (
                    <option key={o.id} value={o.nama}>{o.nama}</option>
                  ))}
                </select>
                <User className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Unit/Ruangan</label>
              <div className="relative">
                <select 
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-navy-dark/50 border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none"
                >
                  <option value="">Pilih Unit...</option>
                  {initialUnits.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <Building2 className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Checklist Pengendalian Lingkungan */}
        <div className="glass-card p-6 rounded-[24px] border-white/5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-blue-400" /> Checklist Pengendalian Lingkungan
          </h2>
          
          <div className="space-y-3">
            {checklistItems.map((item) => (
              <div key={item.key} className="bg-navy-dark/30 border border-white/5 p-4 rounded-2xl flex flex-col gap-3 hover:border-white/10 transition-colors">
                <p className="text-sm font-medium text-slate-300 leading-relaxed md:max-w-[60%]">{item.label}</p>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full shrink-0">
                  <button 
                    onClick={() => handleActionClick(item.key, 'ya')}
                    className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${data[item.key] === 'ya' ? (item.isNegative ? 'bg-red-600/20 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]') : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'}`}
                  >
                    Ya
                  </button>
                  <button 
                    onClick={() => handleActionClick(item.key, 'tidak')}
                    className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${data[item.key] === 'tidak' ? (item.isNegative ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-red-600/20 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]') : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'}`}
                  >
                    Tidak
                  </button>
                  <button 
                    onClick={() => handleActionClick(item.key, 'na')}
                    className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${data[item.key] === 'na' ? 'bg-slate-600/20 text-slate-300 border-slate-500/50' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'}`}
                  >
                    N/A
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: Statistik & Hasil */}
        <LiveStatisticsCard 
          totalDinilai={stats.dinilai}
          totalPatuh={stats.patuh}
          totalTidakPatuh={stats.dinilai - stats.patuh}
          persentase={stats.persentase}
          statusText={stats.status}
          title="HASIL AUDIT"
        />

        {/* SECTION 6 & 7: Temuan & Rekomendasi */}
        <div className="glass-card p-6 rounded-[24px] border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
                <AlertCircle className="w-4 h-4 text-amber-400" /> Temuan
              </h2>
              <textarea 
                value={temuan}
                onChange={(e) => setTemuan(e.target.value)}
                placeholder="Tuliskan temuan audit lingkungan (opsional)..."
                className="w-full h-32 bg-navy-dark/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
                  <Edit2 className="w-4 h-4 text-emerald-400" /> Rekomendasi
                </h2>
              </div>
              <textarea 
                value={rekomendasi}
                onChange={(e) => setRekomendasi(e.target.value)}
                placeholder="Tuliskan rekomendasi rencana tindak lanjut..."
                className="w-full h-32 bg-navy-dark/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 8: Dokumentasi */}
        <div className="glass-card p-6 rounded-[24px] border-white/5">
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        {/* TANDA TANGAN SECTION */}
        <div className="grid sm:grid-cols-2 gap-8">
          <div className="glass-card p-6 rounded-[2rem] border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Signature className="w-3.5 h-3.5 text-blue-400" /> PJ / Kepala Ruangan
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
                <Signature className="w-3.5 h-3.5 text-blue-400" /> Auditor / IPCLN
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

        {/* SAVE BUTTON */}
        <div className="pt-4 pb-8">
          <motion.button
            onClick={handleSubmit}
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
        </div>
      </div>

      {/* MODAL OBSERVER */}
      <AnimatePresence>
        {showObserverModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-navy-light rounded-[24px] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
                 <h3 className="font-bold text-white text-sm uppercase tracking-widest flex items-center gap-2">
                   <User className="w-4 h-4 text-blue-400" /> Kelola Observer
                 </h3>
                 <button onClick={() => {setShowObserverModal(false); setEditObserverId(null); setNewObserverName('');}} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                   <X className="w-4 h-4" />
                 </button>
              </div>
              
              <div className="p-4 bg-navy-dark/50 border-b border-white/10 shrink-0">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nama Observer (Contoh: IPCN_Budi)"
                    value={newObserverName}
                    onChange={(e) => setNewObserverName(e.target.value)}
                    className="flex-1 bg-navy-dark border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    onKeyDown={(e) => { if(e.key === 'Enter') saveObserver(); }}
                  />
                  <button 
                    onClick={saveObserver}
                    disabled={!newObserverName.trim()}
                    className="px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-all flex items-center gap-1"
                  >
                    {editObserverId ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
                    {editObserverId ? 'Simpan' : 'Tambah'}
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto p-4 space-y-2">
                {observers.map(obs => (
                  <div key={obs.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors group">
                    <span className="text-sm font-medium text-slate-200">{obs.nama}</span>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditObserverId(obs.id); setNewObserverName(obs.nama); }}
                        className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-md transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => deleteObserver(obs.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {observers.length === 0 && (
                  <div className="text-center text-slate-500 text-xs py-4">Belum ada data observer.</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
