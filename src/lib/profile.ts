import type { User } from '@supabase/supabase-js';

/**
 * Profile fields live in the Supabase auth user's metadata
 * (auth.users.raw_user_meta_data), set at sign-up or via the name prompt.
 */
export interface ProfileFields {
  first_name: string;
  last_name?: string;
  marketing_opt_in: boolean;
  marketing_opt_in_at: string | null;
}

export function firstNameOf(user: User | null | undefined): string {
  const meta = user?.user_metadata || {};
  const name = typeof meta.first_name === 'string' ? meta.first_name
    : typeof meta.display_name === 'string' ? meta.display_name : '';
  return name.trim();
}

export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, 40);
}

export function profileFields(first: string, last: string, optIn: boolean): ProfileFields {
  return {
    first_name: cleanName(first),
    ...(cleanName(last) ? { last_name: cleanName(last) } : {}),
    marketing_opt_in: optIn,
    marketing_opt_in_at: optIn ? new Date().toISOString() : null,
  };
}
