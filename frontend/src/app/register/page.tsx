'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { UserPlus, Mail, KeyRound, User, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export default function Register() {
    const { user, register } = useAuth() as any;
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        setIsSubmitting(true);

        try {
            await register(email, password, username);
            setSuccessMsg('Operator Profile initialized! Redirecting to auth node...');
            setEmail('');
            setUsername('');
            setPassword('');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: any) {
            setErrorMsg(err.message || 'Registration failed. Check parameters and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center py-20 px-6 font-mono">
            <div className="w-full max-w-md glass-panel p-8 rounded-xl border border-gray-800 shadow-2xl z-10">
                <div className="flex flex-col items-center mb-8">
                    <UserPlus className="h-10 w-10 text-cyan-400 mb-3 cyber-glow-cyan" />
                    <h2 className="text-2xl font-bold text-white tracking-wider">INITIALIZE OPERATOR</h2>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">nerdCTF Registration Node</p>
                </div>

                {errorMsg && (
                    <div className="flex gap-2.5 items-center bg-red-950/20 border border-red-900/50 text-red-400 p-4 rounded-lg text-sm mb-6">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <div>{errorMsg}</div>
                    </div>
                )}

                {successMsg && (
                    <div className="flex gap-2.5 items-center bg-green-950/20 border border-green-900/50 text-green-400 p-4 rounded-lg text-sm mb-6">
                        <CheckCircle className="h-5 w-5 shrink-0" />
                        <div>{successMsg}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-sm">
                    <div>
                        <label className="block text-gray-400 uppercase tracking-widest text-xs mb-2">EMAIL ADDRESS</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-500" />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-[#0d1221] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                                placeholder="operator@nerdctf.io"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 uppercase tracking-widest text-xs mb-2">USERNAME</label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-500" />
                            <input 
                                type="text" 
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-[#0d1221] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                                placeholder="net_hacker"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 uppercase tracking-widest text-xs mb-2">SECRET PASSWORD</label>
                        <div className="relative">
                            <KeyRound className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-500" />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-[#0d1221] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                            Password policy: Min 8 characters, 1 uppercase, 1 digit, and 1 special character required.
                        </p>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="cyber-btn-cyan w-full py-3.5 rounded-lg font-bold uppercase tracking-wider text-white mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Initializing...
                            </>
                        ) : (
                            'Create Profile'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-gray-500">
                    Already registered? <Link href="/login" className="text-cyan-500 hover:text-cyan-400 font-semibold underline transition">Establish session</Link>
                </div>
            </div>
        </div>
    );
}
