'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Trophy, Award, Calendar, MapPin, CheckCircle, Activity, Loader2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalScore: 0,
        solvedCount: 0,
        totalLabs: 0,
        rank: 0,
        badges: [] as any[],
        categoryProgress: [] as any[]
    });
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;

        const fetchDashboardData = async () => {
            try {
                const chalRes = await api.get('/challenges');
                const challenges = chalRes.data.challenges || [];
                const solved = challenges.filter((c: any) => c.solved);
                const score = solved.reduce((sum: number, c: any) => sum + c.points, 0);

                const categoryMap: { [key: string]: { solved: number; total: number } } = {};
                challenges.forEach((c: any) => {
                    if (!categoryMap[c.category]) {
                        categoryMap[c.category] = { solved: 0, total: 0 };
                    }
                    categoryMap[c.category].total += 1;
                    if (c.solved) {
                        categoryMap[c.category].solved += 1;
                    }
                });

                const chartData = Object.keys(categoryMap).map(cat => ({
                    name: cat,
                    value: categoryMap[cat].solved,
                    total: categoryMap[cat].total
                }));

                const leadRes = await api.get('/leaderboard');
                const leaderboard = leadRes.data.leaderboard || [];
                const myRankIndex = leaderboard.findIndex((item: any) => item.username === user.username);
                const currentRank = myRankIndex !== -1 ? myRankIndex + 1 : leaderboard.length + 1;

                const mockBadges = [
                    { id: 1, name: 'First Blood', desc: 'Solved your first challenge successfully', icon: '🩸', unlocked: solved.length > 0 },
                    { id: 2, name: 'Elite Hacker', desc: 'Reach 500 total points', icon: '🚀', unlocked: score >= 500 },
                    { id: 3, name: 'Academy Scholar', desc: 'Complete all fundamental lessons', icon: '🎓', unlocked: solved.length > 2 }
                ];

                const mockLogs = solved.map((s: any, idx: number) => ({
                    id: idx,
                    action: 'CHALLENGE_SOLVED',
                    details: `Successfully completed challenge: ${s.title}`,
                    createdAt: new Date().toLocaleDateString()
                }));

                setStats({
                    totalScore: score,
                    solvedCount: solved.length,
                    totalLabs: challenges.length,
                    rank: currentRank,
                    badges: mockBadges.filter(b => b.unlocked),
                    categoryProgress: chartData.filter(d => d.value > 0)
                });
                setRecentLogs(mockLogs);
            } catch (err) {
                console.error("Dashboard data load error", err);
            } finally {
                setDataLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    if (loading || dataLoading || !user) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
                    <p className="text-sm text-gray-500 uppercase tracking-widest font-semibold">Accessing Profile Node...</p>
                </motion.div>
            </div>
        );
    }

    const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="flex-1 max-w-6xl mx-auto w-full py-10 px-6 font-sans"
        >
            {/* Header Profile Card */}
            <motion.div variants={itemVariants} className="glass-panel rounded-3xl p-8 mb-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] pointer-events-none rotate-12">
                    <Trophy className="h-64 w-64 text-cyan-500" />
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-8 z-10">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="w-24 h-24 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-4xl shadow-xl overflow-hidden backdrop-blur-md"
                    >
                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="Avatar"/> : user.username[0].toUpperCase()}
                    </motion.div>
                    
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">{user.username}</h1>
                            <span className="text-[10px] text-purple-400 border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                                {user.role}
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1.5 font-medium">{user.email}</p>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 text-xs text-gray-500 mt-5 font-medium">
                            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {user.country || 'Global'}</span>
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" /> 
                                Joined {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center z-10 w-full md:w-auto mt-6 md:mt-0">
                    <motion.div whileHover={{ y: -2 }} className="border border-white/5 bg-white/[0.02] p-5 rounded-2xl backdrop-blur-md">
                        <div className="text-3xl font-extrabold text-white">{stats.totalScore}</div>
                        <div className="text-[10px] text-gray-500 uppercase mt-2 font-bold tracking-widest">POINTS</div>
                    </motion.div>
                    <motion.div whileHover={{ y: -2 }} className="border border-purple-500/20 bg-purple-500/5 p-5 rounded-2xl backdrop-blur-md">
                        <div className="text-3xl font-extrabold text-gradient-purple">#{stats.rank}</div>
                        <div className="text-[10px] text-purple-400/70 uppercase mt-2 font-bold tracking-widest">RANK</div>
                    </motion.div>
                    <motion.div whileHover={{ y: -2 }} className="border border-cyan-500/20 bg-cyan-500/5 p-5 rounded-2xl backdrop-blur-md">
                        <div className="text-3xl font-extrabold text-cyan-400">{stats.solvedCount}/{stats.totalLabs}</div>
                        <div className="text-[10px] text-cyan-400/70 uppercase mt-2 font-bold tracking-widest">SOLVED</div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Dashboard details grid */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left col: Charts & Badges */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    {/* Charts Card */}
                    <motion.div variants={itemVariants} className="glass-panel rounded-3xl p-8">
                        <h2 className="text-sm font-bold text-gray-400 mb-8 uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-cyan-400" /> Solved Categories
                        </h2>
                        
                        {stats.categoryProgress.length > 0 ? (
                            <div className="flex flex-col md:flex-row items-center gap-10">
                                <div className="w-52 h-52">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.categoryProgress}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={65}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {stats.categoryProgress.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(value, name) => [`${value} solved`, name]} 
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex-1 flex flex-col gap-4 w-full">
                                    {stats.categoryProgress.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-3">
                                                <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length], boxShadow: `0 0 10px ${COLORS[idx % COLORS.length]}80` }}></span>
                                                <span className="text-gray-200 font-medium">{item.name}</span>
                                            </div>
                                            <div className="text-gray-500 font-semibold">
                                                {item.value} / {item.total}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 text-center text-gray-500 text-sm font-medium">
                                No solved labs yet. Head over to <a href="/labs" className="text-cyan-400 hover:text-cyan-300 transition-colors">Labs</a> to begin.
                            </div>
                        )}
                    </motion.div>

                    {/* Badges Card */}
                    <motion.div variants={itemVariants} className="glass-panel rounded-3xl p-8">
                        <h2 className="text-sm font-bold text-gray-400 mb-8 uppercase tracking-widest flex items-center gap-2">
                            <Award className="h-4 w-4 text-purple-400" /> Unlocked Badges ({stats.badges.length})
                        </h2>

                        {stats.badges.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                {stats.badges.map((badge) => (
                                    <motion.div 
                                        whileHover={{ y: -3, scale: 1.02 }}
                                        key={badge.id} 
                                        className="border border-white/5 bg-white/[0.02] p-5 rounded-2xl flex items-start gap-4 transition-colors hover:bg-white/[0.04]"
                                    >
                                        <div className="text-4xl filter drop-shadow-lg">{badge.icon}</div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-100 mb-1 leading-tight">{badge.name}</div>
                                            <div className="text-[11px] text-gray-500 leading-snug">{badge.desc}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-gray-500 text-sm font-medium">
                                Solve labs to earn profile achievement badges.
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Right col: Activities feed */}
                <motion.div variants={itemVariants} className="glass-panel rounded-3xl p-8 h-fit">
                    <h2 className="text-sm font-bold text-gray-400 mb-8 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="h-4 w-4 text-emerald-400" /> Recent Solves
                    </h2>

                    {recentLogs.length > 0 ? (
                        <div className="flex flex-col gap-6">
                            {recentLogs.map((log) => (
                                <motion.div 
                                    whileHover={{ x: 4 }}
                                    key={log.id} 
                                    className="border-l-2 border-cyan-500/50 pl-4 py-1 text-sm group"
                                >
                                    <div className="text-gray-300 font-medium group-hover:text-white transition-colors">{log.details}</div>
                                    <div className="text-xs text-gray-500 mt-1.5 font-medium">{log.createdAt}</div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-gray-500 text-sm font-medium">
                            No recent logs. Exploit labs to generate flags.
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}
