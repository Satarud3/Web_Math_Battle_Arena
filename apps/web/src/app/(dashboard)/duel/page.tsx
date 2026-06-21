"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Swords, Users, Loader2, XCircle, ShieldAlert } from "lucide-react";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";

type QueueStatus = "IDLE" | "JOINING" | "WAITING" | "ERROR";

export default function DuelSetupPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<QueueStatus>("IDLE");
  const [rating, setRating] = useState<number | null>(null);
  const [opponent, setOpponent] = useState<any>(null);
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

    const onQueueJoined = (data: { ratingPoint: number }) => {
      setRating(data.ratingPoint);
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

    const onMatchFound = (data: { matchId: string; opponent: any }) => {
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

    // If socket is already connected and we were somehow in queue
    if (socket.connected) {
      setErrorMsg(null);
    }

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
    <div className="min-h-screen bg-[#0B0F19] text-white py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
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
              <>
                {/* Rotating/pulsing Radar rings */}
                <div className="absolute inset-0 border border-blue-500/25 rounded-full animate-ping duration-1000 opacity-60" />
                <div className="absolute inset-4 border border-indigo-500/20 rounded-full animate-ping duration-1000 delay-300 opacity-40" />
                <div className="absolute inset-10 border border-purple-500/10 rounded-full animate-ping duration-1000 delay-600 opacity-20" />
                
                {/* Scanning line animation */}
                <div className="absolute inset-0 border border-blue-500/10 rounded-full" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/0 via-blue-500/5 to-blue-500/15 animate-spin duration-3000" />
              </>
            )}

            {/* Center Visual */}
            <div className={`relative w-36 h-36 rounded-full flex flex-col justify-center items-center border transition-all duration-300 shadow-2xl ${
              status === "WAITING" 
                ? "bg-indigo-950/40 border-indigo-500/50 shadow-indigo-500/10" 
                : "bg-slate-900 border-slate-800"
            }`}>
              {opponent ? (
                <>
                  <span className="text-3xl animate-bounce">⚔️</span>
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
