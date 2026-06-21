"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User as UserIcon, Trophy, Activity, LogOut, Play, Swords, 
  Award, Clock, Target, ShieldAlert, Sparkles, History
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

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

  // Fetch all player data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/users/profile");
        setUser(response.data);
      } catch (err: any) {
        console.error("Failed to fetch profile", err);
        setProfileError("Gagal mengambil profil dasar.");
        // Redirect to login if unauthorized
        if (err.response?.status === 401) {
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
      } catch (err: any) {
        console.error("Failed to fetch stats", err);
        setStatsError("Gagal mengambil statistik peringkat.");
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchRecentMatches = async () => {
      try {
        const response = await api.get("/users/matches/recent");
        setRecentMatches(response.data);
      } catch (err: any) {
        console.error("Failed to fetch matches", err);
        setMatchesError("Gagal mengambil riwayat pertandingan.");
      } finally {
        setLoadingMatches(false);
      }
    };

    fetchProfile();
    fetchStats();
    fetchRecentMatches();
  }, [setUser, logout, router]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      logout();
      router.push("/login");
    }
  };

  const getTierIcon = (tierName: string) => {
    const tier = (tierName || "Bronze").toLowerCase();
    if (tier.includes("gold")) return "👑";
    if (tier.includes("silver")) return "🥈";
    return "🥉";
  };

  const isDataLoading = loadingProfile || loadingStats || loadingMatches;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-[#0E1524]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              ⚔️ MATH BATTLE ARENA
            </span>
            <span className="hidden md:inline px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              PLAYER PANEL
            </span>
          </div>

          <nav className="flex space-x-6 text-sm font-medium">
            <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 transition-colors">
              Dashboard
            </Link>
            <Link href="/leaderboard" className="text-slate-400 hover:text-slate-200 transition-colors">
              Leaderboard
            </Link>
          </nav>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* Welcome Section */}
        {loadingProfile ? (
          <div className="w-full h-32 rounded-2xl bg-[#131A26] animate-pulse border border-slate-800" />
        ) : profileError ? (
          <div className="p-6 bg-red-950/20 border border-red-900/50 rounded-2xl text-red-400 flex items-center gap-3">
            <ShieldAlert size={24} />
            <span>{profileError} Silakan coba refresh halaman.</span>
          </div>
        ) : (
          <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-[#131A26] border border-blue-900/20 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Selamat Datang, {user?.name}!
                </h1>
                <Sparkles className="text-amber-400" size={24} />
              </div>
              <p className="text-slate-400 mt-1">
                Ksatria Matematika: <span className="text-blue-400 font-semibold">@{user?.username}</span> | Email: {user?.email}
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingStats ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-28 rounded-xl bg-[#131A26] animate-pulse border border-slate-800" />
            ))
          ) : statsError ? (
            <div className="col-span-4 p-6 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400 text-sm">
              {statsError}
            </div>
          ) : (
            <>
              {/* Rank Points Card */}
              <div className="p-5 bg-[#131A26] border border-blue-900/10 rounded-xl flex flex-col justify-between hover:border-blue-500/20 transition-all">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Trophy size={14} className="text-amber-400" />
                  Peringkat Tier
                </span>
                <div className="my-2">
                  <div className="text-xl sm:text-2xl font-black text-amber-400 flex items-center gap-1.5">
                    <span>{getTierIcon(ranking?.tier || "Bronze")}</span>
                    <span>{ranking?.tier || "Bronze"}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">{ranking?.ratingPoint || 1000} Rating Point</span>
                </div>
                <span className="text-[10px] text-indigo-400 font-medium">Rank Global: #{ranking?.currentRank || "-"}</span>
              </div>

              {/* Win Rate Card */}
              <div className="p-5 bg-[#131A26] border border-blue-900/10 rounded-xl flex flex-col justify-between hover:border-blue-500/20 transition-all">
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
              </div>

              {/* Accuracy Card */}
              <div className="p-5 bg-[#131A26] border border-blue-900/10 rounded-xl flex flex-col justify-between hover:border-blue-500/20 transition-all">
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
              </div>

              {/* Total Matches Card */}
              <div className="p-5 bg-[#131A26] border border-blue-900/10 rounded-xl flex flex-col justify-between hover:border-blue-500/20 transition-all">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <History size={14} className="text-emerald-400" />
                  Total Match
                </span>
                <div className="my-2">
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {stats?.totalMatches || 0}
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">Pertandingan Dimainkan</span>
                </div>
                <span className="text-[10px] text-slate-500">Duel & Latihan</span>
              </div>
            </>
          )}
        </div>

        {/* Game Mode Area */}
        <div className="bg-[#131A26] border border-slate-800/60 rounded-2xl p-6">
          <h2 className="text-lg font-black text-white mb-4 tracking-tight flex items-center gap-2">
            <Play size={18} className="text-blue-400" />
            Pilih Mode Pertempuran
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Latihan Card */}
            <div 
              onClick={() => alert("Mulai latihan... (Fase 4)")}
              className="p-5 rounded-xl border border-slate-800 bg-[#172030] hover:border-blue-500/40 hover:bg-[#1C273B] transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg mb-3 group-hover:scale-110 transition-transform">
                  🧠
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Mode Latihan</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Asah kemampuan matematika secara solo dengan bank soal pilihan.</p>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold mt-3">MULAI BERMAIN →</span>
            </div>

            {/* Duel 1v1 Card */}
            <div 
              onClick={() => alert("Mencari lawan real-time... (Fase 5)")}
              className="p-5 rounded-xl border border-slate-800 bg-[#172030] hover:border-blue-500/40 hover:bg-[#1C273B] transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg mb-3 group-hover:scale-110 transition-transform">
                  ⚔️
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Duel 1 vs 1</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Bertempur secara real-time satu lawan satu dengan pemain lain.</p>
              </div>
              <span className="text-[10px] text-blue-400 font-bold mt-3">CARI MATCHMAKING →</span>
            </div>

            {/* Battle Royale Card */}
            <div className="p-5 rounded-xl border border-slate-800/40 bg-[#111823] opacity-50 cursor-not-allowed flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-lg mb-3">
                  🌋
                </div>
                <h4 className="text-sm font-bold text-slate-400">Battle Royale</h4>
                <p className="text-xs text-slate-500 mt-1">Bertahan hidup dari rentetan soal matematika dengan puluhan pemain lain.</p>
              </div>
              <span className="text-[10px] text-purple-500 font-semibold mt-3">SEGERA HADIR</span>
            </div>

            {/* Tournament Card */}
            <div className="p-5 rounded-xl border border-slate-800/40 bg-[#111823] opacity-50 cursor-not-allowed flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg mb-3">
                  🏆
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
          <div className="lg:col-span-2 bg-[#131A26] border border-slate-800/60 rounded-2xl p-6 flex flex-col">
            <h3 className="text-base font-bold text-white mb-4 tracking-tight flex items-center gap-2">
              <Clock size={16} className="text-indigo-400" />
              Pertandingan Terbaru
            </h3>

            {loadingMatches ? (
              <div className="space-y-3 flex-grow">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-16 rounded-xl bg-[#0E1524] animate-pulse border border-slate-800/40" />
                ))}
              </div>
            ) : matchesError ? (
              <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400 text-xs">
                {matchesError}
              </div>
            ) : recentMatches.length === 0 ? (
              /* Empty State */
              <div className="flex-grow flex flex-col items-center justify-center py-10 border border-dashed border-slate-800 rounded-xl bg-[#0E1524]/30">
                <span className="text-4xl mb-3">🛡️</span>
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
                      className="flex items-center justify-between p-4 bg-[#0E1524] rounded-xl border border-slate-800/40 hover:border-slate-700 transition-colors"
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
                          {m.correctCount} Benar • {m.wrongCount} Salah
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Static Achievements Column */}
          <div className="bg-[#131A26] border border-slate-800/60 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4 tracking-tight flex items-center gap-2">
              <Award size={16} className="text-amber-400" />
              Pencapaian (Achievements)
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#0E1524]/60 rounded-xl border border-slate-800/30">
                <span className="text-2xl">🥇</span>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white">First Win</div>
                  <p className="text-[10px] text-slate-400">Menang pertama kali dalam mode duel 1v1.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0E1524]/60 rounded-xl border border-slate-800/30">
                <span className="text-2xl">🎯</span>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white">Aritmetika Master</div>
                  <p className="text-[10px] text-slate-400">Menyelesaikan duel dengan akurasi 100%.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0E1524]/20 rounded-xl border border-slate-800/10 opacity-40">
                <span className="text-2xl">🔥</span>
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
      <footer className="border-t border-slate-900 py-5 bg-[#080B13]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          <p>&copy; 2026 Math Battle Arena. Panel Kontrol Pemain. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
