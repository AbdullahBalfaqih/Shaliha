
'use server';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

const createSupabaseServerClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL or anonymous key is not configured.');
    }
    
    return createClient<Database>(supabaseUrl, supabaseAnonKey);
};


export async function createOrGetConversation(payload: { propertyId: string; hostId: string; guestId: string; }) {
    const supabase = createSupabaseServerClient();
    const { propertyId, guestId, hostId } = payload;

    if (!guestId) {
        return { success: false, error: 'User not authenticated' };
    }
    
    // Step 1: Check if a conversation already exists.
    const { data: existingConversation, error: checkError } = await supabase
        .from('conversations')
        .select('id')
        .eq('property_id', propertyId)
        .eq('guest_id', guestId)
        .maybeSingle(); 

    if (checkError) {
        console.error("Error checking for existing conversation:", checkError);
        return { success: false, error: "Could not check for existing conversation." };
    }

    // Step 2: If it exists, return its ID.
    if (existingConversation) {
        return { success: true, isNew: false, conversationId: existingConversation.id };
    }
    
    // --- DIAGNOSTIC LOGGING ---
    // Log the values being used for the insert operation.
    console.log("Attempting to create conversation with:", { propertyId, guestId, hostId });

    // Step 3: If it does not exist, create a new one.
    const { data: newConversation, error: insertError } = await supabase
        .from('conversations')
        .insert({
            property_id: propertyId,
            guest_id: guestId,
            host_id: hostId,
        })
        .select('id')
        .single();
        
    if (insertError) {
        // --- DETAILED ERROR LOGGING ---
        // Log the entire error object for full details.
        console.error("Error creating conversation in action:", insertError);
        return { success: false, error: "Could not start a conversation. The database returned an error." };
    }
    
    return { success: true, isNew: true, conversationId: newConversation.id };
}

