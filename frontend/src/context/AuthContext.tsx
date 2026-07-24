'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface User {
    id: string;
    username: string; // Supabase uses metadata for username
    email: string;
    role: string;
    avatar?: string;
    country?: string;
    createdAt?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, username: string) => Promise<void>;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const mapSupabaseUser = (supabaseUser: any): User | null => {
        if (!supabaseUser) return null;
        return {
            id: supabaseUser.id,
            email: supabaseUser.email,
            username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'Unknown',
            role: supabaseUser.user_metadata?.role || 'user',
            avatar: supabaseUser.user_metadata?.avatar || '',
            country: supabaseUser.user_metadata?.country || '',
            createdAt: supabaseUser.created_at,
        };
    };

    const checkSession = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(mapSupabaseUser(user));
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            setUser(mapSupabaseUser(data.user));
        } finally {
            setLoading(false);
        }
    };

    const register = async (email: string, password: string, username: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                        role: 'user'
                    }
                }
            });
            if (error) throw error;
            setUser(mapSupabaseUser(data.user));
        } finally {
            setLoading(false);
        }
    }

    const logout = async () => {
        setLoading(true);
        try {
            await supabase.auth.signOut();
        } catch (err) {
            // Ignore error, delete local state
        } finally {
            setUser(null);
            setLoading(false);
        }
    };

    useEffect(() => {
        checkSession();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(mapSupabaseUser(session?.user));
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, checkSession }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
