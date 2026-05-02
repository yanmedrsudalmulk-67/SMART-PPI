'use client';

import { useState, useEffect, memo } from 'react';
import { Clock } from 'lucide-react';

export const ClockWidget = memo(({ isLightMode }: { isLightMode: boolean }) => {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return (
    <div className={`hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-md border animate-pulse ${!isLightMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-white/80'}`}>
      <Clock className={`w-4 h-4 ${!isLightMode ? 'text-blue-400' : 'text-[#0F3D2E]'}`} />
      <div className="w-20 h-8 bg-white/10 rounded-lg"></div>
    </div>
  );

  return (
    <div className={`hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-md border transition-all duration-500 shadow-lg ${!isLightMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/60 border-white/80 hover:bg-white/80'}`}>
      <div className={`flex items-center justify-center transition-colors duration-500 drop-shadow-md`}>
        <Clock className={`w-4 h-4 ${!isLightMode ? 'text-blue-400' : 'text-[#0F3D2E]'}`} />
      </div>
      <div className="flex flex-col items-start min-w-[90px]">
        <span className={`text-[9px] uppercase tracking-widest font-bold transition-colors duration-500 ${!isLightMode ? 'text-slate-300' : 'text-[#0F3D2E]/80'}`}>
          {time.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
        <span className={`text-xs font-bold font-mono tracking-widest leading-none mt-0.5 transition-colors duration-500 ${!isLightMode ? 'text-white' : 'text-[#0A2F1D]'}`}>
          {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </div>
  );
});

ClockWidget.displayName = 'ClockWidget';
