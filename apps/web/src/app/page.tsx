"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Activity, ArrowRight, Brain, Crown, Loader2, Lock, Radar, Sigma, Swords, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import MathBackground from "@/components/ui/MathBackground";
import GlassCard from "@/components/ui/GlassCard";
import PageTransition from "@/components/PageTransition";

const ThreeCanvas = dynamic(() => import("@/components/ThreeCanvas"), { ssr: false });
const FloatingMathScene = dynamic(() => import("@/components/FloatingMathElements"), { ssr: false });

interface LeaderboardEntry {
  id: string;
  userId: string;
  ratingPoint: number;
  tier: string;
  rank: number;
  username: string;
  name: string;
  avatarUrl: string | null;
  isCurrentUser?: boolean;
}

const modes = [
  { title: "Ranked Battle", status: "LIVE", icon: Swords, copy: "Duel 1v1 real-time dengan taruhan rating point.", color: "neon-blue" },
  { title: "Quick Match", status: "FAST", icon: Radar, copy: "Masuk cepat ke arena dan latih refleks numerik.", color: "neon-cyan" },
  { title: "AI Training Arena", status: "SOON", icon: Brain, copy: "Rekomendasi latihan personal berbasis performa.", color: "neon-purple" },
  { title: "Practice Arena", status: "OPEN", icon: Sigma, copy: "Latihan solo dengan feedback dan pembahasan instan.", color: "neon-green" },
  { title: "Tournament Mode", status: "LOCKED", icon: Crown, copy: "Seasonal cup dengan hadiah dan leaderboard khusus.", color: "neon-gold" },
];

const stats = [
  { label: "Total Players", value: "1.2K", accent: "neon-blue" },
  { label: "Battles Played", value: "8.7K", accent: "neon-purple" },
  { label: "Questions Solved", value: "42K", accent: "neon-green" },
  { label: "Online Players", value: "128", accent: "neon-gold" },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export default function Home() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get("/leaderboard/global");
        setEntries(res.data.slice(0, 5));
      } catch (err) {
        console.error("Gagal memuat papan peringkat pratinjau", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    void fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden text-foreground">
      <MathBackground />
      <Navbar />

      <PageTransition>
        <main>
          {/* ── HERO SECTION ─────────────────────────────── */}
          <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-neon-blue/30 bg-neon-blue/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-neon-blue neon-text-blue">
                Real-time duel | AI training | Ranked leaderboard
              </div>
              <h1 className="font-heading text-5xl font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl">
                WHERE NUMBERS
                <span className="mt-2 block bg-gradient-to-r from-neon-blue via-neon-purple to-neon-gold bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,240,255,0.3)]">
                  BECOME LEGENDS
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                Masuki arena matematika kompetitif. Tantang pemain lain secara real-time, kalahkan soal, naikkan rank, dan buktikan bahwa logikamu layak menjadi legenda.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple px-7 text-sm font-black text-white shadow-[0_0_32px_rgba(0,240,255,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_0_44px_rgba(0,240,255,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue"
                >
                  Mulai Bertarung <ArrowRight size={18} />
                </Link>
                <Link
                  href="/leaderboard"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border-soft bg-white/[0.04] px-7 text-sm font-black text-white transition hover:border-neon-blue/50 hover:bg-neon-blue/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue"
                >
                  Lihat Leaderboard <Trophy size={18} />
                </Link>
              </div>
            </motion.div>

            {/* 3D Hero Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative min-h-[420px]"
            >
              {/* 3D Canvas - Floating Math Elements */}
              <div className="absolute inset-0 z-0">
                <ThreeCanvas className="h-full w-full" camera={{ position: [0, 0, 6], fov: 55 }}>
                  <FloatingMathScene />
                </ThreeCanvas>
              </div>

              {/* Decorative rings behind 3D */}
              <div className="absolute inset-0 rounded-full border border-neon-blue/15 bg-neon-blue/5 shadow-[0_0_120px_rgba(0,240,255,0.15)] pointer-events-none" />
              <div className="absolute inset-8 rounded-full border border-neon-purple/15 pointer-events-none" />
              <div className="absolute inset-16 rounded-full border border-dashed border-neon-gold/20 pointer-events-none" />

              {/* Floating info cards */}
              <GlassCard className="absolute left-0 top-10 z-10 max-w-[190px] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neon-blue">Live Formula</p>
                <p className="mt-2 font-mono text-sm text-white">f(x)=x²+7</p>
              </GlassCard>
              <GlassCard className="absolute bottom-8 right-0 z-10 max-w-[210px] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neon-gold">Match Pulse</p>
                <p className="mt-2 text-sm text-slate-200">Speed Strike ready under 3 seconds.</p>
              </GlassCard>
            </motion.div>
          </section>

          {/* ── STATS SECTION ────────────────────────────── */}
          <motion.section
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 pb-12 sm:px-6 lg:grid-cols-4 lg:px-8"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={itemVariants}>
                <GlassCard className="card-shimmer glass-card-hover p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{stat.label}</p>
                  <p className={`mt-2 text-3xl font-black text-${stat.accent}`}>{stat.value}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.section>

          {/* ── GAME MODES SECTION ───────────────────────── */}
          <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="font-heading text-xs font-black uppercase text-neon-blue tracking-[0.2em]">Game Modes</p>
                <h2 className="mt-2 text-3xl font-black text-white">Choose Your Arena</h2>
              </div>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5"
            >
              {modes.map((mode) => {
                const Icon = mode.icon;
                const locked = mode.status === "LOCKED" || mode.status === "SOON";
                return (
                  <motion.div key={mode.title} variants={itemVariants} whileHover={locked ? {} : { scale: 1.03, y: -4 }} whileTap={locked ? {} : { scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                    <GlassCard className={`card-shimmer glass-card-hover p-5 h-full ${locked ? "opacity-60" : ""}`}>
                      <div className="mb-5 flex items-center justify-between">
                        <div className={`grid h-11 w-11 place-items-center rounded-xl border border-${mode.color}/25 bg-${mode.color}/10 text-${mode.color}`}>
                          <Icon size={22} />
                        </div>
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${mode.status === "LIVE" ? "border-neon-green/30 bg-neon-green/10 text-neon-green" : mode.status === "FAST" ? "border-neon-blue/30 bg-neon-blue/10 text-neon-blue" : mode.status === "OPEN" ? "border-neon-green/30 bg-neon-green/10 text-neon-green" : "border-white/10 text-slate-500"}`}>
                          {mode.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white">{mode.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{mode.copy}</p>
                      <div className={`mt-5 text-xs font-black uppercase ${locked ? "text-slate-500" : `text-${mode.color}`}`}>
                        {locked ? "Coming soon" : "Enter mode →"}
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </motion.div>
          </section>

          {/* ── LEADERBOARD + SHOWCASE ───────────────────── */}
          <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <GlassCard className="p-6 h-full">
                <p className="font-heading text-xs font-black uppercase text-neon-purple tracking-[0.2em]">Mathematics Showcase</p>
                <h2 className="mt-2 text-3xl font-black text-white">Holographic Logic Lab</h2>
                <div className="mt-7 grid grid-cols-2 gap-3">
                  {[
                    { name: "Algebra Graph", progress: 75 },
                    { name: "Geometry Grid", progress: 60 },
                    { name: "Calculus Curve", progress: 45 },
                    { name: "Probability Sim", progress: 90 },
                  ].map((panel) => (
                    <div key={panel.name} className="glass-card rounded-xl p-4 transition-all duration-300 hover:border-neon-blue/20">
                      <Activity className="mb-4 text-neon-blue" size={22} />
                      <p className="text-sm font-bold text-white">{panel.name}</p>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-purple"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${panel.progress}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
              <GlassCard className="overflow-hidden p-0 h-full">
                <div className="border-b border-border-soft p-5">
                  <p className="font-heading text-xs font-black uppercase text-neon-gold tracking-[0.2em]">Global Leaderboard</p>
                  <h2 className="mt-2 text-2xl font-black text-white">Top Arena Challengers</h2>
                </div>
                {loading && (
                  <div className="grid place-items-center gap-3 p-10 text-slate-400">
                    <Loader2 className="animate-spin text-neon-blue" />
                    <span className="text-sm">Memuat data papan peringkat...</span>
                  </div>
                )}
                {error && <div className="p-8 text-sm text-red-300">Gagal memuat data papan peringkat global.</div>}
                {!loading && !error && entries.map((entry, idx) => (
                  <motion.div
                    key={entry.id || entry.userId}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                  >
                    <Link
                      href={entry.isCurrentUser ? "/profile" : `/profile/${entry.username}`}
                      className="flex items-center justify-between border-b border-white/5 p-5 transition hover:bg-neon-blue/[0.04]"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`grid h-11 w-11 place-items-center rounded-xl border text-sm font-black ${entry.rank === 1 ? "border-neon-gold/30 bg-neon-gold/15 text-neon-gold neon-glow-gold" : entry.rank === 2 ? "border-slate-400/30 bg-slate-400/10 text-slate-300" : entry.rank === 3 ? "border-amber-600/30 bg-amber-600/10 text-amber-500" : "border-neon-blue/20 bg-neon-blue/10 text-neon-blue"}`}>
                          #{entry.rank}
                        </div>
                        <div>
                          <p className="font-bold text-white">@{entry.username}</p>
                          <p className="text-xs text-slate-500">{entry.tier} Division</p>
                        </div>
                      </div>
                      <p className="font-black text-neon-blue">{entry.ratingPoint} RP</p>
                    </Link>
                  </motion.div>
                ))}
              </GlassCard>
            </motion.div>
          </section>

          {/* ── CTA TOURNAMENT ───────────────────────────── */}
          <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <GlassCard className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center neon-glow-gold">
                <div>
                  <p className="font-heading text-xs font-black uppercase text-neon-gold tracking-[0.2em]">Season Tournament</p>
                  <h2 className="mt-2 text-3xl font-black text-white">Sigma Cup is charging</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                    Turnamen musiman dengan bracket, reward pool, dan badge eksklusif sedang disiapkan.
                  </p>
                </div>
                <button disabled className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-neon-gold/30 bg-neon-gold/10 px-6 text-sm font-black text-neon-gold cursor-not-allowed">
                  <Lock size={17} /> Coming Soon
                </button>
              </GlassCard>
            </motion.div>
          </section>
        </main>

        {/* ── FOOTER ─────────────────────────────────────── */}
        <footer className="border-t border-white/10 bg-bg-deep/70 px-4 py-8 text-sm text-slate-500">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>Math Battle Arena turns logic into competitive power.</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white transition-colors">Rules</a>
              <a href="#" className="hover:text-white transition-colors">Community</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
            </div>
          </div>
        </footer>
      </PageTransition>
    </div>
  );
}
