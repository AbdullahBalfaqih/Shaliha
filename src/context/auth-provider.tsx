
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthContext, type SignUpPayload, type LoginPayload, type UserDetails } from './auth-context';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from '@/lib/notifications';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        try {
            const userString = localStorage.getItem('user');
            if (userString) {
                setUser(JSON.parse(userString));
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUserInContext = useCallback((updatedUser: UserDetails) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    }, []);

    const login = useCallback(async ({ phone, password }: LoginPayload) => {
        if (!isSupabaseConfigured() || !supabase) {
            toast({ title: 'خطأ', description: 'Supabase غير مهيأ.', variant: 'destructive' });
            return;
        }
        setLoading(true);

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .single();

        if (error || !data || data.password !== password) {
            toast({ title: 'خطأ في تسجيل الدخول', description: 'رقم الهاتف أو كلمة المرور غير صحيحة.', variant: 'destructive' });
        } else {
            const userProfile: UserDetails = data;
            updateUserInContext(userProfile);
            toast({ title: 'تم تسجيل الدخول بنجاح' });

            if (userProfile.role === 'admin') {
                router.push('/admin/dashboard');
            } else if (userProfile.role === 'host') {
                router.push('/host/dashboard');
            } else {
                router.push('/dashboard');
            }
        }
        setLoading(false);
    }, [toast, router, updateUserInContext]);

    const signUp = useCallback(async ({ email, password, fullName, phone, role }: SignUpPayload) => {
        if (!isSupabaseConfigured() || !supabase) {
            toast({ title: 'خطأ', description: 'Supabase غير مهيأ.', variant: 'destructive' });
            return;
        }
        setLoading(true);

        // Check if phone number already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('phone', phone)
            .single();

        if (existingUser) {
            toast({ title: 'خطأ في إنشاء الحساب', description: 'رقم الهاتف هذا مسجل بالفعل.', variant: 'destructive' });
            setLoading(false);
            return;
        }

        const newUserId = uuidv4();
        const newUser: Omit<UserDetails, 'id'> & { id: string } = {
            id: newUserId,
            email: email || null,
            full_name: fullName,
            phone,
            role,
            password: password, // Storing password directly. NOT FOR PRODUCTION.
            avatar_url: `https://avatar.vercel.sh/${phone}.png`,
        };

        const { error: insertError } = await supabase.from('users').insert(newUser as any);

        if (insertError) {
            toast({ title: 'خطأ في إنشاء الحساب', description: insertError.message, variant: 'destructive' });
            setLoading(false);
        } else {
            toast({ title: 'تم إنشاء الحساب بنجاح!', description: 'سيتم تسجيل دخولك الآن.' });
            
            // Create a welcome notification
            await createNotification({
                user_id: newUserId,
                title: 'مرحباً بك في شاليها!',
                message: `أهلاً بك ${fullName}، يسعدنا انضمامك إلينا. ابدأ رحلتك الآن!`,
                link: '/dashboard'
            });

            // Directly log in the user after successful sign-up
            const userProfile: UserDetails = { ...newUser };
            updateUserInContext(userProfile);
            router.push('/dashboard');
            setLoading(false);
        }
    }, [toast, router, updateUserInContext]);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('user');
        router.push('/');
        toast({ title: 'تم تسجيل الخروج' });
    }, [router, toast]);

    const value = useMemo(() => ({
        user,
        loading,
        login,
        signUp,
        logout,
        updateUserInContext,
    }), [user, loading, login, signUp, logout, updateUserInContext]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

    