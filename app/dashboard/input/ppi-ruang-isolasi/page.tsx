'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, CheckCircle2, Clock, User, Building2, Activity,
  Camera, Upload, Plus, Edit2, Trash2, X, Settings, AlertCircle, Signature, ShieldAlert, ThermometerSnowflake, FileText, Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';
import { getSupabase } from '@/lib/supabase';
import { uploadImagesToSupabase } from '@/lib/upload';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';

const checklistItems = [
  { id: 'c_1', label: 'Penggunaan APD yang sesuai' },
  { id: 'c_2', label: 'Ketersediaan APD yang sesuai' },
  { id: 'c_3', label: 'Kelengkapan Fasilitas Hand Hygiene' },
  { id: 'c_4', label: 'Edukasi Etika Batuk / Pembuangan Sputum' },
  { id: 'c_5', label: 'Edukasi Hand Hygiene' },
];

type AuditStatus = 'ya' | 'tidak' | 'na' | null;

interface Observer {
  id: string;
  nama: string;
}

export default function PpiRuangIsolasiPage() {
  const router = useRouter();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  const [observers, setObservers] = useState<Observer[]>([]);
  const [observer, setObserver] = useState('');
  
  // Data Pasien
  const [namaPasien, setNamaPasien] = useState('');
  const [umur, setUmur] = useState('');
  const [noRm, setNoRm] = useState('');
  
  const [tekananNegatif, setTekananNegatif] = useState<AuditStatus>(null);
  const [tekananPositif, setTekananPositif] = useState<AuditStatus>(null);
  
  const [answers, setAnswers] = useState<Record<string, AuditStatus>>({});
  const [keterangan, setKeterangan] = useState('');

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
        if (error && error.code !== '42P01') throw error;
        setObservers(prev => prev.map(o => o.id === editObserverId ? { ...o, nama: newObserverName } : o));
      } else {
        const { data, error } = await supabase.from('master_observers').insert([{ nama: newObserverName }]).select();
        if (error && error.code !== '42P01') throw error;
        if (data && data.length > 0) {
          setObservers(prev => [...prev, data[0]].sort((a,b) => a.nama.localeCompare(b.nama)));
        } else {
          setObservers(prev => [...prev, { id: Date.now().toString(), nama: newObserverName }].sort((a,b) => a.nama.localeCompare(b.nama)));
        }
      }
      setNewObserverName('');
      setEditObserverId(null);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan observer ke database.');
    }
  };

  const deleteObserver = async (id: string) => {
    if (!confirm('Hapus observer ini?')) return;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('master_observers').delete().eq('id', id);
      if (error && error.code !== '42P01') throw error;
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
    setAnswers(prev => ({ ...prev, [id]: stat }));
  };

  const stats = useMemo(() => {
    let patuh = 0;
    let tidakPatuh = 0;
    let dinilai = 0;
    
    const allAnswers = [...Object.values(answers), tekananNegatif, tekananPositif];

    allAnswers.forEach((val) => {
      if (val === null || val === 'na') return;
      dinilai++;
      if (val === 'ya') patuh++;
      else if (val === 'tidak') tidakPatuh++;
    });

    const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;
    let color = 'text-slate-400';
    let bg = 'bg-slate-500/10';
    let status = 'Belum Dinilai';
    
    if (dinilai > 0) {
      if (persentase >= 85) { 
        color = 'text-green-400'; 
        bg = 'bg-green-500/10'; 
        status = 'Baik'; 
      } else if (persentase >= 70) { 
        color = 'text-amber-400'; 
        bg = 'bg-amber-500/10'; 
        status = 'Cukup'; 
      } else { 
        color = 'text-red-400'; 
        bg = 'bg-red-500/10'; 
        status = 'Perlu Tindak Lanjut'; 
      }
    }

    return { patuh, tidakPatuh, dinilai, persentase, color, bg, status };
  }, [answers, tekananNegatif, tekananPositif]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();

      const ttdPj = sigPadPj.current && !sigPadPj.current.isEmpty() ? sigPadPj.current.getCanvas().toDataURL('image/png') : null;
      const ttdIpcn = sigPadIpcn.current && !sigPadIpcn.current.isEmpty() ? sigPadIpcn.current.getCanvas().toDataURL('image/png') : null;

      const uploadedUrls = await uploadImagesToSupabase(supabase, images, 'ppi_ruang_isolasi', 'audit');
      
      const payload_data_indikator: Record<string, any> = {};
      checklistItems.forEach(item => {
        payload_data_indikator[item.id] = {
          status: answers[item.id] || null,
        };
      });

      const payload = {
        waktu: startTime?.toISOString() || new Date().toISOString(),
        ruangan: 'Ruang Isolasi',
        supervisor: observer,
        nama_pasien: namaPasien,
        umur: umur,
        no_rm: noRm,
        tekanan_udara: JSON.stringify({ negatif: tekananNegatif, positif: tekananPositif }),
        checklist_json: payload_data_indikator,
        keterangan: keterangan,
        persentase: stats.persentase,
        temuan,
        rekomendasi,
        foto: uploadedUrls,
        ttd_pj: ttdPj,
        ttd_ipcn: ttdIpcn
      };

      const { error } = await supabase
        .from('ppi_ruang_isolasi')
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
        alert('Gagal menyimpan: Akses Ditolak oleh keamanan Supabase (RLS). Harap nonaktifkan Row-Level Security (RLS) pada tabel "ppi_ruang_isolasi" atau tambahkan Policy (Insert) di dashboard Supabase agar aplikasi bisa mengisi data.');
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
            Data PPI ruang isolasi berhasil disimpan
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6 mb-8 relative bg-navy-dark/90 backdrop-blur-xl py-6 z-10 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-white/5">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-[24px] sm:text-[30px] font-heading font-bold tracking-tight text-white drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">Input PPI di Ruang Isolasi</h1>
          <p className="text-[12px] sm:text-[15px] font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">Monitoring kepatuhan PPI pasien dan fasilitas di ruang isolasi sesuai standar rumah sakit.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* SECTION 1: WAKTU INPUT */}
        <div className="glass-card p-6 rounded-xl border border-white/5 relative overflow-hidden group hover:border-blue-500/20 transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[50px] -z-10 group-hover:bg-blue-500/10 transition-colors duration-500" />
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-400 mb-6 group-hover:text-blue-300 transition-colors duration-500">
            <Clock className="w-4 h-4" /> Waktu Input
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Tanggal & Waktu</label>
              <input 
                type="datetime-local" 
                value={getLocalIsoString(startTime)}
                onChange={(e) => setStartTime(new Date(e.target.value))}
                className="w-full bg-navy-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none shadow-inner shadow-black/20"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2 & 3: RUANGAN & SUPERVISOR */}
        <div className="glass-card p-6 rounded-xl border border-white/5 group hover:border-indigo-500/20 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[50px] -z-10 group-hover:bg-indigo-500/10 transition-colors duration-500" />
          <div className="flex items-center justify-between mb-6">
             <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-indigo-400 group-hover:text-indigo-300 transition-colors duration-500">
               <User className="w-4 h-4" /> Ruangan & Supervisor
             </h2>
             <button 
               onClick={() => setShowObserverModal(true)}
               className="text-[10px] bg-white/5 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-400 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 transition-all shadow-sm"
             >
               <Settings className="w-3 h-3" /> Kelola Supervisor
             </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Ruangan</label>
              <div className="relative">
                <input 
                  type="text"
                  readOnly
                  value="Ruang Isolasi"
                  className="w-full bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-xl px-4 py-3 pl-11 text-sm font-semibold focus:outline-none shadow-inner shadow-black/20 cursor-not-allowed"
                />
                <Building2 className="w-4 h-4 text-blue-500/50 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Pilih Supervisor</label>
              <div className="relative">
                <select 
                  value={observer}
                  onChange={(e) => setObserver(e.target.value)}
                  className="w-full bg-navy-dark/50 border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:border-indigo-500/50 appearance-none shadow-inner shadow-black/20 cursor-pointer"
                >
                  <option value="">Pilih Supervisor...</option>
                  {observers.map(o => (
                    <option key={o.id} value={o.nama}>{o.nama}</option>
                  ))}
                </select>
                <User className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            
          </div>
        </div>

        {/* SECTION 4: CEKLIST PPI DI RUANG ISOLASI */}
        <div className="glass-card p-6 rounded-xl border border-white/5 relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[50px] -z-10 group-hover:bg-emerald-500/10 transition-colors duration-500" />
          
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-emerald-400 mb-6">
            <ShieldAlert className="w-4 h-4" /> Ceklist PPI di Ruang Isolasi
          </h2>

          <div className="space-y-8">
            
            {/* DATA PASIEN */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 border-b border-white/10 pb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" /> Data Pasien
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Nama Pasien</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={namaPasien}
                      onChange={(e) => setNamaPasien(e.target.value)}
                      placeholder="Masukkan nama..."
                      className="w-full bg-navy-dark/50 border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-white focus:outline-none focus:border-emerald-500/50 shadow-inner transition-all"
                    />
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Umur</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={umur}
                      onChange={(e) => setUmur(e.target.value)}
                      placeholder="Misal: 45 Tahun"
                      className="w-full bg-navy-dark/50 border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-white focus:outline-none focus:border-emerald-500/50 shadow-inner transition-all"
                    />
                    <Activity className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">No. RM</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={noRm}
                      onChange={(e) => setNoRm(e.target.value)}
                      placeholder="Masukkan No RM..."
                      className="w-full bg-navy-dark/50 border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-white focus:outline-none focus:border-emerald-500/50 shadow-inner transition-all"
                    />
                    <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* TEKANAN UDARA */}
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 border-b border-white/10 pb-2 flex items-center gap-2">
                <ThermometerSnowflake className="w-4 h-4 text-slate-400" /> Tekanan Udara
              </h3>
              
              <div className="space-y-4">
                <div className="bg-navy-dark/50 border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 transition-colors shadow-sm">
                  <p className="text-sm font-medium text-slate-300 md:max-w-[50%]">Tekanan Negatif</p>
                  <div className="flex bg-navy-dark/80 p-1.5 rounded-xl shrink-0 w-full md:w-auto shadow-inner shadow-black/40 border border-white/5">
                    <button 
                      onClick={() => setTekananNegatif('ya')}
                      className={`flex-1 md:w-20 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${tekananNegatif === 'ya' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      Ya
                    </button>
                    <button 
                      onClick={() => setTekananNegatif('tidak')}
                      className={`flex-1 md:w-20 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${tekananNegatif === 'tidak' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      Tidak
                    </button>
                    <button 
                      onClick={() => setTekananNegatif('na')}
                      className={`flex-1 md:w-20 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${tekananNegatif === 'na' ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      N/A
                    </button>
                  </div>
                </div>

                <div className="bg-navy-dark/50 border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 transition-colors shadow-sm">
                  <p className="text-sm font-medium text-slate-300 md:max-w-[50%]">Tekanan Positif</p>
                  <div className="flex bg-navy-dark/80 p-1.5 rounded-xl shrink-0 w-full md:w-auto shadow-inner shadow-black/40 border border-white/5">
                    <button 
                      onClick={() => setTekananPositif('ya')}
                      className={`flex-1 md:w-20 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${tekananPositif === 'ya' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      Ya
                    </button>
                    <button 
                      onClick={() => setTekananPositif('tidak')}
                      className={`flex-1 md:w-20 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${tekananPositif === 'tidak' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      Tidak
                    </button>
                    <button 
                      onClick={() => setTekananPositif('na')}
                      className={`flex-1 md:w-20 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${tekananPositif === 'na' ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      N/A
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* CHECKLIST PPI */}
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 border-b border-white/10 pb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-400" /> Indikator Kepatuhan
              </h3>
              
              <div className="space-y-4">
                {checklistItems.map((item) => (
                  <div key={item.id} className="bg-navy-dark/50 border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 transition-colors shadow-sm">
                    <p className="text-sm font-medium text-slate-300 md:max-w-[50%]">{item.label}</p>
                    
                    <div className="flex bg-navy-dark/80 p-1.5 rounded-xl shrink-0 w-full md:w-auto shadow-inner shadow-black/40 border border-white/5">
                      <button 
                        onClick={() => handleActionClick(item.id, 'ya')}
                        className={`flex-1 md:w-20 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${answers[item.id] === 'ya' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                      >
                        Ya
                      </button>
                      <button 
                        onClick={() => handleActionClick(item.id, 'tidak')}
                        className={`flex-1 md:w-20 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${answers[item.id] === 'tidak' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                      >
                        Tidak
                      </button>
                      <button 
                        onClick={() => handleActionClick(item.id, 'na')}
                        className={`flex-1 md:w-20 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${answers[item.id] === 'na' ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                      >
                        N/A
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KETERANGAN KESELURUHAN */}
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 border-b border-white/10 pb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" /> Keterangan Tambahan
              </h3>
              <div className="relative">
                <input 
                  type="text" 
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Contoh: Susp. TB Paru, COVID Suspek, Varicella..."
                  className="w-full bg-navy-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 shadow-inner transition-all"
                />
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 5: PERSENTASE OTOMATIS */}
        <div className="glass-card p-8 rounded-xl border border-white/5 relative overflow-hidden group hover:border-blue-500/20 transition-all duration-500">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-[60px] -z-10 group-hover:bg-blue-500/10 transition-colors duration-500" />
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-8">
            <Activity className="w-4 h-4 text-blue-400" /> Statistik Realtime
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="bg-navy-dark/50 rounded-2xl p-5 border border-white/5 flex flex-col items-center justify-center text-center shadow-inner shadow-black/20">
              <span className="text-3xl font-heading font-bold text-white mb-1.5">{stats.dinilai}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Item Dinilai</span>
            </div>
            
            <div className="bg-navy-dark/50 rounded-2xl p-5 border border-white/5 flex flex-col items-center justify-center text-center shadow-inner shadow-black/20">
              <span className="text-3xl font-heading font-bold text-emerald-400 mb-1.5">{stats.patuh}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Jumlah Sesuai</span>
            </div>
            
            <div className="bg-navy-dark/50 rounded-2xl p-5 border border-white/5 flex flex-col items-center justify-center text-center shadow-inner shadow-black/20">
              <span className="text-3xl font-heading font-bold text-red-400 mb-1.5">{stats.tidakPatuh}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Tidak Sesuai</span>
            </div>
            
            <div className={`${stats.bg} rounded-2xl p-5 border border-white/5 flex flex-col items-center justify-center text-center shadow-inner shadow-black/20`}>
              <span className={`text-sm sm:text-lg font-heading font-bold mb-1.5 leading-tight ${stats.color}`}>{stats.status}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Status Audit</span>
            </div>
            
            <div className="bg-navy-dark/50 rounded-2xl p-5 border border-white/5 flex flex-col items-center justify-center relative shadow-inner shadow-black/20 col-span-2 md:col-span-1">
              <svg className="w-20 h-20 transform -rotate-90 filter drop-shadow-md">
                <circle cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                <circle cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={calculateDashOffset(stats.persentase)}
                  className={`transition-all duration-1000 ease-out ${stats.color}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-heading font-bold text-white tracking-widest">{stats.persentase}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 6 & 7: Temuan & Rekomendasi */}
        <div className="glass-card p-6 rounded-xl border border-white/5 relative overflow-hidden group hover:border-amber-500/20 transition-all duration-500">
           <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-[60px] -z-10 group-hover:bg-amber-500/10 transition-colors duration-500" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-amber-400 group-hover:text-amber-300 transition-colors duration-500">
                <AlertCircle className="w-4 h-4" /> Temuan
              </h2>
              <textarea 
                value={temuan}
                onChange={(e) => setTemuan(e.target.value)}
                placeholder="Contoh: APD tidak lengkap, Handrub kosong..."
                className="w-full h-32 bg-navy-dark/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none shadow-inner shadow-black/20"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-emerald-400 group-hover:text-emerald-300 transition-colors duration-500">
                  <Edit2 className="w-4 h-4" /> Rekomendasi
                </h2>
              </div>
              <textarea 
                value={rekomendasi}
                onChange={(e) => setRekomendasi(e.target.value)}
                placeholder="Contoh: Lengkapi stok masker N95, Edukasi ulang pasien..."
                className="w-full h-32 bg-navy-dark/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none shadow-inner shadow-black/20"
              />
            </div>
          </div>
        </div>

        {/* SECTION 8: Dokumentasi */}
        <div className="glass-card p-6 rounded-xl border border-white/5 relative overflow-hidden group hover:border-purple-500/20 transition-all duration-500">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-[60px] -z-10 group-hover:bg-purple-500/10 transition-colors duration-500" />
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-purple-400 mb-6 group-hover:text-purple-300 transition-colors duration-500">
            <Camera className="w-4 h-4" /> Dokumentasi
          </h2>
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        {/* SECTION 9: Tanda Tangan */}
        <div className="glass-card p-6 rounded-xl border border-white/5 relative overflow-hidden group hover:border-blue-500/20 transition-all duration-500">
           <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-[60px] -z-10 group-hover:bg-blue-500/10 transition-colors duration-500" />
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-400 mb-6">
            <Signature className="w-4 h-4" /> Tanda Tangan Digital
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 text-center">Tanda Tangan IPCN/Observer</label>
              <div className="bg-white rounded-xl border border-white/20 p-2 h-40 shadow-inner">
                <SignatureCanvas 
                  ref={sigPadIpcn}
                  canvasProps={{ className: "w-full h-full rounded-lg" }}
                  penColor="black"
                  backgroundColor="white"
                />
              </div>
              <button 
                onClick={() => sigPadIpcn.current?.clear()}
                className="text-[10px] text-slate-400 hover:text-white uppercase tracking-widest text-center w-full block transition-colors"
                type="button"
              >
                Hapus Tanda Tangan
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 text-center">Tanda Tangan PJ Ruang Isolasi</label>
              <div className="bg-white rounded-xl border border-white/20 p-2 h-40 shadow-inner">
                <SignatureCanvas 
                  ref={sigPadPj}
                  canvasProps={{ className: "w-full h-full rounded-lg" }}
                  penColor="black"
                  backgroundColor="white"
                />
              </div>
              <button 
                onClick={() => sigPadPj.current?.clear()}
                className="text-[10px] text-slate-400 hover:text-white uppercase tracking-widest text-center w-full block transition-colors"
                type="button"
              >
                Hapus Tanda Tangan
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 pb-10">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !observer}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white rounded-xl py-4 font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" /> Simpan Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Observer Modal */}
      <AnimatePresence>
        {showObserverModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowObserverModal(false);
                setEditObserverId(null);
                setNewObserverName('');
              }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-md p-6 rounded-3xl border border-white/10 relative z-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-400" /> Kelola Supervisor
                </h3>
                <button 
                  onClick={() => setShowObserverModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-navy-dark border border-white/5 rounded-2xl p-4 max-h-[40vh] overflow-y-auto custom-scrollbar">
                  {observers.map(o => (
                    <div key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl mb-2 transition-colors border border-white/5">
                      <span className="text-sm text-slate-200 truncate pr-2" title={o.nama}>{o.nama}</span>
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button 
                          onClick={() => { setEditObserverId(o.id); setNewObserverName(o.nama); }}
                          className="p-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteObserver(o.id)}
                          className="p-1.5 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {observers.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-4">Belum ada supervisor</p>
                  )}
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
                    {editObserverId ? 'Edit Supervisor' : 'Tambah Supervisor Baru'}
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newObserverName}
                      onChange={(e) => setNewObserverName(e.target.value)}
                      placeholder="Nama & Gelar IPCN/Admin..."
                      className="flex-1 bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveObserver();
                        }
                      }}
                    />
                    <button 
                      onClick={saveObserver}
                      disabled={!newObserverName.trim()}
                      className="px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20"
                    >
                      {editObserverId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </button>
                  </div>
                  {editObserverId && (
                    <button
                      onClick={() => {
                        setEditObserverId(null);
                        setNewObserverName('');
                      }}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
