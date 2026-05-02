import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';
import { 
  TrendingUp, Activity, Search, Calendar, ChevronDown, CheckCircle2, 
  XCircle, Filter, PieChart, BarChart2, TrendingDown, Target, List, Download, Printer, Target as TargetIcon, User, Building2, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, ReferenceLine, Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useAppContext } from '@/components/providers';

export default function ApdReport({ 
  filters 
}: { 
  filters: { dateRange: { from: string, to: string }, unitFilter: string, searchQuery: string } 
}) {
  const { hospitalLogoUrl } = useAppContext();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [professionsOpen, setProfessionsOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let query = supabase.from('audit_apd').select('*').order('tanggal_waktu', { ascending: false });
      
      const { data: result, error } = await query;
      if (!error && result) {
        // Calculate dynamically to be safe
        const mappedResult = result.map(item => {
          let dinilai = 0;
          let patuh = 0;
          
          const components = ['masker', 'sarung_tangan', 'penutup_kepala', 'apron', 'goggle', 'sepatu_boot', 'gaun_pelindung'];
          
          components.forEach(comp => {
            if (item[comp] === 'Ya' || item[comp] === 'Sesuai' || item[comp] === 'Tidak' || item[comp] === 'Tidak Sesuai') {
              dinilai++;
              if (item[comp] === 'Ya' || item[comp] === 'Sesuai') {
                patuh++;
              }
            }
          });

          // Fallback to db values if calculation is 0 and db has values
          dinilai = dinilai > 0 ? dinilai : (item.jumlah_dinilai || 0);
          patuh = patuh > 0 || dinilai > 0 ? patuh : (item.jumlah_patuh || 0);
          
          const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;
          const status = persentase >= 85 ? 'Patuh' : 'Tidak Patuh'; // Assuming 85% is target, standard PPI
          
          return {
            ...item,
            jumlah_dinilai: dinilai,
            jumlah_patuh: patuh,
            persentase: persentase,
            status_kepatuhan: status,
          };
        });
        setData(mappedResult);
      }
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  // Frontend filtering
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Date filtering (basic)
      if (filters.dateRange && filters.dateRange.from && filters.dateRange.to && item.tanggal_waktu) {
        const itemDateStr = String(item.tanggal_waktu || '').split('T')[0];
        if (itemDateStr < filters.dateRange.from || itemDateStr > filters.dateRange.to) {
          return false;
        }
      }
      // Unit filtering
      if (filters.unitFilter && filters.unitFilter !== 'Semua Unit') {
        if (item.unit !== filters.unitFilter) return false;
      }
      // Profession filtering (Multi-select)
      if (selectedProfessions.length > 0) {
        if (!item.profesi || !selectedProfessions.includes(item.profesi.trim().toUpperCase())) {
          return false;
        }
      }
      // Search
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!item.observer?.toLowerCase().includes(query) && 
            !item.unit?.toLowerCase().includes(query) &&
            !item.tindakan?.toLowerCase().includes(query) &&
            !item.profesi?.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [data, filters, selectedProfessions]);

  // Get unique professions for filter
  const allProfessions = useMemo(() => {
    const profs = new Set<string>();
    data.forEach(item => {
      if (item.profesi) profs.add(item.profesi.trim().toUpperCase());
    });
    return Array.from(profs).sort();
  }, [data]);

  const { trendData, summaryStats, profesiStats, unitStats } = useMemo(() => {
    if (filteredData.length === 0) return { 
      trendData: [], 
      summaryStats: { avg: 0, count: 0, patuh: 0, dinilai: 0, tidakPatuh: 0 },
      profesiStats: [],
      unitStats: []
    };

    let totalPatuh = 0;
    let totalDinilai = 0;
    let tidakPatuh = 0;
    const statsByDate: Record<string, { totalDinilai: number, totalPatuh: number }> = {};
    const statsByProfesi: Record<string, { totalDinilai: number, totalPatuh: number }> = {};
    const statsByUnit: Record<string, { totalDinilai: number, totalPatuh: number }> = {};

    filteredData.forEach(item => {
      totalPatuh += (item.jumlah_patuh || 0);
      totalDinilai += (item.jumlah_dinilai || 0);
      
      if ((item.persentase || 0) < 85) {
        tidakPatuh += 1;
      }

      if (item.tanggal_waktu) {
        // format date as dd MMM
        const dateObj = new Date(item.tanggal_waktu);
        const dateKey = `${dateObj.getDate()} ${dateObj.toLocaleString('id-ID', { month: 'short' })}`;
        
        if (!statsByDate[dateKey]) statsByDate[dateKey] = { totalDinilai: 0, totalPatuh: 0 };
        statsByDate[dateKey].totalDinilai += (item.jumlah_dinilai || 0);
        statsByDate[dateKey].totalPatuh += (item.jumlah_patuh || 0);
      }
      
      if (item.profesi) {
        const prof = item.profesi.trim().toUpperCase();
        if (!statsByProfesi[prof]) statsByProfesi[prof] = { totalDinilai: 0, totalPatuh: 0 };
        statsByProfesi[prof].totalDinilai += (item.jumlah_dinilai || 0);
        statsByProfesi[prof].totalPatuh += (item.jumlah_patuh || 0);
      }
      
      if (item.unit) {
        const unit = item.unit.trim();
        if (!statsByUnit[unit]) statsByUnit[unit] = { totalDinilai: 0, totalPatuh: 0 };
        statsByUnit[unit].totalDinilai += (item.jumlah_dinilai || 0);
        statsByUnit[unit].totalPatuh += (item.jumlah_patuh || 0);
      }
    });

    const avg = totalDinilai > 0 ? Math.round((totalPatuh / totalDinilai) * 100) : 0;

    const trend = Object.entries(statsByDate).map(([date, stats]) => ({
      date,
      persentase: stats.totalDinilai > 0 ? Math.round((stats.totalPatuh / stats.totalDinilai) * 100) : 0,
      dinilai: stats.totalDinilai,
      patuh: stats.totalPatuh
    })).sort((a, b) => new Date(`2024 ${a.date}`).getTime() - new Date(`2024 ${b.date}`).getTime()); // basic sort

    const profesi = Object.entries(statsByProfesi).map(([name, stats]) => ({
      name,
      persentase: stats.totalDinilai > 0 ? Math.round((stats.totalPatuh / stats.totalDinilai) * 100) : 0
    })).sort((a, b) => b.persentase - a.persentase);
    
    const unit = Object.entries(statsByUnit).map(([name, stats]) => ({
      name,
      persentase: stats.totalDinilai > 0 ? Math.round((stats.totalPatuh / stats.totalDinilai) * 100) : 0
    })).sort((a, b) => b.persentase - a.persentase);

    return {
      trendData: trend,
      summaryStats: { avg, count: filteredData.length, patuh: totalPatuh, dinilai: totalDinilai, tidakPatuh },
      profesiStats: profesi,
      unitStats: unit
    };
  }, [filteredData]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan APD</title>
          <style>
            body { font-family: 'Times New Roman', Tahoma, sans-serif; padding: 20px; color: #000; }
            .header-report { display: flex; align-items: center; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
            .logo { width: 80px; height: 80px; object-fit: contain; margin-right: 20px; }
            .title-area { flex: 1; text-align: center; }
            .title-reports { font-size: 24px; font-weight: bold; margin: 0 0 5px 0; text-transform: uppercase; }
            .subtitle-reports { font-size: 18px; font-weight: bold; margin: 0 0 5px 0; }
            .period-reports { font-size: 14px; margin: 0; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
            th, td { border: 1px solid #000; padding: 6px; text-align: center; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .text-left { text-align: left; }
            
            .summary-box { border: 1px solid #000; padding: 15px; page-break-inside: avoid; }
            .summary-title { font-weight: bold; margin-bottom: 10px; font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .summary-grid { display: flex; flex-wrap: wrap; gap: 20px; }
            .summary-item { flex: 1; min-width: 150px; }
            
            @media print {
              body { padding: 0; }
              @page { size: landscape; margin: 1cm; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    // Use timeout to allow images to load
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
  
  const handleExportExcel = () => {
    alert('Fungsi ekspor Excel sedang dalam pengembangan');
  };

  const mapApdAction = (val: string | null) => {
    if (!val) return <span className="text-force-black">-</span>;
    const lower = val.toLowerCase();
    if (lower === 'ya' || lower === 'sesuai') return <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded font-bold text-[9px]">Ya</span>;
    if (lower === 'tidak' || lower === 'tidak sesuai') return <span className="px-2 py-1 bg-rose-50 text-rose-700 rounded font-bold text-[9px]">Tidak</span>;
    if (lower === 'na' || lower === 'n/a' || lower === 'n/a ') return <span className="px-2 py-1 bg-slate-200 text-force-black rounded font-bold text-[9px]">N/A</span>;
    return <span className="text-force-black">{val}</span>;
  };

  const mapApdText = (val: string | null) => {
    if (!val) return '-';
    const lower = val.toLowerCase();
    if (lower === 'ya' || lower === 'sesuai') return 'Ya';
    if (lower === 'tidak' || lower === 'tidak sesuai') return 'Tidak';
    if (lower === 'na' || lower === 'n/a' || lower === 'n/a ') return 'N/A';
    return val;
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm">Menyiapkan Laporan APD...</p>
      </div>
    );
  }

  // Format month period for header
  let periodText = 'Semua Waktu';
  if (filters.dateRange.from && filters.dateRange.to) {
    try {
      const fromD = new Date(filters.dateRange.from);
      periodText = `Periode: ${fromD.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`;
    } catch (e) {
      periodText = `Periode: ${filters.dateRange.from} s/d ${filters.dateRange.to}`;
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-10">
      
      <div className="bg-force-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-2xl relative" id="print-area">
        <div className="p-8 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 print:border-slate-300 bg-force-white">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 flex-shrink-0 border rounded-xl flex items-center justify-center overflow-hidden backdrop-blur-md transition-colors duration-500 bg-white shadow-md p-2`}>
              {hospitalLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hospitalLogoUrl} alt="Logo RS" className="w-full h-full object-contain" />
              ) : (
                <ShieldCheck className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black text-force-black uppercase tracking-tight">LAPORAN MONITORING KEPATUHAN PENGGUNAAN APD</h2>
              <p className="text-sm font-bold text-force-black uppercase tracking-widest">UOBK RSUD AL-MULK KOTA SUKABUMI</p>
            </div>
          </div>
        </div>

        {/* TABEL DATA */}
        <div className="overflow-x-auto print:overflow-visible bg-force-white">
          <table className="w-full min-w-[600px] text-center border-collapse print:text-[9px] bg-force-white text-force-black">
            <thead>
              <tr className="bg-force-white text-[9px] font-bold uppercase tracking-widest text-force-black border-b border-slate-300">
                <th className="px-3 py-3 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap bg-force-white text-force-black">Waktu</th>
                <th className="px-3 py-3 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap bg-force-white text-force-black">Observer</th>
                <th className="px-3 py-3 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap bg-force-white text-force-black">Unit / Ruangan</th>
                <th className="px-3 py-3 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap bg-force-white text-force-black">Profesi</th>
                <th className="px-3 py-3 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap bg-force-white text-force-black">Tindakan</th>
                <th className="px-2 py-3 text-center border-r border-slate-200 print:border-slate-300 bg-force-white text-force-black leading-tight min-w-[70px]">Masker</th>
                <th className="px-2 py-3 text-center border-r border-slate-200 print:border-slate-300 bg-force-white text-force-black leading-tight min-w-[70px]">Sarung<br/>Tangan</th>
                <th className="px-2 py-3 text-center border-r border-slate-200 print:border-slate-300 bg-force-white text-force-black leading-tight min-w-[70px]">Penutup<br/>Kepala</th>
                <th className="px-2 py-3 text-center border-r border-slate-200 print:border-slate-300 bg-force-white text-force-black leading-tight">Apron</th>
                <th className="px-2 py-3 text-center border-r border-slate-200 print:border-slate-300 bg-force-white text-force-black leading-tight min-w-[80px]">Kaca Mata<br/>/ Google</th>
                <th className="px-2 py-3 text-center border-r border-slate-200 print:border-slate-300 bg-force-white text-force-black leading-tight min-w-[70px]">Sepatu<br/>Boot</th>
                <th className="px-2 py-3 text-center border-r border-slate-200 print:border-slate-300 bg-force-white text-force-black leading-tight">Gaun</th>
                <th className="px-2 py-3 text-center border-r border-slate-200 print:border-slate-300 bg-force-white text-force-black leading-tight min-w-[90px]">Jumlah APD<br/>yang dinilai</th>
                <th className="px-2 py-3 text-center border-r border-slate-200 print:border-slate-300 bg-force-white text-force-black leading-tight min-w-[80px]">Jumlah<br/>Kepatuhan</th>
                <th className="px-3 py-3 text-center whitespace-nowrap bg-force-white text-force-black">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[9px] text-force-black bg-force-white relative z-10">
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={15} className="text-center py-10 font-bold uppercase tracking-widest text-force-black">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              )}
              {filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors text-force-black bg-force-white">
                  <td className="px-3 py-2 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap text-force-black">{row.tanggal_waktu ? format(parseISO(row.tanggal_waktu), 'dd/MM/yyyy HH:mm') : '-'}</td>
                  <td className="px-3 py-2 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap text-force-black">{row.observer || '-'}</td>
                  <td className="px-3 py-2 text-center border-r border-slate-200 print:border-slate-300 text-force-black whitespace-nowrap">{row.unit || '-'}</td>
                  <td className="px-3 py-2 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap text-force-black">{row.profesi || '-'}</td>
                  <td className="px-3 py-2 text-left border-r border-slate-200 print:border-slate-300 whitespace-normal text-force-black max-w-[200px] text-[8px] sm:text-[9px]">{row.tindakan || '-'}</td>
                  
                  {/* APD Components */}
                  <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap">
                    <span className="print:hidden">{mapApdAction(row.masker)}</span>
                    <span className="hidden print:inline text-[9px] text-force-black">{mapApdText(row.masker)}</span>
                  </td>
                  <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap">
                    <span className="print:hidden">{mapApdAction(row.sarung_tangan)}</span>
                    <span className="hidden print:inline text-[9px] text-force-black">{mapApdText(row.sarung_tangan)}</span>
                  </td>
                  <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap">
                    <span className="print:hidden">{mapApdAction(row.penutup_kepala)}</span>
                    <span className="hidden print:inline text-[9px] text-force-black">{mapApdText(row.penutup_kepala)}</span>
                  </td>
                  <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap">
                    <span className="print:hidden">{mapApdAction(row.apron)}</span>
                    <span className="hidden print:inline text-[9px] text-force-black">{mapApdText(row.apron)}</span>
                  </td>
                  <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap">
                    <span className="print:hidden">{mapApdAction(row.goggle)}</span>
                    <span className="hidden print:inline text-[9px] text-force-black">{mapApdText(row.goggle)}</span>
                  </td>
                  <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap">
                    <span className="print:hidden">{mapApdAction(row.sepatu_boot)}</span>
                    <span className="hidden print:inline text-[9px] text-force-black">{mapApdText(row.sepatu_boot)}</span>
                  </td>
                  <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-300 whitespace-nowrap">
                    <span className="print:hidden">{mapApdAction(row.gaun_pelindung)}</span>
                    <span className="hidden print:inline text-[9px] text-force-black">{mapApdText(row.gaun_pelindung)}</span>
                  </td>
                  
                  <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-300 font-mono font-black">{row.jumlah_dinilai || 0}</td>
                  <td className="px-2 py-2 text-center border-r border-slate-200 print:border-slate-300 font-mono font-black">{row.jumlah_patuh || 0}</td>
                  <td className="px-3 py-2 text-center font-bold whitespace-nowrap border-slate-200 print:border-slate-300">
                    <span className={`px-2 py-1 rounded-md text-[9px] ${
                      (row.jumlah_dinilai ? Math.round(((row.jumlah_patuh || 0) / row.jumlah_dinilai) * 100) : 0) >= 85 ? 'bg-emerald-100 text-emerald-800' :
                      (row.jumlah_dinilai ? Math.round(((row.jumlah_patuh || 0) / row.jumlah_dinilai) * 100) : 0) >= 70 ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {row.jumlah_dinilai ? Math.round(((row.jumlah_patuh || 0) / row.jumlah_dinilai) * 100) : 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h3 className="text-xl font-heading font-black text-slate-800 dark:text-white pt-4 px-2 print:hidden">Rekapitulasi Capaian</h3>

      {/* DASHBOARD PREVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Stats Cards */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Observasi</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{summaryStats.count}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform">
                <TargetIcon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Rata-rata Kepatuhan</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{summaryStats.avg}%</h3>
                </div>
              </div>
            </div>
            {summaryStats.avg >= 85 ? (
              <TrendingUp className="text-emerald-500" size={20} />
            ) : (
              <TrendingDown className="text-red-500" size={20} />
            )}
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 mt-4 rounded-full overflow-hidden">
            <div 
              className={`h-full ${summaryStats.avg >= 85 ? 'bg-emerald-500' : summaryStats.avg >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} 
              style={{ width: `${summaryStats.avg}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total APD Sesuai</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{summaryStats.patuh} / {summaryStats.dinilai}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tindakan Tdk Patuh</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{summaryStats.tidakPatuh}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-emerald-500" /> Kepatuhan per Unit
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitStats} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="persentase" radius={[0, 4, 4, 0]} barSize={20}>
                  {unitStats.map((entry, index) => (
                    <Cell key={`cell-\${index}`} fill={entry.persentase >= 85 ? '#10b981' : entry.persentase >= 70 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
                <ReferenceLine x={85} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: '85%', fill: '#ef4444', fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <PieChart size={16} className="text-emerald-500" /> Kepatuhan per Profesi
          </h3>
          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {profesiStats.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Tidak ada data profesi</p>
            ) : (
              profesiStats.map((prof, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{prof.name}</span>
                    <span className={`font-medium ${prof.persentase >= 85 ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {prof.persentase}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${prof.persentase}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={`h-full ${prof.persentase >= 85 ? 'bg-emerald-500' : prof.persentase >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
