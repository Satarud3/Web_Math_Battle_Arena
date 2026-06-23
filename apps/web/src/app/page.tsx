"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Brain, Crown, Loader2, Lock, Radar, Sigma, Swords, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import MathBackground from "@/components/ui/MathBackground";
import GlassCard from "@/components/ui/GlassCard";

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
  { title: "Ranked Battle", status: "LIVE", icon: Swords, copy: "Duel 1v1 real-time dengan taruhan rating point." },
  { title: "Quick Match", status: "FAST", icon: Radar, copy: "Masuk cepat ke arena dan latih refleks numerik." },
  { title: "AI Training Arena", status: "SOON", icon: Brain, copy: "Rekomendasi latihan personal berbasis performa." },
  { title: "Practice Arena", status: "OPEN", icon: Sigma, copy: "Latihan solo dengan feedback dan pembahasan instan." },
  { title: "Tournament Mode", status: "LOCKED", icon: Crown, copy: "Seasonal cup dengan hadiah dan leaderboard khusus." },
];

const stats = [
  { label: "Total Players", value: "1.2K" },
  { label: "Battles Played", value: "8.7K" },
  { label: "Questions Solved", value: "42K" },
  { label: "Online Players", value: "128" },
];

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

      <main>
        <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-neon-cyan">
              Real-time duel | AI training | Ranked leaderboard
            </div>
            <h1 className="font-arena text-5xl font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl">
              WHERE NUMBERS
              <span className="mt-2 block bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple bg-clip-text text-transparent">
                BECOME LEGENDS
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Masuki arena matematika kompetitif. Tantang pemain lain secara real-time, kalahkan soal, naikkan rank, dan buktikan bahwa logikamu layak menjadi legenda.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple px-7 text-sm font-black text-white shadow-[0_0_32px_rgba(59,130,246,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_0_44px_rgba(6,182,212,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan"
              >
                Mulai Bertarung <ArrowRight size={18} />
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border-soft bg-white/[0.04] px-7 text-sm font-black text-white transition hover:border-neon-cyan/50 hover:bg-neon-cyan/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan"
              >
                Lihat Leaderboard <Trophy size={18} />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative min-h-[420px]"
          >
            <div className="absolute inset-0 rounded-full border border-neon-cyan/25 bg-neon-cyan/5 shadow-[0_0_120px_rgba(6,182,212,0.22)]" />
            <div className="absolute inset-8 rounded-full border border-neon-purple/25" />
            <div className="absolute inset-16 rounded-full border border-dashed border-neon-gold/30" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="grid h-56 w-56 place-items-center rounded-[2rem] border border-neon-cyan/40 bg-bg-glass text-8xl font-black text-neon-cyan shadow-[0_0_70px_rgba(6,182,212,0.35)] glass-panel">
                Σ
              </div>
            </div>
            <GlassCard className="absolute left-0 top-10 max-w-[190px] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neon-cyan">Live Formula</p>
              <p className="mt-2 font-mono text-sm text-white">f(x)=x^2+7</p>
            </GlassCard>
            <GlassCard className="absolute bottom-8 right-0 max-w-[210px] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neon-gold">Match Pulse</p>
              <p className="mt-2 text-sm text-slate-200">Speed Strike ready under 3 seconds.</p>
            </GlassCard>
          </motion.div>
        </section>

        <section className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 pb-12 sm:px-6 lg:grid-cols-4 lg:px-8">
          {stats.map((stat) => (
            <GlassCard key={stat.label} className="card-shimmer p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{stat.label}</p>
              <p className="mt-2 text-3xl font-black text-white">{stat.value}</p>
            </GlassCard>
          ))}
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="font-arena text-xs font-black uppercase text-neon-cyan">Game Modes</p>
              <h2 className="mt-2 text-3xl font-black text-white">Choose Your Arena</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const locked = mode.status === "LOCKED" || mode.status === "SOON";
              return (
                <GlassCard key={mode.title} className={`card-shimmer p-5 ${locked ? "opacity-75" : ""}`}>
                  <div className="mb-5 flex items-center justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-xl border border-neon-cyan/25 bg-neon-cyan/10 text-neon-cyan">
                      <Icon size={22} />
                    </div>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-black text-slate-300">
                      {mode.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white">{mode.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{mode.copy}</p>
                  <div className="mt-5 text-xs font-black uppercase text-neon-cyan">
                    {locked ? "Coming soon" : "Enter mode"}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <GlassCard className="p-6">
            <p className="font-arena text-xs font-black uppercase text-neon-pink">Mathematics Showcase</p>
            <h2 className="mt-2 text-3xl font-black text-white">Holographic Logic Lab</h2>
            <div className="mt-7 grid grid-cols-2 gap-3">
              {["Algebra Graph", "Geometry Grid", "Calculus Curve", "Probability Sim"].map((panel) => (
                <div key={panel} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <Activity className="mb-4 text-neon-cyan" size={22} />
                  <p className="text-sm font-bold text-white">{panel}</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple" />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="overflow-hidden p-0">
            <div className="border-b border-border-soft p-5">
              <p className="font-arena text-xs font-black uppercase text-neon-gold">Global Leaderboard</p>
              <h2 className="mt-2 text-2xl font-black text-white">Top Arena Challengers</h2>
            </div>
            {loading && (
              <div className="grid place-items-center gap-3 p-10 text-slate-400">
                <Loader2 className="animate-spin text-neon-cyan" />
                <span className="text-sm">Memuat data papan peringkat...</span>
              </div>
            )}
            {error && <div className="p-8 text-sm text-red-300">Gagal memuat data papan peringkat global.</div>}
            {!loading && !error && entries.map((entry) => (
              <Link
                key={entry.id || entry.userId}
                href={entry.isCurrentUser ? "/profile" : `/profile/${entry.username}`}
                className="flex items-center justify-between border-b border-white/5 p-5 transition hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-xl border border-neon-gold/20 bg-neon-gold/10 text-sm font-black text-neon-gold">
                    #{entry.rank}
                  </div>
                  <div>
                    <p className="font-bold text-white">@{entry.username}</p>
                    <p className="text-xs text-slate-500">{entry.tier} Division</p>
                  </div>
                </div>
                <p className="font-black text-neon-cyan">{entry.ratingPoint} RP</p>
              </Link>
            ))}
          </GlassCard>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <GlassCard className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="font-arena text-xs font-black uppercase text-neon-gold">Season Tournament</p>
              <h2 className="mt-2 text-3xl font-black text-white">Sigma Cup is charging</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                Turnamen musiman dengan bracket, reward pool, dan badge eksklusif sedang disiapkan.
              </p>
            </div>
            <button disabled className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-neon-gold/30 bg-neon-gold/10 px-6 text-sm font-black text-neon-gold">
              <Lock size={17} /> Coming Soon
            </button>
          </GlassCard>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-bg-deep/70 px-4 py-8 text-sm text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p>Math Battle Arena turns logic into competitive power.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white">Rules</a>
            <a href="#" className="hover:text-white">Community</a>
            <a href="#" className="hover:text-white">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
