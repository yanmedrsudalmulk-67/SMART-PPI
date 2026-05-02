import React, { useState, useEffect, useMemo } from 'react';
import { getSupabase } from '@/lib/supabase';
import OfficialReportSheet from '@/components/reports/OfficialReportSheet';
import { 
  TrendingUp, Activity, Search, Calendar, ChevronDown, CheckCircle2, 
  XCircle, Filter, PieChart, BarChart2, TrendingDown, Target, List
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface GenericAuditData {
  id: string;
  tanggal_waktu?: string;
  waktu?: string;
  observer?: string;
  supervisor?: string;
  unit?: string;
  ruangan?: string;
  data_indikator?: Record<string, string | null>;
  checklist_json?: Record<string, string | null>;
  persentase: number;
  status_kepatuhan?: string;
  temuan?: string;
  rekomendasi?: string;
  foto?: string[];
  tanda_tangan_1?: string;
  tanda_tangan_2?: string;
  tanda_tangan?: string[];
}

export default function GenericAuditReport({ 
  tableName,
  indicatorItems,
  title,
  extraFilter,
  filters
}: { 
  tableName: string,
  indicatorItems: {id: string, label: string, key: string, isNegative?: boolean}[],
  title: string,
  extraFilter?: Record<string, string>,
  filters?: { dateRange?: { from: string; to: string }; unitFilter?: string; searchQuery?: string }
}) {
  const [data, setData] = useState<GenericAuditData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  
  const [periodFilter, setPeriodFilter] = useState<'bulanan' | 'triwulan' | 'semester' | 'tahunan'>('bulanan');
  const supabase = getSupabase();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let query = supabase.from(tableName).select('*');
      
      if (extraFilter) {
        query = query.match(extraFilter);
      }
      
      query = query.order('tanggal_waktu', { ascending: false });
      
      const { data: result, error } = await query;
      if (!error && result) {
        const normalized = result.map((item: any) => ({
          ...item,
          waktu: item.tanggal_waktu || item.waktu || item.created_at,
          checklist_json: item.checklist_json || item.data_indikator || item.checklist_data || {},
          persentase: item.persentase !== undefined ? item.persentase : (item.compliance_score !== undefined ? item.compliance_score : 0),
          tanda_tangan_1: item.tanda_tangan_1 || item.ttd_pj_ruangan || item.tanda_tangan?.[0],
          tanda_tangan_2: item.tanda_tangan_2 || item.ttd_ipcn || item.tanda_tangan?.[1],
          foto: item.foto || item.dokumentasi || []
        }));
        setData(normalized);
        if (normalized.length > 0) {
          setSelectedRecordId(normalized[0].id);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [tableName, extraFilter, supabase]);

  const { trendData, filteredRecords, summaryStats } = useMemo(() => {
    let filteredData = data;
    if (filters) {
      filteredData = data.filter(item => {
        // Date filtering
        if (filters.dateRange && filters.dateRange.from && filters.dateRange.to && item.waktu) {
           const itemDateStr = String(item.waktu || '').split('T')[0];
           if (itemDateStr < filters.dateRange.from || itemDateStr > filters.dateRange.to) {
             return false;
           }
        }
        // Unit filtering
        if (filters.unitFilter && filters.unitFilter !== 'Semua Unit') {
          if (item.unit !== filters.unitFilter && item.ruangan !== filters.unitFilter) return false;
        }
        // Search
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          if (!item.observer?.toLowerCase().includes(query) && 
              !item.unit?.toLowerCase().includes(query) &&
              !item.ruangan?.toLowerCase().includes(query)) {
            return false;
          }
        }
        return true;
      });
    }

    if (filteredData.length === 0) return { trendData: [], filteredRecords: [], summaryStats: { avg: 0, count: 0, high: 0, low: 0, trendMsg: 'Stabil' } };

    // Apply basic period logic
    // We group by period string
    const getGroupKey = (dStr: string) => {
        if(!dStr) return "Unknown";
        const date = new Date(dStr);
        const y = date.getFullYear();
        const m = date.getMonth();
        if(periodFilter === 'bulanan') return `${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"][m]} ${y}`;
        if(periodFilter === 'triwulan') return `TW${Math.floor(m/3)+1} ${y}`;
        if(periodFilter === 'semester') return `SM${Math.floor(m/6)+1} ${y}`;
        return `${y}`;
    };

    const periodMap = new Map<string, GenericAuditData[]>();
    filteredData.forEach(row => {
      const key = getGroupKey(row.waktu || '');
      if(!periodMap.has(key)) periodMap.set(key, []);
      periodMap.get(key)!.push(row);
    });

    const parsedKeys = Array.from(periodMap.keys());
    parsedKeys.reverse(); // simple chronological sort approximation since source is desc

    const trend = parsedKeys.map(k => {
       const recs = periodMap.get(k)!;
       const avg = recs.reduce((sum, r) => sum + r.persentase, 0) / recs.length;
       return { name: k, val: Math.round(avg) };
    });

    // Determine current filtered records based on the latest mapped period
    const currentPeriodKey = parsedKeys[parsedKeys.length - 1]; // latest
    const recordsInPeriod = periodMap.get(currentPeriodKey) || [];

    // Summary stats for the whole dataset based on period selected
    const allPerc = recordsInPeriod.map(r => r.persentase);
    const avg = allPerc.reduce((a,b)=>a+b,0) / (allPerc.length || 1);
    const high = Math.max(0, ...allPerc);
    const low = allPerc.length > 0 ? Math.min(...allPerc) : 0;
    
    // Auto select first record in the period if current selected isn't in it
    return { 
      trendData: trend, 
      filteredRecords: recordsInPeriod,
      summaryStats: {
        avg: Math.round(avg),
        count: recordsInPeriod.length,
        high,
        low,
        trendMsg: 'Naik'
      }
    };
  }, [data, periodFilter, filters]);

  // Sync selected record when period changes
  useEffect(() => {
    if (filteredRecords.length > 0 && !filteredRecords.find(r => r.id === selectedRecordId)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedRecordId(filteredRecords[0].id);
    }
  }, [filteredRecords, selectedRecordId]);

  const selectedRecord = data.find(r => r.id === selectedRecordId) || data[0];

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-20 animate-pulse">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!selectedRecord) {
    return (
       <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-slate-400 font-bold uppercase tracking-widest">
         Belum ada data untuk laporan ini.
       </div>
    );
  }

  return (
    <div className="space-y-12 pb-10">
      
      {/* BAGIAN 1: OFFICIAL REPORT SHEET DENGAN CHECKLIST */}
      {/* We add a dropdown to select WHICH audit is shown in the table */}
      <div className="relative">
        <div className="absolute -top-16 left-0 right-0 p-4 bg-white dark:bg-[#0f172a] rounded-t-3xl border border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm z-10 print:hidden">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <List className="w-5 h-5 text-blue-500" />
            <select 
               value={periodFilter} 
               onChange={(e: any) => setPeriodFilter(e.target.value)}
               className="bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white px-4 py-2 rounded-xl outline-none font-bold text-sm tracking-wider uppercase focus:border-blue-500 w-full md:w-auto"
            >
               <option value="bulanan" className="text-black">Bulanan</option>
               <option value="triwulan" className="text-black">Triwulan</option>
               <option value="semester" className="text-black">Semester</option>
               <option value="tahunan" className="text-black">Tahunan</option>
            </select>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">Pilih Data Audit:</span>
            <select 
               value={selectedRecordId || ''} 
               onChange={(e) => setSelectedRecordId(e.target.value)}
               className="bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-xl outline-none font-bold text-sm tracking-wider uppercase focus:border-blue-500 w-full md:w-auto truncate max-w-[250px]"
            >
               {filteredRecords.map((r, i) => (
                  <option key={r.id} value={r.id} className="text-black">
                    #{r.id.slice(0,5)} - {r.waktu ? format(parseISO(r.waktu), 'dd/MM/yyyy') : 'Unk'} ({r.unit || r.ruangan || 'NA'})
                  </option>
               ))}
               {filteredRecords.length === 0 && <option disabled>Tidak ada data di periode ini</option>}
            </select>
            <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 text-white dark:bg-blue-600 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg whitespace-nowrap">
              Print PDF
            </button>
          </div>
        </div>

        <div className="pt-8 md:pt-4 printable-container bg-white dark:bg-transparent rounded-b-2xl dark:rounded-none">
          {/* Using OfficialReportSheet directly, with modifications if needed, but it works standalone */}
          <OfficialReportSheet 
              data={{
                ...selectedRecord,
                persentase: selectedRecord.persentase || 0,
                temuan: selectedRecord.temuan,
                rekomendasi: selectedRecord.rekomendasi,
                foto: selectedRecord.foto,
                ttd_pj: selectedRecord.tanda_tangan_1,
                ttd_ipcn: selectedRecord.tanda_tangan_2
              } as any} 
              categories={[
                { 
                  id: 'all', 
                  title: 'STANDAR CHECKLIST PPI', 
                  items: indicatorItems.map(i => ({ id: i.key, label: i.label })) 
                }
              ]} 
              title={title.toUpperCase()} 
          />
        </div>
      </div>

      <div className="w-full h-px bg-slate-300 dark:bg-white/10 my-10 print:hidden" />

      {/* BAGIAN 2: CARD SUMMARY & GRAFIK (TAMPIL DI BAWAH TABEL) */}
      <div className="space-y-8 bg-slate-50 dark:bg-transparent p-6 rounded-3xl print:hidden border border-slate-200 dark:border-transparent">
        
        <div className="text-left">
           <h3 className="text-xl font-heading font-black text-slate-800 dark:text-white flex items-center gap-3">
             <BarChart2 className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Analitik & Tren 
             <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-white dark:bg-white/5 px-3 py-1 rounded-full border border-slate-200 dark:border-white/10">
               Periode {periodFilter}
             </span>
           </h3>
        </div>

        {/* Card Ringkasan Tepat di atas Grafik */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
             <div className="flex items-center justify-between mb-4">
               <TrendingUp className="w-5 h-5 text-blue-500" />
               <span className="text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md">Total</span>
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Jumlah Audit</p>
             <p className="text-3xl font-black text-slate-800 dark:text-white font-mono">{summaryStats.count}</p>
           </div>

           <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Target className="w-16 h-16 text-emerald-500" />
             </div>
             <div className="flex items-center justify-between mb-4 relative z-10">
               <Activity className="w-5 h-5 text-emerald-500" />
               <span className="text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md">Rerata</span>
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 relative z-10">Kepatuhan</p>
             <p className="text-3xl font-black text-slate-800 dark:text-emerald-400 font-mono relative z-10">{summaryStats.avg}%</p>
           </div>

           <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
             <div className="flex items-center justify-between mb-4">
               <TrendingUp className="w-5 h-5 text-purple-500" />
               <span className="text-[10px] font-bold uppercase bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-md">Max</span>
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Nilai Tertinggi</p>
             <p className="text-3xl font-black text-slate-800 dark:text-white font-mono">{summaryStats.high}%</p>
           </div>

           <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
             <div className="flex items-center justify-between mb-4">
               <TrendingDown className="w-5 h-5 text-rose-500" />
               <span className="text-[10px] font-bold uppercase bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-md">Min</span>
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Nilai Terendah</p>
             <p className="text-3xl font-black text-slate-800 dark:text-white font-mono">{summaryStats.low}%</p>
           </div>
        </div>

        {/* GRAFIK */}
        <div className="bg-white dark:bg-[#0f172a] p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-300">Trend Capaian</h4>
            <div className="flex bg-slate-100 dark:bg-white/5 rounded-xl p-1 border border-slate-200 dark:border-white/10">
              <button 
                onClick={() => setChartType('line')}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${chartType === 'line' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
              >
                Line
              </button>
              <button 
                onClick={() => setChartType('bar')}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${chartType === 'bar' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
              >
                Bar
              </button>
            </div>
          </div>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               {chartType === 'line' ? (
                 <AreaChart data={trendData}>
                   <defs>
                     <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
                     itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                   />
                   <Area type="monotone" dataKey="val" name="Kepatuhan (%)" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
                 </AreaChart>
               ) : (
                 <BarChart data={trendData} barSize={40}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
                     itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                   />
                   <Bar dataKey="val" name="Kepatuhan (%)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                 </BarChart>
               )}
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <style jsx global>{`
        :root {
          --chart-grid: #e2e8f0;
        }
        .dark {
          --chart-grid: rgba(255,255,255,0.05);
        }
      `}</style>

    </div>
  );
}
