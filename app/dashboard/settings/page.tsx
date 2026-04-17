'use client';

import { useRef, useState } from 'react';
import { useAppContext } from '@/components/providers';
import { Upload, Image as ImageIcon, Trash2, ShieldCheck, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const { logoUrl, setLogoUrl } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ text: '', type: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setLogoUrl(url); // Preview immediately
      setUploadMessage({ text: '', type: '' });
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadMessage({ text: 'Mengunggah logo...', type: 'info' });
    
    try {
      // Pastikan bucket sudah ada di Supabase Dashboard bernama "logos"
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `app_logo_${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { data, error } = await supabase.storage
        .from('logos')
        .upload(filePath, selectedFile, { upsert: true });

      if (error) throw error;

      // Ambil url publik setelah berhasil diupload
      const { data: publicUrlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrlData.publicUrl);
      setSelectedFile(null);
      setUploadMessage({ text: 'Logo berhasil disimpan ke Supabase!', type: 'success' });
      
    } catch (err: any) {
      console.error("Upload error:", err);
      if (err.message.includes('fetch')) {
        setUploadMessage({ text: 'Koneksi ke Supabase gagal. Cek konfigurasi ENV Anda.', type: 'error' });
      } else {
        setUploadMessage({ text: `Gagal menyimpan: ${err.message}`, type: 'error' });
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-gradient">Pengaturan Aplikasi</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Kelola preferensi dan tampilan aplikasi SMART-PPI</p>
        </div>
      </div>

      <div className="glass-card p-8 rounded-[32px] border-white/5">
        <h2 className="text-lg font-heading font-bold text-white mb-6 tracking-wide">Logo Aplikasi</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
          <div className="w-32 h-32 rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center bg-white/5 overflow-hidden shrink-0 shadow-inner group hover:border-blue-500/30 transition-all">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-4" />
            ) : (
              <ShieldCheck className="w-12 h-12 text-slate-600 group-hover:text-blue-400 transition-colors" />
            )}
          </div>
          <div className="space-y-4">
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Ubah logo aplikasi yang akan ditampilkan di halaman login, sidebar, dan laporan. Format yang didukung: JPG, PNG, SVG. Maksimal 2MB.
            </p>
            <div className="flex flex-wrap gap-4">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="px-6 py-3 bg-white/10 text-white border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/20 hover:border-white/20 transition-all flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Pilih Logo
              </button>
              
              {selectedFile && (
                <button 
                  onClick={handleSave} 
                  disabled={isUploading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isUploading ? 'Menyimpan...' : 'Simpan Logo'}
                </button>
              )}

              {logoUrl && !selectedFile && (
                <button 
                  onClick={() => setLogoUrl(null)} 
                  className="px-6 py-3 bg-red-600/10 text-red-400 border border-red-500/20 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-red-600/20 transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Hapus Logo
                </button>
              )}
            </div>
            
            {/* Notifikasi Upload */}
            {uploadMessage.text && (
              <p className={`text-[11px] font-bold tracking-wide mt-3 ${
                uploadMessage.type === 'error' ? 'text-red-400' : 
                uploadMessage.type === 'success' ? 'text-green-400' : 
                'text-blue-400'
              }`}>
                {uploadMessage.text}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-8 rounded-[32px] border-white/5">
        <h2 className="text-lg font-heading font-bold text-white mb-6 tracking-wide">Informasi Sistem</h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Versi Aplikasi</div>
            <div className="text-sm font-bold text-white tracking-wide">v2.1.0-enterprise</div>
          </div>
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Lisensi</div>
            <div className="text-sm font-bold text-blue-400 tracking-wide">RSUD Nasional (Aktif)</div>
          </div>
          <div className="flex items-center justify-between pb-2">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Terakhir Diperbarui</div>
            <div className="text-sm font-bold text-white tracking-wide">14 April 2026</div>
          </div>
        </div>
      </div>
    </div>
  );
}
