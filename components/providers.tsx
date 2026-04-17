'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
  userRole: string;
  setUserRole: (role: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('IPCN');

  return (
    <AppContext.Provider value={{ logoUrl, setLogoUrl, userRole, setUserRole }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
