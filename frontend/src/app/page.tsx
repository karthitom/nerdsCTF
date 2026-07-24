'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Terminal, Shield, Trophy, BookOpen, ChevronRight, Zap, Target, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
    const { user } = useAuth();

    const features = [
        {
            icon: Shield,
            title: "Security Sandbox Labs",
            desc: "Learn real-world security vulnerabilities like Cookie tampering, Source inspection, HTTP method abuse, and API bypassing in isolated sandboxes."
        },
        {
            icon: BookOpen,
            title: "Cyber Academy",
            desc: "Follow structural learning paths covering Networking, Linux, OWASP Top 10 vulnerabilities, cryptography basics, and Privilege Escalation."
        },
        {
            icon: Trophy,
            title: "Competitive Leaderboard",
            desc: "Climb ranks by solving challenges, maintaining streaks, and competing globally. Gain points to unlock profile badges."
        }
    ];

    const statistics = [
        { label: "Active Users", value: "2,450+" },
        { label: "Practice Labs", value: "5 Core Labs" },
        { label: "Academy Lessons", value: "15+ Modules" },
        { label: "Rankings Checked", value: "Realtime" }
    ];

    const roadmapSteps = [
        { phase: "Phase 1", title: "Fundamentals", desc: "Cookies, HTML sources, basic encoding ciphers, and networking." },
        { phase: "Phase 2", title: "Web & API Security", desc: "API parameter tampering, IDOR, and custom request manipulation." },
        { phase: "Phase 3", title: "Privilege Escalation", desc: "Host privilege abuses, system capabilities, and administrative takeovers." }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <div className="flex-1 flex flex-col font-sans text-gray-300">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center justify-center border-b border-white/5 overflow-hidden py-20 px-6">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>
                
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="max-w-4xl text-center z-10 flex flex-col items-center"
                >
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 border border-cyan-500/30 bg-cyan-950/20 text-cyan-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-8">
                        <Zap className="h-3.5 w-3.5" />
                        NERD CTF v2.0 PLATFORM LAUNCHED
                    </motion.div>
                    
                    <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter mb-8 leading-[1.1]">
                        Master Cybersecurity <br/>
                        Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 cyber-glow-cyan">Interactive Labs</span>
                    </motion.h1>
                    
                    <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
                        Train on realistic Capture The Flag challenges. Stop reading slides, spin up interactive security target sandboxes, exploit vulnerabilities, and capture flags.
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
                        {user ? (
                            <Link href="/dashboard" className="cyber-btn-cyan w-full text-center py-3.5 rounded-lg font-bold flex items-center justify-center gap-2">
                                Go to Dashboard <ArrowRight className="h-4 w-4" />
                            </Link>
                        ) : (
                            <>
                                <Link href="/register" className="cyber-btn-cyan w-full text-center py-3.5 rounded-lg font-medium flex items-center justify-center gap-2">
                                    Start Training Now <ChevronRight className="h-4 w-4" />
                                </Link>
                                <Link href="/login" className="w-full text-center border border-white/10 bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-lg font-medium transition backdrop-blur-sm">
                                    Sign In
                                </Link>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            </section>

            {/* Statistics Row */}
            <section className="border-b border-white/5 py-16 px-6 relative overflow-hidden">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                    {statistics.map((stat, i) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            key={i} 
                            className="text-center"
                        >
                            <div className="text-3xl md:text-5xl font-extrabold text-gradient-purple mb-2">
                                {stat.value}
                            </div>
                            <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Features section */}
            <section className="py-24 px-6 max-w-6xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">Core Training Pillars</h2>
                    <p className="text-gray-400 max-w-xl mx-auto">Everything you need to go from a cybersecurity novice to an industry professional.</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6">
                    {features.map((feat, i) => {
                        const Icon = feat.icon;
                        return (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                key={i} 
                                className="glass-panel glass-panel-hover p-8 rounded-2xl"
                            >
                                <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feat.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* Academy & Roadmap section */}
            <section className="border-t border-b border-white/5 py-32 px-6 relative overflow-hidden">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-1/2 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-flex items-center gap-1.5 border border-purple-500/30 bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
                            <BookOpen className="h-3.5 w-3.5" /> Learning path
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Structured Training Roadmap</h2>
                        <p className="text-gray-400 mb-8 leading-relaxed text-lg">
                            We don't believe in random lists of hacking tools. nerdCTF follows a highly structured pedagogy starting with fundamental browser workings, moving to complex OWASP Top 10 vulnerabilities, and ending with API authorization checks.
                        </p>
                        <Link href="/register" className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                            Explore the academy <ChevronRight className="h-4 w-4" />
                        </Link>
                    </motion.div>

                    <div className="flex flex-col gap-4">
                        {roadmapSteps.map((step, i) => (
                            <motion.div 
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                key={i} 
                                className="flex gap-5 p-6 glass-panel rounded-xl group hover:border-purple-500/30 transition-colors"
                            >
                                <div className="text-sm font-bold text-gradient-purple uppercase tracking-widest mt-1 shrink-0">
                                    {step.phase}
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                                    <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials or terminal command CTA */}
            <section className="py-32 px-6 text-center max-w-4xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="glass-panel p-12 rounded-3xl relative overflow-hidden"
                >
                    <div className="absolute -top-20 -right-20 p-4 opacity-[0.03] rotate-12 pointer-events-none">
                        <Terminal className="w-96 h-96 text-white" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 tracking-tight">Ready to execute?</h2>
                    <p className="text-gray-400 max-w-xl mx-auto mb-10 text-base leading-relaxed">
                        Unlock access to active containers, save your challenge state, and earn credentials that look great on resumes.
                    </p>
                    <Link href="/register" className="cyber-btn-cyan px-10 py-4 rounded-xl text-sm font-bold uppercase tracking-wider inline-flex items-center gap-2">
                        Initialize Account <Target className="h-4 w-4" />
                    </Link>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 px-6 text-center relative z-10">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-sm text-gray-500 font-medium">
                        &copy; 2026 nerdCTF Platform. Developed for premium security learning.
                    </div>
                    <div className="flex gap-8 text-sm text-gray-400 font-medium">
                        <Link href="/support" className="hover:text-white transition-colors">Customer Support</Link>
                        <Link href="/support" className="hover:text-white transition-colors">Report Bug</Link>
                        <Link href="/support" className="hover:text-white transition-colors">Terms of Use</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
