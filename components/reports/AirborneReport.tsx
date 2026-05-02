'use client';

import { useState, useEffect, useMemo } from 'react';
import { getSupabase } from '@/lib/supabase';
import { 
  TrendingUp, Activity, Search, AlertCircle, CheckCircle2, Wind
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface AirborneData {
  id: string;
  waktu: string;
  supervisor: string;
  ruangan: string;
  checklist_json: { id: string, label: string, value: 'ya' | 'tidak' | 'na' }[];
  persentase: number;
}

export default function AirborneReport({ 
  filters 
}: { 
  filters: { dateRange: { from: string; to: string }; unitFilter: string; searchQuery: string } 
}) {
  const [data, setData] = useState<AirborneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const supabase = getSupabase();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let query = supabase.from('penempatan_pasien_airbone').select('*').order('waktu', { ascending: false });
      
      const { data: result, error } = await query;
      if (!error && result) {
        setData(result);
      }
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      let match = true;
      // Unit filter (penempatan airborne uses 'ruangan' or we can treat as unit)
      // For this specific report, units might be different but let's assume it belongs to the unit selected
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        match = match && (item.supervisor?.toLowerCase().includes(q) || item.ruangan?.toLowerCase().includes(q));
      }
      if (filters.dateRange.from && filters.dateRange.to) {
         const itemDate = new Date(item.waktu).getTime();
         const from = new Date(filters.dateRange.from).getTime();
         const to = new Date(filters.dateRange.to).getTime() + 86400000;
         match = match && (itemDate >= from && itemDate <= to);
      }
      return match;
    });
  }, [data, filters]);

  const { overallCompliance, itemStats, trendData } = useMemo(() => {
    if (filteredData.length === 0) return { overallCompliance: 0, itemStats: [], trendData: [] };
    
    let totalPerc = 0;
    let counts: Record<string, {p: number, t: number, label: string}> = {};
    
    const trendMap: Record<string, { date: string, patuh: number, total: number }> = {};

    filteredData.forEach(row => {
      totalPerc += row.persentase || 0;

      if (row.checklist_json) {
         row.checklist_json.forEach(item => {
             if (!counts[item.id]) counts[item.id] = { p: 0, t: 0, label: item.label };
             if (item.value === 'ya') {
                counts[item.id].p++;
                counts[item.id].t++;
             } else if (item.value === 'tidak') {
                counts[item.id].t++;
             }
         });
      }

      if (row.waktu) {
        const d = new Date(row.waktu);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        if (!trendMap[key]) trendMap[key] = { date: key, patuh: 0, total: 0 };
        trendMap[key].patuh += row.persentase || 0;
        trendMap[key].total += 1;
      }
    });

    const getPerc = (p: number, t: number) => t === 0 ? 0 : Math.round((p / t) * 100);

    const sortedTrend = Object.values(trendMap).sort((a,b) => a.date.localeCompare(b.date)).map(i => ({
      name: format(parseISO(i.date), 'dd MMM', { locale: idLocale }),
      val: Math.round(i.patuh / i.total)
    }));
    
    const finalItemStats = Object.keys(counts).map(k => ({
        id: k,
        label: counts[k].label,
        val: getPerc(counts[k].p, counts[k].t)
    }));

    return {
      overallCompliance: Math.round(totalPerc / filteredData.length),
      itemStats: finalItemStats,
      trendData: sortedTrend.slice(-14)
    };
  }, [filteredData]);

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 glass-card p-8 rounded-[2.5rem] border-white/5 flex flex-col items-center justify-center h-64 animate-pulse">
             <div className="w-32 h-32 rounded-full bg-slate-700/50 mb-4" />
             <div className="w-24 h-4 rounded-full bg-slate-700/50" />
          </div>
          <div className="lg:col-span-3 glass-card p-6 h-64 rounded-[2.5rem] border-white/5 animate-pulse flex flex-col justify-end gap-2 pb-8">
             <div className="w-full flex items-end gap-4 h-full px-8">
                {[40, 70, 45, 90, 65, 50, 80].map((h, i) => <div key={i} className="flex-1 bg-slate-700/50 rounded-t-md" style={{ height: `${h}%` }} />)}
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Capaian Card */}
        <div className="lg:col-span-1 glass-card p-8 rounded-[2.5rem] border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/20 blur-[80px] rounded-full" />
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-6 relative z-10">Kepatuhan Penempatan</h4>
          <div className="relative w-32 h-32 flex items-center justify-center mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <motion.circle 
                cx="40" cy="40" r="36" fill="transparent" stroke={overallCompliance < 60 ? '#f43f5e' : overallCompliance < 80 ? '#f59e0b' : '#3b82f6'} strokeWidth="8" 
                strokeDasharray={2 * Math.PI * 36}
                strokeDashoffset={2 * Math.PI * 36 - (overallCompliance / 100) * (2 * Math.PI * 36)}
                strokeLinecap="round"
                initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 36 - (overallCompliance / 100) * (2 * Math.PI * 36) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-heading font-bold text-white">
                {overallCompliance}%
              </span>
            </div>
          </div>
          <p className={`text-[10px] font-bold uppercase tracking-widest relative z-10 ${
            overallCompliance < 60 ? 'text-rose-400' : overallCompliance < 80 ? 'text-amber-400' : 'text-blue-400'
          }`}>
            {overallCompliance < 60 ? 'Perlu Perbaikan' : overallCompliance < 80 ? 'Cukup' : 'Baik'}
          </p>
        </div>

        {/* Trend Chart */}
        <div className="lg:col-span-3 glass-card p-8 rounded-[2.5rem] border-white/5 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-heading font-bold text-white flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-400" /> Tren Kepatuhan Airborne
            </h3>
            <div className="flex bg-white/5 rounded-xl p-1 gap-1">
              <button 
                onClick={() => setChartType('line')}
                className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${chartType === 'line' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                Line
              </button>
              <button 
                onClick={() => setChartType('bar')}
                className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${chartType === 'bar' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                Bar
              </button>
            </div>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  <Line type="monotone" dataKey="val" name="Kepatuhan %" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                </LineChart>
              ) : (
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                  <Bar dataKey="val" name="Kepatuhan %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {itemStats.map((m, idx) => (
          <div key={idx} className="glass-card p-5 rounded-3xl border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 leading-tight h-10 line-clamp-2" title={m.label}>{m.label}</h5>
            <p className="text-2xl font-bold font-heading text-white">{m.val}%</p>
            <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className={`h-full ${m.val < 60 ? 'bg-rose-500' : m.val < 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: m.val + '%' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Audit Table */}
      <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5">
          <h3 className="text-lg font-bold text-white mb-1">Riwayat Monitoring Airborne</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Listing {filteredData.length} records</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="bg-white/2 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-white/5">
                <th className="px-6 py-5">No</th>
                <th className="px-6 py-5">Tanggal</th>
                <th className="px-6 py-5">Supervisor</th>
                <th className="px-6 py-5">Ruangan</th>
                <th className="px-6 py-5 text-center">Hasil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/2 text-xs">
              {filteredData.map((row, idx) => (
                <tr key={row.id} className="hover:bg-white/2 transition-colors group">
                  <td className="px-6 py-4 text-slate-500 font-mono">{idx + 1}</td>
                  <td className="px-6 py-4 font-bold text-slate-300">
                    {row.waktu ? format(parseISO(row.waktu), 'dd/MM/yyyy HH:mm') : '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-300">{row.supervisor}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-slate-400 uppercase tracking-widest text-[9px]">
                        {row.ruangan}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      row.persentase < 60 ? 'bg-rose-500/10 text-rose-400' : row.persentase < 80 ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {row.persentase || 0}%
                    </span>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
