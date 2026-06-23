"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";

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

export default function Home() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get("/leaderboard/global");
        setEntries(res.data.slice(0, 3));
      } catch (err) {
        console.error("Gagal memuat papan peringkat pratinjau", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-foreground flex flex-col justify-between overflow-x-hidden">
      {/* Header / Navbar */}
      <Navbar />

      {/* Main Hero Section */}
      <main className="flex-grow">
        <section className="relative py-20 lg:py-32 overflow-hidden">
          {/* Background decorative glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl -z-10 animate-[pulse_3s_infinite] delay-75"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            
            {/* Inline Hero SVG Illustration */}
            <div className="flex justify-center mb-10">
              <svg width="160" height="160" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]">
                {/* Outer rotating dashed ring */}
                <circle cx="100" cy="100" r="90" fill="none" stroke="var(--color-neon-blue)" strokeWidth="2" strokeDasharray="15 10" className="origin-center animate-[spin_20s_linear_infinite]" />
                {/* Inner rotating dashed ring */}
                <circle cx="100" cy="100" r="70" fill="none" stroke="var(--color-neon-purple)" strokeWidth="3" strokeDasharray="30 15" className="origin-center animate-[spin_15s_linear_infinite_reverse]" />
                {/* Pulsing diamond core */}
                <path d="M100,45 L155,100 L100,155 L45,100 Z" fill="rgba(0,240,255,0.1)" stroke="var(--color-neon-gold)" strokeWidth="4" className="origin-center animate-pulse" />
                {/* Math symbol */}
                <text x="100" y="115" fontSize="48" fill="var(--color-text-primary)" textAnchor="middle" fontFamily="monospace" fontWeight="bold" className="drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                  ∑
                </text>
              </svg>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
              Belajar Matematika Seperti <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-gold drop-shadow-[0_0_10px_rgba(176,38,255,0.3)]">
                Bertarung di Arena Game!
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-text-secondary">
              Uji kecepatan berpikir dan logika matematika Anda. Hadapi lawan secara real-time, menangkan duel 1v1, dapatkan medali, dan capai peringkat tertinggi!
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register" 
                className="px-8 h-14 flex items-center justify-center text-base font-semibold rounded-lg bg-gradient-to-r from-primary to-secondary text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] hover:scale-105 transition-all duration-300"
              >
                Daftar Sekarang
              </Link>
              <Link 
                href="/leaderboard" 
                className="px-8 h-14 flex items-center justify-center text-base font-semibold rounded-lg bg-card border border-primary/20 text-foreground hover:bg-card/80 hover:border-primary/50 transition-all duration-300"
              >
                Lihat Peringkat
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-card/30 border-y border-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-white">Fitur Utama Arena</h2>
              <p className="mt-4 text-text-muted">Semua yang Anda butuhkan untuk mengasah otak dengan cara yang kompetitif dan menyenangkan.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="p-6 bg-card border border-primary/10 rounded-xl hover:border-primary/40 transition-colors duration-300 group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xl font-bold mb-4 group-hover:bg-primary/20 transition-colors">
                  ⚔️
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Duel 1 vs 1</h3>
                <p className="text-sm text-text-muted">Bertanding matematika secara langsung (real-time) dengan lawan seimbang lewat matchmaking pintar.</p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 bg-card border border-primary/10 rounded-xl hover:border-primary/40 transition-colors duration-300 group">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary text-xl font-bold mb-4 group-hover:bg-secondary/20 transition-colors">
                  🧠
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Mode Latihan</h3>
                <p className="text-sm text-text-muted">Latih logika dan pemecahan masalah Anda secara mandiri tanpa tekanan waktu atau peringkat.</p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 bg-card border border-primary/10 rounded-xl hover:border-primary/40 transition-colors duration-300 group">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-xl font-bold mb-4 group-hover:bg-accent/20 transition-colors">
                  🏆
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sistem Peringkat</h3>
                <p className="text-sm text-text-muted">Kumpulkan rating poin dari setiap kemenangan dan tingkatkan tier Anda dari Bronze hingga Master.</p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 bg-card border border-primary/10 rounded-xl hover:border-primary/40 transition-colors duration-300 group">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center text-success text-xl font-bold mb-4 group-hover:bg-success/20 transition-colors">
                  📊
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Statistik Pemain</h3>
                <p className="text-sm text-text-muted">Pantau kemajuan Anda melalui grafik akurasi jawaban, waktu respon rata-rata, dan histori pertandingan.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Leaderboard Preview */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-8">Puncak Papan Peringkat</h2>
            <div className="bg-card rounded-xl border border-primary/10 overflow-hidden shadow-lg">
              <div className="p-4 bg-background/50 border-b border-primary/10 flex justify-between font-semibold text-text-muted text-sm">
                <span>Peringkat</span>
                <span className="flex-1 text-left pl-8">Pemain</span>
                <span>Poin Rating</span>
              </div>
              <div className="divide-y divide-primary/5">
                {loading && (
                  <div className="p-8 flex flex-col items-center justify-center text-text-muted gap-2">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-sm">Memuat data papan peringkat...</span>
                  </div>
                )}

                {error && (
                  <div className="p-8 text-center text-red-400 text-sm">
                    Gagal memuat data papan peringkat global.
                  </div>
                )}

                {!loading && !error && entries.length === 0 && (
                  <div className="p-8 text-center text-text-muted text-sm">
                    Belum ada data ksatria matematika.
                  </div>
                )}

                {!loading && !error && entries.map((entry) => {
                  let medal = "";
                  let rankColor = "text-text-muted";
                  let pointsColor = "text-foreground";

                  if (entry.rank === 1) {
                    medal = "🥇";
                    rankColor = "text-accent";
                    pointsColor = "text-accent";
                  } else if (entry.rank === 2) {
                    medal = "🥈";
                    rankColor = "text-gray-300";
                    pointsColor = "text-secondary";
                  } else if (entry.rank === 3) {
                    medal = "🥉";
                    rankColor = "text-amber-600";
                    pointsColor = "text-primary";
                  }

                  return (
                    <div key={entry.id || entry.userId} className="p-4 flex justify-between items-center hover:bg-card/20 transition-colors">
                      <span className={`${rankColor} font-bold text-lg w-12 flex items-center gap-1`}>
                        <span>{medal}</span>
                        <span className="text-xs text-text-muted font-normal">#{entry.rank}</span>
                      </span>
                      <span className="flex-1 text-left pl-8 font-medium truncate">
                        <Link 
                          href={entry.isCurrentUser ? "/profile" : `/profile/${entry.username}`}
                          className="hover:text-primary transition-colors"
                        >
                          @{entry.username}
                        </Link>
                      </span>
                      <span className={`font-bold ${pointsColor}`}>
                        {entry.ratingPoint} RP
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-8">
              <Link 
                href="/leaderboard" 
                className="text-primary hover:text-primary/80 font-semibold inline-flex items-center gap-1 transition-colors"
              >
                Lihat Selengkapnya &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-card py-8 bg-background/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-muted">
          <p>&copy; 2026 Math Battle Arena. Dibuat untuk kesenangan dan kecerdasan.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Panduan</a>
            <a href="#" className="hover:text-foreground transition-colors">Aturan</a>
            <a href="#" className="hover:text-foreground transition-colors">Kontak</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
