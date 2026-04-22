import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fkycaekjwdcbfyengmco.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZreWNhZWtqd2RjYmZ5ZW5nbWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MTA2NjksImV4cCI6MjA5MTk4NjY2OX0.WIhgqt4XhidUZFOT31P7Jiwlf6P40ubpBczJL_usLC8';

    if (!supabaseUrl || !supabaseUrl.startsWith('http') || supabaseUrl.includes('dummy')) {
      throw new Error('Konfigurasi URL Supabase (NEXT_PUBLIC_SUPABASE_URL) belum diatur di Environment Variables/Secrets.');
    }

    if (!supabaseAnonKey || supabaseAnonKey === 'placeholder_anon_key' || supabaseAnonKey.includes('dummy')) {
      throw new Error('Konfigurasi Kunci Anon Supabase (NEXT_PUBLIC_SUPABASE_ANON_KEY) belum diatur di Environment Variables/Secrets.');
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

