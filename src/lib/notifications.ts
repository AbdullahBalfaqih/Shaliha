
'use server';

import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase/database.types';

type NotificationPayload = Omit<Database['public']['Tables']['notifications']['Insert'], 'id' | 'created_at' | 'is_read'>;

const isSupabaseConfigured = () => {
    return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};

const createSupabaseServerClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase credentials are not configured.");
    }
    return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

export async function createNotification(payload: NotificationPayload) {
    if (!isSupabaseConfigured()) {
        console.error("Supabase client is not available. Notification not created.");
        return;
    }
    const supabase = createSupabaseServerClient();

    const { error } = await supabase.from('notifications').insert(payload);
    if (error) {
        console.error("Error creating notification:", error);
    }
}
