'use client';

import { useState } from 'react';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Filter,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

const unitCompliance = [
  { name: 'IGD', hh: 85, apd: 90 },
  { name: 'ICU', hh: 92, apd: 95 },
  { name: 'Melati', hh: 78, apd: 82 },
  { name: 'Mawar', hh: 88, apd: 85 },
  { name: 'OK', hh: 96, apd: 98 },
  { name: 'Poli', hh: 80, apd: 85 },
];

const haisTypeData = [
  { name: 'IADP', value: 15 },
  { name: 'ISK', value: 45 },
  { name: 'VAP', value: 25 },
  { name: 'IDO', value: 15 },
];

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-gradient">Analitik Mutu</h1>
          <p className="text-sm text-slate-500 mt-1">Analisa mendalam data PPI Rumah Sakit</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Grid Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Kepatuhan per Unit */}
        <div className="sleek-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading font-bold text-navy-dark">Kepatuhan per Unit</h3>
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitCompliance} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={60} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="hh" name="Hand Hygiene (%)" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="apd" name="APD (%)" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Proporsi Jenis HAIs */}
        <div className="sleek-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading font-bold text-navy-dark">Proporsi Jenis HAIs</h3>
            <PieChartIcon className="w-5 h-5 text-slate-400" />
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={haisTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {haisTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 600 }}
                />
                <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap/Table Placeholder */}
        <div className="sleek-card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading font-bold text-navy-dark">Heatmap Risiko Unit</h3>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-3 text-[11px] uppercase text-text-muted border-b border-bg-gray">Unit</th>
                  <th className="py-3 text-[11px] uppercase text-text-muted border-b border-bg-gray">Risk Score</th>
                  <th className="py-3 text-[11px] uppercase text-text-muted border-b border-bg-gray">Kepatuhan HH</th>
                  <th className="py-3 text-[11px] uppercase text-text-muted border-b border-bg-gray">Kepatuhan APD</th>
                  <th className="py-3 text-[11px] uppercase text-text-muted border-b border-bg-gray">HAIs Rate</th>
                  <th className="py-3 text-[11px] uppercase text-text-muted border-b border-bg-gray">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3.5 border-b border-bg-gray font-medium text-navy-dark">ICU</td>
                  <td className="py-3.5 border-b border-bg-gray"><span className="text-red-600 font-bold">High (8.5)</span></td>
                  <td className="py-3.5 border-b border-bg-gray text-emerald-600">92%</td>
                  <td className="py-3.5 border-b border-bg-gray text-emerald-600">95%</td>
                  <td className="py-3.5 border-b border-bg-gray text-red-600">6.7‰</td>
                  <td className="py-3.5 border-b border-bg-gray"><span className="px-2 py-1 bg-red-100 text-red-700 rounded text-[11px] font-semibold">Perlu Supervisi</span></td>
                </tr>
                <tr>
                  <td className="py-3.5 border-b border-bg-gray font-medium text-navy-dark">IGD</td>
                  <td className="py-3.5 border-b border-bg-gray"><span className="text-amber-600 font-bold">Medium (5.2)</span></td>
                  <td className="py-3.5 border-b border-bg-gray text-amber-600">85%</td>
                  <td className="py-3.5 border-b border-bg-gray text-emerald-600">90%</td>
                  <td className="py-3.5 border-b border-bg-gray text-emerald-600">0.3‰</td>
                  <td className="py-3.5 border-b border-bg-gray"><span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[11px] font-semibold">Monitoring</span></td>
                </tr>
                <tr>
                  <td className="py-3.5 border-b border-bg-gray font-medium text-navy-dark">OK</td>
                  <td className="py-3.5 border-b border-bg-gray"><span className="text-emerald-600 font-bold">Low (2.1)</span></td>
                  <td className="py-3.5 border-b border-bg-gray text-emerald-600">96%</td>
                  <td className="py-3.5 border-b border-bg-gray text-emerald-600">98%</td>
                  <td className="py-3.5 border-b border-bg-gray text-amber-600">1.5‰</td>
                  <td className="py-3.5 border-b border-bg-gray"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[11px] font-semibold">Aman</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
