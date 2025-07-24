
'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/lib/supabase/database.types';

type PropertyInsert = Omit<Database['public']['Tables']['properties']['Row'], 'id' | 'created_at' | 'host_id' | 'rating' | 'review_count' | 'is_active'>;
type BankAccountInsert = Database['public']['Tables']['bank_accounts']['Insert'];


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

export async function getHostDashboardData(userId: string) {
    if (!isSupabaseConfigured()) return { error: 'Supabase is not configured', properties: [], bookings: [], reviews: [], cancellationRequests: [], rescheduleRequests: [], bankAccounts: [] };
    if (!userId) return { error: 'Not authenticated', properties: [], bookings: [], reviews: [], cancellationRequests: [], rescheduleRequests: [], bankAccounts: [] };

    const supabase = createSupabaseServerClient();

    // Step 1: Get the host's properties first, including related reviews to calculate rating.
    const { data: hostPropertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*, reviews(rating)')
        .eq('host_id', userId);

    if (propertiesError) {
        console.error("Error fetching host properties:", propertiesError);
        return { error: propertiesError.message, properties: [], bookings: [], reviews: [], cancellationRequests: [], rescheduleRequests: [], bankAccounts: [] };
    }

    // Manually calculate rating and review_count
    const hostProperties = hostPropertiesData.map(property => {
        const reviews = (property.reviews as any[]) || [];
        const review_count = reviews.length;
        const rating = review_count > 0
            ? reviews.reduce((acc, r) => acc + r.rating, 0) / review_count
            : 0;
        return { ...property, rating, review_count };
    });

    const propertyIds = hostProperties.map(p => p.id);

    // Step 2: Now fetch everything else based on the host's userId or the property IDs.
    const [bookingsRes, reviewsRes, cancellationsRes, reschedulesRes, bankAccountsRes] = await Promise.all([
        supabase.from('bookings').select('*, properties(title, has_deposit, deposit_amount), guest:bookings_guest_id_fkey(full_name, phone)').eq('host_id', userId),
        propertyIds.length > 0 ? supabase.from('reviews').select('*, properties(title), author:reviews_author_id_fkey(full_name, avatar_url)').in('property_id', propertyIds) : Promise.resolve({ data: [], error: null }),
        propertyIds.length > 0 ? supabase.from('cancellation_requests').select('*, properties(title), guest:cancellation_requests_guest_id_fkey(full_name, phone)').in('property_id', propertyIds) : Promise.resolve({ data: [], error: null }),
        propertyIds.length > 0 ? supabase.from('reschedule_requests').select('*, properties(title), guest:reschedule_requests_guest_id_fkey(full_name, phone)').in('property_id', propertyIds) : Promise.resolve({ data: [], error: null }),
        supabase.from('bank_accounts').select('*').eq('user_id', userId),
    ]);

    const error = bookingsRes.error || reviewsRes.error || cancellationsRes.error || reschedulesRes.error || bankAccountsRes.error;

    if (error) {
        console.error("Error fetching host dashboard data:", error);
        return { error: error.message, properties: [], bookings: [], reviews: [], cancellationRequests: [], rescheduleRequests: [], bankAccounts: [] };
    }

    return {
        properties: hostProperties || [],
        bookings: bookingsRes.data || [],
        reviews: reviewsRes.data || [],
        cancellationRequests: cancellationsRes.data || [],
        rescheduleRequests: reschedulesRes.data || [],
        bankAccounts: bankAccountsRes.data || [],
    };
}


export async function addOrUpdateProperty(propertyData: PropertyInsert, userId: string, propertyId?: string) {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured.' };
    const supabase = createSupabaseServerClient();

    if (!userId) {
        return { success: false, error: 'Not authenticated' };
    }

    let error;
    if (propertyId) {
        // Update
        ({ error } = await supabase.from('properties').update(propertyData).eq('id', propertyId).eq('host_id', userId));
    } else {
        // Insert
        ({ error } = await supabase.from('properties').insert({ ...propertyData, host_id: userId }));
    }

    if (error) {
        console.error("Error saving property:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/host/dashboard');
    return { success: true };
}


export async function deleteProperty(propertyId: string, hostId: string) {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured.' };
    const supabase = createSupabaseServerClient();
    if (!hostId) return { success: false, error: 'Not authenticated or not authorized' };

    const { error } = await supabase.from('properties').delete().eq('id', propertyId).eq('host_id', hostId);
    if (error) {
        return { success: false, error: error.message };
    }
    revalidatePath('/host/dashboard');
    return { success: true };
}

export async function togglePropertyPublish(propertyId: string, hostId: string, newStatus: boolean) {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured.' };
    const supabase = createSupabaseServerClient();
    if (!hostId) return { success: false, error: 'Not authenticated or not authorized' };

    const { error } = await supabase.from('properties').update({ is_active: newStatus }).eq('id', propertyId).eq('host_id', hostId);
    if (error) {
        return { success: false, error: error.message };
    }
    revalidatePath('/host/dashboard');
    return { success: true };
}

export async function handleBookingConfirmation(bookingId: string, newStatus: 'confirmed' | 'cancelled') {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured.' };
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', bookingId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/host/dashboard');
    return { success: true };
}

export async function deleteBooking(bookingId: string) {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured.' };
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
    if (error) {
        return { success: false, error: error.message };
    }
    revalidatePath('/host/dashboard');
    return { success: true };
}

export async function handleCancellationRequest(requestId: string, action: 'accepted' | 'rejected') {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured.' };
    const supabase = createSupabaseServerClient();

    const { data: requestData, error: requestError } = await supabase.from('cancellation_requests').select('booking_id').eq('id', requestId).single();
    if (requestError || !requestData) return { success: false, error: 'Request not found' };

    const { error } = await supabase.from('cancellation_requests').update({ status: action }).eq('id', requestId);
    if (error) return { success: false, error: error.message };

    if (action === 'accepted') {
        await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', requestData.booking_id);
    }

    revalidatePath('/host/dashboard');
    return { success: true };
}

export async function handleRescheduleRequest(requestId: string, action: 'accepted' | 'rejected') {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured.' };
    const supabase = createSupabaseServerClient();

    const { data: requestData, error: requestError } = await supabase.from('reschedule_requests').select('booking_id, new_date, new_period').eq('id', requestId).single();
    if (requestError || !requestData) return { success: false, error: 'Request not found' };

    const { error } = await supabase.from('reschedule_requests').update({ status: action }).eq('id', requestId);
    if (error) return { success: false, error: error.message };

    if (action === 'accepted') {
        await supabase.from('bookings').update({ booking_date: requestData.new_date, period: requestData.new_period as any }).eq('id', requestData.booking_id);
    }

    revalidatePath('/host/dashboard');
    return { success: true };
}

export async function saveBankAccount(accountData: Omit<BankAccountInsert, 'id' | 'created_at' | 'user_id'>, userId: string, accountId?: string) {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured.' };
    const supabase = createSupabaseServerClient();

    if (!userId) return { success: false, error: 'Not authenticated or authorized' };

    const payload = {
        ...accountData,
        user_id: userId,
    };

    let error;
    if (accountId) {
        ({ error } = await supabase.from('bank_accounts').update(payload).eq('id', accountId));
    } else {
        ({ error } = await supabase.from('bank_accounts').insert(payload));
    }

    if (error) {
        console.error("Error saving bank account:", error);
        return { success: false, error: error.message };
    }
    revalidatePath('/host/dashboard');
    return { success: true };
}

export async function deleteBankAccount(accountId: string, userId: string) {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured.' };
    const supabase = createSupabaseServerClient();

    if (!userId) return { success: false, error: 'Not authenticated or authorized' };

    const { error } = await supabase.from('bank_accounts').delete().eq('id', accountId).eq('user_id', userId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/host/dashboard');
    return { success: true };
}

export async function getPropertyBookings(propertyId: string) {
    if (!isSupabaseConfigured()) return { data: null, error: 'Supabase is not configured.' };
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
        .from('bookings')
        .select('*, guest:bookings_guest_id_fkey(full_name, phone)')
        .eq('property_id', propertyId)
        .in('status', ['confirmed']);

    if (error) return { data: null, error: error.message };
    return { data, error: null };
}

type ManualBookingPayload = {
    id?: string; // for updates
    property_id: string;
    host_id: string;
    booking_date: string;
    period: string;
    type: 'manual' | 'blocked';
    guest_details?: { name: string, phone: string };
};

export async function addOrUpdateManualBooking(payload: ManualBookingPayload) {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured.' };
    const supabase = createSupabaseServerClient();

    const { id, ...upsertData } = payload;

    const dataToInsert = {
        ...upsertData,
        status: 'confirmed', // Manual bookings are always confirmed
    };

    if (id) {
        // Update existing booking
        const { error } = await supabase.from('bookings').update(dataToInsert as any).eq('id', id);
        if (error) {
            console.error('Error updating manual booking:', error);
            return { success: false, error: error.message };
        }
    } else {
        // Insert new booking
        const { error } = await supabase.from('bookings').insert(dataToInsert as any);
        if (error) {
            console.error('Error adding manual booking:', error);
            return { success: false, error: error.message };
        }
    }

    revalidatePath('/host/dashboard');
    return { success: true };
}

export async function removeManualBooking(bookingId: string, hostId: string) {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured.' };
    const supabase = createSupabaseServerClient();

    const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)
        .eq('host_id', hostId)
        .in('type', ['manual', 'blocked']);

    if (error) {
        console.error('Error removing manual booking:', error);
        return { success: false, error: error.message };
    }
    revalidatePath('/host/dashboard');
    return { success: true };
}

export async function deleteReview(reviewId: string, hostId: string) {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured.' };
    const supabase = createSupabaseServerClient();

    const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('property_host_id', hostId);

    if (error) {
        console.error('Error deleting review:', error);
        return { success: false, error: error.message };
    }
    revalidatePath('/host/dashboard');
    return { success: true };
}
