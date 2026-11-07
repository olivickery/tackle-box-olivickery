import { createClient } from '@supabase/supabase-js';

/**
 * Supabase expects the bare project URL (https://<ref>.supabase.co).
 * Strip a pasted REST path such as "/rest/v1/" and trailing slashes so that
 * auth (/auth/v1) and storage (/storage/v1) endpoints resolve correctly.
 */
export function normalizeSupabaseUrl(raw: string | undefined) {
  return (raw || '').trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
