"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { 
  User as UserIcon, Trophy, Activity, Award, Clock, 
  ShieldAlert, Loader2, Play, Swords, TrendingUp, BrainCircuit, 
  ChartNoAxesCombined, HelpCircle, Edit2, CheckCircle2, XCircle, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/Navbar";
import AchievementGrid from "@/components/AchievementGrid";
import MathBackground from "@/components/ui/MathBackground";
import PageTransition from "@/components/PageTransition";
import ClientDateFormatter from "@/components/ui/ClientDateFormatter";

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

interface AiCoachData {
  recentImprovement: string;
  weakestCategory: string;
  mostImprovedCategory: string;
  recommendedTrainingId: string | null;
  estimatedWinRate: number;
  projectedRank: string;
}

const PRESET_AVATARS = [
  { name: "Cyborg Red", url: "https://api.dicebear.com/7.x/bottts/svg?seed=cyborg_red&colors[]=red" },
  { name: "Neon Matrix", url: "https://api.dicebear.com/7.x/bottts/svg?seed=neon_matrix&colors[]=blue" },
  { name: "Cyber Samurai", url: "https://api.dicebear.com/7.x/bottts/svg?seed=cyber_samurai&colors[]=purple" },
  { name: "Quantum Wizard", url: "https://api.dicebear.com/7.x/bottts/svg?seed=quantum_wizard&colors[]=green" },
  { name: "Cyber Valkyrie", url: "https://api.dicebear.com/7.x/bottts/svg?seed=cyber_valkyrie&colors[]=amber" },
  { name: "Math Gladiator", url: "https://api.dicebear.com/7.x/bottts/svg?seed=math_gladiator&colors[]=pink" },
];

export default function PersonalProfilePage() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile fields state
  const [profileUsername, setProfileUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [tempAvatarUrl, setTempAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Stats tab data
  const [stats, setStats] = useState<UserStats | null>(null);
  const [ranking, setRanking] = useState<Ranking | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);

  // Tab state & AI Coach data
  const [activeTab, setActiveTab] = useState<"stats" | "ai-coach">("stats");
  const [aiCoachData, setAiCoachData] = useState<AiCoachData | null>(null);
  const [loadingCoach, setLoadingCoach] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "ai-coach") {
        setActiveTab("ai-coach");
      }
    }
  }, []);

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

  useEffect(() => {
    if (user) {
      setProfileUsername(user.username);
      setAvatarUrl(user.avatarUrl || null);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "ai-coach" && !aiCoachData) {
      setLoadingCoach(true);
      api.get("/ai-coach/dashboard")
        .then((res) => {
          setAiCoachData(res.data);
        })
        .catch((err) => {
          console.error("Gagal memuat data AI Coach", err);
        })
        .finally(() => {
          setLoadingCoach(false);
        });
    }
  }, [activeTab, aiCoachData]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSaveUsername = async () => {
    if (!tempUsername || tempUsername.trim().length < 3) {
      showToast("Username minimal harus 3 karakter", "error");
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.patch("/users/profile", { username: tempUsername });
      const updatedUser = response.data.user;
      
      // Update Zustand store and local state
      setUser(updatedUser);
      setProfileUsername(updatedUser.username);
      setIsEditingUsername(false);
      showToast("Username berhasil diperbarui!", "success");
    } catch (err: any) {
      console.error("Gagal memperbarui username", err);
      const msg = err.response?.data?.message || "Gagal memperbarui username";
      showToast(Array.isArray(msg) ? msg[0] : msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAvatar = async (selectedUrl: string) => {
    setIsSaving(true);
    try {
      const response = await api.patch("/users/profile", { avatarUrl: selectedUrl });
      const updatedUser = response.data.user;
      
      // Update Zustand store and local state
      setUser(updatedUser);
      setAvatarUrl(updatedUser.avatarUrl || null);
      setIsAvatarModalOpen(false);
      showToast("Foto profil berhasil diperbarui!", "success");
    } catch (err: any) {
      console.error("Gagal memperbarui avatar", err);
      const msg = err.response?.data?.message || "Gagal memperbarui foto profil";
      showToast(Array.isArray(msg) ? msg[0] : msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

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

  // SVG Radial Progress Bar calculation parameters
  const radius = 36;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const estimatedWinRate = aiCoachData?.estimatedWinRate ?? 50;
  const strokeDashoffset = circumference - (estimatedWinRate / 100) * circumference;

  return (
    <div className="relative min-h-[100dvh] bg-bg-main text-white flex flex-col font-sans overflow-x-hidden">
      <MathBackground />
      <Navbar />

      <PageTransition className="flex-grow flex flex-col w-full z-10">
        <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 md:pb-8">
          
          {/* Profile Card Header */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/5 rounded-full blur-3xl -z-10" />

            {/* Avatar Icon with Hover Edit State */}
            <div 
              onClick={() => {
                setTempAvatarUrl(avatarUrl || "");
                setIsAvatarModalOpen(true);
              }}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-neon-blue/30 overflow-hidden shrink-0 shadow-inner group cursor-pointer bg-bg-surface"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-slate-300 text-3xl uppercase font-heading">
                  {(user?.name || user?.username || "?").slice(0, 1)}
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                <Edit2 className="w-4 h-4 text-neon-blue animate-pulse" />
                <span className="text-[9px] font-bold text-white uppercase tracking-wider font-ui">Ubah</span>
              </div>
            </div>

            <div className="text-center md:text-left min-w-0 flex-grow">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center justify-center md:justify-start gap-2.5 font-heading">
                {user?.name}
              </h2>
              
              {/* Interactive Username Edit */}
              {isEditingUsername ? (
                <div className="mt-2 flex items-center justify-center md:justify-start gap-2">
                  <input
                    type="text"
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    className="bg-bg-surface/80 border border-neon-blue/40 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-neon-blue font-ui"
                    placeholder="Username baru"
                    disabled={isSaving}
                  />
                  <button
                    onClick={handleSaveUsername}
                    disabled={isSaving}
                    className="p-2 bg-neon-green/20 border border-neon-green/45 rounded-xl text-neon-green hover:bg-neon-green/30 transition-all cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsEditingUsername(false)}
                    disabled={isSaving}
                    className="p-2 bg-neon-red/20 border border-neon-red/45 rounded-xl text-neon-red hover:bg-neon-red/30 transition-all cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                  <p className="text-slate-400 font-medium text-sm font-ui">@{profileUsername}</p>
                  <button
                    onClick={() => {
                      setTempUsername(profileUsername);
                      setIsEditingUsername(true);
                    }}
                    className="p-1 text-slate-500 hover:text-neon-blue transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

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
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 flex items-center gap-3 text-sm mb-8 font-ui">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TABS SELECTORS */}
          <div className="flex gap-6 border-b border-white/5 mb-8 relative z-15">
            <button
              onClick={() => setActiveTab("stats")}
              className={`pb-4 px-2 text-sm font-black uppercase tracking-wider transition-all relative cursor-pointer font-heading flex items-center gap-2 ${
                activeTab === "stats" ? "text-neon-blue" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Trophy className="w-4 h-4" />
              Statistik & Riwayat
              {activeTab === "stats" && (
                <motion.div layoutId="profileActiveTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("ai-coach")}
              className={`pb-4 px-2 text-sm font-black uppercase tracking-wider transition-all relative cursor-pointer font-heading flex items-center gap-2 ${
                activeTab === "ai-coach" ? "text-neon-purple" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              AI Coach
              {activeTab === "ai-coach" && (
                <motion.div layoutId="profileActiveTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-purple" />
              )}
            </button>
          </div>

          {/* TAB CONTENT RENDER */}
          {activeTab === "stats" ? (
            <div className="animate-fadeIn">
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
                                <ClientDateFormatter dateString={item.playedAt} options={{ day: "2-digit", month: "short", year: "numeric" }} />
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
            </div>
          ) : (
            /* AI COACH TAB CONTENT */
            <div className="animate-fadeIn relative">
              {loadingCoach ? (
                <div className="py-24 flex flex-col justify-center items-center gap-4">
                  <Loader2 className="w-10 h-10 text-neon-purple animate-spin" />
                  <p className="text-slate-400 text-xs font-medium animate-pulse font-ui">Menganalisis performa historis Anda...</p>
                </div>
              ) : aiCoachData ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Cyber Assistant Left Card */}
                  <div className="lg:col-span-5 glass-card rounded-3xl p-6 sm:p-8 border border-neon-purple/20 bg-neon-purple/5 relative overflow-hidden flex flex-col items-center text-center shadow-[0_0_40px_rgba(168,85,247,0.1)]">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-neon-purple/5 rounded-full blur-3xl -z-10" />
                    
                    {/* Floating Assistant Robot Icon */}
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-2xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center text-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.3)] mb-6"
                    >
                      <BrainCircuit className="w-10 h-10" />
                    </motion.div>

                    <h3 className="text-xl font-black text-white font-heading tracking-wide uppercase">AI Coach Assistant</h3>
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-neon-purple/80 mt-1 font-heading">
                      Sistem Evaluasi Matematika Siber
                    </span>

                    <p className="mt-6 text-sm text-slate-300 italic font-ui leading-relaxed bg-bg-surface/50 border border-white/5 p-4 rounded-2xl">
                      &ldquo;{aiCoachData.recentImprovement}&rdquo;
                    </p>

                    <div className="w-full border-t border-white/5 mt-6 pt-6 space-y-4 text-left font-ui">
                      <div className="flex justify-between items-center bg-bg-surface/30 px-4 py-3 rounded-xl border border-white/5">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Kategori Terkuat</span>
                        <span className="text-xs font-black text-neon-green font-heading">{aiCoachData.mostImprovedCategory}</span>
                      </div>
                      <div className="flex justify-between items-center bg-bg-surface/30 px-4 py-3 rounded-xl border border-white/5">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Kategori Terlemah</span>
                        <span className="text-xs font-black text-neon-red font-heading">{aiCoachData.weakestCategory}</span>
                      </div>
                    </div>
                  </div>

                  {/* Projections & Smart Training Right Card */}
                  <div className="lg:col-span-7 space-y-6 w-full">
                    
                    {/* Performance Metrics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* Radial Progress Bar for Win Rate */}
                      <div className="glass-card rounded-3xl p-6 border border-white/5 bg-bg-surface/25 flex flex-col items-center text-center justify-between min-h-[220px]">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-heading">
                          Peluang Menang Duel
                        </span>
                        
                        {/* SVG Circle */}
                        <div className="relative w-24 h-24 flex items-center justify-center my-3">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="48"
                              cy="48"
                              r={radius}
                              stroke="rgba(255,255,255,0.05)"
                              strokeWidth={strokeWidth}
                              fill="transparent"
                            />
                            <circle
                              cx="48"
                              cy="48"
                              r={radius}
                              stroke="var(--color-neon-purple)"
                              strokeWidth={strokeWidth}
                              fill="transparent"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <span className="absolute text-lg font-black text-white font-heading">
                            {estimatedWinRate}%
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-450 font-ui leading-relaxed">
                          Dihitung berdasarkan performa 10 laga terakhir dan tingkat akurasi Anda.
                        </p>
                      </div>

                      {/* Projected Rank Card */}
                      <div className="glass-card rounded-3xl p-6 border border-white/5 bg-bg-surface/25 flex flex-col items-center text-center justify-between min-h-[220px]">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-heading">
                          Proyeksi Peringkat (30 hari)
                        </span>

                        <div className="flex flex-col items-center my-3">
                          <Trophy className="w-12 h-12 text-neon-gold animate-pulse" />
                          <span className="text-2xl font-black text-white font-heading mt-3">
                            {aiCoachData.projectedRank}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-455 font-ui leading-relaxed">
                          Perkiraan peringkat Anda di akhir bulan berdasarkan Win Rate Velocity saat ini.
                        </p>
                      </div>

                    </div>

                    {/* Smart Training Card */}
                    <div className="glass-card rounded-3xl p-6 border border-white/5 bg-bg-surface/30 relative overflow-hidden">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-2xl bg-neon-green/10 border border-neon-green/20 text-neon-green shrink-0">
                          <Play className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-white font-heading uppercase tracking-wide">
                            Rekomendasi Latihan Cerdas
                          </h4>
                          <p className="text-xs text-slate-450 mt-1 font-ui leading-relaxed">
                            AI Coach merekomendasikan Anda untuk melakukan latihan intensif pada kategori terlemah Anda (<b>{aiCoachData.weakestCategory}</b>) untuk mendongkrak performa MMR Anda.
                          </p>
                        </div>
                      </div>

                      {aiCoachData.recommendedTrainingId ? (
                        <Link
                          href={`/practice?category=${aiCoachData.recommendedTrainingId}`}
                          className="w-full mt-6 py-4 bg-gradient-to-r from-neon-green to-emerald-500 hover:shadow-[0_0_24px_rgba(34,197,94,0.3)] text-black font-black rounded-xl transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 font-heading text-sm cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-black" />
                          Mulai Latihan Remedial
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="w-full mt-6 py-4 bg-slate-800 text-slate-500 font-black rounded-xl flex items-center justify-center gap-2 font-heading text-sm cursor-not-allowed border border-white/5"
                        >
                          <HelpCircle className="w-4 h-4" />
                          Latihan Belum Tersedia
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-sm font-medium">
                  Gagal memuat rekomendasi AI Coach. Silakan coba beberapa saat lagi.
                </div>
              )}
            </div>
          )}

        </main>
      </PageTransition>

      {/* CUSTOM EDIT AVATAR MODAL */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAvatarModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-lg rounded-3xl p-6 sm:p-8 relative z-10 border border-white/10 shadow-2xl"
            >
              <h3 className="text-xl font-black text-white font-heading tracking-wide uppercase mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-neon-blue" />
                Ubah Avatar Gladiator
              </h3>

              {/* Preset Avatars Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = tempAvatarUrl === preset.url;
                  return (
                    <div
                      key={preset.name}
                      onClick={() => setTempAvatarUrl(preset.url)}
                      className={`relative aspect-square rounded-2xl bg-bg-surface/50 border-2 cursor-pointer transition-all overflow-hidden p-2 flex items-center justify-center ${
                        isSelected
                          ? "border-neon-blue bg-neon-blue/10 shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                          : "border-white/5 hover:border-white/20"
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-contain" />
                    </div>
                  );
                })}
              </div>

              {/* Custom Avatar Input */}
              <div className="mb-8">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-ui">
                  Atau masukkan URL Foto Kustom
                </label>
                <input
                  type="url"
                  value={tempAvatarUrl}
                  onChange={(e) => setTempAvatarUrl(e.target.value)}
                  placeholder="https://example.com/foto.jpg"
                  className="h-11 w-full rounded-xl border border-white/10 bg-bg-surface/60 px-4 text-sm text-white placeholder-text-muted/50 transition-all focus:border-neon-blue focus:shadow-[0_0_12px_rgba(0,240,255,0.15)] focus:outline-none font-ui"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end font-heading text-sm">
                <button
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleSaveAvatar(tempAvatarUrl)}
                  disabled={isSaving}
                  className="px-6 py-3 bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-[0_0_24px_rgba(0,240,255,0.3)] text-white font-black rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Avatar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl border shadow-2xl flex items-center gap-3 text-sm font-bold font-ui ${
              toast.type === "success"
                ? "bg-neon-green/10 border-neon-green/30 text-neon-green shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                : "bg-neon-red/10 border-neon-red/30 text-neon-red shadow-[0_0_20px_rgba(239,68,68,0.15)]"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
