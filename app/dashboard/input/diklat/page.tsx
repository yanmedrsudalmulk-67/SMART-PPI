'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle2,
  UploadCloud,
  FileText,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

export default function DiklatInputPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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
    }, 2000);
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
            Data Diklat berhasil disimpan!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 sticky top-16 bg-slate-50/90 backdrop-blur-md py-4 z-10 -mx-4 px-4 sm:mx-0 sm:px-0">
        <Link href="/dashboard/input" className="p-2 bg-white rounded-full shadow-sm border border-gray-200 text-text-muted hover:text-navy-dark transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-gradient">Pendidikan & Pelatihan</h1>
          <p className="text-xs text-text-muted">Input data kegiatan diklat PPI</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="sleek-card space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Tanggal Kegiatan</label>
              <input type="date" className="w-full bg-slate-50 border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Tempat Pelaksanaan</label>
              <input type="text" className="w-full bg-slate-50 border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Misal: Aula Utama RS" required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Materi Pelatihan</label>
            <input type="text" className="w-full bg-slate-50 border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Judul materi..." required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Narasumber</label>
              <input type="text" className="w-full bg-slate-50 border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Nama Narasumber" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Jml Peserta</label>
                <input type="number" min="1" className="w-full bg-slate-50 border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="0" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Unit Peserta</label>
                <input type="text" className="w-full bg-slate-50 border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="All Unit" required />
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="sleek-card">
          <h2 className="font-bold text-navy-dark mb-4">Dokumentasi & Materi</h2>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-slate-50 hover:border-primary transition-colors cursor-pointer"
          >
            <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-navy-dark">Klik atau Drag & Drop file di sini</p>
            <p className="text-xs text-text-muted mt-1">Mendukung PDF, JPG, PNG (Max 10MB)</p>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-gray-100 rounded-lg">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm font-medium text-navy-dark truncate">{file.name}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeFile(i)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Digital Signature Placeholder */}
        <div className="sleek-card">
          <h2 className="font-bold text-navy-dark mb-4">Tanda Tangan Digital</h2>
          <div className="h-32 bg-slate-50 border border-gray-200 rounded-xl flex items-center justify-center">
            <p className="text-sm text-text-muted">Area Tanda Tangan Narasumber / Panitia</p>
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
                  Menyimpan ke Database...
                </div>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Simpan Data Pelatihan
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
