'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '@/components/providers';
import { AppLogo } from '@/components/AppLogo';

export default function LoginPage() {
  const router = useRouter();
  const { setUserRole } = useAppContext();
  const [role, setRole] = useState('IPCN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      if (role === 'IPCN') {
        if (username === 'PPI RSAM' && password === 'PPI RSAM') {
          setUserRole('IPCN');
          router.push('/dashboard');
        } else {
          setError('Username atau password salah untuk IPCN.');
          setIsLoading(false);
        }
      } else {
        // IPCLN login logic (Supabase integration placeholder)
        if (username && password) {
           setUserRole('IPCLN');
           router.push('/dashboard');
        } else {
           setError('Harap isi username dan password.');
           setIsLoading(false);
        }
      }
    }, 1000);
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
          <div className="mb-0">
            <AppLogo className="w-20 h-20" iconClassName="w-12 h-12" />
          </div>
        </motion.div>
        <h2 className="mt-1.5 text-center text-3xl font-heading font-bold text-white tracking-widest uppercase">
          SMART PPI
        </h2>
        <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
          Silakan masuk ke akun Anda
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4"
      >
        <div className="glass-card p-8 sm:px-10 rounded-[32px] border-white/5">
          <form className="space-y-6" onSubmit={handleLogin}>
            
            {/* Role Selection */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">Login Sebagai</label>
              <div className="grid grid-cols-2 gap-3">
                {['IPCN', 'IPCLN'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setError('');
                    }}
                    className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl border transition-all ${
                      role === r 
                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                        : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-xs font-medium">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
                Email / Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white/5 border border-white/5 focus:border-blue-500/50 focus:bg-white/10 block w-full pl-12 pr-4 py-3.5 text-sm text-white rounded-2xl outline-none transition-all placeholder:text-slate-700"
                  placeholder={role === 'IPCN' ? "PPI RSAM" : "Masukkan username"}
                />
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border border-white/5 focus:border-blue-500/50 focus:bg-white/10 block w-full pl-12 pr-4 py-3.5 text-sm text-white rounded-2xl outline-none transition-all placeholder:text-slate-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl shadow-lg shadow-blue-600/20 text-[10px] font-bold uppercase tracking-[0.2em] text-white bg-blue-600 hover:bg-blue-500 focus:outline-none transition-all disabled:opacity-70 group"
              >
                {isLoading ? 'Memproses...' : 'Masuk'}
                {!isLoading && (
                  <motion.div 
                    animate={{ x: [0, 6, 0], scale: [1, 1.1, 1] }} 
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </motion.div>
                )}
              </button>
            </div>
            
            {role === 'IPCLN' && (
              <div className="mt-6 text-center text-[10px] font-bold uppercase tracking-widest">
                <span className="text-slate-600">Belum punya akun? </span>
                <Link href="/register" className="text-blue-400 hover:text-purple-300 transition-colors">
                  Daftar di sini
                </Link>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}
