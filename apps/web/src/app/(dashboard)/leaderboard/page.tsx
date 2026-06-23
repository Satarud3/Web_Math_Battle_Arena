"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Medal, ShieldAlert, Loader2, Search } from "lucide-react";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import MathBackground from "@/components/ui/MathBackground";

interface LeaderboardEntry {
  id: string;
  userId: string;
  ratingPoint: number;
  tier: string;
  rank: number;
  username: string;
  name: string;
  avatarUrl: string | null;
  isCurrentUser: boolean;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get("/leaderboard/global");
        setEntries(res.data);
      } catch (error: unknown) {
        console.error("Gagal memuat papan peringkat", error);
        setError("Gagal memuat data papan peringkat global.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getTierColorClass = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "bronze":
        return "bg-amber-900/20 border-amber-800 text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.05)]";
      case "silver":
        return "bg-slate-700/20 border-slate-600 text-slate-300 shadow-[0_0_8px_rgba(203,213,225,0.05)]";
      case "gold":
        return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.15)]";
      case "platinum":
        return "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]";
      case "master":
        return "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)] ring-1 ring-purple-500/20";
      default:
        return "bg-slate-800 border-slate-700 text-slate-400";
    }
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) return <Medal className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.5)]" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]" />;
    return <span className="text-slate-400 font-bold text-sm">#{rank}</span>;
  };

  // Filter list by username or name search
  const filteredEntries = entries.filter(
    (entry) =>
      entry.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top3 = entries.slice(0, 3);
  // Sort top3 so it renders: 2nd place (left), 1st place (center), 3rd place (right)
  const podium = [
    top3[1] || null, // 2nd
    top3[0] || null, // 1st
    top3[2] || null, // 3rd
  ];

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-bg-main text-white flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Memuat papan peringkat global...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-bg-main text-white flex flex-col font-sans">
      <MathBackground />
      <Navbar />
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24 md:pb-8">

        {/* Header Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-xs font-bold uppercase tracking-widest mb-4">
            <Trophy className="w-3.5 h-3.5" /> Papan Peringkat Global
          </div>
          <h1 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-neon-blue via-neon-purple to-neon-gold bg-clip-text text-transparent tracking-tight">
            Arena Ksatria Matematika
          </h1>
          <p className="text-slate-400 mt-3 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Daftar petarung dengan kecerdasan matematika tertinggi di Math Battle Arena.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 flex items-center gap-3 text-sm max-w-md mx-auto mb-8">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top 3 Podium Highlights */}
        {top3.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-3xl mx-auto mb-16 pt-8 px-2">
            
            {/* 2nd Place Card */}
            {podium[0] && (
              <div className="flex flex-col items-center">
                <div className="relative group flex flex-col items-center p-4 bg-[#0E1524]/60 backdrop-blur border border-slate-400/30 hover:border-slate-400/50 rounded-2xl w-full text-center transition-all duration-300 transform hover:-translate-y-1 shadow-lg shadow-[0_0_15px_rgba(203,213,225,0.1)]">
                  <div className="absolute -top-6 w-12 h-12 rounded-full bg-slate-700 border-2 border-slate-400 flex items-center justify-center shadow-md">
                    <Medal className="w-6 h-6 text-slate-300" />
                  </div>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center font-bold text-slate-400 text-lg uppercase shadow-inner mt-4 overflow-hidden">
                    <span>{podium[0].name.slice(0, 1)}</span>
                  </div>
                  <Link
                    href={podium[0].isCurrentUser ? "/profile" : `/profile/${podium[0].username}`}
                    className="text-xs sm:text-sm font-bold text-slate-100 mt-3 truncate w-full hover:text-indigo-400 transition-colors block"
                  >
                    @{podium[0].username}
                  </Link>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 truncate w-full block">
                    {podium[0].name}
                  </span>
                  <div className={`mt-2.5 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getTierColorClass(podium[0].tier)}`}>
                    {podium[0].tier}
                  </div>
                  <div className="text-sm sm:text-base font-black text-slate-300 mt-2">
                    {podium[0].ratingPoint} <span className="text-[9px] font-semibold text-slate-500">RP</span>
                  </div>
                </div>
                <div className="h-10 sm:h-16 bg-[#131B2D]/40 border-l border-r border-t border-slate-800 w-16 sm:w-24 mt-2 rounded-t-lg flex items-center justify-center font-black text-slate-500 text-xs sm:text-sm">
                  2ND
                </div>
              </div>
            )}

            {/* 1st Place Card */}
            {podium[1] && (
              <div className="flex flex-col items-center">
                <div className="relative group flex flex-col items-center p-4 sm:p-6 bg-gradient-to-b from-[#111A30] to-[#0A0F1D] border border-neon-gold/40 hover:border-neon-gold/60 rounded-3xl w-full text-center transition-all duration-300 transform hover:-translate-y-2 shadow-2xl shadow-[0_0_25px_rgba(255,184,0,0.15)]">
                  <div className="absolute -top-8 w-16 h-16 rounded-full bg-yellow-500/10 border-2 border-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/10">
                    <Medal className="w-8 h-8 text-yellow-400 animate-pulse" />
                  </div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-yellow-950/20 border-2 border-yellow-500/30 flex items-center justify-center font-bold text-yellow-400 text-xl uppercase shadow-inner mt-6 overflow-hidden">
                    <span>{podium[1].name.slice(0, 1)}</span>
                  </div>
                  <Link
                    href={podium[1].isCurrentUser ? "/profile" : `/profile/${podium[1].username}`}
                    className="text-xs sm:text-base font-extrabold text-yellow-300 mt-4 truncate w-full hover:underline block"
                  >
                    @{podium[1].username}
                  </Link>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 truncate w-full block">
                    {podium[1].name}
                  </span>
                  <div className={`mt-2.5 px-2.5 py-0.5 rounded text-[10px] sm:text-xs font-extrabold uppercase border ${getTierColorClass(podium[1].tier)}`}>
                    {podium[1].tier}
                  </div>
                  <div className="text-base sm:text-lg font-black text-yellow-400 mt-2 drop-shadow-[0_0_6px_rgba(234,179,8,0.25)]">
                    {podium[1].ratingPoint} <span className="text-[9px] sm:text-xs font-semibold text-yellow-500/80">RP</span>
                  </div>
                </div>
                <div className="h-16 sm:h-24 bg-gradient-to-b from-[#182542]/40 to-[#0A0F1D]/40 border-l border-r border-t border-yellow-500/10 w-20 sm:w-28 mt-2 rounded-t-xl flex items-center justify-center font-black text-yellow-500 text-sm sm:text-base shadow-[0_-5px_15px_rgba(234,179,8,0.05)]">
                  1ST
                </div>
              </div>
            )}

            {/* 3rd Place Card */}
            {podium[2] && (
              <div className="flex flex-col items-center">
                <div className="relative group flex flex-col items-center p-4 bg-[#0E1524]/60 backdrop-blur border border-amber-600/30 hover:border-amber-600/50 rounded-2xl w-full text-center transition-all duration-300 transform hover:-translate-y-1 shadow-lg shadow-[0_0_15px_rgba(217,119,6,0.1)]">
                  <div className="absolute -top-6 w-12 h-12 rounded-full bg-amber-900/60 border-2 border-amber-600 flex items-center justify-center shadow-md">
                    <Medal className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center font-bold text-slate-400 text-lg uppercase shadow-inner mt-4 overflow-hidden">
                    <span>{podium[2].name.slice(0, 1)}</span>
                  </div>
                  <Link
                    href={podium[2].isCurrentUser ? "/profile" : `/profile/${podium[2].username}`}
                    className="text-xs sm:text-sm font-bold text-slate-100 mt-3 truncate w-full hover:text-indigo-400 transition-colors block"
                  >
                    @{podium[2].username}
                  </Link>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 truncate w-full block">
                    {podium[2].name}
                  </span>
                  <div className={`mt-2.5 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getTierColorClass(podium[2].tier)}`}>
                    {podium[2].tier}
                  </div>
                  <div className="text-sm sm:text-base font-black text-slate-300 mt-2">
                    {podium[2].ratingPoint} <span className="text-[9px] font-semibold text-slate-500">RP</span>
                  </div>
                </div>
                <div className="h-8 sm:h-12 bg-[#131B2D]/40 border-l border-r border-t border-slate-800 w-16 sm:w-24 mt-2 rounded-t-lg flex items-center justify-center font-black text-slate-500 text-xs">
                  3RD
                </div>
              </div>
            )}

          </div>
        )}

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Cari nama ksatria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 border border-slate-800 bg-[#0E1524]/60 backdrop-blur rounded-2xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-neon-blue/40 focus:border-neon-blue/50 transition-all text-sm"
          />
        </div>

        {/* Leaderboard Table */}
        <div className="bg-[#0E1524]/60 backdrop-blur border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6 text-center w-16">Peringkat</th>
                  <th className="py-4 px-6">Ksatria</th>
                  <th className="py-4 px-6 text-center hidden md:table-cell">Tier</th>
                  <th className="py-4 px-6 text-right w-36">Rating Point</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredEntries.map((entry) => {
                  const isPodium = entry.rank <= 3;
                  const rowHighlightClass = entry.isCurrentUser
                    ? "bg-neon-blue/10 border-y border-neon-blue/30 shadow-[inset_0_0_15px_rgba(0,240,255,0.1)] relative"
                    : isPodium
                    ? "bg-slate-900/20 hover:bg-slate-900/40 transition-colors"
                    : "hover:bg-slate-900/30 transition-colors";

                  return (
                    <tr key={entry.id || entry.userId} className={`${rowHighlightClass}`}>
                      {/* Pinned user vertical indicator */}
                      {entry.isCurrentUser && (
                        <td className="absolute left-0 top-0 bottom-0 w-1 bg-neon-blue" />
                      )}

                      {/* Rank Column */}
                      <td className="py-4 px-6 text-center font-bold">
                        <div className="flex items-center justify-center">
                          {getRankMedal(entry.rank)}
                        </div>
                      </td>

                      {/* User Column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs shrink-0">
                            {entry.name.slice(0, 1)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Link
                                href={entry.isCurrentUser ? "/profile" : `/profile/${entry.username}`}
                                className={`text-sm font-bold truncate hover:underline hover:text-indigo-400 transition-colors ${
                                  entry.isCurrentUser ? "text-indigo-300" : "text-slate-200"
                                }`}
                              >
                                @{entry.username}
                              </Link>
                              {entry.isCurrentUser && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-neon-blue/20 text-neon-blue border border-neon-blue/30 uppercase tracking-wide shrink-0">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 truncate block">{entry.name}</span>
                          </div>
                        </div>
                      </td>

                      {/* Tier Column */}
                      <td className="py-4 px-6 text-center hidden md:table-cell">
                        <div className="flex items-center justify-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getTierColorClass(entry.tier)}`}>
                            {entry.tier}
                          </span>
                        </div>
                      </td>

                      {/* MMR Column */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className={`text-sm sm:text-base font-black ${
                            entry.rank === 1 ? "text-yellow-400" : entry.isCurrentUser ? "text-indigo-300" : "text-slate-300"
                          }`}>
                            {entry.ratingPoint}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            RP
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500 text-sm font-medium">
                      Tidak ada ksatria matematika yang cocok dengan pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
