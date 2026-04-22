'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle2,
  Clock,
  User,
  Building2,
  Settings,
  FileText,
  Plus,
  Trash2,
  Edit2,
  X,
  RefreshCw,
  Camera,
  Signature
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';
import { getSupabase } from '@/lib/supabase';
import { uploadImagesToSupabase } from '@/lib/upload';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import { useAppContext } from '@/components/providers';

const units = [
  'IGD', 'ICU', 'Ranap Aisyah', 'Ranap Fatimah', 'Ranap Khadijah', 'Ranap Usman'
];

const checklistItems = [
  { id: 'catatan_infeksi', label: '1. Ada catatan pasien infeksi dan non infeksi' },
  { id: 'instruksi_ruang', label: '2. Instruksi jelas untuk petugas dan pengunjung di ruang infeksi (tanda)' },
  { id: 'poster_pencegahan', label: '3. Poster petunjuk pencegahan penularan penyakit (kontak, droplet, airborne)' },
  { id: 'apd_tersedia', label: '4. Alat proteksi diri tersedia lengkap saat memasuki ruang isolasi' },
  { id: 'catatan_klinis', label: '5. Ada catatan kasus/bagan klinis di ruangan isolasi' },
  { id: 'instruksi_isolasi', label: '6. Instruksi jelas untuk petugas dan pengunjung saat pasien di isolasi (contoh: tanda di pintu)' },
  { id: 'pintu_tertutup', label: '7. Pintu selalu ditutup' },
  { id: 'alur_pasien', label: '8. Alur pasien masuk terpasang jelas' },
];

type AuditStatus = 'ya' | 'tidak' | 'na' | null;
type Observer = { id: string; nama: string };

export default function PenempatanPasienPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState('');
  const [unit, setUnit] = useState('');
  
  // Checklist State
  const [data, setData] = useState<Record<string, AuditStatus>>({
    catatan_infeksi: null,
    instruksi_ruang: null,
    poster_pencegahan: null,
    apd_tersedia: null,
    catatan_klinis: null,
    instruksi_isolasi: null,
    pintu_tertutup: null,
    alur_pasien: null,
  });

  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  
  // Documentation
  const [images, setImages] = useState<DocImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Signatures
  const sigPadPJ = useRef<SignatureCanvas | null>(null);
  const sigPadIPCN = useRef<SignatureCanvas | null>(null);
  
  // Observer Management
  const [observers, setObservers] = useState<Observer[]>([]);
  const [isObserverModalOpen, setIsObserverModalOpen] = useState(false);
  const [newObserverName, setNewObserverName] = useState('');
  const [editObserverId, setEditObserverId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const getLocalIsoString = (val: Date | null) => {
    if (!val) return '';
    const tzoffset = val.getTimezoneOffset() * 60000;
    return new Date(val.getTime() - tzoffset).toISOString().slice(0, 16);
  };
  
  useEffect(() => {
    requestAnimationFrame(() => {
      setStartTime(new Date());
    });
    fetchObservers();
  }, []);

  const fetchObservers = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('master_observers').select('*').order('nama');
      if (error) throw error;
      if (data) setObservers(data);
    } catch (err) {
      setObservers([{ id: '1', nama: 'IPCN_Adi Tresa Purnama' }]);
    }
  };

  const saveObserver = async () => {
    if (!newObserverName.trim()) return;
    try {
      const supabase = getSupabase();
      if (editObserverId) {
        const { error } = await supabase.from('master_observers').update({ nama: newObserverName }).eq('id', editObserverId);
        if (error) throw error;
        setObservers(prev => prev.map(o => o.id === editObserverId ? { ...o, nama: newObserverName } : o));
      } else {
        const { data, error } = await supabase.from('master_observers').insert([{ nama: newObserverName }]).select();
        if (error) throw error;
        if (data && data.length > 0) {
          setObservers(prev => [...prev, data[0]].sort((a,b) => a.nama.localeCompare(b.nama)));
        }
      }
      setNewObserverName('');
      setEditObserverId(null);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan observer.');
    }
  };

  const deleteObserver = async (id: string) => {
    if (!confirm('Hapus observer ini?')) return;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('master_observers').delete().eq('id', id);
      if (error) throw error;
      setObservers(prev => prev.filter(o => o.id !== id));
      if (observer === id) setObserver('');
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus observer.');
    }
  };

  const toggleItem = (itemId: string, status: AuditStatus) => {
    setData(prev => ({ ...prev, [itemId]: status }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi
    const allChecked = Object.values(data).every(v => v !== null);
    if (!observer || !unit || !allChecked) {
      alert("Mohon lengkapi semua field wajib.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const supabase = getSupabase();

      // Signature data URLs
      const ttd_pj = sigPadPJ.current?.getTrimmedCanvas().toDataURL('image/png') || null;
      const ttd_ipcn = sigPadIPCN.current?.getTrimmedCanvas().toDataURL('image/png') || null;

      const uploadedUrls = await uploadImagesToSupabase(supabase, images, 'dokumentasi', 'audit');
      const payload = {
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer,
        unit,
        ceklist: data,
        temuan,
        rekomendasi,
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn,
        created_at: new Date().toISOString(),
        foto: uploadedUrls
      };

      const { error } = await supabase
        .from('audit_penempatan_pasien')
        .insert([payload]);

      if (error) throw error;

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push('/dashboard/input/isolasi');
      }, 2000);
    } catch (err: any) {
      console.error("Gagal menyimpan:", err);
      alert(`Gagal menyimpan data: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-24 px-4 sm:px-6">
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-white/20 glow-blue text-center"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            Data Berhasil Disimpan
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-6 relative py-4 z-10 border-b border-white/5 bg-navy-dark/50 backdrop-blur-md rounded-b-[2rem]">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-gradient">Audit Penempatan Pasien</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-400 mt-1">Audit Kepatuhan Isolasi Standar</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* CARD INPUT UMUM */}
        <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 shadow-xl space-y-8">
          
          {/* WAKTU AUDIT */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 font-heading">
              <Clock className="w-4 h-4 text-blue-400" /> Waktu Audit
            </h2>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Waktu Real-time</p>
                <p className="text-base font-bold text-white font-heading tracking-wide">
                  {startTime ? `${startTime.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')} – ${startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : '-'}
                </p>
              </div>
              <input 
                type="datetime-local" 
                value={getLocalIsoString(startTime)}
                onChange={(e) => setStartTime(new Date(e.target.value))}
                className="bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-blue-400 outline-none focus:border-blue-500/50 transition-all font-mono shadow-inner accent-blue-600"
              />
            </div>
          </div>

          {/* SUPERVISOR & UNIT */}
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <User className="w-3.5 h-3.5 text-blue-400" /> Supervisor
                </h2>
                {(userRole === 'IPCN' || userRole === 'Admin') && (
                  <button 
                    type="button" 
                    onClick={() => setIsObserverModalOpen(true)}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-blue-400 transition-all shadow-sm"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="relative group">
                <select 
                  value={observer}
                  onChange={(e) => setObserver(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all pr-10 hover:bg-white/8"
                  required
                >
                  <option value="" className="bg-navy-dark text-slate-400">Pilih Supervisor...</option>
                  {observers.map(o => <option key={o.id} value={o.nama} className="bg-navy-dark">{o.nama}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> Unit Kerja
              </h2>
              <div className="relative group">
                <select 
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all pr-10 hover:bg-white/8"
                  required
                >
                  <option value="" className="bg-navy-dark text-slate-400">Pilih Unit...</option>
                  {units.map(u => <option key={u} value={u} className="bg-navy-dark">{u}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform">
                  <Building2 className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: CHECKLIST */}
        <div className="space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 mb-2 font-heading px-2">
            Ceklist Penempatan Pasien
          </h2>
          <div className="space-y-4">
            {checklistItems.map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                key={item.id} 
                className="glass-card p-5 rounded-2xl border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group bg-white/[0.01]"
              >
                <p className="text-sm font-medium text-slate-300 leading-relaxed md:max-w-md group-hover:text-white transition-colors">
                  {item.label}
                </p>
                <div className="flex p-1 bg-navy-dark/40 rounded-xl border border-white/10 w-fit shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id, 'ya')}
                    className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      data[item.id] === 'ya' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id, 'tidak')}
                    className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      data[item.id] === 'tidak' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Tidak
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id, 'na')}
                    className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      data[item.id] === 'na' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    N/A
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SECTION: TAMBAHAN */}
        <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 space-y-8">
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <FileText className="w-3.5 h-3.5 text-blue-400" /> Temuan Lapangan
            </h3>
            <textarea 
              value={temuan}
              onChange={(e) => setTemuan(e.target.value)}
              placeholder="Masukkan temuan di lapangan..."
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500/50 min-h-[120px] transition-all placeholder:text-slate-600 shadow-inner"
            />
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <Edit2 className="w-3.5 h-3.5 text-blue-400" /> Rekomendasi
            </h3>
            <textarea 
              value={rekomendasi}
              onChange={(e) => setRekomendasi(e.target.value)}
              placeholder="Masukkan rekomendasi tindak lanjut..."
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500/50 min-h-[120px] transition-all placeholder:text-slate-600 shadow-inner"
            />
          </div>

          <div className="space-y-4">
            <DocumentationUploader images={images} setImages={setImages} />
          </div>
        </div>

        {/* SECTION: TANDA TANGAN */}
        <div className="grid sm:grid-cols-2 gap-8">
          <div className="glass-card p-6 rounded-[2rem] border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Signature className="w-3.5 h-3.5 text-blue-400" /> PJ Ruangan
              </h3>
              <button type="button" onClick={() => sigPadPJ.current?.clear()} className="text-[9px] font-bold text-red-400 uppercase tracking-widest hover:underline">Reset</button>
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden h-40 touch-none shadow-inner">
              <SignatureCanvas 
                ref={sigPadPJ}
                penColor="#3b82f6"
                canvasProps={{ className: 'sigCanvas w-full h-full' }}
              />
            </div>
          </div>

          <div className="glass-card p-6 rounded-[2rem] border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Signature className="w-3.5 h-3.5 text-blue-400" /> IPCN / IPCLN
              </h3>
              <button type="button" onClick={() => sigPadIPCN.current?.clear()} className="text-[9px] font-bold text-red-400 uppercase tracking-widest hover:underline">Reset</button>
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden h-40 touch-none shadow-inner">
              <SignatureCanvas 
                ref={sigPadIPCN}
                penColor="#3b82f6"
                canvasProps={{ className: 'sigCanvas w-full h-full' }}
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-8">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center gap-4 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-[0_10px_30px_rgba(59,130,246,0.4)] hover:shadow-[0_15px_40px_rgba(59,130,246,0.6)] text-white text-base font-bold uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.98] border border-white/10 group disabled:opacity-50 overflow-hidden relative"
          >
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out" />
            {isSubmitting ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Simpan Data Audit</span>
              </>
            )}
          </button>
          <p className="text-center mt-6 text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">SMART-PPI | Hospital Integrity System</p>
        </div>
      </form>

      {/* OBSERVER MODAL */}
      <AnimatePresence>
        {isObserverModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsObserverModalOpen(false)}
              className="absolute inset-0 bg-navy-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-md bg-navy-light border border-white/10 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden bg-gradient-to-b from-navy-light to-navy-dark"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-3 font-heading">
                  <User className="w-5 h-5 text-blue-400" /> Kelola Supervisor
                </h3>
                <button onClick={() => setIsObserverModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={newObserverName}
                  onChange={(e) => setNewObserverName(e.target.value)}
                  placeholder="Nama Supervisor..."
                  className="flex-1 bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 shadow-inner"
                />
                <button 
                  onClick={saveObserver}
                  className="px-5 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                >
                  {editObserverId ? <RefreshCw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>

              <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {observers.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-4 bg-navy-dark/40 border border-white/5 rounded-2xl group hover:border-blue-500/20 transition-all">
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{o.nama}</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setNewObserverName(o.nama); setEditObserverId(o.id); }} className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteObserver(o.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
