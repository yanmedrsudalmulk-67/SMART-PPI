'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  Beaker, 
  User, 
  Droplet, 
  Calendar, 
  Clock, 
  Building2, 
  Stethoscope,
  TrendingUp,
  Target
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine
} from 'recharts';
import { getSupabase } from '@/lib/supabase';

const MomenCard = ({ title, subtitle, momen, icon: Icon, color, data }: any) => {
  const patuh = data ? data[momen]?.patuh : 0;
  const peluang = data ? data[momen]?.peluang : 0;
  const persentase = peluang > 0 ? Math.round((patuh / peluang) * 100) : 0;
  
  const colorMap: any = {
    'blue': { text: 'text-blue-500', bg: 'bg-blue-500/10', shadow: 'bg-blue-500' },
    'purple': { text: 'text-purple-500', bg: 'bg-purple-500/10', shadow: 'bg-purple-500' },
    'rose': { text: 'text-rose-500', bg: 'bg-rose-500/10', shadow: 'bg-rose-500' },
    'emerald': { text: 'text-emerald-500', bg: 'bg-emerald-500/10', shadow: 'bg-emerald-500' },
    'amber': { text: 'text-amber-500', bg: 'bg-amber-500/10', shadow: 'bg-amber-500' },
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  return (
    <div className="glass-card p-6 rounded-2xl border-white/5 relative overflow-hidden group min-h-[160px] flex flex-col justify-between">
      <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] rounded-full -z-10 ${selectedColor.shadow} opacity-20 group-hover:opacity-40 transition-opacity`} />
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${selectedColor.bg} ${selectedColor.text}`}>
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase">{title}</h3>
        </div>
        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{subtitle}</p>
      </div>
      
      <div className="mt-4">
        <div className="flex items-end justify-between mb-2">
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-heading font-bold ${persentase >= 85 ? 'text-blue-400' : persentase >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
              {persentase}%
            </span>
          </div>
          <p className="text-[10px] font-bold text-white">{patuh}/{peluang}</p>
        </div>
        
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${persentase}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className={`h-full rounded-full ${persentase >= 85 ? 'bg-blue-500' : persentase >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
          />
        </div>
      </div>
    </div>
  );
};

export default function HandHygieneReport({ selectedDate, period, unitFilter }: any) {
  const [data, setData] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const supabase = getSupabase();
        
        let query = supabase.from('audit_hand_hygiene').select('*');
        
        if (unitFilter && unitFilter !== 'Semua Unit') {
          query = query.eq('unit', unitFilter);
        }

        // Apply time filter based on period
        const date = new Date(selectedDate);
        if (period === 'Harian') {
          const formattedDate = date.toISOString().split('T')[0];
          query = query.gte('start_time', `${formattedDate}T00:00:00Z`)
                       .lte('start_time', `${formattedDate}T23:59:59Z`);
        } else if (period === 'Bulanan') {
          const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
          const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();
          query = query.gte('start_time', firstDay).lte('start_time', lastDay);
        } else if (period === 'Triwulan') {
          const quarter = Math.floor(date.getMonth() / 3);
          const firstDay = new Date(date.getFullYear(), quarter * 3, 1).toISOString();
          const lastDay = new Date(date.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59).toISOString();
          query = query.gte('start_time', firstDay).lte('start_time', lastDay);
        } else if (period === 'Tahunan') {
          const firstDay = new Date(date.getFullYear(), 0, 1).toISOString();
          const lastDay = new Date(date.getFullYear(), 11, 31, 23, 59, 59).toISOString();
          query = query.gte('start_time', firstDay).lte('start_time', lastDay);
        }
        
        const { data: fetchedRecords, error } = await query.order('start_time', { ascending: false });
        if (error) throw error;
        
        setRecords(fetchedRecords || []);

        const agg: Record<string, { patuh: number, peluang: number }> = {
          m1: { patuh: 0, peluang: 0 },
          m2: { patuh: 0, peluang: 0 },
          m3: { patuh: 0, peluang: 0 },
          m4: { patuh: 0, peluang: 0 },
          m5: { patuh: 0, peluang: 0 },
          total: { patuh: 0, peluang: 0 }
        };

        if (fetchedRecords) {
          fetchedRecords.forEach(row => {
            const processMomen = (m: string) => {
              const val = row[m];
              if (val === 'hr' || val === 'hw') { agg[m].patuh++; agg[m].peluang++; }
              else if (val === 'miss') { agg[m].peluang++; }
            };
            
            processMomen('m1');
            processMomen('m2');
            processMomen('m3');
            processMomen('m4');
            processMomen('m5');
            
            agg.total.patuh += row.patuh || 0;
            agg.total.peluang += row.peluang || 0;
          });
        }
        
        setData(agg);
      } catch (err) {
        console.error("Error fetching HH report:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [unitFilter, period, selectedDate]);

  const runChartData = useMemo(() => {
    if (!records.length) return [];

    // Group by Month or Week or Day depending on view
    // For Run Chart as requested (Triwulan, Tahunan), group by Month
    const monthlyData: Record<string, { patuh: number, peluang: number }> = {};
    
    records.forEach(row => {
      const date = new Date(row.start_time);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = { patuh: 0, peluang: 0 };
      }
      
      monthlyData[key].patuh += row.patuh || 0;
      monthlyData[key].peluang += row.peluang || 0;
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    return Object.entries(monthlyData)
      .map(([key, val]) => {
        const [year, monthIdx] = key.split('-');
        return {
          name: `${monthNames[parseInt(monthIdx) - 1]} ${year}`,
          compliance: val.peluang > 0 ? Math.round((val.patuh / val.peluang) * 100) : 0,
          standard: 85, // Kemenkes Standard
          sortKey: key
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [records]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Activity className="w-12 h-12 text-blue-500 animate-pulse" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Memuat Data Laporan...</p>
      </div>
    );
  }

  const totalPersen = data && data.total.peluang > 0 
    ? Math.round((data.total.patuh / data.total.peluang) * 100) 
    : 0;

  const getMomenBadge = (val: string) => {
    if (val === 'hr') return <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[9px] font-bold">HR</span>;
    if (val === 'hw') return <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[9px] font-bold">HW</span>;
    if (val === 'miss') return <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-bold">MISS</span>;
    return <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 text-[9px] font-bold">NA</span>;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      {/* Top Capaian Card */}
      <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <motion.circle 
              cx="40" cy="40" r="36" fill="transparent" 
              stroke={totalPersen >= 85 ? '#3b82f6' : totalPersen >= 70 ? '#f59e0b' : '#ef4444'} 
              strokeWidth="8" 
              strokeDasharray={2 * Math.PI * 36}
              strokeDashoffset={2 * Math.PI * 36 - (totalPersen / 100) * (2 * Math.PI * 36)}
              strokeLinecap="round"
              initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 36 - (totalPersen / 100) * (2 * Math.PI * 36) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-heading font-bold text-white">{totalPersen}%</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Capaian</span>
          </div>
        </div>
        
        <div className="space-y-4 flex-1">
          <div>
            <h2 className="text-2xl font-bold font-heading text-white tracking-tight flex items-center gap-3">
              <Activity className="w-6 h-6 text-blue-400" /> Kepatuhan Kebersihan Tangan
            </h2>
            <p className="text-slate-400 mt-1 max-w-xl text-[13px] leading-relaxed">
              Hasil audit kepatuhan terhadap 5 Momen Kebersihan Tangan sesuai standar World Health Organization (WHO) dan Kementerian Kesehatan.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 shadow-inner">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Peluang</p>
              <p className="text-xl font-bold text-slate-200">{data?.total.peluang}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 shadow-inner">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Dilakukan</p>
              <p className="text-xl font-bold text-emerald-400">{data?.total.patuh}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 shadow-inner">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Tidak Patuh</p>
              <p className="text-xl font-bold text-rose-400">{data ? data.total.peluang - data.total.patuh : 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Moments Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MomenCard 
          title="Momen 1" 
          subtitle="Sebelum kontak dengan pasien"
          momen="m1" icon={User} color="blue" data={data} 
        />
        <MomenCard 
          title="Momen 2" 
          subtitle="Sebelum tindakan aseptik"
          momen="m2" icon={Beaker} color="purple" data={data} 
        />
        <MomenCard 
          title="Momen 3" 
          subtitle="Setelah kontak dengan cairan tubuh pasien"
          momen="m3" icon={Droplet} color="rose" data={data} 
        />
        <MomenCard 
          title="Momen 4" 
          subtitle="Setelah kontak dengan pasien"
          momen="m4" icon={User} color="emerald" data={data} 
        />
        <MomenCard 
          title="Momen 5" 
          subtitle="Setelah kontak dengan lingkungan pasien"
          momen="m5" icon={Activity} color="amber" data={data} 
        />
      </div>

      {/* Run Chart Section - Visible for Triwulan, Tahunan */}
      {(period === 'Triwulan' || period === 'Tahunan' || period === 'Semester') && runChartData.length > 0 && (
        <div className="glass-card p-8 rounded-[2.5rem] border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-heading font-bold text-white flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-blue-400" /> Run Chart Capaian Kepatuhan
              </h3>
              <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold">Tren Kepatuhan vs Standar Kemenkes (85%)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capaian</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-t-2 border-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Standar (85%)</span>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={runChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}
                />
                <ReferenceLine y={85} stroke="#10b981" strokeDasharray="5 5" label={{ position: 'right', value: 'Std 85%', fill: '#10b981', fontSize: 10, fontWeight: 'bold' }} />
                <Line 
                  type="monotone" 
                  dataKey="compliance" 
                  name="Kepatuhan"
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Table Section */}
      <div className="glass-card p-0 rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-heading font-bold text-white flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-400" /> Detail Data Audit
            </h3>
            <p className="text-slate-500 text-[11px] mt-1 font-bold uppercase tracking-widest">Daftar Pengisian Audit Hand Hygiene</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-blue-400 border border-white/5">
              {records.length} Audit Ditemukan
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">No</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Tanggal & Waktu</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Observer</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Unit</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Profesi</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">M1</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">M2</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">M3</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">M4</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">M5</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Patuh</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Peluang</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Hasil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {records.map((row, idx) => (
                <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-200">{new Date(row.start_time).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span className="text-[10px] text-slate-500">{new Date(row.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <User className="w-3 h-3 text-blue-400" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">{row.observer || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3 h-3 text-slate-500" />
                      <span className="text-xs font-bold text-slate-200">{row.unit || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-200">{row.profesi || '-'}</td>
                  <td className="px-4 py-4 text-center">{getMomenBadge(row.m1)}</td>
                  <td className="px-4 py-4 text-center">{getMomenBadge(row.m2)}</td>
                  <td className="px-4 py-4 text-center">{getMomenBadge(row.m3)}</td>
                  <td className="px-4 py-4 text-center">{getMomenBadge(row.m4)}</td>
                  <td className="px-4 py-4 text-center">{getMomenBadge(row.m5)}</td>
                  <td className="px-6 py-4 text-right text-xs font-bold text-emerald-400 tabular-nums">{row.patuh || 0}</td>
                  <td className="px-6 py-4 text-right text-xs font-bold text-slate-400 tabular-nums">{row.peluang || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-xs font-black font-heading tabular-nums ${
                      (row.persentase || 0) >= 85 ? 'text-blue-400' : (row.persentase || 0) >= 70 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {row.persentase || 0}%
                    </span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-20">
                      <Calendar className="w-10 h-10 text-slate-500" />
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Tidak ada data untuk periode ini</p>
                    </div>
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

