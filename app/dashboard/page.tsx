'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Activity,
  FileSpreadsheet,
  Stethoscope,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const complianceData = [
  { name: 'Jan', hh: 82, apd: 85 },
  { name: 'Feb', hh: 84, apd: 86 },
  { name: 'Mar', hh: 83, apd: 88 },
  { name: 'Apr', hh: 86, apd: 89 },
  { name: 'Mei', hh: 88, apd: 91 },
  { name: 'Jun', hh: 89, apd: 90 },
  { name: 'Jul', hh: 91, apd: 93 },
];

const haisData = [
  { name: 'IGD', iadp: 0.1, isk: 0.2, vap: 0, ido: 0 },
  { name: 'ICU', iadp: 1.2, isk: 2.1, vap: 3.4, ido: 0 },
  { name: 'Melati', iadp: 0.5, isk: 1.1, vap: 0, ido: 0.8 },
  { name: 'OK', iadp: 0, isk: 0.5, vap: 0, ido: 1.5 },
];

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    hh: 0,
    apd: 0,
    fasilitasApd: 0,
    lingkungan: 0,
    limbahMedis: 0,
    limbahTajam: 0,
    linen: 0,
    farmasi: 0,
    hais: { phlebitis: 0, isk: 0, ido: 0, vap: 0 }
  });
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase();

        // 1. Hand Hygiene
        const { data: hhData } = await supabase.from('audit_hand_hygiene').select('patuh, peluang');
        let hhSumPatuh = 0, hhSumPeluang = 0;
        if (hhData) {
          hhData.forEach(d => { hhSumPatuh += (d.patuh || 0); hhSumPeluang += (d.peluang || 0); });
        }
        const hhPct = hhSumPeluang > 0 ? Math.round((hhSumPatuh / hhSumPeluang) * 100) : 0;

        // 2. Kepatuhan APD (Usage)
        const { data: apdData } = await supabase.from('audit_apd').select('jumlah_patuh, jumlah_dinilai');
        let apdSumPatuh = 0, apdSumDinilai = 0;
        if (apdData) {
          apdData.forEach(d => {
            apdSumPatuh += (d.jumlah_patuh || 0);
            apdSumDinilai += (d.jumlah_dinilai || 0);
          });
        }
        const apdPct = apdSumDinilai > 0 ? Math.round((apdSumPatuh / apdSumDinilai) * 100) : 0;

        // 2b. Fasilitas APD (Availability)
        const { data: fasApdData } = await supabase.from('monitoring_fasilitas_apd').select('persentase');
        let fasApdSum = 0;
        if (fasApdData && fasApdData.length > 0) {
          fasApdData.forEach(d => { fasApdSum += (d.persentase || 0); });
          fasApdSum = Math.round(fasApdSum / fasApdData.length);
        }

        // 3. Pengendalian Lingkungan
        const { data: envData } = await supabase.from('audit_pengendalian_lingkungan').select('persentase');
        let envSum = 0;
        if (envData && envData.length > 0) {
          envData.forEach(d => { envSum += (d.persentase || 0); });
          envSum = Math.round(envSum / envData.length);
        }

        // 4. Pengelolaan Limbah Medis
        const { data: wasteData } = await supabase.from('audit_pengelolaan_limbah_medis').select('persentase');
        let wasteSum = 0;
        if (wasteData && wasteData.length > 0) {
          wasteData.forEach(d => { wasteSum += (d.persentase || 0); });
          wasteSum = Math.round(wasteSum / wasteData.length);
        }

        // 5. Pengelolaan Limbah Tajam
        const { data: sharpData } = await supabase.from('audit_pengelolaan_limbah_tajam').select('persentase');
        let sharpSum = 0;
        if (sharpData && sharpData.length > 0) {
          sharpData.forEach(d => { sharpSum += (d.persentase || 0); });
          sharpSum = Math.round(sharpSum / sharpData.length);
        }

        // 6. Penatalaksanaan Linen
        const { data: linenData } = await supabase.from('audit_penatalaksanaan_linen').select('persentase');
        let linenSum = 0;
        if (linenData && linenData.length > 0) {
          linenData.forEach(d => { linenSum += (d.persentase || 0); });
          linenSum = Math.round(linenSum / linenData.length);
        }

        // 7. HAIs Fallback (Mocked / real if table available)
        let haisStats = { phlebitis: 0, isk: 0, ido: 0, vap: 0 };
        try {
          const { data: haisData } = await supabase.from('insiden_hais').select('*');
          if (haisData) {
            haisData.forEach(d => {
              const type = String(d.jenis).toLowerCase();
              if (type.includes('phlebitis')) haisStats.phlebitis = d.rate || 0;
              if (type.includes('isk')) haisStats.isk = d.rate || 0;
              if (type.includes('ido')) haisStats.ido = d.rate || 0;
              if (type.includes('vap')) haisStats.vap = d.rate || 0;
            });
          }
        } catch(e) {}

        // 8. Farmasi
        let farmasiPct = 0;
        try {
          const { data: farmasiData } = await supabase.from('audit_farmasi').select('persentase');
          if (farmasiData && farmasiData.length > 0) {
            let farmasiSum = 0;
            farmasiData.forEach(d => { farmasiSum += (d.persentase || 0); });
            farmasiPct = Math.round(farmasiSum / farmasiData.length);
          }
        } catch(e) {}

        if (mounted) {
          setStats({ 
            hh: hhPct, 
            apd: apdPct, 
            fasilitasApd: fasApdSum,
            lingkungan: envSum,
            limbahMedis: wasteSum,
            limbahTajam: sharpSum,
            linen: linenSum,
            farmasi: farmasiPct,
            hais: haisStats 
          });
        }
      } catch (e) {
        console.log('Skipped stats sync');
      }
    };

    fetchStats();
    return () => { mounted = false; };
  }, []);

  const cards = [
    { 
      type: 'single',
      title: 'Kepatuhan Hand Hygiene', 
      value: `${stats.hh}%`, 
      color: 'text-blue-400', 
      glow: 'glow-blue',
      barColor: 'from-blue-400 to-purple-500',
      pct: stats.hh
    },
    { 
      type: 'single',
      title: 'Kepatuhan Penggunaan APD', 
      value: `${stats.apd}%`, 
      color: 'text-purple-400', 
      glow: 'glow-purple',
      barColor: 'from-purple-400 to-emerald-500',
      pct: stats.apd
    },
    { 
      type: 'multi',
      title: 'Insiden Rate HAIs', 
      glow: 'glow-red',
      color: 'text-red-400',
      metrics: [
        { label: 'Phlebitis', val: `${stats.hais.phlebitis}‰` },
        { label: 'ISK', val: `${stats.hais.isk}‰` },
        { label: 'IDO', val: `${stats.hais.ido}‰` },
        { label: 'VAP', val: `${stats.hais.vap}‰` },
      ]
    }
  ];

  const nextCard = () => {
    setActiveCard((prev) => (prev === cards.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-[30px] font-heading font-bold not-italic tracking-tight text-gradient drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">Dashboard SMART PPI</h1>
          <p className="text-[17px] md:text-[18px] text-slate-500 mt-2 font-medium flex flex-col md:block leading-relaxed w-full sm:tracking-normal">
            <span>Pencegahan dan Pengendalian Infeksi</span>
            <span className="md:ml-1">di UOBK RSUD AL-MULK Kota Sukabumi</span>
          </p>
        </div>
      </div>

      {/* KPI Cards - Desktop (Grid) & Mobile (1 centered) */}
      <div className="relative">
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <div key={i} className={`glass-card p-6 flex flex-col gap-4 rounded-[24px] border-white/5 transition-all ${c.glow}`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 h-[30px]">{c.title}</p>
              {c.type === 'single' ? (
                <>
                  <h3 className="text-3xl font-heading font-bold text-white">{c.value}</h3>
                  <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${c.barColor}`} style={{ width: `${c.pct}%` }} />
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {c.metrics?.map(m => (
                    <div key={m.label} className="bg-white/5 rounded-xl p-2 border border-white/5">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-0.5">{m.label}</p>
                      <p className="text-sm font-bold text-white">{m.val}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile Carousel View */}
        <div className="sm:hidden relative w-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCard}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className={`glass-card p-6 flex flex-col gap-4 rounded-[24px] border-white/5 ${cards[activeCard].glow} min-h-[180px] relative`}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{cards[activeCard].title}</p>
              {cards[activeCard].type === 'single' ? (
                <>
                  <h3 className="text-4xl font-heading font-bold text-white">{cards[activeCard].value}</h3>
                  <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${cards[activeCard].barColor}`} style={{ width: `${cards[activeCard].pct}%` }} />
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 mt-2 pr-12">
                  {cards[activeCard].metrics?.map(m => (
                    <div key={m.label} className="bg-white/5 rounded-xl p-3 flex flex-col border border-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{m.label}</p>
                      <p className="text-lg font-bold text-white">{m.val}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Pulsing Next Button inside the card for Mobile */}
              <button 
                onClick={nextCard}
                className="absolute bottom-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center rounded-full text-white cursor-pointer z-10 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-colors"
                aria-label="Next Card"
              >
                <ChevronRight className="w-5 h-5 ml-0.5" />
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Input HAIs', icon: Activity, color: 'text-blue-400', bg: 'bg-gradient-to-r from-blue-400 to-purple-500/10' },
          { label: 'Supervisi', icon: ShieldAlert, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Edukasi', icon: Stethoscope, color: 'text-blue-400', bg: 'bg-gradient-to-r from-blue-400 to-purple-500/10' },
          { label: 'Laporan', icon: FileSpreadsheet, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((action, i) => (
          <button key={i} className="flex flex-col items-center justify-center p-6 glass-card rounded-[24px] border-white/5 hover:border-white/20 transition-all group">
            <div className={`w-12 h-12 rounded-2xl ${action.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner`}>
              <action.icon className={`w-6 h-6 ${action.color}`} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-white transition-colors">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Trend Chart */}
        <div className="glass-card p-8 rounded-[32px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-heading font-bold text-white tracking-wide">Tren Kepatuhan (7 Bulan)</h3>
            <select className="text-[10px] font-bold uppercase tracking-widest border-white/10 rounded-lg text-slate-400 bg-white/5 px-3 py-1.5 outline-none">
              <option>Tahun 2024</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={complianceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorApd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  labelStyle={{ fontSize: '10px', color: '#64748b', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '30px' }} />
                <Area type="monotone" dataKey="hh" name="Hand Hygiene (%)" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHh)" />
                <Area type="monotone" dataKey="apd" name="Kepatuhan APD (%)" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorApd)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HAIs Chart */}
        <div className="glass-card p-8 rounded-[32px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-heading font-bold text-white tracking-wide">Insiden HAIs per Unit (‰)</h3>
            <button className="text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-purple-300 transition-colors">Lihat Detail</button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={haisData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '30px' }} />
                <Bar dataKey="iadp" name="IADP" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                <Bar dataKey="isk" name="ISK" stackId="a" fill="#6366f1" />
                <Bar dataKey="vap" name="VAP" stackId="a" fill="#8b5cf6" />
                <Bar dataKey="ido" name="IDO" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="relative p-8 rounded-[32px] glass-card border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 overflow-hidden">
        <div className="absolute top-[-50%] right-[-10%] w-[40%] h-[100%] bg-gradient-to-r from-blue-400 to-purple-500/10 blur-[100px] rounded-full" />
        <div className="flex items-start gap-6 relative z-10">
          <div className="bg-blue-600/20 p-4 rounded-2xl border border-blue-500/20 shadow-lg glow-blue">
            <AlertCircle className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-heading font-bold text-white mb-2 tracking-wide">SMART Recommendation</h3>
            <p className="text-sm text-slate-400 mb-6 font-medium">Berdasarkan analisa data minggu ini, sistem merekomendasikan:</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300 leading-relaxed"><strong>ICU:</strong> Rate VAP meningkat (3.4‰). Segera lakukan supervisi Bundle VAP dan edukasi ulang staf.</span>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300 leading-relaxed"><strong>IGD:</strong> Kepatuhan Hand Hygiene Momen 1 & 4 rendah. Pastikan ketersediaan handrub di setiap bed.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
