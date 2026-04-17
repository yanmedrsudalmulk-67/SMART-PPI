'use client';

import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Activity,
  Plus,
  FileSpreadsheet,
  Stethoscope,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const complianceData = [
  { name: 'Jan', hh: 82, apd: 85 },
  { name: 'Feb', hh: 84, apd: 86 },
  { name: 'Mar', hh: 83, apd: 88 },
  { name: 'Apr', hh: 86, apd: 89 },
  { name: 'Mei', hh: 88, apd: 91 },
  { name: 'Jun', hh: 89, apd: 90 },
  { name: 'Jul', hh: 91, apd: 93 },
];

const haisData = [
  { name: 'IGD', iadp: 0.1, isk: 0.2, vap: 0, ido: 0 },
  { name: 'ICU', iadp: 1.2, isk: 2.1, vap: 3.4, ido: 0 },
  { name: 'Melati', iadp: 0.5, isk: 1.1, vap: 0, ido: 0.8 },
  { name: 'OK', iadp: 0, isk: 0.5, vap: 0, ido: 1.5 },
];

export default function DashboardOverview() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-gradient">Dashboard Mutu PPI</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Ringkasan performa pencegahan infeksi RSUD Nasional</p>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all shadow-xl">
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            Export
          </button>
          <button className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
            <Plus className="w-4 h-4" />
            Audit Baru
          </button>
        </div>
      </div>

      {/* KPI Cards - Horizontal scroll on mobile */}
      <div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6 snap-x hide-scrollbar">
        {[
          { title: 'Kepatuhan Hand Hygiene', value: '89.4%', trend: '+2.1%', isUp: true, color: 'text-blue-400', glow: 'glow-blue' },
          { title: 'Kepatuhan APD', value: '92.1%', trend: '+1.5%', isUp: true, color: 'text-purple-400', glow: 'glow-purple' },
          { title: 'Bundle Compliance', value: '85.0%', trend: '-0.5%', isUp: false, color: 'text-amber-400', glow: '' },
          { title: 'HAIs Rate (Overall)', value: '1.2‰', trend: '-0.2‰', isUp: true, color: 'text-blue-400', glow: 'glow-blue' },
        ].map((kpi, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className={`glass-card p-6 min-w-[260px] sm:min-w-0 snap-center shrink-0 flex flex-col gap-4 rounded-[24px] hover:border-white/20 transition-all ${kpi.glow}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{kpi.title}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-heading font-bold text-white">{kpi.value}</h3>
              <div className={`flex items-center text-[10px] font-bold uppercase tracking-wider ${kpi.isUp ? 'text-blue-400' : 'text-red-400'}`}>
                {kpi.isUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {kpi.trend}
              </div>
            </div>
            <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
              <div className={`h-full bg-gradient-to-r from-blue-500 to-purple-600`} style={{ width: kpi.value.replace('%', '').replace('‰', '') + '%' }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Input HAIs', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Supervisi', icon: ShieldAlert, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Edukasi', icon: Stethoscope, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Laporan', icon: FileSpreadsheet, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((action, i) => (
          <button key={i} className="flex flex-col items-center justify-center p-6 glass-card rounded-[24px] border-white/5 hover:border-white/20 transition-all group">
            <div className={`w-12 h-12 rounded-2xl ${action.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner`}>
              <action.icon className={`w-6 h-6 ${action.color}`} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-white transition-colors">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Trend Chart */}
        <div className="glass-card p-8 rounded-[32px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-heading font-bold text-white tracking-wide">Tren Kepatuhan (7 Bulan)</h3>
            <select className="text-[10px] font-bold uppercase tracking-widest border-white/10 rounded-lg text-slate-400 bg-white/5 px-3 py-1.5 outline-none">
              <option>Tahun 2024</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={complianceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorApd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  labelStyle={{ fontSize: '10px', color: '#64748b', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '30px' }} />
                <Area type="monotone" dataKey="hh" name="Hand Hygiene (%)" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHh)" />
                <Area type="monotone" dataKey="apd" name="Kepatuhan APD (%)" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorApd)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HAIs Chart */}
        <div className="glass-card p-8 rounded-[32px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-heading font-bold text-white tracking-wide">Insiden HAIs per Unit (‰)</h3>
            <button className="text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">Lihat Detail</button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={haisData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '30px' }} />
                <Bar dataKey="iadp" name="IADP" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                <Bar dataKey="isk" name="ISK" stackId="a" fill="#6366f1" />
                <Bar dataKey="vap" name="VAP" stackId="a" fill="#8b5cf6" />
                <Bar dataKey="ido" name="IDO" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="relative p-8 rounded-[32px] glass-card border-blue-500/20 bg-gradient-to-br from-blue-600/10 to-purple-600/10 overflow-hidden">
        <div className="absolute top-[-50%] right-[-10%] w-[40%] h-[100%] bg-blue-500/10 blur-[100px] rounded-full" />
        <div className="flex items-start gap-6 relative z-10">
          <div className="bg-blue-600/20 p-4 rounded-2xl border border-blue-500/20 shadow-lg glow-blue">
            <AlertCircle className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-heading font-bold text-white mb-2 tracking-wide">SMART Recommendation</h3>
            <p className="text-sm text-slate-400 mb-6 font-medium">Berdasarkan analisa data minggu ini, sistem merekomendasikan:</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300 leading-relaxed"><strong>ICU:</strong> Rate VAP meningkat (3.4‰). Segera lakukan supervisi Bundle VAP dan edukasi ulang staf.</span>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300 leading-relaxed"><strong>IGD:</strong> Kepatuhan Hand Hygiene Momen 1 & 4 rendah. Pastikan ketersediaan handrub di setiap bed.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
