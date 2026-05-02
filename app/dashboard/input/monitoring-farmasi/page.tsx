'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import { useRouter } from 'next/navigation';
import { 
  Activity,
  ArrowLeft, 
  Save, 
  CheckCircle2,
  Clock,
  User,
  Building2,
  Settings,
  Camera,
  Upload,
  Signature,
  FileText,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Plus,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Trash,
  Droplets,
  Home,
  UserCheck,
  ChevronRight,
  Edit2,
  ClipboardCheck,
  ShieldCheck,
  ShieldAlert,
  Wind,
  Thermometer,
  Zap,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';
import { getSupabase } from '@/lib/supabase';
import { uploadImagesToSupabase } from '@/lib/upload';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import { useAppContext } from '@/components/providers';

const categories = [
  {
    id: 'lingkungan',
    title: 'LINGKUNGAN UMUM',
    icon: Home,
    items: [
      { id: 'a1', label: 'Fasilitas memadai, kebersihan tangan tersedia dan memadai' },
      { id: 'a2', label: 'Kipas angin / AC bersih dan bebas debu' },
      { id: 'a3', label: 'Langit-langit / plafon bebas noda' },
      { id: 'a4', label: 'Mebelair bersih dan bebas debu' },
    ]
  },
  {
    id: 'ruangan_bersih',
    title: 'RUANGAN BERSIH',
    icon: ShieldCheck,
    items: [
      { id: 'b1', label: 'Sebelum dan sesudah bekerja, permukaan harus di bersihkan dengan bahan sesuai dengan pedoman PPI di Rumah Sakit' },
    ]
  },
  {
    id: 'kulkas',
    title: 'KULKAS OBAT',
    icon: Thermometer,
    items: [
      { id: 'c1', label: 'Suhu kulkas obat di jaga dalam suhu 2 – 8 °C' },
      { id: 'c2', label: 'Pemantauan suhu dicatat setiap hari dan jika suhu tidak sesuai standar maka diambil tindakan yang sesuai (suhu lemari penyimpanan berkisar 2 – 8 °C)' },
      { id: 'c3', label: 'Suhu lemari pembeku dijaga dalam kisaran suhu – 18 ° C atau lebih rendah' },
      { id: 'c4', label: 'Pemantauan suhu dicatat setiap hari dan jika suhu tidak sesuai standar maka akan diambil tindakan yang sesuai ( suhu lemari pembeku berkisar antara – 18 °C atau lebih rendah )' },
      { id: 'c5', label: 'Suhu ruang penyimpanan dijaga dalam kisaran 25 °C atau lebih rendah' },
      { id: 'c6', label: 'Pemantauan suhu tercatat tiap bulannya dan jika suhu tidak sesuai standar maka di ambil tindakan yang sesuai' },
    ]
  },
  {
    id: 'penyimpanan',
    title: 'PENYIMPANAN OBAT',
    icon: Building2,
    items: [
      { id: 'd1', label: 'Suhu penyimpanan dijaga dalam kisaran 25 °C atau lebih rendah' },
    ]
  },
  {
    id: 'limbah',
    title: 'LIMBAH UMUM',
    icon: Trash,
    items: [
      { id: 'e1', label: 'Limbah medis umum dibuang ke dalam plastik hitam' },
      { id: 'e2', label: 'Limbah khusus ditandai dengan jelas, misal : biohazard, radioaktif, kemoterapi' },
      { id: 'e3', label: 'Pastikan tidak ada kantung limbah yang terlampau penuh' },
    ]
  },
  {
    id: 'tajam',
    title: 'PENANGANAN BENDA TAJAM',
    icon: Zap,
    items: [
      { id: 'f1', label: 'Tempat sampah bebas dari benda tajam yang terjulur' },
      { id: 'f2', label: 'Semua tempat sampah tersusun dengan benar' },
      { id: 'f3', label: 'Seluruh tempat sampah benda tajam adalah safety box yang terstandar WHO' },
      { id: 'f4', label: 'Jarum tidak dibengkokkan, dipotong atau digunakan kembali' },
      { id: 'f5', label: 'Jarum / benda tajam langsung dibuang ke tempat sampah benda tajam setelah selesai digunakan' },
      { id: 'f6', label: 'Jarum bebas pakai tidak boleh digunakan lagi' },
    ]
  },
  {
    id: 'cuci_tangan',
    title: 'FASILITAS CUCI TANGAN',
    icon: Droplets,
    items: [
      { id: 'g1', label: 'Tersedia fasilitas yang memadai untuk cuci tangan' },
      { id: 'g2', label: 'Wastafel cuci tangan bebas dari alat – alat yang telah dipakai dan benda – benda yang tidak sesuai' },
      { id: 'g3', label: 'Poster cara dan 5 saat kebersihan tangan berada di dekat alkohol hand rub atau wastafel' },
      { id: 'g4', label: 'Tersedia handrub, botol berfungsi baik, ada tanggal saat botol dibuka dan tanggal expired' },
    ]
  },
  {
    id: 'petunjuk',
    title: 'PETUNJUK UMUM',
    icon: BookOpen,
    items: [
      { id: 'h1', label: 'Kuku dipotong pendek, bersih, dan bebas dari cat kuku' },
      { id: 'h2', label: 'Poster promosi kebersihan tangan tersedia dan terpajang di area yang terlihat oleh staf' },
    ]
  }
];

type AuditStatus = 'ya' | 'tidak' | 'na' | null;

interface ItemData {
  status: AuditStatus;
  keterangan: string;
}

interface Observer {
  id: string;
  nama: string;
}

export default function FarmasiAuditPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState('');
  
  const [data, setData] = useState<Record<string, ItemData>>({});
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');

  // Accordion state
  const [openCategory, setOpenCategory] = useState<string | null>('lingkungan');

  // Dokumentasi
  const [images, setImages] = useState<DocImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Observer Management
  const [observers, setObservers] = useState<Observer[]>([]);
  const [isObserverModalOpen, setIsObserverModalOpen] = useState(false);
  const [newObserverName, setNewObserverName] = useState('');
  const [editObserverId, setEditObserverId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isObserverListOpen, setIsObserverListOpen] = useState(false);
  
  // Signatures
  const sigPadPJ = useRef<SignatureCanvas | null>(null);
  const sigPadIPCN = useRef<SignatureCanvas | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchObservers();
    // Initialize data
    const initialData: Record<string, ItemData> = {};
    categories.forEach(cat => {
      cat.items.forEach(item => {
        initialData[item.id] = { status: null, keterangan: '' };
      });
    });
    
    requestAnimationFrame(() => {
      setStartTime(new Date());
      setData(initialData);
    });
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
    setData(prev => ({ ...prev, [id]: { ...prev[id], status: stat } }));
  };

  const handleCategoryClick = (catId: string) => {
    if (openCategory === catId) {
      setOpenCategory(null);
    } else {
      setOpenCategory(catId);
      setTimeout(() => {
        const el = document.getElementById(`category-${catId}`);
        if (el) {
          const yOffset = -80; // Offset for sticky header
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 300); // give time for the accordion to smoothly open
    }
  };

  const stats = useMemo(() => {
    let patuh = 0;
    let tidakPatuh = 0;
    let dinilai = 0;
    
    Object.values(data).forEach(d => {
      if (d.status === 'ya') {
        patuh++;
        dinilai++;
      } else if (d.status === 'tidak') {
        tidakPatuh++;
        dinilai++;
      }
    });

    const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;
    let status = 'Belum Dinilai';
    let color = 'text-slate-400';
    let bg = 'bg-slate-500/10';
    let strokeColor = 'rgba(148,163,184,1)';
    if (dinilai > 0) {
      if (persentase >= 85) { status = 'Baik'; color = 'text-emerald-400'; bg = 'bg-emerald-500/10'; strokeColor = '#34d399'; }
      else if (persentase >= 70) { status = 'Cukup'; color = 'text-amber-400'; bg = 'bg-amber-500/10'; strokeColor = '#fbbf24'; }
      else { status = 'Perlu Tindak Lanjut'; color = 'text-red-400'; bg = 'bg-red-500/10'; strokeColor = '#f87171'; }
    }

    return { patuh, tidakPatuh, dinilai, persentase, status, color, bg, strokeColor };
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observer) {
      alert('Harap pilih Supervisor.');
      return;
    }

    const totalItems = Object.keys(data).length;
    const answeredItems = Object.values(data).filter(d => d.status !== null).length;
    
    if (answeredItems < totalItems) {
      alert(`Harap isi semua item checklist audit (${answeredItems}/${totalItems}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabase();
      const ttd_pj = sigPadPJ.current?.getCanvas().toDataURL('image/png') || null;
      const ttd_ipcn = sigPadIPCN.current?.getCanvas().toDataURL('image/png') || null;

      const uploadedUrls = await uploadImagesToSupabase(supabase, images, 'dokumentasi', 'audit-farmasi');
      const payload = {
        waktu: startTime?.toISOString() || new Date().toISOString(),
        supervisor: observers.find(o => o.id === observer)?.nama || observer,
        checklist_json: data,
        persentase: stats.persentase,
        temuan,
        rekomendasi,
        ttd_pj,
        ttd_ipcn,
        foto: uploadedUrls,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('audit_farmasi').insert([payload]);
      if (error) { console.error('Observer DB Error:', error); throw error; }

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push('/dashboard/input/isolasi');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLocalIsoString = (val: Date | null) => {
    if (!val) return '';
    const tzoffset = val.getTimezoneOffset() * 60000;
    return new Date(val.getTime() - tzoffset).toISOString().slice(0, 16);
  };

  const filteredObservers = observers.filter(o => o.nama.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-24 px-4 sm:px-6 relative mt-4">
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-white/20 glow-blue shadow-blue-500/20"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Data audit Farmasi berhasil disimpan</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={() => router.back()}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-heading font-bold text-gradient drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">Input Audit Farmasi</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Audit kepatuhan PPI ruang Farmasi.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: WAKTU & SUPERVISOR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 space-y-6">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-400" /> Waktu Input
            </label>
            <input 
              type="datetime-local"
              value={getLocalIsoString(startTime)}
              onChange={(e) => setStartTime(new Date(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
            />
          </div>

          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 space-y-6 relative overflow-visible">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-blue-400" /> Supervisor
              </label>
              <button 
                type="button"
                onClick={() => setIsObserverModalOpen(true)}
                className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl text-blue-400 transition-all"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsObserverListOpen(!isObserverListOpen)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500/50 flex justify-between items-center group transition-all"
              >
                <span className={observer ? "text-white" : "text-slate-500"}>
                  {observer ? observers.find(o => o.id === observer)?.nama : "Pilih Supervisor..."}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-all ${isObserverListOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isObserverListOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
                  >
                    <div className="p-3 border-b border-white/5">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input 
                          autoFocus
                          type="text" 
                          placeholder="Cari supervisor..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-blue-500/50"
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {filteredObservers.map(o => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => { setObserver(o.id); setIsObserverListOpen(false); }}
                          className="w-full px-5 py-3.5 text-left text-xs text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 border-b border-white/5 last:border-0 transition-colors"
                        >
                          {o.nama}
                        </button>
                      ))}
                      {filteredObservers.length === 0 && (
                        <div className="px-5 py-8 text-center text-slate-500 text-xs italic">
                          Supervisor tidak ditemukan
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* SECTION 3: CHECKLIST AUDIT FARMASI */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-blue-400" /> Checklist Audit
            </h2>
            <div className="text-[10px] font-bold text-slate-600 bg-white/5 px-4 py-1.5 rounded-full border border-white/5 uppercase tracking-widest">
              {Object.values(data).filter(d => d.status !== null).length} / {Object.keys(data).length} Item Dinilai
            </div>
          </div>

          <div className="space-y-4">
            {categories.map((cat, idx) => (
              <div key={cat.id} id={`category-${cat.id}`} className="glass-card rounded-[2rem] border-white/5 overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleCategoryClick(cat.id)}
                  className="w-full flex items-center justify-between p-6 sm:p-7 hover:bg-white/2 transition-colors group"
                >
                  <div className="flex items-center gap-5">
                    <div className={`p-3.5 rounded-2xl bg-gradient-to-br transition-all duration-500 ${openCategory === cat.id ? 'from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20 scale-110' : 'from-white/5 to-white/[0.02] grayscale opacity-50'}`}>
                      <cat.icon className={`w-5 h-5 ${openCategory === cat.id ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <div className="text-left">
                      <span className={`block text-xs font-black tracking-widest uppercase transition-all ${openCategory === cat.id ? 'text-white' : 'text-slate-500'}`}>{cat.title}</span>
                      <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1 block font-mono">
                        {cat.items.filter(i => data[i.id]?.status !== null).length} / {cat.items.length} Selesai
                      </span>
                    </div>
                  </div>
                  <div className={`p-2 rounded-xl transition-all ${openCategory === cat.id ? 'bg-blue-600/10 text-blue-400 rotate-180' : 'bg-white/5 text-slate-600 group-hover:text-slate-400'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {openCategory === cat.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-white/2"
                    >
                      <div className="p-6 pt-2 space-y-4">
                        {cat.items.map((item) => (
                          <motion.div 
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-5 sm:p-6 bg-white/5 border border-white/5 rounded-3xl space-y-5 group hover:border-blue-500/20 transition-all shadow-inner"
                          >
                            <p className="text-xs text-slate-300 font-bold leading-relaxed line-clamp-2 md:line-clamp-none group-hover:text-white transition-colors">{item.label}</p>
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full shrink-0">
                                {[
                                  { value: 'ya' as const, label: 'YA', color: 'bg-emerald-600 shadow-emerald-600/20' },
                                  { value: 'tidak' as const, label: 'TIDAK', color: 'bg-red-600 shadow-red-600/20' },
                                  { value: 'na' as const, label: 'N/A', color: 'bg-slate-600 shadow-slate-600/20' }
                                ].map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => toggleItem(item.id, opt.value)}
                                    className={`flex-1 py-3 px-6 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                                      data[item.id]?.status === opt.value 
                                        ? `${opt.color} text-white shadow-lg scale-105 z-10` 
                                        : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* HASIL PERSENTASE STANDARDIZED */}
        <LiveStatisticsCard 
          totalDinilai={stats.dinilai}
          totalPatuh={stats.patuh}
          totalTidakPatuh={stats.dinilai - stats.patuh}
          persentase={stats.persentase}
          statusText={stats.status}
          title="HASIL AUDIT FARMASI"
        />

        {/* SECTION 5: TEMUAN & SECTION 6: REKOMENDASI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 space-y-6">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Temuan (Optional)
            </label>
            <textarea 
              value={temuan}
              onChange={(e) => setTemuan(e.target.value)}
              placeholder="Contoh: Rak obat berdebu, tempat sampah tajam penuh..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all h-32 resize-none placeholder:text-slate-600 font-medium"
            />
          </div>
          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 space-y-6">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" /> Rekomendasi (Optional)
            </label>
            <textarea 
              value={rekomendasi}
              onChange={(e) => setRekomendasi(e.target.value)}
              placeholder="Contoh: Jadwalkan pembersihan rak, ganti container limbah tajam..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all h-32 resize-none placeholder:text-slate-600 font-medium"
            />
          </div>
        </div>

        {/* SECTION 7: DOKUMENTASI */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 space-y-6 flex flex-col items-center">
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        {/* SECTION 8: TANDA TANGAN DIGITAL */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Signature className="w-3.5 h-3.5 text-blue-400" /> PJ Ruangan Farmasi
              </label>
              <button 
                type="button"
                onClick={() => sigPadPJ.current?.clear()}
                className="text-[9px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="bg-white rounded-[2rem] overflow-hidden h-40 shadow-inner group p-2">
              <SignatureCanvas 
                ref={sigPadPJ as any}
                penColor="#2563eb"
                canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
              />
            </div>
          </div>

          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Signature className="w-3.5 h-3.5 text-blue-400" /> IPCN / IPCLN
              </label>
              <button 
                type="button"
                onClick={() => sigPadIPCN.current?.clear()}
                className="text-[9px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="bg-white rounded-[2rem] overflow-hidden h-40 shadow-inner group p-2">
              <SignatureCanvas 
                ref={sigPadIPCN as any}
                penColor="#2563eb"
                canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 9: SIMPAN DATA */}
        <div className="pt-8">
          <motion.button
            type="submit"
            disabled={isSubmitting}
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(37, 99, 235, 0)",
                "0 0 0 10px rgba(37, 99, 235, 0.2)",
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
            {isSubmitting ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Save className="w-6 h-6 group-hover:scale-125 transition-transform duration-500" />
                <span>Simpan Data</span>
              </>
            )}
          </motion.button>
        </div>
      </form>

      {/* SUPERVISOR MANAGEMENT MODAL */}
      <AnimatePresence>
        {isObserverModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsObserverModalOpen(false); setEditObserverId(null); setNewObserverName(''); }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[#0f172a] w-full max-w-lg rounded-[3rem] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="p-8 sm:p-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-xl font-heading font-bold text-gradient">Master Supervisor</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Kelola daftar supervisor audit</p>
                  </div>
                  <button 
                    onClick={() => { setIsObserverModalOpen(false); setEditObserverId(null); setNewObserverName(''); }}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex gap-3 mb-8">
                  <input 
                    autoFocus
                    type="text"
                    value={newObserverName}
                    onChange={(e) => setNewObserverName(e.target.value)}
                    placeholder="Nama supervisor..."
                    onKeyDown={(e) => e.key === 'Enter' && saveObserver()}
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-medium"
                  />
                  <button 
                    onClick={saveObserver}
                    className="p-4 bg-blue-600 hover:bg-blue-700 rounded-2xl text-white shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    {editObserverId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {observers.map(o => (
                    <div key={o.id} className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-3xl group hover:border-blue-500/30 transition-all">
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors uppercase tracking-widest">{o.nama}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setEditObserverId(o.id); setNewObserverName(o.nama); }}
                          className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => deleteObserver(o.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {observers.length === 0 && (
                    <div className="py-20 text-center text-slate-600">
                      <User className="w-16 h-16 mx-auto opacity-10 mb-4" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Belum ada supervisor</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
