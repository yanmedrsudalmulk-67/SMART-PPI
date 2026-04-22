'use client';

import { useRef, useState } from 'react';
import { useAppContext } from '@/components/providers';
import { Upload, Trash2, ShieldCheck, Save, Loader2, Hospital } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

export default function SettingsPage() {
  const { appLogoUrl, setAppLogoUrl, hospitalLogoUrl, setHospitalLogoUrl } = useAppContext();
  
  const appLogoRef = useRef<HTMLInputElement>(null);
  const hospitalLogoRef = useRef<HTMLInputElement>(null);
  
  const [selectedAppFile, setSelectedAppFile] = useState<File | null>(null);
  const [selectedHospitalFile, setSelectedHospitalFile] = useState<File | null>(null);
  
  const [isUploadingApp, setIsUploadingApp] = useState(false);
  const [isUploadingHospital, setIsUploadingHospital] = useState(false);
  
  const [appMsg, setAppMsg] = useState({ text: '', type: '' });
  const [hospitalMsg, setHospitalMsg] = useState({ text: '', type: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'app' | 'hospital') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'app') {
        setSelectedAppFile(file);
        setAppLogoUrl(url); // Preview immediately
        setAppMsg({ text: '', type: '' });
      } else {
        setSelectedHospitalFile(file);
        setHospitalLogoUrl(url);
        setHospitalMsg({ text: '', type: '' });
      }
    }
  };

  const handleSave = async (type: 'app' | 'hospital') => {
    const file = type === 'app' ? selectedAppFile : selectedHospitalFile;
    if (!file) return;
    
    const setMsg = type === 'app' ? setAppMsg : setHospitalMsg;
    const setIsUploading = type === 'app' ? setIsUploadingApp : setIsUploadingHospital;
    const setContextUrl = type === 'app' ? setAppLogoUrl : setHospitalLogoUrl;
    
    setIsUploading(true);
    setMsg({ text: `Mengunggah logo ${type === 'app' ? 'SMART PPI' : 'RSUD'}...`, type: 'info' });
    
    try {
      const fileName = type === 'app' ? 'app_logo.png' : 'hospital_logo.png';
      const filePath = `public/${fileName}`;

      const supabase = getSupabase();
      
      try {
        await supabase.storage.createBucket('logos', { public: true });
      } catch (e) {
        // Abaikan error
      }
      
      const { error } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true, contentType: file.type || 'image/png' });

      if (error) {
        if (error.message.includes('Bucket not found')) {
           throw new Error('Bucket "logos" belum dibuat. Harap buat public bucket bernama "logos" di storage Supabase Anda.');
        }
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      // Force cache bust on new URL
      const finalUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
      setContextUrl(finalUrl);
      
      if (type === 'app') setSelectedAppFile(null);
      else setSelectedHospitalFile(null);
      
      setMsg({ text: `Logo berhasil disimpan ke Supabase!`, type: 'success' });
      
    } catch (err: any) {
      console.error("Upload error:", err);
      if (err.message && err.message.includes('fetch')) {
        setMsg({ text: 'Koneksi ke Supabase gagal (Failed to fetch).', type: 'error' });
      } else if (err.message && err.message.includes('row-level security policy')) {
        setMsg({ 
          text: 'Upload ditolak oleh RLS. Jalankan perintah di SQL Editor Supabase untuk izin public bucket (lihat bantuan).', 
          type: 'error' 
        });
      } else {
        setMsg({ text: `Gagal menyimpan: ${err.message || 'Error tidak diketahui'}`, type: 'error' });
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-gradient drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">Pengaturan Aplikasi</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Kelola preferensi dan tampilan aplikasi SMART-PPI</p>
        </div>
      </div>

      {/* PANEL LOGO APLIKASI (SMART PPI) */}
      <div className="glass-card p-8 rounded-[32px] border-white/5">
        <h2 className="text-lg font-heading font-bold text-white mb-6 tracking-wide flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-400" /> Logo Aplikasi (SMART PPI)
        </h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
          <div className="w-32 h-32 rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center bg-white/5 overflow-hidden shrink-0 shadow-inner group hover:border-blue-500/30 transition-all">
            {appLogoUrl ? (
              <img src={appLogoUrl} alt="Logo" className="w-full h-full object-contain p-4" />
            ) : (
              <ShieldCheck className="w-12 h-12 text-slate-600 group-hover:text-blue-400 transition-colors" />
            )}
          </div>
          <div className="space-y-4">
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Ubah logo aplikasi utama yang akan ditampilkan di halaman navigasi sidebar dan laporan.
            </p>
            <div className="flex flex-wrap gap-4">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={appLogoRef} 
                onChange={(e) => handleFileChange(e, 'app')} 
              />
              <button 
                onClick={() => appLogoRef.current?.click()} 
                className="px-6 py-3 bg-white/10 text-white border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/20 hover:border-white/20 transition-all flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Pilih Logo
              </button>
              
              {selectedAppFile && (
                <button 
                  onClick={() => handleSave('app')} 
                  disabled={isUploadingApp}
                  className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gradient-to-r from-blue-400 to-purple-500 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isUploadingApp ? 'Menyimpan...' : 'Simpan Logo'}
                </button>
              )}

              {appLogoUrl && !selectedAppFile && (
                <button 
                  onClick={() => setAppLogoUrl(null)} 
                  className="px-6 py-3 bg-red-600/10 text-red-400 border border-red-500/20 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-red-600/20 transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Hapus Logo
                </button>
              )}
            </div>
            
            {appMsg.text && (
              <p className={`text-[11px] font-bold tracking-wide mt-3 whitespace-pre-wrap ${
                appMsg.type === 'error' ? 'text-red-400 bg-red-400/10 p-4 border border-red-400/20 rounded-xl leading-relaxed' : 
                appMsg.type === 'success' ? 'text-green-400' : 
                'text-blue-400'
              }`}>
                {appMsg.text}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* PANEL LOGO RUMAH SAKIT */}
      <div className="glass-card p-8 rounded-[32px] border-white/5">
        <h2 className="text-lg font-heading font-bold text-white mb-6 tracking-wide flex items-center gap-2">
          <Hospital className="w-5 h-5 text-blue-400" /> Logo Rumah Sakit (RSUD AL-MULK)
        </h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
          <div className="w-32 h-32 rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center bg-white/5 overflow-hidden shrink-0 shadow-inner group hover:border-blue-500/30 transition-all">
            {hospitalLogoUrl ? (
              <img src={hospitalLogoUrl} alt="Logo RS" className="w-full h-full object-contain p-4" />
            ) : (
              <Hospital className="w-12 h-12 text-slate-600 group-hover:text-blue-400 transition-colors" />
            )}
          </div>
          <div className="space-y-4">
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Ubah logo Rumah Sakit yang akan ditampilkan dominan pada menu Welcome Screen (Halaman Awal).
            </p>
            <div className="flex flex-wrap gap-4">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={hospitalLogoRef} 
                onChange={(e) => handleFileChange(e, 'hospital')} 
              />
              <button 
                onClick={() => hospitalLogoRef.current?.click()} 
                className="px-6 py-3 bg-white/10 text-white border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/20 hover:border-white/20 transition-all flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Pilih Logo RS
              </button>
              
              {selectedHospitalFile && (
                <button 
                  onClick={() => handleSave('hospital')} 
                  disabled={isUploadingHospital}
                  className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gradient-to-r from-blue-400 to-purple-500 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingHospital ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isUploadingHospital ? 'Menyimpan...' : 'Simpan Logo RS'}
                </button>
              )}

              {hospitalLogoUrl && !selectedHospitalFile && (
                <button 
                  onClick={() => setHospitalLogoUrl(null)} 
                  className="px-6 py-3 bg-red-600/10 text-red-400 border border-red-500/20 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-red-600/20 transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Hapus Logo RS
                </button>
              )}
            </div>
            
            {hospitalMsg.text && (
              <p className={`text-[11px] font-bold tracking-wide mt-3 whitespace-pre-wrap ${
                hospitalMsg.type === 'error' ? 'text-red-400 bg-red-400/10 p-4 border border-red-400/20 rounded-xl leading-relaxed' : 
                hospitalMsg.type === 'success' ? 'text-green-400' : 
                'text-blue-400'
              }`}>
                {hospitalMsg.text}
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
