import React, { useState, useEffect, useMemo } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Check, ShieldCheck, FileText, Camera } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Image from 'next/image';
import { useAppContext } from '@/components/providers';

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
  tanda_tangan_1?: string;
  tanda_tangan_2?: string;
  tanda_tangan?: string[];
}

export default function DekontaminasiAlatReport({ 
  filters 
}: { 
  filters?: { dateRange?: { from: string; to: string }; unitFilter?: string; searchQuery?: string }
}) {
  const [data, setData] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { hospitalLogoUrl } = useAppContext();
  
  const supabase = getSupabase();

  const indicatorItems = [
    { id: 'peralatan_tersedia', label: '1. PERALATAN TERSEDIA DAN TERSUSUN BAIK DI MEJA DAN LEMARI', key: 'peralatan_tersedia' },
    { id: 'peralatan_berkarat', label: '2. ADAKAH PERALATAN SARANA DAN PRASARANA KESEHATAN YANG BERKARAT', key: 'peralatan_berkarat' },
    { id: 'sterilisasi_tersentral', label: '3. STERILISASI TERSENTRAL', key: 'sterilisasi_tersentral' },
    { id: 'alat_reused', label: '4. ALAT USED REUSED SESUAI ATURAN', key: 'alat_reused' },
    { id: 'metode_dekontaminasi', label: '5. PETUGAS DAPAT MENJELASKAN METODA DEKONTAMINASI PERALATAN YANG BIASA DIGUNAKAN PASIEN', key: 'metode_dekontaminasi' },
    { id: 'dekontaminasi_lokal', label: '6. DEKONTAMINASI LOKAL DARI INSTRUMEN BEDAH TIDAK DILAKUKAN DI AREA KLINIS (JIKA MEMUNGKINKAN)', key: 'dekontaminasi_lokal' },
    { id: 'expired_date', label: '7. TANGGAL KADALUARSA PERALATAN STERIL BELUM TERLEWATI', key: 'expired_date' },
    { id: 'instrumen_bekas', label: '8. TIDAK TERLIHAT DEBU / DARAH TERTINGGAL DI INSTRUMEN BEKAS PAKAI', key: 'instrumen_bekas' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: result, error } = await supabase
        .from('audit_dekontaminasi_alat')
        .select('*')
        .order('tanggal_waktu', { ascending: false });
        
      if (!error && result) {
        const normalized = result.map((item: any) => ({
          ...item,
          waktu: item.tanggal_waktu || item.waktu || item.created_at,
          checklist_json: item.checklist_json || item.data_indikator || item.checklist_data || {},
          persentase: item.persentase !== undefined ? item.persentase : (item.compliance_score !== undefined ? item.compliance_score : 0),
          tanda_tangan_1: item.tanda_tangan_1 || item.ttd_pj_ruangan || item.tanda_tangan?.[0],
          tanda_tangan_2: item.tanda_tangan_2 || item.ttd_ipcn || item.tanda_tangan?.[1],
          foto: item.foto || item.dokumentasi || []
        }));
        setData(normalized);
      }
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  const filteredRecords = useMemo(() => {
    let filteredData = data;
    if (filters) {
      filteredData = data.filter(item => {
        if (filters.dateRange && filters.dateRange.from && filters.dateRange.to && item.waktu) {
           const itemDateStr = String(item.waktu || '').split('T')[0];
           if (itemDateStr < filters.dateRange.from || itemDateStr > filters.dateRange.to) {
             return false;
           }
        }
        if (filters.unitFilter && filters.unitFilter !== 'Semua Unit') {
          if (item.unit !== filters.unitFilter && item.ruangan !== filters.unitFilter) return false;
        }
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          if (!item.observer?.toLowerCase().includes(query) && 
              !item.unit?.toLowerCase().includes(query) &&
              !item.ruangan?.toLowerCase().includes(query)) {
            return false;
          }
        }
        return true;
      });
    }
    return filteredData;
  }, [data, filters]);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-20 animate-pulse">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const selectedRecord = filteredRecords[0] || data[0];

  if (!selectedRecord) {
    return (
       <div className="w-full bg-force-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-bold uppercase tracking-widest print:hidden">
         Belum ada data untuk laporan ini.
       </div>
    );
  }

  const auditDate = selectedRecord.tanggal_waktu || selectedRecord.waktu;
  const inspector = selectedRecord.supervisor || selectedRecord.observer;
  const unit = selectedRecord.ruangan || selectedRecord.unit;
  const checklist = selectedRecord.checklist_json || {};
  
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

  const images = Array.isArray(selectedRecord.foto) ? selectedRecord.foto : (typeof selectedRecord.foto === 'string' ? [selectedRecord.foto] : []);
  const generatedDate = format(new Date(), 'dd MMMM yyyy HH:mm', { locale: idLocale });

  return (
    <div className="w-full font-sans bg-force-white text-force-black print:bg-force-white print:text-force-black">
      
        {/* Header Laporan Resmi */}
      <div className="p-8 pb-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b-4 border-slate-300 pb-6">
          <div className="flex items-center gap-5 w-full justify-center text-center">
             <div className="w-20 h-20 bg-force-white flex items-center justify-center p-1 border-2 border-slate-300">
               {hospitalLogoUrl ? (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={hospitalLogoUrl} alt="Logo RS" className="w-full h-full object-contain" />
               ) : (
                 <ShieldCheck className="w-12 h-12 text-force-black" />
               )}
             </div>
             <div className="text-left">
               <h1 className="text-2xl font-black tracking-tight leading-tight uppercase font-heading text-force-black">
                 TIM PENCEGAHAN & PENGENDALIAN INFEKSI
               </h1>
               <p className="text-sm font-bold uppercase text-force-black tracking-widest mt-1">UOBK RSUD AL-MULK KOTA SUKABUMI</p>
               <p className="text-xs text-force-black mt-1 italic">Jl. Pelabuhan II, Kec. Lembursitu, Kota Sukabumi, Jawa Barat</p>
             </div>
          </div>
        </div>

        {/* Judul Laporan */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight font-heading text-force-black w-full text-center">
            LAPORAN AUDIT DEKONTAMINASI ALAT
          </h2>
        </div>

        {/* Info Audit Grid */}
        <div className="w-full mb-8 border-t border-l border-r border-slate-300 border-collapse grid grid-cols-3">
          <div className="border-b border-slate-300 p-3 border-r">
            <p className="text-[10px] font-black uppercase tracking-widest text-force-black flex items-center gap-2">
              Waktu Pelaksanaan
            </p>
            <div className="font-bold text-sm text-force-black">
              {auditDate ? format(new Date(auditDate), 'dd MMM yyyy HH:mm', { locale: idLocale }) : '-'}
            </div>
          </div>
          <div className="border-b border-slate-300 p-3 border-r">
            <p className="text-[10px] font-black uppercase tracking-widest text-force-black flex items-center gap-2">
              Supervisor / IPCN
            </p>
            <p className="font-bold text-sm uppercase text-force-black">{inspector || '-'}</p>
          </div>
          <div className="border-b border-slate-300 p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-force-black flex items-center gap-2">
              Unit / Ruangan
            </p>
            <p className="font-bold text-sm uppercase text-force-black">{unit || '-'}</p>
          </div>
        </div>

        {/* Tabel Audit Utama */}
        <div className="mb-10 overflow-x-auto print:overflow-visible">
          <table className="w-full min-w-[700px] border-collapse text-left text-sm text-force-black bg-force-white border border-slate-300">
            <thead>
              <tr className="bg-force-white font-bold uppercase tracking-widest text-[11px] border-b border-slate-300">
                <th className="px-4 py-3 w-12 text-center border-r border-slate-300 text-force-black">NO</th>
                <th className="px-6 py-3 border-r border-slate-300 text-force-black">STANDAR</th>
                <th className="px-4 py-3 w-16 text-center border-r border-slate-300 text-force-black">YA</th>
                <th className="px-4 py-3 w-16 text-center border-r border-slate-300 text-force-black">TIDAK</th>
                <th className="px-4 py-3 w-16 text-center border-r border-slate-300 text-force-black">N/A</th>
                <th className="px-6 py-3 text-force-black">KETERANGAN</th>
              </tr>
            </thead>
            <tbody>
              {indicatorItems.map((item, itemIdx) => {
                const status = getStatus(item.key);
                const ket = getKeterangan(item.key);
                return (
                  <tr key={item.id} className="border-b border-slate-300 text-force-black">
                    <td className="px-4 py-3 text-center border-r border-slate-300 font-bold">{itemIdx + 1}</td>
                    <td className="px-6 py-3 font-semibold border-r border-slate-300 leading-snug">{item.label}</td>
                    <td className="px-4 py-3 text-center border-r border-slate-300 align-middle">
                      {status === 'ya' && <span className="font-bold text-lg">✓</span>}
                    </td>
                    <td className="px-4 py-3 text-center border-r border-slate-300 align-middle">
                      {status === 'tidak' && <span className="font-bold text-lg">✓</span>}
                    </td>
                    <td className="px-4 py-3 text-center border-r border-slate-300 align-middle">
                      {status === 'na' && <span className="font-bold text-lg">✓</span>}
                    </td>
                    <td className="px-6 py-3 text-xs italic border-slate-300">{ket}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Hasil & Kepatuhan */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          <div className="col-span-3 grid grid-cols-3 gap-6">
            <div className="p-4 border border-slate-300 text-center flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-force-black mb-2">Patuh (Ya)</p>
              <p className="text-3xl font-black text-force-black font-mono">
                {Object.values(checklist).filter(v => (typeof v === 'string' ? v.toLowerCase() : v?.status?.toLowerCase()) === 'ya').length}
              </p>
            </div>
            <div className="p-4 border border-slate-300 text-center flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-force-black mb-2">Tidak Patuh</p>
              <p className="text-3xl font-black text-force-black font-mono">
                {Object.values(checklist).filter(v => (typeof v === 'string' ? v.toLowerCase() : v?.status?.toLowerCase()) === 'tidak').length}
              </p>
            </div>
            <div className="p-4 border border-slate-300 text-center flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-force-black mb-2">N/A</p>
              <p className="text-3xl font-black text-force-black font-mono">
                {Object.values(checklist).filter(v => (typeof v === 'string' ? v.toLowerCase() : v?.status?.toLowerCase()) === 'na').length}
              </p>
            </div>
          </div>
          <div className="border border-slate-300 p-4 flex flex-col items-center justify-center text-center">
             <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-force-black">Compliance Rate</p>
             <p className="text-5xl font-black font-heading mb-2 text-force-black">{selectedRecord.persentase}%</p>
             <div className="text-[11px] font-black uppercase tracking-widest py-1 text-force-black">
               {selectedRecord.persentase >= 85 ? 'SESUAI STANDAR' : 'TIDAK SESUAI'}
             </div>
          </div>
        </div>

        {/* Temuan & Rekomendasi */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="border border-slate-300 p-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-force-black mb-4 border-b border-slate-300 pb-2">
              Rincian Temuan Lapangan
            </h4>
            <div className="text-sm text-force-black leading-relaxed whitespace-pre-wrap">
              {selectedRecord.temuan || <span className="italic">Tidak ada temuan spesifik yang dicatat.</span>}
            </div>
          </div>
          <div className="border border-slate-300 p-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-force-black mb-4 border-b border-slate-300 pb-2">
              Rekomendasi & Tindak Lanjut
            </h4>
            <div className="text-sm text-force-black leading-relaxed whitespace-pre-wrap">
              {selectedRecord.rekomendasi || <span className="italic">Sesuai dengan standar prosedur operasional yang berlaku.</span>}
            </div>
          </div>
        </div>

        {/* Tanda Tangan */}
        <div className="grid grid-cols-2 gap-12 mt-12 mb-8 page-break-inside-avoid">
          <div className="text-center space-y-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-force-black mb-6">Penanggung Jawab / Auditee</p>
            <div className="h-24 relative w-full flex justify-center items-center">
              {selectedRecord.tanda_tangan_1 ? (
                <img src={selectedRecord.tanda_tangan_1} className="object-contain h-full" alt="TTD PJ" />
              ) : (
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black italic">Tanpa Tanda Tangan</span>
              )}
            </div>
            <div className="pt-2 border-t border-slate-300 inline-block w-64 mx-auto">
              <p className="font-bold text-xs uppercase tracking-wider text-force-black mt-1">( ........................................ )</p>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-force-black mb-6">Auditor / Tim IPCN</p>
            <div className="h-24 relative w-full flex justify-center items-center">
              {selectedRecord.tanda_tangan_2 ? (
                <img src={selectedRecord.tanda_tangan_2} className="object-contain h-full" alt="TTD IPCN" />
              ) : (
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black italic">Tanpa Tanda Tangan</span>
              )}
            </div>
            <div className="pt-2 border-t border-slate-300 inline-block w-64 mx-auto">
              <p className="font-bold text-xs uppercase tracking-wider text-force-black mt-1">
                {inspector ? `( ${inspector.substring(0, 20)}${inspector.length > 20 ? '...' : ''} )` : '( ........................................ )'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Dokumentasi List */}
        {images.length > 0 && (
           <div className="mt-12 pt-8 border-t border-slate-300">
             <h4 className="text-xs font-black uppercase tracking-widest text-force-black mb-4 flex items-center gap-2">
               <Camera className="w-4 h-4 text-force-black" /> Lampiran Dokumentasi
             </h4>
             <div className="grid grid-cols-4 gap-4">
               {images.map((url, i) => (
                 <div key={i} className="aspect-video relative border border-slate-300 p-1">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={url} alt={`Dokumentasi ${i+1}`} className="w-full h-full object-cover" />
                 </div>
               ))}
             </div>
           </div>
        )}

      </div>
    </div>
  );
}
