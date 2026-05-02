-- =========================================================================
-- KONFIGURASI DATABASE SUPABASE - SMART PPI
-- Copy seluruh script ini dan jalankan di menu "SQL Editor" pada dashboard Supabase Anda
-- =========================================================================

-- 1. Tabel APD
CREATE TABLE IF NOT EXISTS audit_apd (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    profesi TEXT,
    tindakan TEXT,
    masker TEXT,
    sarung_tangan TEXT,
    penutup_kepala TEXT,
    apron TEXT,
    goggle TEXT,
    sepatu_boot TEXT,
    gaun_pelindung TEXT,
    jumlah_dinilai INTEGER,
    jumlah_patuh INTEGER,
    persentase INTEGER,
    status_kepatuhan TEXT,
    dokumentasi JSONB
);

-- 2. Tabel Hand Hygiene
CREATE TABLE IF NOT EXISTS audit_hand_hygiene (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    profesi TEXT,
    m1 TEXT,
    m2 TEXT,
    m3 TEXT,
    m4 TEXT,
    m5 TEXT,
    patuh INTEGER,
    peluang INTEGER,
    persentase INTEGER
);

-- 3. Tabel Dekontaminasi Alat
CREATE TABLE IF NOT EXISTS audit_dekontaminasi_alat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    data_indikator JSONB,
    jumlah_dinilai INTEGER,
    jumlah_patuh INTEGER,
    persentase INTEGER,
    status_kepatuhan TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

-- 4. Tabel Pengelolaan Limbah Medis
CREATE TABLE IF NOT EXISTS audit_pengelolaan_limbah_medis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    data_indikator JSONB,
    jumlah_dinilai INTEGER,
    jumlah_patuh INTEGER,
    persentase INTEGER,
    status_kepatuhan TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

-- 5. Tabel Pengelolaan Limbah Tajam
CREATE TABLE IF NOT EXISTS audit_pengelolaan_limbah_tajam (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    data_indikator JSONB,
    jumlah_dinilai INTEGER,
    jumlah_patuh INTEGER,
    persentase INTEGER,
    status_kepatuhan TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

-- 6. Tabel Penatalaksanaan Linen
CREATE TABLE IF NOT EXISTS audit_penatalaksanaan_linen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    data_indikator JSONB,
    jumlah_dinilai INTEGER,
    jumlah_patuh INTEGER,
    persentase INTEGER,
    status_kepatuhan TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

-- 7. Tabel Etika Batuk
CREATE TABLE IF NOT EXISTS audit_etika_batuk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    materi_edukasi JSONB,
    sasaran_edukasi JSONB,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

-- 8. Tabel Pengendalian Lingkungan
CREATE TABLE IF NOT EXISTS audit_pengendalian_lingkungan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    data_indikator JSONB,
    jumlah_dinilai INTEGER,
    jumlah_patuh INTEGER,
    persentase INTEGER,
    status_kepatuhan TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

-- 9. Tabel Penempatan Pasien
CREATE TABLE IF NOT EXISTS audit_penempatan_pasien (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    ceklist JSONB,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    foto JSONB
);

-- 10. Tabel Penyuntikan Aman
CREATE TABLE IF NOT EXISTS audit_penyuntikan_aman (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    profesi TEXT,
    jenis_tindakan TEXT,
    data_indikator JSONB,
    persentase INTEGER,
    status_kepatuhan TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

-- 11. Tabel Perlindungan Petugas
CREATE TABLE IF NOT EXISTS audit_perlindungan_petugas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    data_indikator JSONB,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT
);

-- 12. Tabel Farmasi
CREATE TABLE IF NOT EXISTS audit_farmasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    waktu TIMESTAMPTZ,
    supervisor TEXT,
    checklist_json JSONB,
    persentase INTEGER,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj TEXT,
    ttd_ipcn TEXT,
    foto JSONB
);

-- 13. Tabel Ruangan IBS
CREATE TABLE IF NOT EXISTS audit_ruangan_ibs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    waktu TIMESTAMPTZ,
    supervisor TEXT,
    checklist_json JSONB,
    persentase INTEGER,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj TEXT,
    ttd_ipcn TEXT,
    foto JSONB
);

-- 13.b Tabel Ambulance
CREATE TABLE IF NOT EXISTS audit_ambulance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    waktu TIMESTAMPTZ,
    ruangan TEXT,
    supervisor TEXT,
    checklist_json JSONB,
    keterangan_json JSONB,
    persentase INTEGER,
    status TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    dokumentasi JSONB,
    nama_pj TEXT,
    ttd_pj TEXT,
    ttd_ipcn TEXT
);

-- 13.c Tabel Ruang Tunggu
CREATE TABLE IF NOT EXISTS audit_ruang_tunggu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    waktu TIMESTAMPTZ,
    ruangan TEXT,
    supervisor TEXT,
    checklist_json JSONB,
    keterangan_json JSONB,
    persentase INTEGER,
    status TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    dokumentasi JSONB,
    nama_pj TEXT,
    ttd_pj TEXT,
    ttd_ipcn TEXT
);

-- 14. Tabel Monitoring Ruang Isolasi
CREATE TABLE IF NOT EXISTS audit_monitoring_ppi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    data_indikator JSONB,
    compliance_score INTEGER,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    kategori TEXT,
    dokumentasi JSONB
);

-- 15. Tabel Monitoring Fasilitas APD & HH
CREATE TABLE IF NOT EXISTS monitoring_fasilitas_apd (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    data_indikator JSONB,
    dinilai INTEGER,
    patuh INTEGER,
    persentase INTEGER,
    status_kepatuhan TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

CREATE TABLE IF NOT EXISTS monitoring_fasilitas_hand_hygiene (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    data_indikator JSONB,
    dinilai INTEGER,
    patuh INTEGER,
    persentase INTEGER,
    status_kepatuhan TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

-- 16. Tabel Bundles HAIS
CREATE TABLE IF NOT EXISTS audit_bundles_hais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    bundle_id TEXT,
    tanggal_waktu TIMESTAMPTZ,
    unit TEXT,
    petugas_pemasang TEXT,
    nama_pasien TEXT,
    no_rm TEXT,
    checklist_data JSONB,
    compliance_score INTEGER,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

-- 17. Penempatan Pasien Airborne
CREATE TABLE IF NOT EXISTS supervisors_airborne (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS penempatan_pasien_airbone (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    waktu TIMESTAMPTZ,
    ruangan TEXT,
    supervisor TEXT,
    checklist_json JSONB,
    persentase INTEGER,
    temuan TEXT,
    rekomendasi TEXT,
    foto JSONB,
    ttd_pj TEXT,
    ttd_ipcn TEXT
);

-- 18. Tabel Dashboard Slider
CREATE TABLE IF NOT EXISTS dashboard_slider (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT,
    subtitle TEXT,
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    sort_order INTEGER
);

-- 19. Tabel Dashboard Standards
CREATE TABLE IF NOT EXISTS dashboard_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    indikator TEXT UNIQUE,
    nilai_standar NUMERIC,
    operator TEXT CHECK (operator IN ('>=', '<='))
);

-- =========================================================================
-- MEMATIKAN SELLER SEMUA BLOKIRAN RLS KODE (MENGIZINKAN INSERT & SELECT SECARA UMUM)
-- Supaya data input dari aplikasi tidak terkena error "Row-Level Security / Forbidden"
-- =========================================================================

-- Menonaktifkan wajib RLS untuk mencegah masalah akses secara instan
ALTER TABLE audit_apd DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_hand_hygiene DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_dekontaminasi_alat DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_pengelolaan_limbah_medis DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_pengelolaan_limbah_tajam DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_penatalaksanaan_linen DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_etika_batuk DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_pengendalian_lingkungan DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_penempatan_pasien DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_penyuntikan_aman DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_perlindungan_petugas DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_farmasi DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_ruangan_ibs DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_monitoring_ppi DISABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_fasilitas_apd DISABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_fasilitas_hand_hygiene DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_bundles_hais DISABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors_airborne DISABLE ROW LEVEL SECURITY;
ALTER TABLE penempatan_pasien_airbone DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_slider DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_standards DISABLE ROW LEVEL SECURITY;

-- =========================================================================
-- MEMBUAT BUCKET PENYIMPANAN FOTO/DOKUMENTASI JIKA BELUM ADA
-- =========================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dokumentasi', 'dokumentasi', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('public', 'public', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Give public access to dokumentasi" ON storage.objects;
CREATE POLICY "Give public access to dokumentasi" ON storage.objects FOR ALL USING (bucket_id = 'dokumentasi');

DROP POLICY IF EXISTS "Give public access to public" ON storage.objects;
CREATE POLICY "Give public access to public" ON storage.objects FOR ALL USING (bucket_id = 'public');
