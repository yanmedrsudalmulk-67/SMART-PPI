'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, Download, Calendar, Filter, Search, ArrowLeft, Printer, FileSpreadsheet, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

interface AuditData {
  id: string;
  tanggal_waktu: string;
  observer: string;
  unit: string;
  persentase: number;
  status_kepatuhan: string;
  jumlah_dinilai: number;
  jumlah_patuh: number;
}

export default function LaporanLimbahMedis() {
  const [data, setData] = useState<AuditData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnit, setFilterUnit] = useState('Semua Unit');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      const { data: results, error } = await supabase
        .from('audit_pengelolaan_limbah_medis')
        .select('id, tanggal_waktu, observer, unit, persentase, status_kepatuhan, jumlah_dinilai, jumlah_patuh')
        .order('tanggal_waktu', { ascending: false });
      
      if (error) throw error;
      if (results) setData(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => {
    const matchesSearch = item.observer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.unit.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = filterUnit === 'Semua Unit' || item.unit === filterUnit;
    return matchesSearch && matchesUnit;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data audit ini?')) return;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('audit_pengelolaan_limbah_medis').delete().eq('id', id);
      if (error) throw error;
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus data.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/reports" className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-bold text-gradient">Laporan Pengelolaan Limbah Medis</h1>
            <p className="text-xs text-slate-500">Arsip data kepatuhan pengelolaan limbah medis</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-300 hover:bg-white/10 transition-all">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/20 rounded-xl text-xs font-bold uppercase tracking-widest text-blue-400 hover:bg-blue-600 hover:text-white transition-all">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border-white/5 bg-navy-light/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Cari observer atau unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-navy-dark border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-blue-500/50"
            />
          </div>
        </div>
        <div className="glass-card p-4 rounded-2xl border-white/5 bg-navy-light/30">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select 
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="w-full bg-navy-dark border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-blue-500/50 appearance-none"
            >
              <option>Semua Unit</option>
              <option>IGD</option>
              <option>ICU</option>
              <option>IBS</option>
              <option>Ranap Aisyah</option>
              <option>Ranap Fatimah</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-[24px] border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Tanggal</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Observer</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Unit</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Nilai</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Memuat data...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Tidak ada data ditemukan.</td></tr>
              ) : filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-sm text-slate-300 font-medium">
                        {new Date(item.tanggal_waktu).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-200">{item.observer}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-200">{item.unit}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${item.persentase >= 85 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${item.persentase}%` }} />
                      </div>
                      <span className="text-sm font-bold text-white">{item.persentase}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                      item.status_kepatuhan === 'Patuh' ? 'bg-emerald-500/20 text-emerald-400' : 
                      item.status_kepatuhan === 'Cukup' ? 'bg-amber-500/20 text-amber-400' : 
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {item.status_kepatuhan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
