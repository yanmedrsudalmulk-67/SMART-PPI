'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
  Upload,
  Signature,
  Activity,
  Stethoscope,
  Syringe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';
import { getSupabase } from '@/lib/supabase';
import { uploadImagesToSupabase } from '@/lib/upload';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import { useAppContext } from '@/components/providers';

const units = [
  'IGD', 'ICU', 'Ranap Aisyah', 'Ranap Fatimah', 'Ranap Khadijah', 'Ranap Usman', 'Rawat Jalan'
];

const professions = ['Dokter', 'Perawat', 'Bidan'];
const actionTypes = [
  'Injeksi Intramuskular (IM)', 
  'Injeksi Intravena (IV)', 
  'Injeksi Subkutan (SC)', 
  'Injeksi Intradermal (ID)'
];

const checklistItems = [
  { id: 'hh', label: 'Kebersihan tangan' },
  { id: 'apd', label: 'APD sesuai indikasi' },
  { id: 'disposable', label: 'Spuit sekali pakai (disposable) dan steril' },
  { id: 'no_reuse', label: 'Spuit tidak digunakan berulang' },
  { id: 'no_touch_sterile', label: 'Tidak menyentuh bagian steril jarum' },
  { id: 'area_disinfection', label: 'Desinfeksi area penyuntikan' },
  { id: 'antiseptic_standard', label: 'Menggunakan antiseptik sesuai standar' },
  { id: 'no_recapping', label: 'Tidak menutup kembali jarum (no recapping)' },
  { id: 'safety_box', label: 'Jarum langsung dibuang ke safety box' },
  { id: 'no_bending', label: 'Tidak membengkokkan atau mematahkan jarum' },
];

type AuditStatus = 'ya' | 'tidak' | 'na' | null;
type Observer = { id: string; nama: string };

export default function PenyuntikanAmanPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState('');
  const [unit, setUnit] = useState('');
  const [profesi, setProfesi] = useState('');
  const [jenisTindakan, setJenisTindakan] = useState('');
  
  const [data, setData] = useState<Record<string, AuditStatus>>({
    hh: null, apd: null, disposable: null, no_reuse: null, 
    no_touch_sterile: null, area_disinfection: null, 
    antiseptic_standard: null, no_recapping: null, 
    safety_box: null, no_bending: null
  });

  // Dokumentasi
  const [images, setImages] = useState<DocImage[]>([]);

  // Observer Management
  const [observers, setObservers] = useState<Observer[]>([]);
  const [isObserverModalOpen, setIsObserverModalOpen] = useState(false);
  const [newObserverName, setNewObserverName] = useState('');
  const [editObserverId, setEditObserverId] = useState<string | null>(null);
  
  // Signatures
  const sigPadPJ = useRef<SignatureCanvas | null>(null);
  const sigPadIPCN = useRef<SignatureCanvas | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

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

  const toggleItem = (id: string, stat: AuditStatus) => {
    setData(prev => ({ ...prev, [id]: stat }));
  };

  const stats = useMemo(() => {
    let patuh = 0;
    let dinilai = 0;
    Object.values(data).forEach(val => {
      if (val === 'ya') {
        patuh++;
        dinilai++;
      } else if (val === 'tidak') {
        dinilai++;
      }
    });

    const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;
    let color = 'text-slate-400';
    let bg = 'bg-slate-500/10';
    let status = 'Belum Dinilai';

    if (dinilai > 0) {
      if (persentase >= 80) { color = 'text-emerald-400'; bg = 'bg-emerald-500/10'; status = 'Patuh'; }
      else if (persentase >= 60) { color = 'text-amber-400'; bg = 'bg-amber-500/10'; status = 'Perlu Perbaikan'; }
      else { color = 'text-red-400'; bg = 'bg-red-500/10'; status = 'Tidak Patuh'; }
    }

    return { patuh, dinilai, persentase, color, bg, status };
  }, [data]);

  
  
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observer || !unit || !profesi || !jenisTindakan || Object.values(data).some(v => v === null)) {
      alert('Harap lengkapi semua field!');
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabase();
      const ttd_pj = sigPadPJ.current?.getTrimmedCanvas().toDataURL('image/png') || null;
      const ttd_ipcn = sigPadIPCN.current?.getTrimmedCanvas().toDataURL('image/png') || null;

      const uploadedUrls = await uploadImagesToSupabase(supabase, images, 'dokumentasi', 'audit');
      const payload = {
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer,
        unit,
        profesi,
        jenis_tindakan: jenisTindakan,
        data_indikator: data,
        persentase: stats.persentase,
        status_kepatuhan: stats.status,
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn,
        created_at: new Date().toISOString(),
        foto: uploadedUrls
      };

      const { error } = await supabase.from('audit_penyuntikan_aman').insert([payload]);
      if (error) throw error;

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push('/dashboard/input/isolasi');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLocalIsoString = (val: Date | null) => {
    if (!val) return '';
    const tzoffset = val.getTimezoneOffset() * 60000;
    return new Date(val.getTime() - tzoffset).toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-24 px-4 sm:px-6 mt-4">
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-white/20 glow-emerald text-center"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            Data Berhasil Disimpan
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6 relative py-4 z-10 border-b border-white/5 bg-navy-dark/50 backdrop-blur-md rounded-b-[2rem]">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-gradient">Audit Penyuntikan Aman</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-400 mt-1">Audit kepatuhan teknik penyuntikan sesuai standar PPI</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* CARD INPUT UTAMA */}
        <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 shadow-xl space-y-8">
          
          {/* WAKTU OBSERVASI */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 font-heading">
              <Clock className="w-4 h-4 text-blue-400" /> Waktu Audit
            </h2>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold">Waktu Real-time</p>
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

          <div className="grid sm:grid-cols-2 gap-8">
            {/* SUPERVISOR */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <User className="w-3.5 h-3.5 text-blue-400" /> Supervisor
                </h2>
                {(userRole === 'IPCN' || userRole === 'Admin') && (
                  <button type="button" onClick={() => setIsObserverModalOpen(true)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-blue-400 transition-all shadow-sm">
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <select 
                value={observer}
                onChange={(e) => setObserver(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all hover:bg-white/8"
                required
              >
                <option value="" className="bg-navy-dark text-slate-400">Pilih Supervisor...</option>
                {observers.map(o => <option key={o.id} value={o.nama} className="bg-navy-dark">{o.nama}</option>)}
              </select>
            </div>

            {/* UNIT */}
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> Unit Kerja
              </h2>
              <select 
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all hover:bg-white/8"
                required
              >
                <option value="" className="bg-navy-dark text-slate-400">Pilih Unit...</option>
                {units.map(u => <option key={u} value={u} className="bg-navy-dark">{u}</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {/* PROFESI */}
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">
                <Stethoscope className="w-3.5 h-3.5 text-blue-400" /> Profesi
              </h2>
              <select 
                value={profesi}
                onChange={(e) => setProfesi(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all hover:bg-white/8"
                required
              >
                <option value="" className="bg-navy-dark text-slate-400">Pilih Profesi...</option>
                {professions.map(p => <option key={p} value={p} className="bg-navy-dark">{p}</option>)}
              </select>
            </div>

            {/* JENIS TINDAKAN */}
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">
                <Syringe className="w-3.5 h-3.5 text-blue-400" /> Jenis Tindakan
              </h2>
              <select 
                value={jenisTindakan}
                onChange={(e) => setJenisTindakan(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all hover:bg-white/8"
                required
              >
                <option value="" className="bg-navy-dark text-slate-400">Pilih Tindakan...</option>
                {actionTypes.map(t => <option key={t} value={t} className="bg-navy-dark">{t}</option>)}
              </select>
            </div>
          </div>

          {/* SECTION: CEKLIST */}
          <div className="border-t border-white/5 pt-8 space-y-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 font-heading">
              Ceklist Penyuntikan yang Aman
            </h2>
            <div className="space-y-6">
              {checklistItems.map((item) => (
                <div key={item.id} className="space-y-3">
                  <p className="text-sm font-medium text-slate-300 leading-relaxed">{item.label}</p>
                  <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-full shadow-inner">
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id, 'ya')}
                      className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        data[item.id] === 'ya' ? 'bg-blue-600 text-white shadow-lg grow' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Ya
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id, 'tidak')}
                      className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        data[item.id] === 'tidak' ? 'bg-red-600 text-white shadow-lg grow' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Tidak
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id, 'na')}
                      className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        data[item.id] === 'na' ? 'bg-white/10 text-white grow' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      N/A
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR-STYLE ANALYTICS CARD */}
        <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 blur-[80px] rounded-full -z-10 ${stats.bg.replace('/10', '/30')}`} />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-8 w-full text-left">Ringkasan Kepatuhan</h3>
          
          <div className="relative w-40 h-40 flex items-center justify-center mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <motion.circle 
                cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="8" 
                strokeDasharray={2 * Math.PI * 36}
                strokeDashoffset={2 * Math.PI * 36 - (stats.persentase / 100) * (2 * Math.PI * 36)}
                strokeLinecap="round" className={stats.color}
                initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 36 - (stats.persentase / 100) * (2 * Math.PI * 36) }}
                transition={{ duration: 1 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-heading font-bold text-white">{stats.persentase}%</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${stats.color}`}>{stats.status}</span>
            </div>
          </div>
        </div>

        {/* DOKUMENTASI */}
        <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 shadow-xl space-y-6">
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        {/* SIGNATURES */}
        <div className="grid sm:grid-cols-2 gap-8">
          <div className="glass-card p-6 rounded-[2rem] border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Signature className="w-3.5 h-3.5 text-blue-400" /> PJ Ruangan
              </h3>
              <button type="button" onClick={() => sigPadPJ.current?.clear()} className="text-[9px] font-bold text-red-400 uppercase tracking-widest hover:underline">Reset</button>
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden h-40 shadow-inner">
              <SignatureCanvas ref={sigPadPJ} penColor="#3b82f6" canvasProps={{ className: 'w-full h-full' }} />
            </div>
          </div>
          <div className="glass-card p-6 rounded-[2rem] border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Signature className="w-3.5 h-3.5 text-blue-400" /> IPCN / IPCLN
              </h3>
              <button type="button" onClick={() => sigPadIPCN.current?.clear()} className="text-[9px] font-bold text-red-400 uppercase tracking-widest hover:underline">Reset</button>
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden h-40 shadow-inner">
              <SignatureCanvas ref={sigPadIPCN} penColor="#3b82f6" canvasProps={{ className: 'w-full h-full' }} />
            </div>
          </div>
        </div>

        {/* SUBMIT */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !observer || !unit || !profesi || !jenisTindakan || Object.values(data).some(v => v === null)}
            className="w-full flex justify-center items-center gap-4 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-[0_10px_30px_rgba(59,130,246,0.4)] text-white text-base font-bold uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-[1.01] border border-white/10 relative overflow-hidden group disabled:opacity-50"
          >
            {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
              <><Save className="w-5 h-5" /><span>Simpan Data</span></>
            )}
          </button>
        </div>
      </form>

      {/* OBSERVER MODAL */}
      <AnimatePresence>
        {isObserverModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsObserverModalOpen(false)} className="absolute inset-0 bg-navy-dark/80 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-navy-light border border-white/10 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden bg-gradient-to-b from-navy-light to-navy-dark"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-3"><User className="w-5 h-5 text-blue-400" /> Kelola Supervisor</h3>
                <button onClick={() => setIsObserverModalOpen(false)} className="p-2 text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex gap-2 mb-6">
                <input type="text" value={newObserverName} onChange={(e) => setNewObserverName(e.target.value)} placeholder="Nama Supervisor..." className="flex-1 bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
                <button onClick={saveObserver} className="px-5 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-colors shadow-lg">
                  {editObserverId ? <RefreshCw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
              <div className="max-h-[350px] overflow-y-auto space-y-3 custom-scrollbar">
                {observers.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-4 bg-navy-dark/40 border border-white/5 rounded-2xl">
                    <span className="text-sm font-medium text-slate-300">{o.nama}</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setNewObserverName(o.nama); setEditObserverId(o.id); }} className="p-2 text-slate-500 hover:text-blue-400 transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteObserver(o.id)} className="p-2 text-slate-500 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
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
