
'use server';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { sendPasswordResetEmail } from '@/lib/email';
import { z } from 'zod';

const ForgotPasswordSchema = z.object({
    email: z.string().email({ message: "البريد الإلكتروني غير صالح." }),
});

const createSupabaseServerClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase credentials are not configured.");
    }
    return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

export async function sendPasswordByEmailAction({ email }: { email: string }): Promise<{ success: boolean; message: string }> {
    const validation = ForgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
        return { success: false, message: validation.error.errors[0].message };
    }

    const supabase = createSupabaseServerClient();

    // Find user by email
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('full_name, password')
        .eq('email', email)
        .single();

    if (userError || !user) {
        // We don't want to reveal if an email exists or not for security reasons.
        // So we return a generic success message.
        console.log(`Password reset attempt for non-existent email: ${email}`);
        return { success: true, message: "إذا كان البريد الإلكتروني موجودًا في نظامنا، فسيتم إرسال كلمة المرور إليه." };
    }

    if (!user.password) {
        // User exists but has no password set (e.g., social login - not implemented, but good practice)
        return { success: true, message: "هذا الحساب لا يستخدم كلمة مرور لتسجيل الدخول." };
    }

    try {
        await sendPasswordResetEmail({
            to: email,
            name: user.full_name || 'مستخدمنا العزيز',
            password: user.password
        });
        return { success: true, message: "إذا كان البريد الإلكتروني موجودًا في نظامنا، فسيتم إرسال كلمة المرور إليه." };
    } catch (error) {
        console.error("Failed to send password reset email:", error);
        return { success: false, message: "حدث خطأ أثناء محاولة إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى." };
    }
}
