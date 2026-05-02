import { ShieldCheck } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen w-full bg-[#0a0f1c] flex flex-col items-center justify-center font-sans">
      <div className="relative flex items-center justify-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-[3px] border-blue-500/10 border-t-blue-500 animate-[spin_1.5s_linear_infinite]" />
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[3px] border-purple-500/10 border-b-purple-500 animate-[spin_2s_linear_infinite_reverse] absolute" />
        <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 absolute animate-pulse drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
      </div>
      <h2 className="mt-6 text-sm font-bold tracking-widest text-slate-400 uppercase animate-pulse">Memuat Aplikasi...</h2>
    </div>
  );
}
