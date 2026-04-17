'use client';

import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  FileSpreadsheet,
  FileIcon
} from 'lucide-react';
import { motion } from 'motion/react';

const reports = [
  { id: 1, title: 'Laporan Bulanan PPI - Maret 2024', type: 'PDF', date: '01 Apr 2024', size: '2.4 MB' },
  { id: 2, title: 'Laporan Surveilans HAIs Triwulan 1', type: 'PDF', date: '05 Apr 2024', size: '4.1 MB' },
  { id: 3, title: 'Raw Data Audit Kepatuhan (Jan-Mar)', type: 'Excel', date: '05 Apr 2024', size: '1.2 MB' },
  { id: 4, title: 'Presentasi Komite PPI ke Direksi', type: 'PPT', date: '10 Apr 2024', size: '5.8 MB' },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-gradient">Laporan Otomatis</h1>
          <p className="text-sm text-slate-500 mt-1">Generate dan unduh laporan mutu PPI</p>
        </div>
      </div>

      {/* Generator Section */}
      <div className="sleek-card">
        <h2 className="text-lg font-bold text-navy-dark mb-4">Generate Laporan Baru</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Jenis Laporan</label>
            <select className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary">
              <option>Laporan Bulanan Komprehensif</option>
              <option>Laporan Surveilans HAIs</option>
              <option>Laporan Kepatuhan HH & APD</option>
              <option>Laporan Supervisi Ruangan</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Periode</label>
            <select className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary">
              <option>Bulan Ini</option>
              <option>Bulan Lalu</option>
              <option>Triwulan 1</option>
              <option>Custom Range</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Format</label>
            <select className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary">
              <option>PDF (Premium)</option>
              <option>Excel (Raw Data)</option>
              <option>Word (Editable)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full flex justify-center items-center gap-2 py-2 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
              <FileText className="w-4 h-4" /> Generate
            </button>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="sleek-card !p-0 overflow-hidden">
        <div className="p-5 border-b border-bg-gray flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy-dark">Arsip Laporan</h2>
          <div className="flex gap-2">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {reports.map((report, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={report.id} 
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  report.type === 'PDF' ? 'bg-red-50 text-red-600' : 
                  report.type === 'Excel' ? 'bg-emerald-50 text-emerald-600' : 
                  'bg-orange-50 text-orange-600'
                }`}>
                  {report.type === 'PDF' ? <FileText className="w-5 h-5" /> : 
                   report.type === 'Excel' ? <FileSpreadsheet className="w-5 h-5" /> : 
                   <FileIcon className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{report.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {report.date}</span>
                    <span>•</span>
                    <span>{report.size}</span>
                  </div>
                </div>
              </div>
              <button className="p-2 text-slate-400 hover:text-primary hover:bg-teal-50 rounded-lg transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
