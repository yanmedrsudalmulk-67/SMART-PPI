'use client';

import { useRef, useState, useEffect } from 'react';
import { useAppContext } from '@/components/providers';
import { Upload, Trash2, ShieldCheck, Save, Loader2, Hospital, CheckCircle2, Edit3, Plus, Image as ImageIcon } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import Image from 'next/image';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  active: boolean;
  sort_order: number;
}

const DEFAULT_SLIDES: Slide[] = [
  {
    id: 'new_1',
    title: 'SMART PPI Terpadu',
    subtitle: 'Pusat Pemantauan dan Pengendalian Infeksi UOBK RSUD AL-MULK. Mencegah lebih baik daripada mengobati.',
    image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1600',
    active: true,
    sort_order: 1
  }
];

function SliderSettings() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  useEffect(() => {
    const loadSlides = async () => {
      const supabase = getSupabase();
      try {
        const { data } = await supabase.from('dashboard_slider').select('*').order('sort_order', { ascending: true });
        if (data && data.length > 0) setSlides(data);
        else {
          const stored = localStorage.getItem('spp_slides');
          if (stored) setSlides(JSON.parse(stored));
          else setSlides(DEFAULT_SLIDES);
        }
      } catch(e) {
          const stored = localStorage.getItem('spp_slides');
          if (stored) setSlides(JSON.parse(stored));
          else setSlides(DEFAULT_SLIDES);
      }
    };
    loadSlides();
  }, []);

  const handleUpdate = (idx: number, field: keyof Slide, value: any) => {
    const newSlides = [...slides];
    newSlides[idx] = { ...newSlides[idx], [field]: value };
    setSlides(newSlides);
  };

  const handleImageChange = async (idx: number, file: File) => {
    if (!file || !file.name) return;
    try {
       setMsg({ text: 'Mengunggah gambar...', type: 'info' });
       const supabase = getSupabase();
       
       // Try to ensure bucket exists
       try { await supabase.storage.createBucket('public', { public: true }); } catch (e) {}

       const ext = file.name.split('.').pop();
       const fileName = `slider/slider_${Date.now()}.${ext}`;
       const { error } = await supabase.storage.from('public').upload(fileName, file, { upsert: true });
       if (error) throw error;

       const { data: publicUrlData } = supabase.storage.from('public').getPublicUrl(fileName);
       handleUpdate(idx, 'image_url', publicUrlData.publicUrl);
       setMsg({ text: 'Gambar berhasil diunggah', type: 'success' });
    } catch(err: any) {
       setMsg({ text: `Gagal mengunggah: ${err.message}`, type: 'error' });
       // Fallback logic for local preview if upload fails
       const reader = new FileReader();
       reader.onload = (e) => {
          if (e.target?.result) handleUpdate(idx, 'image_url', e.target.result as string);
       };
       reader.readAsDataURL(file);
    }
  };

  const removeSlide = (idx: number) => {
    const slideToRemove = slides[idx];
    if (!slideToRemove.id.startsWith('new_')) {
      setDeletedIds(prev => [...prev, slideToRemove.id]);
    }
    setSlides(slides.filter((_, i) => i !== idx));
  };

  const saveSettings = async () => {
     setIsSaving(true);
     setMsg({ text: 'Menyimpan konfigurasi slider...', type: 'info' });
     try {
       const supabase = getSupabase();
       
       // 1. Delete removed slides
       if (deletedIds.length > 0) {
         await supabase.from('dashboard_slider').delete().in('id', deletedIds);
         setDeletedIds([]);
       }

       // 2. Prepare slides for upsert
       const slidesToUpsert = slides.map((s, i) => {
         const { id, ...rest } = s;
         return {
           id: id.startsWith('new_') ? crypto.randomUUID() : id,
           ...rest,
           sort_order: i + 1
         };
       });

       // 3. Upsert current slides
       const { data, error } = await supabase.from('dashboard_slider').upsert(slidesToUpsert);
       if (error) throw error;

       // 4. Update local state with new IDs if they were generated
       const { data: updatedData } = await supabase.from('dashboard_slider').select('*').order('sort_order', { ascending: true });
       if (updatedData) setSlides(updatedData);

       localStorage.setItem('spp_slides', JSON.stringify(slides));
       setMsg({ text: 'Berhasil menyimpan pengaturan slider!', type: 'success' });
     } catch(e: any) {
       console.error("error saving to db", e);
       localStorage.setItem('spp_slides', JSON.stringify(slides));
       setMsg({ text: `Gagal menyimpan ke cloud: ${e.message}. Data disimpan secara lokal.`, type: 'info' });
     }
     setIsSaving(false);
  };

  return (
    <div className="glass-card p-8 rounded-[32px] border-white/5 mt-8">
       <h2 className="text-lg font-heading font-bold text-white mb-6 tracking-wide flex items-center gap-2">
         <ImageIcon className="w-5 h-5 text-blue-400" /> Slider Hero Dashboard
       </h2>
       
       <div className="space-y-4">
         {slides.map((s, idx) => (
           <div key={s.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col md:flex-row gap-4 relative group">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={el => { if (el) fileInputRefs.current[s.id] = el; }}
                onChange={e => { if(e.target.files?.[0]) handleImageChange(idx, e.target.files[0]); }}
              />
              <div className="w-full md:w-40 h-28 bg-black rounded-xl overflow-hidden relative">
                <Image src={s.image_url} alt="Slide Preview" fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                <div onClick={() => fileInputRefs.current[s.id]?.click()} className="absolute flex cursor-pointer inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center backdrop-blur-sm">
                   <div className="text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                     <Edit3 className="w-4 h-4" /> Ubah Gambar
                   </div>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <input 
                   value={s.title} 
                   onChange={e => handleUpdate(idx, 'title', e.target.value)} 
                   className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" 
                   placeholder="Judul Slider" 
                />
                <textarea 
                   value={s.subtitle} 
                   onChange={e => handleUpdate(idx, 'subtitle', e.target.value)} 
                   className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-blue-500 outline-none resize-none h-16" 
                   placeholder="Deskripsi" 
                />
              </div>
              <div className="flex flex-col justify-center gap-2">
                 <button onClick={() => handleUpdate(idx, 'active', !s.active)} className={`p-3 rounded-xl transition-colors ${s.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
                    <CheckCircle2 className="w-5 h-5" />
                 </button>
                 <button onClick={() => removeSlide(idx)} className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/30 transition-colors">
                    <Trash2 className="w-5 h-5" />
                 </button>
              </div>
           </div>
         ))}
         
         <button 
           onClick={() => setSlides([...slides, { id: 'new_'+Date.now(), title: 'Slide Baru', subtitle: 'Deskripsi slide baru...', image_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1600', active: true, sort_order: slides.length+1 }])} 
           className="w-full p-4 border border-dashed border-white/20 rounded-2xl text-slate-400 hover:text-white hover:border-blue-500 transition-all font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2"
         >
            <Plus className="w-5 h-5" /> Tambah Slider
         </button>
       </div>

       <div className="mt-8 flex items-center justify-between">
          <p className={`text-[11px] font-bold tracking-wide ${msg.type === 'error' ? 'text-red-400' : msg.type==='success' ? 'text-green-400' : 'text-blue-400'}`}>
            {msg.text}
          </p>
          <button 
            onClick={saveSettings} 
            disabled={isSaving}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gradient-to-r from-blue-400 to-purple-500 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
       </div>
    </div>
  );
}

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
          <div className="relative w-32 h-32 rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center bg-white/5 overflow-hidden shrink-0 shadow-inner group hover:border-blue-500/30 transition-all">
            {appLogoUrl ? (
              <Image src={appLogoUrl} alt="Logo" fill className="object-contain p-4" unoptimized referrerPolicy="no-referrer" />
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
          <div className="relative w-32 h-32 rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center bg-white/5 overflow-hidden shrink-0 shadow-inner group hover:border-blue-500/30 transition-all">
            {hospitalLogoUrl ? (
              <Image src={hospitalLogoUrl} alt="Logo RS" fill className="object-contain p-4" unoptimized referrerPolicy="no-referrer" />
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

      {/* PANEL SLIDER DASHBOARD */}
      <SliderSettings />

      <div className="glass-card p-8 rounded-[32px] border-white/5 mt-8">
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
