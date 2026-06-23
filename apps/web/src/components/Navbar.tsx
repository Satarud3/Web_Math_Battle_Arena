"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

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

  const linkClass = (path: string) => {
    const isActive = pathname === path;
    return isActive
      ? "text-blue-400 font-bold transition-colors"
      : "text-slate-400 hover:text-slate-200 transition-colors";
  };

  // If user is authenticated, render Player Panel Header
  if (isAuthenticated && user) {
    return (
      <header className="border-b border-slate-800 bg-[#0E1524]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
            <span className="text-xl sm:text-2xl font-black tracking-wider bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap">
              <span className="sm:hidden">⚔️ MBA</span>
              <span className="hidden sm:inline">⚔️ MATH BATTLE ARENA</span>
            </span>
            <span className="hidden md:inline px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              PLAYER PANEL
            </span>
          </div>

          <nav className="hidden md:flex space-x-6 text-sm font-medium">
            <Link href="/dashboard" className={linkClass("/dashboard")}>
              Dashboard
            </Link>
            <Link href="/leaderboard" className={linkClass("/leaderboard")}>
              Leaderboard
            </Link>
            <Link href="/profile" className={linkClass("/profile")}>
              Profil
            </Link>
          </nav>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-all cursor-pointer shrink-0"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>
    );
  }

  // Otherwise, render Public Landing Navbar
  return (
    <header className="border-b border-slate-800 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 truncate">
            MATH BATTLE ARENA
          </Link>
        </div>
        <nav className="hidden md:flex space-x-8 text-sm font-medium">
          <Link href="/" className={linkClass("/")}>Home</Link>
          <Link href="/leaderboard" className={linkClass("/leaderboard")}>Leaderboard</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Masuk
          </Link>
          <Link 
            href="/register" 
            className="px-4 h-10 flex items-center justify-center text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all"
          >
            Mulai Bermain
          </Link>
        </div>
      </div>
    </header>
  );
}
