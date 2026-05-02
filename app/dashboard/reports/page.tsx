'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  FileSpreadsheet,
  FileIcon,
  Search,
  ArrowLeft,
  Activity,
  ShieldCheck,
  ClipboardCheck,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Share2,
  FileDown,
  Printer,
  Grid,
  List as ListIcon,
  X,
  Plus,
  RefreshCw,
  Clock,
  User,
  Building2,
  AlertTriangle,
  Lightbulb,
  PlusCircle,
  CheckCircle2,
  Wind,
  ShieldAlert,
  Truck,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

import { getSupabase } from '@/lib/supabase';
import { useAppContext } from '@/components/providers';

// Lazy load heavy report components
const GenericAuditReport = dynamic(() => import('@/components/reports/GenericAuditReport'), {
  loading: () => <div className="h-96 flex items-center justify-center animate-pulse bg-white/5 rounded-3xl">Memuat Laporan...</div>
});
const DekontaminasiAlatReport = dynamic(() => import('@/components/reports/DekontaminasiAlatReport'), {
  loading: () => <div className="h-96 flex items-center justify-center animate-pulse bg-white/5 rounded-3xl">Memuat Laporan...</div>
});
const HandHygieneReport = dynamic(() => import('@/components/reports/HandHygieneReport'), {
  loading: () => <div className="h-96 flex items-center justify-center animate-pulse bg-white/5 rounded-3xl">Memuat Laporan...</div>
});
const ApdReport = dynamic(() => import('@/components/reports/ApdReport'), {
  loading: () => <div className="h-96 flex items-center justify-center animate-pulse bg-white/5 rounded-3xl">Memuat Laporan...</div>
});

// --- Types & Mock Data ---

type ReportModule = 'hub' | 'isolasi' | 'surveilans' | 'bundles' | 'diklat';
type IsolasiCategory = 'Semua' | 'Standar' | 'Transmisi' | 'Monitoring';

const COLORS = ['#3b82f6', '#8b5cf6', '#e11d48', '#10b981', '#f59e0b'];

const trendData = [
  { name: 'Jan', hh: 82, apd: 78, hais: 2.1 },
  { name: 'Feb', hh: 85, apd: 82, hais: 1.8 },
  { name: 'Mar', hh: 79, apd: 75, hais: 2.4 },
  { name: 'Apr', hh: 91, apd: 88, hais: 1.2 },
];

const unitData = [
  { name: 'IGD', value: 88 },
  { name: 'ICU', value: 92 },
  { name: 'Ranap A', value: 76 },
  { name: 'Ranap B', value: 84 },
  { name: 'Ranap C', value: 65 },
];

const indicators: Record<string, any[]> = {
  isolasi: [
    { id: 'hh', name: 'Kepatuhan Kebersihan Tangan', category: 'Standar', standard: 85, compliance: 85, trend: '+2%', icon: Activity },
    { id: 'apd', name: 'Kepatuhan Penggunaan APD', category: 'Standar', standard: 100, compliance: 78, trend: '-5%', icon: ShieldCheck },
    { id: 'dekontaminasi_alat', name: 'Kepatuhan Dekontaminasi Alat', category: 'Standar', standard: 100, compliance: 92, trend: '+1%', icon: ClipboardCheck },
    { id: 'pengendalian_lingkungan', name: 'Kepatuhan Pengendalian Lingkungan', category: 'Standar', standard: 80, compliance: 88, trend: '+3%', icon: Building2 },
    { id: 'limbah_m', name: 'Kepatuhan Limbah Medis', category: 'Standar', standard: 100, compliance: 85, trend: '0%', icon: AlertTriangle },
    { id: 'limbah_t', name: 'Kepatuhan Limbah Tajam', category: 'Standar', standard: 100, compliance: 95, trend: '+5%', icon: AlertTriangle },
    { id: 'linen', name: 'Kepatuhan Pengelolaan Linen', category: 'Standar', standard: 100, compliance: 65, trend: '-10%', icon: ClipboardCheck },
    { id: 'penyuntikan_aman', name: 'Kepatuhan Penyuntikan Aman', category: 'Standar', standard: 100, compliance: 98, trend: '+1%', icon: ShieldCheck },
    { id: 'perlindungan_petugas', name: 'Kepatuhan Perlindungan Petugas', category: 'Standar', standard: 100, compliance: 90, trend: '+2%', icon: ShieldCheck },
    { id: 'etika_batuk', name: 'Kepatuhan Etika Batuk', category: 'Standar', standard: 100, compliance: 92, trend: '+1%', icon: Activity },
    { id: 'penempatan_pasien', name: 'Kepatuhan Penempatan Pasien', category: 'Transmisi', standard: 100, compliance: 100, trend: '0%', icon: User },
    { id: 'airborne', name: 'Penempatan Pasien Airbone', category: 'Transmisi', standard: 100, compliance: 95, trend: '+2%', icon: Wind },
    { id: 'immuno', name: 'Penempatan Pasien Immunocompromised', category: 'Transmisi', standard: 100, compliance: 96, trend: '+1%', icon: ShieldCheck },
    { id: 'ppi_ruang_isolasi', name: 'Kepatuhan PPI Ruang Isolasi (Lengkap)', category: 'Transmisi', standard: 100, compliance: 95, trend: '+2%', icon: ShieldAlert },
    { id: 'fasilitas_hh', name: 'Monitoring Fasilitas Hand Hygiene', category: 'Monitoring', standard: 100, compliance: 92, trend: '+0%', icon: Activity },
    { id: 'fasilitas_apd', name: 'Monitoring Fasilitas APD', category: 'Monitoring', standard: 100, compliance: 85, trend: '-2%', icon: ShieldCheck },
    { id: 'farmasi', name: 'Monitoring Farmasi', category: 'Monitoring', standard: 100, compliance: 98, trend: '+1%', icon: Building2 },
    { id: 'ruangan_ibs', name: 'Monitoring Ruangan IBS', category: 'Monitoring', standard: 100, compliance: 95, trend: '+4%', icon: Activity },
    { id: 'ambulance', name: 'Monitoring Ambulance', category: 'Monitoring', standard: 100, compliance: 90, trend: '+0%', icon: Truck },
    { id: 'tps', name: 'Monitoring TPS', category: 'Monitoring', standard: 100, compliance: 85, trend: '+1%', icon: AlertTriangle },
    { id: 'tunggu', name: 'Monitoring Ruang Tunggu', category: 'Monitoring', standard: 100, compliance: 88, trend: '+2%', icon: Users },
  ],
  surveilans: [
    { id: 'phl', name: 'Surveilans Phlebitis', standard: 5, rate: 2.4, trend: '-0.2', type: '‰', icon: Activity },
    { id: 'isk', name: 'Surveilans CAUTI (ISK)', standard: 4.7, rate: 1.8, trend: '+0.5', type: '‰', icon: Activity },
    { id: 'vap', name: 'Surveilans VAP', standard: 5.8, rate: 3.1, trend: '-0.1', type: '‰', icon: Activity },
    { id: 'ido', name: 'Surveilans IDO', standard: 2, rate: 1.2, trend: '0.0', type: '%', icon: Activity },
  ],
  bundles: [
    { id: 'iadp', name: 'Kepatuhan Bundles IADP', standard: 100, compliance: 94, trend: '+4%', icon: ShieldCheck },
    { id: 'cauti', name: 'Kepatuhan Bundles CAUTI', standard: 100, compliance: 88, trend: '+2%', icon: ShieldCheck },
    { id: 'ido_b', name: 'Kepatuhan Bundles IDO', standard: 100, compliance: 82, trend: '-3%', icon: ShieldCheck },
    { id: 'vap_b', name: 'Kepatuhan Bundles VAP', standard: 100, compliance: 75, trend: '-5%', icon: ShieldCheck },
  ],
  diklat: [
    { id: 'sos', name: 'Sosialisasi PPI', standard: 100, compliance: 100, trend: '0%', icon: GraduationCap },
    { id: 'ws', name: 'Workshop Hand Hygiene', standard: 100, compliance: 100, trend: '0%', icon: GraduationCap },
    { id: 'sim', name: 'Simulasi BHD & PPI', standard: 100, compliance: 100, trend: '0%', icon: GraduationCap },
  ]
};

const genericAuditConfigs: Record<string, {
  tableName: string, 
  items: {id: string, label: string, key: string, isNegative?: boolean, section?: string}[],
  extraFilter?: Record<string, string>
}> = {
  hh: {
    tableName: 'audit_hand_hygiene',
    items: [
      { id: 'm1', label: 'Momen 1: Sebelum kontak dengan pasien', key: 'm1', section: '5 Momen Hand Hygiene' },
      { id: 'm2', label: 'Momen 2: Sebelum tindakan aseptik', key: 'm2', section: '5 Momen Hand Hygiene' },
      { id: 'm3', label: 'Momen 3: Setelah kontak cairan tubuh', key: 'm3', section: '5 Momen Hand Hygiene' },
      { id: 'm4', label: 'Momen 4: Setelah kontak dengan pasien', key: 'm4', section: '5 Momen Hand Hygiene' },
      { id: 'm5', label: 'Momen 5: Setelah kontak lingkungan pasien', key: 'm5', section: '5 Momen Hand Hygiene' }
    ]
  },
  apd: {
    tableName: 'audit_apd',
    items: [
      { id: 'masker', label: 'Penggunaan Masker', key: 'masker', section: 'Kelengkapan APD' },
      { id: 'sarung_tangan', label: 'Penggunaan Sarung Tangan', key: 'sarung_tangan', section: 'Kelengkapan APD' },
      { id: 'penutup_kepala', label: 'Penggunaan Penutup Kepala', key: 'penutup_kepala', section: 'Kelengkapan APD' },
      { id: 'goggle', label: 'Penggunaan Kacamata / Goggle', key: 'goggle', section: 'Kelengkapan APD' },
      { id: 'gaun_pelindung', label: 'Penggunaan Gaun Pelindung', key: 'gaun_pelindung', section: 'Kelengkapan APD' },
      { id: 'sepatu_boot', label: 'Penggunaan Sepatu Boot', key: 'sepatu_boot', section: 'Kelengkapan APD' }
    ]
  },
  dekontaminasi_alat: {
    tableName: 'audit_dekontaminasi_alat',
    items: [
      { id: 'item_1', label: 'Petugas yang melakukan dekontaminasi menggunakan APD', key: 'item_1' },
      { id: 'item_2', label: 'Alat kotor segera di cleaning / pre-cleaning', key: 'item_2' },
      { id: 'item_3', label: 'Dilakukan perendaman awal', key: 'item_3' },
      { id: 'item_4', label: 'Larutan diganti setiap pergantian shift', key: 'item_4' },
      { id: 'item_5', label: 'Alat dicuci di bawah air mengalir', key: 'item_5' },
      { id: 'item_6', label: 'Alat dikeringkan', key: 'item_6' },
      { id: 'item_7', label: 'Alat kotor belum digunakan dipisah', key: 'item_7' },
      { id: 'item_8', label: 'Packing / bungkus sesuai SPO', key: 'item_8' },
      { id: 'item_9', label: 'Diberi tanda dan identitas yang jelas', key: 'item_9' }
    ]
  },
  pengendalian_lingkungan: {
    tableName: 'audit_pengendalian_lingkungan',
    items: [
      { id: 'item_1', label: 'Kursi/meja/dan loker tampak bersih', key: 'item_1' },
      { id: 'item_2', label: 'Troli tindakan tampak bersih', key: 'item_2' },
      { id: 'item_3', label: 'Troli tindakan dibersihkan dan didesinfeksi', key: 'item_3' },
      { id: 'item_4', label: 'Lantai bersih dan dalam kondisi baik', key: 'item_4' },
      { id: 'item_5', label: 'Ditemukan debu di permukaan kerja', key: 'item_5', isNegative: true },
      { id: 'item_6', label: 'Tirai pemisah bersih', key: 'item_6' },
      { id: 'item_7', label: 'Kipas angin dan AC bersih', key: 'item_7' },
      { id: 'item_8', label: 'Dinding bebas jamur', key: 'item_8' },
      { id: 'item_9', label: 'Ventilasi/jendela bersih', key: 'item_9' },
      { id: 'item_10', label: 'Area tunggu bersih', key: 'item_10' },
    ]
  },
  limbah_m: {
    tableName: 'audit_pengelolaan_limbah_medis',
    items: [
      { id: 'item_1', label: 'Tersedia fasilitas pembuangan sampah', key: 'item_1' },
      { id: 'item_2', label: 'Tempat sampah pedal kaki', key: 'item_2' },
      { id: 'item_3', label: 'Tempat sampah berlabel', key: 'item_3' },
      { id: 'item_4', label: 'Plastik kuning limbah infeksius', key: 'item_4' },
      { id: 'item_5', label: 'Tempat sampah memadai', key: 'item_5' },
      { id: 'item_6', label: 'Sampah diikat', key: 'item_6' },
      { id: 'item_7', label: 'Sampah tidak lebih 3/4', key: 'item_7' },
      { id: 'item_8', label: 'Disimpan di TPS', key: 'item_8' },
      { id: 'item_9', label: 'Tahu cara tumpahan', key: 'item_9' },
      { id: 'item_10', label: 'Spill kit tersedia', key: 'item_10' }
    ]
  },
  limbah_t: {
    tableName: 'audit_pengelolaan_limbah_tajam',
    items: [
      { id: 'item_1', label: 'Safety box sesuai WHO', key: 'item_1' },
      { id: 'item_2', label: 'Wadah aman', key: 'item_2' },
      { id: 'item_3', label: 'Wadah < 3/4 penuh', key: 'item_3' },
      { id: 'item_4', label: 'Tidak ada tajam keluar', key: 'item_4' },
      { id: 'item_5', label: 'Tajam masuk wadah tajam', key: 'item_5' },
      { id: 'item_6', label: 'Tong tajam di troli', key: 'item_6' },
      { id: 'item_7', label: '1 tangan / no recapping', key: 'item_7' },
      { id: 'item_8', label: 'Jalur paska pajanan', key: 'item_8' },
    ]
  },
  linen: {
    tableName: 'audit_penatalaksanaan_linen',
    items: [
      { id: 'item_1', label: 'Linen bersih disimpan lemari tertutup', key: 'item_1' },
      { id: 'item_2', label: 'Troli tertutup kotor', key: 'item_2' },
      { id: 'item_3', label: 'Kantung kuning infeksius', key: 'item_3' },
      { id: 'item_4', label: 'Linen kotor dipisah', key: 'item_4' },
      { id: 'item_5', label: 'Petugas APD infeksius', key: 'item_5' }
    ]
  },
  airborne: {
    tableName: 'penempatan_pasien_airbone',
    items: [
      { id: 'item_1', label: 'Ruangan terpisah (sendiri) / cohorting jarak > 1 meter', key: 'item_1' },
      { id: 'item_2', label: 'Ventilasi memadai', key: 'item_2' },
      { id: 'item_3', label: 'Sinar matahari masuk', key: 'item_3' },
      { id: 'item_4', label: 'Jendela terbuka', key: 'item_4' },
      { id: 'item_5', label: 'Pintu tertutup', key: 'item_5' },
      { id: 'item_6', label: 'Transport pasien perlu saja', key: 'item_6' },
      { id: 'item_7', label: 'Pasien memakai masker', key: 'item_7' },
      { id: 'item_8', label: 'Tersedia cuci tangan', key: 'item_8' },
      { id: 'item_9', label: 'Cuci tangan 5 momen', key: 'item_9' },
      { id: 'item_10', label: 'Masker saat kontak', key: 'item_10' },
      { id: 'item_11', label: 'Sarung tangan bila kontak cairan', key: 'item_11' },
      { id: 'item_12', label: 'Kacamata goggle', key: 'item_12' },
      { id: 'item_13', label: 'Gaun pelindung', key: 'item_13' },
      { id: 'item_14', label: 'Edukasi pasien', key: 'item_14' },
      { id: 'item_15', label: 'Edukasi keluarga', key: 'item_15' },
      { id: 'item_16', label: 'Bersihkan ruangan desinfektan', key: 'item_16' }
    ]
  },
  ppi_ruang_isolasi: {
    tableName: 'ppi_ruang_isolasi',
    items: [
      { id: 'tekanan_negatif', label: 'Tekanan Udara Negatif', key: 'tekanan_negatif' },
      { id: 'tekanan_positif', label: 'Tekanan Udara Positif', key: 'tekanan_positif' },
      { id: 'penggunaan_apd', label: 'Penggunaan APD yang sesuai', key: 'penggunaan_apd' },
      { id: 'ketersediaan_apd', label: 'Ketersediaan APD yang sesuai', key: 'ketersediaan_apd' },
      { id: 'fasilitas_hh', label: 'Kelengkapan Fasilitas Hand Hygiene', key: 'fasilitas_hh' },
      { id: 'edukasi_batuk', label: 'Edukasi Etika Batuk / Pembuangan Sputum', key: 'edukasi_batuk' },
      { id: 'edukasi_hh', label: 'Edukasi Hand Hygiene', key: 'edukasi_hh' }
    ]
  },
  immuno: {
    tableName: 'penempatan_pasien_immunocompromised',
    items: [
      { id: 'ruang_terpisah', label: 'Ruangan terpisah (sendiri) / cohorting jarak > 1 meter', key: 'ruang_terpisah' },
      { id: 'pintu_tertutup', label: 'Pintu ruangan selalu tertutup', key: 'pintu_tertutup' },
      { id: 'transport_perlu', label: 'Transport pasien bila diperlukan saja', key: 'transport_perlu' },
      { id: 'pasien_masker', label: 'Pasien memakai masker saat keluar ruangan', key: 'pasien_masker' },
      { id: 'fasilitas_ct', label: 'Tersedia fasilitas cuci tangan', key: 'fasilitas_ct' },
      { id: 'petugas_5momen', label: 'Petugas melakukan cuci tangan sesuai 5 momen', key: 'petugas_5momen' },
      { id: 'masker_kontak', label: 'Menggunakan masker saat kontak dengan pasien', key: 'masker_kontak' },
      { id: 'sarungtangan_cairan', label: 'Memakai sarung tangan bila akan kontak dengan cairan tubuh', key: 'sarungtangan_cairan' },
      { id: 'goggle_perlu', label: 'Memakai kacamata goggle bila perlu', key: 'goggle_perlu' },
      { id: 'gaun_perlu', label: 'Memakai gaun pelindung bila perlu', key: 'gaun_perlu' },
      { id: 'edukasi_pasien', label: 'Memberikan edukasi kepada pasien', key: 'edukasi_pasien' },
      { id: 'edukasi_keluarga', label: 'Memberikan edukasi kepada keluarga pasien', key: 'edukasi_keluarga' },
      { id: 'bersih_desinfektan', label: 'Setelah pasien pulang, bersihkan ruangan dengan cairan desinfektan sesuai standar', key: 'bersih_desinfektan' }
    ]
  },
  penempatan_pasien: {
    tableName: 'audit_penempatan_pasien',
    items: [
      { id: 'catatan_infeksi', label: 'Catatan infeksi', key: 'catatan_infeksi' },
      { id: 'instruksi_ruang', label: 'Instruksi petugas (tanda)', key: 'instruksi_ruang' },
      { id: 'poster_pencegahan', label: 'Poster pencegahan', key: 'poster_pencegahan' },
      { id: 'apd_tersedia', label: 'APD tersedia', key: 'apd_tersedia' },
      { id: 'catatan_klinis', label: 'Catatan klinis', key: 'catatan_klinis' },
      { id: 'instruksi_isolasi', label: 'Instruksi isolasi', key: 'instruksi_isolasi' },
      { id: 'pintu_tertutup', label: 'Pintu tertutup', key: 'pintu_tertutup' },
      { id: 'alur_pasien', label: 'Alur terpasang', key: 'alur_pasien' }
    ]
  },
  penyuntikan_aman: {
    tableName: 'audit_penyuntikan_aman',
    items: [
      { id: 'hh', label: 'Kebersihan tangan', key: 'hh' },
      { id: 'apd', label: 'APD indikasi', key: 'apd' },
      { id: 'disposable', label: 'Spuit sekali pakai', key: 'disposable' },
      { id: 'no_reuse', label: 'Spuit no reuse', key: 'no_reuse' },
      { id: 'no_touch_sterile', label: 'No touch steril', key: 'no_touch_sterile' },
      { id: 'area_disinfection', label: 'Desinfeksi area', key: 'area_disinfection' },
      { id: 'antiseptic_standard', label: 'Antiseptik standar', key: 'antiseptic_standard' },
      { id: 'no_recapping', label: 'No recapping', key: 'no_recapping' },
      { id: 'safety_box', label: 'Safety box langsung', key: 'safety_box' },
      { id: 'no_bending', label: 'No bending jarum', key: 'no_bending' }
    ]
  },
  etika_batuk: {
    tableName: 'audit_etika_batuk',
    items: [
      { id: 'mengenakan_masker', label: 'Mengenakan masker', key: 'mengenakan_masker' },
      { id: 'menutup_mulut_hidung', label: 'Menutup mulut & hidung saat batuk/bersin', key: 'menutup_mulut_hidung' },
      { id: 'tisu_sekali_pakai', label: 'Menggunakan tisu sekali pakai', key: 'tisu_sekali_pakai' },
      { id: 'cuci_tangan', label: 'Melakukan kebersihan tangan setelah batuk/bersin', key: 'cuci_tangan' },
      { id: 'jarak_sosial', label: 'Menjaga jarak dengan orang lain', key: 'jarak_sosial' }
    ]
  },
  perlindungan_petugas: {
    tableName: 'audit_perlindungan_petugas',
    items: [
      { id: 'item_1', label: 'Vaksinasi HepB & Covid', key: 'item_1' },
      { id: 'item_2', label: 'Pemeriksaan 1x/thn', key: 'item_2' }
    ]
  },
  fasilitas_hh: {
    tableName: 'monitoring_fasilitas_hand_hygiene',
    items: [
      { id: 'item_1', label: 'Tersedia Hand Rub Cukup', key: 'item_1' },
      { id: 'item_2', label: 'Tersedia Sabun Cair Cukup', key: 'item_2' },
      { id: 'item_3', label: 'Tersedia Tissue Towel Cukup', key: 'item_3' },
      { id: 'item_4', label: 'Kondisi Wastafel Baik', key: 'item_4' },
      { id: 'item_5', label: 'Air Wastafel Mengalir Lancar', key: 'item_5' },
      { id: 'item_6', label: 'Tersedia Petunjuk Cuci Tangan', key: 'item_6' },
      { id: 'item_7', label: 'Tersedia Tempat Sampah Non-Medis', key: 'item_7' },
      { id: 'item_8', label: 'Lingkungan Sekitar Wastafel Bersih', key: 'item_8' },
    ]
  },
  fasilitas_apd: {
    tableName: 'monitoring_fasilitas_apd',
    items: [
      { id: 'item_1', label: 'Tersedia Masker Medis', key: 'item_1' },
      { id: 'item_2', label: 'Tersedia Masker N95', key: 'item_2' },
      { id: 'item_3', label: 'Tersedia Gown / Apron', key: 'item_3' },
      { id: 'item_4', label: 'Tersedia Sarung Tangan Steril', key: 'item_4' },
      { id: 'item_5', label: 'Tersedia Sarung Tangan Non-Steril', key: 'item_5' },
      { id: 'item_6', label: 'Tersedia Googles / Face Shield', key: 'item_6' },
      { id: 'item_7', label: 'Tersedia Sepatu Boots', key: 'item_7' },
      { id: 'item_8', label: 'Penyimpanan APD Tepat & Bersih', key: 'item_8' }
    ]
  },
  farmasi: {
    tableName: 'audit_farmasi',
    items: [
      { id: 'item_1', label: 'Petugas memakai APD saat meracik obat', key: 'item_1' },
      { id: 'item_2', label: 'Fasilitas cuci tangan lengkap (air, sabun, tissue)', key: 'item_2' },
      { id: 'item_3', label: 'Melakukan kebersihan tangan 5 momen', key: 'item_3' },
      { id: 'item_4', label: 'Pencampuran obat dilakukan secara steril / aseptic', key: 'item_4' },
      { id: 'item_5', label: 'Obat LASA & High Alert diberi penanda', key: 'item_5' },
      { id: 'item_6', label: 'Monitoring suhu kulkas obat (2-8°C)', key: 'item_6' },
      { id: 'item_7', label: 'Monitoring suhu ruangan farmasi ( < 25°C)', key: 'item_7' },
      { id: 'item_8', label: 'Obat kadaluarsa disimpan terpisah', key: 'item_8' },
      { id: 'item_9', label: 'Limbah benda tajam dibuang ke safety box', key: 'item_9' },
      { id: 'item_10', label: 'Ruangan tampak bersih secara umum', key: 'item_10' }
    ]
  },
  ruangan_ibs: {
    tableName: 'audit_ruangan_ibs',
    items: [
      { id: 'a1', label: 'Personal hygiene baik', key: 'a1' },
      { id: 'a2', label: 'Menggunakan pakaian khusus OK', key: 'a2' },
      { id: 'a7', label: 'Cuci tangan bedah dengan benar sebelum prosedur', key: 'a7' },
      { id: 'b1', label: 'Pintu selalu tertutup', key: 'b1' },
      { id: 'b2', label: 'Pertahankan tekanan positif, suhu, dan kelembaban', key: 'b2' },
      { id: 'c1', label: 'Tertib Limbah', key: 'c1' },
      { id: 'd2', label: 'Wastafel cuci tangan tersedia', key: 'd2' },
      { id: 'e1', label: 'Pembersihan antar pasien', key: 'e1' },
      { id: 'f2', label: 'Suhu Ruangan 20ºC – 23ºC', key: 'f2' },
      { id: 'g1', label: 'Pertukaran udara kamar operasi minimal 15x/jam', key: 'g1' },
    ]
  },
  monitoring_ppi: {
    tableName: 'audit_monitoring_ppi',
    items: [
      { id: 'tekanan_negatif', label: 'Tekanan Udara Negatif', key: 'tekanan_negatif' },
      { id: 'penggunaan_apd', label: 'Penggunaan APD Sesuai', key: 'penggunaan_apd' },
      { id: 'ketersediaan_apd', label: 'Ketersediaan APD Sesuai', key: 'ketersediaan_apd' },
      { id: 'fasilitas_hh', label: 'Kelengkapan Fasilitas Hand Hygiene', key: 'fasilitas_hh' },
      { id: 'edukasi_hh', label: 'Edukasi Hand Hygiene', key: 'edukasi_hh' }
    ]
  },
  ambulance: {
    tableName: 'audit_ambulance',
    items: [
      { id: 'ambul_a', label: 'Tersedia spill kit tumpahan cairan tubuh', key: 'ambul_a' },
      { id: 'ambul_b', label: 'Ambulance tampak bersih', key: 'ambul_b' },
      { id: 'ambul_c', label: 'Tidak ada laba-laba / sarang kotor di sudut ambulance', key: 'ambul_c' },
      { id: 'ambul_d', label: 'Jendela kaca tampak bersih dan tidak ada debu', key: 'ambul_d' },
      { id: 'ambul_e', label: 'Tersedia sarana APD', key: 'ambul_e' },
      { id: 'ambul_f', label: 'Tersedia handrub di mobil ambulance', key: 'ambul_f' },
      { id: 'ambul_g', label: 'Tersedia tempat sampah tertutup', key: 'ambul_g' }
    ]
  },
  tunggu: {
    tableName: 'audit_ruang_tunggu',
    items: [
      { id: 'tungg_a1', label: 'Lantai bersih, kering, dan tidak licin', key: 'tungg_a1', section: 'A. Kebersihan Lingkungan' },
      { id: 'tungg_a2', label: 'Kursi ruang tunggu bersih dan tertata rapi', key: 'tungg_a2', section: 'A. Kebersihan Lingkungan' },
      { id: 'tungg_a3', label: 'Meja / counter tampak bersih', key: 'tungg_a3', section: 'A. Kebersihan Lingkungan' },
      { id: 'tungg_a4', label: 'Tidak ada debu pada permukaan furnitur', key: 'tungg_a4', section: 'A. Kebersihan Lingkungan' },
      { id: 'tungg_a5', label: 'Dinding dan plafon bersih, tidak berjamur', key: 'tungg_a5', section: 'A. Kebersihan Lingkungan' },
      { id: 'tungg_a6', label: 'Kaca / jendela bersih', key: 'tungg_a6', section: 'A. Kebersihan Lingkungan' },
      { id: 'tungg_a7', label: 'Tempat sampah tersedia dan tertutup', key: 'tungg_a7', section: 'A. Kebersihan Lingkungan' },
      { id: 'tungg_a8', label: 'Tempat sampah tidak melebihi 3/4 penuh', key: 'tungg_a8', section: 'A. Kebersihan Lingkungan' },
      { id: 'tungg_b1', label: 'Tersedia handrub di area ruang tunggu', key: 'tungg_b1', section: 'B. Fasilitas Kebersihan Tangan' },
      { id: 'tungg_b2', label: 'Handrub dalam kondisi terisi dan berfungsi baik', key: 'tungg_b2', section: 'B. Fasilitas Kebersihan Tangan' },
      { id: 'tungg_b3', label: 'Tersedia wastafel cuci tangan (jika ada)', key: 'tungg_b3', section: 'B. Fasilitas Kebersihan Tangan' },
      { id: 'tungg_b4', label: 'Sabun cuci tangan tersedia', key: 'tungg_b4', section: 'B. Fasilitas Kebersihan Tangan' },
      { id: 'tungg_b5', label: 'Tissue / hand dryer tersedia', key: 'tungg_b5', section: 'B. Fasilitas Kebersihan Tangan' },
      { id: 'tungg_b6', label: 'Poster 6 langkah cuci tangan tersedia', key: 'tungg_b6', section: 'B. Fasilitas Kebersihan Tangan' },
      { id: 'tungg_b7', label: 'Poster 5 momen hand hygiene tersedia (jika area klinis berdekatan)', key: 'tungg_b7', section: 'B. Fasilitas Kebersihan Tangan' },
      { id: 'tungg_c1', label: 'Ventilasi ruangan baik', key: 'tungg_c1', section: 'C. Ventilasi dan Kenyamanan' },
      { id: 'tungg_c2', label: 'AC / kipas dalam kondisi bersih', key: 'tungg_c2', section: 'C. Ventilasi dan Kenyamanan' },
      { id: 'tungg_c3', label: 'Sirkulasi udara baik', key: 'tungg_c3', section: 'C. Ventilasi dan Kenyamanan' },
      { id: 'tungg_c4', label: 'Ruangan tidak berbau tidak sedap', key: 'tungg_c4', section: 'C. Ventilasi dan Kenyamanan' },
      { id: 'tungg_c5', label: 'Pencahayaan cukup', key: 'tungg_c5', section: 'C. Ventilasi dan Kenyamanan' },
      { id: 'tungg_d1', label: 'Poster etika batuk tersedia', key: 'tungg_d1', section: 'D. Edukasi dan Etika Batuk' },
      { id: 'tungg_d2', label: 'Poster penggunaan masker tersedia', key: 'tungg_d2', section: 'D. Edukasi dan Etika Batuk' },
      { id: 'tungg_d3', label: 'Tersedia masker cadangan bagi pengunjung bergejala', key: 'tungg_d3', section: 'D. Edukasi dan Etika Batuk' },
      { id: 'tungg_d4', label: 'Pengunjung berbatuk diarahkan memakai masker', key: 'tungg_d4', section: 'D. Edukasi dan Etika Batuk' },
      { id: 'tungg_d5', label: 'Tersedia tissue untuk etika batuk', key: 'tungg_d5', section: 'D. Edukasi dan Etika Batuk' },
      { id: 'tungg_e1', label: 'Kursi memiliki jarak memadai antar pengunjung', key: 'tungg_e1', section: 'E. Pengendalian Kepadatan' },
      { id: 'tungg_e2', label: 'Tidak terjadi penumpukan berlebihan', key: 'tungg_e2', section: 'E. Pengendalian Kepadatan' },
      { id: 'tungg_e3', label: 'Jalur antrean tertata', key: 'tungg_e3', section: 'E. Pengendalian Kepadatan' },
      { id: 'tungg_e4', label: 'Area prioritas lansia/disabilitas tersedia', key: 'tungg_e4', section: 'E. Pengendalian Kepadatan' },
      { id: 'tungg_f1', label: 'Petugas memakai identitas kerja', key: 'tungg_f1', section: 'F. Kepatuhan Petugas Area Ruang Tunggu' },
      { id: 'tungg_f2', label: 'Petugas menjaga kebersihan tangan', key: 'tungg_f2', section: 'F. Kepatuhan Petugas Area Ruang Tunggu' },
      { id: 'tungg_f3', label: 'Petugas memakai masker bila diperlukan', key: 'tungg_f3', section: 'F. Kepatuhan Petugas Area Ruang Tunggu' },
      { id: 'tungg_f4', label: 'Petugas memberikan edukasi bila ada pasien bergejala infeksi', key: 'tungg_f4', section: 'F. Kepatuhan Petugas Area Ruang Tunggu' }
    ]
  },
  tps: {
    tableName: 'audit_tps',
    items: [
      { id: 'a1', label: 'Lokasi TPS terpisah dari area pelayanan pasien', key: 'a1', section: 'A. Area TPS dan Bangunan' },
      { id: 'a2', label: 'TPS memiliki akses terbatas / terkunci', key: 'a2', section: 'A. Area TPS dan Bangunan' },
      { id: 'a3', label: 'Bangunan TPS tertutup dan aman', key: 'a3', section: 'A. Area TPS dan Bangunan' },
      { id: 'a4', label: 'Lantai kuat, rata, kedap air, dan mudah dibersihkan', key: 'a4', section: 'A. Area TPS dan Bangunan' },
      { id: 'a5', label: 'Lantai tidak licin', key: 'a5', section: 'A. Area TPS dan Bangunan' },
      { id: 'a6', label: 'Dinding dalam kondisi baik dan bersih', key: 'a6', section: 'A. Area TPS dan Bangunan' },
      { id: 'a7', label: 'Atap tidak bocor', key: 'a7', section: 'A. Area TPS dan Bangunan' },
      { id: 'a8', label: 'Pencahayaan cukup', key: 'a8', section: 'A. Area TPS dan Bangunan' },
      { id: 'a9', label: 'Ventilasi memadai', key: 'a9', section: 'A. Area TPS dan Bangunan' },
      { id: 'a10', label: 'Tersedia drainase / saluran pembuangan baik', key: 'a10', section: 'A. Area TPS dan Bangunan' },
      { id: 'b1', label: 'Area TPS bersih dan rapi', key: 'b1', section: 'B. Kebersihan Lingkungan' },
      { id: 'b2', label: 'Tidak ada tumpahan sampah di lantai', key: 'b2', section: 'B. Kebersihan Lingkungan' },
      { id: 'b3', label: 'Tidak ada bau menyengat berlebihan', key: 'b3', section: 'B. Kebersihan Lingkungan' },
      { id: 'b4', label: 'Tidak ada genangan air', key: 'b4', section: 'B. Kebersihan Lingkungan' },
      { id: 'b5', label: 'Tidak ada debu berlebihan', key: 'b5', section: 'B. Kebersihan Lingkungan' },
      { id: 'b6', label: 'Tidak ditemukan vektor (lalat/tikus/kucing liar)', key: 'b6', section: 'B. Kebersihan Lingkungan' },
      { id: 'b7', label: 'Jadwal pembersihan rutin tersedia', key: 'b7', section: 'B. Kebersihan Lingkungan' },
      { id: 'b8', label: 'Disinfeksi area dilakukan berkala', key: 'b8', section: 'B. Kebersihan Lingkungan' },
      { id: 'c1', label: 'Sampah medis dan non medis dipisahkan', key: 'c1', section: 'C. Pemilahan dan Penyimpanan Sampah' },
      { id: 'c2', label: 'Sampah infeksius menggunakan kantong kuning', key: 'c2', section: 'C. Pemilahan dan Penyimpanan Sampah' },
      { id: 'c3', label: 'Sampah non medis menggunakan kantong hitam', key: 'c3', section: 'C. Pemilahan dan Penyimpanan Sampah' },
      { id: 'c4', label: 'Limbah tajam menggunakan safety box/container khusus', key: 'c4', section: 'C. Pemilahan dan Penyimpanan Sampah' },
      { id: 'c5', label: 'Safety box tidak lebih dari 3/4 penuh', key: 'c5', section: 'C. Pemilahan dan Penyimpanan Sampah' },
      { id: 'c6', label: 'Sampah diberi label sesuai jenis', key: 'c6', section: 'C. Pemilahan dan Penyimpanan Sampah' },
      { id: 'c7', label: 'Wadah sampah tertutup', key: 'c7', section: 'C. Pemilahan dan Penyimpanan Sampah' },
      { id: 'c8', label: 'Wadah sampah dalam kondisi baik', key: 'c8', section: 'C. Pemilahan dan Penyimpanan Sampah' },
      { id: 'c9', label: 'Tidak ada pencampuran limbah', key: 'c9', section: 'C. Pemilahan dan Penyimpanan Sampah' },
      { id: 'd1', label: 'Jadwal pengangkutan sampah tersedia', key: 'd1', section: 'D. Pengangkutan Sampah' },
      { id: 'd2', label: 'Sampah diangkut rutin sesuai jadwal', key: 'd2', section: 'D. Pengangkutan Sampah' },
      { id: 'd3', label: 'Troli/alat angkut khusus tersedia', key: 'd3', section: 'D. Pengangkutan Sampah' },
      { id: 'd4', label: 'Troli dalam kondisi bersih', key: 'd4', section: 'D. Pengangkutan Sampah' },
      { id: 'd5', label: 'Jalur pengangkutan aman dan tidak melewati area bersih', key: 'd5', section: 'D. Pengangkutan Sampah' },
      { id: 'd6', label: 'Petugas mengikat kantong sebelum diangkut', key: 'd6', section: 'D. Pengangkutan Sampah' },
      { id: 'e1', label: 'Petugas menggunakan sarung tangan', key: 'e1', section: 'E. Petugas dan APD' },
      { id: 'e2', label: 'Petugas menggunakan masker', key: 'e2', section: 'E. Petugas dan APD' },
      { id: 'e3', label: 'Petugas menggunakan sepatu boot', key: 'e3', section: 'E. Petugas dan APD' },
      { id: 'e4', label: 'Petugas menggunakan apron / pelindung', key: 'e4', section: 'E. Petugas dan APD' },
      { id: 'e5', label: 'Petugas melakukan hand hygiene setelah bekerja', key: 'e5', section: 'E. Petugas dan APD' },
      { id: 'e6', label: 'Petugas mengetahui SOP pengelolaan limbah', key: 'e6', section: 'E. Petugas dan APD' },
      { id: 'e7', label: 'Petugas mengetahui penanganan tumpahan limbah', key: 'e7', section: 'E. Petugas dan APD' },
      { id: 'f1', label: 'Tersedia handrub / fasilitas cuci tangan', key: 'f1', section: 'F. Sarana Pendukung' },
      { id: 'f2', label: 'Tersedia sabun antiseptik', key: 'f2', section: 'F. Sarana Pendukung' },
      { id: 'f3', label: 'Tersedia tissue / pengering tangan', key: 'f3', section: 'F. Sarana Pendukung' },
      { id: 'f4', label: 'Tersedia spill kit limbah', key: 'f4', section: 'F. Sarana Pendukung' },
      { id: 'f5', label: 'Tersedia APAR bila diperlukan', key: 'f5', section: 'F. Sarana Pendukung' },
      { id: 'f6', label: 'Tersedia papan peringatan biohazard', key: 'f6', section: 'F. Sarana Pendukung' },
    ]
  },
  iadp: {
    tableName: 'audit_bundles_hais',
    extraFilter: { bundle_id: 'plabsi-maintenance' },
    items: [
      { id: '0', label: 'Kebersihan tangan sebelum memanipulasi line', key: '0' },
      { id: '1', label: 'Perawatan dressing steril dan tetap utuh', key: '1' },
      { id: '2', label: 'Evaluasi harian kebutuhan kateter', key: '2' },
      { id: '3', label: 'Sistem tertutup dipertahankan', key: '3' },
      { id: '4', label: 'Disinfeksi hub sebelum akses', key: '4' }
    ]
  },
  cauti: {
    tableName: 'audit_bundles_hais',
    extraFilter: { bundle_id: 'cauti-maintenance' },
    items: [
      { id: '0', label: 'Sistem drainase tertutup dipertahankan', key: '0' },
      { id: '1', label: 'Posisi urine bag lebih rendah', key: '1' },
      { id: '2', label: 'Tidak ada lekukan pada tubing', key: '2' },
      { id: '3', label: 'Kebersihan perineal dijaga', key: '3' },
      { id: '4', label: 'Evaluasi harian kebutuhan kateter', key: '4' }
    ]
  },
  ido_b: {
    tableName: 'audit_bundles_hais',
    extraFilter: { bundle_id: 'ido-post-operasi' },
    items: [
      { id: '0', label: 'Perawatan luka dilakukan secara steril', key: '0' },
      { id: '1', label: 'Edukasi pasien/keluarga terkait perawatan luka', key: '1' },
      { id: '2', label: 'Pemantauan tanda-tanda infeksi area luka', key: '2' },
      { id: '3', label: 'Kebersihan tangan sebelum dan setelah menangani luka', key: '3' }
    ]
  },
  vap_b: {
    tableName: 'audit_bundles_hais',
    extraFilter: { bundle_id: 'vap-maintenance' },
    items: [
      { id: '0', label: 'Elevasi posisi kepala 30-45 derajat', key: '0' },
      { id: '1', label: 'Kebersihan mulut rutin dengan antiseptik', key: '1' },
      { id: '2', label: 'Proses suction dilakukan dengan teknik steril', key: '2' },
      { id: '3', label: 'Evaluasi harian untuk rencana ekstubasi', key: '3' },
      { id: '4', label: 'Pengurasan rutin kondensat tubing ventilator', key: '4' }
    ]
  },
  phl: {
    tableName: 'surveilans_phlebitis',
    items: [
      { id: '1', label: 'Observasi area insersi kateter intravaskuler', key: '1' },
      { id: '2', label: 'Tidak ada tanda kemerahan / indurasi', key: '2' },
      { id: '3', label: 'Fiksasi kateter dalam kondisi baik', key: '3' },
      { id: '4', label: 'Pencatatan tanggal pemasangan kateter jelas', key: '4' }
    ]
  },
  isk: {
    tableName: 'surveilans_isk',
    items: [
      { id: '1', label: 'Pemasangan kateter urin sesuai indikasi klinis', key: '1' },
      { id: '2', label: 'Pemasangan menggunakan teknik steril', key: '2' },
      { id: '3', label: 'Pemeliharaan sistem drainase tertutup', key: '3' },
      { id: '4', label: 'Urine bag tidak menyentuh lantai', key: '4' }
    ]
  },
  vap: {
    tableName: 'surveilans_vap',
    items: [
      { id: '1', label: 'Elevasi posisi kepala tempat tidur 30–45 derajat', key: '1' },
      { id: '2', label: 'Oral hygiene setiap 4-6 jam', key: '2' },
      { id: '3', label: 'Manajemen sekresi dan suctioning tepat', key: '3' },
      { id: '4', label: 'Pengkajian rutin ekstubasi', key: '4' }
    ]
  },
  ido: {
    tableName: 'surveilans_ido',
    items: [
      { id: '1', label: 'Cukur rambut di area operasi hanya bila perlu', key: '1' },
      { id: '2', label: 'Mandi dengan antiseptik sebelum operasi', key: '2' },
      { id: '3', label: 'Antibiotik profilaksis diberikan maksimal 1 jam sebelum insisi', key: '3' },
      { id: '4', label: 'Perawatan luka bedah dilakukan secara steril', key: '4' }
    ]
  },
  sos: {
    tableName: 'kegiatan_diklat',
    extraFilter: { jenis: 'sosialisasi' },
    items: [
      { id: '1', label: 'Materi disampaikan sesuai pedoman PPI terbaru', key: '1' },
      { id: '2', label: 'Terdapat daftar hadir peserta', key: '2' },
      { id: '3', label: 'Peserta dapat menjelaskan kembali materi pokok', key: '3' },
      { id: '4', label: 'Dokumentasi kegiatan lengkap', key: '4' }
    ]
  },
  ws: {
    tableName: 'kegiatan_diklat',
    extraFilter: { jenis: 'workshop' },
    items: [
      { id: '1', label: 'Fasilitas dan alat praktik (hand rub/sabun) memadai', key: '1' },
      { id: '2', label: 'Peserta mengikuti praktik langkah cuci tangan', key: '2' },
      { id: '3', label: 'Evaluasi kepatuhan langsung oleh instruktur', key: '3' },
      { id: '4', label: 'Umpan balik diberikan kepada peserta', key: '4' }
    ]
  },
  sim: {
    tableName: 'kegiatan_diklat',
    extraFilter: { jenis: 'simulasi' },
    items: [
      { id: '1', label: 'Skenario simulasi disiapkan secara komprehensif', key: '1' },
      { id: '2', label: 'Peserta menggunakan APD yang tepat selama simulasi', key: '2' },
      { id: '3', label: 'Alur penanganan sesuai dengan pedoman standar', key: '3' }
    ]
  }
};

// --- Sub-Components ---

const StatCard = ({ title, value, subValue, icon: Icon, color, onClick }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    onClick={onClick}
    className="glass-card p-6 rounded-[2rem] border-white/5 shadow-xl cursor-pointer group relative overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] rounded-full -z-10 bg-gradient-to-br ${color} opacity-20`} />
    <div className="flex justify-between items-start mb-4">
      <div className={`p-4 rounded-2xl bg-white/5 border border-white/5 text-white shadow-inner group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
    <p className="text-xs text-slate-400 line-clamp-2">{subValue}</p>
    <div className="mt-4 flex items-center justify-end">
      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
    </div>
  </motion.div>
);

export default function ReportsPage() {
  const { userRole } = useAppContext();
  const [view, setView] = useState<ReportModule>('hub');
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  const [selectedIsolasiCat, setSelectedIsolasiCat] = useState<IsolasiCategory>('Semua');
  const [realtimeData, setRealtimeData] = useState<Record<string, { value: number, count: number }>>({});
  const supabase = getSupabase();
  
  const [unitFilter, setUnitFilter] = useState('Semua Unit');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [selectedDate, setSelectedDate] = useState(() => {
    try {
      return new Date().toISOString().split('T')[0];
    } catch (e) {
      return new Date().toLocaleDateString('en-CA'); // fallback YYYY-MM-DD
    }
  });
  const [period, setPeriod] = useState('Bulanan');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredIndicators = useMemo(() => {
    let base = [];
    if (view === 'hub') base = [];
    else if (view !== 'isolasi') base = indicators[view] || [];
    else if (selectedIsolasiCat === 'Semua') base = indicators.isolasi || [];
    else base = (indicators.isolasi || []).filter(i => i.category === selectedIsolasiCat);

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      return base.filter(i => i.name.toLowerCase().includes(q));
    }
    return base;
  }, [view, selectedIsolasiCat, debouncedSearch]);

  // Unit Management
  const [units, setUnits] = useState<string[]>(() => {
    const initialUnits = ['IGD', 'ICU', 'IBS', 'Ranap Aisyah', 'Ranap Fatimah', 'Ranap Khadijah', 'Ranap Usman', 'Rawat Jalan', 'Radiologi', 'Laboratorium', 'Farmasi', 'Laundry', 'Pantry'];
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smart_ppi_units');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return initialUnits;
        }
      }
    }
    return initialUnits;
  });
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');

  const safeDateSplit = (date: Date) => {
    try {
      if (isNaN(date.getTime())) throw new Error("Invalid Date");
      return date.toISOString().split('T')[0];
    } catch (e) {
      return new Date().toLocaleDateString('en-CA');
    }
  };

  const dateRange = useMemo(() => {
    const d = new Date(selectedDate);
    const year = d.getFullYear();
    const month = d.getMonth();
    
    if (period === 'Harian') {
       return { from: selectedDate, to: selectedDate };
    } else if (period === 'Bulanan') {
       const first = safeDateSplit(new Date(year, month, 1));
       const last = safeDateSplit(new Date(year, month + 1, 0));
       return { from: first, to: last };
    } else if (period === 'Triwulan') {
       const quarter = Math.floor(month / 3);
       const first = safeDateSplit(new Date(year, quarter * 3, 1));
       const last = safeDateSplit(new Date(year, (quarter + 1) * 3, 0));
       return { from: first, to: last };
    } else if (period === 'Semester') {
       const half = month < 6 ? 0 : 6;
       const first = safeDateSplit(new Date(year, half, 1));
       const last = safeDateSplit(new Date(year, half + 6, 0));
       return { from: first, to: last };
    } else { // Tahunan
       const first = `${year}-01-01`;
       const last = `${year}-12-31`;
       return { from: first, to: last };
    }
  }, [selectedDate, period]);

  const handleAddUnit = () => {
    if (newUnitName.trim() && !units.includes(newUnitName.trim())) {
      const updated = [...units, newUnitName.trim()];
      setUnits(updated);
      localStorage.setItem('smart_ppi_units', JSON.stringify(updated));
      setNewUnitName('');
      setIsAddingUnit(false);
    }
  };

  const activeIndicatorData = useMemo(() => {
    if (!selectedIndicator || view === 'hub') return null;
    return (indicators as any)[view]?.find((i: any) => i.id === selectedIndicator);
  }, [selectedIndicator, view]);

  useEffect(() => {
    if (filteredIndicators.length > 0) {
      if (!selectedIndicator || !filteredIndicators.find(i => i.id === selectedIndicator)) {
        setSelectedIndicator(filteredIndicators[0].id);
      }
    }
  }, [filteredIndicators, selectedIndicator]);

  useEffect(() => {
    const fetchRealtime = async () => {
      if (!filteredIndicators.length || view === 'hub') return;
      
      const tablesMap: Record<string, string> = {
        hh: 'audit_hand_hygiene',
        apd: 'audit_apd',
        dekontaminasi_alat: 'audit_dekontaminasi_alat',
        pengendalian_lingkungan: 'audit_pengendalian_lingkungan',
        limbah_m: 'audit_pengelolaan_limbah_medis',
        limbah_t: 'audit_pengelolaan_limbah_tajam',
        linen: 'audit_penatalaksanaan_linen',
        airborne: 'penempatan_pasien_airbone',
        immuno: 'penempatan_pasien_immunocompromised',
        ppi_ruang_isolasi: 'ppi_ruang_isolasi',
        iadp: 'audit_bundles_hais', cauti: 'audit_bundles_hais', ido_b: 'audit_bundles_hais', vap_b: 'audit_bundles_hais',
        phl: 'surveilans_phlebitis', isk: 'surveilans_isk', vap: 'surveilans_vap', ido: 'surveilans_ido',
        sos: 'kegiatan_diklat', ws: 'kegiatan_diklat', sim: 'kegiatan_diklat'
      };
      
      const results: Record<string, {value: number, count: number}> = {};
      const promises = filteredIndicators.map(async (ind) => {
        const config = genericAuditConfigs[ind.id] || {tableName: tablesMap[ind.id]};
        if (!config.tableName) return;
        
        let query = supabase.from(config.tableName).select('*');
        if (config.extraFilter) query = query.match(config.extraFilter);
        
        const { data, error } = await query;
        if (!error && data) {
           const filtered = data.filter((row: any) => {
        const dtStrStr = String(row.waktu || row.tanggal_waktu || row.created_at || '').split('T')[0];
        const dtStr = dtStrStr === 'undefined' || dtStrStr === 'null' ? '' : dtStrStr;
              if (dateRange && dtStr) {
                 if (dtStr < dateRange.from || dtStr > dateRange.to) return false;
              }
              if (unitFilter !== 'Semua Unit') {
                 const u = row.unit || row.nama_ruangan || row.ruangan;
                 if (u && u !== unitFilter) return false;
              }
              return true;
           });
           
           if (ind.id === 'hh') {
             let n = 0, d = 0;
             filtered.forEach((r: any) => { n += r.patuh || 0; d += r.peluang || 0; });
             results[ind.id] = { value: d > 0 ? (n/d)*100 : 0, count: filtered.length };
           } else if (config.items) {
             let n = 0, d = 0;
             filtered.forEach((r: any) => {
               const chk = r.checklist_json || r.data_indikator || r.checklist_data || r;
               config.items?.forEach((it: any) => {
                 if (chk[it.key] === 'ya') n++;
                 if (chk[it.key] === 'ya' || chk[it.key] === 'tidak') d++;
               });
             });
             results[ind.id] = { value: d > 0 ? (n/d)*100 : 0, count: filtered.length };
           } else {
             results[ind.id] = { value: ind.compliance || ind.rate || 0, count: filtered.length };
           }
        }
      });
      await Promise.all(promises);
      setRealtimeData(results);
    };
    fetchRealtime();
  }, [filteredIndicators, dateRange, unitFilter, supabase, view]);

  const handleBack = () => {
    if (selectedIndicator) setSelectedIndicator(null);
    else setView('hub');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-32 px-4 sm:px-6">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative py-6 z-10 border-b border-white/5">
        <div className="flex items-center gap-4">
          {(view !== 'hub' || selectedIndicator) && (
            <button 
              onClick={handleBack} 
              className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-[28px] sm:text-[34px] font-heading font-bold tracking-tight text-gradient drop-shadow-[0_0_25px_rgba(59,130,246,0.5)] leading-tight">
              Laporan SMART PPI
            </h1>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-blue-400 mt-1 flex items-center gap-2">
              <Building2 className="w-3 h-3" /> UOBK RSUD AL-MULK Kota Sukabumi
            </p>
          </div>
        </div>
        
        {/* Global Export Button */}
        <div className="flex items-center gap-3">
          {/* Status Mutu Removed as per user request */}
          <div className="relative group/export">
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-[#eff4f2] rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all border border-white/10">
              <Download className="w-4 h-4" /> Export Laporan
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-navy-dark border border-white/5 rounded-2xl shadow-2xl overflow-hidden opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all z-[100]">
              <button className="w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white flex items-center gap-2">
                <FileIcon className="w-3.5 h-3.5 text-red-400" /> Export PDF
              </button>
              <button className="w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" /> Export Excel
              </button>
              <button className="w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-blue-300" /> Export Word
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Global Filters */}
      <div className="glass-card p-6 sm:p-8 rounded-[2rem] border-white/5 shadow-2xl relative overflow-visible">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none rounded-[2rem]" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 w-full mb-6">
          {/* Tanggal */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Calendar className="w-3 h-3 text-blue-400" /> Pilih Tanggal
            </label>
            <div className="flex items-center gap-3 bg-white/5 hover:bg-white/10 focus-within:border-blue-500/50 rounded-xl border border-white/5 px-4 h-12 text-white transition-all shadow-inner group">
              <input 
                type="date" 
                value={selectedDate} 
                onChange={e => setSelectedDate(e.target.value)} 
                className="bg-transparent text-sm w-full outline-none focus:text-blue-400 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[0.6] cursor-pointer" 
              />
            </div>
          </div>

          {/* Periode */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Clock className="w-3 h-3 text-purple-400" /> Periode Laporan
            </label>
            <div className="relative group">
              <select 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-5 pr-10 h-12 text-sm text-white outline-none focus:border-blue-500/50 appearance-none hover:bg-white/10 transition-all cursor-pointer shadow-inner"
              >
                {['Harian', 'Bulanan', 'Triwulan', 'Semester', 'Tahunan'].map(p => <option key={p} value={p} className="bg-[#0f172a] text-white">{p}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500 group-hover:text-blue-400 transition-colors">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Building2 className="w-3 h-3 text-emerald-400" /> Filter Unit
              </label>
              {(userRole === 'IPCN' || userRole === 'Admin') && (
                <button 
                  onClick={() => setIsAddingUnit(true)}
                  className="text-[9px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest flex items-center gap-1 transition-colors"
                >
                  <PlusCircle className="w-3 h-3" /> Tambah
                </button>
              )}
            </div>
            <div className="relative group">
              <select 
                value={unitFilter} 
                onChange={(e) => setUnitFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-5 pr-10 h-12 text-sm text-white outline-none focus:border-blue-500/50 appearance-none hover:bg-white/10 transition-all cursor-pointer shadow-inner"
              >
                <option value="Semua Unit" className="bg-[#0f172a] text-white">Semua Unit</option>
                {units.map(u => <option key={u} value={u} className="bg-[#0f172a] text-white">{u}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500 group-hover:text-blue-400 transition-colors">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Add Unit Field for IPCN */}
        <AnimatePresence>
          {isAddingUnit && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <input 
                  type="text" 
                  placeholder="Nama Unit Baru..." 
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 h-11 text-sm text-white focus:border-blue-500/50 outline-none"
                  autoFocus
                />
                <button 
                  onClick={handleAddUnit}
                  className="px-6 h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" /> Simpan Unit
                </button>
                <button 
                  onClick={() => setIsAddingUnit(false)}
                  className="p-3 hover:bg-white/5 text-slate-500 hover:text-white rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 px-4 h-12 w-full md:w-1/3 focus-within:border-blue-500/50 transition-all group relative z-10 shadow-inner">
          <Search className="w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors shrink-0" />
          <input 
            type="text" 
            placeholder="Cari indikator..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Top Summary Dashboard (Global) Removed as per user request */}


      <AnimatePresence mode="wait">
        {/* --- HUB VIEW --- */}
        {view === 'hub' && (
          <motion.div 
            key="hub-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="space-y-8"
          >
            {/* Main Category Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Kewaspadaan Isolasi" 
                value="88.4%"
                subValue="Hand Hygiene, APD, Etika Batuk, Penempatan Pasien, dll."
                icon={ShieldCheck}
                color="from-blue-500 to-blue-600"
                onClick={() => setView('isolasi')}
              />
              <StatCard 
                title="Surveilans HAIs" 
                value="2.1‰"
                subValue="Phlebitis, ISK, VAP, IDO (Rate per 1000 Hari Rawat)"
                icon={Activity}
                color="from-rose-500 to-rose-600"
                onClick={() => setView('surveilans')}
              />
              <StatCard 
                title="Monitoring Bundles" 
                value="91.2%"
                subValue="Bundles IADP, CAUTI, VAP, dan IDO."
                icon={ClipboardCheck}
                color="from-purple-500 to-purple-600"
                onClick={() => setView('bundles')}
              />
              <StatCard 
                title="Pendidikan & Pelatihan" 
                value="12 Sesi"
                subValue="Sosialisasi PPI, Workshop Hand Hygiene, Pelatihan Staff."
                icon={GraduationCap}
                color="from-emerald-500 to-emerald-600"
                onClick={() => setView('diklat')}
              />
            </div>

            {/* Hub Insights Removed as per user request */}

          </motion.div>
        )}

        {/* --- DETAIL VIEW --- */}
        {view !== 'hub' && (
          <motion.div 
            key="detail-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Kewaspadaan Isolasi Dropdown Categories */}
            {view === 'isolasi' && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/5 p-6 rounded-3xl border border-white/5">
                <div>
                   <h3 className="text-xl font-heading font-black text-white">Kewaspadaan Isolasi</h3>
                   <p className="text-xs text-slate-400">Pilih kategori untuk memfilter indikator</p>
                </div>
                <div className="relative group w-full sm:w-64">
                   <select 
                     value={selectedIsolasiCat}
                     onChange={(e) => setSelectedIsolasiCat(e.target.value as any)}
                     className="w-full bg-navy border border-white/5 rounded-2xl px-5 py-3 h-14 text-sm font-bold text-white outline-none focus:border-blue-500/50 appearance-none transition-all group-hover:bg-white/8 cursor-pointer pr-12"
                   >
                     {['Semua', 'Standar', 'Transmisi', 'Monitoring'].map(cat => (
                       <option key={cat} value={cat} className="bg-navy-dark">{cat}</option>
                     ))}
                   </select>
                   <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-blue-400 transition-colors">
                     <ChevronDown className="w-5 h-5" />
                   </div>
                </div>
              </div>
            )}

            {/* Indicators Premium Carousel Slider */}
            <div className="relative w-full overflow-hidden py-10 group/slider" id="indicator-carousel">
               {/* Left Arrow */}
               <button 
                  onClick={() => {
                     const container = document.getElementById('carousel-scroll-container');
                     if (container) container.scrollBy({ left: -400, behavior: 'smooth' });
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full bg-slate-900/80 text-white border border-white/10 shadow-2xl backdrop-blur-md opacity-0 group-hover/slider:opacity-100 transition-opacity hidden sm:flex hover:bg-slate-800"
               >
                  <ArrowLeft className="w-6 h-6" />
               </button>

               {/* Right Arrow */}
               <button 
                  onClick={() => {
                     const container = document.getElementById('carousel-scroll-container');
                     if (container) container.scrollBy({ left: 400, behavior: 'smooth' });
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full bg-slate-900/80 text-white border border-white/10 shadow-2xl backdrop-blur-md opacity-0 group-hover/slider:opacity-100 transition-opacity hidden sm:flex hover:bg-slate-800"
               >
                  <ChevronRight className="w-6 h-6" />
               </button>

               {/* Mobile/Desktop Carousel instructions */}
               <div id="carousel-scroll-container" className="flex gap-4 overflow-x-auto pb-12 pt-4 px-[10vw] sm:px-[20vw] lg:px-[30vw] snap-x snap-mandatory hide-scrollbar style-carousel" style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                 {filteredIndicators.map((ind: any, idx: number) => {
                   
                   // Realtime computation fallback
                   const rt = realtimeData[ind.id];
                   const currentValue = rt && rt.count > 0 ? Number(rt.value.toFixed(1)) : (ind.compliance !== undefined ? ind.compliance : ind.rate);
                   
                   let statusColor = 'text-blue-400';
                   let statusBg = 'bg-blue-400/10 border-blue-400/20';
                   let badgeText = 'Belum Dinilai';
                   let badgeIcon = <Info className="w-3.5 h-3.5" />;
                   
                   if (ind.compliance !== undefined || (rt && rt.count > 0)) {
                     const std = ind.standard || 85;
                     if (currentValue >= std) {
                        statusColor = 'text-emerald-400';
                        statusBg = 'bg-emerald-500/10 border-emerald-500/20';
                        badgeText = '✓ Tercapai';
                     } else if (currentValue >= std - 10) {
                        statusColor = 'text-amber-400';
                        statusBg = 'bg-amber-500/10 border-amber-500/20';
                        badgeText = '⚠ Mendekati';
                     } else {
                        statusColor = 'text-rose-400';
                        statusBg = 'bg-rose-500/10 border-rose-500/20';
                        badgeText = '⚠ Belum Tercapai';
                     }
                   } else if (ind.rate !== undefined) {
                     const std = ind.standard || 5;
                     if (currentValue <= std) {
                        statusColor = 'text-emerald-400';
                        statusBg = 'bg-emerald-500/10 border-emerald-500/20';
                        badgeText = '✓ Aman';
                     } else if (currentValue <= std + 2) {
                        statusColor = 'text-amber-400';
                        statusBg = 'bg-amber-500/10 border-amber-500/20';
                        badgeText = '⚠ Waspada';
                     } else {
                        statusColor = 'text-rose-400';
                        statusBg = 'bg-rose-500/10 border-rose-500/20';
                        badgeText = '⚠ Bahaya';
                     }
                   }

                   const isActive = selectedIndicator === ind.id;

                   return (
                     <motion.button
                       key={ind.id}
                       onClick={(e) => {
                          setSelectedIndicator(ind.id);
                          e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                       }}
                       whileHover={{ scale: isActive ? 1.05 : 1 }}
                       animate={{ 
                         scale: isActive ? 1.05 : 0.95, 
                         opacity: isActive ? 1 : 0.7,
                         filter: 'blur(0px)'
                       }}
                       transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                       className={`flex flex-col justify-between w-[80vw] sm:w-[50vw] lg:w-[35vw] max-w-[450px] snap-center p-8 rounded-[2.5rem] border transition-all shrink-0 text-left relative overflow-hidden group/card shadow-2xl ${
                         isActive 
                         ? 'bg-[#f8f8f8] dark:bg-[#f8f8f8] border-blue-500/50 shadow-[0_20px_50px_rgba(59,130,246,0.3)] z-20' 
                         : 'bg-[#f8f8f8] dark:bg-[#f8f8f8] border-slate-200 dark:border-white/10 z-10'
                       }`}
                     >
                       {/* Glassmorphism Glow for Active */}
                       {isActive && <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full pointer-events-none -mr-16 -mt-16 bg-blue-500/10 opacity-100" />}

                       <div className="space-y-8 relative z-10 w-full mb-6 mt-2">
                         <div className="flex items-center gap-5">
                            <div className={`p-4 rounded-[1.5rem] shrink-0 transition-all shadow-lg ${isActive ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700'}`}>
                               {ind.icon && <ind.icon className="w-8 h-8" />}
                            </div>
                            <div className="min-w-0 pr-4">
                              <h4 className={`text-xl sm:text-2xl font-black leading-tight tracking-tight text-[#060505] dark:text-[#060505]`}>
                                {ind.name}
                              </h4>
                            </div>
                         </div>

                         <div className="flex flex-col gap-5 pt-4">
                           {/* Status Badge */}
                           <div className={`self-start px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm ${statusBg} ${statusColor}`}>
                             {badgeText}
                           </div>

                           <div className="flex items-end justify-between border-t border-slate-200 dark:border-white/10 pt-5">
                             <div className="space-y-1">
                               <div className="flex items-center gap-2 mb-1">
                                  {isActive && <div className={`w-2 h-2 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] ${statusColor.replace('text-', 'bg-')}`} />}
                                  <span className={`text-[10px] font-black uppercase tracking-widest text-[#060505]`}>Realtime Capaian</span>
                               </div>
                               <div className="flex items-baseline gap-1">
                                 <p className={`text-5xl sm:text-6xl font-black font-heading tracking-tighter leading-none text-[#c8d706]`}>
                                    {currentValue}
                                 </p>
                                 <span className={`text-xl font-black text-[#c9ef05] opacity-70`}>{ind.type || '%'}</span>
                               </div>
                             </div>
                             
                             <div className="text-right">
                                <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 text-[#070707]`}>Target Mutu</p>
                                <div className={`px-4 py-2 rounded-xl border font-black text-sm tracking-tight text-[#0d0c0c] ${isActive ? 'bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/20 shadow-sm' : 'bg-transparent border-slate-300 dark:border-slate-700'}`}>
                                  ≥ {ind.standard}{ind.type || '%'}
                                </div>
                             </div>
                           </div>
                         </div>
                       </div>
                     </motion.button>
                   );
                 })}
               </div>

               {/* Indicator Dots */}
               <div className="flex justify-center gap-2 mt-4 absolute bottom-0 w-full left-0">
                 {filteredIndicators.map((ind: any) => (
                   <div 
                     key={ind.id} 
                     className={`h-1.5 rounded-full transition-all duration-300 ${selectedIndicator === ind.id ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700'}`}
                   />
                 ))}
               </div>
            </div>

            {selectedIndicator && activeIndicatorData ? (
              selectedIndicator === 'hh' ? (
                <HandHygieneReport 
                  filters={{ dateRange, unitFilter, searchQuery }} 
                />
              ) : selectedIndicator === 'apd' ? (
                <ApdReport 
                  filters={{ dateRange, unitFilter, searchQuery }} 
                />
              ) : selectedIndicator === 'dekontaminasi_alat' ? (
                <DekontaminasiAlatReport 
                  filters={{ dateRange, unitFilter, searchQuery }} 
                />
              ) : genericAuditConfigs[selectedIndicator] ? (
                <GenericAuditReport 
                  filters={{ dateRange, unitFilter, searchQuery }}
                  tableName={genericAuditConfigs[selectedIndicator].tableName}
                  indicatorItems={genericAuditConfigs[selectedIndicator].items}
                  title={activeIndicatorData.name}
                  extraFilter={(genericAuditConfigs[selectedIndicator] as any).extraFilter}
                />
              ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                {/* Summary Gauges Removed as per user request */}

                {/* B. Data Table Indicator */}
                <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl">
                  <div className="p-8 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Tabel Data Raw</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest underline decoration-blue-500 underline-offset-4">Showing all audit data entries</p>
                    </div>
                    <div className="flex gap-3">
                      <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all"><Filter className="w-4 h-4" /></button>
                      <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all">
                        <Download className="w-3.5 h-3.5" /> XLS
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left border-collapse">
                      <thead>
                        <tr className="bg-white/2 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-white/5">
                          <th className="px-8 py-5">No</th>
                          <th className="px-6 py-5">Tanggal</th>
                          <th className="px-6 py-5">Unit / Ruangan</th>
                          <th className="px-6 py-5">Petugas / Observer</th>
                          <th className="px-6 py-5">Status / Skor</th>
                          <th className="px-8 py-5 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/2 text-xs">
                        {[1, 2, 3, 4, 5].map((idx) => (
                          <tr key={idx} className="hover:bg-white/2 transition-colors cursor-pointer group">
                            <td className="px-8 py-5 text-slate-500 font-mono">{idx}</td>
                            <td className="px-6 py-5 font-bold text-slate-300">20/04/2026</td>
                            <td className="px-6 py-5">
                              <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-slate-400 uppercase tracking-widest text-[9px]">IGD - Emergensi</span>
                            </td>
                            <td className="px-6 py-5 flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">A</div>
                              <span className="text-slate-300">Adi Tresa Purnama</span>
                            </td>
                            <td className="px-6 py-5">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${idx % 2 === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                {idx % 2 === 0 ? 'Compliant' : 'Needs Fix'}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <button className="p-2 text-slate-600 hover:text-white transition-colors"><MoreVertical className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-6 bg-white/2 flex items-center justify-between border-t border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Showing 5 of 124 results</p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all disabled:opacity-30" disabled>Prev</button>
                      <button className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-white hover:bg-blue-600/20 transition-all">Next</button>
                    </div>
                  </div>
                </div>

                {/* Additional Insights Removed as per user request */}
              </div>
              )
            ) : (
              <div className="h-64 glass-card p-8 rounded-[2.5rem] border-white/5 border-dashed flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-4">
                  <Activity className="w-8 h-8 text-blue-500/40" />
                </div>
                <h3 className="text-lg font-bold text-slate-400 mb-2">Pilih Indikator Terlebih Dahulu</h3>
                <p className="text-xs text-slate-600 max-w-sm">Klik salah satu kartu indikator di atas untuk melihat detail laporan, grafik capaian, dan tabel data raw.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 11. Final Action / Info */}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .glass-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .text-gradient {
          background: linear-gradient(to right, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
}
