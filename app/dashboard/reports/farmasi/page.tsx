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
  RefreshCw,
  Home,
  Thermometer,
  Zap,
  Droplets,
  BookOpen,
  ClipboardCheck,
  ShieldCheck,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getSupabase } from '@/lib/supabase';

export default function FarmasiReportPage() {
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
        .from('audit_farmasi')
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
      (item.persentase?.toString().includes(searchStr))
    );
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('audit_farmasi').delete().eq('id', id);
      if (error) throw error;
      setData(prev => prev.filter(item => item.id !== id));
      if (selectedAudit?.id === id) setIsModalOpen(false);
    } catch (err) {
      console.error('Error deleting data:', err);
      alert('Gagal menghapus data.');
    }
  };

  const getStatus = (persentase: number) => {
    if (persentase >= 85) return { label: 'Baik', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
    if (persentase >= 70) return { label: 'Cukup', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
    return { label: 'Perlu Tindak Lanjut', color: 'bg-red-500/10 text-red-400 border border-red-500/20' };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 mt-4 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/reports" className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all shadow-lg active:scale-95">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-gradient">Audit Farmasi</h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Laporan Raw Data Audit Kepatuhan Instalasi Farmasi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95">
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
            placeholder="Cari berdasarkan supervisor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-medium placeholder:text-slate-600 shadow-inner"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer font-medium">
            <option className="bg-slate-900">Semua Waktu</option>
            <option className="bg-slate-900">Bulan Ini</option>
            <option className="bg-slate-900">Bulan Lalu</option>
          </select>
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer font-medium text-blue-400">
            <option className="bg-slate-900">Semua Status</option>
            <option className="bg-slate-900 text-emerald-400">Baik (≥ 85%)</option>
            <option className="bg-slate-900 text-amber-400">Cukup (70-84%)</option>
            <option className="bg-slate-900 text-red-400">Perlu Tindak Lanjut (&lt; 70%)</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Waktu Audit</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Supervisor</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Score</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Status</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                        <Activity className="absolute inset-0 m-auto w-6 h-6 text-blue-400 animate-pulse" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Sinkronisasi Data Audit Farmasi...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-30">
                      <TableIcon className="w-16 h-16" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em]">Data Tidak Ditemukan</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-2 italic">Belum ada riwayat audit untuk area farmasi.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((audit) => {
                  const status = getStatus(audit.persentase);
                  return (
                    <tr key={audit.id} className="hover:bg-white/[0.02] transition-all group">
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 border border-white/5 group-hover:border-blue-500 shadow-lg">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-white leading-none">
                              {format(new Date(audit.waktu), 'dd MMMM yyyy', { locale: id })}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-2 font-mono tracking-widest">{format(new Date(audit.waktu), 'HH:mm')} WIB</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-blue-400 transition-colors">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors uppercase tracking-widest">{audit.supervisor}</span>
                        </div>
                      </td>
                      <td className="py-5 px-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.25rem] bg-white/5 border border-white/5 group-hover:border-blue-500/30 transition-all">
                          <span className="text-lg font-black text-white font-mono">{audit.persentase}%</span>
                        </div>
                      </td>
                      <td className="py-5 px-8 text-center">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-5 py-2 rounded-full inline-block shadow-lg ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-5 px-8 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={() => {
                              setSelectedAudit(audit);
                              setIsModalOpen(true);
                            }}
                            className="p-3 bg-blue-600/10 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-lg active:scale-90 border border-blue-500/20"
                            title="Detail Audit"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(audit.id)}
                            className="p-3 bg-red-600/10 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-90 border border-red-500/20"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedAudit && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="relative w-full max-w-5xl bg-[#0f172a] border border-white/10 rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="p-8 sm:p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 border border-white/20">
                    <TableIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-widest">Detail Audit Farmasi</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> ID Audit: {selectedAudit.id.slice(0, 12)}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-4 bg-white/5 hover:bg-white/10 rounded-[1.5rem] text-slate-400 hover:text-white transition-all shadow-xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 sm:p-10 space-y-10 custom-scrollbar bg-white/[0.01]">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Tanggal Audit', val: format(new Date(selectedAudit.waktu), 'dd/MM/yyyy'), icon: Calendar },
                    { label: 'Supervisor', val: selectedAudit.supervisor, icon: User },
                    { label: 'Kepatuhan', val: `${selectedAudit.persentase}%`, icon: Activity },
                    { label: 'Status', val: getStatus(selectedAudit.persentase).label, icon: AlertTriangle, status: true },
                  ].map((inf, i) => (
                    <div key={i} className="bg-white/5 p-6 rounded-[2rem] border border-white/5 shadow-inner">
                       <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 flex items-center gap-2">
                         <inf.icon className="w-3.5 h-3.5 text-blue-400" /> {inf.label}
                       </p>
                       {inf.status ? (
                          <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full inline-block shadow-lg ${getStatus(selectedAudit.persentase).color}`}>
                            {inf.val}
                          </span>
                       ) : (
                          <p className="text-base font-black text-white truncate uppercase tracking-widest leading-none">{inf.val}</p>
                       )}
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4" /> Temuan Lapangan
                    </h4>
                    <div className="p-6 bg-white/2 rounded-[2.5rem] border border-white/5 min-h-[120px] shadow-inner relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50" />
                      <p className="text-sm text-slate-300 leading-relaxed italic font-medium">{selectedAudit.temuan || 'Tidak ada catatan temuan khusus dalam audit ini.'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 flex items-center gap-3">
                      <Stethoscope className="w-4 h-4" /> Rekomendasi PPI
                    </h4>
                    <div className="p-6 bg-white/2 rounded-[2.5rem] border border-white/5 min-h-[120px] shadow-inner relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50" />
                      <p className="text-sm text-slate-100 leading-relaxed italic font-bold">{selectedAudit.rekomendasi || 'Seluruh aspek telah memenuhi standar operasional PPI.'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3 justify-center mb-4">
                    Tanda Tangan Digital
                  </h4>
                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 text-center">PJ Ruangan Farmasi</p>
                      <div className="bg-white p-6 rounded-[2.5rem] h-48 flex items-center justify-center border border-white/10 shadow-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {selectedAudit.ttd_pj ? (
                           <img src={selectedAudit.ttd_pj} alt="TTD PJ" className="max-h-full transition-transform group-hover:scale-105" />
                        ) : (
                          <X className="w-12 h-12 text-slate-200 opacity-20" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 text-center">IPCN / Auditor</p>
                      <div className="bg-white p-6 rounded-[2.5rem] h-48 flex items-center justify-center border border-white/10 shadow-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {selectedAudit.ttd_ipcn ? (
                           <img src={selectedAudit.ttd_ipcn} alt="TTD IPCN" className="max-h-full transition-transform group-hover:scale-105" />
                        ) : (
                          <X className="w-12 h-12 text-slate-200 opacity-20" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedAudit.foto && selectedAudit.foto.length > 0 && (
                  <div className="space-y-6 pt-10 border-t border-white/5">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3">
                      <Camera className="w-4 h-4 text-blue-400" /> Dokumentasi Foto
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                      {selectedAudit.foto.map((f: string, i: number) => (
                        <div key={i} className="aspect-video rounded-[1.5rem] overflow-hidden border border-white/10 shadow-2xl group cursor-pointer active:scale-95 transition-all">
                          <img src={f} alt={`Doc ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}
