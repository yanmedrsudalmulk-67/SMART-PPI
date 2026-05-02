'use client';

import { useState, useRef, useEffect } from 'react';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import { useRouter } from 'next/navigation';
import { Activity, ArrowLeft, Save, CheckCircle2, Clock, 
  MapPin, 
  UserSquare, 
  Users, 
  BookOpen, 
  Camera, 
  Upload, 
  Trash2, 
  X, 
  RefreshCw 
} from 'lucide-react';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

const PESERTA_OPTIONS = [
  'Dokter', 
  'Dokter Spesialis', 
  'Perawat', 
  'Bidan', 
  'Analis Laboratorium',
  'Radiografer', 
  'Farmasi', 
  'Pramusaji', 
  'Pegawai Baru', 
  'Cleaning Service', 
  'Mahasiswa PKL'
];

export default function DiklatInputPage() {
  const router = useRouter();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [tempat, setTempat] = useState('');
  const [narasumber, setNarasumber] = useState('');
  const [pesertaSelected, setPesertaSelected] = useState<string[]>([]);
  const [materi, setMateri] = useState('');
  
  // Dokumentasi
  const [images, setImages] = useState<DocImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setStartTime(new Date());
    });
  }, []);

  const addPeserta = (val: string) => {
    if (!val) return;
    if (!pesertaSelected.includes(val)) {
      setPesertaSelected(prev => [...prev, val].sort());
    }
  };

  const removePeserta = (val: string) => {
    setPesertaSelected(prev => prev.filter(p => p !== val));
  };

  // Image compression Helper
  
  const dataURLToBlob = (dataURL: string) => {
    if (!dataURL || !dataURL.includes(';base64,')) return null;
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  };

  
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempat || !narasumber || pesertaSelected.length === 0 || !materi) {
      alert('Harap lengkapi semua field wajib (Waktu, Tempat, Narasumber, Minimal 1 Peserta, dan Materi).');
      return;
    }

    setIsSubmitting(true);
    // Simulating database insert
    try {
      setTimeout(() => {
        setIsSubmitting(false);
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
          router.push('/dashboard/input');
        }, 2000);
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data pelatihan.');
      setIsSubmitting(false);
    }
  };

  const getLocalIsoString = (val: Date | null) => {
    if (!val) return '';
    const tzoffset = val.getTimezoneOffset() * 60000;
    return new Date(val.getTime() - tzoffset).toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-24 px-4 sm:px-6 mt-4">
      {/* Toast Notif */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-white/20 text-center"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            Data pelatihan berhasil disimpan
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 relative py-4 z-10 border-b border-white/5">
        <Link href="/dashboard/input" className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-[30px] font-heading font-bold tracking-tight text-gradient drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">Pendidikan & Pelatihan</h1>
          <p className="text-[15px] font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">Input Data Diklat PPI RS</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* KARTU FORM UTAMA */}
        <div className="sleek-card p-6 sm:p-8 rounded-[2rem] shadow-xl space-y-8 relative overflow-hidden dark:border-white/5">
          {/* subtle background gradient injection */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 dark:bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

          {/* WAKTU */}
          <div className="space-y-4 relative z-10">
            <h2 className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">
              <Clock className="w-5 h-5 text-blue-400 shrink-0" /> Waktu Pelaksanaan
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

          <div className="grid sm:grid-cols-2 gap-8 relative z-10">
            {/* TEMPAT */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Tempat Pelatihan
              </label>
              <input 
                type="text" 
                value={tempat}
                onChange={(e) => setTempat(e.target.value)}
                placeholder="Masukkan lokasi kegiatan..."
                className="w-full bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl px-4 py-3 text-sm text-navy-dark dark:text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-500"
                required
              />
            </div>

            {/* NARASUMBER */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <UserSquare className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Narasumber
              </label>
              <input 
                type="text" 
                value={narasumber}
                onChange={(e) => setNarasumber(e.target.value)}
                placeholder="Masukkan nama narasumber..."
                className="w-full bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl px-4 py-3 text-sm text-navy-dark dark:text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-500"
                required
              />
            </div>
          </div>

          {/* PESERTA PELATIHAN (MULTI-SELECT CHIPS) */}
          <div className="space-y-3 relative z-10 pt-4 border-t border-gray-100 dark:border-white/5">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <Users className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" /> Peserta Pelatihan
            </label>
            
            {/* Chips Container */}
            {pesertaSelected.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                <AnimatePresence>
                  {pesertaSelected.map(p => (
                    <motion.div 
                      key={p} 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold tracking-wide shadow-sm"
                    >
                      {p}
                      <button 
                        type="button" 
                        onClick={() => removePeserta(p)} 
                        className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-500 dark:text-blue-400 hover:text-blue-800 dark:hover:text-white border border-transparent rounded-md transition-all ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Dropdown Add Peserta */}
            <select 
              value=""
              onChange={(e) => addPeserta(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <option value="">+ Tambah Grup Peserta...</option>
              {PESERTA_OPTIONS.filter(o => !pesertaSelected.includes(o)).map(o => (
                <option key={o} value={o} className="dark:bg-navy-dark dark:text-white bg-white text-navy-dark">{o}</option>
              ))}
            </select>
          </div>

          {/* MATERI PELATIHAN */}
          <div className="space-y-3 relative z-10 pt-4 border-t border-gray-100 dark:border-white/5">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <BookOpen className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Materi / Topik
            </label>
            <textarea 
              value={materi}
              onChange={(e) => setMateri(e.target.value)}
              placeholder="Masukkan materi pelatihan secara lengkap..."
              className="w-full h-32 bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl px-4 py-3 text-sm text-navy-dark dark:text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
              required
            />
          </div>

          {/* DOKUMENTASI OVERHAUL */}
          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5 relative z-10 flex flex-col items-center">
            <DocumentationUploader images={images} setImages={setImages} />
          </div>
          
        </div>

        {/* TOMBOL SIMPAN */}
        <div className="pt-6">
          <motion.button
            type="submit"
            disabled={isSubmitting || !tempat || !narasumber || pesertaSelected.length === 0 || !materi}
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

      </form>
    </div>
  );
}

