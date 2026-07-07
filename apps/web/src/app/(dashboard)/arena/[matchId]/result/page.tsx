"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Home, Swords, Clock, Target, Award, AlertCircle, Activity } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/lib/errors";

interface PlayerDuelResult {
  userId: string;
  username: string;
  name: string;
  totalScore: number;
  correctCount: number;
  wrongCount: number;
  avgAnswerTime: number;
  result: "WIN" | "LOSE" | "DRAW";
  mmrChange: number;
}

interface DuelResultData {
  matchId: string;
  winnerUserId: string | null;
  startedAt: string;
  endedAt: string;
  totalQuestions?: number;
  players: PlayerDuelResult[];
}

export default function DuelResultPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DuelResultData | null>(null);

  useEffect(() => {
    const fetchDuelResult = async () => {
      try {
        const response = await api.get(`/game/duel/${matchId}/result`);
        setResult(response.data);
      } catch (error: unknown) {
        console.error("Gagal mengambil hasil duel:", error);
        setError(getApiErrorMessage(error, "Gagal memuat hasil duel. Pastikan pertandingan telah selesai."));
      } finally {
        setLoading(false);
      }
    };

    fetchDuelResult();
  }, [matchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col justify-center items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Menghitung skor pertandingan...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col justify-center items-center p-6 text-center">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 mb-6 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
          <p className="text-sm font-semibold">{error || "Data tidak ditemukan."}</p>
        </div>
        <button
          onClick={() => router.push("/duel/choose-mode")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl shadow-lg transition-all duration-200"
        >
          Kembali ke Duel Setup
        </button>
      </div>
    );
  }

  // Find user and opponent profiles
  const myId = user?.id || "";
  const me = result.players.find((p) => p.userId === myId) || result.players[0];
  const opponent = result.players.find((p) => p.userId !== myId) || result.players[1];

  const isWin = me.result === "WIN";
  const isLose = me.result === "LOSE";

  const getOutcomeDetails = () => {
    if (isWin) {
      return {
        title: "Kemenangan Mutlak!",
        desc: "Luar biasa! Otak jeniusmu berhasil mendominasi arena duel ini.",
        colorClass: "from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-400 shadow-emerald-500/10",
        ratingText: `+${me.mmrChange} RP`,
        ratingColor: "text-emerald-400",
        badge: "VICTORY",
      };
    }
    if (isLose) {
      return {
        title: "Kekalahan Terhormat",
        desc: "Jangan patah semangat! Evaluasi kesalahanmu dan bersiap untuk duel berikutnya.",
        colorClass: "from-rose-500/20 to-slate-900/10 border-rose-500/30 text-rose-400 shadow-rose-500/10",
        ratingText: `${me.mmrChange} RP`,
        ratingColor: "text-rose-400",
        badge: "DEFEAT",
      };
    }
    return {
      title: "Hasil Imbang!",
      desc: "Pertandingan yang sangat sengit. Kekuatan kalian berdua benar-benar seimbang.",
      colorClass: "from-slate-800/80 to-slate-950/20 border-slate-700/60 text-slate-400 shadow-slate-500/5",
      ratingText: "+0 RP",
      ratingColor: "text-slate-400",
      badge: "DRAW",
    };
  };

  const outcome = getOutcomeDetails();

  const formatTime = (secs: number) => {
    return `${secs.toFixed(1)}s`;
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full">

        {/* HERO BANNER CARD */}
        <div className={`bg-gradient-to-br border rounded-3xl p-8 sm:p-12 shadow-2xl mb-8 text-center relative overflow-hidden ${outcome.colorClass}`}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl -z-10" />

          {/* Animated Background SVG Splash */}
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center mix-blend-screen">
            {isWin ? (
              <svg width="400" height="400" viewBox="0 0 200 200" className="animate-[spin_30s_linear_infinite]">
                <polygon points="100,10 120,70 190,70 135,110 155,180 100,140 45,180 65,110 10,70 80,70" fill="var(--color-neon-gold)" opacity="0.3" className="animate-pulse" />
                <circle cx="100" cy="100" r="80" fill="none" stroke="var(--color-neon-green)" strokeWidth="4" strokeDasharray="20 10" className="origin-center animate-[spin_10s_linear_infinite_reverse]" />
              </svg>
            ) : isLose ? (
              <svg width="400" height="400" viewBox="0 0 200 200" className="animate-pulse">
                <path d="M50,50 L150,150 M150,50 L50,150" stroke="var(--color-neon-red)" strokeWidth="20" strokeLinecap="round" opacity="0.3" />
                <circle cx="100" cy="100" r="80" fill="none" stroke="var(--color-neon-purple)" strokeWidth="4" strokeDasharray="30 15" className="origin-center animate-[spin_10s_linear_infinite]" />
              </svg>
            ) : (
              <svg width="400" height="400" viewBox="0 0 200 200" className="animate-[spin_30s_linear_infinite]">
                <rect x="50" y="50" width="100" height="100" fill="none" stroke="var(--color-text-secondary)" strokeWidth="4" transform="rotate(45 100 100)" opacity="0.3" />
                <circle cx="100" cy="100" r="70" fill="none" stroke="var(--color-neon-blue)" strokeWidth="4" strokeDasharray="10 20" />
              </svg>
            )}
          </div>

          <div className="relative z-10">
            {/* Outcome Badge */}
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-widest bg-black/40 border border-slate-800 mb-6">
              {outcome.badge}
            </span>
          
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-2">
            {outcome.title}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto mb-8 leading-relaxed">
            {outcome.desc}
          </p>

          {/* MMR Change Display */}
          <div className="bg-[#0B0F19]/80 border border-slate-800/85 inline-flex flex-col items-center px-8 py-4 rounded-2xl shadow-xl">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500">Perubahan Rating</span>
            <span className={`text-3xl sm:text-4xl font-black mt-1 ${outcome.ratingColor}`}>
              {outcome.ratingText}
            </span>
          </div>
          </div>
        </div>

        {/* DUAL COMPARATIVE STATISTICS */}
        <div className="bg-[#0E1524]/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
          <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            Statistik Duel Head-to-Head
          </h3>

          <div className="space-y-6">
            {/* Headers: Player usernames */}
            <div className="grid grid-cols-3 text-center border-b border-slate-800/60 pb-3 items-center">
              <span className="text-xs sm:text-sm font-bold text-blue-400 truncate max-w-[120px] text-left">
                @{me.username}
              </span>
              <span className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">
                Parameter
              </span>
              <span className="text-xs sm:text-sm font-bold text-purple-400 truncate max-w-[120px] text-right">
                @{opponent.username}
              </span>
            </div>

            {/* Row 1: Score */}
            <div className="grid grid-cols-3 text-center items-center">
              <span className="text-lg sm:text-2xl font-black text-white text-left">{me.totalScore}</span>
              <span className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400" /> Total Skor
              </span>
              <span className="text-lg sm:text-2xl font-black text-white text-right">{opponent.totalScore}</span>
            </div>

            {/* Row 2: Accuracy */}
            <div className="grid grid-cols-3 text-center items-center">
              <span className="text-lg sm:text-2xl font-black text-white text-left">
                {me.correctCount} <span className="text-xs font-medium text-slate-500">/ {result.totalQuestions || 10}</span>
              </span>
              <span className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-400" /> Akurasi Benar
              </span>
              <span className="text-lg sm:text-2xl font-black text-white text-right">
                {opponent.correctCount} <span className="text-xs font-medium text-slate-500">/ {result.totalQuestions || 10}</span>
              </span>
            </div>

            {/* Row 3: Avg Answer Time */}
            <div className="grid grid-cols-3 text-center items-center">
              <span className="text-lg sm:text-2xl font-black text-white text-left">{formatTime(me.avgAnswerTime)}</span>
              <span className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> Kecepatan Rerata
              </span>
              <span className="text-lg sm:text-2xl font-black text-white text-right">{formatTime(opponent.avgAnswerTime)}</span>
            </div>
          </div>
        </div>

        {/* ACTION BUTTON CONTROLS */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/duel/choose-mode"
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            <Swords className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Main Duel Lagi
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-bold py-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Kembali ke Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
