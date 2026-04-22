'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/components/providers';
import { ShieldCheck, Activity, CheckCircle2, Clock, Sun, Moon, BarChart3, TrendingUp } from 'lucide-react';

export default function WelcomePage() {
  const { hospitalLogoUrl } = useAppContext();
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Avoid sync setState error
    setTimeout(() => {
      setMounted(true);
      // Resume correct theme from local storage if available
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light') {
        setIsDark(false);
      } else {
        setIsDark(true);
      }
      setTime(new Date());
    }, 0);

    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync theme changes with HTML root
  useEffect(() => {
    if (!mounted) return;
    if (isDark) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark, mounted]);

  // Don't render complex UI before hydration to prevent mismatch
  if (!mounted) return null;

  return (
    <div className={`h-screen w-full transition-colors duration-700 ease-in-out relative flex flex-col items-center justify-center overflow-hidden font-sans ${isDark ? 'bg-[#0a0f1c] text-white' : 'bg-[#ffffff] text-[#0A2F1D]'}`}>
      {/* Dynamic Animated Background Blob */}
      <motion.div
        animate={{
          scale: [1, 1.2, 0.9, 1.1, 1],
          rotate: [0, 90, 180, 270, 360],
          borderRadius: ["40% 60% 70% 30%", "50% 50% 30% 70%", "60% 40% 50% 50%", "30% 70% 70% 30%", "40% 60% 70% 30%"]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className={`absolute w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-gradient-to-tr blur-[80px] opacity-60 pointer-events-none transition-colors duration-1000 ${isDark ? 'mix-blend-screen from-blue-600/40 via-purple-600/40 to-emerald-500/40' : 'mix-blend-multiply from-[#38C968]/30 via-[#0F3D2E]/20 to-[#38C968]/30 opacity-70 blur-[100px]'}`}
      />
      
      {/* Background Glows */}
      <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full pointer-events-none transition-colors duration-700 ${isDark ? 'bg-blue-600/10' : 'bg-[#38C968]/20'}`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full pointer-events-none transition-colors duration-700 ${isDark ? 'bg-purple-600/10' : 'bg-[#0F3D2E]/10'}`} />

      {/* Decorative Floating Glass UI Widgets (Video Animation Style) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden max-w-[1440px] mx-auto w-full z-10">
        {/* Widget 1: Digital Clock (Hidden on Mobile) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.6, type: "spring", bounce: 0.5 }}
          className="absolute top-[12%] left-[4%] lg:top-[20%] lg:left-[15%] hidden md:block z-30"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0 }}
            className={`flex items-center gap-3 backdrop-blur-xl shadow-2xl pointer-events-auto transition-colors duration-500 p-3 sm:p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/60 border-white/80 hover:bg-white/80 text-[#0F3D2E]'}`}
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-colors duration-500 drop-shadow flex-shrink-0 ${isDark ? 'bg-blue-500/20 border-blue-500/30' : 'bg-[#38C968]/20 border-[#38C968]/30'}`}>
              <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-blue-400' : 'text-[#0A2F1D]'}`} />
            </div>
            <div className="flex flex-col min-w-[70px]">
              <motion.span 
                 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}
                 className={`text-[8px] sm:text-[10px] uppercase tracking-wider font-bold transition-colors duration-500 ${isDark ? 'text-slate-400' : 'text-[#0F3D2E]/60'}`}
              >
                Waktu Sistem
              </motion.span>
              <motion.span 
                 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.3 }}
                 className={`text-xs sm:text-sm font-bold font-mono tracking-widest leading-none mt-0.5 transition-colors duration-500 ${isDark ? 'text-white' : 'text-[#0A2F1D]'}`}
              >
                {mounted && time ? time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '00:00:00'}
              </motion.span>
            </div>
          </motion.div>
        </motion.div>

        {/* Widget 2: Kepatuhan (Hidden on Mobile) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.8, type: "spring", bounce: 0.5 }}
          className="absolute bottom-[20%] right-[4%] lg:bottom-[25%] lg:right-[15%] hidden md:block z-30"
        >
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className={`flex items-center gap-3 backdrop-blur-xl shadow-2xl pointer-events-auto transition-colors duration-500 p-3 sm:p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/60 border-white/80 hover:bg-white/80 text-[#0F3D2E]'}`}
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-colors duration-500 drop-shadow flex-shrink-0 ${isDark ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-[#38C968]/20 border-[#38C968]/30'}`}>
              <Activity className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-500 ${isDark ? 'text-emerald-400' : 'text-[#0F3D2E]'}`} />
            </div>
            <div className="flex flex-col">
              <motion.span 
                 initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }}
                 className={`text-[8px] sm:text-[10px] uppercase tracking-wider font-bold text-right transition-colors duration-500 ${isDark ? 'text-slate-400' : 'text-[#0F3D2E]/60'}`}
              >
                Standar PPI
              </motion.span>
              <motion.span 
                 initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 }}
                 className={`text-xs sm:text-sm font-bold text-right leading-none mt-0.5 transition-colors duration-500 ${isDark ? 'text-white' : 'text-[#0A2F1D]'}`}
              >
                Real-time
              </motion.span>
            </div>
          </motion.div>
        </motion.div>

        {/* Widget 3: Mini Chart -> Graphic (Hidden on Mobile) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1, type: "spring", bounce: 0.5 }}
          className="absolute top-[17%] right-[4%] lg:top-[35%] lg:right-[10%] hidden md:block z-30"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className={`flex flex-col gap-2 w-32 sm:w-44 backdrop-blur-xl shadow-2xl pointer-events-auto hover:scale-105 transition-all duration-500 p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-white/80'}`}
          >
             <div className="flex items-center gap-2 mb-1">
               <div className={`p-1 rounded bg-white/10 ${isDark ? 'text-blue-400' : 'text-[#059669]'}`}>
                 <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
               </div>
               <span className={`text-[9px] sm:text-[11px] uppercase tracking-wider font-bold transition-colors duration-500 ${isDark ? 'text-white' : 'text-[#0A2F1D]'}`}>Grafik</span>
             </div>
             
             <div className={`h-1.5 sm:h-2 w-full rounded-full overflow-hidden transition-colors duration-500 drop-shadow-sm ${isDark ? 'bg-slate-800/80' : 'bg-[#0F3D2E]/10'}`}>
               <motion.div 
                 initial={{ width: 0 }} animate={{ width: "85%" }} transition={{ duration: 1.2, delay: 1.6, ease: "easeOut" }}
                 className={`h-full transition-colors duration-500 bg-gradient-to-r ${isDark ? 'from-blue-500 to-blue-400' : 'from-blue-500 to-blue-400'}`}
               />
             </div>
             <div className={`h-1.5 sm:h-2 w-full rounded-full overflow-hidden transition-colors duration-500 drop-shadow-sm ${isDark ? 'bg-slate-800/80' : 'bg-[#0F3D2E]/10'}`}>
               <motion.div 
                 initial={{ width: 0 }} animate={{ width: "65%" }} transition={{ duration: 1.2, delay: 1.8, ease: "easeOut" }}
                 className={`h-full transition-colors duration-500 bg-gradient-to-r ${isDark ? 'from-purple-500 to-purple-400' : 'from-[#38C968] to-[#10b981]'}`}
               />
             </div>
             <div className={`h-1.5 sm:h-2 w-full rounded-full overflow-hidden transition-colors duration-500 drop-shadow-sm ${isDark ? 'bg-slate-800/80' : 'bg-[#0F3D2E]/10'}`}>
               <motion.div 
                 initial={{ width: 0 }} animate={{ width: "95%" }} transition={{ duration: 1.2, delay: 2.0, ease: "easeOut" }}
                 className={`h-full transition-colors duration-500 bg-gradient-to-r ${isDark ? 'from-emerald-500 to-emerald-400' : 'from-[#10b981] to-[#059669]'}`}
               />
             </div>
          </motion.div>
        </motion.div>

        {/* Widget 4: Mini Data Persentase Capaian (Hidden on Mobile) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1.2, type: "spring", bounce: 0.5 }}
          className="absolute bottom-[27%] left-[6%] lg:bottom-[40%] lg:left-[10%] hidden md:block z-30"
        >
          <motion.div
             animate={{ y: [0, -14, 0] }}
             transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
             className={`flex flex-col items-center justify-center backdrop-blur-xl shadow-2xl pointer-events-auto hover:rotate-6 transition-all duration-500 p-3 sm:p-5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-white/80'}`}
          >
             <div className="flex items-end gap-1 mb-1">
               <TrendingUp className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 ${isDark ? 'text-purple-400' : 'text-[#059669]'}`} />
               <h4 className={`text-2xl sm:text-3xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-[#0A2F1D]'}`}>98<span className="text-sm sm:text-lg">%</span></h4>
             </div>
             <p className={`text-[8px] sm:text-[10px] uppercase font-bold tracking-widest ${isDark ? 'text-slate-400' : 'text-[#0F3D2E]/70'}`}>Capaian PPI</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Header - Hospital Branding & Theme Toggle */}
      <header className="absolute top-0 left-0 w-full px-6 md:px-12 py-6 flex items-center justify-between z-20">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="flex items-center gap-4"
        >
          {/* Hospital Logo */}
          <div className={`w-12 h-12 flex-shrink-0 border rounded-xl flex items-center justify-center overflow-hidden backdrop-blur-md transition-colors duration-500 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-white/80 shadow-sm'}`}>
            {hospitalLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hospitalLogoUrl} alt="Logo RS" className="w-full h-full object-contain p-1" />
            ) : (
              <ShieldCheck className={`w-6 h-6 transition-colors duration-500 ${isDark ? 'text-blue-500' : 'text-[#0F3D2E]'}`} />
            )}
          </div>
          
          {/* Hospital Text */}
          <div className="flex flex-col text-left transition-colors duration-500">
            <span className={`font-heading font-bold text-lg md:text-xl tracking-wide leading-tight transition-colors duration-500 ${isDark ? 'text-white' : 'text-[#0F3D2E]'}`}>
              UOBK RSUD AL-MULK
            </span>
            <span className={`text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${isDark ? 'text-slate-400' : 'text-[#0F3D2E]/60'}`}>
              KOTA SUKABUMI
            </span>
          </div>
        </motion.div>

        {/* Futuristic Glass Theme Toggle (Match the video) */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
          className="flex items-center gap-3 sm:gap-4"
        >
          <AnimatePresence mode="wait">
            <motion.span 
              key={isDark ? "dark" : "light"}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={`font-heading font-bold text-lg md:text-xl transition-colors duration-500 tracking-wide hidden sm:block ${isDark ? 'text-slate-400' : 'text-[#0F3D2E]/60'}`}
            >
              {isDark ? 'Dark' : 'Light'}
            </motion.span>
          </AnimatePresence>
          
          <button
            onClick={() => setIsDark(!isDark)}
            className={`relative w-[84px] sm:w-[94px] h-[40px] sm:h-[48px] rounded-full p-1.5 flex items-center transition-all duration-500 ease-in-out cursor-pointer overflow-hidden ${
              isDark 
                ? 'bg-[#1e293b]/80 backdrop-blur-md shadow-[inset_0_4px_15px_rgba(0,0,0,0.4)] border border-slate-700/50' 
                : 'bg-white/80 backdrop-blur-md shadow-[inset_0_4px_10px_rgba(0,0,0,0.05),0_4px_15px_rgba(0,0,0,0.05)] border border-white/80'
            }`}
          >
            {/* Soft inner glow to mimic glass switch depth */}
            <div className="absolute inset-0 w-full h-full pointer-events-none rounded-full shadow-inner opacity-50 mix-blend-overlay"></div>
            
            {/* Left Icon (Sun) - background static */}
            <div className={`absolute left-[12px] sm:left-[14px] top-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-300 ${!isDark ? 'opacity-100' : 'opacity-30'}`}>
              <Sun className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-500 ${isDark ? 'text-slate-400' : 'text-[#0F3D2E]/50'}`} />
            </div>
            
            {/* Right Icon (Moon/Wave) - background static */}
            <div className={`absolute right-[12px] sm:right-[14px] top-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-30'}`}>
              <Moon className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-500 ${isDark ? 'text-slate-600' : 'text-[#0F3D2E] font-bold'}`} />
            </div>

            {/* Glowing sliding thumb that carries the active icon */}
            <motion.div
              initial={false}
              animate={{ 
                x: isDark ? (typeof window !== 'undefined' && window.innerWidth < 640 ? 44 : 46) : 0, 
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`relative h-[28px] w-[28px] sm:h-[36px] sm:w-[36px] flex items-center justify-center rounded-full shadow-[inset_0_0_5px_rgba(255,255,255,0.4)] z-10 transition-colors duration-500 ${isDark ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.7)]' : 'bg-[#38C968] shadow-[0_0_15px_rgba(56,201,104,0.7)]'}`}
            >
                {isDark ? <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white drop-shadow-md" /> : <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white drop-shadow-md" />}
            </motion.div>
          </button>
        </motion.div>
      </header>

      {/* Main Hero Content */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 mt-12 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
          className="text-center max-w-4xl w-full flex flex-col items-center"
        >
          {/* Title */}
          <h1 className="text-6xl md:text-[100px] lg:text-[120px] font-heading font-black leading-[1.1] tracking-tighter relative mb-6 md:mb-10 lg:mb-8">
            <motion.span 
              initial={{ y: 20, opacity: 0, backgroundPosition: "0% 50%" }} 
              animate={{ y: 0, opacity: 1, backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} 
              transition={{ 
                y: { duration: 0.8, delay: 0.6 },
                opacity: { duration: 0.8, delay: 0.6 },
                backgroundPosition: { duration: 6, repeat: Infinity, ease: "linear" } 
              }}
              style={{ backgroundSize: "200% auto" }}
              className={`block text-transparent bg-clip-text bg-gradient-to-r drop-shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-colors duration-500 ${isDark ? 'from-blue-400 via-purple-500 to-blue-400' : 'from-blue-500 via-[#38C968] to-blue-500'}`}
            >
              SMART PPI
            </motion.span>
          </h1>
          
          {/* Description */}
          <motion.div 
             initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.8 }}
             className={`text-[14px] sm:text-[16px] md:text-2xl lg:text-[20px] max-w-3xl mx-auto mb-14 flex flex-col leading-relaxed text-center font-medium gap-1 transition-colors duration-500 ${isDark ? 'text-slate-300' : 'text-[#0F3D2E]/80'}`}
          >
            <span>Sistem Monitoring, Audit dan Supervisi Terintegrasi</span>
            <span>Pencegahan dan Pengendalian Infeksi</span>
          </motion.div>

          {/* CTA Box / Button Area */}
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 1 }}
            className="z-30 relative"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.02, 1],
              }}
              transition={{ 
                duration: 3, 
                ease: "easeInOut", 
                repeat: Infinity 
              }}
            >
              <Link 
                href="/login" 
                className={`group relative inline-flex items-center justify-center px-14 py-5 font-heading font-bold !text-white text-lg rounded-full overflow-hidden transition-all shadow-lg hover:-translate-y-1 ${isDark ? 'bg-blue-600 border border-blue-500 hover:bg-blue-500 hover:border-blue-400 shadow-blue-600/40' : 'bg-blue-600 border border-blue-500 hover:bg-blue-500 hover:border-blue-400 shadow-blue-500/40'}`}
              >
                {/* Inner shine effect */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:animate-shimmer" />
                <span className="relative z-10 flex items-center gap-3 tracking-wider !text-white">
                  Ayo Mulai
                  <motion.span 
                    animate={{ x: [0, 5, 0] }} 
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block"
                  >
                    →
                  </motion.span>
                </span>
              </Link>
            </motion.div>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}

