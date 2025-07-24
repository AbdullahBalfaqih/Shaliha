
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

export async function getUserDashboardData(userId: string) {
  if (!isSupabaseConfigured()) {
      return { bookings: [], wishlist: [], user: null, error: 'Supabase is not configured.' };
  }
  if (!userId) {
    return { bookings: [], wishlist: [], user: null, error: 'User not authenticated' };
  }
  const supabase = createSupabaseServerClient();
  
  // Step 1: Fetch bookings with property details.
  const bookingsPromise = supabase
    .from('bookings')
    .select(`
        *,
        properties (
            id,
            title,
            images,
            location,
            allow_reschedule,
            host_id
        )
    `)
    .eq('guest_id', userId);

  // Step 2: Fetch wishlist
  const wishlistPromise = supabase
      .from('wishlist_items')
      .select('properties(*)')
      .eq('wishlist_id', (await supabase.from('wishlists').select('id').eq('user_id', userId).single()).data?.id || '');

  // Step 3: Fetch user profile
  const userPromise = supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

  // Step 4: Fetch reviews made by this user to know which bookings are reviewed.
  const reviewsPromise = supabase
      .from('reviews')
      .select('booking_id')
      .eq('author_id', userId)
      .not('booking_id', 'is', null);

  const [bookingsRes, wishlistRes, userRes, reviewsRes] = await Promise.all([
      bookingsPromise,
      wishlistPromise,
      userPromise,
      reviewsPromise,
  ]);

  // Handle potential errors from promises
  if (bookingsRes.error) {
    console.error('Error fetching bookings:', bookingsRes.error);
    return { bookings: [], wishlist: [], user: null, error: bookingsRes.error.message };
  }
  if (wishlistRes.error) {
    console.error('Error fetching wishlist:', wishlistRes.error);
  }
  if (userRes.error) {
    console.error('Error fetching user:', userRes.error);
  }
  if (reviewsRes.error) {
    console.error('Error fetching reviews:', reviewsRes.error);
  }

  const reviewedBookingIds = new Set(reviewsRes.data?.map(r => r.booking_id) || []);

  const finalBookings = bookingsRes.data.map(booking => ({
      ...booking,
      hasReview: reviewedBookingIds.has(booking.id)
  }));


  return {
    bookings: finalBookings as any,
    wishlist: wishlistRes.data?.map(item => item.properties).filter(Boolean) || [],
    user: userRes.data || null,
  };
}

export async function submitReview(userId: string, bookingId: string, propertyId: string, propertyHostId: string, rating: number, comment: string) {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured.' };
    if (!userId) return { success: false, error: 'User not authenticated' };
    const supabase = createSupabaseServerClient();
    
    // Check if a review already exists for this booking by the user
    const { data: existingReview, error: checkError } = await supabase
        .from('reviews')
        .select('id')
        .eq('author_id', userId)
        .eq('booking_id', bookingId)
        .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // Ignore 'no rows found' error
        console.error('Error checking for existing review:', checkError);
        return { success: false, error: 'Could not verify existing reviews.' };
    }

    if (existingReview) {
        return { success: false, error: 'You have already submitted a review for this booking.' };
    }

    const { error } = await supabase.from('reviews').insert({
        property_id: propertyId,
        author_id: userId,
        rating,
        comment,
        booking_id: bookingId,
        property_host_id: propertyHostId,
    });

    if (error) {
        console.error('Error submitting review:', error);
        return { success: false, error: error.message };
    }
    
    // Potentially update booking to mark as reviewed
    return { success: true };
}


export async function requestBookingCancellation(userId: string, bookingId: string) {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured.' };
    if (!userId) return { success: false, error: 'User not authenticated' };
    const supabase = createSupabaseServerClient();

    const { data: booking, error: bookingError } = await supabase.from('bookings').select('property_id').eq('id', bookingId).single();
    if (bookingError || !booking) return { success: false, error: 'Booking not found' };

    const { data: property, error: propertyError } = await supabase.from('properties').select('host_id').eq('id', booking.property_id).single();
    if (propertyError || !property) return { success: false, error: 'Property not found for cancellation request' };

    const { error } = await supabase.from('cancellation_requests').insert({
        booking_id: bookingId,
        guest_id: userId,
        property_id: booking.property_id,
        host_id: property.host_id,
        status: 'pending'
    });

    if (error) {
        console.error('Error requesting cancellation:', error);
        return { success: false, error: error.message };
    }
    return { success: true };
}

export async function requestBookingReschedule(userId: string, bookingId: string, newDate: string, newPeriod: string) {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured.' };
    if (!userId) return { success: false, error: 'User not authenticated' };
    const supabase = createSupabaseServerClient();

    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('property_id, host_id')
        .eq('id', bookingId)
        .single();
    
    if (bookingError || !booking) return { success: false, error: 'Booking or property data missing.' };
    
    const { error } = await supabase.from('reschedule_requests').insert({
        booking_id: bookingId,
        guest_id: userId,
        property_id: booking.property_id,
        host_id: booking.host_id,
        new_date: newDate,
        new_period: newPeriod,
        status: 'pending'
    });
    
     if (error) {
        console.error('Error requesting reschedule:', error);
        return { success: false, error: error.message };
    }
    return { success: true };
}


export async function updateProfile(userId: string, fullName: string) {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase is not configured.' };
    if (!userId) return { success: false, error: 'User not authenticated' };
    const supabase = createSupabaseServerClient();
    
    const { data, error } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, updatedUser: data };
}
