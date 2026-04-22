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
  Wind,
  Thermometer,
  Trash,
  Droplets,
  Home,
  UserCheck,
  ChevronRight,
  Edit2,
  ClipboardCheck,
  ShieldCheck,
  ShieldAlert
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
    id: 'personal',
    title: 'PERSONAL',
    icon: UserCheck,
    items: [
      { id: 'a1', label: 'Personal hygiene baik' },
      { id: 'a2', label: 'Menggunakan pakaian khusus OK' },
      { id: 'a3', label: 'Menggunakan APD yang sesuai' },
      { id: 'a4', label: 'Menggunakan sepatu tertutup yang hanya digunakan di OK' },
      { id: 'a5', label: 'Tidak menggunakan perhiasan/aksesoris tangan' },
      { id: 'a6', label: 'Kuku pendek, bersih, dan tidak berwarna' },
      { id: 'a7', label: 'Cuci tangan bedah dengan benar sebelum prosedur' },
      { id: 'a8', label: 'Pemeriksaan kesehatan berkala' },
      { id: 'a9', label: 'Imunisasi penyakit menular' },
      { id: 'a10', label: 'Penggunaan APD sesuai' },
    ]
  },
  {
    id: 'ruangan',
    title: 'KONDISI RUANGAN',
    icon: Home,
    items: [
      { id: 'b1', label: 'Pintu selalu tertutup' },
      { id: 'b2', label: 'Pertahankan tekanan positif, suhu, dan kelembaban dalam rentang dipersyaratkan' },
      { id: 'b3', label: 'Pembatasan jumlah orang dalam kamar bedah' },
      { id: 'b4', label: 'Pembatasan akses masuk kamar bedah' },
      { id: 'b5', label: 'Ada akses CSSD' },
    ]
  },
  {
    id: 'limbah',
    title: 'PEMBUANGAN LIMBAH',
    icon: Trash,
    items: [
      { id: 'c1', label: 'Tersedia wadah limbah infeksius, non infeksius, dan benda tajam' },
      { id: 'c2', label: 'Ada label di setiap tempat sampah' },
      { id: 'c3', label: 'Tempat sampah infeksius dan non infeksius menggunakan plastik' },
      { id: 'c4', label: 'Tempat limbah benda tajam menggunakan container tahan air & tahan tusuk' },
      { id: 'c5', label: 'Limbah dibuang setelah 3/4 penuh atau 48 jam' },
      { id: 'c6', label: 'Tempat sampah bersih dan tertutup' },
      { id: 'c7', label: 'Pedal injak tempat sampah berfungsi baik' },
      { id: 'c8', label: 'Limbah organ dibuang dalam kantong plastik kuning' },
      { id: 'c9', label: 'Tersedia spillkit untuk tumpahan cairan tubuh' },
    ]
  },
  {
    id: 'hh',
    title: 'FASILITAS KEBERSIHAN TANGAN',
    icon: Droplets,
    items: [
      { id: 'd1', label: 'Tersedia botol handrub dan diberi tanggal pemakaian' },
      { id: 'd2', label: 'Tersedia wastafel cuci tangan' },
      { id: 'd3', label: 'Keran air berfungsi baik' },
      { id: 'd4', label: 'Tersedia sabun cair di wastafel' },
      { id: 'd5', label: 'Tersedia tissue towel di wastafel' },
      { id: 'd6', label: 'Tersedia fasilitas pembuangan sampah di dekat wastafel' },
      { id: 'd7', label: 'Tersedia poster 6 langkah cuci tangan dan 5 momen cuci tangan' },
    ]
  },
  {
    id: 'lingkungan',
    title: 'PEMBERSIHAN LINGKUNGAN',
    icon: Stethoscope,
    items: [
      { id: 'e1', label: 'Pembersihan antar pasien dengan larutan desinfektan' },
      { id: 'e2', label: 'Ada jadwal pembersihan harian dan mingguan' },
      { id: 'e3', label: 'Pembersihan semua alat dalam kamar bedah' },
      { id: 'e4', label: 'Hanya barang yang digunakan berada di kamar bedah' },
      { id: 'e5', label: 'Secara visual bebas debu' },
      { id: 'e6', label: 'Alat dan BHP tidak sejajar lantai' },
      { id: 'e7', label: 'Grill ventilasi tidak tersumbat dan tidak berdebu' },
      { id: 'e8', label: 'Penyimpanan alat habis pakai dirotasi agar tidak menumpuk debu' },
      { id: 'e9', label: 'Bangunan kamar bedah kondisi baik (lantai, dinding, plafon, cat)' },
      { id: 'e10', label: 'Pemeriksaan kualitas udara jika ada perbaikan mayor' },
      { id: 'e11', label: 'Penyimpanan alat steril terpisah dari alat bersih' },
      { id: 'e12', label: 'Alat dan bahan steril masih berlaku' },
      { id: 'e13', label: 'Alat medis disimpan di tempat bersih dan kering' },
    ]
  },
  {
    id: 'suhu',
    title: 'SUHU DAN KELEMBABAN',
    icon: Thermometer,
    items: [
      { id: 'f1', label: 'Kelembaban Ruang Operasi 30–60%' },
      { id: 'f2', label: 'Suhu Ruangan 20ºC – 23ºC' },
    ]
  },
  {
    id: 'ventilasi',
    title: 'VENTILASI',
    icon: Wind,
    items: [
      { id: 'g1', label: 'Pertukaran udara kamar operasi minimal 15x/jam' },
      { id: 'g2', label: 'Kamar Operasi bertekanan positif' },
      { id: 'g3', label: 'Pintu kamar operasi selalu tertutup' },
    ]
  },
];

type AuditStatus = 'ya' | 'tidak' | 'na' | null;
type ItemData = { status: AuditStatus; keterangan: string };
type Observer = { id: string; nama: string };

export default function IBSAuditPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState('');
  
  const [data, setData] = useState<Record<string, ItemData>>({});
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');

  // Accordion state
  const [openCategory, setOpenCategory] = useState<string | null>('personal');

  // Dokumentasi
  const [images, setImages] = useState<DocImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    }
  };

  const deleteObserver = async (id: string) => {
    if (!confirm('Hapus supervisor ini?')) return;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('master_observers').delete().eq('id', id);
      if (error) throw error;
      setObservers(prev => prev.filter(o => o.id !== id));
      if (observer === id) setObserver('');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleItem = (id: string, stat: AuditStatus) => {
    setData(prev => ({ ...prev, [id]: { ...prev[id], status: stat } }));
  };

  const setKeterangan = (id: string, ket: string) => {
    setData(prev => ({ ...prev, [id]: { ...prev[id], keterangan: ket } }));
  };

  const stats = useMemo(() => {
    let patuh = 0;
    let tidakPatuh = 0;
    let dinilai = 0;
    Object.values(data).forEach(val => {
      if (val.status === 'ya') {
        patuh++;
        dinilai++;
      } else if (val.status === 'tidak') {
        tidakPatuh++;
        dinilai++;
      }
    });

    const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;
    let color = 'text-slate-400';
    let strokeColor = 'rgba(148, 163, 184, 1)';
    let status = 'Belum Dinilai';
    
    if (dinilai > 0) {
      if (persentase >= 85) { color = 'text-blue-400'; strokeColor = '#3b82f6'; status = 'Baik'; }
      else if (persentase >= 70) { color = 'text-amber-400'; strokeColor = '#f59e0b'; status = 'Cukup'; }
      else { color = 'text-red-400'; strokeColor = '#f87171'; status = 'Perlu Tindak Lanjut'; }
    }

    return { patuh, tidakPatuh, dinilai, persentase, color, strokeColor, status };
  }, [data]);

  
  
  
  const toggleCategory = (id: string) => {
    setOpenCategory(prev => {
      const isOpening = prev !== id;
      if (isOpening) {
        setTimeout(() => {
          const el = document.getElementById(`category-${id}`);
          if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 300);
      }
      return isOpening ? id : null;
    });
  };

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
      const ttd_pj = sigPadPJ.current?.getTrimmedCanvas().toDataURL('image/png') || null;
      const ttd_ipcn = sigPadIPCN.current?.getTrimmedCanvas().toDataURL('image/png') || null;

      const uploadedUrls = await uploadImagesToSupabase(supabase, images, 'dokumentasi', 'audit');
      const payload = {
        waktu: startTime?.toISOString() || new Date().toISOString(),
        supervisor: observer,
        data_audit: data,
        persentase: stats.persentase,
        status_audit: stats.status,
        dinilai: stats.dinilai,
        patuh: stats.patuh,
        tidak_patuh: stats.tidakPatuh,
        temuan,
        rekomendasi,
        ttd_pj,
        ttd_ipcn,
        kategori: 'ibs',
        dokumentasi: uploadedUrls
      };

      const { error } = await supabase.from('audit_ruangan_ibs').insert([payload]);
      if (error && error.code !== '42P01') throw error;

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
            Data Audit IBS Berhasil Disimpan
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4 relative py-4 z-10 border-b border-white/5 bg-navy-dark/50 backdrop-blur-md rounded-b-[2rem]">
        <Link href="/dashboard/input/isolasi" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all shadow-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-gradient">Audit Instalasi Bedah Sentral (IBS)</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-400 mt-1">Audit kepatuhan PPI ruang operasi, personel, lingkungan, limbah, ventilasi, suhu dan fasilitas sesuai standar rumah sakit.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* IDENTITAS */}
        <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 shadow-xl space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Waktu Audit
              </label>
              <input 
                type="datetime-local" 
                value={getLocalIsoString(startTime)}
                onChange={(e) => setStartTime(new Date(e.target.value))}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-mono shadow-inner accent-blue-600"
              />
            </div>

            <div className="space-y-3">
              <label className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <span className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-blue-400" /> Supervisor / Auditor</span>
                {userRole === 'admin' && (
                  <button 
                    type="button" 
                    onClick={() => setIsObserverModalOpen(true)}
                    className="text-[9px] text-blue-400 hover:text-blue-300 underline"
                  >
                    Kelola
                  </button>
                )}
              </label>
              <div className="relative group">
                <select 
                  value={observer}
                  onChange={(e) => setObserver(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer pr-10"
                >
                  <option value="" className="bg-slate-900">Pilih Supervisor</option>
                  {observers.map(o => (
                    <option key={o.id} value={o.id} className="bg-slate-900">{o.nama}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CHECKLIST SECTIONS (ACCORDION) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
           <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
             <ClipboardCheck className="w-4 h-4 text-blue-400" /> Checklist Audit Ruangan IBS
           </h3>
          </div>

          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.id} id={`category-${cat.id}`} className="glass-card rounded-[2rem] border-white/5 overflow-hidden border">
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`w-full flex items-center justify-between p-6 sm:p-7 transition-all ${openCategory === cat.id ? 'bg-blue-600/10' : 'hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${openCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-white/5 text-blue-400'} shadow-lg transition-colors`}>
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-black uppercase tracking-[0.1em] text-white leading-tight">{cat.title}</h4>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total {cat.items.length} items</p>
                    </div>
                  </div>
                  {openCategory === cat.id ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                </button>

                <AnimatePresence>
                  {openCategory === cat.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-white/2"
                    >
                      <div className="p-6 sm:p-8 space-y-6">
                        {cat.items.map((item, idx) => (
                          <div key={item.id} className="space-y-4 pb-6 border-b border-white/5 last:border-b-0 last:pb-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                              <div className="flex items-start gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-black text-xs">
                                  {idx + 1}
                                </span>
                                <p className="text-sm font-semibold text-slate-200 leading-relaxed pt-1">
                                  {item.label}
                                </p>
                              </div>
                              <div className="flex w-full sm:w-auto p-1 bg-slate-900/50 rounded-2xl border border-white/5">
                                {(['ya', 'tidak', 'na'] as const).map((stat) => (
                                  <button
                                    key={stat}
                                    type="button"
                                    onClick={() => toggleItem(item.id, stat)}
                                    className={`flex-1 sm:flex-none px-4 sm:px-5 py-3 sm:py-2.5 rounded-xl text-[10px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                                      data[item.id]?.status === stat
                                        ? stat === 'ya' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/30' :
                                          stat === 'tidak' ? 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30' :
                                          'bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-lg'
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                    }`}
                                  >
                                    {stat}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <input 
                              type="text"
                              value={data[item.id]?.keterangan || ''}
                              onChange={(e) => setKeterangan(item.id, e.target.value)}
                              placeholder="Keterangan singkat..."
                              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-[11px] text-white outline-none focus:border-blue-500/30 transition-all font-medium placeholder:text-slate-600"
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* PROGRESS CIRCLE & STATS */}
        <div className="z-10 mt-4">
          <motion.div 
            layout
            className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="relative w-40 h-40 flex items-center justify-center shrink-0 z-10">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <motion.circle 
                  cx="40" cy="40" r="36" fill="transparent" stroke={stats.strokeColor} strokeWidth="8" 
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={2 * Math.PI * 36 - (stats.persentase / 100) * (2 * Math.PI * 36)}
                  strokeLinecap="round" className="drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 36 - (stats.persentase / 100) * (2 * Math.PI * 36) }}
                  transition={{ duration: 1 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-heading font-bold text-white">{stats.persentase}%</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4 w-full relative z-10">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Jml Penilaian</p>
                <p className="text-2xl font-bold text-white font-mono">{stats.dinilai}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Jml Patuh</p>
                <p className="text-2xl font-bold text-white font-mono">{stats.patuh}</p>
              </div>
              <div className="col-span-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Status Audit</p>
                <p className={`text-xl font-black uppercase tracking-tight ${stats.color}`}>{stats.status}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* TEMUAN & REKOMENDASI */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-blue-400" /> Temuan
            </label>
            <textarea 
              value={temuan}
              onChange={(e) => setTemuan(e.target.value)}
              placeholder="Tuliskan temuan audit..."
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all min-h-[140px] resize-none shadow-inner opacity-80 font-medium"
            />
          </div>
          <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Rekomendasi PPI
            </label>
            <textarea 
              value={rekomendasi}
              onChange={(e) => setRekomendasi(e.target.value)}
              placeholder="Tuliskan rekomendasi tindak lanjut..."
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all min-h-[140px] resize-none shadow-inner opacity-80 font-medium"
            />
          </div>
        </div>

        {/* DOKUMENTASI */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 space-y-6 flex flex-col items-center">
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        {/* TANDA TANGAN */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 space-y-6">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Signature className="w-3.5 h-3.5 text-blue-400" /> PJ Ruangan IBS
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

        {/* SUBMIT BUTTON */}
        <div className="pt-6 pb-20">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full py-6 rounded-[2.5rem] bg-gradient-to-r from-blue-600 to-blue-800 text-white font-heading font-black text-sm uppercase tracking-[0.4em] shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-5 group disabled:opacity-50 border border-white/10 glow-blue relative overflow-hidden transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
            {isSubmitting ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" />
                Sistem Memproses Data...
              </>
            ) : (
              <>
                <div className="p-2 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                    <Save className="w-6 h-6" />
                </div>
                Simpan Data
              </>
            )}
          </motion.button>
          
          <div className="flex items-center justify-center gap-4 mt-6 opacity-30">
            <div className="h-px w-8 bg-slate-500" />
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Security Standard Audit PPI</span>
            <ShieldAlert className="w-4 h-4 text-slate-500" />
            <div className="h-px w-8 bg-slate-500" />
          </div>
        </div>

      </form>

      {/* OBSERVER MANAGEMENT MODAL */}
      <AnimatePresence>
        {isObserverModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsObserverModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-navy-dark border border-white/10 rounded-[3rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
                  <div className="p-2 bg-blue-500/10 rounded-xl">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  Kelola Supervisor
                </h3>
                <button onClick={() => setIsObserverModalOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-8 bg-white/2 p-5 rounded-[2rem] border border-white/5 shadow-inner">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newObserverName}
                    onChange={(e) => setNewObserverName(e.target.value)}
                    placeholder="Nama Supervisor Baru..."
                    className="flex-1 bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white font-medium outline-none focus:border-blue-500/50 shadow-inner"
                  />
                  <button 
                    onClick={saveObserver}
                    className="px-5 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all shadow-lg active:scale-95 flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-3 custom-scrollbar px-1">
                {observers.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-4 bg-white/2 rounded-[1.5rem] border border-white/5 transition-all hover:bg-white/5 hover:border-blue-500/20 group">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/5 flex items-center justify-center text-[10px] font-black text-blue-400/50 group-hover:bg-blue-500 group-hover:text-white transition-colors capitalize">
                            {o.nama.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{o.nama}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditObserverId(o.id);
                          setNewObserverName(o.nama);
                        }}
                        className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => deleteObserver(o.id)}
                        className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .text-gradient {
          background: linear-gradient(135deg, #fff 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .glass-card {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .glow-blue {
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.15);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  );
}
