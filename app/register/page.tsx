'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, User, ArrowRight, Building2, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { AppLogo } from '@/components/AppLogo';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate Supabase registration
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-navy-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <div className="mb-2">
            <AppLogo className="w-16 h-16" iconClassName="w-10 h-10" />
          </div>
        </motion.div>
        <h2 className="mt-6 text-center text-3xl font-heading font-bold text-white tracking-widest uppercase">
          Daftar Akun IPCLN
        </h2>
        <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
          Integrasi data dengan Supabase
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4"
      >
        <div className="glass-card p-8 sm:px-10 rounded-[32px] border-white/5">
          <form className="space-y-5" onSubmit={handleRegister}>
            
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
                Nama Lengkap
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="bg-white/5 border border-white/5 focus:border-blue-500/50 focus:bg-white/10 block w-full pl-12 pr-4 py-3.5 text-sm text-white rounded-2xl outline-none transition-all placeholder:text-slate-700"
                  placeholder="Nama lengkap Anda"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="bg-white/5 border border-white/5 focus:border-blue-500/50 focus:bg-white/10 block w-full pl-12 pr-4 py-3.5 text-sm text-white rounded-2xl outline-none transition-all placeholder:text-slate-700"
                  placeholder="email@rsam.com"
                />
              </div>
            </div>

            {/* Unit */}
            <div>
              <label htmlFor="unit" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
                Unit Kerja
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <select
                  id="unit"
                  name="unit"
                  required
                  className="bg-white/5 border border-white/5 focus:border-blue-500/50 focus:bg-white/10 block w-full pl-12 pr-4 py-3.5 text-sm text-white rounded-2xl outline-none transition-all appearance-none"
                >
                  <option value="" className="bg-navy-dark">Pilih Unit Kerja</option>
                  <option value="igd" className="bg-navy-dark">IGD</option>
                  <option value="icu" className="bg-navy-dark">ICU</option>
                  <option value="ranap" className="bg-navy-dark">Rawat Inap</option>
                  <option value="ok" className="bg-navy-dark">Kamar Operasi</option>
                  <option value="poli" className="bg-navy-dark">Poliklinik</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="bg-white/5 border border-white/5 focus:border-blue-500/50 focus:bg-white/10 block w-full pl-12 pr-4 py-3.5 text-sm text-white rounded-2xl outline-none transition-all placeholder:text-slate-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl shadow-lg shadow-blue-600/20 text-[10px] font-bold uppercase tracking-[0.2em] text-white bg-blue-600 hover:bg-blue-500 focus:outline-none transition-all disabled:opacity-70"
              >
                {isLoading ? 'Mendaftarkan...' : 'Daftar Akun'}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="mt-6 text-center text-[10px] font-bold uppercase tracking-widest">
              <span className="text-slate-600">Sudah punya akun? </span>
              <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                Login di sini
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
