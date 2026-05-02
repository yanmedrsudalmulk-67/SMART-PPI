'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
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
  const isIPCN = userRole === 'IPCN' || userRole === 'Admin';
  
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
      
      const hasAdi = data?.some(s => s.nama === 'IPCN_Adi Tresa Purnama');
      let finalData = data || [];
      if (!hasAdi) {
        finalData = [{ nama: 'IPCN_Adi Tresa Purnama' }, ...finalData];
      }
      setObservers(finalData);
      if (finalData.length > 0 && !observer) {
        setObserver(finalData[0].nama);
      }
    } catch (err) {
      setObservers([{ id: '1', nama: 'IPCN_Adi Tresa Purnama' }]);
      setObserver('IPCN_Adi Tresa Purnama');
    }
  };

  const saveObserver = async () => {
    if (!newObserverName.trim()) return;
    try {
      const supabase = getSupabase();
      if (editObserverId) {
        if (!editObserverId.startsWith('local-')) {
          await supabase.from('master_observers').update({ nama: newObserverName }).eq('id', editObserverId);
        }
        setObservers(prev => prev.map(o => o.id === editObserverId ? { ...o, nama: newObserverName } : o).sort((a,b) => a.nama.localeCompare(b.nama)));
      } else {
        const { data, error } = await supabase.from('master_observers').insert([{ nama: newObserverName }]).select();
        if (!error && data && data.length > 0) {
          setObservers(prev => [...prev, data[0]].sort((a,b) => a.nama.localeCompare(b.nama)));
        } else {
          setObservers(prev => [...prev, { id: 'local-' + Date.now().toString(), nama: newObserverName }].sort((a,b) => a.nama.localeCompare(b.nama)));
        }
      }
      setNewObserverName('');
      setEditObserverId(null);
    } catch (err) {
      console.error('Save observer non-fatal fallback:', err);
      // Fallback local update
      if (editObserverId) {
        setObservers(prev => prev.map(o => o.id === editObserverId ? { ...o, nama: newObserverName } : o).sort((a,b) => a.nama.localeCompare(b.nama)));
      } else {
        setObservers(prev => [...prev, { id: 'local-' + Date.now().toString(), nama: newObserverName }].sort((a,b) => a.nama.localeCompare(b.nama)));
      }
      setNewObserverName('');
      setEditObserverId(null);
    }
  };

  const deleteObserver = async (id: string) => {
    if (!confirm('Hapus observer ini?')) return;
    try {
      const supabase = getSupabase();
      if (!id.startsWith('local-')) {
        await supabase.from('master_observers').delete().eq('id', id);
      }
      setObservers(prev => prev.filter(o => o.id !== id));
      if (observer === (observers.find(o => o.id === id)?.nama)) {
        setObserver('');
      }
    } catch (err) {
      console.error('Delete observer fallback:', err);
      setObservers(prev => prev.filter(o => o.id !== id));
      if (observer === (observers.find(o => o.id === id)?.nama)) {
        setObserver('');
      }
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
    let status = 'Belum Dinilai';

    if (dinilai > 0) {
      if (persentase >= 80) status = 'Patuh';
      else if (persentase >= 60) status = 'Perlu Perbaikan';
      else status = 'Tidak Patuh';
    }

    return { patuh, dinilai, persentase, status };
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-inner p-1">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Tanggal & Waktu</label>
                <input 
                  type="datetime-local" 
                  value={getLocalIsoString(startTime)}
                  onChange={(e) => setStartTime(new Date(e.target.value))}
                  className="w-full bg-navy-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none"
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {/* SUPERVISOR */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <User className="w-3.5 h-3.5 text-blue-400" /> Supervisor
                </h2>
                {isIPCN && (
                  <button type="button" onClick={() => setIsObserverModalOpen(true)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-blue-400 transition-all shadow-sm">
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <select 
                value={observer}
                onChange={(e) => setObserver(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all hover:bg-white/8 cursor-pointer"
                required
              >
                <option value="" className="bg-navy-dark text-slate-400">Pilih Supervisor...</option>
                {observers.map(o => <option key={o.id || o.nama} value={o.nama} className="bg-navy-dark">{o.nama}</option>)}
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
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id, 'ya')}
                      className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                        data[item.id] === 'ya' ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                      }`}
                    >
                      Ya
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id, 'tidak')}
                      className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                        data[item.id] === 'tidak' ? 'bg-red-600 text-white shadow-lg grow' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                      }`}
                    >
                      Tidak
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id, 'na')}
                      className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                        data[item.id] === 'na' ? 'bg-white/10 text-white grow' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
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

        <div className="mt-8 mb-8">
          <LiveStatisticsCard 
            totalDinilai={stats.dinilai}
            totalPatuh={stats.patuh}
            totalTidakPatuh={stats.dinilai - stats.patuh}
            persentase={stats.persentase}
            statusText={stats.status}
            title="HASIL OBSERVASI PENYUNTIKAN"
          />
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
          <motion.button
            type="submit"
            disabled={isSubmitting || !observer || !unit || !profesi || !jenisTindakan || Object.values(data).some(v => v === null)}
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
                <input 
                  type="text" 
                  value={newObserverName} 
                  onChange={(e) => setNewObserverName(e.target.value)} 
                  placeholder="Nama Supervisor..." 
                  disabled={!isIPCN}
                  className="flex-1 bg-navy-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 disabled:opacity-50" 
                />
                {isIPCN && (
                  <button onClick={saveObserver} className="px-5 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-colors shadow-lg">
                    {editObserverId ? <RefreshCw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <div className="max-h-[350px] overflow-y-auto space-y-3 custom-scrollbar">
                {observers.map(o => (
                  <div key={o.id || o.nama} className="flex items-center justify-between p-4 bg-navy-dark/40 border border-white/5 rounded-2xl">
                    <span className="text-sm font-medium text-slate-300">{o.nama}</span>
                    {isIPCN && (
                      <div className="flex gap-2">
                        <button onClick={() => { setNewObserverName(o.nama); setEditObserverId(o.id); }} className="p-2 text-slate-500 hover:text-blue-400 transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteObserver(o.id)} className="p-2 text-slate-500 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
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
