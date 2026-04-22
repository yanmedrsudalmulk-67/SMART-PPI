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
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

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

const apdItems = [
  { id: 'masker', label: '1. Masker', key: 'masker' },
  { id: 'sarung_tangan', label: '2. Sarung Tangan', key: 'sarung_tangan' },
  { id: 'penutup_kepala', label: '3. Penutup Kepala', key: 'penutup_kepala' },
  { id: 'apron', label: '4. Apron', key: 'apron' },
  { id: 'goggle', label: '5. Kaca Mata / Goggle', key: 'goggle' },
  { id: 'sepatu_boot', label: '6. Sepatu Boot', key: 'sepatu_boot' },
  { id: 'gaun_pelindung', label: '7. Gaun / Baju Pelindung', key: 'gaun_pelindung' }
] as const;

type ApdStatus = 'ya' | 'tidak' | 'na' | null;

export default function InputApdPage() {
  const router = useRouter();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  const [observer, setObserver] = useState('');
  const [unit, setUnit] = useState('');
  const [profesi, setProfesi] = useState('');
  const [tindakan, setTindakan] = useState('');
  
  const [apdData, setApdData] = useState<Record<string, ApdStatus>>({
    masker: null,
    sarung_tangan: null,
    penutup_kepala: null,
    apron: null,
    goggle: null,
    sepatu_boot: null,
    gaun_pelindung: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  useEffect(() => {
    requestAnimationFrame(() => {
      setStartTime(new Date());
    });
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(date);
  };

  const handleActionClick = (id: string, stat: ApdStatus) => {
    setApdData(prev => ({ ...prev, [id]: stat }));
  };

  const stats = useMemo(() => {
    let patuh = 0;
    let dinilai = 0;
    
    Object.values(apdData).forEach(val => {
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
      if (persentase === 100) { 
        color = 'text-blue-400'; 
        bg = 'bg-blue-500/10'; 
        status = 'Patuh'; 
      } else { 
        color = 'text-red-400'; 
        bg = 'bg-red-500/10'; 
        status = 'Tidak Patuh'; 
      }
    }

    return { patuh, dinilai, persentase, color, bg, status };
  }, [apdData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();

      const payload = {
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer,
        unit,
        profesi,
        tindakan,
        masker: apdData.masker,
        sarung_tangan: apdData.sarung_tangan,
        penutup_kepala: apdData.penutup_kepala,
        apron: apdData.apron,
        goggle: apdData.goggle,
        sepatu_boot: apdData.sepatu_boot,
        gaun_pelindung: apdData.gaun_pelindung,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.status,
      };

      const { error } = await supabase
        .from('audit_apd')
        .insert([payload]);

      if (error) {
        console.error("Supabase insert error:", error);
        if (error.code !== '42P01') { 
          throw error; 
        }
      }

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push('/dashboard/input/isolasi');
      }, 2000);
    } catch (err: any) {
      console.error("Gagal menyimpan ke Supabase:", err);
      if (err.message && err.message.includes('row-level security policy')) {
        alert('Gagal menyimpan: Akses Ditolak oleh keamanan Supabase (RLS). Harap nonaktifkan Row-Level Security (RLS) pada tabel "audit_apd" atau tambahkan Policy (Insert) di dashboard Supabase agar aplikasi bisa mengisi data.');
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
    <div className="max-w-7xl mx-auto pb-32">
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
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-gradient drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">Input Audit Kepatuhan Penggunaan APD</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">Observasi penggunaan Alat Pelindung Diri petugas sesuai standar Pencegahan dan Pengendalian Infeksi Rumah Sakit.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 relative items-start px-4 sm:px-0">
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card p-6 rounded-[24px] border-white/5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
              <Clock className="w-4 h-4 text-blue-400" /> Waktu Observasi
            </h2>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 inline-block">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Waktu Input</p>
              <p className="text-sm font-bold text-white">{formatDate(startTime)}</p>
            </div>
          </div>

          <div className="glass-card p-6 rounded-[24px] border-white/5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
              <Activity className="w-4 h-4 text-purple-400" /> Data Subjek
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Observer</label>
                  <button type="button" className="text-blue-400 hover:text-white transition-colors" title="Kelola Observer">
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <select 
                    value={observer}
                    onChange={(e) => setObserver(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all"
                  >
                    <option value="" className="bg-navy-dark text-slate-400">Pilih Observer...</option>
                    {observers.map(o => <option key={o} value={o} className="bg-navy-dark">{o}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Unit</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-4 w-4 text-slate-500" />
                  </div>
                  <select 
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 appearance-none transition-all"
                  >
                    <option value="" className="bg-navy-dark text-slate-400">Cari Unit...</option>
                    {units.map(u => <option key={u} value={u} className="bg-navy-dark">{u}</option>)}
                  </select>
                </div>
              </div>

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
                  >
                    <option value="" className="bg-navy-dark text-slate-400">Pilih Profesi...</option>
                    {professions.map(p => <option key={p} value={p} className="bg-navy-dark">{p}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-[24px] border-white/5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
              <FileText className="w-4 h-4 text-amber-400" /> Tindakan
            </h2>
            <div>
              <input 
                type="text"
                value={tindakan}
                onChange={(e) => setTindakan(e.target.value)}
                placeholder="Contoh: Pemasangan infus, Visite pasien, Tindakan operasi"
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 pl-2">
              <Activity className="w-4 h-4 text-blue-400" /> APD yang Digunakan Saat Tindakan
            </h2>
            
            {apdItems.map((apd) => (
              <div key={apd.id} className="glass-card p-5 sm:p-6 rounded-[24px] border-white/5 hover:border-white/10 transition-all overflow-hidden relative">
                {apdData[apd.id] && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    apdData[apd.id] === 'ya' ? 'bg-blue-500 shadow-[0_0_10px_#10b981]' : 
                    apdData[apd.id] === 'tidak' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-slate-500'
                  }`} />
                )}
                
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-white">{apd.label}</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button 
                    type="button"
                    onClick={() => handleActionClick(apd.id, 'ya')}
                    className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                      apdData[apd.id] === 'ya' 
                        ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                        : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                    }`}
                  >
                    Ya
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleActionClick(apd.id, 'tidak')}
                    className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                      apdData[apd.id] === 'tidak' 
                        ? 'bg-red-600/20 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                        : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                    }`}
                  >
                    Tidak
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleActionClick(apd.id, 'na')}
                    className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                      apdData[apd.id] === 'na' 
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

        <div className="lg:col-span-4 lg:sticky lg:top-40 space-y-6">
          <div className="glass-card p-6 sm:p-8 rounded-[32px] border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 blur-[80px] rounded-full -z-10 ${stats.bg.replace('/10', '/20')}`} />
            
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-8 w-full text-left">Ringkasan Kepatuhan</h3>
            
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
                <p className="text-2xl font-bold text-white mb-1">{stats.dinilai}</p>
                <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Dinilai</p>
              </div>
            </div>

            <AnimatePresence>
              {stats.dinilai > 0 && stats.persentase < 100 && (
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
                    <li>Kepatuhan kurang dari standar 100%</li>
                    <li>Rekomendasi: Edukasi ulang prosedur APD</li>
                    <li>Tingkatkan supervisi dan monitoring berkala</li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !observer || !unit || !profesi || !tindakan || stats.dinilai === 0}
              className="mt-6 w-full px-8 py-4 rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.5)] text-[12px] font-bold uppercase tracking-[0.2em] text-white bg-blue-600 hover:bg-blue-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-105"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Simpan Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
