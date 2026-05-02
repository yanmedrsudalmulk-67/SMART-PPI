import React, { useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Image from 'next/image';
import { Check, X, ShieldAlert, FileText, Camera, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/components/providers';

interface Item {
  id: string;
  label: string;
}

interface Category {
  id: string;
  title: string;
  items: Item[];
}

interface AuditRecord {
  id: string;
  waktu?: string;
  tanggal_waktu?: string;
  supervisor?: string;
  observer?: string;
  unit?: string;
  ruangan?: string;
  profesi?: string;
  checklist_json?: Record<string, any>;
  data_indikator?: Record<string, any>;
  persentase: number;
  temuan?: string;
  rekomendasi?: string;
  foto?: string[] | string;
  ttd_pj?: string;
  ttd_ipcn?: string;
}

export default function OfficialReportSheet({
  data,
  title,
  categories
}: {
  data: AuditRecord;
  title: string;
  categories: Category[];
}) {
  const { hospitalLogoUrl } = useAppContext();
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const auditDate = data.tanggal_waktu || data.waktu;
  const inspector = data.supervisor || data.observer;
  const unit = data.ruangan || data.unit;
  
  const checklist = data.checklist_json || data.data_indikator || {};
  
  const getStatus = (itemId: string) => {
    const val = checklist[itemId];
    if (val && typeof val === 'object' && 'status' in val) return val.status?.toLowerCase();
    return val?.toLowerCase();
  };

  const getKeterangan = (itemId: string) => {
    const val = checklist[itemId];
    if (val && typeof val === 'object' && 'keterangan' in val) return val.keterangan;
    return '';
  };

  const images = Array.isArray(data.foto) ? data.foto : (typeof data.foto === 'string' ? [data.foto] : []);
  const generatedDate = format(new Date(), 'dd MMMM yyyy HH:mm', { locale: idLocale });

  return (
    <div className="relative w-full font-sans rounded-2xl overflow-hidden shadow-2xl transition-colors duration-300 bg-white dark:bg-[#0b1120] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 print:shadow-none print:border-none print:bg-white print:text-black">
      
      {/* Header Resmi */}
      <div className="p-8 border-b-4 border-blue-900 dark:border-blue-500 bg-slate-50 dark:bg-white/5 print:bg-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
             <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center border-2 border-slate-200 dark:border-white/20 shadow-md p-2">
               {hospitalLogoUrl ? (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={hospitalLogoUrl} alt="Logo RS" className="w-full h-full object-contain" />
               ) : (
                 <ShieldCheck className="w-10 h-10 text-blue-600" />
               )}
             </div>
             <div>
               <h1 className="text-xl md:text-2xl font-black tracking-tight leading-tight uppercase font-heading text-blue-900 dark:text-white drop-shadow-sm print:text-black">
                 TIM PENCEGAHAN & PENGENDALIAN INFEKSI
               </h1>
               <p className="text-sm font-bold uppercase text-slate-600 dark:text-blue-400 tracking-widest mt-1 print:text-slate-600">UOBK RSUD AL-MULK KOTA SUKABUMI</p>
               <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic print:text-slate-500">Jl. Pelabuhan II, Kec. Lembursitu, Kota Sukabumi, Jawa Barat</p>
             </div>
          </div>
          <div className="text-left md:text-right mt-4 md:mt-0 bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/10 print:bg-transparent print:border-none print:p-0">
             <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-1 print:text-slate-500">Dokumen Resmi Audit Internal</p>
             <h2 className="text-lg md:text-xl font-black text-blue-700 dark:text-emerald-400 font-mono print:text-blue-600">#AUDIT-{data.id.slice(0, 8).toUpperCase()}</h2>
             <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest print:text-slate-400">Dicetak: {generatedDate}</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Judul Laporan */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight font-heading text-slate-800 dark:text-white inline-block pb-2 border-b-2 border-slate-300 dark:border-white/20 print:text-black">
            FORMULIR LAPORAN AUDIT
            <br />
            <span className="text-blue-600 dark:text-blue-400 text-xl md:text-2xl relative top-2 print:text-blue-600">{title}</span>
          </h2>
        </div>

        {/* Info Audit Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 print:grid-cols-4">
          <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm print:bg-slate-50 print:border-slate-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2 print:text-slate-500">
              <FileText className="w-3 h-3" /> Waktu Pelaksanaan
            </p>
            <div className="font-bold text-sm text-slate-800 dark:text-white print:text-black">
              {auditDate ? format(new Date(auditDate), 'dd MMM yyyy HH:mm', { locale: idLocale }) : '-'}
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm print:bg-slate-50 print:border-slate-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2 print:text-slate-500">
              <FileText className="w-3 h-3" /> Supervisor / IPCN
            </p>
            <p className="font-black text-sm uppercase text-slate-800 dark:text-emerald-400 print:text-slate-800">{inspector || '-'}</p>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm print:bg-slate-50 print:border-slate-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2 print:text-slate-500">
              <FileText className="w-3 h-3" /> Unit / Ruangan
            </p>
            <p className="font-black text-sm uppercase text-blue-600 dark:text-blue-400 print:text-blue-600">{unit || '-'}</p>
          </div>
          {data.profesi && (
            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm print:bg-slate-50 print:border-slate-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2 print:text-slate-500">
                <FileText className="w-3 h-3" /> Profesi
              </p>
              <p className="font-black text-sm uppercase text-slate-800 dark:text-white print:text-slate-800">{data.profesi}</p>
            </div>
          )}
        </div>

        {/* Tabel Audit Utama */}
        <div className="mb-10 rounded-xl overflow-x-auto print:overflow-visible border border-slate-200 dark:border-white/20 shadow-md print:border-slate-300">
          <table className="w-full min-w-[700px] border-collapse text-left text-sm bg-force-white text-force-black">
            <thead>
              <tr className="bg-force-white text-force-black font-bold uppercase tracking-widest text-[11px] border-b border-slate-300">
                <th className="px-4 py-4 w-12 text-center border-r border-slate-200 print:border-slate-300 bg-force-white text-force-black">No</th>
                <th className="px-6 py-4 border-r border-slate-200 print:border-slate-300 bg-force-white text-force-black">Item Standar Audit</th>
                <th className="px-4 py-4 w-16 text-center border-r border-slate-200 print:border-slate-300 bg-force-white text-force-black">Ya</th>
                <th className="px-4 py-4 w-16 text-center border-r border-slate-200 print:border-slate-300 bg-force-white text-force-black">Tidak</th>
                <th className="px-4 py-4 w-16 text-center border-r border-slate-200 print:border-slate-300 bg-force-white text-force-black">N/A</th>
                <th className="px-6 py-4 bg-force-white text-force-black">Catatan Temuan</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-transparent print:bg-white">
              {categories.map((cat, catIdx) => (
                <React.Fragment key={cat.id}>
                  {categories.length > 1 && (
                    <tr className="bg-slate-100 dark:bg-white/5 font-black text-[12px] uppercase tracking-wider text-slate-800 dark:text-blue-300 print:bg-slate-100 print:text-slate-800">
                      <td className="px-4 py-3 text-center border-b border-r border-slate-200 dark:border-white/10 print:border-slate-300">{String.fromCharCode(65 + catIdx)}</td>
                      <td className="px-6 py-3 border-b border-slate-200 dark:border-white/10 print:border-slate-300" colSpan={5}>{cat.title}</td>
                    </tr>
                  )}
                  {cat.items.map((item, itemIdx) => {
                    const status = getStatus(item.id);
                    const ket = getKeterangan(item.id);
                    return (
                      <tr key={item.id} className="border-b border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors print:border-slate-300">
                        <td className="px-4 py-4 text-center font-mono text-[12px] text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-white/10 print:border-slate-300 print:text-slate-600">{itemIdx + 1}</td>
                        <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-white/10 leading-snug print:border-slate-300 print:text-black">{item.label}</td>
                        <td className="px-4 py-4 text-center border-r border-slate-200 dark:border-white/10 print:border-slate-300">
                          {status === 'ya' && <Check className="w-5 h-5 mx-auto text-emerald-500" strokeWidth={3} />}
                        </td>
                        <td className="px-4 py-4 text-center border-r border-slate-200 dark:border-white/10 print:border-slate-300">
                          {status === 'tidak' && <X className="w-5 h-5 mx-auto text-rose-500" strokeWidth={3} />}
                        </td>
                        <td className="px-4 py-4 text-center border-r border-slate-200 dark:border-white/10 font-black text-slate-300 dark:text-slate-500 print:border-slate-300 print:text-slate-400">
                          {status === 'na' ? 'N/A' : ''}
                        </td>
                        <td className="px-6 py-4 text-xs italic text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-transparent print:bg-transparent print:text-slate-600">{ket}</td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hasil & Kepatuhan */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 print:grid-cols-4">
          <div className="md:col-span-3 grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-center shadow-sm print:bg-slate-50 print:border-slate-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 print:text-slate-500">Patuh (Ya)</p>
              <p className="text-3xl font-black text-slate-800 dark:text-emerald-400 font-mono print:text-black">
                {Object.values(checklist).filter(v => (typeof v === 'string' ? v.toLowerCase() : v?.status?.toLowerCase()) === 'ya').length}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-center shadow-sm print:bg-slate-50 print:border-slate-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 print:text-slate-500">Tidak Patuh</p>
              <p className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono print:text-black">
                {Object.values(checklist).filter(v => (typeof v === 'string' ? v.toLowerCase() : v?.status?.toLowerCase()) === 'tidak').length}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-center shadow-sm print:bg-slate-50 print:border-slate-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 print:text-slate-500">N/A</p>
              <p className="text-3xl font-black text-slate-400 font-mono print:text-slate-400">
                {Object.values(checklist).filter(v => (typeof v === 'string' ? v.toLowerCase() : v?.status?.toLowerCase()) === 'na').length}
              </p>
            </div>
          </div>
          <div className={`rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg border relative overflow-hidden ${
            data.persentase >= 85 
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-500/30 print:bg-emerald-50 print:border-emerald-200' 
              : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-500/30 print:bg-rose-50 print:border-rose-200'
          }`}>
             <div className="relative z-10 w-full">
               <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${data.persentase >= 85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>Compliance Rate</p>
               <p className={`text-5xl font-black font-heading mb-2 ${data.persentase >= 85 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>{data.persentase}%</p>
               <div className={`text-[11px] font-black uppercase tracking-widest py-1 px-3 rounded-lg inline-block text-white ${data.persentase >= 85 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                 {data.persentase >= 85 ? 'SESUAI STANDAR' : 'TIDAK SESUAI'}
               </div>
             </div>
          </div>
        </div>

        {/* Temuan & Rekomendasi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 print:grid-cols-2">
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-300 flex items-center gap-2 print:text-black">
              <div className="w-2 h-4 bg-amber-500 rounded-sm" /> Rincian Temuan Lapangan
            </h4>
            <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 min-h-[140px] text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap shadow-inner print:bg-slate-50 print:border-slate-200 print:text-black">
              {data.temuan || <span className="italic text-slate-400">Tidak ada temuan spesifik yang dicatat.</span>}
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-300 flex items-center gap-2 print:text-black">
              <div className="w-2 h-4 bg-blue-500 rounded-sm" /> Rekomendasi & Tindak Lanjut
            </h4>
            <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 min-h-[140px] text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap shadow-inner print:bg-slate-50 print:border-slate-200 print:text-black">
              {data.rekomendasi || <span className="italic text-slate-400">Sesuai dengan standar prosedur operasional yang berlaku.</span>}
            </div>
          </div>
        </div>

        {/* Dokumentasi Grid */}
        {images.length > 0 && (
           <div className="mb-12 space-y-4">
             <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-300 flex items-center gap-2 print:text-black">
               <Camera className="w-4 h-4 text-blue-500" /> Lampiran Dokumentasi
             </h4>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 print:grid-cols-4">
               {images.map((url, i) => (
                 <div 
                   key={i} 
                   onClick={() => setZoomedImage(url)}
                   className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-md group cursor-zoom-in print:border-slate-300 print:shadow-none"
                 >
                   <Image src={url} alt={`Dokumentasi ${i+1}`} fill className="object-cover transition-transform duration-500 group-hover:scale-110" unoptimized />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none print:hidden">
                      <span className="text-white text-xs font-bold uppercase tracking-widest">Detail</span>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        )}

        {/* Tanda Tangan */}
        <div className="grid grid-cols-2 gap-8 md:gap-16 mt-12 mb-8 page-break-inside-avoid print:grid-cols-2">
          <div className="text-center space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6 pb-2 border-b border-slate-200 dark:border-white/10 print:text-slate-600 print:border-slate-200">Penanggung Jawab / Auditee</p>
            <div className="h-32 relative w-full flex justify-center items-center rounded-2xl">
              {data.ttd_pj ? (
                <Image src={data.ttd_pj} fill className="object-contain" alt="TTD PJ" unoptimized />
              ) : (
                <span className="text-[10px] text-slate-300 dark:text-slate-600 uppercase tracking-widest font-black italic print:text-slate-400">Tanpa Tanda Tangan</span>
              )}
            </div>
            <div className="pt-2 border-t border-slate-400 dark:border-slate-500 inline-block w-48 mx-auto print:border-slate-400">
              <p className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-300 mt-1 print:text-black">( ........................................ )</p>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6 pb-2 border-b border-slate-200 dark:border-white/10 print:text-slate-600 print:border-slate-200">Auditor / Tim IPCN</p>
            <div className="h-32 relative w-full flex justify-center items-center rounded-2xl">
              {data.ttd_ipcn ? (
                <Image src={data.ttd_ipcn} fill className="object-contain" alt="TTD IPCN" unoptimized />
              ) : (
                <span className="text-[10px] text-slate-300 dark:text-slate-600 uppercase tracking-widest font-black italic print:text-slate-400">Tanpa Tanda Tangan</span>
              )}
            </div>
            <div className="pt-2 border-t border-slate-400 dark:border-slate-500 inline-block w-48 mx-auto print:border-slate-400">
              <p className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-300 mt-1 print:text-black">
                {inspector ? `( ${inspector.substring(0, 15)}${inspector.length > 15 ? '...' : ''} )` : '( ........................................ )'}
              </p>
            </div>
          </div>
        </div>

        <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] text-center mt-12 pt-8 border-t border-slate-200 dark:border-white/10 italic print:border-slate-200 print:text-slate-500">
          SMART-PPI DIGITAL AUDIT SYSTEM • GENERATED REPORT
        </div>
      </div>

      {/* Image Modal for Web View */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out print:hidden"
          >
            <img src={zoomedImage} alt="Zoomed Dokumentasi" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10" />
            <div className="absolute top-6 right-6 px-4 py-2 bg-white/10 rounded-full text-white text-xs font-bold uppercase tracking-widest">Tutup</div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @media print {
          body { 
            background: white !important; 
            margin: 0; 
            padding: 0;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          body * { visibility: hidden; }
          .printable-container, .printable-container * { visibility: visible; }
          .printable-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background-color: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
