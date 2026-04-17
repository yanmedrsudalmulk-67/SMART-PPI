'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Download, 
  Edit2, 
  Trash2,
  TrendingUp,
  Activity,
  Building2
} from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

const surveilansTypes = [
  { id: 'phlebitis', title: 'Phlebitis' },
  { id: 'isk', title: 'ISK' },
  { id: 'ido', title: 'IDO' },
  { id: 'vap', title: 'VAP' },
];

export default function SurveilansInputPage() {
  const router = useRouter();
  const [activeType, setActiveType] = useState('phlebitis');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const [data, setData] = useState([
    { id: 1, tanggal: '2026-04-14', nama: 'Budi Santoso', rm: 'RM-001234', jenis: 'Phlebitis', jmlPemasangan: 10, jmlInsiden: 1 },
    { id: 2, tanggal: '2026-04-13', nama: 'Siti Aminah', rm: 'RM-001235', jenis: 'Phlebitis', jmlPemasangan: 8, jmlInsiden: 0 },
  ]);

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2 sticky top-16 bg-slate-50/90 backdrop-blur-md py-4 z-10 -mx-4 px-4 sm:mx-0 sm:px-0">
        <Link href="/dashboard/input" className="p-2 bg-white rounded-full shadow-sm border border-gray-200 text-text-muted hover:text-navy-dark transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-gradient">Surveilans HAIs</h1>
          <p className="text-xs text-text-muted">Pilih jenis insiden untuk input data</p>
        </div>
      </div>

      {/* Mini Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="sleek-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted font-medium">Total Kasus Bulan Ini</p>
            <p className="text-2xl font-bold text-navy-dark">12 <span className="text-xs font-normal text-text-muted">kasus</span></p>
          </div>
        </div>
        <div className="sleek-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted font-medium">Grafik Trend (Rate)</p>
            <p className="text-2xl font-bold text-navy-dark">0.2‰ <span className="text-xs font-normal text-emerald-600">↓ 0.1%</span></p>
          </div>
        </div>
        <div className="sleek-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted font-medium">Unit Terbanyak</p>
            <p className="text-2xl font-bold text-navy-dark">IGD <span className="text-xs font-normal text-text-muted">5 kasus</span></p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar gap-2">
        {surveilansTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setActiveType(type.id)}
            className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              activeType === type.id 
                ? 'bg-primary text-white shadow-md' 
                : 'bg-white text-text-muted border border-gray-200 hover:border-primary hover:text-primary'
            }`}
          >
            {type.title}
          </button>
        ))}
      </div>

      {/* Table Section */}
      <div className="sleek-card overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari pasien / RM..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-teal-600 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Tambah Data
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-text-muted">
                <th className="pb-3 font-semibold">No</th>
                <th className="pb-3 font-semibold">Tanggal</th>
                <th className="pb-3 font-semibold">Nama Pasien</th>
                <th className="pb-3 font-semibold">No RM</th>
                <th className="pb-3 font-semibold">Jml Pemasangan</th>
                <th className="pb-3 font-semibold">Jml Insiden</th>
                <th className="pb-3 font-semibold">% Rate</th>
                <th className="pb-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {data.map((row, i) => {
                const rate = row.jmlPemasangan > 0 ? ((row.jmlInsiden / row.jmlPemasangan) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 text-text-muted">{i + 1}</td>
                    <td className="py-4 font-medium text-navy-dark">{row.tanggal}</td>
                    <td className="py-4 font-semibold text-navy-dark">{row.nama}</td>
                    <td className="py-4 text-text-muted">{row.rm}</td>
                    <td className="py-4">{row.jmlPemasangan}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-bold ${row.jmlInsiden > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {row.jmlInsiden}
                      </span>
                    </td>
                    <td className="py-4 font-bold text-navy-dark">{rate}%</td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.length === 0 && (
            <div className="py-12 text-center text-text-muted text-sm">
              Belum ada data untuk bulan ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
