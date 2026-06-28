"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  User as UserIcon, Trophy, Activity, Award, Clock, 
  ShieldAlert, Loader2, Play, Swords, TrendingUp, BrainCircuit, ChartNoAxesCombined
} from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/Navbar";
import AchievementGrid from "@/components/AchievementGrid";
import MathBackground from "@/components/ui/MathBackground";
import PageTransition from "@/components/PageTransition";

interface MatchRecord {
  matchId: string;
  mode: string;
  status: string;
  totalScore: number;
  correctCount: number;
  wrongCount: number;
  avgAnswerTime: number;
  result: "WIN" | "LOSE" | "DRAW" | null;
  playedAt: string;
  opponent: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
    totalScore: number;
    result: string | null;
  } | null;
}

interface UserStats {
  id: string;
  userId: string;
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  accuracy: string;
  winRate: string;
}

interface Ranking {
  ratingPoint: number;
  tier: string;
  currentRank: number | null;
}

export default function PersonalProfilePage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [ranking, setRanking] = useState<Ranking | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfileData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          api.get("/users/stats"),
          api.get(`/users/${user.id}/match-history`)
        ]);

        setStats(statsRes.data.userStats);
        setRanking(statsRes.data.ranking);
        setMatchHistory(historyRes.data);
      } catch (error: unknown) {
        console.error("Gagal memuat profil", error);
        setError("Gagal memuat statistik dan riwayat tanding.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const getTierGlowClass = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "bronze": return "from-amber-600/10 to-amber-900/5 border-amber-500/20 shadow-[0_0_50px_rgba(217,119,6,0.1)]";
      case "silver": return "from-slate-600/10 to-slate-800/5 border-slate-400/20 shadow-[0_0_50px_rgba(203,213,225,0.1)]";
      case "gold": return "from-yellow-600/10 to-yellow-900/5 border-yellow-500/30 shadow-[0_0_60px_rgba(234,179,8,0.15)]";
      case "platinum": return "from-cyan-600/10 to-cyan-900/5 border-cyan-500/30 shadow-[0_0_70px_rgba(6,182,212,0.2)]";
      case "master": return "from-purple-600/15 to-indigo-950/10 border-purple-500/30 shadow-[0_0_80px_rgba(168,85,247,0.25)]";
      default: return "from-slate-800 to-slate-900 border-slate-800";
    }
  };

  const trendMatches = matchHistory.slice(0, 6).reverse();
  const trendMaxScore = Math.max(1, ...trendMatches.map((match) => match.totalScore));
  const trendPath = trendMatches.map((match, index) => {
    const x = trendMatches.length <= 1 ? 50 : (index / (trendMatches.length - 1)) * 100;
    const y = 88 - (match.totalScore / trendMaxScore) * 68;
    return `${x},${y}`;
  }).join(" ");
  
  const learningFocus = Number(stats?.accuracy || 0) >= 80
    ? "Naikkan tingkat kesulitan untuk menguji konsistensi."
    : "Review jawaban salah terbaru untuk menguatkan ketelitian.";

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-bg-main text-white flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-12 h-12 text-neon-blue animate-spin" />
        <p className="text-slate-400 text-sm font-medium animate-pulse font-ui">Memuat data profil...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-bg-main text-white flex flex-col font-sans overflow-x-hidden">
      <MathBackground />
      <Navbar />

      <PageTransition className="flex-grow flex flex-col w-full z-10">
        <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 md:pb-8">
          
          {/* Profile Card Header */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/5 rounded-full blur-3xl -z-10" />

            {/* Avatar Icon */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-bg-surface border-2 border-neon-blue/30 flex items-center justify-center font-black text-slate-300 text-3xl uppercase overflow-hidden shrink-0 font-heading shadow-inner">
              {user?.name || user?.username ? (
                <span>{(user.name || user.username || "?").slice(0, 1)}</span>
              ) : <UserIcon className="w-10 h-10 text-slate-400" />}
            </div>

            <div className="text-center md:text-left min-w-0 flex-grow">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center justify-center md:justify-start gap-2.5 font-heading">
                {user?.name}
              </h2>
              <p className="text-slate-400 mt-1 font-medium text-sm font-ui">@{user?.username}</p>
              <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neon-blue/10 text-neon-blue border border-neon-blue/20 uppercase tracking-wider font-heading">
                  {user?.role}
                </span>
                {ranking && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/20 uppercase tracking-wider font-heading">
                    Rank #{ranking.currentRank || "Unranked"}
                  </span>
                )}
              </div>
            </div>

            {/* LARGE GLOWING TIER BADGE */}
            {ranking && (
              <div className={`md:ml-auto w-full md:w-auto p-5 rounded-2xl border bg-gradient-to-br flex flex-col items-center justify-center text-center ${getTierGlowClass(ranking.tier)}`}>
                <Award className={`w-10 h-10 ${
                  ranking.tier.toLowerCase() === "master" ? "text-purple-400 animate-pulse" :
                  ranking.tier.toLowerCase() === "platinum" ? "text-cyan-400" :
                  ranking.tier.toLowerCase() === "gold" ? "text-neon-gold" : "text-slate-300"
                }`} />
                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest mt-1 font-ui">Tier Saat Ini</div>
                <div className="text-xl font-black text-slate-200 mt-0.5 font-heading">{ranking.tier}</div>
                <div className="text-sm font-black text-neon-blue mt-1.5 flex items-center gap-1 font-heading">
                  {ranking.ratingPoint} <span className="text-[9px] font-bold text-slate-500">RP</span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 flex items-center gap-3 text-sm mb-8">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            
            <div className="glass-card rounded-2xl p-5 shadow-lg glass-card-hover">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2 font-ui">
                <Swords className="w-4 h-4 text-neon-blue" />
                Total Match
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-100 font-heading">{stats?.totalMatches || 0}</div>
              <div className="text-[10px] text-slate-500 mt-1 font-ui">Pertandingan Dimainkan</div>
            </div>

            <div className="glass-card rounded-2xl p-5 shadow-lg glass-card-hover">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2 font-ui">
                <Trophy className="w-4 h-4 text-neon-gold" />
                Win Rate
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-100 font-heading">
                {stats ? parseFloat(stats.winRate).toFixed(1) : "0.0"}%
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-ui">Rasio Kemenangan Duel</div>
            </div>

            <div className="glass-card rounded-2xl p-5 shadow-lg glass-card-hover">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2 font-ui">
                <Activity className="w-4 h-4 text-neon-green" />
                Akurasi
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-100 font-heading">
                {stats ? parseFloat(stats.accuracy).toFixed(1) : "0.0"}%
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-ui">Rasio Jawaban Benar</div>
            </div>

            <div className="glass-card rounded-2xl p-5 shadow-lg flex flex-col justify-between glass-card-hover">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2 font-ui">
                <Clock className="w-4 h-4 text-neon-purple" />
                Stat Duel
              </div>
              <div className="grid grid-cols-3 text-center text-xs gap-1 mt-1 font-heading">
                <div className="bg-neon-green/10 border border-neon-green/20 py-1 rounded text-neon-green">
                  <span className="block font-black text-sm">{stats?.totalWins || 0}</span>
                  W
                </div>
                <div className="bg-neon-red/10 border border-neon-red/20 py-1 rounded text-neon-red">
                  <span className="block font-black text-sm">{stats?.totalLosses || 0}</span>
                  L
                </div>
                <div className="bg-slate-500/10 border border-slate-500/20 py-1 rounded text-slate-400">
                  <span className="block font-black text-sm">{stats?.totalDraws || 0}</span>
                  D
                </div>
              </div>
            </div>

          </div>

          {/* Performance Insight & Trend Section */}
          <section className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="glass-card rounded-2xl p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neon-blue font-heading">Performance Trend</p>
                  <h3 className="mt-1 text-lg font-black text-white font-heading">Arena performance</h3>
                </div>
                <TrendingUp className="h-5 w-5 text-neon-blue" aria-hidden="true" />
              </div>
              {trendMatches.length ? (
                <div className="relative">
                  <svg className="mt-6 h-32 w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Tren skor pertandingan terbaru">
                    <defs>
                      <linearGradient id="profile-trend" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--color-neon-blue)" />
                        <stop offset="100%" stopColor="var(--color-neon-purple)" />
                      </linearGradient>
                    </defs>
                    <path d="M0,88 H100" stroke="rgba(148,163,184,0.15)" strokeDasharray="3 4" fill="none" />
                    <polyline points={trendPath} fill="none" stroke="url(#profile-trend)" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ) : (
                <div className="mt-6 grid h-32 place-items-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500 font-ui">Belum ada cukup pertandingan untuk menampilkan tren.</div>
              )}
              <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-500 font-ui"><span>Match lama</span><span>Match terbaru</span></div>
            </div>

            <div className="glass-card rounded-2xl p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-neon-blue/20 bg-neon-blue/10 text-neon-blue"><BrainCircuit className="h-5 w-5" aria-hidden="true" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neon-blue font-heading">Player Insight</p>
                  <h3 className="mt-1 text-base font-black text-white font-heading">Fokus berikutnya</h3>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-slate-300 font-ui">{learningFocus}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/5 bg-bg-surface/35 p-3">
                  <ChartNoAxesCombined className="h-4 w-4 text-neon-green" aria-hidden="true" />
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-ui">Akurasi</p>
                  <p className="mt-1 text-lg font-black text-white font-heading">{stats ? Number(stats.accuracy).toFixed(1) : "0.0"}%</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-bg-surface/35 p-3">
                  <Trophy className="h-4 w-4 text-neon-gold" aria-hidden="true" />
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-ui">Rank global</p>
                  <p className="mt-1 text-lg font-black text-white font-heading">#{ranking?.currentRank || "--"}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Achievements Section */}
          <div id="achievements" className="scroll-mt-24 glass-card rounded-3xl p-6 sm:p-8 shadow-2xl mb-8">
            <AchievementGrid />
          </div>

          {/* Match History Section */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg sm:text-xl font-black text-slate-200 mb-6 flex items-center gap-2 font-heading">
              <Clock className="w-5 h-5 text-neon-purple" /> Riwayat Pertandingan
            </h3>

            <div className="overflow-x-auto">
              {matchHistory.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 font-ui">
                      <th className="py-3 px-4">Hasil</th>
                      <th className="py-3 px-4">Mode</th>
                      <th className="py-3 px-4">Lawan</th>
                      <th className="py-3 px-4 text-center">Skor</th>
                      <th className="py-3 px-4 text-center">Jawaban (B/S)</th>
                      <th className="py-3 px-4 text-right">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm font-ui">
                    {matchHistory.map((item) => {
                      const isWin = item.result === "WIN";
                      const isLose = item.result === "LOSE";
                      const isDraw = item.result === "DRAW";
                      
                      let resultBadge = "bg-slate-800 text-slate-450 border-white/5";
                      if (isWin) resultBadge = "bg-neon-green/10 border-neon-green/20 text-neon-green font-heading";
                      if (isLose) resultBadge = "bg-neon-red/10 border-neon-red/20 text-neon-red font-heading";
                      if (isDraw) resultBadge = "bg-slate-500/10 border-slate-500/20 text-slate-300 font-heading";

                      return (
                        <tr key={item.matchId} className="hover:bg-bg-surface/20 transition-colors">
                          {/* Result Badge */}
                          <td className="py-4 px-4 font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${resultBadge}`}>
                              {item.result || "PRACTICE"}
                            </span>
                          </td>

                          {/* Mode */}
                          <td className="py-4 px-4 font-bold text-xs uppercase tracking-wider text-slate-300">
                            {item.mode === "DUEL" ? (
                              <span className="flex items-center gap-1.5 text-neon-blue">
                                <Swords className="w-3.5 h-3.5" /> Duel 1v1
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-neon-gold">
                                <Play className="w-3.5 h-3.5" /> Latihan
                              </span>
                            )}
                          </td>

                          {/* Opponent */}
                          <td className="py-4 px-4 text-slate-300">
                            {item.opponent ? (
                              <Link 
                                href={`/profile/${item.opponent.username}`}
                                className="font-semibold text-slate-200 hover:text-neon-blue transition-colors hover:underline"
                              >
                                @{item.opponent.username}
                              </Link>
                            ) : (
                              <span className="text-slate-500 font-medium italic text-xs">Practice Mode</span>
                            )}
                          </td>

                          {/* Score */}
                          <td className="py-4 px-4 text-center font-bold text-slate-100 font-heading">
                            {item.totalScore}
                          </td>

                          {/* Answers ratio */}
                          <td className="py-4 px-4 text-center text-xs font-heading">
                            <span className="text-neon-green font-semibold">{item.correctCount}</span>
                            <span className="text-slate-500 mx-1">/</span>
                            <span className="text-neon-red font-semibold">{item.wrongCount}</span>
                          </td>

                          {/* Date */}
                          <td className="py-4 px-4 text-right text-xs text-slate-500 font-medium font-ui">
                            {new Date(item.playedAt).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 text-slate-500 text-sm font-medium">
                  Belum ada riwayat pertandingan yang tercatat.
                </div>
              )}
            </div>
          </div>

        </main>
      </PageTransition>
    </div>
  );
}
