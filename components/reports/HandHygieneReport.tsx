import React, { useState, useEffect, useMemo } from 'react';
import { getSupabase } from '@/lib/supabase';
import { 
  TrendingUp, Activity, Search, Calendar, ChevronDown, CheckCircle2, 
  XCircle, Filter, PieChart, BarChart2, TrendingDown, Target, List, Download, Printer, Target as TargetIcon, User, Building2, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, ReferenceLine
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useAppContext } from '@/components/providers';

export default function HandHygieneReport({ 
  filters 
}: { 
  filters: { dateRange: { from: string, to: string }, unitFilter: string, searchQuery: string } 
}) {
  const { hospitalLogoUrl } = useAppContext();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [periodFilter, setPeriodFilter] = useState<'harian' | 'mingguan' | 'bulanan' | 'triwulan' | 'semester' | 'tahunan'>('bulanan');
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [professionsOpen, setProfessionsOpen] = useState(false);
  const supabase = getSupabase();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let query = supabase.from('audit_hand_hygiene').select('*').order('start_time', { ascending: false });
      
      const { data: result, error } = await query;
      if (!error && result) {
        setData(result);
      }
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  // Frontend filtering
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Date filtering (basic)
      if (filters.dateRange && filters.dateRange.from && filters.dateRange.to && item.start_time) {
        const itemDateStr = String(item.start_time || '').split('T')[0];
        if (itemDateStr < filters.dateRange.from || itemDateStr > filters.dateRange.to) {
          return false;
        }
      }
      // Unit filtering
      if (filters.unitFilter && filters.unitFilter !== 'Semua Unit') {
        if (item.unit !== filters.unitFilter) return false;
      }
      // Profession filtering (Multi-select)
      if (selectedProfessions.length > 0) {
        if (!item.profesi || !selectedProfessions.includes(item.profesi.trim().toUpperCase())) {
          return false;
        }
      }
      // Search
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!item.observer?.toLowerCase().includes(query) && 
            !item.unit?.toLowerCase().includes(query) &&
            !item.profesi?.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [data, filters, selectedProfessions]);

  // Get unique professions for filter
  const allProfessions = useMemo(() => {
    const standardProfs = [
      "DOKTER", 
      "DOKTER SPESIALIS", 
      "PERAWAT", 
      "BIDAN", 
      "ANALIS LABORATORIUM", 
      "RADIOGRAFER", 
      "PRAMUSAJI"
    ];
    const profs = new Set<string>(standardProfs);
    data.forEach(item => {
      if (item.profesi) profs.add(item.profesi.trim().toUpperCase());
    });
    return Array.from(profs).sort();
  }, [data]);

  const { trendData, summaryStats, momentStats } = useMemo(() => {
    if (filteredData.length === 0) return { 
      trendData: [], 
      summaryStats: { avg: 0, count: 0, high: 0, low: 0, patuh: 0, peluang: 0 },
      momentStats: { m1: 0, m2: 0, m3: 0, m4: 0, m5: 0 }
    };

    // Grouping by period
    const getGroupKey = (dStr: string) => {
        if(!dStr) return "Unknown";
        const date = new Date(dStr);
        const y = date.getFullYear();
        const m = date.getMonth();
        const d = date.getDate();
        if(periodFilter === 'harian') return `${d} ${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"][m]}`;
        if(periodFilter === 'bulanan') return `${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"][m]} ${y}`;
        if(periodFilter === 'triwulan') return `TW${Math.floor(m/3)+1} ${y}`;
        if(periodFilter === 'semester') return `SM${Math.floor(m/6)+1} ${y}`;
        return `${y}`;
    };

    const periodMap = new Map<string, any[]>();
    filteredData.forEach(row => {
      const key = getGroupKey(row.start_time || '');
      if(!periodMap.has(key)) periodMap.set(key, []);
      periodMap.set(key, [...(periodMap.get(key) || []), row]);
    });

    const parsedKeys = Array.from(periodMap.keys());
    parsedKeys.reverse(); // simple chronological sort approximation

    const trend = parsedKeys.map(k => {
       const recs = periodMap.get(k)!;
       const avg = recs.reduce((sum, r) => sum + (r.persentase || 0), 0) / recs.length;
       return { name: k, val: Math.round(avg) };
    });

    const allPerc = filteredData.map(r => r.persentase || 0);
    const avg = allPerc.reduce((a,b)=>a+b,0) / (allPerc.length || 1);
    const high = Math.max(0, ...allPerc);
    const low = allPerc.length > 0 ? Math.min(...allPerc) : 0;
    
    let totalPatuh = 0;
    let totalPeluang = 0;
    
    const mStats = { m1: {p:0, t:0}, m2: {p:0, t:0}, m3: {p:0, t:0}, m4: {p:0, t:0}, m5: {p:0, t:0} };

    filteredData.forEach(r => {
      totalPatuh += (r.patuh || 0);
      totalPeluang += (r.peluang || 0);
      
      const moments = ['m1', 'm2', 'm3', 'm4', 'm5'] as const;
      moments.forEach(m => {
        if (r[m] === 'hr' || r[m] === 'hw') { mStats[m].p++; mStats[m].t++; }
        else if (r[m] === 'miss') { mStats[m].t++; }
      });
    });

    const momentPercentages = {
      m1: mStats.m1.t > 0 ? Math.round((mStats.m1.p / mStats.m1.t) * 100) : 0,
      m2: mStats.m2.t > 0 ? Math.round((mStats.m2.p / mStats.m2.t) * 100) : 0,
      m3: mStats.m3.t > 0 ? Math.round((mStats.m3.p / mStats.m3.t) * 100) : 0,
      m4: mStats.m4.t > 0 ? Math.round((mStats.m4.p / mStats.m4.t) * 100) : 0,
      m5: mStats.m5.t > 0 ? Math.round((mStats.m5.p / mStats.m5.t) * 100) : 0,
    };

    return { 
      trendData: trend, 
      summaryStats: {
        avg: Math.round(avg),
        count: filteredData.length,
        high,
        low,
        patuh: totalPatuh,
        peluang: totalPeluang
      },
      momentStats: momentPercentages
    };
  }, [filteredData, periodFilter]);

  const mapMomentAction = (val: string | null) => {
    if (val === 'hr') return <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-bold text-[9px]">Handrub</span>;
    if (val === 'hw') return <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded font-bold text-[9px]">Handwash</span>;
    if (val === 'miss') return <span className="px-2 py-1 bg-rose-50 text-rose-700 rounded font-bold text-[9px]">Tdk HH</span>;
    if (val === 'na') return <span className="px-2 py-1 bg-slate-200 text-force-black rounded font-bold text-[9px]">N/A</span>;
    return <span className="text-force-black">-</span>;
  };

  const mapMomentText = (val: string | null) => {
    if (val === 'hr') return 'Handrub';
    if (val === 'hw') return 'Handwash';
    if (val === 'miss') return 'Tidak HH';
    if (val === 'na') return 'N/A';
    return '-';
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-20 animate-pulse">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-10">

      {/* HEADER LAPORAN / PRINT SECTION */}
      <div className="bg-force-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-2xl relative" id="print-area">
        <div className="p-8 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 print:border-slate-300 bg-force-white">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 flex-shrink-0 border rounded-xl flex items-center justify-center overflow-hidden backdrop-blur-md transition-colors duration-500 bg-white shadow-md p-2`}>
              {hospitalLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hospitalLogoUrl} alt="Logo RS" className="w-full h-full object-contain" />
              ) : (
                <ShieldCheck className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black text-force-black uppercase tracking-tight">LAPORAN MONITORING KEPATUHAN KEBERSIHAN TANGAN</h2>
              <p className="text-sm font-bold text-force-black uppercase tracking-widest">UOBK RSUD AL-MULK KOTA SUKABUMI</p>
            </div>
          </div>
        </div>

        {/* TABEL DATA */}
        <div className="overflow-x-auto print:overflow-visible bg-force-white">
          <table className="w-full min-w-[600px] text-center border-collapse print:text-[9px] bg-force-white text-force-black">
            <thead>
              <tr className="bg-force-white text-[9px] font-bold uppercase tracking-widest text-force-black border-b border-slate-300">
                <th className="px-3 py-3 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap bg-force-white text-force-black">Waktu Mulai</th>
                <th className="px-3 py-3 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap bg-force-white text-force-black">Waktu Selesai</th>
                <th className="px-3 py-3 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap bg-force-white text-force-black">Observer</th>
                <th className="px-3 py-3 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap bg-force-white text-force-black">Unit / Ruangan</th>
                <th className="px-3 py-3 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap bg-force-white text-force-black">Profesi</th>
                <th className="px-2 py-3 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap bg-force-white text-force-black" title="Sebelum kontak dengan pasien">M1</th>
                <th className="px-2 py-3 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap bg-force-white text-force-black" title="Sebelum melakukan tindakan aseptik">M2</th>
                <th className="px-2 py-3 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap bg-force-white text-force-black" title="Sesudah menyentuh cairan tubuh pasien">M3</th>
                <th className="px-2 py-3 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap bg-force-white text-force-black" title="Sesudah kontak dengan pasien">M4</th>
                <th className="px-2 py-3 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap bg-force-white text-force-black" title="Sesudah menyentuh lingkungan pasien">M5</th>
                <th className="px-2 py-3 text-center border-r border-slate-200 print:border-slate-300 whitespace-normal min-w-[60px] bg-force-white text-force-black">JUMLAH<br/>PATUH</th>
                <th className="px-2 py-3 text-center border-r border-slate-200 print:border-slate-300 whitespace-normal min-w-[70px] bg-force-white text-force-black">PELUANG<br/>HAND HYGIENE</th>
                <th className="px-3 py-3 text-center whitespace-nowrap bg-force-white text-force-black">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[9px] text-force-black bg-force-white relative z-10">
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={13} className="text-center py-10 font-bold uppercase tracking-widest text-force-black">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              )}
              {filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors text-force-black bg-force-white">
                  <td className="px-3 py-2 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap text-force-black">{row.start_time ? format(parseISO(row.start_time), 'dd/MM/yyyy HH:mm') : '-'}</td>
                  <td className="px-3 py-2 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap text-force-black">{row.end_time ? format(parseISO(row.end_time), 'dd/MM/yyyy HH:mm') : '-'}</td>
                  <td className="px-3 py-2 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap text-force-black">{row.observer || '-'}</td>
                  <td className="px-3 py-2 text-center border-r border-slate-200 print:border-slate-300 text-force-black whitespace-nowrap">{row.unit || '-'}</td>
                  <td className="px-3 py-2 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap text-force-black">{row.profesi || '-'}</td>
                  
                  {/* Moments */}
                  <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap">
                    <span className="print:hidden">{mapMomentAction(row.m1)}</span>
                    <span className="hidden print:inline text-[9px] text-force-black">{mapMomentText(row.m1)}</span>
                  </td>
                  <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap">
                    <span className="print:hidden">{mapMomentAction(row.m2)}</span>
                    <span className="hidden print:inline text-[9px] text-force-black">{mapMomentText(row.m2)}</span>
                  </td>
                  <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap">
                    <span className="print:hidden">{mapMomentAction(row.m3)}</span>
                    <span className="hidden print:inline text-[9px] text-force-black">{mapMomentText(row.m3)}</span>
                  </td>
                  <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap">
                    <span className="print:hidden">{mapMomentAction(row.m4)}</span>
                    <span className="hidden print:inline text-[9px] text-force-black">{mapMomentText(row.m4)}</span>
                  </td>
                  <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap">
                    <span className="print:hidden">{mapMomentAction(row.m5)}</span>
                    <span className="hidden print:inline text-[9px] text-force-black">{mapMomentText(row.m5)}</span>
                  </td>
                  
                  <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-300 font-mono font-black">{row.patuh || 0}</td>
                  <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-300 font-mono font-black">{row.peluang || 0}</td>
                  <td className="px-3 py-2 text-center font-bold whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-md text-[9px] ${
                      (row.persentase || 0) >= 85 ? 'bg-emerald-100 text-emerald-800' :
                      (row.persentase || 0) >= 70 ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {row.persentase || 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Keterangan Momen - Print only or small footer */}
        <div className="p-4 bg-slate-50 flex flex-wrap gap-x-8 gap-y-2 text-[9px] text-force-black font-bold font-black">
          <p><strong>M1:</strong> Sebelum kontak pasien</p>
          <p><strong>M2:</strong> Sebelum tindakan aseptik</p>
          <p><strong>M3:</strong> Setelah terkena cairan tubuh</p>
          <p><strong>M4:</strong> Setelah kontak pasien</p>
          <p><strong>M5:</strong> Setelah kontak lingkungan pasien</p>
        </div>
      </div>

      {/* REKAP PER MOMENT */}
      <h3 className="text-xl font-heading font-black text-slate-800 dark:text-white pt-4 px-2 print:hidden">Rekapitulasi 5 Momen</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 print:hidden">
        {Object.entries(momentStats).map(([moment, perc], idx) => (
          <div key={moment} className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className={`absolute top-0 left-0 w-1 h-full ${perc >= 85 ? 'bg-emerald-500' : perc >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`} />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Moment {idx + 1}</h4>
            <div className="flex items-baseline gap-1 mb-3">
              <p className="text-4xl font-black text-slate-800 dark:text-white font-mono tracking-tighter">{perc}</p>
              <span className="text-lg font-bold text-slate-400">%</span>
            </div>
            
            <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 ${perc >= 85 ? 'bg-emerald-500' : perc >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                 style={{ width: `${perc}%` }}
               />
            </div>
          </div>
        ))}
      </div>

      {/* GRAFIK CAPAIAN REALTIME */}
      <div className="bg-white dark:bg-[#0f172a] p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-500" /> Capaian Kepatuhan Hand Hygiene
            </h3>
            <p className="text-xs text-slate-500 mt-1">Membandingkan capaian periode <span className="font-bold text-slate-700 dark:text-slate-300">{periodFilter}</span> dengan Standar PPI 85%</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 bg-slate-100 dark:bg-white/5 rounded-xl p-1 border border-slate-200 dark:border-white/10 shadow-inner">
            <div className="relative">
              <button 
                onClick={() => setProfessionsOpen(!professionsOpen)}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer min-w-[140px] hover:bg-white dark:hover:bg-white/5 rounded-lg transition-colors border border-transparent active:border-emerald-500/30"
              >
                <User className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                  {selectedProfessions.length === 0 ? 'Semua Profesi' : 
                   selectedProfessions.length === 1 ? selectedProfessions[0] : 
                   `${selectedProfessions.length} Profesi`}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 ml-auto transition-transform duration-300 ${professionsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {professionsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 p-2 overflow-hidden"
                  >
                    <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                      <button 
                        onClick={() => {
                          setSelectedProfessions([]);
                          setProfessionsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors ${selectedProfessions.length === 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                      >
                        Semua Profesi
                      </button>
                      <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />
                      {allProfessions.map(prof => (
                        <button 
                          key={prof}
                          onClick={() => {
                            setSelectedProfessions(prev => 
                              prev.includes(prof) ? prev.filter(p => p !== prof) : [...prev, prof]
                            );
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center justify-between ${selectedProfessions.includes(prof) ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                        >
                          {prof}
                          {selectedProfessions.includes(prof) && <CheckCircle2 className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                    {selectedProfessions.length > 0 && (
                      <div className="p-2 pt-1 border-t border-slate-100 dark:border-white/5 mt-1">
                        <button 
                          onClick={() => setProfessionsOpen(false)}
                          className="w-full py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-tighter hover:bg-emerald-700 transition-colors"
                        >
                          Terapkan ({selectedProfessions.length})
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-6 bg-slate-300 dark:bg-white/10 mx-1" />

            <select 
              value={periodFilter}
              onChange={(e: any) => setPeriodFilter(e.target.value)}
              className="px-3 py-2 bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="harian" className="text-slate-900">Harian</option>
              <option value="mingguan" className="text-slate-900">Mingguan</option>
              <option value="bulanan" className="text-slate-900">Bulanan</option>
              <option value="triwulan" className="text-slate-900">Triwulan</option>
              <option value="semester" className="text-slate-900">Semester</option>
              <option value="tahunan" className="text-slate-900">Tahunan</option>
            </select>
            <div className="w-px h-6 bg-slate-300 dark:bg-white/10 mx-1" />
            <div className="flex gap-1">
              <button onClick={() => setChartType('line')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${chartType === 'line' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'}`}>Line</button>
              <button onClick={() => setChartType('bar')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${chartType === 'bar' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'}`}>Bar</button>
            </div>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                   <linearGradient id="colorValH" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                />
                <ReferenceLine y={85} label={{ position: 'top', value: 'Standar PPI (85%)', fill: '#ef4444', fontSize: 10, fontWeight: 'black', textAnchor: 'middle' }} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={2} />
                <Area type="monotone" dataKey="val" name="Capaian (%)" stroke="#10b981" strokeWidth={4} fill="url(#colorValH)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
              </AreaChart>
            ) : (
              <BarChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                  cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
                />
                <ReferenceLine y={85} label={{ position: 'top', value: 'Standar PPI (85%)', fill: '#ef4444', fontSize: 10, fontWeight: 'black', textAnchor: 'middle' }} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={2} />
                <Bar dataKey="val" name="Capaian (%)" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={60} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
