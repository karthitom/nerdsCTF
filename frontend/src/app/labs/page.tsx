'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Flag, CheckCircle, Zap, Shield, Loader2, ArrowRight } from 'lucide-react';

export default function Labs() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [challenges, setChallenges] = useState<any[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterDifficulty, setFilterDifficulty] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
        
        const fetchChallenges = async () => {
            try {
                // @ts-ignore - Supabase client
                const { createClient } = await import('@/utils/supabase/client');
                const supabase = createClient();

                const { data: challenges, error } = await supabase
                    .from('challenges')
                    .select('*')
                    .eq('status', 'active'); // Only show active challenges

                if (error) throw error;

                const { data: solves } = await supabase
                    .from('solves')
                    .select('challenge_id')
                    .eq('user_id', user.id);
                
                const solvedIds = new Set(solves?.map((s: any) => s.challenge_id));

                const mapped = (challenges || []).map((c: any) => ({
                    ...c,
                    estimatedTime: c.estimated_time,
                    solved: solvedIds.has(c.id)
                }));
                
                setChallenges(mapped);
            } catch (error) {
                console.error("Error loading challenges", error);
            } finally {
                setPageLoading(false);
            }
        };

        fetchChallenges();
    }, [user]);

    if (loading || pageLoading || !user) {
        return (
            <div className="flex-grow flex items-center justify-center font-mono">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
                    <p className="text-sm text-gray-500 uppercase tracking-widest">Loading Labs Node...</p>
                </div>
            </div>
        );
    }

    const getDiffColor = (diff: string) => {
        switch (diff.toLowerCase()) {
            case 'easy': return 'text-emerald-400 border-emerald-900 bg-emerald-950/20';
            case 'medium': return 'text-amber-400 border-amber-900 bg-amber-950/20';
            case 'hard': return 'text-rose-400 border-rose-900 bg-rose-950/20';
            case 'insane': return 'text-purple-400 border-purple-900 bg-purple-950/20';
            default: return 'text-gray-400 border-gray-900';
        }
    };

    const categories = ['All', ...Array.from(new Set(challenges.map(c => c.category)))];
    
    const filteredChallenges = challenges.filter(c => {
        const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (c.tags || []).some((t: string) => t.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchCat = filterCategory === 'All' || c.category === filterCategory;
        const matchDiff = filterDifficulty === 'All' || c.difficulty.toLowerCase() === filterDifficulty.toLowerCase();
        const matchStatus = filterStatus === 'All' || 
                            (filterStatus === 'Solved' && c.solved) || 
                            (filterStatus === 'Unsolved' && !c.solved);
        return matchSearch && matchCat && matchDiff && matchStatus;
    });

    return (
        <div className="flex-1 max-w-6xl mx-auto w-full py-10 px-6 font-mono">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
                        <Flag className="h-7 w-7 text-cyan-400" /> Training Labs
                    </h1>
                    <p className="text-sm text-gray-400 mt-2">
                        Deploy isolated containers, analyze vulnerabilities, and capture flags in realistic scenarios.
                    </p>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="glass-panel p-4 rounded-xl border border-gray-800 mb-8 flex flex-col md:flex-row gap-4">
                <input 
                    type="text" 
                    placeholder="Search labs or tags..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-gray-950/50 border border-gray-800 text-sm rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50"
                />
                <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-gray-950/50 border border-gray-800 text-sm rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-cyan-500/50"
                >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <select 
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="bg-gray-950/50 border border-gray-800 text-sm rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-cyan-500/50"
                >
                    <option value="All">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="insane">Insane</option>
                </select>
                <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-gray-950/50 border border-gray-800 text-sm rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-cyan-500/50"
                >
                    <option value="All">All Status</option>
                    <option value="Unsolved">Unsolved</option>
                    <option value="Solved">Solved</option>
                </select>
            </div>

            {/* Challenges list grid */}
            {filteredChallenges.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredChallenges.map((c) => (
                        <div 
                            key={c.id} 
                            className={`glass-panel p-6 rounded-xl border relative flex flex-col justify-between h-[320px] transition-all duration-300 ${
                                c.solved 
                                    ? 'border-emerald-500/25 hover:border-emerald-500/50' 
                                    : 'border-gray-800 hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                            }`}
                        >
                            {/* Solve state marker */}
                            {c.solved && (
                                <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/50 px-2 py-0.5 rounded-full font-semibold">
                                    <CheckCircle className="h-3 w-3" /> Solved
                                </div>
                            )}

                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <span className={`text-[10px] border px-2 py-0.5 rounded uppercase font-bold tracking-wider ${getDiffColor(c.difficulty)}`}>
                                        {c.difficulty}
                                    </span>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest bg-gray-900/50 px-2 py-0.5 rounded">{c.category}</span>
                                    {c.docker_image && (
                                        <span className="text-[9px] text-purple-400 uppercase tracking-widest bg-purple-950/30 border border-purple-900/50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                            DYNAMIC
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{c.title}</h3>
                                <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-3">{c.description}</p>
                                
                                {c.tags && c.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {c.tags.slice(0, 3).map((t: string) => (
                                            <span key={t} className="text-[9px] text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded uppercase">{t}</span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-800/80 pt-4 mb-4">
                                    <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-yellow-500" /> {c.points} pts</span>
                                    <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> {c.estimatedTime} mins</span>
                                </div>

                                <Link 
                                    href={`/labs/${c.id}`}
                                    className={`w-full py-2.5 rounded-lg font-bold text-center text-xs flex items-center justify-center gap-1.5 transition-all ${
                                        c.solved 
                                            ? 'bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' 
                                            : 'cyber-btn-cyan text-white'
                                    }`}
                                >
                                    Enter Lab Workspace <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-panel border border-gray-800 rounded-xl py-20 text-center text-gray-500 text-sm">
                    No active challenges found matching your filters.
                </div>
            )}
        </div>
    );
}
