

'use server';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { format } from "date-fns";

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

export async function getProperties(filters: {
    city?: string;
    type?: string;
    dedicatedFor?: string;
    maxPrice?: number;
    amenities?: string[];
    q?: string;
    limit?: number;
    orderBy?: 'rating' | 'created_at';
    dateRange?: { from: Date; to?: Date };
}) {
    if (!isSupabaseConfigured()) {
        return [];
    }
    const supabase = createSupabaseServerClient();
    
    let query = supabase
        .from('properties')
        .select(`
            *,
            reviews ( rating )
        `)
        .eq('is_active', true);

    if (filters.city && filters.city !== 'any') {
        query = query.eq('governorate', filters.city);
    }
    if (filters.type && filters.type !== 'any') {
        query = query.eq('type', filters.type);
    }
    if (filters.dedicatedFor && filters.dedicatedFor !== 'any') {
        query = query.in('dedicated_for', ['كلاهما', filters.dedicatedFor]);
    }
    if (filters.maxPrice) {
        query = query.lte('price_per_night', filters.maxPrice);
    }
    if (filters.amenities && filters.amenities.length > 0) {
        query = query.contains('amenities', filters.amenities);
    }
    if (filters.q) {
        query = query.textSearch('title', filters.q, { type: 'websearch' });
    }
    if (filters.limit) {
        query = query.limit(filters.limit);
    }
    if (filters.orderBy === 'created_at') {
        query = query.order('created_at', { ascending: false });
    }


    const { data: propertiesData, error } = await query;

    if (error) {
        console.error('Error fetching properties:', error);
        return [];
    }
    
    let finalProperties = propertiesData;

    // If a date range is provided, filter out unavailable properties
    if (filters.dateRange && filters.dateRange.from) {
        const from = format(filters.dateRange.from, 'yyyy-MM-dd');
        const to = filters.dateRange.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : from;

        const { data: bookings } = await supabase
            .from('bookings')
            .select('property_id, booking_date, period')
            .in('status', ['confirmed'])
            .gte('booking_date', from)
            .lte('booking_date', to);
            
        if (bookings) {
             const propertyAvailability: Record<string, Record<string, string[]>> = {};

             bookings.forEach(b => {
                if (!propertyAvailability[b.property_id]) {
                    propertyAvailability[b.property_id] = {};
                }
                if (!propertyAvailability[b.property_id][b.booking_date]) {
                    propertyAvailability[b.property_id][b.booking_date] = [];
                }
                propertyAvailability[b.property_id][b.booking_date].push(b.period);
             });
             
             finalProperties = propertiesData.filter(p => {
                const isBooked = Object.keys(propertyAvailability[p.id] || {}).some(date => {
                    const periods = propertyAvailability[p.id][date];
                    if (p.booking_system === 'single_period') {
                        return periods.length > 0;
                    } else {
                        return periods.includes('full_day') || (periods.includes('morning') && periods.includes('evening'));
                    }
                });
                return !isBooked;
             });
        }
    }


    // Manually calculate rating and review_count
    const propertiesWithRatings = finalProperties.map(property => {
        const reviews = (property.reviews as any[]) || [];
        const review_count = reviews.length;
        const rating = review_count > 0 
            ? reviews.reduce((acc, r) => acc + r.rating, 0) / review_count
            : 0;

        return { ...property, rating, review_count };
    });

    if (filters.orderBy === 'rating') {
        propertiesWithRatings.sort((a, b) => b.rating - a.rating);
    }

    return propertiesWithRatings;
}


export async function getPropertyById(id: string) {
    if (!isSupabaseConfigured()) {
        return null;
    }
    const supabase = createSupabaseServerClient();

    // Fetch the property itself
    const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

    if (propertyError || !propertyData) {
        console.error('Error fetching property by id:', propertyError);
        return null;
    }

    // Now fetch bookings and reviews separately
    const bookingsPromise = supabase
        .from('bookings')
        .select('booking_date, period, status, type')
        .eq('property_id', id)
        .in('status', ['confirmed', 'pending']); // Fetch confirmed and pending bookings
    
    const reviewsPromise = supabase
        .from('reviews')
        .select(`
            *,
            author:users!reviews_author_id_fkey(
                full_name,
                avatar_url
            )
        `)
        .eq('property_id', id);

    const [bookingsRes, reviewsRes] = await Promise.all([bookingsPromise, reviewsPromise]);

    if (bookingsRes.error) {
        console.error('Error fetching bookings for property:', bookingsRes.error);
    }
     if (reviewsRes.error) {
        console.error('Error fetching reviews for property:', reviewsRes.error);
    }

    const reviews = reviewsRes.data || [];
    const review_count = reviews.length;
    const rating = review_count > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / review_count : 0;

    const bookedDates: { date: string; periods: any[] }[] = [];
    if (bookingsRes.data) {
        const bookingsByDate: { [key: string]: any[] } = {};
        bookingsRes.data.forEach((b: any) => {
            const dateStr = b.booking_date;
            if (!bookingsByDate[dateStr]) {
                bookingsByDate[dateStr] = [];
            }
             // For dual period system, if a full_day is booked (manually or blocked), it occupies both periods.
            if (b.period === 'full_day') {
                bookingsByDate[dateStr].push('morning', 'evening');
            } else {
                bookingsByDate[dateStr].push(b.period);
            }
        });

        for (const date in bookingsByDate) {
            // Remove duplicates if 'full_day' and a specific period were added
            const uniquePeriods = [...new Set(bookingsByDate[date])];
            bookedDates.push({ date, periods: uniquePeriods });
        }
    }
    
    return { ...propertyData, reviews, bookedDates, rating, review_count };
}


export async function getPropertyForEdit(id: string) {
    if (!isSupabaseConfigured()) {
        return null;
    }
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) {
        console.error('Error fetching property for edit:', error);
        return null;
    }

    return data;
}

export async function toggleWishlist(propertyId: string, userId: string) {
    if (!isSupabaseConfigured()) {
        return { success: false, error: 'Supabase is not configured.' };
    }
    if (!userId) {
        return { success: false, error: 'Not authenticated' };
    }

    const supabase = createSupabaseServerClient();

    const { data: wishlist, error: wishlistError } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', userId)
        .single();
        
    let currentWishlistId = wishlist?.id;

    if ((wishlistError && wishlistError.code === 'PGRST116') || !wishlist) { // 'PGRST116' is 'No rows found'
       const { data: newWishlist, error: createError } = await supabase
            .from('wishlists')
            .insert({ user_id: userId })
            .select('id')
            .single();
        
       if (createError || !newWishlist) {
            console.error("Error creating wishlist:", createError);
            return { success: false, error: 'Could not create wishlist' };
       }
       currentWishlistId = newWishlist.id;
    } else if (wishlistError) {
        console.error("Error fetching wishlist:", wishlistError);
        return { success: false, error: 'Could not fetch wishlist' };
    }
    
    if (!currentWishlistId) {
         return { success: false, error: 'Could not find or create wishlist' };
    }


    const { data: wishlistItem, error: itemError } = await supabase
        .from('wishlist_items')
        .select('id')
        .eq('wishlist_id', currentWishlistId)
        .eq('property_id', propertyId)
        .single();

    if (itemError && itemError.code !== 'PGRST116') { // Ignore "no rows found" error
         return { success: false, error: itemError.message };
    }

    if (wishlistItem) {
        const { error: deleteError } = await supabase.from('wishlist_items').delete().eq('id', wishlistItem.id);
        if (deleteError) return { success: false, error: deleteError.message };
        return { success: true, added: false };
    } else {
        const { error: insertError } = await supabase.from('wishlist_items').insert({
            wishlist_id: currentWishlistId,
            property_id: propertyId
        });
        if (insertError) return { success: false, error: insertError.message };
        return { success: true, added: true };
    }
}

export async function checkIfWishlisted(propertyId: string, userId: string) {
    if (!isSupabaseConfigured() || !userId) {
        return { isWishlisted: false };
    }

    const supabase = createSupabaseServerClient();

    const { data: wishlist, error: wishlistError } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', userId)
        .single();
        
    if (wishlistError || !wishlist) {
        return { isWishlisted: false };
    }

    const { data: wishlistItem, error: itemError } = await supabase
        .from('wishlist_items')
        .select('id')
        .eq('wishlist_id', wishlist.id)
        .eq('property_id', propertyId)
        .single();

    return { isWishlisted: !!wishlistItem };
}
