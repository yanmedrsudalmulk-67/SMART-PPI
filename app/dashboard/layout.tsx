'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Activity, 
  FileText, 
  Settings, 
  Bell, 
  Search,
  Menu,
  X,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/components/providers';
import { AppLogo } from '@/components/AppLogo';

const navItems = [
  { name: 'Beranda', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Input', href: '/dashboard/input', icon: ClipboardCheck },
  { name: 'Analitik', href: '/dashboard/analytics', icon: Activity },
  { name: 'Laporan', href: '/dashboard/reports', icon: FileText },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userRole, setUserRole } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsLightMode(true);
    }
    
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  return (
    <div className="min-h-screen bg-navy-dark flex text-slate-200">
      {/* Desktop Sidebar */}
      <AnimatePresence mode="wait">
        {!isMobile && isSidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-navy-light/50 backdrop-blur-xl border-r border-white/5 flex flex-col fixed inset-y-0 left-0 z-20 shadow-2xl overflow-hidden"
          >
            <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0">
              <AppLogo className="w-8 h-8 mr-3" iconClassName="w-5 h-5" />
              <span className="font-heading font-bold text-lg tracking-widest text-white">SMART-PPI</span>
            </div>
            
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
              <div className="mb-8 px-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Menu Utama</p>
              </div>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                      isActive 
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-400' : ''}`} />
                    <span className="text-sm font-semibold">{item.name}</span>
                  </Link>
                );
              })}
            </div>
            
            <div className="p-4 border-t border-white/5 shrink-0 flex flex-col gap-2">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-blue-500/20">
                  {userRole?.[0] || 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate uppercase tracking-wider">Pengguna</p>
                  <p className="text-[10px] text-slate-500 truncate font-medium">{userRole}</p>
                </div>
              </div>
              <Link 
                href="/login"
                onClick={() => setUserRole('IPCN')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${!isMobile && isSidebarOpen ? 'ml-[260px]' : ''}`}>
        {/* Top Header */}
        <header className="h-16 bg-navy-dark/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {!isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-slate-400 hover:bg-white/5 rounded-xl transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            <div className="hidden sm:flex items-center bg-white/5 rounded-full px-4 py-2 w-64 border border-white/5 focus-within:border-blue-500/50 focus-within:bg-white/10 transition-all">
              <Search className="w-4 h-4 text-slate-500 mr-2" />
              <input 
                type="text" 
                placeholder="Cari pasien, unit..." 
                className="bg-transparent border-none outline-none text-xs w-full text-slate-300 placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 z-50">
            <button 
              onClick={() => setIsLightMode(!isLightMode)} 
              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-white/5 rounded-xl transition-all"
              title="Toggle Tema Terang/Gelap"
            >
              {isLightMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button className="relative p-2 text-slate-400 hover:bg-white/5 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-navy-dark"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center sm:hidden shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-[10px]">DR</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8 relative">
          {/* Background Glows for Content */}
          <div className="fixed top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
          <div className="fixed bottom-[10%] left-[10%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
          
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 inset-x-0 bg-navy-light/80 backdrop-blur-2xl border-t border-white/5 flex justify-around items-center h-16 px-2 z-50 pb-safe">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
                <span className="text-[9px] font-bold uppercase tracking-wider">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
