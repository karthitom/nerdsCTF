'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Trophy, Award, Flame, Search, Loader2 } from 'lucide-react';

export default function Leaderboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [board, setBoard] = useState<any[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
        const fetchLeaderboard = async () => {
            try {
                // @ts-ignore
                const { createClient } = await import('@/utils/supabase/client');
                const supabase = createClient();

                const { data: profiles, error: profError } = await supabase
                    .from('profiles')
                    .select('id, username, avatar, country');
                    
                if (profError) throw profError;

                const { data: solves, error: solvesError } = await supabase
                    .from('solves')
                    .select('user_id, challenge_id, challenges(points)');

                if (solvesError) throw solvesError;

                const userPoints: Record<string, number> = {};
                const userSolves: Record<string, number> = {};
                
                solves.forEach((solve: any) => {
                    const points = solve.challenges?.points || 0;
                    userPoints[solve.user_id] = (userPoints[solve.user_id] || 0) + points;
                    userSolves[solve.user_id] = (userSolves[solve.user_id] || 0) + 1;
                });

                const formattedBoard = (profiles || []).map((p: any) => ({
                    id: p.id,
                    username: p.username,
                    avatar: p.avatar,
                    country: p.country || 'N/A',
                    points: userPoints[p.id] || 0,
                    solvedLabs: userSolves[p.id] || 0,
                    streak: 0
                })).sort((a: any, b: any) => b.points - a.points);
                
                setBoard(formattedBoard);
            } catch (error) {
                console.error("Error loading scoreboard", error);
            } finally {
                setPageLoading(false);
            }
        };

        fetchLeaderboard();
    }, [user]);

    const filteredBoard = board.filter(item => 
        item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.country.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading || pageLoading || !user) {
        return (
            <div className="flex-grow flex items-center justify-center font-mono">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
                    <p className="text-sm text-gray-500 uppercase tracking-widest">Compiling Scoreboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 max-w-5xl mx-auto w-full py-10 px-6 font-mono">
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
                        <Trophy className="h-7 w-7 text-cyan-400" /> Global Leaderboard
                    </h1>
                    <p className="text-sm text-gray-400 mt-2">Compare points, solved training labs, and streaks with cyber operators globally.</p>
                </div>
                
                {/* Search query input */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-500" />
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search operator..."
                        className="w-full bg-[#0d1221] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-cyan-500"
                    />
                </div>
            </div>

            {/* Score table */}
            <div className="glass-panel border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-gray-950/40 border-b border-gray-800 text-gray-400 uppercase tracking-widest font-bold">
                                <th className="p-5 text-center">Rank</th>
                                <th className="p-5">Operator</th>
                                <th className="p-5 text-center">Country</th>
                                <th className="p-5 text-center">Streak</th>
                                <th className="p-5 text-center">Solved Labs</th>
                                <th className="p-5 text-right pr-6">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-850">
                            {filteredBoard.map((player, idx) => {
                                const rank = idx + 1;
                                const isTopThree = rank <= 3;
                                return (
                                    <tr 
                                        key={player.id}
                                        className={`hover:bg-cyan-950/5 transition-colors ${
                                            player.username === user.username ? 'bg-cyan-950/10 font-bold border-y border-cyan-800/20' : ''
                                        }`}
                                    >
                                        <td className="p-5 text-center font-bold">
                                            {isTopThree ? (
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full border text-[10px] ${
                                                    rank === 1 ? 'border-yellow-500 text-yellow-500 bg-yellow-950/10' :
                                                    rank === 2 ? 'border-gray-400 text-gray-400 bg-gray-900/10' :
                                                    'border-amber-600 text-amber-600 bg-amber-950/10'
                                                }`}>
                                                    {rank}
                                                </span>
                                            ) : rank}
                                        </td>
                                        
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-cyan-900/40 border border-cyan-700/30 flex items-center justify-center uppercase font-bold text-[9px] text-cyan-400">
                                                    {player.avatar ? <img src={player.avatar} className="w-full h-full rounded-full" alt="Avatar"/> : player.username[0]}
                                                </div>
                                                <span className="text-gray-200">{player.username}</span>
                                            </div>
                                        </td>

                                        <td className="p-5 text-center text-gray-400 uppercase font-semibold">
                                            {player.country}
                                        </td>

                                        <td className="p-5 text-center">
                                            {player.streak > 0 ? (
                                                <span className="inline-flex items-center gap-0.5 text-orange-400 font-semibold">
                                                    <Flame className="h-4 w-4" /> {player.streak}d
                                                </span>
                                            ) : (
                                                <span className="text-gray-600">-</span>
                                            )}
                                        </td>

                                        <td className="p-5 text-center text-gray-400 font-medium">
                                            {player.solvedLabs}
                                        </td>

                                        <td className="p-5 text-right pr-6 text-cyan-400 font-bold text-sm">
                                            {player.points}
                                        </td>
                                    </tr>
                                );
                            })}
                            
                            {filteredBoard.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center text-gray-500">
                                        No players matched current scan criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
