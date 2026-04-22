'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, CheckCircle2, Clock, User, Building2, Activity,
  Camera, Upload, Plus, Edit2, Trash2, X, Settings, AlertCircle, Signature
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';
import { getSupabase } from '@/lib/supabase';
import { uploadImagesToSupabase } from '@/lib/upload';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';

const initialUnits = [
  'IGD', 'ICU', 'IBS', 'Ranap Aisyah', 'Ranap Fatimah', 
  'Ranap Khadijah', 'Ranap Usman'
];

const checklistItems = [
  { id: 'item_1', label: '1. Tersedia fasilitas pembuangan sampah', key: 'item_1' },
  { id: 'item_2', label: '2. Tempat sampah menggunakan pedal kaki', key: 'item_2' },
  { id: 'item_3', label: '3. Tempat sampah diberi label sesuai peruntukannya: infeksius dan non infeksius', key: 'item_3' },
  { id: 'item_4', label: '4. Tersedia kantung plastik kuning untuk limbah medis/infeksius', key: 'item_4' },
  { id: 'item_5', label: '5. Jumlah tempat sampah memadai dan dalam kondisi baik', key: 'item_5' },
  { id: 'item_6', label: '6. Sampah yang akan dibuang diikat dengan baik', key: 'item_6' },
  { id: 'item_7', label: '7. Sampah tidak lebih dari 3/4 penuh', key: 'item_7' },
  { id: 'item_8', label: '8. Sampah disimpan/ditempatkan di area yang disediakan sebelum dibawa ke pembuangan/TPS', key: 'item_8' },
  { id: 'item_9', label: '9. Petugas mengetahui cara penanganan tumpahan cairan infeksius', key: 'item_9' },
  { id: 'item_10', label: '10. Spill kit tersedia dan petugas mengetahui lokasi penyimpanannya', key: 'item_10' }
] as const;

type AuditStatus = 'ya' | 'tidak' | 'na' | null;

interface Observer {
  id: string;
  nama: string;
}

export default function PengelolaanLimbahMedisPage() {
  const router = useRouter();
  
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
    item_6: null, item_7: null, item_8: null, item_9: null, item_10: null
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
      if (error) {
        // Silent fallback if table doesn't exist yet
        throw error;
      }
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
      if (observer === observers.find(o => o.id === id)?.nama) setObserver('');
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus observer.');
    }
  };

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
        .from('audit_pengelolaan_limbah_medis')
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
    <div className="max-w-4xl mx-auto pb-16 px-4 sm:px-0">
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.4)]"
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
          <h1 className="text-[24px] sm:text-[30px] font-heading font-bold tracking-tight text-gradient drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">Input Audit Pengelolaan Limbah Medis</h1>
          <p className="text-[12px] sm:text-[15px] font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">Audit kepatuhan pengelolaan limbah medis sesuai standar PPI Rumah Sakit.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* SECTION 1: Waktu Observasi */}
        <div className="glass-card p-6 rounded-[24px] border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[50px] -z-10 group-hover:bg-blue-500/10 transition-colors" />
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Clock className="w-4 h-4 text-blue-400" /> Waktu Observasi
          </h2>
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

        {/* SECTION 4: Checklist */}
        <div className="glass-card p-6 rounded-[24px] border-white/5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-blue-400" /> Checklist Pengelolaan Limbah Medis
          </h2>
          
          <div className="space-y-3">
            {checklistItems.map((item) => (
              <div key={item.key} className="bg-navy-dark/30 border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 transition-colors">
                <p className="text-sm font-medium text-slate-300 leading-relaxed md:max-w-[60%]">{item.label}</p>
                <div className="flex bg-navy-dark/50 p-1 rounded-xl shrink-0 w-full md:w-auto">
                  <button 
                    onClick={() => handleActionClick(item.key, 'ya')}
                    className={`flex-1 md:w-20 py-2 rounded-lg text-xs font-bold transition-all ${data[item.key] === 'ya' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >Ya</button>
                  <button 
                    onClick={() => handleActionClick(item.key, 'tidak')}
                    className={`flex-1 md:w-20 py-2 rounded-lg text-xs font-bold transition-all ${data[item.key] === 'tidak' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >Tidak</button>
                  <button 
                    onClick={() => handleActionClick(item.key, 'na')}
                    className={`flex-1 md:w-20 py-2 rounded-lg text-xs font-bold transition-all ${data[item.key] === 'na' ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >N/A</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: Statistik */}
        <div className="glass-card p-6 rounded-[24px] border-white/5 relative overflow-hidden">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-blue-400" /> Hasil Audit
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-navy-dark/50 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-heading font-bold text-white mb-1">{stats.dinilai}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Item Dinilai</span>
            </div>
            <div className="bg-navy-dark/50 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-heading font-bold text-white mb-1">{stats.patuh}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Item Patuh</span>
            </div>
            <div className={`${stats.bg} rounded-2xl p-4 border ${stats.color.replace('text', 'border')}/20 flex flex-col items-center justify-center text-center transition-colors`}>
              <span className={`text-3xl font-heading font-bold mb-1 ${stats.color}`}>{stats.status}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status Audit</span>
            </div>
            <div className="bg-navy-dark/50 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center relative">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
                <circle cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={calculateDashOffset(stats.persentase)}
                  className={`transition-all duration-1000 ease-out ${stats.color}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-heading font-bold text-white">{stats.persentase}%</span>
              </div>
            </div>
          </div>
        </div>

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
                placeholder="Tuliskan temuan audit limbah medis..."
                className="w-full h-32 bg-navy-dark/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 resize-none"
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
                className="w-full h-32 bg-navy-dark/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 resize-none"
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

        {/* SAVE BUTTON */}
        <div className="pt-4 pb-8">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !observer || !unit || stats.dinilai === 0}
            className="w-full px-8 py-5 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.4)] text-sm font-bold uppercase tracking-[0.2em] text-white bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 transition-all hover:-translate-y-1 relative group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
            {isSubmitting ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Save className="w-5 h-5" />
                <span>Simpan Data</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* OBSERVER MODAL */}
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
                 <button onClick={() => setShowObserverModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400">
                   <X className="w-4 h-4" />
                 </button>
              </div>
              <div className="p-4 bg-navy-dark/50 border-b border-white/10 shrink-0">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nama Observer..."
                    value={newObserverName}
                    onChange={(e) => setNewObserverName(e.target.value)}
                    className="flex-1 bg-navy-dark border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                  <button 
                    onClick={saveObserver}
                    disabled={!newObserverName.trim()}
                    className="px-4 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase transition-all"
                  >
                    {editObserverId ? 'Simpan' : 'Tambah'}
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto p-4 space-y-2">
                {observers.map(obs => (
                  <div key={obs.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl group">
                    <span className="text-sm text-slate-200">{obs.nama}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditObserverId(obs.id); setNewObserverName(obs.nama); }} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-md"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteObserver(obs.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-md"><Trash2 className="w-3.5 h-3.5" /></button>
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
