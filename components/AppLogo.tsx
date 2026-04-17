'use client';

import { ShieldCheck } from 'lucide-react';
import { useAppContext } from '@/components/providers';

interface AppLogoProps {
  className?: string;
  iconClassName?: string;
}

export function AppLogo({ className = "w-10 h-10", iconClassName = "w-6 h-6" }: AppLogoProps) {
  const { logoUrl } = useAppContext();
  
  if (logoUrl) {
    return (
      <div className={`flex items-center justify-center overflow-hidden rounded-2xl ${className}`}>
        <img src={logoUrl} alt="App Logo" className="w-full h-full object-contain" />
      </div>
    );
  }
  
  return (
    <div className={`bg-primary rounded-2xl shadow-lg flex items-center justify-center ${className}`}>
      <ShieldCheck className={`text-white ${iconClassName}`} />
    </div>
  );
}
