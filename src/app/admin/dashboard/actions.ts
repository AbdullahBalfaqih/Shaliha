
'use server';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

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

// Action to get all users
export async function getAllUsers() {
  if (!isSupabaseConfigured()) return [];
  const supabase = createSupabaseServerClient();
  // Fetch users directly from the public.users table instead of auth.users
  const { data: users, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return users;
}


// Action to delete a user
export async function deleteUser(userId: string) {
  if (!isSupabaseConfigured()) return { success: false, error: "Supabase is not configured." };
  const supabase = createSupabaseServerClient();
  
  // Since we don't use Supabase Auth, we delete from the public.users table.
  // In a real-world scenario with foreign keys, you might need to handle cascading deletes or related data.
  const { error } = await supabase.from('users').delete().eq('id', userId);

  if (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}


// Action to get system stats
export async function getSystemStats() {
    if (!isSupabaseConfigured()) return { totalUsers: 0, totalHosts: 0, totalCustomers: 0, totalProperties: 0, totalRevenue: 0, activeBookings: 0 };
    const supabase = createSupabaseServerClient();

    const usersPromise = supabase.from('users').select('*', { count: 'exact', head: true });
    const hostsPromise = supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'host');
    const customersPromise = supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user');


    const propertiesPromise = supabase.from('properties').select('*', { count: 'exact', head: true });

    // Calculate total revenue from service fees of confirmed bookings
    const revenuePromise = supabase
        .from('bookings')
        .select('service_fee')
        .eq('status', 'confirmed');

    // Calculate active bookings (confirmed bookings with future dates)
    const activeBookingsPromise = supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'confirmed')
        .gte('booking_date', new Date().toISOString().split('T')[0]);

    const [
        { count: totalUsers, error: usersError },
        { count: totalHosts, error: hostsError },
        { count: totalCustomers, error: customersError },
        { count: totalProperties, error: propertiesError },
        { data: revenueData, error: revenueError },
        { count: activeBookings, error: activeBookingsError }
    ] = await Promise.all([
        usersPromise, 
        hostsPromise, 
        customersPromise, 
        propertiesPromise, 
        revenuePromise, 
        activeBookingsPromise
    ]);


    if (usersError || hostsError || customersError || propertiesError || revenueError || activeBookingsError) {
        console.error('Error fetching stats:', { usersError, hostsError, customersError, propertiesError, revenueError, activeBookingsError });
    }
    
    const totalRevenue = revenueData?.reduce((sum, booking) => sum + (booking.service_fee || 0), 0) ?? 0;

    return {
        totalUsers: totalUsers ?? 0,
        totalHosts: totalHosts ?? 0,
        totalCustomers: totalCustomers ?? 0,
        totalProperties: totalProperties ?? 0,
        totalRevenue: totalRevenue,
        activeBookings: activeBookings ?? 0,
    };
}

// Action to get all properties (for admin)
export async function getAllPropertiesForAdmin() {
  if (!isSupabaseConfigured()) return [];
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('properties')
    .select('*, reviews(rating)');

  if (error) {
    console.error('Error fetching all properties:', error);
    return [];
  }
  
    // Manually calculate rating and review_count
    return data.map(property => {
        const reviews = (property.reviews as any[]) || [];
        const review_count = reviews.length;
        const rating = review_count > 0 
            ? reviews.reduce((acc, r) => acc + r.rating, 0) / review_count
            : 0;

        return { ...property, rating, review_count };
    });
}


export async function getSystemReportData() {
    if (!isSupabaseConfigured()) {
        return { error: 'Supabase is not configured' };
    }
    const supabase = createSupabaseServerClient();

    try {
        const [
            usersRes,
            propertiesRes,
            bookingsRes,
            reviewsRes,
            cancellationRequestsRes,
            rescheduleRequestsRes,
            bankAccountsRes
        ] = await Promise.all([
            supabase.from('users').select('*'),
            getAllPropertiesForAdmin(), // Use existing function that calculates ratings
            supabase.from('bookings').select('*, properties(title), guest:users!bookings_guest_id_fkey(full_name)'),
            supabase.from('reviews').select('*, properties(title), author:users!reviews_author_id_fkey(full_name)'),
            supabase.from('cancellation_requests').select('*, properties(title), guest:users!cancellation_requests_guest_id_fkey(full_name)'),
            supabase.from('reschedule_requests').select('*, properties(title), guest:users!reschedule_requests_guest_id_fkey(full_name)'),
            supabase.from('bank_accounts').select('*'),
        ]);

        const errors = [
            usersRes.error,
            (propertiesRes as any).error,
            bookingsRes.error,
            reviewsRes.error,
            cancellationRequestsRes.error,
            rescheduleRequestsRes.error,
            bankAccountsRes.error
        ].filter(Boolean);

        if (errors.length > 0) {
            console.error('Errors fetching system report data:', errors);
            return { error: 'Failed to fetch some report data.' };
        }

        return {
            users: usersRes.data,
            properties: propertiesRes, // Already includes rating and review_count
            bookings: bookingsRes.data,
            reviews: reviewsRes.data,
            cancellationRequests: cancellationRequestsRes.data,
            rescheduleRequests: rescheduleRequestsRes.data,
            bankAccounts: bankAccountsRes.data,
        };
    } catch (e: any) {
        return { error: e.message };
    }
}
