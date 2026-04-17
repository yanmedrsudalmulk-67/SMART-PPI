'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Camera, 
  Mic, 
  Save, 
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

const standarIndicators = [
  { id: 'hh', title: 'Kepatuhan Kebersihan Tangan', desc: 'Ketersediaan handrub, wastafel, sabun, tisu, dan kepatuhan petugas.' },
  { id: 'apd', title: 'Kepatuhan Penggunaan APD', desc: 'Ketersediaan dan kepatuhan penggunaan APD sesuai indikasi.' },
  { id: 'alat', title: 'Dekontaminasi Alat', desc: 'Proses pembersihan, disinfeksi, dan sterilisasi peralatan perawatan pasien.' },
  { id: 'lingkungan', title: 'Pengendalian Lingkungan', desc: 'Kebersihan permukaan lingkungan, tempat tidur, dan peralatan di sekitarnya.' },
  { id: 'limbah_medis', title: 'Pengelolaan Limbah Medis', desc: 'Pemisahan limbah infeksius dan non-infeksius, tempat sampah tertutup.' },
  { id: 'limbah_tajam', title: 'Pengelolaan Limbah Tajam', desc: 'Ketersediaan dan kondisi safety box (tidak > 3/4 penuh).' },
  { id: 'linen', title: 'Penatalaksanaan Linen', desc: 'Pemisahan linen kotor infeksius dan non-infeksius, troli tertutup.' },
  { id: 'petugas', title: 'Perlindungan Kesehatan Petugas', desc: 'Pemeriksaan kesehatan berkala, imunisasi, penanganan pasca pajanan.' },
  { id: 'penempatan', title: 'Penempatan Pasien', desc: 'Penempatan pasien sesuai dengan cara penularan infeksi.' },
  { id: 'etika', title: 'Etika Batuk', desc: 'Edukasi dan fasilitas etika batuk (masker, tempat sampah).' },
  { id: 'suntik', title: 'Penyuntikan Yang Aman', desc: 'Penggunaan spuit sekali pakai, teknik aseptik.' },
];

const transmisiIndicators = [
  { id: 'isolasi', title: 'PPI di Ruang Isolasi', desc: 'Kepatuhan petugas dan pengunjung di ruang isolasi.' },
  { id: 'airborne', title: 'Penempatan Pasien Airborne', desc: 'Ruang tekanan negatif, exhaust fan, pintu tertutup.' },
  { id: 'immuno', title: 'Penempatan Pasien Immunocompromised', desc: 'Ruang tekanan positif, perlindungan maksimal.' },
];

export default function IsolasiInputPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'standar' | 'transmisi'>('standar');
  const [formData, setFormData] = useState<Record<string, boolean | null>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleToggle = (id: string, value: boolean) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleNoteChange = (id: string, value: string) => {
    setNotes(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push('/dashboard/input');
      }, 2000);
    }, 1500);
  };

  const currentIndicators = activeTab === 'standar' ? standarIndicators : transmisiIndicators;

  return (
    <div className="max-w-3xl mx-auto pb-28 px-4 sm:px-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 font-bold uppercase tracking-widest text-[10px] border border-blue-400/30 glow-blue"
          >
            <CheckCircle2 className="w-4 h-4" />
            Data berhasil disimpan!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 relative py-4 z-10 border-b border-white/5">
        <Link href="/dashboard/input" className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg sm:text-xl font-heading font-bold tracking-tight text-gradient">Kewaspadaan Isolasi</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 mt-0.5">Input Data Audit</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white/5 rounded-xl mb-6 border border-white/5 relative z-10 mt-2">
        <button
          onClick={() => setActiveTab('standar')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
            activeTab === 'standar' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Standar
        </button>
        <button
          onClick={() => setActiveTab('transmisi')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
            activeTab === 'transmisi' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Transmisi
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Indicators */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {currentIndicators.map((ind, i) => (
                <div key={ind.id} className="glass-card p-4 sm:p-5 rounded-xl border-white/5 overflow-hidden">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-heading font-bold text-white text-sm sm:text-base leading-tight">{ind.title}</h3>
                      <p className="text-[10px] sm:text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2 md:line-clamp-none">{ind.desc}</p>
                    </div>
                    
                    {/* Minimalist Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggle(ind.id, formData[ind.id] === false ? true : false)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none shadow-inner ${
                        formData[ind.id] !== false ? 'bg-blue-600' : 'bg-white/10'
                      }`}
                      role="switch"
                      aria-checked={formData[ind.id] !== false}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                          formData[ind.id] !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {ind.id === 'hh' && (
                    <div className="pt-3 border-t border-white/5 mt-3">
                      <Link 
                        href="/dashboard/input/hand-hygiene" 
                        className="inline-flex items-center justify-center w-full py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-[10px] font-bold uppercase tracking-[0.1em] rounded-lg transition-all"
                      >
                        Buka Form 5 Momen WHO
                      </Link>
                    </div>
                  )}

                  {/* Conditional Actions if toggle is false (Tidak) */}
                  <AnimatePresence>
                    {formData[ind.id] === false && ind.id !== 'hh' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-4 border-t border-white/5 mt-4 space-y-3"
                      >
                        <div className="flex gap-3">
                          <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest text-red-400 transition-all">
                            <Camera className="w-3.5 h-3.5" /> Foto
                          </button>
                          <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-all">
                            <Mic className="w-3.5 h-3.5" /> Suara
                          </button>
                        </div>
                        <textarea 
                          placeholder="Catatan temuan atau rekomendasi tindak lanjut..."
                          value={notes[ind.id] || ''}
                          onChange={(e) => handleNoteChange(ind.id, e.target.value)}
                          className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-red-500/50 focus:bg-white/10 min-h-[60px] transition-all placeholder:text-slate-500 resize-none"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Submit Button - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-navy-dark/95 backdrop-blur-xl border-t border-white/5 lg:left-[260px] z-40">
          <div className="max-w-3xl mx-auto">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/20 text-[10px] font-bold uppercase tracking-[0.2em] text-white bg-blue-600 hover:bg-blue-500 focus:outline-none transition-all disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
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
      </form>
    </div>
  );
}
