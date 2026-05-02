import React from 'react';
import { motion } from 'motion/react';
import { Activity } from 'lucide-react';

interface LiveStatisticsCardProps {
  totalDinilai: number;
  totalPatuh: number;
  totalTidakPatuh: number;
  persentase: number;
  statusText: string;
  title?: string;
}

export function LiveStatisticsCard({
  totalDinilai,
  totalPatuh,
  totalTidakPatuh,
  persentase,
  statusText,
  title = "HASIL KEPATUHAN"
}: LiveStatisticsCardProps) {
  
  const isEmpty = totalDinilai === 0;
  
  const displayStatus = isEmpty ? 'MENUNGGU INPUT' : statusText.toUpperCase();
  const displayPersen = isEmpty ? '0%' : `${persentase}%`;

  let color = 'text-slate-400';
  let bg = 'bg-slate-500/10';
  
  if (!isEmpty) {
    if (persentase >= 85) { color = 'text-blue-400'; bg = 'bg-blue-500/10'; }
    else if (persentase >= 70) { color = 'text-amber-400'; bg = 'bg-amber-500/10'; }
    else { color = 'text-red-400'; bg = 'bg-red-500/10'; }
  }

  // Calculate circle
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const calculateDashOffset = (percent: number) => {
    return circumference - (percent / 100) * circumference;
  };

  return (
    <div className="glass-card p-6 sm:p-8 rounded-[32px] border-white/5 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 relative overflow-hidden mt-6 mb-6">
      <h2 className="absolute top-6 left-8 flex items-center gap-2 text-[10px] sm:text-sm font-bold uppercase tracking-widest text-slate-400 z-10">
        <Activity className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400" /> {title}
      </h2>
      
      {/* Background Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 blur-[100px] rounded-full -z-10 ${bg.replace('/10', '/20')}`} />
      
      {/* Circle Statistics */}
      <div className="flex flex-col items-center mt-12 md:mt-4">
        <div className="relative w-40 h-40 flex items-center justify-center shrink-0 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <motion.circle 
              cx="40" cy="40" r="36" 
              fill="transparent" 
              stroke="currentColor" 
              strokeWidth="8" 
              strokeDasharray={circumference}
              strokeLinecap="round"
              className={color}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: calculateDashOffset(isEmpty ? 0 : persentase) }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-heading font-bold text-white">{displayPersen}</span>
          </div>
        </div>
        <span className={`text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full ${bg} ${color} border border-current shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
          {displayStatus}
        </span>
      </div>

      {/* Grid Statistics Boxes */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-4 z-10">
        <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/5 shadow-xl backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          <p className="text-4xl font-bold text-white mb-2 relative z-10">{totalPatuh}</p>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold relative z-10">Kepatuhan</p>
        </div>
        
        <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/5 shadow-xl backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          <p className="text-4xl font-bold text-white mb-2 relative z-10">{totalDinilai}</p>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold relative z-10">Peluang</p>
        </div>

        {/* Third box for Tidak Patuh if it's more than 0 or just to show detail */}
        <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5 shadow-xl backdrop-blur-sm relative overflow-hidden col-span-2 group">
           <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
           <div className="flex justify-between items-center px-4 relative z-10">
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Tidak Patuh</span>
              <span className="text-xl font-bold text-rose-400">{totalTidakPatuh}</span>
           </div>
        </div>
      </div>
    </div>
  );
}
