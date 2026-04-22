'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  FileSpreadsheet,
  FileIcon,
  Search,
  ArrowLeft,
  Activity,
  ShieldCheck,
  ClipboardCheck,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronRight,
  MoreVertical,
  Share2,
  FileDown,
  Printer,
  Grid,
  List as ListIcon,
  X,
  Plus,
  RefreshCw,
  Clock,
  User,
  Building2,
  AlertTriangle,
  Lightbulb,
  PlusCircle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

import { getSupabase } from '@/lib/supabase';
import HandHygieneReport from '@/components/reports/HandHygieneReport';
// import ApdReport from '@/components/reports/ApdReport';
// import GenericAuditReport from '@/components/reports/GenericAuditReport';
import { useAppContext } from '@/components/providers';

// --- Types & Mock Data ---

type ReportModule = 'hub' | 'isolasi' | 'surveilans' | 'bundles' | 'diklat';

const COLORS = ['#3b82f6', '#8b5cf6', '#e11d48', '#10b981', '#f59e0b'];

const trendData = [
  { name: 'Jan', hh: 82, apd: 78, hais: 2.1 },
  { name: 'Feb', hh: 85, apd: 82, hais: 1.8 },
  { name: 'Mar', hh: 79, apd: 75, hais: 2.4 },
  { name: 'Apr', hh: 91, apd: 88, hais: 1.2 },
];

const unitData = [
  { name: 'IGD', value: 88 },
  { name: 'ICU', value: 92 },
  { name: 'Ranap A', value: 76 },
  { name: 'Ranap B', value: 84 },
  { name: 'Ranap C', value: 65 },
];

const indicators: Record<string, any[]> = {
  isolasi: [
    { id: 'hh', name: 'Kepatuhan Kebersihan Tangan', standard: 85, compliance: 85, trend: '+2%', icon: Activity },
    { id: 'apd', name: 'Kepatuhan Penggunaan APD', standard: 100, compliance: 78, trend: '-5%', icon: ShieldCheck },
    { id: 'dekontaminasi_alat', name: 'Kepatuhan Dekontaminasi Alat', standard: 100, compliance: 92, trend: '+1%', icon: ClipboardCheck },
    { id: 'pengendalian_lingkungan', name: 'Kepatuhan Pengendalian Lingkungan', standard: 80, compliance: 88, trend: '+3%', icon: Building2 },
    { id: 'limbah_m', name: 'Kepatuhan Limbah Medis', standard: 100, compliance: 85, trend: '0%', icon: AlertTriangle },
    { id: 'limbah_t', name: 'Kepatuhan Limbah Tajam', standard: 100, compliance: 95, trend: '+5%', icon: AlertTriangle },
    { id: 'linen', name: 'Kepatuhan Pengelolaan Linen', standard: 100, compliance: 65, trend: '-10%', icon: ClipboardCheck },
    { id: 'penempatan_pasien', name: 'Kepatuhan Penempatan Pasien', standard: 100, compliance: 100, trend: '0%', icon: User },
    { id: 'penyuntikan_aman', name: 'Kepatuhan Penyuntikan Aman', standard: 100, compliance: 98, trend: '+1%', icon: ShieldCheck },
    { id: 'perlindungan_petugas', name: 'Kepatuhan Perlindungan Petugas', standard: 100, compliance: 90, trend: '+2%', icon: ShieldCheck },
    { id: 'ruang_isolasi', name: 'Kepatuhan Fasilitas Ruang Isolasi', standard: 100, compliance: 90, trend: '0%', icon: Building2 },
    { id: 'ppi_ruang_isolasi', name: 'Kepatuhan PPI di Ruang Isolasi', standard: 100, compliance: 92, trend: '0%', icon: ShieldCheck },
  ],
  surveilans: [
    { id: 'phl', name: 'Surveilans Phlebitis', standard: 5, rate: 2.4, trend: '-0.2', type: '‰', icon: Activity },
    { id: 'isk', name: 'Surveilans CAUTI (ISK)', standard: 4.7, rate: 1.8, trend: '+0.5', type: '‰', icon: Activity },
    { id: 'vap', name: 'Surveilans VAP', standard: 5.8, rate: 3.1, trend: '-0.1', type: '‰', icon: Activity },
    { id: 'ido', name: 'Surveilans IDO', standard: 2, rate: 1.2, trend: '0.0', type: '%', icon: Activity },
  ],
  bundles: [
    { id: 'iadp', name: 'Kepatuhan Bundles IADP', standard: 100, compliance: 94, trend: '+4%', icon: ShieldCheck },
    { id: 'cauti', name: 'Kepatuhan Bundles CAUTI', standard: 100, compliance: 88, trend: '+2%', icon: ShieldCheck },
    { id: 'ido_b', name: 'Kepatuhan Bundles IDO', standard: 100, compliance: 82, trend: '-3%', icon: ShieldCheck },
    { id: 'vap_b', name: 'Kepatuhan Bundles VAP', standard: 100, compliance: 75, trend: '-5%', icon: ShieldCheck },
  ],
  diklat: [
    { id: 'sos', name: 'Sosialisasi PPI', standard: 100, compliance: 100, trend: '0%', icon: GraduationCap },
    { id: 'ws', name: 'Workshop Hand Hygiene', standard: 100, compliance: 100, trend: '0%', icon: GraduationCap },
    { id: 'sim', name: 'Simulasi BHD & PPI', standard: 100, compliance: 100, trend: '0%', icon: GraduationCap },
  ]
};

const genericAuditConfigs: Record<string, {tableName: string, items: {id: string, label: string, key: string, isNegative?: boolean}[]}> = {
  dekontaminasi_alat: {
    tableName: 'audit_dekontaminasi_alat',
    items: [
      { id: 'item_1', label: 'Petugas yang melakukan dekontaminasi menggunakan APD', key: 'item_1' },
      { id: 'item_2', label: 'Alat kotor segera di cleaning / pre-cleaning', key: 'item_2' },
      { id: 'item_3', label: 'Dilakukan perendaman awal', key: 'item_3' },
      { id: 'item_4', label: 'Larutan diganti setiap pergantian shift', key: 'item_4' },
      { id: 'item_5', label: 'Alat dicuci di bawah air mengalir', key: 'item_5' },
      { id: 'item_6', label: 'Alat dikeringkan', key: 'item_6' },
      { id: 'item_7', label: 'Alat kotor belum digunakan dipisah', key: 'item_7' },
      { id: 'item_8', label: 'Packing / bungkus sesuai SPO', key: 'item_8' },
      { id: 'item_9', label: 'Diberi tanda dan identitas yang jelas', key: 'item_9' }
    ]
  },
  pengendalian_lingkungan: {
    tableName: 'audit_pengendalian_lingkungan',
    items: [
      { id: 'item_1', label: 'Kursi/meja/dan loker tampak bersih', key: 'item_1' },
      { id: 'item_2', label: 'Troli tindakan tampak bersih', key: 'item_2' },
      { id: 'item_3', label: 'Troli tindakan dibersihkan dan didesinfeksi', key: 'item_3' },
      { id: 'item_4', label: 'Lantai bersih dan dalam kondisi baik', key: 'item_4' },
      { id: 'item_5', label: 'Ditemukan debu di permukaan kerja', key: 'item_5', isNegative: true },
      { id: 'item_6', label: 'Tirai pemisah bersih', key: 'item_6' },
      { id: 'item_7', label: 'Kipas angin dan AC bersih', key: 'item_7' },
      { id: 'item_8', label: 'Dinding bebas jamur', key: 'item_8' },
      { id: 'item_9', label: 'Ventilasi/jendela bersih', key: 'item_9' },
      { id: 'item_10', label: 'Area tunggu bersih', key: 'item_10' },
    ]
  },
  limbah_m: {
    tableName: 'audit_pengelolaan_limbah_medis',
    items: [
      { id: 'item_1', label: 'Tersedia fasilitas pembuangan sampah', key: 'item_1' },
      { id: 'item_2', label: 'Tempat sampah pedal kaki', key: 'item_2' },
      { id: 'item_3', label: 'Tempat sampah berlabel', key: 'item_3' },
      { id: 'item_4', label: 'Plastik kuning limbah infeksius', key: 'item_4' },
      { id: 'item_5', label: 'Tempat sampah memadai', key: 'item_5' },
      { id: 'item_6', label: 'Sampah diikat', key: 'item_6' },
      { id: 'item_7', label: 'Sampah tidak lebih 3/4', key: 'item_7' },
      { id: 'item_8', label: 'Disimpan di TPS', key: 'item_8' },
      { id: 'item_9', label: 'Tahu cara tumpahan', key: 'item_9' },
      { id: 'item_10', label: 'Spill kit tersedia', key: 'item_10' }
    ]
  },
  limbah_t: {
    tableName: 'audit_pengelolaan_limbah_tajam',
    items: [
      { id: 'item_1', label: 'Safety box sesuai WHO', key: 'item_1' },
      { id: 'item_2', label: 'Wadah aman', key: 'item_2' },
      { id: 'item_3', label: 'Wadah < 3/4 penuh', key: 'item_3' },
      { id: 'item_4', label: 'Tidak ada tajam keluar', key: 'item_4' },
      { id: 'item_5', label: 'Tajam masuk wadah tajam', key: 'item_5' },
      { id: 'item_6', label: 'Tong tajam di troli', key: 'item_6' },
      { id: 'item_7', label: '1 tangan / no recapping', key: 'item_7' },
      { id: 'item_8', label: 'Jalur paska pajanan', key: 'item_8' },
    ]
  },
  linen: {
    tableName: 'audit_penatalaksanaan_linen',
    items: [
      { id: 'item_1', label: 'Linen bersih disimpan lemari tertutup', key: 'item_1' },
      { id: 'item_2', label: 'Troli tertutup kotor', key: 'item_2' },
      { id: 'item_3', label: 'Kantung kuning infeksius', key: 'item_3' },
      { id: 'item_4', label: 'Linen kotor dipisah', key: 'item_4' },
      { id: 'item_5', label: 'Petugas APD infeksius', key: 'item_5' }
    ]
  },
  penempatan_pasien: {
    tableName: 'audit_penempatan_pasien',
    items: [
      { id: 'catatan_infeksi', label: 'Catatan infeksi', key: 'catatan_infeksi' },
      { id: 'instruksi_ruang', label: 'Instruksi petugas (tanda)', key: 'instruksi_ruang' },
      { id: 'poster_pencegahan', label: 'Poster pencegahan', key: 'poster_pencegahan' },
      { id: 'apd_tersedia', label: 'APD tersedia', key: 'apd_tersedia' },
      { id: 'catatan_klinis', label: 'Catatan klinis', key: 'catatan_klinis' },
      { id: 'instruksi_isolasi', label: 'Instruksi isolasi', key: 'instruksi_isolasi' },
      { id: 'pintu_tertutup', label: 'Pintu tertutup', key: 'pintu_tertutup' },
      { id: 'alur_pasien', label: 'Alur terpasang', key: 'alur_pasien' }
    ]
  },
  penyuntikan_aman: {
    tableName: 'audit_penyuntikan_aman',
    items: [
      { id: 'hh', label: 'Kebersihan tangan', key: 'hh' },
      { id: 'apd', label: 'APD indikasi', key: 'apd' },
      { id: 'disposable', label: 'Spuit sekali pakai', key: 'disposable' },
      { id: 'no_reuse', label: 'Spuit no reuse', key: 'no_reuse' },
      { id: 'no_touch_sterile', label: 'No touch steril', key: 'no_touch_sterile' },
      { id: 'area_disinfection', label: 'Desinfeksi area', key: 'area_disinfection' },
      { id: 'antiseptic_standard', label: 'Antiseptik standar', key: 'antiseptic_standard' },
      { id: 'no_recapping', label: 'No recapping', key: 'no_recapping' },
      { id: 'safety_box', label: 'Safety box langsung', key: 'safety_box' },
      { id: 'no_bending', label: 'No bending jarum', key: 'no_bending' }
    ]
  },
  perlindungan_petugas: {
    tableName: 'audit_perlindungan_petugas',
    items: [
      { id: 'item_1', label: 'Vaksinasi HepB & Covid', key: 'item_1' },
      { id: 'item_2', label: 'Pemeriksaan 1x/thn', key: 'item_2' }
    ]
  }
};

// --- Sub-Components ---

const StatCard = ({ title, value, subValue, icon: Icon, color, onClick }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    onClick={onClick}
    className="glass-card p-6 rounded-[2rem] border-white/5 shadow-xl cursor-pointer group relative overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] rounded-full -z-10 bg-gradient-to-br ${color} opacity-20`} />
    <div className="flex justify-between items-start mb-4">
      <div className={`p-4 rounded-2xl bg-white/5 border border-white/5 text-white shadow-inner group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Kepatuhan</span>
        <span className={`text-xl font-bold font-heading ${value.includes('<') || parseInt(value) < 60 ? 'text-red-400' : 'text-blue-400'}`}>{value}</span>
      </div>
    </div>
    <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
    <p className="text-xs text-slate-400 line-clamp-2">{subValue}</p>
    <div className="mt-4 flex items-center justify-between">
      <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500" style={{ width: value }} />
      </div>
      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
    </div>
  </motion.div>
);

export default function ReportsPage() {
  const { userRole } = useAppContext();
  const [view, setView] = useState<ReportModule>('hub');
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  
  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState('Bulanan');
  const [unitFilter, setUnitFilter] = useState('Semua Unit');
  const [searchQuery, setSearchQuery] = useState('');

  // Unit Management
  const [units, setUnits] = useState<string[]>(() => {
    const initialUnits = ['IGD', 'ICU', 'IBS', 'Ranap Aisyah', 'Ranap Fatimah', 'Ranap Khadijah', 'Ranap Usman', 'Rawat Jalan', 'Radiologi', 'Laboratorium', 'Farmasi', 'Laundry', 'Pantry'];
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smart_ppi_units');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return initialUnits;
        }
      }
    }
    return initialUnits;
  });
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');

  const dateRange = useMemo(() => {
    const d = new Date(selectedDate);
    const year = d.getFullYear();
    const month = d.getMonth();
    
    if (period === 'Harian') {
       return { from: selectedDate, to: selectedDate };
    } else if (period === 'Bulanan') {
       const first = new Date(year, month, 1).toISOString().split('T')[0];
       const last = new Date(year, month + 1, 0).toISOString().split('T')[0];
       return { from: first, to: last };
    } else if (period === 'Triwulan') {
       const quarter = Math.floor(month / 3);
       const first = new Date(year, quarter * 3, 1).toISOString().split('T')[0];
       const last = new Date(year, (quarter + 1) * 3, 0).toISOString().split('T')[0];
       return { from: first, to: last };
    } else { // Tahunan
       const first = `${year}-01-01`;
       const last = `${year}-12-31`;
       return { from: first, to: last };
    }
  }, [selectedDate, period]);

  const handleAddUnit = () => {
    if (newUnitName.trim() && !units.includes(newUnitName.trim())) {
      const updated = [...units, newUnitName.trim()];
      setUnits(updated);
      localStorage.setItem('smart_ppi_units', JSON.stringify(updated));
      setNewUnitName('');
      setIsAddingUnit(false);
    }
  };

  const activeIndicatorData = useMemo(() => {
    if (!selectedIndicator || view === 'hub') return null;
    return (indicators as any)[view]?.find((i: any) => i.id === selectedIndicator);
  }, [selectedIndicator, view]);

  const handleBack = () => {
    if (selectedIndicator) setSelectedIndicator(null);
    else setView('hub');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-32 px-4 sm:px-6">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative py-6 z-10 border-b border-white/5">
        <div className="flex items-center gap-4">
          {(view !== 'hub' || selectedIndicator) && (
            <button 
              onClick={handleBack} 
              className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-[28px] sm:text-[34px] font-heading font-bold tracking-tight text-gradient drop-shadow-[0_0_25px_rgba(59,130,246,0.5)] leading-tight">
              Laporan SMART PPI
            </h1>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-blue-400 mt-1 flex items-center gap-2">
              <Building2 className="w-3 h-3" /> UOBK RSUD AL-MULK Kota Sukabumi
            </p>
          </div>
        </div>
        
        {/* Global Export Button */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex flex-col items-end mr-4">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Status Mutu</span>
            <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">BAIK (84.1%)</span>
          </div>
          <div className="relative group/export">
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all border border-white/10">
              <Download className="w-4 h-4" /> Export Laporan
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-navy-dark border border-white/5 rounded-2xl shadow-2xl overflow-hidden opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all z-[100]">
              <button className="w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white flex items-center gap-2">
                <FileIcon className="w-3.5 h-3.5 text-red-400" /> Export PDF
              </button>
              <button className="w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" /> Export Excel
              </button>
              <button className="w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-blue-300" /> Export Word
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Global Filters */}
      <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 shadow-2xl relative overflow-visible">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none rounded-[2rem]" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 w-full mb-6">
          {/* Tanggal */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Calendar className="w-3 h-3 text-blue-400" /> Pilih Tanggal
            </label>
            <div className="flex items-center gap-3 bg-white/5 hover:bg-white/10 focus-within:border-blue-500/50 rounded-xl border border-white/5 px-4 h-12 text-white transition-all shadow-inner group">
              <input 
                type="date" 
                value={selectedDate} 
                onChange={e => setSelectedDate(e.target.value)} 
                className="bg-transparent text-sm w-full outline-none focus:text-blue-400 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[0.6] cursor-pointer" 
              />
            </div>
          </div>

          {/* Periode */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Clock className="w-3 h-3 text-purple-400" /> Periode Laporan
            </label>
            <div className="relative group">
              <select 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-5 pr-10 h-12 text-sm text-white outline-none focus:border-blue-500/50 appearance-none hover:bg-white/10 transition-all cursor-pointer shadow-inner"
              >
                {['Harian', 'Bulanan', 'Triwulan', 'Tahunan'].map(p => <option key={p} value={p} className="bg-[#0f172a] text-white">{p}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500 group-hover:text-blue-400 transition-colors">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Building2 className="w-3 h-3 text-emerald-400" /> Filter Unit
              </label>
              {(userRole === 'IPCN' || userRole === 'Admin') && (
                <button 
                  onClick={() => setIsAddingUnit(true)}
                  className="text-[9px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest flex items-center gap-1 transition-colors"
                >
                  <PlusCircle className="w-3 h-3" /> Tambah
                </button>
              )}
            </div>
            <div className="relative group">
              <select 
                value={unitFilter} 
                onChange={(e) => setUnitFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-5 pr-10 h-12 text-sm text-white outline-none focus:border-blue-500/50 appearance-none hover:bg-white/10 transition-all cursor-pointer shadow-inner"
              >
                <option value="Semua Unit" className="bg-[#0f172a] text-white">Semua Unit</option>
                {units.map(u => <option key={u} value={u} className="bg-[#0f172a] text-white">{u}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500 group-hover:text-blue-400 transition-colors">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Add Unit Field for IPCN */}
        <AnimatePresence>
          {isAddingUnit && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <input 
                  type="text" 
                  placeholder="Nama Unit Baru..." 
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 h-11 text-sm text-white focus:border-blue-500/50 outline-none"
                  autoFocus
                />
                <button 
                  onClick={handleAddUnit}
                  className="px-6 h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" /> Simpan Unit
                </button>
                <button 
                  onClick={() => setIsAddingUnit(false)}
                  className="p-3 hover:bg-white/5 text-slate-500 hover:text-white rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 px-4 h-12 w-full md:w-1/3 focus-within:border-blue-500/50 transition-all group relative z-10 shadow-inner">
          <Search className="w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors shrink-0" />
          <input 
            type="text" 
            placeholder="Cari indikator..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Main Content Areas */}
      <AnimatePresence mode="wait">
        {/* --- HUB VIEW --- */}
        {view === 'hub' && (
          <motion.div 
            key="hub-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="space-y-8"
          >
            {/* Main Category Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Kewaspadaan Isolasi" 
                value="88.4%"
                subValue="Hand Hygiene, APD, Etika Batuk, Penempatan Pasien, dll."
                icon={ShieldCheck}
                color="from-blue-500 to-blue-600"
                onClick={() => setView('isolasi')}
              />
              <StatCard 
                title="Surveilans HAIs" 
                value="2.1‰"
                subValue="Phlebitis, ISK, VAP, IDO (Rate per 1000 Hari Rawat)"
                icon={Activity}
                color="from-rose-500 to-rose-600"
                onClick={() => setView('surveilans')}
              />
              <StatCard 
                title="Monitoring Bundles" 
                value="91.2%"
                subValue="Bundles IADP, CAUTI, VAP, dan IDO."
                icon={ClipboardCheck}
                color="from-purple-500 to-purple-600"
                onClick={() => setView('bundles')}
              />
              <StatCard 
                title="Pendidikan & Pelatihan" 
                value="12 Sesi"
                subValue="Sosialisasi PPI, Workshop Hand Hygiene, Pelatihan Staff."
                icon={GraduationCap}
                color="from-emerald-500 to-emerald-600"
                onClick={() => setView('diklat')}
              />
            </div>

            {/* Hub Insights / Highlight Section */}
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-heading font-bold text-white tracking-wide flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-400" /> Tren Kepatuhan Keseluruhan
                  </h3>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white"><Grid className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}
                        itemStyle={{ fontSize: '10px', textTransform: 'uppercase' }}
                      />
                      <Area type="monotone" dataKey="hh" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                      <Area type="monotone" dataKey="apd" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-8 rounded-[2.5rem] border-white/5 shadow-2xl space-y-6">
                <h3 className="text-lg font-heading font-bold text-white flex items-center gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-400" /> Auto Insights
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 border-l-4 border-l-emerald-500">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Highlight Positif</p>
                    <p className="text-[13px] text-white leading-relaxed">
                      Kepatuhan Hand Hygiene di <strong>ICU</strong> meningkat 12% dibandingkan bulan lalu.
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 border-l-4 border-l-rose-500">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Perlu Perhatian</p>
                    <p className="text-[13px] text-white leading-relaxed">
                      Limbah tajam tidak terkelola sesuai standar di <strong>IGD</strong>. Potensi hazard tinggi.
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 border-l-4 border-l-blue-500">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Insight Bundles</p>
                    <p className="text-[13px] text-white leading-relaxed">
                      Maintenance ETT mencapai 95%. Faktor keberhasilan: supervisi berkelanjutan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- DETAIL VIEW --- */}
        {view !== 'hub' && (
          <motion.div 
            key="detail-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Indicator Selector Scroll */}
            <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6 scroll-smooth">
              {indicators[view].map((ind: any) => {
                // Determine color based on standard
                let statusColor = 'text-blue-400';
                if (ind.compliance !== undefined) {
                  if (ind.compliance >= (ind.standard || 85)) statusColor = 'text-emerald-400';
                  else if (ind.compliance >= (ind.standard || 85) - 10) statusColor = 'text-amber-400';
                  else statusColor = 'text-rose-400';
                } else if (ind.rate !== undefined) {
                  if (ind.rate <= (ind.standard || 5)) statusColor = 'text-emerald-400';
                  else if (ind.rate <= (ind.standard || 5) + 2) statusColor = 'text-amber-400';
                  else statusColor = 'text-rose-400';
                }

                return (
                  <button
                    key={ind.id}
                    onClick={() => setSelectedIndicator(ind.id)}
                    className={`flex flex-col gap-3 min-w-[220px] max-w-[240px] p-5 rounded-3xl border transition-all shrink-0 text-left relative overflow-hidden ${
                      selectedIndicator === ind.id 
                      ? 'bg-blue-600 border-blue-400 shadow-[0_10px_30px_rgba(59,130,246,0.3)] scale-[1.02]' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 hover:scale-[1.02] hover:shadow-xl'
                    }`}
                  >
                    {selectedIndicator === ind.id && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-2xl rounded-full pointer-events-none -mr-8 -mt-8" />
                    )}
                    
                    <div className="flex items-start justify-between w-full gap-2 border-b border-white/5 pb-3">
                      <span className={`text-sm font-bold leading-snug line-clamp-2 ${selectedIndicator === ind.id ? 'text-white' : 'text-slate-200'}`}>
                        {ind.name}
                      </span>
                      {ind.icon && (
                        <div className={`p-1.5 rounded-lg shrink-0 ${selectedIndicator === ind.id ? 'bg-black/10 text-white' : 'bg-white/5 text-slate-400'}`}>
                          <ind.icon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    
                    {ind.standard !== undefined && (
                      <span className={`text-[10px] font-medium tracking-wide ${selectedIndicator === ind.id ? 'text-blue-100' : 'text-slate-500'}`}>
                        Standar {ind.compliance !== undefined ? '≥' : '≤'} {ind.standard}{ind.type || '%'}
                      </span>
                    )}
                    
                    <div className="flex items-end justify-between w-full mt-1">
                      <div className="flex items-center gap-1">
                        {ind.compliance !== undefined && (
                          <span className={`text-3xl font-bold font-heading tabular-nums tracking-tight ${selectedIndicator === ind.id ? 'text-white' : statusColor}`}>
                            {ind.compliance}%
                          </span>
                        )}
                        {ind.rate !== undefined && (
                          <span className={`text-3xl font-bold font-heading tabular-nums tracking-tight ${selectedIndicator === ind.id ? 'text-white' : statusColor}`}>
                            {ind.rate}{ind.type || ''}
                          </span>
                        )}
                      </div>

                      {ind.trend && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          selectedIndicator === ind.id 
                            ? 'bg-white/20 text-white'
                            : (ind.trend.includes('+') && ind.compliance !== undefined) || (ind.trend.includes('-') && ind.rate !== undefined) 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : ind.trend === '0%' || ind.trend === '0.0'
                                ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {ind.trend}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedIndicator && activeIndicatorData ? (
              selectedIndicator === 'hh' ? (
                <HandHygieneReport 
                  selectedDate={selectedDate} 
                  period={period} 
                  unitFilter={unitFilter} 
                />
              ) : selectedIndicator === 'apd' ? (
                <div className="glass-card p-8 rounded-[2.5rem] border-white/5 flex flex-col items-center justify-center min-h-[300px]">
                   <h2 className="text-xl text-white font-bold mb-2">APD Report</h2>
                   <p className="text-slate-400">Dalam pengembangan...</p>
                </div>
              ) : genericAuditConfigs[selectedIndicator] ? (
                <div className="glass-card p-8 rounded-[2.5rem] border-white/5 flex flex-col items-center justify-center min-h-[300px]">
                   <h2 className="text-xl text-white font-bold mb-2">Generic Audit Report: {genericAuditConfigs[selectedIndicator].tableName}</h2>
                   <p className="text-slate-400">Dalam pengembangan...</p>
                </div>
              ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                {/* A. Summary Detailed Indicator */}
                <div className="grid lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-1 glass-card p-8 rounded-[2.5rem] border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/20 blur-[80px] rounded-full" />
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-6 relative z-10">Capaian Kepatuhan</h4>
                    <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="36" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <motion.circle 
                          cx="40" cy="40" r="36" fill="transparent" stroke={activeIndicatorData.compliance ? (activeIndicatorData.compliance < 60 ? '#f43f5e' : activeIndicatorData.compliance < 80 ? '#f59e0b' : '#10b981') : '#3b82f6'} strokeWidth="8" 
                          strokeDasharray={2 * Math.PI * 36}
                          strokeDashoffset={2 * Math.PI * 36 - ((activeIndicatorData.compliance || 0) / 100) * (2 * Math.PI * 36)}
                          strokeLinecap="round"
                          initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 36 - ((activeIndicatorData.compliance || activeIndicatorData.rate * 10 || 0) / 100) * (2 * Math.PI * 36) }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-heading font-bold text-white">
                          {activeIndicatorData.compliance ? activeIndicatorData.compliance + '%' : activeIndicatorData.rate}
                        </span>
                      </div>
                    </div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest relative z-10 ${
                      activeIndicatorData.compliance ? (activeIndicatorData.compliance < 60 ? 'text-rose-400' : activeIndicatorData.compliance < 80 ? 'text-amber-400' : 'text-emerald-400') : 'text-blue-400'
                    }`}>
                      {activeIndicatorData.compliance ? (activeIndicatorData.compliance < 60 ? 'Perlu Perbaikan' : activeIndicatorData.compliance < 80 ? 'Cukup' : 'Patuh') : 'Incidence Rate'}
                    </p>
                  </div>

                  <div className="lg:col-span-3 glass-card p-8 rounded-[2.5rem] border-white/5 space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-heading font-bold text-white flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-blue-400" /> Analisis Tren Capaian
                      </h3>
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all" title="Simpan ke Favorit">
                          <Plus className="w-4 h-4" />
                        </button>
                        <div className="flex bg-white/5 rounded-xl p-1 gap-1">
                          <button className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white bg-blue-600 rounded-lg shadow-lg">Line</button>
                          <button className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Bar</button>
                        </div>
                      </div>
                    </div>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          />
                          <Line type="monotone" dataKey={view === 'surveilans' ? 'hais' : 'hh'} stroke="#3b82f6" strokeWidth={4} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* B. Data Table Indicator */}
                <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl">
                  <div className="p-8 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Tabel Data Raw</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest underline decoration-blue-500 underline-offset-4">Showing all audit data entries</p>
                    </div>
                    <div className="flex gap-3">
                      <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all"><Filter className="w-4 h-4" /></button>
                      <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all">
                        <Download className="w-3.5 h-3.5" /> XLS
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/2 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-white/5">
                          <th className="px-8 py-5">No</th>
                          <th className="px-6 py-5">Tanggal</th>
                          <th className="px-6 py-5">Unit / Ruangan</th>
                          <th className="px-6 py-5">Petugas / Observer</th>
                          <th className="px-6 py-5">Status / Skor</th>
                          <th className="px-8 py-5 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/2 text-xs">
                        {[1, 2, 3, 4, 5].map((idx) => (
                          <tr key={idx} className="hover:bg-white/2 transition-colors cursor-pointer group">
                            <td className="px-8 py-5 text-slate-500 font-mono">{idx}</td>
                            <td className="px-6 py-5 font-bold text-slate-300">20/04/2026</td>
                            <td className="px-6 py-5">
                              <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-slate-400 uppercase tracking-widest text-[9px]">IGD - Emergensi</span>
                            </td>
                            <td className="px-6 py-5 flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">A</div>
                              <span className="text-slate-300">Adi Tresa Purnama</span>
                            </td>
                            <td className="px-6 py-5">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${idx % 2 === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                {idx % 2 === 0 ? 'Compliant' : 'Needs Fix'}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <button className="p-2 text-slate-600 hover:text-white transition-colors"><MoreVertical className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-6 bg-white/2 flex items-center justify-between border-t border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Showing 5 of 124 results</p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all disabled:opacity-30" disabled>Prev</button>
                      <button className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-white hover:bg-blue-600/20 transition-all">Next</button>
                    </div>
                  </div>
                </div>

                {/* C. Additional Insights per Indicator */}
                <div className="grid md:grid-cols-3 gap-6">
                  {view === 'surveilans' && (
                    <>
                      <div className="glass-card p-6 rounded-3xl border-white/5 bg-gradient-to-br from-rose-500/10 to-transparent">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-2">High Incidence Unit</h5>
                        <p className="text-xl font-bold font-heading text-white">ICU - 3.4‰</p>
                        <p className="text-[10px] text-slate-500 mt-1">Requires immediate bundle audit</p>
                      </div>
                      <div className="glass-card p-6 rounded-3xl border-white/5">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">Zero Case Streak</h5>
                        <p className="text-xl font-bold font-heading text-white">Ranap A - 24 Days</p>
                        <p className="text-[10px] text-slate-500 mt-1">Maintaining standard precautions</p>
                      </div>
                      <div className="glass-card p-6 rounded-3xl border-white/5">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">Most Common Action</h5>
                        <p className="text-xl font-bold font-heading text-white">Handrub Usage</p>
                        <p className="text-[10px] text-slate-500 mt-1">Based on 850 observations</p>
                      </div>
                    </>
                  )}
                  {view === 'bundles' && (
                    <>
                      <div className="glass-card p-6 rounded-3xl border-white/5">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">Insersi (Insertion)</h5>
                        <p className="text-xl font-bold font-heading text-white">{activeIndicatorData.insertion}%</p>
                        <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: activeIndicatorData.insertion + '%' }} />
                        </div>
                      </div>
                      <div className="glass-card p-6 rounded-3xl border-white/5">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-2">Pemeliharaan (Maintenance)</h5>
                        <p className="text-xl font-bold font-heading text-white">{activeIndicatorData.maintenance}%</p>
                        <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: activeIndicatorData.maintenance + '%' }} />
                        </div>
                      </div>
                      <div className="glass-card p-6 rounded-3xl border-white/5 bg-gradient-to-br from-emerald-500/10 to-transparent">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">Total Observasi</h5>
                        <p className="text-xl font-bold font-heading text-white">{activeIndicatorData.total} Sesi</p>
                        <p className="text-[10px] text-slate-500 mt-1">Bulan berjalan</p>
                      </div>
                    </>
                  )}
                  {view === 'diklat' && (
                    <>
                      <div className="glass-card p-6 rounded-3xl border-white/5">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">Jumlah Kegiatan</h5>
                        <p className="text-xl font-bold font-heading text-white">{activeIndicatorData.items} Sesi</p>
                        <p className="text-[10px] text-slate-500 mt-1">Terlaksana minggu ini</p>
                      </div>
                      <div className="glass-card p-6 rounded-3xl border-white/5">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">Total Peserta</h5>
                        <p className="text-xl font-bold font-heading text-white">{activeIndicatorData.participants} Orang</p>
                        <p className="text-[10px] text-slate-500 mt-1">Staff medis & non-medis</p>
                      </div>
                      <div className="glass-card p-6 rounded-3xl border-white/5 bg-gradient-to-br from-purple-500/10 to-transparent">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-2">Unit Teraktif</h5>
                        <p className="text-xl font-bold font-heading text-white">{activeIndicatorData.top_unit}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Partisipasi tertinggi</p>
                      </div>
                    </>
                  )}
                  {view === 'isolasi' && (
                    <>
                      <div className="glass-card p-6 rounded-3xl border-white/5">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">Total Input Data</h5>
                        <p className="text-xl font-bold font-heading text-white">{activeIndicatorData.total} Entry</p>
                        <p className="text-[10px] text-slate-500 mt-1">Bulan berjalan</p>
                      </div>
                      <div className="glass-card p-6 rounded-3xl border-white/5">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">Kepatuhan Rata-rata</h5>
                        <p className="text-xl font-bold font-heading text-white">{activeIndicatorData.compliance}%</p>
                        <p className="text-[10px] text-slate-500 mt-1">Trend: {activeIndicatorData.trend}</p>
                      </div>
                      <div className="glass-card p-6 rounded-3xl border-white/5 bg-gradient-to-br from-blue-500/10 to-transparent">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">Status Audit</h5>
                        <p className="text-xl font-bold font-heading text-white">{activeIndicatorData.compliance >= 80 ? 'Verified' : 'Review Needed'}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Quality Assurance</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              )
            ) : (
              <div className="h-64 glass-card p-8 rounded-[2.5rem] border-white/5 border-dashed flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-4">
                  <Activity className="w-8 h-8 text-blue-500/40" />
                </div>
                <h3 className="text-lg font-bold text-slate-400 mb-2">Pilih Indikator Terlebih Dahulu</h3>
                <p className="text-xs text-slate-600 max-w-sm">Klik salah satu kartu indikator di atas untuk melihat detail laporan, grafik capaian, dan tabel data raw.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 11. Final Action / Info */}
      <div className="bg-navy-light/30 border border-white/5 rounded-[2rem] p-6 text-center">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">SMART-PPI Analytics System &copy; 2026</p>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .glass-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .text-gradient {
          background: linear-gradient(to right, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
}
