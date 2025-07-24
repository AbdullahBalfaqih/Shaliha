
'use server';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { createNotification } from '@/lib/notifications';

type BookingInsert = Database['public']['Tables']['bookings']['Insert'];

const createSupabaseServerClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase credentials are not configured.");
    }
    return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

const isSupabaseConfigured = () => {
    return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};


export async function createBooking(bookingData: Omit<BookingInsert, 'guest_id' | 'status' | 'type'>, userId: string, propertyTitle: string, guestName: string) {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured.' };
    const supabase = createSupabaseServerClient();

    if (!userId) {
        return { success: false, error: 'User not authenticated' };
    }
    
    // In a real app, you would handle file uploads to Supabase Storage and get the URL.
    // For now, we'll assume paymentProofUrl is passed if available, but it's nullable.
    const { error } = await supabase.from('bookings').insert({
        ...bookingData,
        guest_id: userId,
        status: 'pending', // Bookings start as pending until host confirms
        type: 'platform',
    });

    if (error) {
        console.error('Error creating booking:', error);
        return { success: false, error: error.message };
    }

    // Create notifications after successful booking
    // Notify host
    await createNotification({
        user_id: bookingData.host_id!,
        title: 'حجز جديد!',
        message: `لديك طلب حجز جديد لعقار "${propertyTitle}" من ${guestName}.`,
        link: '/host/dashboard?tab=bookings'
    });

    // Notify customer
    await createNotification({
        user_id: userId,
        title: 'تم إرسال طلب الحجز',
        message: `تم إرسال طلب حجزك لعقار "${propertyTitle}" بنجاح. بانتظار تأكيد المضيف.`,
        link: '/dashboard?tab=bookings'
    });


    return { success: true };
}

export async function getPropertyForPayment(propertyId: string) {
    if (!isSupabaseConfigured()) return null;
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
        .from('properties')
        .select(`
            id,
            title,
            location,
            images,
            price_per_night,
            currency,
            discount_codes,
            host_id,
            morning_period,
            evening_period,
            booking_system,
            has_deposit,
            deposit_amount,
            host:users!properties_host_id_fkey(
                bank_accounts(id, bank_name, account_holder, account_number)
            )
        `)
        .eq('id', propertyId)
        .single();
    
    if (error) {
        console.error("Error fetching property for payment:", error);
        return null;
    }
    
    const hostBankAccounts = (data.host as any)?.bank_accounts || [];

    return { ...data, hostBankAccounts };
}
