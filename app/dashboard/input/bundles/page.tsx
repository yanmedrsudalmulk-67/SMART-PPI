'use client';

import { Save, RefreshCw, ArrowLeft, Syringe, Droplets, Activity, Wind, Plus, ClipboardCheck } from 'lucide-react';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';
import { motion } from 'motion/react';
import Link from 'next/link';

const bundles = [
  {
    category: 'Bundles PLABSI',
    icon: Syringe,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    items: [
      { id: 'plabsi-insersi', title: 'Bundles PLABSI Insersi' },
      { id: 'plabsi-maintenance', title: 'Bundles PLABSI Maintenance' }
    ]
  },
  {
    category: 'Bundles CAUTI',
    icon: Droplets,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    items: [
      { id: 'cauti-insersi', title: 'Bundles CAUTI Insersi' },
      { id: 'cauti-maintenance', title: 'Bundles CAUTI Maintenance' }
    ]
  },
  {
    category: 'Bundles IDO',
    icon: Activity,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    items: [
      { id: 'ido-pre-operasi', title: 'Bundles IDO Pre Operasi' },
      { id: 'ido-intra-operasi', title: 'Bundles IDO Intra Operasi' },
      { id: 'ido-post-operasi', title: 'Bundles IDO Post Operasi' }
    ]
  },
  {
    category: 'Bundles VAP',
    icon: Wind,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    items: [
      { id: 'vap-insersi', title: 'Bundles VAP Insersi' },
      { id: 'vap-maintenance', title: 'Bundles VAP Maintenance' }
    ]
  }
];

export default function BundlesMenuPage() {
  return (
    <div className="max-w-6xl mx-auto pb-28 px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 relative py-4 z-10 border-b border-white/5">
        <Link href="/dashboard/input" className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-[30px] font-heading font-bold tracking-tight text-gradient drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">Bundles HAIs</h1>
          <p className="text-[15px] font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">Monitoring & Audit Kepatuhan</p>
        </div>
      </div>

      <div className="space-y-12">
        {bundles.map((group, gIdx) => (
          <motion.div
            key={group.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gIdx * 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${group.bg}`}>
                <group.icon className={`w-5 h-5 ${group.color}`} />
              </div>
              <h2 className="text-lg font-heading font-bold text-white tracking-wide">{group.category}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.items.map((item, iDx) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (gIdx * 0.1) + (iDx * 0.05) }}
                  className="glass-card p-5 sm:p-6 rounded-[2rem] border-white/5 overflow-hidden flex flex-col justify-between group hover:border-blue-500/30 transition-all duration-500"
                >
                  <div className="space-y-4 mb-6">
                    <div className="p-3 bg-blue-500/10 rounded-2xl inline-block group-hover:scale-110 transition-transform duration-500">
                      <ClipboardCheck className={`w-6 h-6 ${group.color}`} />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-white text-base sm:text-lg leading-tight group-hover:text-blue-400 transition-colors">{item.title}</h3>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-white/5 mt-auto">
                    <Link 
                      href={`/dashboard/input/bundles/${item.id}`}
                      className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 hover:-translate-y-1 relative group/btn overflow-hidden shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                      INPUT DATA
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
