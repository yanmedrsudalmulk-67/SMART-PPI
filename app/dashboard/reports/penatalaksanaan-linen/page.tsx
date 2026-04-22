'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  Building2, 
  Trash2, 
  Filter,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

interface AuditLinen {
  id: string;
  tanggal_waktu: string;
  observer: string;
  unit: string;
  persentase: number;
  status_kepatuhan: string;
  jumlah_patuh: number;
  jumlah_dinilai: number;
  temuan: string;
  rekomendasi: string;
  dokumentasi: string;
  ttd_pj_ruangan: string;
  ttd_ipcn: string;
}

export default function PenatalaksanaanLinenReportPage() {
  const [data, setData] = useState<AuditLinen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnit, setFilterUnit] = useState('All');
  const [selectedAudit, setSelectedAudit] = useState<AuditLinen | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data: auditData, error } = await supabase
        .from('audit_penatalaksanaan_linen')
        .select('*')
        .order('tanggal_waktu', { ascending: false });

      if (error) throw error;
      if (auditData) setData(auditData);
    } catch (err) {
      console.error('Error fetching linen audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAudit = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data audit ini?')) return;
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('audit_penatalaksanaan_linen')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setData(prev => prev.filter(item => item.id !== id));
      if (selectedAudit?.id === id) setSelectedAudit(null);
    } catch (err) {
      console.error('Error deleting audit:', err);
      alert('Gagal menghapus data.');
    }
  };

  const filteredData = data.filter(item => {
    const matchesSearch = 
      item.observer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.unit.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = filterUnit === 'All' || item.unit === filterUnit;
    return matchesSearch && matchesUnit;
  });

  const units = ['All', ...Array.from(new Set(data.map(item => item.unit)))];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-navy-dark/50 backdrop-blur-md p-6 rounded-[2rem] border border-white/5">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/reports" className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-400 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight">Data Audit Penatalaksanaan Linen</h1>
            <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mt-1">Histori laporan kepatuhan pengelolaan linen</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20">
             <Download className="w-4 h-4" /> Export
           </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Cari observer atau unit..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-navy-light/50 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all"
          />
        </div>
        <div className="relative group">
          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <select 
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="w-full bg-navy-light/50 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white outline-none focus:border-blue-500/50 appearance-none transition-all"
          >
            {units.map(u => <option key={u} value={u} className="bg-navy-dark">{u === 'All' ? 'Semua Unit' : u}</option>)}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 uppercase tracking-[0.2em] text-[10px] font-bold text-slate-400">
                <th className="px-6 py-5">Tanggal & Waktu</th>
                <th className="px-6 py-5">Supervisor</th>
                <th className="px-6 py-5">Unit Kerja</th>
                <th className="px-6 py-5 text-center">Kepatuhan</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 animate-pulse">Memuat Data...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/10 rounded-lg text-blue-400">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{new Date(item.tanggal_waktu).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          <p className="text-[10px] text-slate-500 font-mono tracking-widest">{new Date(item.tanggal_waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-white">{item.observer}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-300">
                        {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <p className="text-lg font-heading font-extrabold text-blue-400">{item.persentase}%</p>
                       <p className="text-[9px] font-bold uppercase tracking-tighter text-slate-500">{item.jumlah_patuh}/{item.jumlah_dinilai} Item</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${
                        item.status_kepatuhan === 'Patuh' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 
                        item.status_kepatuhan === 'Cukup' ? 'bg-amber-600/20 text-amber-400 border border-amber-500/20' : 
                        'bg-red-600/20 text-red-400 border border-red-500/20'
                      }`}>
                        {item.status_kepatuhan}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedAudit(item)}
                          className="p-2.5 bg-white/5 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl transition-all border border-white/10 shadow-sm"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteAudit(item.id)}
                          className="p-2.5 bg-white/5 hover:bg-red-600 text-slate-400 hover:text-white rounded-xl transition-all border border-white/10 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedAudit && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAudit(null)}
              className="absolute inset-0 bg-navy-dark/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-navy-light border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 sm:p-8 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-blue-600 rounded-2xl shadow-lg glow-blue">
                     <FileSpreadsheet className="w-6 h-6 text-white" />
                   </div>
                   <div>
                     <h2 className="text-xl font-heading font-bold text-white tracking-tight">Detail Audit Linen</h2>
                     <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{selectedAudit.unit} | {new Date(selectedAudit.tanggal_waktu).toLocaleDateString()}</p>
                   </div>
                </div>
                <button onClick={() => setSelectedAudit(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-500 hover:text-white transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-8">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                   <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1 font-bold">Kepatuhan (%)</p>
                      <p className={`text-4xl font-heading font-extrabold ${selectedAudit.persentase >= 85 ? 'text-blue-400' : 'text-red-400'}`}>{selectedAudit.persentase}%</p>
                   </div>
                   <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1 font-bold">Status</p>
                      <p className={`text-xl font-bold uppercase tracking-widest font-heading mt-3 ${
                        selectedAudit.status_kepatuhan === 'Patuh' ? 'text-blue-400' : 
                        selectedAudit.status_kepatuhan === 'Cukup' ? 'text-amber-400' : 'text-red-400'
                      }`}>{selectedAudit.status_kepatuhan}</p>
                   </div>
                   <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1 font-bold">Observer</p>
                      <p className="text-sm font-bold text-white mt-3 truncate">{selectedAudit.observer}</p>
                   </div>
                   <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1 font-bold">Unit</p>
                      <p className="text-sm font-bold text-white mt-3">{selectedAudit.unit}</p>
                   </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 border-l-2 border-blue-600 pl-3">Temuan Lapangan</h3>
                      <div className="bg-white/5 rounded-2xl p-5 border border-white/5 font-medium text-slate-300 text-sm leading-relaxed min-h-[100px]">
                        {selectedAudit.temuan || 'Tidak ada catatan temuan.'}
                      </div>
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 border-l-2 border-amber-500 pl-3">Rekomendasi Rencana Tindak Lanjut</h3>
                      <div className="bg-white/5 rounded-2xl p-5 border border-white/5 font-medium text-slate-300 text-sm leading-relaxed min-h-[100px]">
                        {selectedAudit.rekomendasi || 'Tidak ada rekomendasi.'}
                      </div>
                   </div>
                </div>

                {selectedAudit.dokumentasi && (
                  <div className="space-y-4">
                     <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 border-l-2 border-blue-600 pl-3">Dokumentasi Visual</h3>
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {selectedAudit.dokumentasi.split(',').map((url, i) => (
                           <a key={i} href={url} target="_blank" rel="noreferrer" className="aspect-square bg-white/5 rounded-2xl overflow-hidden border border-white/10 group shadow-lg">
                             <img src={url} alt={`Documentation ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                           </a>
                        ))}
                     </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                   <div className="flex flex-col items-center gap-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Penanggung Jawab Ruangan</p>
                      <div className="w-full h-32 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden flex items-center justify-center p-2">
                         {selectedAudit.ttd_pj_ruangan ? (
                           <img src={selectedAudit.ttd_pj_ruangan} alt="Sign PJ" className="h-full object-contain invert brightness-200" />
                         ) : (
                           <span className="text-[10px] text-slate-700 italic">No Signature</span>
                         )}
                      </div>
                   </div>
                   <div className="flex flex-col items-center gap-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">IPCN / IPCLN</p>
                      <div className="w-full h-32 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden flex items-center justify-center p-2">
                        {selectedAudit.ttd_ipcn ? (
                           <img src={selectedAudit.ttd_ipcn} alt="Sign IPCN" className="h-full object-contain invert brightness-200" />
                         ) : (
                           <span className="text-[10px] text-slate-700 italic">No Signature</span>
                         )}
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
