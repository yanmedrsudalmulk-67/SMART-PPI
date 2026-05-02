'use client';

import { useState, useEffect, useMemo } from 'react';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle2,
  Clock,
  User,
  Building2,
  Stethoscope,
  Activity,
  Settings,
  AlertCircle,
  RefreshCw,
  FileEdit,
  X,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useAppContext } from '@/components/providers';
import { getSupabase } from '@/lib/supabase';

type Observer = { id: string; nama: string };

const units = [
  'IGD', 'ICU', 'IBS', 'Rawat Jalan', 'Ranap Aisyah', 
  'Ranap Fatimah', 'Ranap Khadijah', 'Ranap Usman', 
  'Radiologi', 'Laboratorium', 'Pantry', 'Emergency Kebidanan'
];

const professions = [
  'Dokter Umum', 'Dokter Spesialis', 'Perawat', 'Bidan', 
  'Analis Laboratorium', 'Radiografer', 'Pramusaji'
];

const moments = [
  { id: 'm1', label: 'Momen 1', desc: 'Sebelum kontak dengan pasien' },
  { id: 'm2', label: 'Momen 2', desc: 'Sebelum melakukan tindakan aseptik' },
  { id: 'm3', label: 'Momen 3', desc: 'Sesudah menyentuh cairan tubuh pasien' },
  { id: 'm4', label: 'Momen 4', desc: 'Sesudah kontak dengan pasien' },
  { id: 'm5', label: 'Momen 5', desc: 'Sesudah menyentuh lingkungan pasien' },
] as const;

type Action = 'hr' | 'hw' | 'miss' | 'na' | null;

export default function HandHygieneAuditPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  const isIPCN = userRole === 'IPCN' || userRole === 'Admin';
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  
  const [observer, setObserver] = useState('');
  const [unit, setUnit] = useState('');
  const [profesi, setProfesi] = useState('');
  
  // Observer Management
  const [observers, setObservers] = useState<Observer[]>([]);
  const [isObserverModalOpen, setIsObserverModalOpen] = useState(false);
  const [newObserverName, setNewObserverName] = useState('');
  const [editObserverId, setEditObserverId] = useState<string | null>(null);

  const [momenData, setMomenData] = useState<Record<string, Action>>({
    m1: null, m2: null, m3: null, m4: null, m5: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  // Format Date to DD/MM/YYYY HH:MM
  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(date);
  };

  const toLocalISOString = (date: Date | null) => {
    if (!date) return '';
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const getDuration = () => {
    if (!startTime) return '0 Menit';
    const end = endTime || now || new Date();
    const diff = Math.floor((end.getTime() - startTime.getTime()) / 1000 / 60); // minutes
    return `${diff} Menit`;
  };
  
  // Realtime clock for duration if not ended
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const d = new Date();
    requestAnimationFrame(() => {
      setStartTime(d);
      setNow(d);
    });
    fetchObservers();
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
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

  const handleActionClick = (momenId: string, action: Action) => {
    setMomenData(prev => ({ ...prev, [momenId]: action }));
  };

  const stats = useMemo(() => {
    let patuh = 0;
    let peluang = 0;
    
    Object.values(momenData).forEach(val => {
      if (val === 'hr' || val === 'hw') {
        patuh++;
        peluang++;
      } else if (val === 'miss') {
        peluang++;
      }
    });

    const persentase = peluang > 0 ? Math.round((patuh / peluang) * 100) : 0;
    let color = 'text-slate-400';
    let bg = 'bg-slate-500/10';
    let status = 'Belum Dinilai';
    
    if (peluang > 0) {
      if (persentase >= 85) { color = 'text-blue-400'; bg = 'bg-blue-500/10'; status = 'Baik'; }
      else if (persentase >= 70) { color = 'text-amber-400'; bg = 'bg-amber-500/10'; status = 'Cukup'; }
      else { color = 'text-red-400'; bg = 'bg-red-500/10'; status = 'Perlu Perbaikan'; }
    }

    return { patuh, peluang, persentase, color, bg, status };
  }, [momenData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const end = endTime || new Date();
    setEndTime(end);
    setIsSubmitting(true);
    
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();

      const { error } = await supabase
        .from('audit_hand_hygiene')
        .insert([{
          observer,
          unit,
          profesi,
          m1: momenData.m1,
          m2: momenData.m2,
          m3: momenData.m3,
          m4: momenData.m4,
          m5: momenData.m5,
          patuh: stats.patuh,
          peluang: stats.peluang,
          persentase: stats.persentase,
          start_time: startTime?.toISOString() || new Date().toISOString(),
          end_time: end.toISOString()
        }]);

      if (error) throw error;

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push('/dashboard/input');
      }, 2000);
    } catch (err: any) {
      console.error("Gagal menyimpan ke Supabase:", err);
      if (err.message && err.message.includes('row-level security policy')) {
        alert('Gagal menyimpan: Akses Ditolak oleh keamanan Supabase (RLS). Harap nonaktifkan Row-Level Security (RLS) pada tabel "audit_hand_hygiene" atau tambahkan Policy (Insert) di dashboard Supabase agar aplikasi bisa mengisi data.');
      } else {
        // Fallback alert jika gagal (browser API)
        alert(`Gagal menyimpan data: ${err.message || 'Cek koneksi dan tabel database Supabase'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDashOffset = (percent: number) => {
    const circumference = 2 * Math.PI * 36; // r=36
    return circumference - (percent / 100) * circumference;
  };

  return (
    <div className="max-w-7xl mx-auto pb-32">
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-blue-400/30 glow-blue"
          >
            <CheckCircle2 className="w-5 h-5" />
            Data Audit Tersimpan ke Supabase!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-6 mb-8 relative bg-navy-dark/90 backdrop-blur-xl py-6 z-10 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-white/5">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-gradient drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">Audit Hand Hygiene</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">Kepatuhan 5 Momen dan 6 Langkah Cuci Tangan</p>
        </div>
      </div>

      <div className="space-y-8 relative px-4 sm:px-0">
        
        {/* Form Column */}
        <div className="space-y-6">
          
          {/* SECTION 1: Waktu Observasi */}
          <div className="glass-card p-6 rounded-[24px] border-white/5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
              <Clock className="w-4 h-4 text-blue-400" /> Waktu Observasi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Waktu Mulai</p>
                <p className="text-sm font-bold text-white">{formatDate(startTime)}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Durasi</p>
                <p className="text-sm font-bold text-blue-400">{getDuration()}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Waktu Selesai</p>
                <input 
                  type="datetime-local"
                  value={endTime ? toLocalISOString(endTime) : toLocalISOString(now)}
                  onChange={(e) => setEndTime(new Date(e.target.value))}
                  className="w-full bg-transparent border-none text-sm font-bold text-blue-400 outline-none p-0 [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2, 3, 4: Data Observer, Unit, Profesi */}
          <div className="glass-card p-6 rounded-[24px] border-white/5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
              <Activity className="w-4 h-4 text-purple-400" /> Data Subjek
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* Observer */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Observer</label>
                  {isIPCN && (
                    <button 
                      type="button" 
                      onClick={() => setIsObserverModalOpen(true)}
                      className="text-blue-400 hover:text-white transition-colors" 
                      title="Kelola Observer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <select 
                    value={observer}
                    onChange={(e) => setObserver(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all cursor-pointer"
                    required
                  >
                    <option value="" className="bg-navy-dark text-slate-400">Pilih Observer...</option>
                    {observers.map(o => <option key={o.id || o.nama} value={o.nama} className="bg-navy-dark">{o.nama}</option>)}
                  </select>
                </div>
              </div>

              {/* Unit */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Ruangan / Unit</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-4 w-4 text-slate-500" />
                  </div>
                  <select 
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 appearance-none transition-all"
                    required
                  >
                    <option value="" className="bg-navy-dark text-slate-400">Cari Unit...</option>
                    {units.map(u => <option key={u} value={u} className="bg-navy-dark">{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Profesi */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Profesi</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Stethoscope className="h-4 w-4 text-slate-500" />
                  </div>
                  <select 
                    value={profesi}
                    onChange={(e) => setProfesi(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all"
                    required
                  >
                    <option value="" className="bg-navy-dark text-slate-400">Pilih Profesi...</option>
                    {professions.map(p => <option key={p} value={p} className="bg-navy-dark">{p}</option>)}
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 5: 5 Momen Cuci Tangan */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 pl-2">
              <Activity className="w-4 h-4 text-blue-400" /> Penerapan 5 Momen dan 6 Langkah Cuci Tangan
            </h2>
            
            {moments.map((momen) => (
              <div key={momen.id} className="glass-card p-5 sm:p-6 rounded-[24px] border-white/5 hover:border-white/10 transition-all overflow-hidden relative">
                {/* Visual Indicator of selection */}
                {momenData[momen.id] && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    momenData[momen.id] === 'hr' || momenData[momen.id] === 'hw' ? 'bg-blue-500 shadow-[0_0_10px_#10b981]' : 
                    momenData[momen.id] === 'miss' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-slate-500'
                  }`} />
                )}
                
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-2 py-1 rounded-lg text-white">
                      {momen.label}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">{momen.desc}</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                  <button 
                    type="button"
                    onClick={() => handleActionClick(momen.id, 'hr')}
                    className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                      momenData[momen.id] === 'hr' 
                        ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                        : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                    }`}
                  >
                    Handrub
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleActionClick(momen.id, 'hw')}
                    className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                      momenData[momen.id] === 'hw' 
                        ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                        : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                    }`}
                  >
                    Handwash
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleActionClick(momen.id, 'miss')}
                    className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                      momenData[momen.id] === 'miss' 
                        ? 'bg-red-600/20 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                        : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                    }`}
                  >
                    Tidak HH
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleActionClick(momen.id, 'na')}
                    className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                      momenData[momen.id] === 'na' 
                        ? 'bg-slate-600/20 text-slate-300 border-slate-500/50' 
                        : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                    }`}
                  >
                    N/A
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HASIL PERSENTASE STANDARDIZED */}
        <LiveStatisticsCard 
          totalDinilai={stats.peluang}
          totalPatuh={stats.patuh}
          totalTidakPatuh={stats.peluang - stats.patuh}
          persentase={stats.persentase}
          statusText={stats.status}
          title="HASIL OBSERVASI HYGIENE"
        />

        <AnimatePresence>
          {stats.peluang > 0 && stats.persentase < 85 && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-left overflow-hidden mb-2"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Smart Alert</span>
              </div>
              <ul className="text-xs text-red-200 space-y-1.5 list-disc pl-4 font-medium">
                <li>Kepatuhan di bawah standar (≥85%)</li>
                <li>Edukasi ulang {profesi || 'petugas'} di unit terkait</li>
                <li>Evaluasi fasilitas hand hygiene</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8">
        <motion.button
          onClick={handleSubmit}
          disabled={isSubmitting || !observer || !unit || !profesi || stats.peluang === 0}
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
