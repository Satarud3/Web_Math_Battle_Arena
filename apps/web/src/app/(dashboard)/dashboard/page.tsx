"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  Activity, Play, Swords, Award, Clock, Target, ShieldAlert, Sparkles,
  Brain, RadioTower, Lock, Bot, CircleCheckBig, ChevronRight, Gauge, Flame,
  BrainCircuit, Loader2, Users, X
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import MathBackground from "@/components/ui/MathBackground";
import RankBadge from "@/components/game/RankBadge";
import AchievementGrid, { type Achievement } from "@/components/AchievementGrid";
import { getApiStatus } from "@/lib/errors";
import PageTransition from "@/components/PageTransition";
import SocialPanel from "@/components/social/SocialPanel";

const ThreeCanvas = dynamic(() => import("@/components/ThreeCanvas"), { ssr: false });
const EnergyCoreSphereScene = dynamic(() => import("@/components/EnergyCoreSphere"), { ssr: false });

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
  currentStreak: number;
  highestStreak: number;
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
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [loadingCoach, setLoadingCoach] = useState(true);

  const [profileError, setProfileError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [ranking, setRanking] = useState<Ranking | null>(null);
  const [recentMatches, setRecentMatches] = useState<MatchRecord[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [aiCoach, setAiCoach] = useState<any | null>(null);
  const [isSocialOpen, setIsSocialOpen] = useState(false);

  const answeredToday = Math.min(10, stats?.totalQuestionsAnswered || 0);
  const questAccuracy = Math.min(100, Math.round(Number(stats?.accuracy || 0)));
  const unlockedAchievementCount = achievements.filter((achievement) => achievement.isUnlocked).length;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/users/profile");
        setUser(response.data);
      } catch (error: unknown) {
        console.error("Failed to fetch profile", error);
        setProfileError("Gagal mengambil profil dasar.");
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

    const fetchAchievements = async () => {
      try {
        const response = await api.get("/achievements/me");
        setAchievements(response.data);
      } catch (error: unknown) {
        console.error("Failed to fetch achievements", error);
      } finally {
        setLoadingAchievements(false);
      }
    };

    const fetchAiCoach = async () => {
      try {
        const response = await api.get("/ai-coach/dashboard");
        setAiCoach(response.data);
      } catch (error: unknown) {
        console.error("Failed to fetch AI Coach", error);
      } finally {
        setLoadingCoach(false);
      }
    };

    fetchProfile();
    fetchStats();
    fetchRecentMatches();
    fetchAchievements();
    fetchAiCoach();
  }, [setUser, logout, router]);

  return (
    <div className="min-h-[100dvh] bg-bg-main text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      <MathBackground />
      <Navbar />

      <PageTransition className="flex-grow flex flex-col w-full z-10">
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8 flex flex-col gap-8">
          
          {/* Welcome Section */}
          {loadingProfile ? (
            <div className="w-full h-32 rounded-2xl bg-bg-surface/40 animate-pulse border border-white/10" />
          ) : profileError ? (
            <div className="p-6 bg-red-950/25 border border-danger/30 rounded-2xl text-red-400 flex items-center gap-3">
              <ShieldAlert size={24} />
              <span>{profileError} Silakan coba refresh halaman.</span>
            </div>
          ) : (
            <div className="relative p-6 sm:p-8 glass-card rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl overflow-hidden neon-glow-blue">
              {/* Energy Core 3D Canvas Background */}
              <div className="absolute right-0 top-0 bottom-0 w-80 pointer-events-none z-0 opacity-80 hidden md:block">
                <ThreeCanvas className="h-full w-full" camera={{ position: [0, 0, 4.5], fov: 60 }}>
                  <EnergyCoreSphereScene />
                </ThreeCanvas>
              </div>

              <div className="relative z-10 max-w-xl">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight">
                    Selamat Datang, {user?.name}!
                  </h1>
                  <Sparkles className="text-neon-gold animate-pulse" size={24} />
                </div>
                <p className="text-slate-400 mt-1">
                  Ksatria Matematika: <Link href="/profile" className="text-neon-blue font-semibold hover:underline">@{user?.username}</Link> | Email: {user?.email}
                </p>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto relative z-10">
                <button 
                  onClick={() => router.push("/duel/choose-mode")}
                  className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-[0_0_24px_rgba(0,240,255,0.3)] text-white text-sm font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  <Swords size={18} />
                  <span>Duel 1 vs 1</span>
                </button>
                <button 
                  onClick={() => router.push("/practice")}
                  className="flex-1 md:flex-none px-6 py-3 bg-bg-surface/80 hover:bg-bg-surface border border-white/10 text-white text-sm font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  <Play size={18} className="text-neon-green" />
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
                <div key={idx} className="h-28 rounded-xl bg-bg-surface/40 animate-pulse border border-white/10" />
              ))
            ) : statsError ? (
              <div className="col-span-4 p-6 bg-red-950/25 border border-danger/30 rounded-xl text-red-400 text-sm">
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
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="p-5 glass-card glass-card-hover rounded-xl flex flex-col justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5 font-ui">
                    <Activity size={14} className="text-neon-blue" />
                    Rasio Kemenangan
                  </span>
                  <div className="my-2">
                    <div className="text-2xl sm:text-3xl font-black text-white font-heading">
                      {stats?.winRate || "0.00"}%
                    </div>
                    <span className="text-xs text-neon-green font-bold">{stats?.totalWins || 0} W</span>
                    <span className="text-xs text-slate-500 font-bold"> / {stats?.totalLosses || 0} L</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-ui">Seri: {stats?.totalDraws || 0} Match</span>
                </motion.div>

                {/* Accuracy Card */}
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="p-5 glass-card glass-card-hover rounded-xl flex flex-col justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5 font-ui">
                    <Target size={14} className="text-neon-purple" />
                    Akurasi Jawaban
                  </span>
                  <div className="my-2">
                    <div className="text-2xl sm:text-3xl font-black text-white font-heading">
                      {stats?.accuracy || "0.00"}%
                    </div>
                    <span className="text-xs text-slate-400 font-bold">{stats?.totalCorrectAnswers || 0} Benar</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-ui">Total {stats?.totalQuestionsAnswered || 0} Soal</span>
                </motion.div>

                {/* Daily Streak Card */}
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="p-5 glass-card glass-card-hover rounded-xl flex flex-col justify-between border border-white/5">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5 font-ui">
                    <Flame size={14} className="text-neon-gold animate-pulse" />
                    Daily Streak
                  </span>
                  <div className="my-2">
                    <div className="text-2xl sm:text-3xl font-black text-white font-heading flex items-baseline gap-1">
                      {stats?.currentStreak || 0}
                      <span className="text-xs text-slate-500 font-bold font-ui"> HARI</span>
                    </div>
                    <span className="text-xs text-slate-450 font-bold font-ui">Pertahankan latihan harianmu!</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-ui">Rekor tertinggi: {stats?.highestStreak || 0} hari</span>
                </motion.div>
              </>
            )}
          </motion.div>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
            {/* Daily Quest Section */}
            <div className="glass-card rounded-2xl p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neon-gold font-heading">Daily Quest</p>
                  <h2 className="mt-1 text-lg font-black text-white font-heading">Misi latihan hari ini</h2>
                </div>
                <Gauge className="h-5 w-5 text-neon-gold" aria-hidden="true" />
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Selesaikan soal", value: answeredToday, target: 10, color: "bg-neon-blue", border: "border-neon-blue/20" },
                  { label: "Mainkan satu duel", value: stats?.totalMatches ? 1 : 0, target: 1, color: "bg-neon-purple", border: "border-neon-purple/20" },
                  { label: "Raih akurasi", value: questAccuracy, target: 80, color: "bg-neon-green", border: "border-neon-green/20" },
                ].map((quest) => (
                  <div key={quest.label} className={`rounded-xl border ${quest.border} bg-bg-surface/30 p-4 flex flex-col justify-between`}>
                    <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-200 font-ui">
                      <span>{quest.label}</span>
                      {quest.value >= quest.target && <CircleCheckBig className="h-4 w-4 text-neon-green" aria-label="Quest complete" />}
                    </div>
                    <div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
                        <div className={`h-full rounded-full ${quest.color} transition-all duration-700`} style={{ width: `${Math.min(100, (quest.value / quest.target) * 100)}%` }} />
                      </div>
                      <p className="mt-2 text-[11px] font-bold text-slate-400 font-heading">{quest.value}/{quest.target}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Coach Quick Insight Card */}
            <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between border border-neon-purple/20 bg-neon-purple/5 shadow-[0_0_20px_rgba(168,85,247,0.05)]">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-neon-purple/25 bg-neon-purple/10 text-neon-purple">
                  <BrainCircuit className="h-5 w-5 animate-pulse" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neon-purple font-heading">AI Coach Active</p>
                    <span className="rounded-full border border-neon-purple/35 bg-neon-purple/20 px-2 py-0.5 text-[9px] font-black uppercase text-neon-purple-300">Sistem Aktif</span>
                  </div>
                  <h2 className="mt-1 text-base font-black text-white font-heading">AI Coach Insight</h2>
                  
                  {loadingCoach ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 font-ui animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menganalisis performa...
                    </div>
                  ) : aiCoach ? (
                    <div className="mt-2 text-xs text-slate-300 space-y-1 font-ui">
                      {aiCoach.recommendedTrainingId ? (
                        <>
                          <p>🎯 Peluang Menang: <span className="font-bold text-neon-purple">{aiCoach.estimatedWinRate}%</span></p>
                          <p>⚠️ Fokus Remedial: <span className="font-bold text-neon-red">{aiCoach.weakestCategory}</span></p>
                        </>
                      ) : (
                        <p className="text-slate-400 italic">{aiCoach.recentImprovement}</p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500 font-ui">Gagal memuat analisis.</p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => router.push("/profile?tab=ai-coach")}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neon-purple/20 bg-neon-purple/10 hover:bg-neon-purple/20 hover:border-neon-purple/30 text-neon-purple text-sm font-black transition-all cursor-pointer"
              >
                <BrainCircuit className="h-4 w-4" aria-hidden="true" />
                Buka AI Coach
              </button>
            </div>
          </section>

          {/* Game Mode Area */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-black text-white mb-4 tracking-tight flex items-center gap-2 font-heading">
              <Play size={18} className="text-neon-blue animate-pulse" />
              Pilih Mode Pertempuran
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Latihan Card */}
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/practice")}
                className="p-5 rounded-xl border border-white/10 bg-bg-surface/30 hover:border-neon-green/30 transition-all cursor-pointer group flex flex-col justify-between min-h-[150px] glass-card-hover"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-neon-green/15 text-neon-green flex items-center justify-center font-bold text-lg mb-3 group-hover:scale-110 transition-transform">
                    <Brain size={18} aria-hidden="true" />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-neon-green transition-colors font-ui">Mode Latihan</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">Asah kemampuan matematika secara solo dengan bank soal pilihan.</p>
                </div>
                <span className="text-[10px] text-neon-green font-bold mt-3 font-heading tracking-wider">MULAI BERMAIN →</span>
              </motion.div>

              {/* AI Coach Card (unlocked) */}
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/profile?tab=ai-coach")}
                className="p-5 rounded-xl border border-white/10 bg-bg-surface/30 hover:border-neon-purple/30 transition-all cursor-pointer group flex flex-col justify-between min-h-[150px] glass-card-hover"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-neon-purple/15 text-neon-purple flex items-center justify-center font-bold text-lg mb-3 group-hover:scale-110 transition-transform">
                    <Bot size={18} aria-hidden="true" />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-neon-purple transition-colors font-ui">AI Coach</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">Analisis kelemahan, rasio kemenangan duel, proyeksi rank, dan rekomendasi latihan.</p>
                </div>
                <span className="text-[10px] text-neon-purple font-bold mt-3 font-heading tracking-wider">BUKA COACH →</span>
              </motion.div>

              {/* Duel 1v1 Card */}
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/duel/choose-mode")}
                className="p-5 rounded-xl border border-white/10 bg-bg-surface/30 hover:border-neon-blue/30 transition-all cursor-pointer group flex flex-col justify-between min-h-[150px] glass-card-hover"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-neon-blue/15 text-neon-blue flex items-center justify-center font-bold text-lg mb-3 group-hover:scale-110 transition-transform">
                    <Swords size={18} aria-hidden="true" />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-neon-blue transition-colors font-ui">Duel 1 vs 1</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">Bertempur secara real-time satu lawan satu dengan pemain lain.</p>
                </div>
                <span className="text-[10px] text-neon-blue font-bold mt-3 font-heading tracking-wider">CARI MATCHMAKING →</span>
              </motion.div>

              {/* Battle Royale Card (locked) */}
              <div className="p-5 rounded-xl border border-white/5 bg-bg-surface/10 opacity-50 cursor-not-allowed flex flex-col justify-between min-h-[150px]">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-neon-purple/10 text-neon-purple flex items-center justify-center font-bold text-lg mb-3">
                    <RadioTower size={18} aria-hidden="true" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-400 font-ui">Battle Royale</h4>
                  <p className="text-xs text-slate-500 mt-1">Bertahan hidup dari rentetan soal matematika dengan puluhan pemain lain.</p>
                </div>
                <span className="text-[10px] text-slate-500 font-bold mt-3 font-heading tracking-wider">SEGERA HADIR</span>
              </div>

              {/* Tournament Card (locked) */}
              <div className="p-5 rounded-xl border border-white/5 bg-bg-surface/10 opacity-50 cursor-not-allowed flex flex-col justify-between min-h-[150px]">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-neon-gold/10 text-neon-gold flex items-center justify-center font-bold text-lg mb-3">
                    <Lock size={18} aria-hidden="true" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-400 font-ui">Turnamen Global</h4>
                  <p className="text-xs text-slate-500 mt-1">Kejuaraan musiman terjadwal untuk memperebutkan mahkota juara.</p>
                </div>
                <span className="text-[10px] text-slate-500 font-bold mt-3 font-heading tracking-wider">SEGERA HADIR</span>
              </div>

            </div>
          </div>

          {/* Lower Row: Match History and Achievements */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Match History Column */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col">
              <h3 className="text-base font-bold text-white mb-4 tracking-tight flex items-center gap-2 font-heading">
                <Clock size={16} className="text-neon-purple" />
                Pertandingan Terbaru
              </h3>

              {loadingMatches ? (
                <div className="space-y-3 flex-grow">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="h-16 rounded-xl bg-bg-surface/20 animate-pulse border border-white/5" />
                  ))}
                </div>
              ) : matchesError ? (
                <div className="p-4 bg-red-950/25 border border-danger/30 rounded-xl text-red-400 text-xs">
                  {matchesError}
                </div>
              ) : recentMatches.length === 0 ? (
                /* Empty State */
                <div className="flex-grow flex flex-col items-center justify-center py-10 border border-dashed border-white/10 rounded-xl bg-bg-surface/10">
                  <div className="mb-4">
                    <svg width="80" height="80" viewBox="0 0 100 100" className="opacity-40">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-neon-blue)" strokeWidth="2" strokeDasharray="5 5" className="animate-[spin_10s_linear_infinite]" />
                      <path d="M50,20 L80,50 L50,80 L20,50 Z" fill="none" stroke="var(--color-neon-purple)" strokeWidth="2" className="animate-pulse" />
                      <text x="50" y="55" fontSize="20" fill="var(--color-text-secondary)" textAnchor="middle" fontFamily="monospace">?</text>
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-white font-ui">Belum Ada Pertandingan</h4>
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
                        className="flex items-center justify-between p-4 bg-bg-surface/20 rounded-xl border border-white/5 hover:border-white/15 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3">
                          {isPractice ? (
                            <span className="w-9 h-9 rounded-full bg-neon-green/10 text-neon-green flex items-center justify-center font-black text-xs border border-neon-green/20 font-heading">
                              P
                            </span>
                          ) : isWinner ? (
                            <span className="w-9 h-9 rounded-full bg-neon-blue/10 text-neon-blue flex items-center justify-center font-black text-xs border border-neon-blue/20 font-heading neon-glow-blue">
                              W
                            </span>
                          ) : (
                            <span className="w-9 h-9 rounded-full bg-neon-red/10 text-neon-red flex items-center justify-center font-black text-xs border border-neon-red/20 font-heading">
                              L
                            </span>
                          )}
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-white font-ui">
                              {isPractice ? "Latihan Mandiri" : `Duel 1v1 vs ${
                                m.match.matchPlayers.find(p => p.userId !== user?.id)?.user.username || "Lawan"
                              }`}
                            </div>
                            <span className="text-[10px] text-slate-500 font-ui">
                              {new Date(m.joinedAt).toLocaleDateString("id-ID", {
                                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs sm:text-sm font-black font-heading ${isWinner ? "text-neon-green" : isPractice ? "text-slate-300" : "text-neon-red"}`}>
                            {m.totalScore} Poin
                          </div>
                          <span className="text-[10px] text-slate-500 font-ui">
                            {m.correctCount} Benar / {m.wrongCount} Salah
                          </span>
                          <div className="mt-1">
                            <Link href={isPractice ? `/practice/${m.matchId}/result` : `/arena/${m.matchId}/result`} className="inline-flex items-center gap-1 text-[10px] font-black text-neon-cyan hover:text-white transition-colors uppercase tracking-wider font-heading">
                              Detail
                              <ChevronRight className="h-3 w-3" aria-hidden="true" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Social Panel & Achievements */}
            <div className="flex flex-col gap-8 lg:col-span-1">
              <div className="hidden lg:block">
                <SocialPanel />
              </div>

              <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-base font-bold tracking-tight text-white font-heading">
                      <Award size={16} className="text-neon-gold animate-pulse" />
                      Pencapaian
                    </h3>
                    <Link href="/profile#achievements" className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-neon-cyan hover:text-white transition-colors font-heading">
                      Lihat Semua
                      <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </div>
                  <AchievementGrid achievements={achievements} loading={loadingAchievements} compact limit={3} showHeader={false} />
                </div>
              </div>
            </div>

          </div>

        </main>
      </PageTransition>

      {/* Mobile Floating Action Button */}
      <button
        onClick={() => setIsSocialOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-45 w-14 h-14 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] border border-neon-blue/45 hover:scale-110 active:scale-95 transition-all cursor-pointer"
        aria-label="Buka panel sosial"
      >
        <Users size={24} />
      </button>

      {/* Mobile Social Drawer (Bottom Sheet) */}
      <AnimatePresence>
        {isSocialOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSocialOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
            />

            {/* Sliding Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-main border-t border-white/10 rounded-t-3xl max-h-[85vh] overflow-y-auto flex flex-col p-4 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]"
            >
              {/* Drawer handle indicator */}
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />

              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black text-slate-450 uppercase tracking-widest">MENU SOSIAL</span>
                <button
                  onClick={() => setIsSocialOpen(false)}
                  className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pb-6">
                <SocialPanel />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-white/5 py-5 bg-bg-main/80 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 font-ui">
          <p>&copy; 2026 Math Battle Arena. Panel Kontrol Pemain. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
