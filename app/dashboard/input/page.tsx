'use client';

import { useState } from 'react';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import { RefreshCw,
  ShieldAlert, 
  Activity, 
  ClipboardCheck, 
  GraduationCap,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

const inputModules = [
  {
    id: 'kewaspadaan-isolasi',
    title: 'Kewaspadaan Isolasi',
    desc: 'Audit Kewaspadaan Standar & Transmisi',
    icon: ShieldAlert,
    color: 'text-blue-500',
    bg: 'bg-emerald-50',
    href: '/dashboard/input/isolasi',
    dataCount: 142,
    status: '88% Patuh'
  },
  {
    id: 'surveilans-hais',
    title: 'Surveilans HAIs',
    desc: 'Input kasus Phlebitis, ISK, IDO, VAP',
    icon: Activity,
    color: 'text-red-500',
    bg: 'bg-red-50',
    href: '/dashboard/input/surveilans',
    dataCount: 12,
    status: '0.2‰ Rate'
  },
  {
    id: 'bundles-hais',
    title: 'Monitoring Bundles',
    desc: 'Checklist kepatuhan bundles HAIs',
    icon: ClipboardCheck,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    href: '/dashboard/input/bundles',
    dataCount: 86,
    status: '92% Patuh'
  },
  {
    id: 'diklat',
    title: 'Pendidikan & Pelatihan',
    desc: 'Input Data Pendidikan dan Pelatihan PPI',
    icon: GraduationCap,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    href: '/dashboard/input/diklat',
    dataCount: 4,
    status: 'Bulan Ini'
  }
];

export default function InputPage() {
  return (
    <div className="space-y-8">
      <div className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-gradient drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">Input Data SMART PPI</h1>
        <p className="text-sm text-slate-500 mt-2 font-medium">Silahkan pilih menu input data yang ingin diisi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {inputModules.map((mod, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={mod.id}
          >
            <Link 
              href={mod.href}
              className="block h-full glass-card rounded-[32px] p-8 border-white/5 hover:border-white/20 hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -z-10" />
              
              <div className="flex items-start justify-between mb-10">
                <div className={`w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 shadow-inner group-hover:bg-blue-600/20 group-hover:border-blue-500/30 transition-all`}>
                  <mod.icon className={`w-8 h-8 text-slate-400 group-hover:text-blue-400 transition-colors`} />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-heading font-bold text-white">{mod.dataCount}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-blue-400">{mod.status}</p>
                </div>
              </div>
              
              <div className="mb-10">
                <h3 className="font-heading font-bold text-xl text-white mb-2 tracking-wide">{mod.title}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">{mod.desc}</p>
              </div>

              <div className="flex items-center text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 group-hover:text-white transition-all">
                Input Sekarang
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
