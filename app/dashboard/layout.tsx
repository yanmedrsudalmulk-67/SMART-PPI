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
  Moon,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/components/providers';
import { AppLogo } from '@/components/AppLogo';
import { memo } from 'react';

const NavItem = memo(({ item, isActive }: { item: any, isActive: boolean }) => (
  <Link 
    href={item.href}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
      isActive 
        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <motion.div
      animate={isActive ? { y: [0, -3, 0] } : { y: 0 }}
      transition={{ 
        duration: 2, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    >
      <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-400' : ''}`} />
    </motion.div>
    <span className="text-sm font-semibold">{item.name}</span>
  </Link>
));

NavItem.displayName = 'NavItem';

const navItems = [
  { name: 'Beranda', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Input', href: '/dashboard/input', icon: ClipboardCheck },
  { name: 'Analitik', href: '/dashboard/analytics', icon: Activity },
  { name: 'Laporan', href: '/dashboard/reports', icon: FileText },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userRole, setUserRole, hospitalLogoUrl } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<Date | null>(null);

  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
      setTime(new Date());
    }, 0);
    const interval = setInterval(() => setTime(new Date()), 1000);
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setTimeout(() => setIsLightMode(true), 0);
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
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      clearInterval(interval);
    };
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
            className="app-sidebar bg-navy-light/50 backdrop-blur-xl border-r border-white/5 flex flex-col fixed inset-y-0 left-0 z-20 shadow-2xl overflow-hidden"
          >
            <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0">
              <AppLogo className="w-8 h-8 mr-3 text-white" iconClassName="w-5 h-5 text-white" />
              <span className="sidebar-title font-heading font-bold text-xl tracking-widest text-gradient drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">
                SMART PPI
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
              <div className="mb-8 px-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Menu Utama</p>
              </div>
              {navItems.map((item) => (
                <NavItem 
                  key={item.name} 
                  item={item} 
                  isActive={pathname === item.href} 
                />
              ))}
            </div>            
            <div className="p-6 border-t border-white/5 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2 opacity-50">
                <AppLogo className="w-5 h-5 text-white" iconClassName="w-3 h-3 text-white" />
                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">SMART PPI v1.0</span>
              </div>
              <Link 
                href="/login"
                onClick={() => setUserRole('IPCN')}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-400 transition-all group"
              >
                <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                <span>Keluar</span>
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${!isMobile && isSidebarOpen ? 'ml-[260px]' : ''}`}>
        {/* Top Header */}
        <header className="min-h-[56px] sm:h-16 py-2 sm:py-0 bg-navy-dark/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-10 transition-all">
          <div className="flex items-center gap-2 sm:gap-4">
            {!isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-slate-400 hover:bg-white/5 rounded-xl transition-colors"
                title="Toggle Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            {/* Clock Widget replacing Search */}
            <div className={`hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-md border transition-colors duration-500 shadow-lg ${!isLightMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/60 border-white/80 hover:bg-white/80'}`}>
              <div className={`flex items-center justify-center transition-colors duration-500 drop-shadow-md`}>
                <Clock className={`w-4 h-4 ${!isLightMode ? 'text-blue-400' : 'text-[#0F3D2E]'}`} />
              </div>
              <div className="flex flex-col items-start min-w-[90px]">
                <span className={`text-[9px] uppercase tracking-widest font-bold transition-colors duration-500 ${!isLightMode ? 'text-slate-300' : 'text-[#0F3D2E]/80'}`}>
                  {mounted && time ? time.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : 'Memuat...'}
                </span>
                <span className={`text-xs font-bold font-mono tracking-widest leading-none mt-0.5 transition-colors duration-500 ${!isLightMode ? 'text-white' : 'text-[#0A2F1D]'}`}>
                  {mounted && time ? time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '00:00:00'}
                </span>
              </div>
            </div>

            {/* Mobile Hospital Identity (replaces Search & Sidebar Toggle) */}
            {isMobile && (
              <div className="flex items-center gap-2 sm:hidden px-1">
                {/* Hospital Logo */}
                <div className="w-9 h-9 md:w-10 md:h-10 flex-shrink-0 bg-white/5 border border-white/10 rounded-[10px] flex items-center justify-center overflow-hidden">
                  {hospitalLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hospitalLogoUrl} alt="Logo RS" className="w-full h-full object-contain p-1" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                  )}
                </div>
                
                {/* Hospital Text */}
                <div className="flex flex-col text-left">
                  <span className="font-heading font-bold text-sm tracking-wide text-white leading-tight">
                    UOBK RSUD AL-MULK
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-tight mt-0.5">
                    KOTA SUKABUMI
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-4 z-50">
            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className={`relative w-[84px] sm:w-[94px] h-[40px] sm:h-[48px] rounded-full p-1.5 flex items-center transition-all duration-500 ease-in-out cursor-pointer overflow-hidden ${
                !isLightMode 
                  ? 'bg-[#1e293b]/80 backdrop-blur-md shadow-[inset_0_4px_15px_rgba(0,0,0,0.4)] border border-slate-700/50' 
                  : 'bg-white/80 backdrop-blur-md shadow-[inset_0_4px_10px_rgba(0,0,0,0.05),0_4px_15px_rgba(0,0,0,0.05)] border border-white/80'
              }`}
              title="Toggle Tema Terang/Gelap"
            >
              {/* Soft inner glow to mimic glass switch depth */}
              <div className="absolute inset-0 w-full h-full pointer-events-none rounded-full shadow-inner opacity-50 mix-blend-overlay"></div>
              
              {/* Left Icon (Sun) - background static */}
              <div className={`absolute left-[12px] sm:left-[14px] top-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-300 ${isLightMode ? 'opacity-100' : 'opacity-30'}`}>
                <Sun className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-500 ${!isLightMode ? 'text-slate-400' : 'text-[#0F3D2E]/50'}`} />
              </div>
              
              {/* Right Icon (Moon/Wave) - background static */}
              <div className={`absolute right-[12px] sm:right-[14px] top-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-300 ${!isLightMode ? 'opacity-100' : 'opacity-30'}`}>
                <Moon className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-500 ${!isLightMode ? 'text-slate-600' : 'text-[#0F3D2E] font-bold'}`} />
              </div>

              {/* Glowing sliding thumb that carries the active icon */}
              <motion.div
                initial={false}
                animate={{ 
                  x: !isLightMode ? (typeof window !== 'undefined' && window.innerWidth < 640 ? 44 : 46) : 0, 
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`relative h-[28px] w-[28px] sm:h-[36px] sm:w-[36px] flex items-center justify-center rounded-full shadow-[inset_0_0_5px_rgba(255,255,255,0.4)] z-10 transition-colors duration-500 ${!isLightMode ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.7)]' : 'bg-[#38C968] shadow-[0_0_15px_rgba(56,201,104,0.7)]'}`}
              >
                  {!isLightMode ? <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white drop-shadow-md" /> : <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white drop-shadow-md" />}
              </motion.div>
            </button>
            
            {/* Kept Bell only on desktop, hidden on mobile */}
            <button className="hidden sm:block relative p-2 text-slate-400 hover:bg-white/5 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full border-2 border-navy-dark"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8 relative">
          {/* Background Glows for Content */}
          <div className="fixed top-[20%] right-[10%] w-[30%] h-[30%] bg-gradient-to-r from-blue-400 to-purple-500/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
          <div className="fixed bottom-[10%] left-[10%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
          
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="app-mobile-nav fixed bottom-0 inset-x-0 bg-navy-light/80 backdrop-blur-2xl border-t border-white/5 flex justify-around items-center h-16 px-2 z-50 pb-safe">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive 
                    ? (isLightMode ? 'text-white' : 'text-blue-400') 
                    : (isLightMode ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-300')
                }`}
              >
                <motion.div
                  animate={isActive ? { y: [0, -3, 0] } : { y: 0 }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? (isLightMode ? 'drop-shadow-sm' : 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]') : ''}`} />
                </motion.div>
                <span className="text-[9px] font-bold uppercase tracking-wider">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
