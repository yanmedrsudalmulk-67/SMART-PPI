'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2, ShieldAlert,
  ChevronRight, ChevronLeft, Upload, Edit3, Settings, Save, Trash2,
  Plus, GripVertical, BarChart2, LineChart, Activity, Droplets, Shield
} from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, ComposedChart, Line
} from 'recharts';

import Image from 'next/image';

// --- Types ---
interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  active: boolean;
  sort_order: number;
}

interface Standard {
  indikator: string;
  nilai_standar: number;
  operator: '>=' | '<=';
}

interface HaisData {
  phlebitis: number;
  isk: number;
  ido: number;
  vap: number;
}

interface RawDataPoint {
  id: string;
  created_at: string;
  ruangan?: string;
  unit?: string;
  jenis?: string;
  rate?: number;
  [key: string]: any;
}

// --- Default Data ---
const DEFAULT_SLIDES: Slide[] = [
  {
    id: 's1',
    title: 'SMART PPI Terpadu',
    subtitle: 'Pusat Pemantauan dan Pengendalian Infeksi UOBK RSUD AL-MULK. Mencegah lebih baik daripada mengobati.',
    image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1600',
    active: true,
    sort_order: 1
  },
  {
    id: 's2',
    title: 'Standar Keselamatan Pasien',
    subtitle: 'Mari tingkatkan kepatuhan Hand Hygiene dan penggunaan APD demi mewujudkan zero insiden.',
    image_url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=1600',
    active: true,
    sort_order: 2
  }
];

const DEFAULT_STANDARDS: Record<string, Standard> = {
  hh: { indikator: 'Hand Hygiene', nilai_standar: 85, operator: '>=' },
  apd: { indikator: 'Kepatuhan APD', nilai_standar: 100, operator: '>=' },
  phlebitis: { indikator: 'Phlebitis', nilai_standar: 1.5, operator: '<=' },
  isk: { indikator: 'ISK', nilai_standar: 5, operator: '<=' },
  ido: { indikator: 'IDO', nilai_standar: 2, operator: '<=' },
  vap: { indikator: 'VAP', nilai_standar: 5, operator: '<=' }
};

export default function DashboardOverview() {
  const [userRole, setUserRole] = useState('Guest');
  
  // Settings & DB State
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isSlidesLoading, setIsSlidesLoading] = useState(true);
  const [standards, setStandards] = useState(DEFAULT_STANDARDS);
  
  // Dashboard Core State
  const [activeTab, setActiveTab] = useState<'hh'|'apd'|'hais'>('hh');
  const [chartMode, setChartMode] = useState<'bar'|'line'>('bar');
  const [period, setPeriod] = useState<'bulanan'|'triwulan'|'semester'|'tahunan'>('bulanan');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [units, setUnits] = useState<string[]>(['all']);

  // Modals
  const [isSliderModalOpen, setIsSliderModalOpen] = useState(false);
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);

  // Stats Data
  const [stats, setStats] = useState({
    hh: 0,
    apd: 0,
    hais: { phlebitis: 0, isk: 0, ido: 0, vap: 0 } as HaisData,
  });
  const [chartDataList, setChartDataList] = useState<any[]>([]);

  // Load User Role
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole) setUserRole(storedRole);
    }
  }, []);

  // Initialization & Data Fetching
  useEffect(() => {
    let mounted = true;
    const loadDashboardData = async () => {
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase();

        // Parallelize all Supabase fetch requests for speed
        const [slidesRes, stdRes, hhRes, apdRes, haisRes] = await Promise.all([
          supabase.from('dashboard_slider').select('*').order('sort_order', { ascending: true }),
          supabase.from('dashboard_standards').select('*'),
          supabase.from('audit_hand_hygiene').select('*'),
          supabase.from('audit_apd').select('*'),
          supabase.from('insiden_hais').select('*')
        ]);

        // 1. Load Standards & Slides (Fallback to localStorage if missing)
        try {
          const dbSlides = slidesRes.data;
          if (dbSlides && dbSlides.length > 0) setSlides(dbSlides);
          else {
            const locSlides = localStorage.getItem('spp_slides');
            if (locSlides) setSlides(JSON.parse(locSlides));
            else setSlides(DEFAULT_SLIDES);
          }
        } catch(e) {
          const locSlides = localStorage.getItem('spp_slides');
          if (locSlides) setSlides(JSON.parse(locSlides));
          else setSlides(DEFAULT_SLIDES);
        } finally {
          setIsSlidesLoading(false);
        }
        
        try {
          const dbStd = stdRes.data;
          if (dbStd && dbStd.length > 0) {
             const stdObj = { ...DEFAULT_STANDARDS };
             dbStd.forEach(s => stdObj[s.indikator.toLowerCase()] = s);
             setStandards(stdObj);
          } else {
            const locStd = localStorage.getItem('spp_standards');
            if (locStd) setStandards(JSON.parse(locStd));
          }
        } catch(e) {}

        // 2. Extract Raw Audit Data
        const hhData = hhRes.data || [];
        const apdData = apdRes.data || [];
        const haisData = haisRes.data || [];

        // Extract Unique Units for Filter
        const unitSet = new Set<string>();
        [...(hhData||[]), ...(apdData||[])].forEach(d => {
          if (d.unit) unitSet.add(d.unit);
          if (d.ruangan) unitSet.add(d.ruangan);
        });
        setUnits(['all', ...Array.from(unitSet).sort()]);

        // Process Data With Filters
        const getGroupKey = (dateStr: string, pType: string) => {
          if(!dateStr) return "Unknown";
          const date = new Date(dateStr);
          const m = date.getMonth();
          const y = date.getFullYear();
          if (pType === "bulanan") return `${["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"][m]} ${y}`;
          if (pType === "triwulan") {
             const tw = Math.floor(m / 3);
             return `TW${tw + 1} (${["Jan, Feb, Mar", "Apr, Mei, Jun", "Jul, Ags, Sep", "Okt, Nov, Des"][tw]}) ${y}`;
          }
          if (pType === "semester") {
             const sm = Math.floor(m / 6);
             return `SM${sm + 1} (${["Jan s.d Jun", "Jul s.d Des"][sm]}) ${y}`;
          }
          return `${y} (Jan s.d Des)`;
        };

        const grouped: Record<string, any> = {};
        let totalHhPatuh = 0, totalHhPeluang = 0;
        let totalApdPatuh = 0, totalApdDinilai = 0;
        const totalHais = { phlebitis: 0, isk: 0, ido: 0, vap: 0 };

        const unitMatch = (d: any) => selectedUnit === 'all' || d.unit === selectedUnit || d.ruangan === selectedUnit;

        // HH Aggregate
        (hhData || []).filter(unitMatch).forEach(d => {
           const k = getGroupKey(d.created_at, period);
           if(!grouped[k]) grouped[k] = { hhPatuh:0, hhPel:0, apdPatuh:0, apdDin:0, hPhle:0, hIsk:0, hIdo:0, hVap:0 };
           grouped[k].hhPatuh += (d.patuh || 0);
           grouped[k].hhPel += (d.peluang || 0);
           totalHhPatuh += (d.patuh || 0); totalHhPeluang += (d.peluang || 0);
        });

        // APD Aggregate
        (apdData || []).filter(unitMatch).forEach(d => {
           const k = getGroupKey(d.created_at, period);
           if(!grouped[k]) grouped[k] = { hhPatuh:0, hhPel:0, apdPatuh:0, apdDin:0, hPhle:0, hIsk:0, hIdo:0, hVap:0 };
           grouped[k].apdPatuh += (d.jumlah_patuh || 0);
           grouped[k].apdDin += (d.jumlah_dinilai || 0);
           totalApdPatuh += (d.jumlah_patuh || 0); totalApdDinilai += (d.jumlah_dinilai || 0);
        });

        // HAIs Aggregate
        (haisData || []).filter(unitMatch).forEach(d => {
           const k = getGroupKey(d.created_at, period);
           if(!grouped[k]) grouped[k] = { hhPatuh:0, hhPel:0, apdPatuh:0, apdDin:0, hPhle:0, hIsk:0, hIdo:0, hVap:0 };
           const r = parseFloat(d.rate) || 0;
           const type = String(d.jenis).toLowerCase();
           if(type.includes('ph')) { grouped[k].hPhle += r; totalHais.phlebitis += r; }
           else if(type.includes('isk')) { grouped[k].hIsk += r; totalHais.isk += r; }
           else if(type.includes('ido')) { grouped[k].hIdo += r; totalHais.ido += r; }
           else if(type.includes('vap')) { grouped[k].hVap += r; totalHais.vap += r; }
        });

        // Sort keys
        const parseKeyToTime = (k: any) => {
          if (!k || typeof k !== 'string') return 0;
          try {
             // More robust split with extra fallback
             const parts = (k || "").toString().split(" ").filter(Boolean);
             if (parts.length === 0) return 0;

             if(period === 'bulanan') {
                const yearStr = parts[1] || "2000";
                const year = parseInt(yearStr);
                const monthName = parts[0] || "Jan";
                const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
                const monthIdx = months.indexOf(monthName);
                return new Date(isNaN(year) ? 2000 : year, monthIdx === -1 ? 0 : monthIdx).getTime();
             }
             if(period === 'triwulan') {
                 const yearMatch = k.match(/\d{4}$/);
                 const twMatch = k.match(/TW(\d)/);
                 return new Date(parseInt(yearMatch?.[0]||"2000"), (parseInt(twMatch?.[1]||"1")-1)*3).getTime();
             }
             if(period === 'semester') {
                 const yearMatch = k.match(/\d{4}$/);
                 const smMatch = k.match(/SM(\d)/);
                 return new Date(parseInt(yearMatch?.[0]||"2000"), (parseInt(smMatch?.[1]||"1")-1)*6).getTime();
             }
             const yearMatch = k.match(/^\d{4}/);
             return new Date(parseInt(yearMatch?.[0]||"2000"), 0).getTime();
          } catch(e) { 
             return 0; 
          }
        };

        const sortedKeys = Object.keys(grouped).sort((a,b) => parseKeyToTime(a)-parseKeyToTime(b));
        const finalChartData = sortedKeys.map(k => {
           const g = grouped[k];
           return {
              name: k,
              hh: g.hhPel > 0 ? Number(((g.hhPatuh / g.hhPel)*100).toFixed(1)) : 0,
              apd: g.apdDin > 0 ? Number(((g.apdPatuh / g.apdDin)*100).toFixed(1)) : 0,
              phlebitis: Number(g.hPhle.toFixed(2)), isk: Number(g.hIsk.toFixed(2)),
              ido: Number(g.hIdo.toFixed(2)), vap: Number(g.hVap.toFixed(2))
           }
        });

        if (mounted) {
          setStats({
            hh: totalHhPeluang > 0 ? Math.round((totalHhPatuh/totalHhPeluang)*100) : 0,
            apd: totalApdDinilai > 0 ? Math.round((totalApdPatuh/totalApdDinilai)*100) : 0,
            hais: totalHais
          });
          setChartDataList(finalChartData.length > 0 ? finalChartData : generateMockData(period));
        }
      } catch (e) {
        console.error("Dashboard error", e);
      }
    };
    loadDashboardData();
    return () => { mounted = false; };
  }, [period, selectedUnit]);

  const generateMockData = (p: string) => {
      const mockKeys: Record<string, string[]> = {
          "bulanan": ["Jan 2024", "Feb 2024", "Mar 2024"], 
          "triwulan": ["TW1 (Jan, Feb, Mar) 2024", "TW2 (Apr, Mei, Jun) 2024"], 
          "semester": ["SM1 (Jan s.d Jun) 2024", "SM2 (Jul s.d Des) 2024"], 
          "tahunan": ["2023 (Jan s.d Des)", "2024 (Jan s.d Des)"]
      };
      
      const keys = mockKeys[p] || [];
      return keys.map(m => ({ 
          name: m, 
          hh: 80 + Math.floor(Math.random()*15), 
          apd: 85 + Math.floor(Math.random()*10), 
          phlebitis: Number((Math.random()*2).toFixed(2)), isk: 0, ido: 0, vap: 0 
      }));
  };

  const isIpcn = userRole === 'IPCN' || userRole === 'Admin';

  // --- Sub-Components ---
  const HeroSlider = () => {
    const [idx, setIdx] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const visibleSlides = slides.filter(s => s.active);
    
    useEffect(() => {
      if(isPaused || visibleSlides.length <= 1) return;
      const timer = setInterval(() => {
         setIdx(p => (p + 1) % visibleSlides.length);
      }, 6000); // 6 seconds duration
      return () => clearInterval(timer);
    }, [isPaused, visibleSlides.length]);

    if (isSlidesLoading) return (
      <div className="relative w-full h-[300px] md:h-[420px] rounded-[32px] overflow-hidden shadow-2xl bg-[#0B1120] flex items-center justify-center border border-white/5">
         <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
    if(visibleSlides.length === 0) return null;

    return (
      <div 
        className="relative w-full h-[300px] md:h-[420px] rounded-[32px] overflow-hidden shadow-2xl bg-[#0B1120] group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <AnimatePresence mode="popLayout" custom={idx}>
          <motion.div
            key={idx}
            className="absolute inset-0 w-full h-full"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
               const swipe = offset.x;
               if (swipe < -50) setIdx(p => (p + 1) % visibleSlides.length);
               else if (swipe > 50) setIdx(p => (p - 1 + visibleSlides.length) % visibleSlides.length);
            }}
          >
            <Image src={visibleSlides[idx].image_url} alt="Slide" fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-[60px] md:bottom-20 px-6 flex flex-col justify-end items-start text-left text-white">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                className="text-lg md:text-xl font-heading font-bold leading-tight mb-2 !text-white drop-shadow-md"
              >
                {visibleSlides[idx].title}
              </motion.h1>
              <motion.p 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
                className="text-[12px] !text-white font-medium leading-relaxed max-w-xl text-left drop-shadow-md"
              >
                {visibleSlides[idx].subtitle}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="absolute bottom-6 w-full flex justify-between items-center px-8 z-10">
          <div className="flex gap-2">
            {visibleSlides.map((_, i) => (
               <button key={i} onClick={() => setIdx(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${idx === i ? 'bg-blue-500 w-10 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-white/30 w-3 hover:bg-white/50'}`}
               />
            ))}
          </div>
          <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
             <button onClick={() => setIdx(p => (p - 1 + visibleSlides.length) % visibleSlides.length)} className="w-10 h-10 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-white backdrop-blur-md hover:bg-blue-600 transition-colors">
               <ChevronLeft className="w-5 h-5" />
             </button>
             <button onClick={() => setIdx(p => (p + 1) % visibleSlides.length)} className="w-10 h-10 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-white backdrop-blur-md hover:bg-blue-600 transition-colors">
               <ChevronRight className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>
    );
  };

  const getStatusColor = (val: number, std: Standard) => {
     if(!std) return 'text-slate-400';
     const pass = std.operator === '>=' ? val >= std.nilai_standar : val <= std.nilai_standar;
     const warning = std.operator === '>=' ? val >= (std.nilai_standar - 5) : val <= (std.nilai_standar + 0.5);
     if (pass) return 'text-emerald-400';
     if (warning) return 'text-yellow-400';
     return 'text-red-500';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-2">
        <div>
          <h1 className="text-[30px] font-heading font-bold not-italic tracking-tight text-gradient drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">Dashboard SMART PPI</h1>
          <p className="text-[17px] md:text-[18px] text-slate-500 mt-2 font-medium flex flex-col md:block leading-relaxed w-full sm:tracking-normal">
            <span>Pencegahan dan Pengendalian Infeksi</span>
            <span className="md:ml-1">di UOBK RSUD AL-MULK Kota Sukabumi</span>
          </p>
        </div>
      </div>

      <HeroSlider />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: HH */}
        <div className="glass-card p-6 rounded-[24px] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Droplets className="w-24 h-24 text-blue-500" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Hand Hygiene</h3>
          </div>
          <div className="flex items-end gap-3 z-10 relative">
            <span className={`text-5xl font-heading font-black ${getStatusColor(stats.hh, standards.hh)} drop-shadow-[0_0_15px_currentColor]`}>
              {stats.hh}<span className="text-2xl">%</span>
            </span>
            <span className="text-[12px] font-semibold text-slate-500 mb-2">Standar : &gt; 85%</span>
          </div>
        </div>

        {/* Card 2: APD */}
        <div className="glass-card p-6 rounded-[24px] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Shield className="w-24 h-24 text-emerald-500" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Kepatuhan APD</h3>
          </div>
          <div className="flex items-end gap-3 z-10 relative">
            <span className={`text-5xl font-heading font-black ${getStatusColor(stats.apd, standards.apd)} drop-shadow-[0_0_15px_currentColor]`}>
              {stats.apd}<span className="text-2xl">%</span>
            </span>
            <span className="text-[12px] font-semibold text-slate-500 mb-2">Standar : 100%</span>
          </div>
        </div>

        {/* Card 3: HAIs 2x2 Grid */}
        <div className="glass-card p-6 rounded-[24px] border border-white/5 relative overflow-hidden group">
           <div className="flex justify-between items-start mb-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                 <AlertCircle className="w-5 h-5 text-red-400" />
               </div>
               <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Insiden Rate HAIs</h3>
             </div>
           </div>
           <div className="grid grid-cols-2 gap-4 z-10 relative">
              <div className="bg-white/5 p-3 rounded-xl">
                 <p className="text-[10px] uppercase text-slate-400 mb-1">Phlebitis</p>
                 <p className={`text-lg font-bold ${getStatusColor(stats.hais.phlebitis, standards.phlebitis)}`}>{stats.hais.phlebitis}‰</p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl">
                 <p className="text-[10px] uppercase text-slate-400 mb-1">ISK</p>
                 <p className={`text-lg font-bold ${getStatusColor(stats.hais.isk, standards.isk)}`}>{stats.hais.isk}‰</p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl">
                 <p className="text-[10px] uppercase text-slate-400 mb-1">IDO</p>
                 <p className={`text-lg font-bold ${getStatusColor(stats.hais.ido, standards.ido)}`}>{stats.hais.ido}%</p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl">
                 <p className="text-[10px] uppercase text-slate-400 mb-1">VAP</p>
                 <p className={`text-lg font-bold ${getStatusColor(stats.hais.vap, standards.vap)}`}>{stats.hais.vap}‰</p>
              </div>
           </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="glass-card rounded-[32px] overflow-hidden border border-white/5 mt-8">
         <div className="p-6 md:p-8 bg-white/[0.02] border-b border-white/5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-wrap gap-2 md:gap-4">
               {[ { id: 'hh', label: 'Hand Hygiene', icon: Droplets, c: 'text-blue-400' }, 
                  { id: 'apd', label: 'Penggunaan APD', icon: Shield, c: 'text-emerald-400' }, 
                  { id: 'hais', label: 'Insiden HAIs', icon: AlertCircle, c: 'text-red-400' }
               ].map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                     className={`px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === t.id ? `bg-white/10 ${t.c} shadow-inner border border-white/10` : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                  >
                     <t.icon className="w-4 h-4" /> {t.label}
                  </button>
               ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
               <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="bg-white/5 border border-white/10 text-slate-300 text-xs font-bold font-mono rounded-lg px-3 py-2 outline-none focus:border-blue-500">
                 {units.map(u => <option key={u} value={u} className="bg-slate-900">{u === 'all' ? 'SEMUA UNIT' : u.toUpperCase()}</option>)}
               </select>
               <select value={period} onChange={(e) => setPeriod(e.target.value as any)} className="bg-white/5 border border-white/10 text-slate-300 text-xs font-bold uppercase rounded-lg px-3 py-2 outline-none focus:border-blue-500">
                 <option value="bulanan" className="bg-slate-900">Bulanan</option>
                 <option value="triwulan" className="bg-slate-900">Triwulan</option>
                 <option value="semester" className="bg-slate-900">Semester</option>
                 <option value="tahunan" className="bg-slate-900">Tahunan</option>
               </select>
               <div className="flex bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                 <button onClick={() => setChartMode('bar')} className={`p-2 transition-colors ${chartMode === 'bar' ? 'bg-blue-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}><BarChart2 className="w-4 h-4" /></button>
                 <button onClick={() => setChartMode('line')} className={`p-2 transition-colors ${chartMode === 'line' ? 'bg-blue-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}><LineChart className="w-4 h-4" /></button>
               </div>
               {isIpcn && (
                 <button onClick={() => setIsSettingModalOpen(true)} className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 rounded-lg transition-colors border border-blue-500/30">
                   <Settings className="w-4 h-4" />
                 </button>
               )}
            </div>
         </div>

         <div className="p-6 md:p-8 h-[400px]">
           <ResponsiveContainer width="100%" height="100%">
             {chartMode === 'bar' ? (
               <ComposedChart data={chartDataList}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, activeTab==='hais'?'auto':100]} />
                 <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                 <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                 
                 {activeTab === 'hh' && <Bar dataKey="hh" name="Capaian (%)" fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={50} />}
                 {activeTab === 'apd' && <Bar dataKey="apd" name="Capaian (%)" fill="#10b981" radius={[4,4,0,0]} maxBarSize={50} />}
                 {activeTab === 'hais' && (
                   <>
                     <Bar dataKey="phlebitis" name="Phlebitis (‰)" fill="#f43f5e" radius={[4,4,0,0]} />
                     <Bar dataKey="isk" name="ISK (‰)" fill="#eab308" radius={[4,4,0,0]} />
                     <Bar dataKey="ido" name="IDO (%)" fill="#8b5cf6" radius={[4,4,0,0]} />
                     <Bar dataKey="vap" name="VAP (‰)" fill="#f97316" radius={[4,4,0,0]} />
                   </>
                 )}
                 {activeTab !== 'hais' && (
                    <Line type="step" dataKey={() => standards[activeTab]?.nilai_standar || 0} stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Standar" />
                 )}
               </ComposedChart>
             ) : (
               <AreaChart data={chartDataList}>
                 <defs>
                   <linearGradient id="hhGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                   <linearGradient id="apdGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, activeTab==='hais'?'auto':100]} />
                 <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                 <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                 
                 {activeTab === 'hh' && <Area type="monotone" dataKey="hh" name="Capaian (%)" stroke="#3b82f6" strokeWidth={3} fill="url(#hhGrad)" />}
                 {activeTab === 'apd' && <Area type="monotone" dataKey="apd" name="Capaian (%)" stroke="#10b981" strokeWidth={3} fill="url(#apdGrad)" />}
                 {activeTab === 'hais' && (
                   <>
                     <Line type="monotone" dataKey="phlebitis" name="Phlebitis (‰)" stroke="#f43f5e" strokeWidth={2} />
                     <Line type="monotone" dataKey="isk" name="ISK (‰)" stroke="#eab308" strokeWidth={2} />
                     <Line type="monotone" dataKey="ido" name="IDO (%)" stroke="#8b5cf6" strokeWidth={2} />
                     <Line type="monotone" dataKey="vap" name="VAP (‰)" stroke="#f97316" strokeWidth={2} />
                   </>
                 )}
               </AreaChart>
             )}
           </ResponsiveContainer>
         </div>
      </div>

      {/* IPCN Settings Modal */}
      <AnimatePresence>
        {isSettingModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col">
               <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                 <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2"><Settings className="w-5 h-5 text-emerald-400" /> Target Standar PPI</h2>
                 <button onClick={() => setIsSettingModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">Tutup</button>
               </div>
               <div className="p-6 space-y-4">
                 {Object.keys(standards).map(key => (
                   <div key={key} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                     <div>
                       <p className="text-xs font-bold uppercase text-slate-300">{standards[key].indikator}</p>
                       <p className="text-[10px] text-slate-500 font-mono">Operator: {standards[key].operator}</p>
                     </div>
                     <div className="flex items-center gap-2">
                       <input 
                         type="number" step="0.1" 
                         value={standards[key].nilai_standar}
                         onChange={e => setStandards({...standards, [key]: { ...standards[key], nilai_standar: parseFloat(e.target.value) || 0 }})}
                         className="w-20 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-right text-white font-bold font-mono outline-none focus:border-emerald-500"
                       />
                       <span className="text-xs text-slate-500">{key==='phlebitis' || key==='isk' || key==='vap' ? '‰' : '%'}</span>
                     </div>
                   </div>
                 ))}
               </div>
               <div className="p-6 border-t border-white/5 bg-black/50 text-right">
                  <button onClick={() => { localStorage.setItem('spp_standards', JSON.stringify(standards)); setIsSettingModalOpen(false); }} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition-all shadow-lg shadow-emerald-500/20">Simpan Standar</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
