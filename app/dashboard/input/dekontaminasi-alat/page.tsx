'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { uploadImagesToSupabase } from '@/lib/upload';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
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
  FileEdit,
  Camera,
  Upload,
  Signature
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';

const observers = [
  'IPCN_Adi Tresa Purnama',
  'IPCLN_Syefira Salsabila',
  'IPCLN_Siti Hapsoh Roditubillah',
  'IPCLN_Ria Meliani',
  'IPCLN_Ema Mahmudah',
  'IPCLN_Putri Audia',
  'IPCLN_Seli Marselina',
  'IPCLN_Rahmat Hidayat',
  'IPCLN_Rickha Ilnia'
];

const units = [
  'IGD', 'ICU', 'IBS', 'Ranap Aisyah', 'Ranap Fatimah', 
  'Ranap Khadijah', 'Ranap Usman', 'Poli Bedah'
];

const alatItems = [
  { id: 'peralatan_tersedia', label: '1. PERALATAN TERSEDIA DAN TERSUSUN BAIK DI MEJA DAN LEMARI', key: 'peralatan_tersedia' },
  { id: 'peralatan_berkarat', label: '2. ADAKAH PERALATAN SARANA DAN PRASARANA KESEHATAN YANG BERKARAT', key: 'peralatan_berkarat' },
  { id: 'sterilisasi_tersentral', label: '3. STERILISASI TERSENTRAL', key: 'sterilisasi_tersentral' },
  { id: 'alat_reused', label: '4. ALAT USED REUSED SESUAI ATURAN', key: 'alat_reused' },
  { id: 'metode_dekontaminasi', label: '5. PETUGAS DAPAT MENJELASKAN METODA DEKONTAMINASI PERALATAN YANG BIASA DIGUNAKAN PASIEN', key: 'metode_dekontaminasi' },
  { id: 'dekontaminasi_lokal', label: '6. DEKONTAMINASI LOKAL DARI INSTRUMEN BEDAH TIDAK DILAKUKAN DI AREA KLINIS (JIKA MEMUNGKINKAN)', key: 'dekontaminasi_lokal' },
  { id: 'expired_date', label: '7. PASTIKAN EXPIRED DATE PERALATAN STERIL YANG DISIMPAN MASIH SESUAI, JIKA SUDAH LEWAT EXPIRED DATE MAKA DIKEMBALIKAN KE CSSD UNTUK STERILISASI ULANG', key: 'expired_date' },
  { id: 'instrumen_bekas', label: '8. INSTRUMEN BEKAS PAKAI DISIMPAN DI TEMPAT YANG SESUAI SEBELUM DIKUMPULKAN UNTUK DI DEKONTAMINASI', key: 'instrumen_bekas' }
] as const;

type AuditStatus = 'ya' | 'tidak' | 'na' | null;

export default function DekontaminasiAlatPage() {
  const router = useRouter();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  const [observer, setObserver] = useState('');
  const [unit, setUnit] = useState('');
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [dokumentasiUrl, setDokumentasiUrl] = useState('');
  const [images, setImages] = useState<DocImage[]>([]);
  
  // Signature pads
  const sigPadPj = useRef<SignatureCanvas>(null);
  const sigPadIpcn = useRef<SignatureCanvas>(null);
  
  const [data, setData] = useState<Record<string, AuditStatus>>({
    peralatan_tersedia: null,
    peralatan_berkarat: null,
    sterilisasi_tersentral: null,
    alat_reused: null,
    metode_dekontaminasi: null,
    dekontaminasi_lokal: null,
    expired_date: null,
    instrumen_bekas: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleActionClick = (id: string, stat: AuditStatus) => {
    setData(prev => ({ ...prev, [id]: stat }));
  };

  const stats = useMemo(() => {
    let patuh = 0;
    let dinilai = 0;
    
    Object.entries(data).forEach(([key, val]) => {
      if (val === null || val === 'na') return;
      dinilai++;
      
      // Khusus untuk item berkarat, 'tidak' berarti patuh (karena pertanyaannya "ADAKAH... BERKARAT")
      if (key === 'peralatan_berkarat') {
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
        color = 'text-blue-400'; 
        bg = 'bg-blue-500/10'; 
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

  const generateAI = () => {
    setIsGeneratingAI(true);
    setTimeout(() => {
      let recs = [];
      if (stats.persentase < 100) {
        if (data.peralatan_tersedia === 'tidak') recs.push('Pastikan peralatan selalu tersedia dan tersusun dengan baik di meja dan lemari.');
        if (data.peralatan_berkarat === 'ya') recs.push('Lakukan pemeliharaan atau penggantian sarana/prasarana kesehatan yang berkarat secepatnya.');
        if (data.sterilisasi_tersentral === 'tidak') recs.push('Pastikan alur sterilisasi dilakukan secara tersentralisasi sesuai ketentuan.');
        if (data.alat_reused === 'tidak') recs.push('Tegaskan aturan dan batasan untuk alat yang di re-use (digunakan kembali).');
        if (data.metode_dekontaminasi === 'tidak') recs.push('Berikan edukasi ulang agar petugas dapat menguasai metode dekontaminasi peralatan pasien.');
        if (data.dekontaminasi_lokal === 'tidak') recs.push('Pastikan tidak ada kegiatan dekontaminasi lokal instrumen bedah di area klinis.');
        if (data.expired_date === 'tidak') recs.push('Lakukan monitoring ketat terhadap expired date alat steril. Segera kembalikan ke CSSD untuk disterilisasi ulang jika kadaluarsa.');
        if (data.instrumen_bekas === 'tidak') recs.push('Ingatkan staf untuk selalu menyimpan instrumen bekas pakai di tempat yang sesuai sebelum dikumpulkan.');
        if (recs.length === 0) recs.push('Tingkatkan supervisi pengelolaan peralatan.');
      } else {
         recs.push('Pertahankan standar kepatuhan pengelolaan dan dekontaminasi alat yang sudah sangat baik.');
      }
      if (temuan.length > 5) {
         recs.push('Tindaklanjuti segera temuan: ' + temuan);
      }
      setRekomendasi(recs.join('\n- '));
      setIsGeneratingAI(false);
    }, 1500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();

      // Get signatures if they exist
      const ttdPj = sigPadPj.current && !sigPadPj.current.isEmpty() ? sigPadPj.current.getTrimmedCanvas().toDataURL('image/png') : null;
      const ttdIpcn = sigPadIpcn.current && !sigPadIpcn.current.isEmpty() ? sigPadIpcn.current.getTrimmedCanvas().toDataURL('image/png') : null;

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
        .from('audit_dekontaminasi_alat')
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
        alert('Gagal menyimpan: Akses Ditolak oleh keamanan Supabase (RLS). Harap nonaktifkan Row-Level Security (RLS) pada tabel "audit_dekontaminasi_alat" atau tambahkan Policy (Insert) di dashboard Supabase agar aplikasi bisa mengisi data.');
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
          <h1 className="text-[30px] font-heading font-bold tracking-tight text-gradient drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">Input Audit Dekontaminasi Alat</h1>
          <p className="text-[15px] font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">Audit kepatuhan pengelolaan, dekontaminasi, sterilisasi, dan penyimpanan alat sesuai standar PPI Rumah Sakit.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* SECTION 1: Waktu Observasi */}
        <div className="glass-card p-6 rounded-[24px] border-white/5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Clock className="w-4 h-4 text-blue-400" /> Waktu Observasi
          </h2>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 inline-block cursor-pointer">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Waktu Input (Dapat diubah)</p>
            <input 
               type="datetime-local" 
               defaultValue={startTime ? new Date(startTime.getTime() - (startTime.getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''}
               onChange={(e) => setStartTime(new Date(e.target.value))}
               className="bg-transparent text-sm font-bold text-white outline-none"
            />
          </div>
        </div>

        {/* SECTION 2 & 3: Data Subjek */}
        <div className="glass-card p-6 rounded-[24px] border-white/5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <User className="w-4 h-4 text-blue-400" /> Observer & Unit
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                  className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all"
                >
                  <option value="" className="bg-navy-dark text-slate-400">Cari Unit...</option>
                  {units.map(u => <option key={u} value={u} className="bg-navy-dark">{u}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Checklist */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 pl-2">
            <Activity className="w-4 h-4 text-blue-400" /> Checklist Audit Dekontaminasi Alat
          </h2>
          
          {alatItems.map((item) => (
            <div key={item.id} className="glass-card p-5 sm:p-6 rounded-[24px] border-white/5 hover:border-white/10 transition-all overflow-hidden relative">
              {data[item.id] && (
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  data[item.id] === 'ya' ? 'bg-gradient-to-r from-blue-400 to-purple-500 shadow-[0_0_10px_#3b82f6]' : 
                  data[item.id] === 'tidak' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-slate-500'
                }`} />
              )}
              
              <div className="mb-4">
                <h3 className="text-sm font-bold text-white">{item.label}</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button 
                  type="button"
                  onClick={() => handleActionClick(item.id, 'ya')}
                  className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                    data[item.id] === 'ya' 
                      ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                      : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                  }`}
                >
                  Ya
                </button>
                <button 
                  type="button"
                  onClick={() => handleActionClick(item.id, 'tidak')}
                  className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                    data[item.id] === 'tidak' 
                      ? 'bg-red-600/20 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                      : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                  }`}
                >
                  Tidak
                </button>
                <button 
                  type="button"
                  onClick={() => handleActionClick(item.id, 'na')}
                  className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                    data[item.id] === 'na' 
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

        {/* SECTION 5: Statistik */}
        <div className="glass-card p-6 sm:p-8 rounded-[32px] border-white/5 flex flex-col md:flex-row items-center justify-center gap-8 relative overflow-hidden">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-[80px] rounded-full -z-10 ${stats.bg.replace('/10', '/10')}`} />
          
          <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <motion.circle 
                cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={2 * Math.PI * 36} strokeLinecap="round" className={stats.color}
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

          <div className="w-full max-w-sm grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
              <p className="text-3xl font-bold text-white mb-2">{stats.patuh}</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Kepatuhan</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
              <p className="text-3xl font-bold text-white mb-2">{stats.dinilai}</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Item Dinilai</p>
            </div>
          </div>
        </div>

        {/* SECTION 6: Temuan */}
        <div className="glass-card p-6 rounded-[24px] border-white/5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">
            <FileText className="w-4 h-4 text-blue-400" /> Temuan
          </h2>
          <textarea 
            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all min-h-[100px]"
            placeholder="Tuliskan temuan audit di lapangan secara spesifik..."
            value={temuan}
            onChange={(e)=>setTemuan(e.target.value)}
          />
        </div>

        {/* SECTION 7: Rekomendasi */}
        <div className="glass-card p-6 rounded-[24px] border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
              <FileEdit className="w-4 h-4 text-blue-400" /> Rekomendasi
            </h2>
          </div>
          <textarea 
            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all min-h-[100px]"
            placeholder="Tuliskan rekomendasi rencana tindak lanjut..."
            value={rekomendasi}
            onChange={(e)=>setRekomendasi(e.target.value)}
          />
        </div>

        {/* SECTION 8: Dokumentasi */}
        <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 shadow-xl space-y-6 flex flex-col items-center">
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

        {/* SAVE BUTTON (Bottom of the formulation flow) */}
        <div className="pt-4 pb-8">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !observer || !unit || stats.dinilai === 0}
            className="w-full px-8 py-5 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)] text-sm font-bold uppercase tracking-[0.2em] text-white bg-blue-600 hover:bg-blue-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-3 hover:scale-[1.01]"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="tracking-[0.2em]">Menyimpan...</span>
              </div>
            ) : (
              <>
                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="tracking-[0.2em]">Simpan Data</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
