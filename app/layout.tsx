import type {Metadata} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { AppProvider } from '@/components/providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
});

export const metadata: Metadata = {
  title: 'SMART-PPI | Intelligent Infection Control',
  description: 'Sistem Monitoring, Audit dan Supervisi Terintegrasi Pencegahan dan Pengendalian Infeksi Rumah Sakit',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans bg-navy-dark text-slate-200 antialiased" suppressHydrationWarning>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
