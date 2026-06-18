"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Dashboard Header */}
      <header className="border-b border-card bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              MATH BATTLE ARENA
            </span>
            <span className="hidden md:inline px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              PLAYER PANEL
            </span>
          </div>
          <nav className="flex space-x-8 text-sm font-medium">
            <Link href="/dashboard" className="text-primary transition-colors">Dashboard</Link>
            <Link href="/leaderboard" className="text-text-muted hover:text-foreground transition-colors">Leaderboard</Link>
          </nav>
          <button 
            onClick={handleLogout}
            className="text-sm font-semibold text-danger hover:underline cursor-pointer"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-primary/10 via-secondary/10 to-card border border-primary/20 rounded-2xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Selamat Datang, Pemain!</h1>
            <p className="text-text-muted mt-1">Siap untuk memenangkan duel hari ini? Pilih mode permainan di bawah.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => alert("Mencari lawan real-time... (Fase 5)")}
              className="px-6 h-12 flex items-center justify-center text-sm font-semibold rounded-lg bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 hover:shadow-[0_0_15px_rgba(124,58,237,0.4)] transition-all cursor-pointer"
            >
              ⚔️ Cari Duel 1v1
            </button>
            <button 
              onClick={() => alert("Mulai latihan... (Fase 4)")}
              className="px-6 h-12 flex items-center justify-center text-sm font-semibold rounded-lg bg-card border border-primary/30 text-white hover:border-primary/60 transition-all cursor-pointer"
            >
              🧠 Mode Latihan
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-6 bg-card border border-primary/10 rounded-xl">
            <span className="text-xs uppercase font-semibold tracking-wider text-text-muted">Peringkat Tier</span>
            <div className="mt-2 text-2xl font-black text-accent">🥈 Silver II</div>
            <span className="text-xs text-text-muted">1,120 Rating Point</span>
          </div>
          <div className="p-6 bg-card border border-primary/10 rounded-xl">
            <span className="text-xs uppercase font-semibold tracking-wider text-text-muted">Win Rate</span>
            <div className="mt-2 text-2xl font-black text-white">65%</div>
            <span className="text-xs text-success">13 Menang | 7 Kalah</span>
          </div>
          <div className="p-6 bg-card border border-primary/10 rounded-xl">
            <span className="text-xs uppercase font-semibold tracking-wider text-text-muted">Akurasi Jawaban</span>
            <div className="mt-2 text-2xl font-black text-white">82%</div>
            <span className="text-xs text-text-muted">164 Soal Terjawab Benar</span>
          </div>
          <div className="p-6 bg-card border border-primary/10 rounded-xl">
            <span className="text-xs uppercase font-semibold tracking-wider text-text-muted">Total Pertandingan</span>
            <div className="mt-2 text-2xl font-black text-white">20 Match</div>
            <span className="text-xs text-text-muted">Mode Duel & Latihan</span>
          </div>
        </div>

        {/* Two Column Layout (Match History and Achievements) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Match History */}
          <div className="lg:col-span-2 bg-card border border-primary/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Riwayat Pertandingan Terbaru</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-primary/5">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center font-bold text-xs">W</span>
                  <div>
                    <div className="text-sm font-semibold text-white">Menang vs Fajar_Logic</div>
                    <span className="text-xs text-text-muted">Duel 1v1 • 10 menit lalu</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-success">+25 XP</div>
                  <span className="text-xs text-text-muted">Skor: 850 vs 720</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-primary/5">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-danger/20 text-danger flex items-center justify-center font-bold text-xs">L</span>
                  <div>
                    <div className="text-sm font-semibold text-white">Kalah vs Sinta_Aritmetika</div>
                    <span className="text-xs text-text-muted">Duel 1v1 • Kemarin</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-danger">-10 XP</div>
                  <span className="text-xs text-text-muted">Skor: 610 vs 890</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-primary/5">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">P</span>
                  <div>
                    <div className="text-sm font-semibold text-white">Selesai Latihan Aritmetika</div>
                    <span className="text-xs text-text-muted">Latihan Mandiri • 2 hari lalu</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">100% Benar</div>
                  <span className="text-xs text-text-muted">Skor: 1000 XP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-card border border-primary/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Pencapaian (Achievements)</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-primary/5">
                <span className="text-2xl">🥇</span>
                <div>
                  <div className="text-sm font-semibold text-white">First Win</div>
                  <p className="text-xs text-text-muted">Menang pertama kali dalam mode duel 1v1.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-primary/5">
                <span className="text-2xl">🎯</span>
                <div>
                  <div className="text-sm font-semibold text-white">Sharp Shooter</div>
                  <p className="text-xs text-text-muted">Menyelesaikan duel dengan akurasi 100%.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg opacity-40 border border-primary/5">
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="text-sm font-semibold text-white">Unstoppable (Lock)</div>
                  <p className="text-xs text-text-muted font-sans">Capai kemenangan beruntun (streak) sebanyak 5 kali.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-card py-6 bg-background/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-text-muted">
          <p>&copy; 2026 Math Battle Arena. Panel Kontrol Pemain.</p>
        </div>
      </footer>
    </div>
  );
}
