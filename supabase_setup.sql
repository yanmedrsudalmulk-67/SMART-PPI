-- BUKA MENU SQL EDITOR DI DASHBOARD SUPABASE ANDA, KEMUDIAN JALANKAN SCRIPT INI.

-- 1. Berikan Akses Publik untuk Bucket Storage (Logo & Dokumentasi)
-- Jalankan ini jika Anda mendapatkan error "Access Denied" saat upload logo/foto
DO $$ 
BEGIN
    -- Bucket Logos
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'logos') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
    END IF;
    
    -- Bucket Audit Images
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'audit_images') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('audit_images', 'audit_images', true);
    END IF;

    -- Policy untuk Logos
    DROP POLICY IF EXISTS "Public Uploads on Logos" ON storage.objects;
    DROP POLICY IF EXISTS "Public Update on Logos" ON storage.objects;
    DROP POLICY IF EXISTS "Public Select on Logos" ON storage.objects;
    
    CREATE POLICY "Public Uploads on Logos" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'logos');
    CREATE POLICY "Public Update on Logos" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'logos');
    CREATE POLICY "Public Select on Logos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'logos');

    -- Policy untuk Audit Images
    DROP POLICY IF EXISTS "Public Uploads on Audit Images" ON storage.objects;
    DROP POLICY IF EXISTS "Public Select on Audit Images" ON storage.objects;
    
    CREATE POLICY "Public Uploads on Audit Images" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'audit_images');
    CREATE POLICY "Public Select on Audit Images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'audit_images');

END $$;

-- 2. Buat tabel utama buat aplikasi jika belum ada
CREATE TABLE IF NOT EXISTS public.master_observers (
  id uuid default gen_random_uuid() primary key,
  nama text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Audit Indikator
CREATE TABLE IF NOT EXISTS public.audit_hand_hygiene (
  id uuid default gen_random_uuid() primary key,
  observer text,
  unit text,
  profesi text,
  m1 text, m2 text, m3 text, m4 text, m5 text,
  patuh int,
  peluang int,
  persentase int,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_apd (
  id uuid default gen_random_uuid() primary key,
  tanggal_waktu timestamp with time zone,
  observer text,
  unit text,
  profesi text,
  tindakan text,
  masker text,
  sarung_tangan text,
  penutup_kepala text,
  apron text,
  goggle text,
  sepatu_boot text,
  gaun_pelindung text,
  jumlah_dinilai int,
  jumlah_patuh int,
  persentase int,
  status_kepatuhan text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_dekontaminasi_alat (
  id uuid default gen_random_uuid() primary key,
  tanggal_waktu timestamp with time zone,
  observer text,
  unit text,
  data_indikator jsonb,
  jumlah_dinilai int,
  jumlah_patuh int,
  persentase int,
  status_kepatuhan text,
  temuan text,
  rekomendasi text,
  ttd_pj_ruangan text,
  ttd_ipcn text,
  dokumentasi text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_pengendalian_lingkungan (
  id uuid default gen_random_uuid() primary key,
  tanggal_waktu timestamp with time zone,
  observer text,
  unit text,
  data_indikator jsonb,
  jumlah_dinilai int,
  jumlah_patuh int,
  persentase int,
  status_kepatuhan text,
  temuan text,
  rekomendasi text,
  ttd_pj_ruangan text,
  ttd_ipcn text,
  dokumentasi text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_pengelolaan_limbah_medis (
  id uuid default gen_random_uuid() primary key,
  tanggal_waktu timestamp with time zone,
  observer text,
  unit text,
  data_indikator jsonb,
  jumlah_dinilai int,
  jumlah_patuh int,
  persentase int,
  status_kepatuhan text,
  temuan text,
  rekomendasi text,
  ttd_pj_ruangan text,
  ttd_ipcn text,
  dokumentasi text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_pengelolaan_limbah_tajam (
  id uuid default gen_random_uuid() primary key,
  tanggal_waktu timestamp with time zone,
  observer text,
  unit text,
  data_indikator jsonb,
  jumlah_dinilai int,
  jumlah_patuh int,
  persentase int,
  status_kepatuhan text,
  temuan text,
  rekomendasi text,
  ttd_pj_ruangan text,
  ttd_ipcn text,
  dokumentasi text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_penatalaksanaan_linen (
  id uuid default gen_random_uuid() primary key,
  tanggal_waktu timestamp with time zone,
  observer text,
  unit text,
  data_indikator jsonb,
  jumlah_dinilai int,
  jumlah_patuh int,
  persentase int,
  status_kepatuhan text,
  temuan text,
  rekomendasi text,
  ttd_pj_ruangan text,
  ttd_ipcn text,
  dokumentasi text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Matikan RLS agar publik bisa input data tanpa login (Sesuai Kebutuhan Aplikasi)
ALTER TABLE IF EXISTS "public"."audit_hand_hygiene" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."audit_apd" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."audit_dekontaminasi_alat" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."audit_pengendalian_lingkungan" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."audit_pengelolaan_limbah_medis" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."audit_pengelolaan_limbah_tajam" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."audit_penatalaksanaan_linen" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."master_observers" DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.audit_farmasi (
  id uuid default gen_random_uuid() primary key,
  waktu timestamp with time zone,
  supervisor text,
  checklist_json jsonb,
  persentase int,
  temuan text,
  rekomendasi text,
  ttd_pj text,
  ttd_ipcn text,
  foto text[],
  created_at timestamp with time zone default timezone('utc'::text, now())
);
ALTER TABLE IF EXISTS "public"."audit_farmasi" DISABLE ROW LEVEL SECURITY;

-- 4. Insert data awal observers jika tabel masih kosong
INSERT INTO public.master_observers (nama)
SELECT name FROM unnest(ARRAY[
  'IPCN_Adi Tresa Purnama',
  'IPCLN_Syefira Salsabila',
  'IPCLN_Siti Hapsoh Roditubillah',
  'IPCLN_Ria Meliani',
  'IPCLN_Ema Mahmudah',
  'IPCLN_Putri Audia',
  'IPCLN_Seli Marselina',
  'IPCLN_Rahmat Hidayat',
  'IPCLN_Rickha Ilnia'
]) AS name
WHERE NOT EXISTS (SELECT 1 FROM public.master_observers LIMIT 1);

-- 5. Refresh Schema Cache
NOTIFY pgrst, 'reload schema';

CREATE TABLE IF NOT EXISTS public.audit_tps (
  id uuid default gen_random_uuid() primary key,
  waktu timestamp with time zone,
  ruangan text,
  supervisor text,
  checklist_json jsonb,
  keterangan_json jsonb,
  persentase numeric,
  status text,
  temuan text,
  rekomendasi text,
  dokumentasi text[],
  nama_pj text,
  ttd_pj text,
  ttd_ipcn text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
ALTER TABLE IF EXISTS "public"."audit_tps" DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.supervisors_tps (
  id uuid default gen_random_uuid() primary key,
  nama text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
ALTER TABLE IF EXISTS "public"."supervisors_tps" DISABLE ROW LEVEL SECURITY;

INSERT INTO public.supervisors_tps (nama)
SELECT name FROM unnest(ARRAY[
  'IPCN_Adi Tresa Purnama'
]) AS name
WHERE NOT EXISTS (SELECT 1 FROM public.supervisors_tps LIMIT 1);
