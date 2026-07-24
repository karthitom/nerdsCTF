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
    const [hints, setHints] = useState<any[]>([]);
    const [activeInstance, setActiveInstance] = useState<any>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [flagInput, setFlagInput] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [instanceLoading, setInstanceLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; msg: string, points?: number }>({ type: null, msg: '' });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
        const fetchLabData = async () => {
            try {
                // @ts-ignore
                const { createClient } = await import('@/utils/supabase/client');
                const supabase = createClient();

                // 1. Fetch Challenge Data
                const { data: challenges, error } = await supabase
                    .from('challenges')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error || !challenges) {
                    router.push('/labs');
                    return;
                }

                // 2. Fetch Solves status
                const { data: solves } = await supabase
                    .from('solves')
                    .select('id, points_awarded')
                    .eq('user_id', user.id)
                    .eq('challenge_id', challenges.id)
                    .single();

                setChallenge({
                    ...challenges,
                    estimatedTime: challenges.estimated_time,
                    solved: !!solves,
                    pointsAwarded: solves?.points_awarded
                });

                // 3. Fetch Secure Hints via RPC
                const { data: hintsData } = await supabase.rpc('get_challenge_hints', { p_challenge_id: challenges.id });
                setHints(hintsData || []);

                // 4. Fetch Active Instance
                const { data: instanceData } = await supabase
                    .from('active_instances')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('challenge_id', challenges.id)
                    .single();
                
                setActiveInstance(instanceData || null);

            } catch (err) {
                console.error(err);
                router.push('/labs');
            } finally {
                setPageLoading(false);
            }
        };

        fetchLabData();
    }, [id, user, router]);

    const handleUnlockHint = async (hintId: string, cost: number) => {
        if (!confirm(`This will cost you ${cost} points from the maximum payout. Unlock hint?`)) return;
        
        try {
            // @ts-ignore
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();
            
            const { data, error } = await supabase.rpc('unlock_hint', { p_hint_id: hintId });
            
            if (data?.success) {
                // Update local hints state
                setHints(prev => prev.map(h => 
                    h.id === hintId ? { ...h, is_unlocked: true, hint_text: data.hint } : h
                ));
            } else {
                alert(data?.error || "Failed to unlock hint.");
            }
        } catch (err) {
            console.error("Failed to unlock hint", err);
        }
    };

    const handleToggleInstance = async () => {
        setInstanceLoading(true);
        // This is a stub for the Edge Function that would orchestrate Docker
        try {
            // @ts-ignore
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();

            if (activeInstance) {
                // Stop Instance
                await supabase.from('active_instances').delete().eq('id', activeInstance.id);
                setActiveInstance(null);
            } else {
                // Start Instance (Mock)
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 2); // 2 hours
                
                const { data } = await supabase.from('active_instances').insert({
                    user_id: user.id,
                    challenge_id: challenge.id,
                    endpoint_url: `http://${challenge.docker_image?.split(':')[0] || 'target'}-${user.id.split('-')[0]}.nerdsctf.local:8000`,
                    status: 'active',
                    expires_at: expiresAt.toISOString()
                }).select().single();
                
                setActiveInstance(data);
            }
        } catch (error) {
            console.error("Instance orchestration failed", error);
        } finally {
            setInstanceLoading(false);
        }
    };

    const handleSubmitFlag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!flagInput.trim()) return;

        setSubmitLoading(true);
        setFeedback({ type: null, msg: '' });

        try {
            // @ts-ignore
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();

            const { data, error } = await supabase.rpc('submit_flag', { 
                p_challenge_id: challenge.id, 
                p_flag: flagInput.trim() 
            });
            
            if (error) {
                setFeedback({ type: 'error', msg: error.message || 'Flag verification connection error.' });
            } else if (data?.success) {
                setFeedback({ type: 'success', msg: data.message, points: data.pointsAwarded });
                setChallenge((prev: any) => ({ ...prev, solved: true, pointsAwarded: data.pointsAwarded }));
                setFlagInput('');
            } else {
                setFeedback({ type: 'error', msg: data?.error || 'Incorrect flag submission.' });
            }
        } catch (err: any) {
            setFeedback({ type: 'error', msg: err.message || 'Flag verification connection error.' });
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

    return (
        <div className="flex-1 max-w-6xl mx-auto w-full py-8 px-6 font-mono">
            <Link href="/labs" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-cyan-400 transition-colors mb-6 uppercase tracking-wider">
                <ChevronLeft className="h-4 w-4" /> Back to Labs
            </Link>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Area - Content & Launch */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="glass-panel border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
                        {/* Background glowing effect */}
                        {challenge.solved && <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none rounded-full" />}
                        
                        <div className="flex flex-wrap items-center gap-3 mb-4 z-10 relative">
                            <span className="text-xs bg-cyan-950/20 border border-cyan-900/60 text-cyan-400 px-2.5 py-0.5 rounded uppercase font-bold">
                                {challenge.difficulty}
                            </span>
                            <span className="text-xs text-purple-400 uppercase tracking-wider bg-purple-950/30 px-2 py-0.5 rounded">{challenge.category}</span>
                            {challenge.solved && (
                                <span className="text-xs text-emerald-400 border border-emerald-900/40 bg-emerald-950/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                    <CheckCircle className="h-3 w-3" /> Solved
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide mb-4 z-10 relative">{challenge.title}</h1>
                        <div className="flex gap-2 mb-6 z-10 relative">
                            {(challenge.tags || []).map((t: string) => (
                                <span key={t} className="text-[10px] text-gray-500 bg-gray-900 px-2 py-1 rounded uppercase tracking-wider">{t}</span>
                            ))}
                        </div>

                        <div className="text-gray-300 text-sm leading-relaxed mb-6 bg-gray-950/30 p-5 rounded-lg border border-gray-800/50">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-800/80 pb-2">Briefing</h3>
                            {challenge.description}
                        </div>
                        
                        {challenge.scenario && (
                            <div className="bg-[#080c14] border border-gray-800 rounded-xl p-5 mb-6">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Realistic Scenario</h3>
                                <p className="text-xs text-gray-400 leading-relaxed italic border-l-2 border-purple-500/50 pl-4">{challenge.scenario}</p>
                            </div>
                        )}

                        {challenge.learning_objectives && (
                            <div className="bg-[#080c14] border border-gray-800 rounded-xl p-5 mb-6">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Learning Objectives</h3>
                                <p className="text-xs text-gray-400 leading-relaxed">{challenge.learning_objectives}</p>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3 items-center justify-between text-xs text-gray-500 border-t border-gray-800/80 pt-5">
                            <span className="flex items-center gap-1"><Zap className="h-4 w-4 text-yellow-500" /> Max Points: {challenge.points}</span>
                            <span className="flex items-center gap-1"><Shield className="h-4 w-4" /> Estimated time: {challenge.estimatedTime} mins</span>
                        </div>
                    </div>

                    {/* Launch Sandbox Section (Dynamic Docker logic) */}
                    {challenge.docker_image && (
                        <div className="glass-panel border border-gray-800 rounded-2xl p-6 text-center">
                            <h2 className="text-md font-bold text-white mb-3 uppercase tracking-wider">Dynamic Target Sandbox</h2>
                            <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
                                {activeInstance ? "Your isolated environment is currently running." : "Deploy a dedicated, isolated Docker container to safely attack this target."}
                            </p>
                            
                            <div className="flex flex-col items-center gap-4">
                                <button 
                                    onClick={handleToggleInstance}
                                    disabled={instanceLoading}
                                    className={`px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition-all ${
                                        activeInstance 
                                            ? 'bg-red-950/20 text-red-400 hover:bg-red-950/40 border border-red-900/50'
                                            : 'cyber-btn-cyan text-white'
                                    }`}
                                >
                                    {instanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                    {activeInstance ? 'Terminate Instance' : 'Spawn Target Machine'}
                                </button>
                                
                                {activeInstance && (
                                    <div className="bg-gray-950/50 border border-gray-800 w-full rounded-lg p-4 text-left flex justify-between items-center mt-2">
                                        <div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Target Endpoint</div>
                                            <a href={activeInstance.endpoint_url} target="_blank" rel="noreferrer" className="text-cyan-400 font-bold hover:underline flex items-center gap-1">
                                                {activeInstance.endpoint_url} <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Status</div>
                                            <div className="text-emerald-400 text-xs font-bold uppercase flex items-center gap-1">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> Active
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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
                                <div>
                                    <div className="font-bold mb-1">{feedback.msg}</div>
                                    <div className="text-[10px] text-emerald-500/80">You were awarded {feedback.points} points.</div>
                                </div>
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
                                className="cyber-btn-cyan w-full py-3 rounded-lg font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-all hover:scale-[1.02]"
                            >
                                {submitLoading ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Checking...
                                    </>
                                ) : challenge.solved ? (
                                    <>
                                        <CheckCircle className="h-4 w-4" /> Captured ({challenge.pointsAwarded || challenge.points} pts)
                                    </>
                                ) : (
                                    'Submit Secret Flag'
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Hints Card */}
                    {hints.length > 0 && (
                        <div className="glass-panel border border-gray-800 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-800/80 pb-3">
                                <h2 className="text-md font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <HelpCircle className="h-4 w-4 text-purple-400" /> Intel & Hints
                                </h2>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest">{hints.length} available</span>
                            </div>
                            
                            <p className="text-[10px] text-gray-500 mb-4 leading-relaxed">
                                Need help? Unlocking intel will reduce the total points you earn for completing this challenge.
                            </p>

                            <div className="flex flex-col gap-3">
                                {hints.map((hint: any, index: number) => (
                                    <div key={hint.id} className="border border-gray-800/80 bg-gray-950/30 p-4 rounded-xl flex flex-col gap-2.5 transition-all">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-gray-300">Intel #{index + 1}</span>
                                            {!hint.is_unlocked && !challenge.solved && (
                                                <span className="text-[10px] text-yellow-500 border border-yellow-950 bg-yellow-950/10 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                                                    <AlertTriangle className="h-3 w-3" /> Cost: -{hint.cost} pts
                                                </span>
                                            )}
                                        </div>

                                        {hint.is_unlocked || challenge.solved ? (
                                            <div className="text-[11px] text-gray-300 leading-relaxed font-mono bg-black/40 p-3 rounded border border-gray-800">
                                                {hint.hint_text || "You have completed this challenge, hint fully disclosed."}
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleUnlockHint(hint.id, hint.cost)}
                                                className="w-full border border-purple-900/60 bg-purple-950/10 hover:bg-purple-950/30 text-purple-400 font-bold py-2.5 rounded text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                                            >
                                                Decrypt Intel (-{hint.cost})
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
