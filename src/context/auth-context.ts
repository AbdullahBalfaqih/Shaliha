
"use client";

import React from 'react';

// This will hold the combination of Supabase's User and our public.users table data.
export interface UserDetails {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'host' | 'admin' | null;
  phone: string | null;
  email: string | null;
  password?: string | null; // Added for manual auth, should not be exposed long term
};

export interface LoginPayload {
    phone: string;
    password?: string;
}

export interface SignUpPayload {
    email: string | null;
    password?: string;
    fullName: string;
    role: 'user' | 'host';
    phone: string;
}

export interface AuthContextType {
    user: UserDetails | null;
    loading: boolean;
    login: (payload: LoginPayload) => Promise<void>;
    signUp: (payload: SignUpPayload) => Promise<void>;
    logout: () => void;
    updateUserInContext: (user: UserDetails) => void;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);
