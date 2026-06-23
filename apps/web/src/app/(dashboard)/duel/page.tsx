"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Swords, Loader2, XCircle, ShieldAlert } from "lucide-react";
import { socket } from "@/lib/socket";

type QueueStatus = "IDLE" | "JOINING" | "WAITING" | "ERROR";

interface DuelOpponent {
  id?: string;
  username: string;
  ratingPoint: number;
}

export default function DuelSetupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<QueueStatus>("IDLE");
  const [opponent, setOpponent] = useState<DuelOpponent | null>(null);
  const [queueTime, setQueueTime] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Establish connection if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      console.log("[Socket] Connected to server");
      setErrorMsg(null);
    };

    const onDisconnect = () => {
      console.log("[Socket] Disconnected from server");
      setStatus("IDLE");
    };

    const onQueueJoined = () => {
      setStatus("WAITING");
      // Start elapsed timer
      setQueueTime(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setQueueTime((prev) => prev + 1);
      }, 1000);
    };

    const onQueueLeft = () => {
      setStatus("IDLE");
      if (timerRef.current) clearInterval(timerRef.current);
    };

    const onMatchFound = (data: { matchId: string; opponent: DuelOpponent }) => {
      setOpponent(data.opponent);
      if (timerRef.current) clearInterval(timerRef.current);
      // Wait briefly for transition effect
      setTimeout(() => {
        router.push(`/arena/${data.matchId}`);
      }, 1500);
    };

    const onMatchError = (data: { message: string }) => {
      setErrorMsg(data.message);
      setStatus("IDLE");
      if (timerRef.current) clearInterval(timerRef.current);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("queue_joined", onQueueJoined);
    socket.on("queue_left", onQueueLeft);
    socket.on("match_found", onMatchFound);
    socket.on("match_error", onMatchError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("queue_joined", onQueueJoined);
      socket.off("queue_left", onQueueLeft);
      socket.off("match_found", onMatchFound);
      socket.off("match_error", onMatchError);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [router]);

  const handleJoinQueue = () => {
    setStatus("JOINING");
    setErrorMsg(null);
    socket.emit("join_queue");
  };

  const handleLeaveQueue = () => {
    socket.emit("leave_queue");
  };

  const formatQueueTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-primary py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-2xl mx-auto w-full flex-grow flex flex-col justify-center">
        {/* Back Link */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200 group text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Dashboard
          </Link>
        </div>

        {/* Card Arena Setup */}
        <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center flex flex-col items-center min-h-[480px] justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10" />

          {/* Top Info */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent sm:text-4xl">
              Mode Duel 1 vs 1
            </h1>
            <p className="text-slate-400 mt-2 text-xs sm:text-sm max-w-md mx-auto">
              Tandingi ksatria matematika lain secara real-time. Menang menambah +25 RP, kalah mengurangi -20 RP.
            </p>
          </div>

          {errorMsg && (
            <div className="my-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 flex items-center gap-3 text-xs text-left max-w-sm mx-auto">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Interactive Radar Arena Status */}
          <div className="my-8 relative flex items-center justify-center w-56 h-56">
            {status === "WAITING" && (
              <svg className="absolute inset-0 w-full h-full drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]" viewBox="0 0 200 200">
                {/* Static Rings */}
                <circle cx="100" cy="100" r="90" fill="none" stroke="var(--color-neon-blue)" strokeWidth="1" strokeOpacity="0.3" />
                <circle cx="100" cy="100" r="60" fill="none" stroke="var(--color-neon-blue)" strokeWidth="1" strokeOpacity="0.3" />
                <circle cx="100" cy="100" r="30" fill="none" stroke="var(--color-neon-blue)" strokeWidth="1" strokeOpacity="0.3" />
                
                {/* Crosshairs */}
                <path d="M100,10 L100,190 M10,100 L190,100" stroke="var(--color-neon-blue)" strokeWidth="1" strokeOpacity="0.4" />

                {/* Sweeping Radar Beam */}
                <path d="M100,100 L100,10 A90,90 0 0,1 190,100 Z" fill="url(#radar-gradient)" className="origin-center animate-[spin_2s_linear_infinite]" />

                {/* Blinking Targets */}
                <circle cx="150" cy="60" r="3" fill="var(--color-neon-red)" className="animate-ping" />
                <circle cx="60" cy="140" r="2" fill="var(--color-neon-gold)" className="animate-pulse" />

                {/* Radar Gradient Def */}
                <defs>
                  <linearGradient id="radar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--color-neon-blue)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="var(--color-neon-blue)" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            )}

            {/* Center Visual */}
            <div className={`relative w-36 h-36 rounded-full flex flex-col justify-center items-center border transition-all duration-300 shadow-2xl ${
              status === "WAITING" 
                ? "bg-bg-card/80 border-neon-blue/50 shadow-[0_0_20px_rgba(0,240,255,0.2)]" 
                : "bg-bg-card border-slate-800"
            }`}>
              {opponent ? (
                <>
                  <Swords className="h-8 w-8 animate-bounce text-neon-cyan" aria-hidden="true" />
                  <span className="text-xs text-slate-300 mt-2 font-bold max-w-[120px] truncate">
                    @{opponent.username}
                  </span>
                  <span className="text-[10px] text-indigo-400 font-semibold mt-0.5">
                    {opponent.ratingPoint} RP
                  </span>
                </>
              ) : status === "WAITING" ? (
                <>
                  <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                  <span className="text-[10px] uppercase font-bold text-blue-400 mt-3 tracking-widest animate-pulse">
                    Mencari...
                  </span>
                  <span className="text-sm font-black text-white mt-1">
                    {formatQueueTime(queueTime)}
                  </span>
                </>
              ) : (
                <>
                  <Swords className="w-12 h-12 text-slate-400 hover:text-indigo-400 transition-colors" />
                  <span className="text-xs text-slate-500 mt-3 font-semibold">Ready to Fight</span>
                </>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="w-full max-w-sm">
            {status === "IDLE" && (
              <button
                type="button"
                onClick={handleJoinQueue}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer hover:shadow-indigo-500/20"
              >
                <Swords className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Cari Lawan Duel
              </button>
            )}

            {status === "JOINING" && (
              <button
                type="button"
                disabled
                className="w-full bg-slate-800 text-slate-500 font-bold py-4 rounded-xl flex items-center justify-center gap-2"
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                Mendaftar Antrean...
              </button>
            )}

            {status === "WAITING" && (
              <button
                type="button"
                onClick={handleLeaveQueue}
                className="w-full bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 text-red-300 font-bold py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
                Batalkan Antrean
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
