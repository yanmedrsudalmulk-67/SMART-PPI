'use client';

import { useState, useEffect, useMemo } from 'react';
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
  FileEdit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useAppContext } from '@/components/providers';

const observers = [
  'IPCN_Adi Tresa Purnama',
  'IPCLN_Syefira',
  'IPCLN_Siti Hapsoh Roditubillah',
  'IPCLN'
];

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
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  
  const [observer, setObserver] = useState('');
  const [unit, setUnit] = useState('');
  const [profesi, setProfesi] = useState('');
  
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
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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
    const end = new Date();
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

      <div className="grid lg:grid-cols-12 gap-8 relative items-start">
        
        {/* Form Column */}
        <div className="lg:col-span-8 space-y-6">
          
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
                <p className="text-sm font-bold text-slate-400">{endTime ? formatDate(endTime) : 'Dalam Proses...'}</p>
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
                  {userRole === 'IPCN' && (
                    <button type="button" className="text-blue-400 hover:text-white transition-colors" title="Kelola Observer">
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
                    className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all"
                    required
                  >
                    <option value="" className="bg-navy-dark text-slate-400">Pilih Observer...</option>
                    {observers.map(o => <option key={o} value={o} className="bg-navy-dark">{o}</option>)}
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

        {/* Sidebar Summary (Sticky on Desktop) */}
        <div className="lg:col-span-4 lg:sticky lg:top-40 space-y-6">
          <div className="glass-card p-6 sm:p-8 rounded-[32px] border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background dynamic glow based on percentage */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 blur-[80px] rounded-full -z-10 ${stats.bg.replace('/10', '/20')}`} />
            
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-8 w-full text-left">Realtime Analytics</h3>
            
            {/* SVG Circular Progress */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle 
                  cx="40" cy="40" r="36" 
                  fill="transparent" 
                  stroke="rgba(255,255,255,0.05)" 
                  strokeWidth="8" 
                />
                <motion.circle 
                  cx="40" cy="40" r="36" 
                  fill="transparent" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  strokeDasharray={2 * Math.PI * 36}
                  strokeLinecap="round"
                  className={stats.color}
                  initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
                  animate={{ strokeDashoffset: calculateDashOffset(stats.persentase) }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-heading font-bold text-white">{stats.persentase}%</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${stats.color}`}>{stats.status}</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 mt-2">
              <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                <p className="text-2xl font-bold text-white mb-1">{stats.patuh}</p>
                <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Kepatuhan</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                <p className="text-2xl font-bold text-white mb-1">{stats.peluang}</p>
                <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Peluang</p>
              </div>
            </div>

            {/* Smart Alert */}
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

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !observer || !unit || !profesi || stats.peluang === 0}
              className="mt-6 w-full px-8 py-4 rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.5)] text-[12px] font-bold uppercase tracking-[0.2em] text-white bg-blue-600 hover:bg-blue-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none  flex items-center justify-center gap-2 hover:scale-105"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Simpan
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
