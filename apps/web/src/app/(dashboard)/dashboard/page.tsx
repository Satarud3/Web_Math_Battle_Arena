"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Activity, Play, Swords, Award, Clock, Target, ShieldAlert, Sparkles,
  Brain, RadioTower, Lock, Medal, Flame, Bot, CircleCheckBig, ChevronRight, Gauge, Timer
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import MathBackground from "@/components/ui/MathBackground";
import RankBadge from "@/components/game/RankBadge";
import { getApiStatus } from "@/lib/errors";

interface MatchPlayer {
  userId: string;
  totalScore: number;
  result: string | null;
  user: {
    username: string;
    name: string;
  };
}

interface MatchRecord {
  id: string;
  matchId: string;
  mode: string;
  status: string;
  totalScore: number;
  correctCount: number;
  wrongCount: number;
  avgAnswerTime: string;
  result: "WIN" | "LOSE" | "DRAW" | null;
  joinedAt: string;
  match: {
    id: string;
    mode: string;
    status: string;
    totalQuestions: number;
    winnerUserId: string | null;
    createdAt: string;
    endedAt: string | null;
    matchPlayers: MatchPlayer[];
  };
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
  id: string;
  userId: string;
  ratingPoint: number;
  tier: string;
  currentRank: number | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);

  const [profileError, setProfileError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [ranking, setRanking] = useState<Ranking | null>(null);
  const [recentMatches, setRecentMatches] = useState<MatchRecord[]>([]);

  const answeredToday = Math.min(10, stats?.totalQuestionsAnswered || 0);
  const questAccuracy = Math.min(100, Math.round(Number(stats?.accuracy || 0)));
  const recentResponseTime = recentMatches.length
    ? Math.round(recentMatches.reduce((total, match) => total + Number(match.avgAnswerTime || 0), 0) / recentMatches.length)
    : 0;

  // Fetch all player data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/users/profile");
        setUser(response.data);
      } catch (error: unknown) {
        console.error("Failed to fetch profile", error);
        setProfileError("Gagal mengambil profil dasar.");
        // Redirect to login if unauthorized
        if (getApiStatus(error) === 401) {
          logout();
          router.push("/login");
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await api.get("/users/stats");
        setStats(response.data.userStats);
        setRanking(response.data.ranking);
      } catch (error: unknown) {
        console.error("Failed to fetch stats", error);
        setStatsError("Gagal mengambil statistik peringkat.");
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchRecentMatches = async () => {
      try {
        const response = await api.get("/users/matches/recent");
        setRecentMatches(response.data);
      } catch (error: unknown) {
        console.error("Failed to fetch matches", error);
        setMatchesError("Gagal mengambil riwayat pertandingan.");
      } finally {
        setLoadingMatches(false);
      }
    };

    fetchProfile();
    fetchStats();
    fetchRecentMatches();
  }, [setUser, logout, router]);

  return (
    <div className="min-h-[100dvh] bg-bg-main text-slate-100 flex flex-col font-sans relative">
      <MathBackground />
      {/* Navigation Header */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8 flex flex-col gap-8 relative z-10">
        
        {/* Welcome Section */}
        {loadingProfile ? (
          <div className="w-full h-32 rounded-2xl bg-bg-card animate-pulse border border-slate-800" />
        ) : profileError ? (
          <div className="p-6 bg-red-950/20 border border-red-900/50 rounded-2xl text-red-400 flex items-center gap-3">
            <ShieldAlert size={24} />
            <span>{profileError} Silakan coba refresh halaman.</span>
          </div>
        ) : (
          <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-bg-card border border-blue-900/20 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Selamat Datang, {user?.name}!
                </h1>
                <Sparkles className="text-amber-400" size={24} />
              </div>
              <p className="text-slate-400 mt-1">
                Ksatria Matematika: <Link href="/profile" className="text-blue-400 font-semibold hover:underline">@{user?.username}</Link> | Email: {user?.email}
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => router.push("/duel")}
                className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Swords size={18} />
                <span>Duel 1 vs 1</span>
              </button>
              <button 
                onClick={() => router.push("/practice")}
                className="flex-1 md:flex-none px-6 py-3 bg-[#1B2436] hover:bg-[#232F46] border border-slate-700 text-white text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play size={18} className="text-emerald-400" />
                <span>Mode Latihan</span>
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          animate="show"
        >
          {loadingStats ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-28 rounded-xl bg-bg-card animate-pulse border border-slate-800" />
            ))
          ) : statsError ? (
            <div className="col-span-4 p-6 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400 text-sm">
              {statsError}
            </div>
          ) : (
            <>
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                <RankBadge
                  tier={ranking?.tier || "Bronze"}
                  ratingPoint={ranking?.ratingPoint || 1000}
                  globalRank={ranking?.currentRank}
                />
              </motion.div>

              {/* Win Rate Card */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="p-5 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-xl flex flex-col justify-between hover:border-neon-blue/30 hover:shadow-[0_0_15px_rgba(0,240,255,0.08)] transition-all">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity size={14} className="text-blue-400" />
                  Rasio Kemenangan
                </span>
                <div className="my-2">
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {stats?.winRate || "0.00"}%
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold">{stats?.totalWins || 0} W</span>
                  <span className="text-xs text-slate-500 font-semibold"> / {stats?.totalLosses || 0} L</span>
                </div>
                <span className="text-[10px] text-slate-500">Seri: {stats?.totalDraws || 0} Match</span>
              </motion.div>

              {/* Accuracy Card */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="p-5 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-xl flex flex-col justify-between hover:border-neon-blue/30 hover:shadow-[0_0_15px_rgba(0,240,255,0.08)] transition-all">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Target size={14} className="text-purple-400" />
                  Akurasi Jawaban
                </span>
                <div className="my-2">
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {stats?.accuracy || "0.00"}%
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">{stats?.totalCorrectAnswers || 0} Benar</span>
                </div>
                <span className="text-[10px] text-slate-500">Total {stats?.totalQuestionsAnswered || 0} Soal</span>
              </motion.div>

              {/* Tempo Card */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="p-5 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-xl flex flex-col justify-between hover:border-neon-blue/30 hover:shadow-[0_0_15px_rgba(0,240,255,0.08)] transition-all">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Timer size={14} className="text-emerald-400" />
                  Tempo Rata-rata
                </span>
                <div className="my-2">
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {recentResponseTime ? `${recentResponseTime}s` : "--"}
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">Kecepatan dari match terbaru</span>
                </div>
                <span className="text-[10px] text-slate-500">{stats?.totalMatches || 0} duel dan sesi tercatat</span>
              </motion.div>
            </>
          )}
        </motion.div>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
          <div className="glass-panel rounded-2xl border border-border-soft p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neon-gold">Daily Quest</p>
                <h2 className="mt-1 text-lg font-black text-white">Misi latihan hari ini</h2>
              </div>
              <Gauge className="h-5 w-5 text-neon-gold" aria-hidden="true" />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Selesaikan soal", value: answeredToday, target: 10, color: "bg-neon-cyan" },
                { label: "Mainkan satu duel", value: stats?.totalMatches ? 1 : 0, target: 1, color: "bg-neon-purple" },
                { label: "Raih akurasi", value: questAccuracy, target: 80, color: "bg-neon-green" },
              ].map((quest) => (
                <div key={quest.label} className="rounded-xl border border-border-soft bg-bg-card/60 p-4">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-200">
                    <span>{quest.label}</span>
                    {quest.value >= quest.target && <CircleCheckBig className="h-4 w-4 text-neon-green" aria-label="Quest complete" />}
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
                    <div className={`h-full rounded-full ${quest.color} transition-all duration-700`} style={{ width: `${Math.min(100, (quest.value / quest.target) * 100)}%` }} />
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-slate-400">{quest.value}/{quest.target}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neon-cyan/20 bg-neon-cyan/5 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-neon-cyan/20 bg-neon-cyan/10 text-neon-cyan">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neon-cyan">AI Training Arena</p>
                <h2 className="mt-1 text-base font-black text-white">Sesi yang disarankan</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {questAccuracy >= 80 ? "Pertahankan tempo dengan 10 soal Medium untuk mengejar rank berikutnya." : "Mulai 10 soal Easy atau Medium untuk menguatkan akurasi sebelum duel berikutnya."}
                </p>
              </div>
            </div>
            <button onClick={() => router.push("/practice")} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 px-4 text-sm font-bold text-neon-cyan transition hover:bg-neon-cyan/20">
              Mulai Sesi Rekomendasi
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </section>

        {/* Game Mode Area */}
        <div className="bg-bg-card border border-slate-800/60 rounded-2xl p-6">
          <h2 className="text-lg font-black text-white mb-4 tracking-tight flex items-center gap-2">
            <Play size={18} className="text-blue-400" />
            Pilih Mode Pertempuran
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Latihan Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/practice")}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md hover:border-blue-500/40 transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg mb-3 group-hover:scale-110 transition-transform">
                  <Brain size={18} aria-hidden="true" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Mode Latihan</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Asah kemampuan matematika secara solo dengan bank soal pilihan.</p>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold mt-3">MULAI BERMAIN</span>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/practice")}
              className="p-5 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 hover:border-neon-cyan/40 transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 text-neon-cyan flex items-center justify-center font-bold text-lg mb-3 group-hover:scale-110 transition-transform">
                  <Bot size={18} aria-hidden="true" />
                </div>
                <h4 className="text-sm font-bold text-white">AI Training Arena</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Latihan UI-first dengan rekomendasi sesi berdasarkan statistikmu.</p>
              </div>
              <span className="text-[10px] text-neon-cyan font-bold mt-3">MULAI REKOMENDASI</span>
            </motion.div>

            {/* Duel 1v1 Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/duel")}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md hover:border-blue-500/40 transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg mb-3 group-hover:scale-110 transition-transform">
                  <Swords size={18} aria-hidden="true" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Duel 1 vs 1</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Bertempur secara real-time satu lawan satu dengan pemain lain.</p>
              </div>
              <span className="text-[10px] text-blue-400 font-bold mt-3">CARI MATCHMAKING</span>
            </motion.div>

            {/* Battle Royale Card */}
            <div className="p-5 rounded-xl border border-slate-800/40 bg-bg-card/50 opacity-50 cursor-not-allowed flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-lg mb-3">
                  <RadioTower size={18} aria-hidden="true" />
                </div>
                <h4 className="text-sm font-bold text-slate-400">Battle Royale</h4>
                <p className="text-xs text-slate-500 mt-1">Bertahan hidup dari rentetan soal matematika dengan puluhan pemain lain.</p>
              </div>
              <span className="text-[10px] text-purple-500 font-semibold mt-3">SEGERA HADIR</span>
            </div>

            {/* Tournament Card */}
            <div className="p-5 rounded-xl border border-slate-800/40 bg-bg-card/50 opacity-50 cursor-not-allowed flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg mb-3">
                  <Lock size={18} aria-hidden="true" />
                </div>
                <h4 className="text-sm font-bold text-slate-400">Turnamen Global</h4>
                <p className="text-xs text-slate-500 mt-1">Kejuaraan musiman terjadwal untuk memperebutkan mahkota juara.</p>
              </div>
              <span className="text-[10px] text-amber-500 font-semibold mt-3">SEGERA HADIR</span>
            </div>

          </div>
        </div>

        {/* Lower Row: Match History and Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Match History Column */}
          <div className="lg:col-span-2 bg-bg-card border border-slate-800/60 rounded-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-white mb-4 tracking-tight flex items-center gap-2">
              <Clock size={16} className="text-indigo-400" />
              Pertandingan Terbaru
            </h3>

            {loadingMatches ? (
              <div className="space-y-3 flex-grow">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-16 rounded-xl bg-bg-main animate-pulse border border-slate-800/40" />
                ))}
              </div>
            ) : matchesError ? (
              <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400 text-xs">
                {matchesError}
              </div>
            ) : recentMatches.length === 0 ? (
              /* Empty State */
              <div className="flex-grow flex flex-col items-center justify-center py-10 border border-dashed border-slate-800 rounded-xl bg-bg-card/30">
                <div className="mb-4">
                  <svg width="80" height="80" viewBox="0 0 100 100" className="opacity-50">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeDasharray="5 5" className="animate-[spin_10s_linear_infinite]" />
                    <path d="M50,20 L80,50 L50,80 L20,50 Z" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" className="animate-pulse" />
                    <text x="50" y="55" fontSize="20" fill="var(--color-text-secondary)" textAnchor="middle" fontFamily="monospace">?</text>
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-white">Belum Ada Pertandingan</h4>
                <p className="text-xs text-slate-500 mt-1 text-center max-w-[280px]">
                  Kamu belum memainkan pertandingan apapun. Pilih mode game di atas untuk mulai bertanding!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMatches.map((m) => {
                  const isWinner = m.result === "WIN";
                  const isPractice = m.mode === "PRACTICE";
                  
                  return (
                    <div 
                      key={m.id} 
                      className="flex items-center justify-between p-4 bg-bg-main rounded-xl border border-slate-800/40 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isPractice ? (
                          <span className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-xs border border-emerald-500/20">
                            P
                          </span>
                        ) : isWinner ? (
                          <span className="w-9 h-9 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-xs border border-blue-500/20">
                            W
                          </span>
                        ) : (
                          <span className="w-9 h-9 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center font-black text-xs border border-red-500/20">
                            L
                          </span>
                        )}
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white">
                            {isPractice ? "Latihan Mandiri" : `Duel 1v1 vs ${
                              m.match.matchPlayers.find(p => p.userId !== user?.id)?.user.username || "Lawan"
                            }`}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {new Date(m.joinedAt).toLocaleDateString("id-ID", {
                              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs sm:text-sm font-black ${isWinner ? "text-emerald-400" : isPractice ? "text-slate-300" : "text-red-400"}`}>
                          {m.totalScore} Poin
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {m.correctCount} Benar / {m.wrongCount} Salah
                        </span>
                        <Link href={isPractice ? `/practice/${m.matchId}/result` : `/arena/${m.matchId}/result`} className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-neon-cyan hover:text-white">
                          Detail
                          <ChevronRight className="h-3 w-3" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Static Achievements Column */}
          <div className="bg-bg-card border border-slate-800/60 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4 tracking-tight flex items-center gap-2">
              <Award size={16} className="text-amber-400" />
              Pencapaian (Achievements)
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-bg-card/50 rounded-xl border border-slate-800/30">
                <Medal className="h-6 w-6 text-amber-400" aria-hidden="true" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white">First Win</div>
                  <p className="text-[10px] text-slate-400">Menang pertama kali dalam mode duel 1v1.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-bg-card/50 rounded-xl border border-slate-800/30">
                <Target className="h-6 w-6 text-neon-cyan" aria-hidden="true" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white">Aritmetika Master</div>
                  <p className="text-[10px] text-slate-400">Menyelesaikan duel dengan akurasi 100%.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-bg-card/20 rounded-xl border border-slate-800/10 opacity-40">
                <Flame className="h-6 w-6 text-slate-500" aria-hidden="true" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-400">Streak Legend (Lock)</div>
                  <p className="text-[10px] text-slate-500">Capai kemenangan beruntun sebanyak 5 kali.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-5 bg-bg-main/80 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          <p>&copy; 2026 Math Battle Arena. Panel Kontrol Pemain. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
