'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Shield, Zap, HelpCircle, ExternalLink, Send, ChevronLeft, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LabWorkspace() {
    const { id } = useParams();
    const { user, loading } = useAuth();
    const router = useRouter();
    const [challenge, setChallenge] = useState<any>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [flagInput, setFlagInput] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });
    const [unlockedHints, setUnlockedHints] = useState<{ [key: number]: string }>({});

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
        const fetchChallenge = async () => {
            try {
                const response = await api.get('/challenges');
                if (response.data?.success) {
                    const list = response.data.challenges || [];
                    const found = list.find((c: any) => String(c.id) === String(id));
                    if (found) {
                        setChallenge(found);
                    } else {
                        router.push('/labs');
                    }
                }
            } catch (err) {
                router.push('/labs');
            } finally {
                setPageLoading(false);
            }
        };

        fetchChallenge();
    }, [id, user, router]);

    const handleUnlockHint = async (hintId: number) => {
        try {
            const response = await api.post('/challenges/hint', { challengeId: challenge.id, hintId });
            if (response.data?.success) {
                setUnlockedHints(prev => ({
                    ...prev,
                    [hintId]: response.data.hint
                }));
            }
        } catch (error: any) {
            console.error("Error unlocking hint", error);
        }
    };

    const handleSubmitFlag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!flagInput.trim()) return;

        setSubmitLoading(true);
        setFeedback({ type: null, msg: '' });

        try {
            const response = await api.post('/challenges/submit', { 
                challengeId: challenge.id, 
                flag: flagInput.trim() 
            });
            
            if (response.data?.success && response.data?.correct) {
                setFeedback({ type: 'success', msg: response.data.message });
                setChallenge((prev: any) => ({ ...prev, solved: true }));
                setFlagInput('');
            } else {
                setFeedback({ type: 'error', msg: response.data?.message || 'Incorrect flag submission.' });
            }
        } catch (err: any) {
            setFeedback({ type: 'error', msg: err.response?.data?.error || 'Flag verification connection error.' });
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading || pageLoading || !challenge) {
        return (
            <div className="flex-grow flex items-center justify-center font-mono">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
                    <p className="text-sm text-gray-500 uppercase tracking-widest">Initializing Environment Node...</p>
                </div>
            </div>
        );
    }

    const labPort = 8000 + challenge.id;
    const targetUrl = `http://localhost:${labPort}`;

    return (
        <div className="flex-1 max-w-6xl mx-auto w-full py-8 px-6 font-mono">
            <Link href="/labs" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-cyan-400 transition-colors mb-6 uppercase tracking-wider">
                <ChevronLeft className="h-4 w-4" /> Back to Labs
            </Link>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Area - Content & Launch */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="glass-panel border border-gray-800 rounded-2xl p-6">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="text-xs bg-cyan-950/20 border border-cyan-900/60 text-cyan-400 px-2.5 py-0.5 rounded uppercase font-bold">
                                {challenge.difficulty}
                            </span>
                            <span className="text-xs text-purple-400 uppercase tracking-wider">{challenge.category}</span>
                            {challenge.solved && (
                                <span className="text-xs text-emerald-400 border border-emerald-900/40 bg-emerald-950/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
                                    <CheckCircle className="h-3 w-3" /> Solved
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide mb-4">{challenge.title}</h1>
                        <p className="text-gray-300 text-sm leading-relaxed mb-6">{challenge.description}</p>
                        
                        <div className="bg-[#080c14] border border-gray-800 rounded-xl p-5 mb-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Learning Objectives</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">{challenge.objectives}</p>
                        </div>

                        <div className="flex flex-wrap gap-3 items-center justify-between text-xs text-gray-500 border-t border-gray-800/80 pt-5">
                            <span className="flex items-center gap-1"><Zap className="h-4 w-4 text-yellow-500" /> {challenge.points} pts rewarded</span>
                            <span className="flex items-center gap-1"><Shield className="h-4 w-4" /> Estimated time: {challenge.estimatedTime} minutes</span>
                        </div>
                    </div>

                    {/* Launch Sandbox Section */}
                    <div className="glass-panel border border-gray-800 rounded-2xl p-6 text-center">
                        <h2 className="text-md font-bold text-white mb-3 uppercase tracking-wider">Active Target Sandbox</h2>
                        <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
                            This challenge runs inside an isolated container. Launch the dashboard to interact with the target server.
                        </p>
                        <a 
                            href={targetUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="cyber-btn-cyan px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
                        >
                            Launch Target Machine <ExternalLink className="h-4 w-4" />
                        </a>
                        <div className="text-[10px] text-gray-600 mt-2.5">
                            Local Endpoint: <span className="underline">{targetUrl}</span>
                        </div>
                    </div>
                </div>

                {/* Right Area - Flags & Hints */}
                <div className="flex flex-col gap-6">
                    {/* Submit Flag */}
                    <div className="glass-panel border border-gray-800 rounded-2xl p-6">
                        <h2 className="text-md font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                            <Send className="h-4 w-4 text-cyan-400" /> Submit Flag
                        </h2>

                        {feedback.type === 'success' && (
                            <div className="flex gap-2.5 items-center bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 p-4 rounded-lg text-xs mb-5">
                                <CheckCircle className="h-4 w-4 shrink-0" />
                                <div>{feedback.msg}</div>
                            </div>
                        )}

                        {feedback.type === 'error' && (
                            <div className="flex gap-2.5 items-center bg-red-950/20 border border-red-900/50 text-red-400 p-4 rounded-lg text-xs mb-5">
                                <XCircle className="h-4 w-4 shrink-0" />
                                <div>{feedback.msg}</div>
                            </div>
                        )}

                        <form onSubmit={handleSubmitFlag} className="flex flex-col gap-4">
                            <input 
                                type="text"
                                required
                                value={flagInput}
                                onChange={(e) => setFlagInput(e.target.value)}
                                disabled={challenge.solved}
                                className="w-full px-4 py-3 bg-[#0d1221] border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 disabled:opacity-50 font-mono"
                                placeholder={challenge.solved ? "Challenge completed" : "nerdCTF{flag_format}"}
                            />
                            <button 
                                type="submit"
                                disabled={submitLoading || challenge.solved}
                                className="cyber-btn-cyan w-full py-3 rounded-lg font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                            >
                                {submitLoading ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Checking...
                                    </>
                                ) : (
                                    'Submit Secret Flag'
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Hints Card */}
                    <div className="glass-panel border border-gray-800 rounded-2xl p-6">
                        <h2 className="text-md font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                            <HelpCircle className="h-4 w-4 text-purple-400" /> Hints System
                        </h2>

                        <div className="flex flex-col gap-4">
                            {challenge.hints && challenge.hints.map((hint: any, index: number) => {
                                const isUnlocked = unlockedHints[hint.id] || challenge.solved;
                                return (
                                    <div key={hint.id} className="border border-gray-800/80 bg-gray-950/30 p-4 rounded-xl flex flex-col gap-2.5">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-gray-300">Hint #{index + 1}</span>
                                            {!isUnlocked && (
                                                <span className="text-[10px] text-yellow-500 border border-yellow-950 bg-yellow-950/10 px-2 py-0.2 rounded font-mono font-semibold">
                                                    Cost: {hint.costPoints} pts
                                                </span>
                                            )}
                                        </div>

                                        {isUnlocked ? (
                                            <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
                                                {unlockedHints[hint.id] || "You have completed this challenge, hint disclosed: Look at the platform solution details."}
                                            </p>
                                        ) : (
                                            <button 
                                                onClick={() => handleUnlockHint(hint.id)}
                                                className="w-full border border-purple-900/60 bg-purple-950/10 hover:bg-purple-950/20 text-purple-400 font-bold py-2 rounded text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                                            >
                                                Unlock Hint
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
