'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle2,
  ClipboardCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

const bundleTypes = [
  { id: 'insersi-plabsi', title: 'Insersi PLABSI' },
  { id: 'maint-plabsi', title: 'Maintenance PLABSI' },
  { id: 'isk', title: 'Bundle ISK' },
  { id: 'maint-isk', title: 'Maintenance ISK' },
  { id: 'ido', title: 'Bundle IDO' },
  { id: 'vap', title: 'Bundle VAP' },
];

const checklistItems: Record<string, string[]> = {
  'insersi-plabsi': [
    'Kebersihan tangan sebelum tindakan',
    'Penggunaan APD maksimal (Topi, Masker, Gaun steril, Sarung tangan steril)',
    'Preparasi kulit dengan Chlorhexidine 2%',
    'Pemilihan lokasi (Hindari vena femoralis jika memungkinkan)',
    'Evaluasi kebutuhan kateter setiap hari'
  ],
  'maint-plabsi': [
    'Kebersihan tangan sebelum menyentuh line',
    'Disinfeksi hub sebelum akses (Scrub the hub)',
    'Ganti dressing jika kotor/lepas/lembab',
    'Ganti set infus sesuai standar (72-96 jam)',
    'Evaluasi harian kebutuhan kateter'
  ]
};

export default function BundlesInputPage() {
  const router = useRouter();
  const [activeBundle, setActiveBundle] = useState('insersi-plabsi');
  const [formData, setFormData] = useState<Record<string, boolean | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const currentChecklist = checklistItems[activeBundle] || checklistItems['insersi-plabsi'];

  const handleToggle = (index: number, value: boolean) => {
    setFormData(prev => ({ ...prev, [`${activeBundle}-${index}`]: value }));
  };

  const calculateScore = () => {
    let yesCount = 0;
    let totalAnswered = 0;
    currentChecklist.forEach((_, i) => {
      const val = formData[`${activeBundle}-${i}`];
      if (val !== undefined && val !== null) {
        totalAnswered++;
        if (val) yesCount++;
      }
    });
    if (totalAnswered === 0) return 0;
    return Math.round((yesCount / currentChecklist.length) * 100); // Bundle is all or nothing usually, but we show % compliance here
  };

  const score = calculateScore();

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

  return (
    <div className="max-w-3xl mx-auto pb-24">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-medium"
          >
            <CheckCircle2 className="w-5 h-5" />
            Bundle berhasil disimpan!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 sticky top-16 bg-slate-50/90 backdrop-blur-md py-4 z-10 -mx-4 px-4 sm:mx-0 sm:px-0">
        <Link href="/dashboard/input" className="p-2 bg-white rounded-full shadow-sm border border-gray-200 text-text-muted hover:text-navy-dark transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-gradient">Monitoring Bundles HAIs</h1>
          <p className="text-xs text-text-muted">Pilih jenis bundle untuk diisi</p>
        </div>
      </div>

      {/* Horizontal Scroll Tabs */}
      <div className="flex overflow-x-auto pb-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar gap-2">
        {bundleTypes.map(type => (
          <button
            key={type.id}
            onClick={() => {
              setActiveBundle(type.id);
              setFormData({}); // reset on change for demo
            }}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              activeBundle === type.id 
                ? 'bg-primary text-white shadow-md' 
                : 'bg-white text-text-muted border border-gray-200 hover:border-primary hover:text-primary'
            }`}
          >
            {type.title}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meta Info */}
        <div className="sleek-card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Tanggal</label>
              <input type="date" className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" defaultValue={new Date().toISOString().split('T')[0]} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Nama Pasien / RM</label>
              <input type="text" className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Cari pasien..." required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Unit / Ruangan</label>
              <select className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" required>
                <option value="">Pilih Unit...</option>
                <option>IGD</option>
                <option>ICU</option>
                <option>Rawat Inap</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Petugas Pelaksana</label>
              <input type="text" className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Nama Petugas" required />
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="sleek-card">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <h2 className="font-bold text-navy-dark flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              Checklist {bundleTypes.find(b => b.id === activeBundle)?.title}
            </h2>
            <div className="text-right">
              <p className="text-xs text-text-muted font-semibold uppercase">Compliance</p>
              <p className={`text-2xl font-bold ${score === 100 ? 'text-emerald-500' : score > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                {score}%
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeBundle}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {currentChecklist.map((item, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-slate-50/50 rounded-xl border border-gray-100 hover:border-primary/30 transition-colors">
                    <p className="text-sm font-medium text-navy-dark leading-relaxed flex-1">{item}</p>
                    <div className="flex bg-white p-1 rounded-lg border border-gray-200 shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleToggle(i, true)}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                          formData[`${activeBundle}-${i}`] === true 
                            ? 'bg-emerald-100 text-emerald-700 shadow-sm' 
                            : 'text-text-muted hover:text-navy-dark'
                        }`}
                      >
                        Ya
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(i, false)}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                          formData[`${activeBundle}-${i}`] === false 
                            ? 'bg-red-100 text-red-700 shadow-sm' 
                            : 'text-text-muted hover:text-navy-dark'
                        }`}
                      >
                        Tidak
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 sm:left-[260px] z-40">
          <div className="max-w-3xl mx-auto">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-white bg-primary hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </div>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Simpan Bundle
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
