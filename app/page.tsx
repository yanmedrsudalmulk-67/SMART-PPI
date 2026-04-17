'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { useAppContext } from '@/components/providers';
import { ShieldCheck } from 'lucide-react';

export default function WelcomePage() {
  const { logoUrl } = useAppContext();

  return (
    <div className="h-screen w-full bg-navy-dark text-white relative overflow-hidden font-sans flex flex-col">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full point-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Header - Hospital Branding */}
      <header className="relative z-10 w-full px-6 md:px-12 py-6 flex items-center justify-center md:justify-start">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex items-center gap-4"
        >
          {/* Hospital Logo */}
          <div className="w-12 h-12 flex-shrink-0 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo RS" className="w-full h-full object-contain p-1" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            )}
          </div>
          
          {/* Hospital Text */}
          <div className="flex flex-col text-left">
            <span className="font-heading font-bold text-lg md:text-xl tracking-wide text-white leading-tight">
              UOBK RSUD AL-MULK
            </span>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              KOTA SUKABUMI
            </span>
          </div>
        </motion.div>
      </header>

      {/* Main Hero Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="text-center max-w-3xl w-full flex flex-col items-center"
        >
          {/* Title */}
          <h1 className="text-6xl md:text-8xl lg:text-[100px] font-heading font-bold leading-[1.1] tracking-tight relative mb-6">
            <span className="text-gradient drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">SMART PPI</span>
            {/* Subtle inner glow */}
            <span className="absolute inset-0 blur-[40px] text-gradient opacity-30 -z-10">SMART PPI</span>
          </h1>
          
          {/* Description */}
          <p className="text-slate-300 text-[19px] max-w-xl mx-auto mb-12 leading-relaxed text-center font-medium">
            Sistem Monitoring, Audit dan Supervisi Terintegrasi Pencegahan dan Pengendalian Infeksi
          </p>

          {/* CTA Box / Button Area */}
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 2, 
              ease: "easeInOut", 
              repeat: Infinity 
            }}
            className="mt-4"
          >
            <Link 
              href="/login" 
              className="group relative inline-flex items-center justify-center px-12 py-5 bg-blue-600 font-heading font-bold text-white text-lg rounded-full overflow-hidden transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.5)] hover:-translate-y-1"
            >
              {/* Inner glow effect on button */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-400/0 via-blue-400/30 to-purple-500/0 -translate-x-[100%] group-hover:animate-shimmer" />
              <span className="relative z-10 flex items-center gap-2 tracking-wider">
                Ayo Mulai
              </span>
            </Link>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}
