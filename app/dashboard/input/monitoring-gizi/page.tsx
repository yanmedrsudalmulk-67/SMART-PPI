'use client';

import React, { useState, useMemo, useRef } from 'react';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Building2, Search, Trash2, Plus, Save, CheckCircle2, ChevronRight, Activity, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import SignaturePad from 'react-signature-canvas';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/components/providers';
import { uploadImagesToSupabase } from '@/lib/upload';

// --- Interfaces ---
interface ChecklistItem {
  id: string;
  section: string;
  subsection?: string;
  label: string;
  value: 'Ya' | 'Tidak' | 'N/A' | null;
}

export default function GiziInputPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  
  // Basic Info State
  const [waktu, setWaktu] = useState(new Date().toISOString().slice(0, 16));
  const ruangan = "Gizi"; // Fixed room
  
  // Supervisor Management State
  const [supervisors, setSupervisors] = useState<string[]>(['IPCN_Adi Tresa Purnama']);
  const [selectedSupervisor, setSelectedSupervisor] = useState('IPCN_Adi Tresa Purnama');
  const [isManagingSupervisors, setIsManagingSupervisors] = useState(false);
  const [newSupervisor, setNewSupervisor] = useState('');

  // Form Data State
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [fotos, setFotos] = useState<DocImage[]>([]);
  const [namaPj, setNamaPj] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{title: string, desc: string, type: 'success' | 'error'} | null>(null);

  // Signatures
  const sigPadPJ = useRef<SignaturePad>(null);
  const sigPadIPCN = useRef<SignaturePad>(null);

  // --- Checklist Data ---
  const initialChecklist: ChecklistItem[] = [
    // A. PENGENDALIAN LINGKUNGAN -> I. Lingkungan Umum
    { id: 'lingkungan_umum_a', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'I. Lingkungan Umum', label: 'Tersedianya ventilasi mekanikal yang cukup', value: null },
    { id: 'lingkungan_umum_b', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'I. Lingkungan Umum', label: 'Sistem ventilasi dipelihara dan dibersihkan', value: null },
    { id: 'lingkungan_umum_c', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'I. Lingkungan Umum', label: 'Permukaan lingkungan meliputi troli, meja dan peralatan terbebas dari cipratan, tanah, substansi tubuh, debu, dan tumpahan', value: null },
    { id: 'lingkungan_umum_d', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'I. Lingkungan Umum', label: 'Kipas angin / Exhaust Fan bersih dan bebas debu', value: null },
    { id: 'lingkungan_umum_e', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'I. Lingkungan Umum', label: 'Langit-langit / papan langit-langit bebas noda', value: null },
    { id: 'lingkungan_umum_f', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'I. Lingkungan Umum', label: 'Cairan pembersih atau bahan kimia tersimpan dalam wadah tertutup di bawah bak cuci', value: null },
    { id: 'lingkungan_umum_g', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'I. Lingkungan Umum', label: 'Lantai bersih dan kering', value: null },
    { id: 'lingkungan_umum_h', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'I. Lingkungan Umum', label: 'Pengecekan kontrol hama dilakukan regular (cek record), tersedia insect killer / pest control', value: null },

    // A. PENGENDALIAN LINGKUNGAN -> II. Fasilitas Kebersihan Tangan
    { id: 'fasilitas_tangan_a', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'II. Fasilitas Kebersihan Tangan', label: 'Tersedia fasilitas memadai untuk kebersihan tangan', value: null },
    { id: 'fasilitas_tangan_b', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'II. Fasilitas Kebersihan Tangan', label: 'Bak cuci tangan bebas dari alat bekas pakai dan benda tidak sesuai', value: null },
    { id: 'fasilitas_tangan_c', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'II. Fasilitas Kebersihan Tangan', label: 'Poster dekontaminasi tangan diletakkan di area mudah terlihat staf', value: null },
    { id: 'fasilitas_tangan_d', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'II. Fasilitas Kebersihan Tangan', label: 'Tersedia sabun cuci tangan', value: null },
    { id: 'fasilitas_tangan_e', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'II. Fasilitas Kebersihan Tangan', label: 'Cek kemampuan melakukan kebersihan tangan pada petugas', value: null },

    // A. PENGENDALIAN LINGKUNGAN -> III. Peralatan
    { id: 'peralatan_a', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'III. Peralatan', label: 'Papan pemotong dalam kondisi baik', value: null },
    { id: 'peralatan_b', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'III. Peralatan', label: 'Kontainer/perkakas bersih, tidak rusak, tidak berkarat, tidak terkelupas', value: null },
    { id: 'peralatan_c', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'III. Peralatan', label: 'Semua peralatan disimpan dalam kondisi baik', value: null },
    { id: 'peralatan_d', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'III. Peralatan', label: 'Jika ada kerusakan dilakukan pelaporan ke penanggung jawab dapur', value: null },
    { id: 'peralatan_e', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'III. Peralatan', label: 'Membersihkan troli makanan / meja setiap selesai penyajian', value: null },
    { id: 'peralatan_f', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'III. Peralatan', label: 'Temperatur mesin cuci piring diatur suhu 50–85°C', value: null },

    // A. PENGENDALIAN LINGKUNGAN -> IV. Penyimpanan Makanan
    { id: 'penyimpanan_makanan_a', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'IV. Penyimpanan Makanan', label: 'Daging mentah, ikan, sayuran mentah tidak kontak dengan makanan siap saji', value: null },
    { id: 'penyimpanan_makanan_b', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'IV. Penyimpanan Makanan', label: 'Pisahkan dan tempatkan makanan dalam wadah tertutup di refrigerator', value: null },
    { id: 'penyimpanan_makanan_c', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'IV. Penyimpanan Makanan', label: 'Makanan beku disimpan suhu di bawah -12°C', value: null },
    { id: 'penyimpanan_makanan_d', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'IV. Penyimpanan Makanan', label: 'Makanan tetap dingin dan segar pada suhu 0–4°C', value: null },
    { id: 'penyimpanan_makanan_e', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'IV. Penyimpanan Makanan', label: 'Makanan dicairkan pada suhu 0–4°C', value: null },
    { id: 'penyimpanan_makanan_f', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'IV. Penyimpanan Makanan', label: 'Ada bukti pencatatan suhu harian dan tindakan bila standar tidak terpenuhi', value: null },
    { id: 'penyimpanan_makanan_g', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'IV. Penyimpanan Makanan', label: 'Perlindungan makanan yang disimpan dari kontaminasi', value: null },
    { id: 'penyimpanan_makanan_h', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'IV. Penyimpanan Makanan', label: 'Pendingin dan freezer bersih dan bebas bau tidak sedap', value: null },

    // A. PENGENDALIAN LINGKUNGAN -> V. Perpindahan Makanan
    { id: 'perpindahan_makanan_a', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'V. Perpindahan Makanan', label: 'Perpindahan makanan dilakukan bersih dan tertutup baik', value: null },
    { id: 'perpindahan_makanan_b', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'V. Perpindahan Makanan', label: 'Gunakan wadah yang tepat (tidak retak, terkelupas, kotor)', value: null },
    { id: 'perpindahan_makanan_c', section: 'A. PENGENDALIAN LINGKUNGAN', subsection: 'V. Perpindahan Makanan', label: 'Staf memakai pakaian bersih dan alat bantu sesuai', value: null },

    // B. PENANGANAN LIMBAH
    { id: 'penanganan_limbah_a', section: 'B. PENANGANAN LIMBAH', subsection: 'Pembuangan Sampah dan Limbah Makanan', label: 'Perpindahan limbah makanan dilakukan bersih dan tertutup', value: null },
    { id: 'penanganan_limbah_b', section: 'B. PENANGANAN LIMBAH', subsection: 'Pembuangan Sampah dan Limbah Makanan', label: 'Sisa makanan tertutup dalam wadah untuk dibuang', value: null },
    { id: 'penanganan_limbah_c', section: 'B. PENANGANAN LIMBAH', subsection: 'Pembuangan Sampah dan Limbah Makanan', label: 'Wadah limbah berkualitas baik, memiliki tutup, dibersihkan berkala', value: null },
    { id: 'penanganan_limbah_d', section: 'B. PENANGANAN LIMBAH', subsection: 'Pembuangan Sampah dan Limbah Makanan', label: 'Area penyimpanan limbah dirancang baik dan dijaga kebersihannya', value: null },

    // C. PRAKTIK PENGENDALIAN INFEKSI
    { id: 'praktik_staf_a', section: 'C. PRAKTIK PENGENDALIAN INFEKSI', subsection: 'Personal / Staf', label: 'Pemeriksaan harian staf untuk memastikan staf sakit tidak menangani makanan', value: null },
    { id: 'praktik_staf_b', section: 'C. PRAKTIK PENGENDALIAN INFEKSI', subsection: 'Personal / Staf', label: 'Semua pengolah makanan mendapat pelatihan kebersihan pribadi dan dapur berkala', value: null },
    { id: 'praktik_staf_c', section: 'C. PRAKTIK PENGENDALIAN INFEKSI', subsection: 'Personal / Staf', label: 'Memakai perhiasan, arloji dan cat kuku saat memasak', value: null },
    { id: 'praktik_staf_d', section: 'C. PRAKTIK PENGENDALIAN INFEKSI', subsection: 'Personal / Staf', label: 'Staf melakukan cuci tangan sebelum mengolah makanan', value: null },
    { id: 'praktik_staf_e', section: 'C. PRAKTIK PENGENDALIAN INFEKSI', subsection: 'Personal / Staf', label: 'Gunakan sarung tangan saat mempersiapkan makanan', value: null },
    { id: 'praktik_staf_f', section: 'C. PRAKTIK PENGENDALIAN INFEKSI', subsection: 'Personal / Staf', label: 'Staf cuci tangan setelah membuka sarung tangan', value: null },
    { id: 'praktik_staf_g', section: 'C. PRAKTIK PENGENDALIAN INFEKSI', subsection: 'Personal / Staf', label: 'Personil divaksinasi setiap 3 tahun sesuai aturan', value: null },
    { id: 'praktik_staf_h', section: 'C. PRAKTIK PENGENDALIAN INFEKSI', subsection: 'Personal / Staf', label: 'Personil dengan sakit kuning, diare, penyakit kulit, dll tidak menangani makanan dan dilaporkan ke supervisor', value: null },
    { id: 'praktik_staf_i', section: 'C. PRAKTIK PENGENDALIAN INFEKSI', subsection: 'Personal / Staf', label: 'Pengolah makanan memakai pelindung, penutup kepala, alas kaki saat tugas catering', value: null },
    { id: 'praktik_staf_j', section: 'C. PRAKTIK PENGENDALIAN INFEKSI', subsection: 'Personal / Staf', label: 'Pakaian personil dijaga bersih dan diganti setiap hari / bila perlu', value: null },
    { id: 'praktik_staf_k', section: 'C. PRAKTIK PENGENDALIAN INFEKSI', subsection: 'Personal / Staf', label: 'Luka terbuka ditutup waterproof dressing', value: null },
    { id: 'praktik_staf_l', section: 'C. PRAKTIK PENGENDALIAN INFEKSI', subsection: 'Personal / Staf', label: 'Saat menyiapkan makanan, tangan tidak menyentuh rambut/wajah/hidung/mulut', value: null },
    { id: 'praktik_staf_m', section: 'C. PRAKTIK PENGENDALIAN INFEKSI', subsection: 'Personal / Staf', label: 'Staf tidak merokok saat menangani makanan / di area makanan', value: null },
    { id: 'praktik_staf_n', section: 'C. PRAKTIK PENGENDALIAN INFEKSI', subsection: 'Personal / Staf', label: 'Pengunjung area makanan memakai penutup kepala dan mematuhi kebersihan', value: null },
  ];

  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);

  // Group checklist by section and subsection for rendering
  const sections = useMemo(() => {
    const map = new Map<string, Map<string, ChecklistItem[]>>();
    for (const item of checklist) {
      if (!map.has(item.section)) {
        map.set(item.section, new Map());
      }
      const sectionMap = map.get(item.section)!;
      const subsection = item.subsection || '';
      if (!sectionMap.has(subsection)) {
        sectionMap.set(subsection, []);
      }
      sectionMap.get(subsection)!.push(item);
    }
    return Array.from(map.entries()).map(([section, subsections]) => ({
      section,
      subsections: Array.from(subsections.entries())
    }));
  }, [checklist]);

  // --- Statistics Calculation (Real-time) ---
  const stats = useMemo(() => {
    let totalDinilai = 0;
    let totalPatuh = 0;
    let totalTidakPatuh = 0;

    checklist.forEach(item => {
      if (item.value === 'Ya') {
        totalDinilai++;
        totalPatuh++;
      } else if (item.value === 'Tidak') {
        totalDinilai++;
        totalTidakPatuh++;
      }
    });

    const persentase = totalDinilai === 0 ? 0 : Math.round((totalPatuh / totalDinilai) * 100);
    
    let statusText = 'Perlu Tindak Lanjut';
    let statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (persentase >= 85) {
      statusText = 'Baik';
      statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    } else if (persentase >= 70) {
      statusText = 'Cukup';
      statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }

    return { totalDinilai, totalPatuh, totalTidakPatuh, persentase, statusText, statusColor };
  }, [checklist]);

  // --- Handlers ---
  const handleAddSupervisor = () => {
    if (newSupervisor.trim() && !supervisors.includes(newSupervisor.trim())) {
      setSupervisors(prev => [...prev, newSupervisor.trim()]);
      setSelectedSupervisor(newSupervisor.trim());
      setNewSupervisor('');
    }
  };

  const handleDeleteSupervisor = (sup: string) => {
    if (supervisors.length > 1) {
      setSupervisors(prev => prev.filter(s => s !== sup));
      if (selectedSupervisor === sup) {
        setSelectedSupervisor(supervisors.filter(s => s !== sup)[0]);
      }
    }
  };

  const handleChecklistChange = (id: string, val: 'Ya' | 'Tidak' | 'N/A') => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, value: val } : item));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setToastMessage(null);

    try {
      const isComplete = checklist.every(item => item.value !== null) && !!namaPj.trim();
      if (!isComplete) {
        throw new Error('Mohon lengkapi semua item checklist dan nama PJ.');
      }
      
      const ttdPj = !sigPadPJ.current?.isEmpty() ? sigPadPJ.current?.getCanvas().toDataURL('image/png') : null;
      const ttdIpcn = !sigPadIPCN.current?.isEmpty() ? sigPadIPCN.current?.getCanvas().toDataURL('image/png') : null;

      const supabase = getSupabase();
      
      const uploadedImageUrls = await uploadImagesToSupabase(supabase, fotos, 'monitoring', 'gizi');

      // Store checklist as JSON
      const checklistJson = checklist.reduce((acc, item) => {
        acc[item.id] = item.value;
        return acc;
      }, {} as any);

      // Save to audit_gizi_monitoring
      const insertData = {
        waktu: new Date(waktu).toISOString(),
        ruangan: ruangan,
        supervisor: selectedSupervisor,
        
        // Form Checklist Map
        lingkungan_umum_a: checklistJson['lingkungan_umum_a'],
        lingkungan_umum_b: checklistJson['lingkungan_umum_b'],
        lingkungan_umum_c: checklistJson['lingkungan_umum_c'],
        lingkungan_umum_d: checklistJson['lingkungan_umum_d'],
        lingkungan_umum_e: checklistJson['lingkungan_umum_e'],
        lingkungan_umum_f: checklistJson['lingkungan_umum_f'],
        lingkungan_umum_g: checklistJson['lingkungan_umum_g'],
        lingkungan_umum_h: checklistJson['lingkungan_umum_h'],

        fasilitas_tangan_a: checklistJson['fasilitas_tangan_a'],
        fasilitas_tangan_b: checklistJson['fasilitas_tangan_b'],
        fasilitas_tangan_c: checklistJson['fasilitas_tangan_c'],
        fasilitas_tangan_d: checklistJson['fasilitas_tangan_d'],
        fasilitas_tangan_e: checklistJson['fasilitas_tangan_e'],

        peralatan_a: checklistJson['peralatan_a'],
        peralatan_b: checklistJson['peralatan_b'],
        peralatan_c: checklistJson['peralatan_c'],
        peralatan_d: checklistJson['peralatan_d'],
        peralatan_e: checklistJson['peralatan_e'],
        peralatan_f: checklistJson['peralatan_f'],

        penyimpanan_makanan_a: checklistJson['penyimpanan_makanan_a'],
        penyimpanan_makanan_b: checklistJson['penyimpanan_makanan_b'],
        penyimpanan_makanan_c: checklistJson['penyimpanan_makanan_c'],
        penyimpanan_makanan_d: checklistJson['penyimpanan_makanan_d'],
        penyimpanan_makanan_e: checklistJson['penyimpanan_makanan_e'],
        penyimpanan_makanan_f: checklistJson['penyimpanan_makanan_f'],
        penyimpanan_makanan_g: checklistJson['penyimpanan_makanan_g'],
        penyimpanan_makanan_h: checklistJson['penyimpanan_makanan_h'],

        perpindahan_makanan_a: checklistJson['perpindahan_makanan_a'],
        perpindahan_makanan_b: checklistJson['perpindahan_makanan_b'],
        perpindahan_makanan_c: checklistJson['perpindahan_makanan_c'],

        penanganan_limbah_a: checklistJson['penanganan_limbah_a'],
        penanganan_limbah_b: checklistJson['penanganan_limbah_b'],
        penanganan_limbah_c: checklistJson['penanganan_limbah_c'],
        penanganan_limbah_d: checklistJson['penanganan_limbah_d'],

        praktik_staf_a: checklistJson['praktik_staf_a'],
        praktik_staf_b: checklistJson['praktik_staf_b'],
        praktik_staf_c: checklistJson['praktik_staf_c'],
        praktik_staf_d: checklistJson['praktik_staf_d'],
        praktik_staf_e: checklistJson['praktik_staf_e'],
        praktik_staf_f: checklistJson['praktik_staf_f'],
        praktik_staf_g: checklistJson['praktik_staf_g'],
        praktik_staf_h: checklistJson['praktik_staf_h'],
        praktik_staf_i: checklistJson['praktik_staf_i'],
        praktik_staf_j: checklistJson['praktik_staf_j'],
        praktik_staf_k: checklistJson['praktik_staf_k'],
        praktik_staf_l: checklistJson['praktik_staf_l'],
        praktik_staf_m: checklistJson['praktik_staf_m'],
        praktik_staf_n: checklistJson['praktik_staf_n'],
        
        persentase: stats.persentase,
        temuan: temuan.trim() || null,
        rekomendasi: rekomendasi.trim() || null,
        dokumentasi: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
        nama_pj: namaPj.trim(),
        ttd_pj: ttdPj,
        ttd_ipcn: ttdIpcn,
      };

      const { error } = await supabase
        .from('audit_gizi_monitoring')
        .insert([insertData]);

      if (error) { console.error('Observer DB Error:', error); throw error; } // Ignore if table doesn't exist yet

      setToastMessage({ title: 'Berhasil', desc: 'Data Audit Gizi berhasil disimpan!', type: 'success' });
      
      setTimeout(() => {
        router.push('/dashboard/input/isolasi');
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setToastMessage({ title: 'Gagal', desc: err.message || 'Terjadi kesalahan saat menyimpan data.', type: 'error' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 pb-32">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 z-[100] p-4 rounded-2xl shadow-2xl flex items-start gap-4 border max-w-sm w-full backdrop-blur-md ${
              toastMessage.type === 'success' 
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-100' 
              : 'bg-rose-500/20 border-rose-500/50 text-rose-100'
            }`}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /> : <Trash2 className="w-6 h-6 text-rose-400 shrink-0" />}
            <div>
              <h4 className="font-bold">{toastMessage.title}</h4>
              <p className="text-sm opacity-90">{toastMessage.desc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Info Card */}
      <div className="glass-card p-6 lg:p-10 rounded-[2.5rem] border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
          <button 
            onClick={() => router.push('/dashboard/input/isolasi')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors flex items-center justify-center group"
          >
            <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
          
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl lg:text-3xl font-heading font-bold tracking-wide text-gradient">
              AUDIT GIZI
            </h1>
            <p className="text-sm text-slate-400 tracking-wider font-medium">
              Monitoring Pencegahan dan Pengendalian Infeksi Area Gizi
            </p>
          </div>
        </div>
      </div>

      {/* Basic Setup Card */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Waktu Audit</label>
            <input 
              type="datetime-local" 
              value={waktu}
              onChange={(e) => setWaktu(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50 hover:bg-white/10 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[0.6]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Ruangan</label>
            <div className="relative group">
              <select 
                value={ruangan}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-slate-300 text-sm outline-none focus:border-blue-500/50 appearance-none hover:bg-white/10 transition-colors cursor-not-allowed opacity-80"
              >
                <option value={ruangan} className="bg-[#0f172a] text-white">{ruangan}</option>
              </select>
              <Building2 className="w-4 h-4 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronRight className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Supervisor / IPCN</label>
              {(userRole === 'IPCN' || userRole === 'Admin') && (
                <button 
                  onClick={() => setIsManagingSupervisors(!isManagingSupervisors)}
                  className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300 tracking-widest flex items-center gap-1"
                >
                  <Search className="w-3 h-3" /> Kelola Supervisor
                </button>
              )}
            </div>
            
            {isManagingSupervisors ? (
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nama supervisor baru..." 
                    value={newSupervisor}
                    onChange={(e) => setNewSupervisor(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 text-sm text-white focus:border-blue-500 outline-none"
                  />
                  <button 
                    onClick={handleAddSupervisor}
                    className="px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Tambah
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {supervisors.map(sup => (
                    <div key={sup} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-sm text-slate-300">{sup}</span>
                      <button onClick={() => handleDeleteSupervisor(sup)} className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-md transition-colors flex items-center gap-2 text-xs">
                        <Trash2 className="w-4 h-4" /> Hapus
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative group">
                <select 
                  value={selectedSupervisor}
                  onChange={(e) => setSelectedSupervisor(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-white text-sm outline-none focus:border-blue-500/50 appearance-none hover:bg-white/10 transition-colors"
                >
                  {supervisors.map(sup => <option key={sup} value={sup} className="bg-[#0f172a] text-white">{sup}</option>)}
                </select>
                <ChevronRight className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checklist Card */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 shadow-xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
          <CheckCircle2 className="w-5 h-5 text-blue-400" /> CEKLIST GIZI
        </h3>

        <div className="space-y-10 mb-8">
          {sections.map(({ section, subsections }) => (
            <div key={section} className="space-y-6">
              <h4 className="text-blue-400 font-bold uppercase tracking-wider text-base border-b border-blue-500/30 pb-2">
                {section}
              </h4>
              
              {subsections.map(([subsection, items]) => (
                <div key={subsection} className="space-y-4 ml-0 md:ml-4">
                  {subsection && (
                    <h5 className="text-slate-300 font-bold tracking-wide text-sm flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-slate-500" /> {subsection}
                    </h5>
                  )}
                  
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="p-4 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                        <p className="text-sm font-medium text-slate-200 mb-4">{item.label}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {(['Ya', 'Tidak', 'N/A'] as const).map(option => (
                            <label key={option} className="cursor-pointer relative">
                              <input
                                type="radio"
                                name={item.id}
                                value={option}
                                checked={item.value === option}
                                onChange={() => handleChecklistChange(item.id, option)}
                                className="peer sr-only"
                              />
                              <div className={`py-2 rounded-xl text-xs font-bold text-center transition-all ${
                                item.value === option
                                ? option === 'Ya' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                  : option === 'Tidak' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                                  : 'bg-slate-500 text-white shadow-lg shadow-slate-500/20'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5 peer-checked:bg-white/10'
                              }`}>
                                {option === 'Ya' ? '✅ Ya' : option === 'Tidak' ? '❌ Tidak' : '➖ N/A'}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <LiveStatisticsCard 
          totalDinilai={stats.totalDinilai}
          totalPatuh={stats.totalPatuh}
          totalTidakPatuh={stats.totalTidakPatuh}
          persentase={stats.persentase}
          statusText={stats.statusText}
        />
      </div>
      {/* Temuan & Rekomendasi */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 space-y-6">
        <h3 className="text-lg font-bold text-white mb-2">Temuan & Rekomendasi</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Temuan Lapangan</label>
            <textarea 
              value={temuan}
              onChange={e => setTemuan(e.target.value)}
              placeholder="Tulis temuan audit..."
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500/50 min-h-[120px] resize-y placeholder:text-slate-600"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Rekomendasi Tindak Lanjut</label>
            <textarea 
              value={rekomendasi}
              onChange={e => setRekomendasi(e.target.value)}
              placeholder="Tulis rekomendasi perbaikan..."
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500/50 min-h-[120px] resize-y placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Dokumentasi */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5">
        <h3 className="text-lg font-bold text-white mb-6">Fotografi Bukti / Dokumentasi (Opsional)</h3>
        <DocumentationUploader 
          images={fotos}
          setImages={setFotos}
        />
      </div>

      {/* Tanda Tangan */}
      <div className="glass-card p-6 lg:p-8 rounded-[2.5rem] border-white/5 space-y-6">
        <h3 className="text-lg font-bold text-white mb-6">Verifikasi Digital</h3>
        
        <div className="space-y-4 md:col-span-2 mb-8">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Nama PJ Ruangan</label>
          <input 
            type="text" 
            value={namaPj}
            onChange={e => setNamaPj(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50"
            placeholder="Ketik nama PJ ruangan"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex justify-between">
              Tanda Tangan PJ Ruangan
              <button onClick={() => sigPadPJ.current?.clear()} className="hover:text-amber-400 text-[10px]">Clear Signature</button>
            </label>
            <div className="bg-white rounded-2xl overflow-hidden border-2 border-white/10">
              <SignaturePad 
                ref={sigPadPJ}
                canvasProps={{ className: "w-full h-40 cursor-crosshair touch-none" }} 
                penColor="black"
              />
            </div>
            <div className="flex justify-end pt-1">
               <button onClick={() => sigPadPJ.current?.clear()} className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300">Ulangi</button>
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex justify-between">
              IPCN / IPCLN (Supervisor)
              <button onClick={() => sigPadIPCN.current?.clear()} className="hover:text-amber-400 text-[10px]">Clear Signature</button>
            </label>
            <div className="bg-white rounded-2xl overflow-hidden border-2 border-white/10">
              <SignaturePad 
                ref={sigPadIPCN}
                canvasProps={{ className: "w-full h-40 cursor-crosshair touch-none" }} 
                penColor="black"
              />
            </div>
            <div className="flex justify-end pt-1">
               <button onClick={() => sigPadIPCN.current?.clear()} className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300">Ulangi</button>
            </div>
          </div>
        </div>
      </div>

      {/* TOMBOL SIMPAN - PERMANEN DI BAWAH */}
      <div className="pt-6 sticky bottom-6 z-50">
        <motion.button 
          onClick={handleSubmit}
          disabled={isSubmitting}
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
              <span>Simpan Data Audit</span>
            </>
          )}
        </motion.button>
      </div>

    </div>
  );
}
