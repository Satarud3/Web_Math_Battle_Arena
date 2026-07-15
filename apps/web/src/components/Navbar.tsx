"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Sigma, Swords, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { socket } from "@/lib/socket";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [activeInvite, setActiveInvite] = useState<{ roomId: string; hostUsername: string; mode: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !socket) return;

    if (!socket.connected) {
      socket.connect();
    }

    const onRoomInviteReceived = (data: { roomId: string; hostUsername: string; mode: string }) => {
      console.log("[Socket] Received room invite:", data);
      setActiveInvite(data);
    };

    socket.on("room_invite_received", onRoomInviteReceived);

    return () => {
      socket.off("room_invite_received", onRoomInviteReceived);
    };
  }, [isAuthenticated]);

  const handleAcceptInvite = () => {
    if (!activeInvite) return;
    router.push(`/duel/room/${activeInvite.roomId}`);
    setActiveInvite(null);
  };

  const handleDeclineInvite = () => {
    setActiveInvite(null);
  };

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
      ? "text-neon-cyan font-bold transition-colors"
      : "text-slate-400 hover:text-slate-100 transition-colors";
  };

  if (isAuthenticated && user) {
    return (
      <>
        <header className="sticky top-0 z-50 border-b border-white/10 bg-bg-deep/82 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Link href="/dashboard" className="flex min-w-0 shrink-0 items-center gap-2">
              <Sigma className="h-5 w-5 text-neon-cyan" />
              <span className="font-arena truncate text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple sm:text-xl">
                <span className="sm:hidden">MBA</span>
                <span className="hidden sm:inline">MATH BATTLE ARENA</span>
              </span>
              <span className="hidden rounded-full border border-neon-cyan/20 bg-neon-cyan/10 px-2.5 py-0.5 text-xs font-semibold text-neon-cyan md:inline">
                PLAYER PANEL
              </span>
            </Link>

            <nav className="hidden space-x-6 text-sm font-medium md:flex">
              <Link href="/dashboard" className={linkClass("/dashboard")}>Dashboard</Link>
              <Link href="/leaderboard" className={linkClass("/leaderboard")}>Leaderboard</Link>
              <Link href="/profile" className={linkClass("/profile")}>Profil</Link>
            </nav>

            <button
              onClick={handleLogout}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/25 px-2.5 py-1.5 text-sm font-semibold text-red-300 transition-all hover:bg-red-500/10 sm:px-3.5"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        {/* Real-time Room Invitation Toast */}
        {activeInvite && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-bg-deep/95 border border-neon-purple/40 backdrop-blur-xl rounded-2xl p-4 shadow-[0_0_30px_rgba(168,85,247,0.3)] animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="flex gap-3">
              <div className="p-3 bg-neon-purple/10 border border-neon-purple/30 rounded-xl text-neon-purple self-start shrink-0 animate-pulse">
                <Swords size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-neon-cyan uppercase tracking-wider font-heading">Undangan Duel</h4>
                <p className="text-xs font-ui text-slate-300 mt-1 leading-relaxed">
                  <span className="font-bold text-white">@{activeInvite.hostUsername}</span> mengundangmu bertanding di mode <span className="font-bold text-neon-purple">{activeInvite.mode}</span>!
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={handleDeclineInvite}
                    className="flex-1 px-3 py-2 rounded-xl text-[10px] uppercase tracking-wider font-black text-red-400 border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 cursor-pointer transition-colors"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={handleAcceptInvite}
                    className="flex-1 px-3 py-2 rounded-xl text-[10px] uppercase tracking-wider font-black text-white bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-[0_0_12px_rgba(0,240,255,0.25)] cursor-pointer transition-all"
                  >
                    Terima
                  </button>
                </div>
              </div>
              <button 
                onClick={handleDeclineInvite} 
                className="text-slate-500 hover:text-white transition-colors shrink-0 self-start p-1"
                aria-label="Tutup"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-bg-deep/82 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Sigma className="h-5 w-5 text-neon-cyan" />
          <span className="font-arena truncate text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple sm:text-xl">
            MATH BATTLE ARENA
          </span>
        </Link>
        <nav className="hidden space-x-8 text-sm font-medium md:flex">
          <Link href="/" className={linkClass("/")}>Home</Link>
          <Link href="/leaderboard" className={linkClass("/leaderboard")}>Leaderboard</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
            Masuk
          </Link>
          <Link
            href="/register"
            className="flex h-10 items-center justify-center rounded-lg bg-gradient-to-r from-neon-blue to-neon-purple px-4 text-sm font-semibold text-white transition-all hover:shadow-[0_0_18px_rgba(6,182,212,0.4)]"
          >
            Mulai
          </Link>
        </div>
      </div>
    </header>
  );
}
