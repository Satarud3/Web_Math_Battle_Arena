"use client";

import Link from "next/link";
import React, { useState } from "react";

export default function LeaderboardPage() {
  const [filter, setFilter] = useState("global");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-card bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            MATH BATTLE ARENA
          </Link>
          <nav className="flex space-x-8 text-sm font-medium text-text-muted">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/leaderboard" className="text-primary transition-colors">Leaderboard</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </nav>
          <div>
            <Link 
              href="/login" 
              className="px-4 h-10 flex items-center justify-center text-sm font-semibold rounded-lg bg-card border border-primary/20 hover:border-primary/50 text-white transition-all"
            >
              Kembali Masuk
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Papan Peringkat Global</h1>
          <p className="text-text-muted mt-2">Daftar kesatria matematika terbaik di arena saat ini.</p>
        </div>

        {/* Filters */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg bg-card p-1 border border-primary/10">
            <button 
              onClick={() => setFilter("global")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${filter === "global" ? "bg-primary text-white shadow-md" : "text-text-muted hover:text-white"}`}
            >
              Global
            </button>
            <button 
              onClick={() => setFilter("weekly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${filter === "weekly" ? "bg-primary text-white shadow-md" : "text-text-muted hover:text-white"}`}
            >
              Mingguan
            </button>
            <button 
              onClick={() => setFilter("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${filter === "monthly" ? "bg-primary text-white shadow-md" : "text-text-muted hover:text-white"}`}
            >
              Bulanan
            </button>
          </div>
        </div>

        {/* Podium Top 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
          {/* Rank 2 */}
          <div className="p-6 bg-card border border-primary/5 rounded-xl text-center md:order-1 relative group hover:border-primary/30 transition-all">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-zinc-400 rounded-full flex items-center justify-center font-bold text-white text-xl border-4 border-background">
              2
            </div>
            <div className="mt-6">
              <h4 className="font-extrabold text-white text-lg">Sinta_Aritmetika</h4>
              <span className="text-xs font-semibold text-secondary">🥈 Silver I</span>
              <div className="mt-4 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                2,210 XP
              </div>
              <span className="text-xs text-text-muted">Win Rate: 72%</span>
            </div>
          </div>

          {/* Rank 1 */}
          <div className="p-8 bg-gradient-to-b from-card via-card to-primary/10 border border-accent/20 rounded-xl text-center md:order-2 relative group hover:border-accent/50 md:-translate-y-4 shadow-[0_0_25px_rgba(245,158,11,0.1)] transition-all">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-accent rounded-full flex items-center justify-center font-bold text-white text-2xl border-4 border-background shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              1
            </div>
            <div className="mt-8">
              <h4 className="font-black text-white text-xl">Raka_MathMaster</h4>
              <span className="text-xs font-semibold text-accent">🥇 Gold III</span>
              <div className="mt-4 text-3xl font-black text-accent">
                2,450 XP
              </div>
              <span className="text-xs text-success">Win Rate: 85%</span>
            </div>
          </div>

          {/* Rank 3 */}
          <div className="p-6 bg-card border border-primary/5 rounded-xl text-center md:order-3 relative group hover:border-primary/30 transition-all">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center font-bold text-white text-xl border-4 border-background">
              3
            </div>
            <div className="mt-6">
              <h4 className="font-extrabold text-white text-lg">Dimas_Logika</h4>
              <span className="text-xs font-semibold text-primary">🥉 Bronze III</span>
              <div className="mt-4 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                2,080 XP
              </div>
              <span className="text-xs text-text-muted">Win Rate: 65%</span>
            </div>
          </div>
        </div>

        {/* Leaderboard Table List */}
        <div className="bg-card rounded-xl border border-primary/10 overflow-hidden shadow-2xl">
          <div className="p-4 bg-background/50 border-b border-primary/10 flex text-left font-semibold text-text-muted text-xs uppercase tracking-wider">
            <span className="w-16 text-center">Rank</span>
            <span className="flex-grow pl-4">Username</span>
            <span className="w-32 text-center">Tier</span>
            <span className="w-24 text-center">Win Rate</span>
            <span className="w-28 text-right">Rating Point</span>
          </div>

          <div className="divide-y divide-primary/5">
            <div className="p-4 flex items-center text-left hover:bg-primary/5 transition-colors">
              <span className="w-16 text-center font-bold text-accent">#1</span>
              <span className="flex-grow pl-4 font-semibold text-white">Raka_MathMaster</span>
              <span className="w-32 text-center text-xs font-semibold text-accent">Gold III</span>
              <span className="w-24 text-center text-sm font-medium text-success">85%</span>
              <span className="w-28 text-right font-bold text-accent">2,450 XP</span>
            </div>

            <div className="p-4 flex items-center text-left hover:bg-primary/5 transition-colors">
              <span className="w-16 text-center font-bold text-secondary">#2</span>
              <span className="flex-grow pl-4 font-semibold text-white">Sinta_Aritmetika</span>
              <span className="w-32 text-center text-xs font-semibold text-secondary">Silver I</span>
              <span className="w-24 text-center text-sm font-medium text-success">72%</span>
              <span className="w-28 text-right font-bold text-secondary">2,210 XP</span>
            </div>

            <div className="p-4 flex items-center text-left hover:bg-primary/5 transition-colors">
              <span className="w-16 text-center font-bold text-primary">#3</span>
              <span className="flex-grow pl-4 font-semibold text-white">Dimas_Logika</span>
              <span className="w-32 text-center text-xs font-semibold text-primary">Bronze III</span>
              <span className="w-24 text-center text-sm font-medium text-text-muted">65%</span>
              <span className="w-28 text-right font-bold text-primary">2,080 XP</span>
            </div>

            <div className="p-4 flex items-center text-left hover:bg-primary/5 transition-colors">
              <span className="w-16 text-center text-text-muted">#4</span>
              <span className="flex-grow pl-4 font-semibold text-white">Fajar_Logic</span>
              <span className="w-32 text-center text-xs font-semibold text-text-muted">Bronze I</span>
              <span className="w-24 text-center text-sm font-medium text-text-muted">58%</span>
              <span className="w-28 text-right font-bold text-text-muted">1,890 XP</span>
            </div>

            <div className="p-4 flex items-center text-left hover:bg-primary/5 transition-colors">
              <span className="w-16 text-center text-text-muted">#5</span>
              <span className="flex-grow pl-4 font-semibold text-white">Lina_Calculus</span>
              <span className="w-32 text-center text-xs font-semibold text-text-muted">Bronze II</span>
              <span className="w-24 text-center text-sm font-medium text-danger">46%</span>
              <span className="w-28 text-right font-bold text-text-muted">1,620 XP</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-card py-6 bg-background/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-text-muted">
          <p>&copy; 2026 Math Battle Arena. Leaderboard Global.</p>
        </div>
      </footer>
    </div>
  );
}
