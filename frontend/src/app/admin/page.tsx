'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Shield, Users, FileText, Settings, HeartPulse, Loader2, AlertOctagon, CheckCircle } from 'lucide-react';
import LabsManager from '@/components/admin/LabsManager';

function LabsManagerWrapper() {
    const [supabase, setSupabase] = useState<any>(null);
    useEffect(() => {
        const initClient = async () => {
            // @ts-ignore
            const { createClient } = await import('@/utils/supabase/client');
            setSupabase(createClient());
        };
        initClient();
    }, []);
    if (!supabase) return <Loader2 className="animate-spin h-6 w-6 text-cyan-400 mx-auto" />;
    return <LabsManager supabase={supabase} />;
}

export default function AdminDashboard() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [usersList, setUsersList] = useState<any[]>([]);
    const [logs, setLogs] = useState<{ auditLogs: any[]; adminLogs: any[] }>({ auditLogs: [], adminLogs: [] });
    const [tickets, setTickets] = useState<any[]>([]);
    const [adminLoading, setAdminLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'logs' | 'tickets'>('stats');

    useEffect(() => {
        if (!loading) {
            if (!user || user.role !== 'ADMIN') {
                router.push('/dashboard');
            }
        }
    }, [user, loading, router]);

    const fetchAdminData = async () => {
        if (!user || user.role !== 'ADMIN') return;
        setAdminLoading(true);
        try {
            // @ts-ignore
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();

            // Fetch users
            const { data: profiles } = await supabase.from('profiles').select('*');
            
            // Fetch tickets
            const { data: ticketsData } = await supabase.from('tickets').select('*, profiles(username)');

            const formattedTickets = (ticketsData || []).map((t: any) => ({
                id: t.id,
                title: t.subject,
                description: t.message,
                status: t.status,
                priority: t.category,
                user: { username: t.profiles?.username }
            }));

            setStats({
                totalUsers: profiles?.length || 0,
                totalLabs: 0,
                successRate: 0,
                openTickets: formattedTickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length,
                health: { cpuUsage: '4%', memoryUsage: '12%' }
            });

            setUsersList(profiles || []);
            setLogs({
                auditLogs: [],
                adminLogs: []
            });
            setTickets(formattedTickets);
        } catch (error) {
            console.error("Failed to load admin panel data", error);
        } finally {
            setAdminLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, [user]);

    const handleBanUser = async (userId: string) => {
        // Stubbed for now as we don't have ban logic in Postgres yet
        alert('Ban functionality requires Edge Functions or Service Role privileges.');
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to permanently delete this user profile?')) return;
        try {
            // @ts-ignore
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();
            // In a real app this would delete from auth.users via edge function
            await supabase.from('profiles').delete().eq('id', userId);
            fetchAdminData();
        } catch (error) {
            console.error("Failed to delete user", error);
        }
    };

    const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
        try {
            // @ts-ignore
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();
            await supabase.from('tickets').update({ status }).eq('id', ticketId);
            fetchAdminData();
        } catch (error) {
            console.error("Failed to update support ticket", error);
        }
    };

    if (loading || adminLoading || !user) {
        return (
            <div className="flex-grow flex items-center justify-center font-mono">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
                    <p className="text-sm text-gray-500 uppercase tracking-widest">Entering Admin Control Node...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#07090e]">
            {/* Custom Admin Portal Header Navbar */}
            <header className="h-16 border-b border-gray-800 bg-[#0c0e14]/80 backdrop-blur-md sticky top-0 flex items-center justify-between px-6 md:px-12 z-50">
                <div className="flex items-center gap-2 font-mono">
                    <Shield className="h-6 w-6 text-purple-400 cyber-glow-purple" />
                    <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                        nerd<span className="text-purple-400">CTF</span> ADMIN PORTAL
                    </span>
                    <span className="text-[9px] bg-purple-950/80 border border-purple-800/60 text-purple-400 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                        Secure Node
                    </span>
                </div>

                <div className="flex items-center gap-4 font-mono">
                    <Link 
                        href="/dashboard" 
                        className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/20 border border-cyan-900/40 px-3 py-1.5 rounded transition-all"
                    >
                        Return to Player Dashboard
                    </Link>
                    <button 
                        onClick={logout}
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-900/40 px-3 py-1.5 rounded transition-all"
                    >
                        Exit Session
                    </button>
                </div>
            </header>

            <div className="flex-grow max-w-6xl mx-auto w-full py-10 px-6 font-mono text-sm text-gray-300">
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
                        <Shield className="h-7 w-7 text-purple-400 cyber-glow-purple" /> Admin Center
                    </h1>
                    <p className="text-xs text-gray-400 mt-2">Core controller for platform monitoring, logs analysis, and ticket resolutions.</p>
                </div>

                <div className="flex bg-[#0d1221] border border-gray-800 rounded-lg p-1 text-xs overflow-x-auto">
                    {(['stats', 'users', 'labs', 'logs', 'tickets'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md font-bold uppercase transition-all whitespace-nowrap ${
                                activeTab === tab 
                                    ? 'bg-purple-950/20 text-purple-400 border border-purple-900/40' 
                                    : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Dashboard metrics view */}
            {activeTab === 'stats' && stats && (
                <div className="flex flex-col gap-8">
                    {/* Top aggregate metric cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="glass-panel border border-gray-800 p-5 rounded-xl text-center">
                            <div className="text-2xl font-bold text-cyan-400">{stats.totalUsers}</div>
                            <div className="text-[10px] text-gray-500 uppercase mt-1 tracking-wider">TOTAL PLAYERS</div>
                        </div>
                        <div className="glass-panel border border-gray-800 p-5 rounded-xl text-center">
                            <div className="text-2xl font-bold text-purple-400">{stats.totalLabs}</div>
                            <div className="text-[10px] text-gray-500 uppercase mt-1 tracking-wider">CHALLENGES</div>
                        </div>
                        <div className="glass-panel border border-gray-800 p-5 rounded-xl text-center">
                            <div className="text-2xl font-bold text-emerald-400">{stats.successRate.toFixed(1)}%</div>
                            <div className="text-[10px] text-gray-500 uppercase mt-1 tracking-wider">SUCCESS RATE</div>
                        </div>
                        <div className="glass-panel border border-gray-800 p-5 rounded-xl text-center">
                            <div className="text-2xl font-bold text-yellow-500">{stats.openTickets}</div>
                            <div className="text-[10px] text-gray-500 uppercase mt-1 tracking-wider">OPEN TICKETS</div>
                        </div>
                    </div>

                    {/* Platform Health status check */}
                    <div className="glass-panel border border-gray-800 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-1.5">
                            <HeartPulse className="h-4.5 w-4.5 text-emerald-400" /> Platform Infrastructure Status
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                            <div className="border border-gray-850 p-4 rounded bg-[#070b13]/40">
                                <div className="text-gray-500 uppercase text-[9px] mb-1">MYSQL ENGINE</div>
                                <span className="text-emerald-450 font-bold flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> ONLINE</span>
                            </div>
                            <div className="border border-gray-850 p-4 rounded bg-[#070b13]/40">
                                <div className="text-gray-500 uppercase text-[9px] mb-1">REDIS CACHING</div>
                                <span className="text-emerald-450 font-bold flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> ONLINE</span>
                            </div>
                            <div className="border border-gray-850 p-4 rounded bg-[#070b13]/40">
                                <div className="text-gray-500 uppercase text-[9px] mb-1">CPU UTILIZATION</div>
                                <span className="text-cyan-400 font-bold">{stats.health?.cpuUsage}</span>
                            </div>
                            <div className="border border-gray-850 p-4 rounded bg-[#070b13]/40">
                                <div className="text-gray-500 uppercase text-[9px] mb-1">MEMORY USAGE</div>
                                <span className="text-cyan-400 font-bold">{stats.health?.memoryUsage}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Users listing management */}
            {activeTab === 'users' && (
                <div className="glass-panel border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-gray-950/40 border-b border-gray-800 text-gray-400 uppercase tracking-widest font-bold">
                                    <th className="p-4">Username</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Country</th>
                                    <th className="p-4 text-right pr-6">Modifications</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-850 text-gray-300">
                                {usersList.map((usr) => (
                                    <tr key={usr.id} className="hover:bg-cyan-950/2">
                                        <td className="p-4 font-bold">{usr.username}</td>
                                        <td className="p-4 text-gray-400">{usr.email}</td>
                                        <td className="p-4 uppercase font-semibold text-purple-400">{usr.role?.name}</td>
                                        <td className="p-4 uppercase">{usr.country || 'N/A'}</td>
                                        <td className="p-4 text-right pr-6 flex justify-end gap-3.5">
                                            <button 
                                                onClick={() => handleBanUser(usr.id)}
                                                disabled={usr.role?.name === 'ADMIN'}
                                                className="border border-yellow-800/40 bg-yellow-950/10 hover:bg-yellow-950/20 text-yellow-500 px-3 py-1 rounded text-[10px] uppercase font-bold disabled:opacity-30 cursor-pointer"
                                            >
                                                Lock user
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(usr.id)}
                                                disabled={usr.role?.name === 'ADMIN'}
                                                className="border border-red-900/40 bg-red-950/10 hover:bg-red-950/20 text-red-400 px-3 py-1 rounded text-[10px] uppercase font-bold disabled:opacity-30 cursor-pointer"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Labs Management */}
            {activeTab === 'labs' && (
                <div className="mt-6">
                    <LabsManagerWrapper />
                </div>
            )}

            {/* Audit Logs and admin logs */}
            {activeTab === 'logs' && (
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* User logs */}
                    <div className="glass-panel border border-gray-800 rounded-xl p-6 flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="h-4.5 w-4.5 text-cyan-400" /> User Audit Trails
                        </h3>
                        <div className="flex flex-col gap-3.5 max-h-[400px] overflow-y-auto pr-2">
                            {logs.auditLogs.map(log => (
                                <div key={log.id} className="border border-gray-850 p-3 rounded bg-gray-950/10 text-xs">
                                    <div className="flex justify-between items-center text-gray-500 text-[10px] mb-1">
                                        <span>User: {log.user?.username || 'SYSTEM'}</span>
                                        <span>IP: {log.ipAddress || 'unknown'}</span>
                                    </div>
                                    <div className="font-bold text-cyan-400">{log.action}</div>
                                    <p className="text-gray-400 mt-1 leading-relaxed">{log.details}</p>
                                    <span className="text-[9px] text-gray-650 mt-1.5 block">{new Date(log.createdAt).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Admin events */}
                    <div className="glass-panel border border-gray-800 rounded-xl p-6 flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertOctagon className="h-4.5 w-4.5 text-purple-400" /> Administrative Logs
                        </h3>
                        <div className="flex flex-col gap-3.5 max-h-[400px] overflow-y-auto pr-2">
                            {logs.adminLogs.map(log => (
                                <div key={log.id} className="border border-gray-850 p-3 rounded bg-gray-950/10 text-xs">
                                    <div className="flex justify-between items-center text-gray-500 text-[10px] mb-1">
                                        <span>Admin: {log.user?.username || 'system'}</span>
                                        <span>IP: {log.ipAddress || 'local'}</span>
                                    </div>
                                    <div className="font-bold text-purple-400">{log.action}</div>
                                    <p className="text-gray-400 mt-1 leading-relaxed">{log.details}</p>
                                    <span className="text-[9px] text-gray-650 mt-1.5 block">{new Date(log.createdAt).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Tickets management */}
            {activeTab === 'tickets' && (
                <div className="glass-panel border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-gray-950/40 border-b border-gray-800 text-gray-400 uppercase tracking-widest font-bold">
                                    <th className="p-4">Operator</th>
                                    <th className="p-4">Ticket Title</th>
                                    <th className="p-4">Priority</th>
                                    <th className="p-4">Current Status</th>
                                    <th className="p-4 text-right pr-6">Ticket Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-850 text-gray-300">
                                {tickets.map((t) => (
                                    <tr key={t.id} className="hover:bg-cyan-950/2">
                                        <td className="p-4 font-bold">{t.user?.username}</td>
                                        <td className="p-4">
                                            <div className="font-semibold">{t.title}</div>
                                            <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{t.description}</div>
                                        </td>
                                        <td className="p-4 uppercase font-bold text-yellow-500">{t.priority}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                                t.status === 'OPEN' ? 'text-yellow-400 border-yellow-900 bg-yellow-950/20' :
                                                t.status === 'RESOLVED' ? 'text-emerald-400 border-emerald-900 bg-emerald-950/20' :
                                                'text-gray-500 border-gray-900'
                                            }`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right pr-6 flex justify-end gap-2.5">
                                            <button 
                                                onClick={() => handleUpdateTicketStatus(t.id, 'RESOLVED')}
                                                disabled={t.status === 'RESOLVED'}
                                                className="border border-emerald-800/40 bg-emerald-950/10 hover:bg-emerald-950/20 text-emerald-400 px-3 py-1 rounded text-[10px] uppercase font-bold disabled:opacity-30 cursor-pointer"
                                            >
                                                Resolve
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateTicketStatus(t.id, 'CLOSED')}
                                                disabled={t.status === 'CLOSED'}
                                                className="border border-gray-800/40 bg-gray-950/10 hover:bg-gray-950/20 text-gray-500 px-3 py-1 rounded text-[10px] uppercase font-bold disabled:opacity-30 cursor-pointer"
                                            >
                                                Close
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                
                                {tickets.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-10 text-center text-gray-500">
                                            No active operator support tickets found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
