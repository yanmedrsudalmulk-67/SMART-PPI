'use client';

import { useState, useMemo, useEffect } from 'react';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import { useRouter } from 'next/navigation';
import { Activity, ArrowLeft, Plus, Trash2, Save, AlertCircle, Loader2, Info, CheckCircle2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';

const categories = [
  'Ranap Dewasa',
  'Ranap Bedah',
  'Ranap Anak',
  'Ranap Kebidanan',
  'ICU'
];

interface PasienRow {
  id: string;
  nama: string;
  rm: string;
  tindakan: string; // 'Infus' | 'Kateter' | 'ETT' | ''
  jmlPemasangan: number | '';
  jmlInsiden: number | '';
}

export default function SurveilansFormPage() {
  const router = useRouter();

  const [date, setDate] = useState<string>('');
  const [petugas, setPetugas] = useState<string>('');
  const [kategori, setKategori] = useState<string>('');
  
  const [rows, setRows] = useState<PasienRow[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set default local datetime (YYYY-MM-DDThh:mm)
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000; 
    const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0,16);
    
    requestAnimationFrame(() => {
      setDate(localISOTime);
      // Initialize the first row inside the effect to avoid impure function calls during render
      setRows([{ id: Date.now().toString(), nama: '', rm: '', tindakan: '', jmlPemasangan: '', jmlInsiden: '' }]);
    });
  }, []);

  const addRow = () => {
    setRows([...rows, { id: Date.now().toString() + Math.random().toString(), nama: '', rm: '', tindakan: '', jmlPemasangan: '', jmlInsiden: '' }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof PasienRow, value: any) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Summaries
  const totalPemasangan = useMemo(() => {
    return rows.reduce((acc, row) => acc + (typeof row.jmlPemasangan === 'number' ? row.jmlPemasangan : 0), 0);
  }, [rows]);

  const totalInsiden = useMemo(() => {
    return rows.reduce((acc, row) => acc + (typeof row.jmlInsiden === 'number' ? row.jmlInsiden : 0), 0);
  }, [rows]);

  const totalRate = useMemo(() => {
    if (totalPemasangan === 0) return 0;
    return (totalInsiden / totalPemasangan) * 1000;
  }, [totalPemasangan, totalInsiden]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!date || !petugas || !kategori) {
      setError('Harap lengkapi Waktu, Petugas, dan Kategori.');
      return;
    }
    if (rows.length === 0) {
      setError('Minimal harus ada 1 data pasien.');
      return;
    }

    // Validate per row
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.nama.trim() || !r.rm.trim() || !r.tindakan || r.jmlPemasangan === '' || r.jmlInsiden === '') {
        setError(`Data pasien pada baris ke-${i + 1} belum lengkap.`);
        return;
      }
    }

    setIsSubmitting(true);
    
    // Simulating save operation
    setTimeout(() => {
      setIsSubmitting(false);
      setShowToast(true);
      setTimeout(() => {
        router.push('/dashboard/input');
      }, 1500);
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto pb-32 space-y-6 px-4 sm:px-6 mt-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 relative py-4 z-10 border-b border-white/5">
        <Link href="/dashboard/input" className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-[30px] font-heading font-bold tracking-tight text-gradient drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">Surveilans HAIs</h1>
          <p className="text-[15px] font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">Input Data Surveilans</p>
        </div>
      </div>

      {/* Warning/Error messages */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex flex-col sm:flex-row gap-3 items-start sm:items-center text-sm font-medium"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Main Info */}
        <div className="sleek-card grid grid-cols-1 md:grid-cols-3 gap-6 p-6 sm:p-8 rounded-[2rem] shadow-lg dark:border-white/5 relative overflow-hidden">
          <div className="relative z-10">
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Waktu Surveilans</label>
            <input 
              type="datetime-local" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-navy-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none"
            />
          </div>
          <div className="relative z-10">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Nama Petugas</label>
            <input 
              type="text"
              value={petugas}
              onChange={(e) => setPetugas(e.target.value)}
              placeholder="Masukkan nama petugas..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-navy-dark dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <div className="relative z-10">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Kategori Unit</label>
            <select 
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-navy-dark dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all shadow-inner hover:bg-slate-100 dark:hover:bg-white/10 appearance-none"
            >
              <option value="">Pilih Kategori</option>
              {categories.map(c => <option key={c} value={c} className="dark:bg-navy-dark dark:text-white bg-white text-navy-dark">{c}</option>)}
            </select>
          </div>
        </div>

        {/* Table Area */}
        <div className="sleek-card overflow-hidden p-6 sm:p-8 rounded-[2rem] shadow-lg dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-navy-dark dark:text-white">Data Pasien</h2>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-200 text-xs p-3 rounded-xl flex items-start gap-2 mb-6 border border-blue-100 dark:border-blue-500/20">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              Pastikan seluruh baris terisi sebelum menyimpan. Tentukan jenis tindakan/alat pada kolom Ceklist (Infus, Kateter, ETT).
            </p>
          </div>

          <div className="overflow-x-auto -mx-6 px-6 sm:-mx-8 sm:px-8 pb-4">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-100 dark:border-white/10 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="pb-3 w-12 font-bold text-center">No</th>
                  <th className="pb-3 px-2 font-bold min-w-[180px]">Nama Pasien</th>
                  <th className="pb-3 px-2 font-bold min-w-[120px]">No. RM</th>
                  <th className="pb-3 px-2 font-bold min-w-[140px]">Tindakan (Ceklist)</th>
                  <th className="pb-3 px-2 font-bold min-w-[140px]">Jml Hari Pemasangan</th>
                  <th className="pb-3 px-2 font-bold min-w-[120px]">Jml Insiden</th>
                  <th className="pb-3 w-16 px-2 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id} className="border-b border-gray-100/50 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="py-3 text-center text-sm font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-2">
                      <input 
                        type="text" 
                        placeholder="Nama Pasien..."
                        value={row.nama}
                        onChange={(e) => updateRow(row.id, 'nama', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-navy-dark dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input 
                        type="text" 
                        placeholder="RM-..."
                        value={row.rm}
                        onChange={(e) => updateRow(row.id, 'rm', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-navy-dark dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all uppercase placeholder:text-slate-400"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <select 
                        value={row.tindakan}
                        onChange={(e) => updateRow(row.id, 'tindakan', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-navy-dark dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all appearance-none"
                      >
                        <option value="" className="dark:bg-navy-dark dark:text-white bg-white text-navy-dark">- Pilih Ceklist -</option>
                        <option value="Infus" className="dark:bg-navy-dark dark:text-white bg-white text-navy-dark">Infus</option>
                        <option value="Kateter" className="dark:bg-navy-dark dark:text-white bg-white text-navy-dark">Kateter</option>
                        <option value="ETT" className="dark:bg-navy-dark dark:text-white bg-white text-navy-dark">ETT</option>
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <input 
                        type="number"
                        min="0"
                        placeholder="Mis. 5"
                        value={row.jmlPemasangan}
                        onChange={(e) => updateRow(row.id, 'jmlPemasangan', e.target.value === '' ? '' : parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-navy-dark dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input 
                        type="number"
                        min="0"
                        placeholder="Mis. 1"
                        value={row.jmlInsiden}
                        onChange={(e) => updateRow(row.id, 'jmlInsiden', e.target.value === '' ? '' : parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-navy-dark dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-400"
                      />
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button 
                        type="button"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length === 1}
                        className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Hapus Baris"
                      >
                        <Trash2 className="w-5 h-5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Row Button */}
          <button 
            type="button"
            onClick={addRow}
            className="mt-4 flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 hover:border-gray-300 dark:hover:border-white/20 hover:text-slate-700 dark:hover:text-slate-300 transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Baris Pasien
          </button>
        </div>

        {/* Summary Row */}
        <div className="bg-navy-dark text-white rounded-[2rem] shadow-xl overflow-hidden mt-6 relative">
          {/* Subtle gradients for summary section */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-white/10 relative z-10">
            <div className="flex flex-col sm:items-center sm:text-center pt-2 sm:pt-0">
              <p className="text-blue-200 font-medium text-xs uppercase tracking-widest mb-1">Total Pemasangan</p>
              <p className="text-3xl font-bold font-mono">{totalPemasangan}</p>
            </div>
            <div className="flex flex-col sm:items-center sm:text-center pt-4 sm:pt-0">
              <p className="text-rose-300 font-medium text-xs uppercase tracking-widest mb-1">Total Insiden</p>
              <p className="text-3xl font-bold font-mono">{totalInsiden}</p>
            </div>
            <div className="flex flex-col sm:items-center sm:text-center pt-4 sm:pt-0">
              <p className="text-emerald-300 font-medium text-xs uppercase tracking-widest mb-1">Insiden Rate Kombinasi</p>
              <div className="flex items-baseline sm:justify-center gap-1">
                <p className="text-4xl font-bold font-mono">{totalRate.toFixed(2)}</p>
                <p className="text-lg text-emerald-100 opacity-80">‰</p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
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

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-white/20 text-center"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            Data Surveilans Berhasil Disimpan
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


