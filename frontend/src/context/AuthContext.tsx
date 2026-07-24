'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

interface User {
    id: string;
    username: string;
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
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const checkSession = async () => {
        try {
            const response = await api.get('/auth/me');
            if (response.data?.success) {
                setUser(response.data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            if (response.data?.success) {
                setUser(response.data.user);
            }
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await api.post('/auth/logout');
        } catch (err) {
            // Ignore error, delete local state
        } finally {
            setUser(null);
            setLoading(false);
        }
    };

    useEffect(() => {
        checkSession();

        // Listen for forced logout event from axios interceptor
        const handleForceLogout = () => {
            setUser(null);
        };
        window.addEventListener('auth-logout', handleForceLogout);
        return () => window.removeEventListener('auth-logout', handleForceLogout);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkSession }}>
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
