'use client';

import { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck,
  ShieldAlert,
  Activity,
  ClipboardCheck,
  Plus,
  Droplets,
  Shield,
  Trash2,
  Syringe,
  Shirt,
  Wind,
  Bed,
  UserCheck,
  Sparkles,
  FlaskConical,
  Stethoscope,
  BriefcaseMedical,
  Users,
  Truck,
  Coffee,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

const standarIndicators = [
  { id: 'hh', title: 'Kepatuhan Kebersihan Tangan', desc: 'Kepatuhan petugas dalam melakukan 5 momen dan 6 langkah cuci tangan', icon: Droplets },
  { id: 'apd', title: 'Kepatuhan Penggunaan APD', desc: 'Ketersediaan dan kepatuhan penggunaan APD sesuai indikasi.', icon: Shield },
  { id: 'alat', title: 'Dekontaminasi Alat', desc: 'Proses pembersihan, disinfeksi, dan sterilisasi peralatan perawatan pasien.', icon: Stethoscope },
  { id: 'lingkungan', title: 'Pengendalian Lingkungan', desc: 'Kebersihan permukaan lingkungan, tempat tidur, dan peralatan di sekitarnya.', icon: Sparkles },
  { id: 'limbah_medis', title: 'Pengelolaan Limbah Medis', desc: 'Pemisahan limbah infeksius dan non-infeksius, tempat sampah tertutup.', icon: Trash2 },
  { id: 'limbah_tajam', title: 'Pengelolaan Limbah Tajam', desc: 'Ketersediaan dan kondisi safety box (tidak > 3/4 penuh).', icon: Syringe },
  { id: 'linen', title: 'Penatalaksanaan Linen', desc: 'Pemisahan linen kotor infeksius dan non-infeksius, troli tertutup.', icon: Shirt },
  { id: 'petugas', title: 'Perlindungan Kesehatan Petugas', desc: 'Pemeriksaan kesehatan berkala, imunisasi, penanganan pasca pajanan.', icon: UserCheck },
  { id: 'penempatan', title: 'Penempatan Pasien', desc: 'Penempatan pasien sesuai dengan cara penularan infeksi.', icon: Bed },
  { id: 'etika', title: 'Etika Batuk', desc: 'Edukasi dan fasilitas etika batuk (masker, tempat sampah).', icon: Wind },
  { id: 'suntik', title: 'Penyuntikan Yang Aman', desc: 'Penggunaan spuit sekali pakai, teknik aseptik.', icon: Syringe },
];

const transmisiIndicators = [
  { id: 'ruang_isolasi', title: 'Ruang Isolasi', desc: 'Audit fasilitas dan kepatuhan prosedur di dalam ruang isolasi.', icon: Home },
  { id: 'isolasi_ppi', title: 'PPI di Ruang Isolasi', desc: 'Kepatuhan petugas dan pengunjung di ruang isolasi.', icon: ShieldAlert },
  { id: 'airborne', title: 'Penempatan Pasien Airborne', desc: 'Ruang tekanan negatif, exhaust fan, pintu tertutup.', icon: Wind },
  { id: 'immuno', title: 'Penempatan Pasien Immunocompromised', desc: 'Ruang tekanan positif, perlindungan maksimal.', icon: ShieldCheck },
];

const monitoringIndicators = [
  { id: 'fasilitas_hh', title: 'Fasilitas Kebersihan Tangan', desc: 'Audit ketersediaan wastafel, sabun, dan handrub.', icon: Droplets },
  { id: 'fasilitas_apd', title: 'Fasilitas APD', desc: 'Audit ketersediaan stok APD di unit kerja.', icon: Shield },
  { id: 'ibs', title: 'Instalasi Bedah Sentral (IBS)', desc: 'Audit kepatuhan PPI di area kamar operasi.', icon: Activity },
  { id: 'cssd', title: 'CSSD', desc: 'Audit proses sterilisasi di pusat sterilisasi.', icon: Sparkles },
  { id: 'laboratorium', title: 'Laboratorium', desc: 'Audit kepatuhan PPI di area laboratorium.', icon: FlaskConical },
  { id: 'radiologi', title: 'Radiologi', desc: 'Audit kepatuhan PPI di area radiologi.', icon: Activity },
  { id: 'gizi', title: 'Gizi', desc: 'Audit higiene sanitasi makanan dan dapur gizi.', icon: Coffee },
  { id: 'jenazah', title: 'Kamar Jenazah', desc: 'Audit kepatuhan PPI di area pemulasaraan jenazah.', icon: Bed },
  { id: 'ambulance', title: 'Ambulance', desc: 'Audit kebersihan dan disinfeksi armada ambulance.', icon: Truck },
  { id: 'tps', title: 'Tempat Pembuangan Sampah (TPS)', desc: 'Audit pengelolaan limbah di area TPS.', icon: Trash2 },
  { id: 'tunggu', title: 'Ruang Tunggu', desc: 'Audit kebersihan dan fasilitas di ruang tunggu.', icon: Users },
  { id: 'farmasi', title: 'Farmasi', desc: 'Audit kepatuhan PPI di area Instalasi Farmasi.', icon: BriefcaseMedical },
];

export default function IsolasiInputPage() {
  const [activeTab, setActiveTab] = useState<'standar' | 'transmisi' | 'monitoring'>('standar');

  const currentIndicators = useMemo(() => {
    if (activeTab === 'standar') return standarIndicators;
    if (activeTab === 'transmisi') return transmisiIndicators;
    return monitoringIndicators;
  }, [activeTab]);

  return (
    <div className="max-w-6xl mx-auto pb-28 px-4 sm:px-6">

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 relative py-4 z-10 border-b border-white/5">
        <Link href="/dashboard/input" className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-[30px] font-heading font-bold tracking-tight text-gradient drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">Kewaspadaan Isolasi</h1>
          <p className="text-[15px] font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">Input Data Audit</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white/5 rounded-xl mb-6 border border-white/5 relative z-10 mt-2">
        <button
          onClick={() => setActiveTab('standar')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
            activeTab === 'standar' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Standar
        </button>
        <button
          onClick={() => {
            setActiveTab('transmisi');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
            activeTab === 'transmisi' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Transmisi
        </button>
        <button
          onClick={() => {
            setActiveTab('monitoring');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
            activeTab === 'monitoring' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Activity className="w-4 h-4" /> Monitoring
        </button>
      </div>

      <div className="space-y-4">
        {/* Indicators */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {currentIndicators.map((ind, i) => (
              <motion.div 
                key={ind.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 sm:p-6 rounded-[2rem] border-white/5 overflow-hidden flex flex-col justify-between group hover:border-blue-500/30 transition-all duration-500"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl group-hover:bg-gradient-to-br group-hover:from-blue-500/20 group-hover:to-blue-600/20 group-hover:border-blue-500/50 group-hover:scale-[1.05] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-500 glass-card">
                      {ind.icon && <ind.icon className="w-6 h-6 text-slate-400 group-hover:text-blue-400 transition-colors duration-500" />}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-white text-base sm:text-lg leading-tight group-hover:text-blue-400 transition-colors">{ind.title}</h3>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-2 leading-relaxed line-clamp-2 md:line-clamp-3">{ind.desc}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 mt-6">
                  <Link 
                    href={
                      ind.id === 'hh' ? "/dashboard/input/hand-hygiene" : 
                      ind.id === 'apd' ? "/dashboard/input/apd" : 
                      ind.id === 'alat' ? "/dashboard/input/dekontaminasi-alat" : 
                      ind.id === 'lingkungan' ? "/dashboard/input/pengendalian-lingkungan" :
                      ind.id === 'limbah_medis' ? "/dashboard/input/pengelolaan-limbah-medis" :
                      ind.id === 'limbah_tajam' ? "/dashboard/input/pengelolaan-limbah-tajam" :
                      ind.id === 'petugas' ? "/dashboard/input/perlindungan-petugas" :
                      ind.id === 'penempatan' ? "/dashboard/input/penempatan-pasien" :
                      ind.id === 'etika' ? "/dashboard/input/etika-batuk" :
                      ind.id === 'suntik' ? "/dashboard/input/penyuntikan-aman" :
                      ind.id === 'ruang_isolasi' ? "/dashboard/input/ruang-isolasi" :
                      ind.id === 'isolasi_ppi' ? "/dashboard/input/ppi-ruang-isolasi" :
                      ind.id.startsWith('fasilitas') || ['ibs', 'cssd', 'laboratorium', 'radiologi', 'gizi', 'jenazah', 'ambulance', 'tps', 'tunggu', 'farmasi', 'airborne', 'immuno'].includes(ind.id) ? `/dashboard/input/monitoring-${ind.id}` :
                      "/dashboard/input/penatalaksanaan-linen"
                    } 
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500 hover:to-blue-600 border border-blue-500/20 hover:border-blue-500 text-blue-400 hover:text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 hover:-translate-y-1 relative group overflow-hidden shadow-lg shadow-blue-500/5 hover:shadow-blue-500/25 active:scale-95"
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                    Input Data
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
        
        {/* Because this page is now view-only/informational navigation, we don't need a save button */}
      </div>
  );
}
