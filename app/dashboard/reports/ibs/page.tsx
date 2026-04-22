'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  Filter, 
  Download, 
  FileText, 
  Table as TableIcon,
  ChevronRight,
  Eye,
  Trash2,
  CheckCircle2,
  X,
  Stethoscope,
  Clock,
  User,
  Activity,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getSupabase } from '@/lib/supabase';

export default function IBSReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      const { data: audits, error } = await supabase
        .from('audit_ruangan_ibs')
        .select('*')
        .order('waktu', { ascending: false });

      if (error) throw error;
      setData(audits || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => {
    const searchStr = searchTerm.toLowerCase();
    return (
      item.supervisor?.toLowerCase().includes(searchStr) ||
      item.status_audit?.toLowerCase().includes(searchStr)
    );
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('audit_ruangan_ibs').delete().eq('id', id);
      if (error) throw error;
      setData(prev => prev.filter(item => item.id !== id));
      if (selectedAudit?.id === id) setIsModalOpen(false);
    } catch (err) {
      console.error('Error deleting data:', err);
      alert('Gagal menghapus data.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/reports" className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all shadow-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-gradient">Laporan Raw Data Audit IBS</h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Instalasi Bedah Sentral • Mutu PPI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 text-blue-400 border border-emerald-500/20 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative group lg:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Cari berdasarkan supervisor atau status..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-medium placeholder:text-slate-600 shadow-inner"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer font-medium">
            <option className="bg-slate-900">Semua Waktu</option>
            <option className="bg-slate-900">Bulan Ini</option>
            <option className="bg-slate-900">Bulan Lalu</option>
          </select>
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer font-medium">
            <option className="bg-slate-900">Semua Status</option>
            <option className="bg-slate-900 text-emerald-400">Baik</option>
            <option className="bg-slate-900 text-amber-400">Cukup</option>
            <option className="bg-slate-900 text-red-400">Perlu Tindak Lanjut</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-card rounded-[2rem] border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Waktu Audit</th>
                <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Supervisor</th>
                <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Score</th>
                <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Status</th>
                <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw className="w-8 h-8 text-blue-500 animate-spin opacity-50" />
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Memuat Data Audit IBS...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <TableIcon className="w-12 h-12" />
                      <p className="text-xs font-bold uppercase tracking-[0.2em]">Belum ada data audit</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((audit) => (
                  <tr key={audit.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-none capitalize">
                            {format(new Date(audit.waktu), 'dd MMMM yyyy', { locale: id })}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1.5 font-mono">{format(new Date(audit.waktu), 'HH:mm')} WIB</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{audit.supervisor}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center justify-center px-3 py-1 bg-white/5 rounded-full border border-white/5">
                        <span className="text-sm font-black text-white font-mono">{audit.persentase}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full inline-block ${
                        audit.status_audit === 'Baik' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        audit.status_audit === 'Cukup' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {audit.status_audit}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedAudit(audit);
                            setIsModalOpen(true);
                          }}
                          className="p-2.5 bg-blue-600/10 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-lg active:scale-95"
                          title="Detail Audit"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(audit.id)}
                          className="p-2.5 bg-red-600/10 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95"
                          title="Hapus Data"
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

      {/* Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedAudit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-navy-dark border border-white/10 rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
                    <TableIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-wider">Detail Audit Ruangan IBS</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">ID Audit: {selectedAudit.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-white/[0.01]">
                {/* Info Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-white/5">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-2">
                       <Clock className="w-3 h-3 text-blue-400" /> Tanggal Audit
                     </p>
                     <p className="text-sm font-bold text-white">{format(new Date(selectedAudit.waktu), 'dd/MM/yyyy')}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-2">
                       <User className="w-3 h-3 text-blue-400" /> Supervisor
                     </p>
                     <p className="text-sm font-bold text-white truncate">{selectedAudit.supervisor}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-2">
                       <Activity className="w-3 h-3 text-blue-400" /> Kepatuhan
                     </p>
                     <p className="text-sm font-bold text-white">{selectedAudit.persentase}%</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-2">
                       <AlertTriangle className="w-3 h-3 text-blue-400" /> Status
                     </p>
                     <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        selectedAudit.status_audit === 'Baik' ? 'bg-emerald-500/20 text-emerald-400' :
                        selectedAudit.status_audit === 'Cukup' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                     }`}>
                       {selectedAudit.status_audit}
                     </span>
                  </div>
                </div>

                {/* Findings & Recommendations */}
                <div className="grid md:grid-cols-2 gap-6 pb-6 border-b border-white/5">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Temuan
                    </h4>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 min-h-[80px]">
                      <p className="text-sm text-slate-300 leading-relaxed italic">{selectedAudit.temuan || 'Tidak ada temuan.'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 flex items-center gap-2">
                      <Stethoscope className="w-3.5 h-3.5" /> Rekomendasi PPI
                    </h4>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 min-h-[80px]">
                      <p className="text-sm text-slate-300 leading-relaxed italic">{selectedAudit.rekomendasi || 'Tidak ada rekomendasi.'}</p>
                    </div>
                  </div>
                </div>

                {/* Results Summary */}
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Rangkuman Checklist
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-center justify-between">
                         <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Patuh (YA)</span>
                         <span className="text-xl font-black text-emerald-400 font-mono">{selectedAudit.patuh || 0}</span>
                      </div>
                      <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10 flex items-center justify-between">
                         <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Tidak Patuh</span>
                         <span className="text-xl font-black text-red-400 font-mono">{selectedAudit.tidak_patuh || 0}</span>
                      </div>
                      <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-center justify-between">
                         <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Total Dinilai</span>
                         <span className="text-xl font-black text-blue-400 font-mono">{selectedAudit.dinilai || 0}</span>
                      </div>
                   </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-white/5">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">PJ Ruangan IBS</p>
                    <div className="bg-white p-4 rounded-3xl h-40 flex items-center justify-center border border-white/10 shadow-lg">
                      {selectedAudit.ttd_pj ? (
                         // eslint-disable-next-line @next/next/no-img-element
                         <img src={selectedAudit.ttd_pj} alt="Tanda Tangan PJ" className="max-h-full" />
                      ) : (
                        <p className="text-xs text-slate-300 italic">Tanpa Tanda Tangan</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">IPCN / IPCLN</p>
                    <div className="bg-white p-4 rounded-3xl h-40 flex items-center justify-center border border-white/10 shadow-lg">
                      {selectedAudit.ttd_ipcn ? (
                         // eslint-disable-next-line @next/next/no-img-element
                         <img src={selectedAudit.ttd_ipcn} alt="Tanda Tangan IPCN" className="max-h-full" />
                      ) : (
                        <p className="text-xs text-slate-300 italic">Tanpa Tanda Tangan</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .text-gradient {
          background: linear-gradient(135deg, #fff 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .glass-card {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  );
}
