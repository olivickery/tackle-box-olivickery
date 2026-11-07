import { createClient, type User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Verifies the `Authorization: Bearer <access_token>` header against Supabase Auth.
 * Returns the user, or a 401 response to send back as-is.
 */
export async function requireUser(
  req: Request
): Promise<{ user: User; response?: never } | { user?: never; response: NextResponse }> {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token || !supabaseUrl || !supabaseAnonKey) {
    return { response: NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 }) };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { response: NextResponse.json({ success: false, error: 'Session expired, sign in again' }, { status: 401 }) };
  }
  return { user: data.user };
}

/** Public URL prefix for a user's own folder in the images bucket. */
export function userImagePrefix(userId: string) {
  return `${supabaseUrl}/storage/v1/object/public/tackle-vault-images/${userId}/`;
}
