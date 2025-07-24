
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types';

export const isSupabaseConfigured = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return url && url !== 'YOUR_SUPABASE_URL' && key && key !== 'YOUR_SUPABASE_ANON_KEY';
}

export const supabase = isSupabaseConfigured() 
  ? createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  : null;

// This type can be used in components to get both auth and profile info
export type UserDetails = Database['public']['Tables']['users']['Row'];
