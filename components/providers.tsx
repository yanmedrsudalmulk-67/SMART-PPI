'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';

interface AppContextType {
  appLogoUrl: string | null;
  setAppLogoUrl: (url: string | null) => void;
  hospitalLogoUrl: string | null;
  setHospitalLogoUrl: (url: string | null) => void;
  userRole: string;
  setUserRole: (role: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
  const [hospitalLogoUrl, setHospitalLogoUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('IPCN');

  useEffect(() => {
    // Pada saat aplikasi di-load, cek ke Supabase Storage secara persisten
    const fetchLogos = async () => {
      try {
        const supabase = getSupabase();
        
        // Kita menggunakan penamaan spesifik saat upload untuk persistensi
        const { data: publicAppLogo } = supabase.storage.from('logos').getPublicUrl('public/app_logo.png');
        const { data: publicHospitalLogo } = supabase.storage.from('logos').getPublicUrl('public/hospital_logo.png');
        
        // Menambahkan parameter t= waktu agar browser tidak menggunakan cache gambar lama
        if (publicAppLogo?.publicUrl) setAppLogoUrl(`${publicAppLogo.publicUrl}?t=${Date.now()}`);
        if (publicHospitalLogo?.publicUrl) setHospitalLogoUrl(`${publicHospitalLogo.publicUrl}?t=${Date.now()}`);
      } catch (err) {
        console.error("Gagal memuat logo:", err);
      }
    };
    fetchLogos();
  }, []);

  return (
    <AppContext.Provider value={{ appLogoUrl, setAppLogoUrl, hospitalLogoUrl, setHospitalLogoUrl, userRole, setUserRole }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
