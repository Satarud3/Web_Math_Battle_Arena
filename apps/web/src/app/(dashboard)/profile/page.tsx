"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  User as UserIcon, Trophy, Activity, Award, Clock, 
  ShieldAlert, Loader2, Play, Swords, TrendingUp, BrainCircuit, ChartNoAxesCombined
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/Navbar";
import AchievementGrid from "@/components/AchievementGrid";
import MathBackground from "@/components/ui/MathBackground";

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
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Memuat data profil...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-bg-main text-white flex flex-col font-sans">
      <MathBackground />
      <Navbar />
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 md:pb-8">
        
        {/* Profile Card Header */}
        <div className="bg-bg-card/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10" />

          {/* Avatar Icon */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-800 border-2 border-indigo-500/30 flex items-center justify-center font-black text-slate-300 text-3xl uppercase overflow-hidden shrink-0">
            {user?.name || user?.username ? (
              <span>{(user.name || user.username || "?").slice(0, 1)}</span>
            ) : <UserIcon className="w-10 h-10 text-slate-400" />}
          </div>

          <div className="text-center md:text-left min-w-0 flex-grow">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center justify-center md:justify-start gap-2.5">
              {user?.name}
            </h2>
            <p className="text-slate-400 mt-1 font-medium text-sm">@{user?.username}</p>
            <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                {user?.role}
              </span>
              {ranking && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
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
                ranking.tier.toLowerCase() === "gold" ? "text-yellow-400" : "text-slate-300"
              }`} />
              <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest mt-1">Tier Saat Ini</div>
              <div className="text-xl font-black text-slate-200 mt-0.5">{ranking.tier}</div>
              <div className="text-sm font-black text-indigo-400 mt-1.5 flex items-center gap-1">
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
          
          <div className="bg-bg-card/60 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Swords className="w-4 h-4 text-indigo-400" />
              Total Match
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-100">{stats?.totalMatches || 0}</div>
            <div className="text-[10px] text-slate-500 mt-1">Pertandingan Dimainkan</div>
          </div>

          <div className="bg-bg-card/60 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              Win Rate
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-100">
              {stats ? parseFloat(stats.winRate).toFixed(1) : "0.0"}%
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Rasio Kemenangan Duel</div>
          </div>

          <div className="bg-bg-card/60 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Akurasi
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-100">
              {stats ? parseFloat(stats.accuracy).toFixed(1) : "0.0"}%
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Rasio Jawaban Benar</div>
          </div>

          <div className="bg-bg-card/60 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Stat Duel
            </div>
            <div className="grid grid-cols-3 text-center text-xs gap-1 mt-1">
              <div className="bg-emerald-500/10 border border-emerald-500/20 py-1 rounded text-emerald-400">
                <span className="block font-black text-sm">{stats?.totalWins || 0}</span>
                W
              </div>
              <div className="bg-red-500/10 border border-red-500/20 py-1 rounded text-red-400">
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

        <section className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-border-soft bg-bg-card/70 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neon-cyan">Performance Trend</p>
                <h3 className="mt-1 text-lg font-black text-white">Arena performance</h3>
              </div>
              <TrendingUp className="h-5 w-5 text-neon-cyan" aria-hidden="true" />
            </div>
            {trendMatches.length ? (
              <svg className="mt-6 h-32 w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Tren skor pertandingan terbaru">
                <defs>
                  <linearGradient id="profile-trend" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--color-neon-cyan)" />
                    <stop offset="100%" stopColor="var(--color-neon-purple)" />
                  </linearGradient>
                </defs>
                <path d="M0,88 H100" stroke="rgba(148,163,184,0.2)" strokeDasharray="3 4" fill="none" />
                <polyline points={trendPath} fill="none" stroke="url(#profile-trend)" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <div className="mt-6 grid h-32 place-items-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500">Belum ada cukup pertandingan untuk menampilkan tren.</div>
            )}
            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500"><span>Match lama</span><span>Match terbaru</span></div>
          </div>

          <div className="rounded-2xl border border-neon-cyan/20 bg-neon-cyan/5 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-neon-cyan/20 bg-neon-cyan/10 text-neon-cyan"><BrainCircuit className="h-5 w-5" aria-hidden="true" /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neon-cyan">Player Insight</p>
                <h3 className="mt-1 text-base font-black text-white">Fokus berikutnya</h3>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-slate-300">{learningFocus}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border-soft bg-bg-card/60 p-3"><ChartNoAxesCombined className="h-4 w-4 text-neon-green" aria-hidden="true" /><p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Akurasi</p><p className="mt-1 text-lg font-black text-white">{stats ? Number(stats.accuracy).toFixed(1) : "0.0"}%</p></div>
              <div className="rounded-xl border border-border-soft bg-bg-card/60 p-3"><Trophy className="h-4 w-4 text-neon-gold" aria-hidden="true" /><p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Rank global</p><p className="mt-1 text-lg font-black text-white">#{ranking?.currentRank || "--"}</p></div>
            </div>
          </div>
        </section>

        {/* Achievements Section */}
        <div className="bg-bg-card/60 backdrop-blur border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8">
          <AchievementGrid />
        </div>

        {/* Match History Section */}
        <div className="bg-bg-card/60 backdrop-blur border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <h3 className="text-lg sm:text-xl font-black text-slate-200 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" /> Riwayat Pertandingan
          </h3>

          <div className="overflow-x-auto">
            {matchHistory.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Hasil</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Lawan</th>
                    <th className="py-3 px-4 text-center">Skor</th>
                    <th className="py-3 px-4 text-center">Jawaban (B/S)</th>
                    <th className="py-3 px-4 text-right">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {matchHistory.map((item) => {
                    const isWin = item.result === "WIN";
                    const isLose = item.result === "LOSE";
                    const isDraw = item.result === "DRAW";
                    
                    let resultBadge = "bg-slate-800 text-slate-400 border-slate-700";
                    if (isWin) resultBadge = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                    if (isLose) resultBadge = "bg-red-500/10 border-red-500/20 text-red-400";
                    if (isDraw) resultBadge = "bg-slate-500/10 border-slate-500/20 text-slate-300";

                    return (
                      <tr key={item.matchId} className="hover:bg-slate-900/20 transition-colors">
                        {/* Result Badge */}
                        <td className="py-4 px-4 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${resultBadge}`}>
                            {item.result || "PRACTICE"}
                          </span>
                        </td>

                        {/* Mode */}
                        <td className="py-4 px-4 font-bold text-xs uppercase tracking-wider text-slate-300">
                          {item.mode === "DUEL" ? (
                            <span className="flex items-center gap-1.5 text-indigo-400">
                              <Swords className="w-3.5 h-3.5" /> Duel 1v1
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-amber-400">
                              <Play className="w-3.5 h-3.5" /> Latihan
                            </span>
                          )}
                        </td>

                        {/* Opponent */}
                        <td className="py-4 px-4 text-slate-300">
                          {item.opponent ? (
                            <Link 
                              href={`/profile/${item.opponent.username}`}
                              className="font-semibold text-slate-200 hover:text-indigo-400 transition-colors hover:underline"
                            >
                              @{item.opponent.username}
                            </Link>
                          ) : (
                            <span className="text-slate-500 font-medium italic text-xs">Practice Mode</span>
                          )}
                        </td>

                        {/* Score */}
                        <td className="py-4 px-4 text-center font-bold text-slate-100">
                          {item.totalScore}
                        </td>

                        {/* Answers ratio */}
                        <td className="py-4 px-4 text-center text-xs">
                          <span className="text-emerald-400 font-semibold">{item.correctCount}</span>
                          <span className="text-slate-500 mx-1">/</span>
                          <span className="text-red-400 font-semibold">{item.wrongCount}</span>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 text-right text-xs text-slate-500 font-medium">
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
    </div>
  );
}
