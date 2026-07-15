"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Swords, Loader2, Copy, Check, Users, 
  UserMinus, UserPlus, Play, CheckCircle2, AlertTriangle, Shield,
  Zap, Trophy, EyeOff, Sparkles, Volume2, VolumeX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import PageTransition from "@/components/PageTransition";

interface RoomPlayer {
  userId: string;
  username: string;
  socketId: string;
  isReady: boolean;
}

interface PrivateRoomLobby {
  roomId: string;
  hostId: string;
  mode: string;
  players: RoomPlayer[];
}

interface Friend {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  status: "ONLINE" | "OFFLINE" | "IN_GAME";
}

function RoomLobbyContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const roomId = decodeURIComponent(params.roomId as string).toUpperCase();

  const [lobby, setLobby] = useState<PrivateRoomLobby | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [invitedFriends, setInvitedFriends] = useState<Record<string, boolean>>({});

  const isHost = lobby ? lobby.hostId === user?.id : false;
  const guestPlayer = lobby ? lobby.players.find(p => p.userId !== lobby.hostId) : null;
  const isGuestReady = guestPlayer ? guestPlayer.isReady : false;

  useEffect(() => {
    // Establish connection if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    // Join room
    socket.emit("join_private_room", { roomId });

    const onRoomJoined = (data: PrivateRoomLobby) => {
      setLobby(data);
      setErrorMsg(null);
    };

    const onRoomUpdated = (data: PrivateRoomLobby) => {
      setLobby(data);
    };

    const onRoomDisbanded = (data: { message: string }) => {
      alert(data.message || "Room dibubarkan oleh host.");
      router.push("/duel/choose-mode");
    };

    const onRoomError = (data: { message: string }) => {
      setErrorMsg(data.message);
    };

    const onMatchFound = (data: { matchId: string; opponent: any; battleMode: string }) => {
      // Redirect directly to the arena
      router.push(`/arena/${data.matchId}`);
    };

    socket.on("private_room_created", onRoomJoined);
    socket.on("private_room_joined", onRoomJoined);
    socket.on("private_room_updated", onRoomUpdated);
    socket.on("private_room_disbanded", onRoomDisbanded);
    socket.on("private_room_error", onRoomError);
    socket.on("match_found", onMatchFound);

    // Fetch friends list
    fetchFriends();

    return () => {
      socket.off("private_room_created", onRoomJoined);
      socket.off("private_room_joined", onRoomJoined);
      socket.off("private_room_updated", onRoomUpdated);
      socket.off("private_room_disbanded", onRoomDisbanded);
      socket.off("private_room_error", onRoomError);
      socket.off("match_found", onMatchFound);
      
      // Leave room on unmount
      socket.emit("leave_private_room", { roomId });
    };
  }, [roomId, router]);

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const response = await api.get<Friend[]>("/friends/list");
      setFriends(response.data);
    } catch (err) {
      console.error("Failed to load friends", err);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveRoom = () => {
    socket.emit("leave_private_room", { roomId });
    router.push("/duel/choose-mode");
  };

  const handleToggleReady = () => {
    socket.emit("toggle_ready", { roomId });
  };

  const handleChangeMode = (mode: string) => {
    if (!isHost) return;
    socket.emit("change_room_mode", { roomId, mode });
  };

  const handleInviteFriend = (friendId: string) => {
    socket.emit("invite_friend_to_room", { roomId, friendId });
    setInvitedFriends(prev => ({ ...prev, [friendId]: true }));
    setTimeout(() => {
      setInvitedFriends(prev => ({ ...prev, [friendId]: false }));
    }, 5000);
  };

  const handleStartMatch = () => {
    if (!isHost || lobby?.players.length !== 2 || !isGuestReady) return;
    socket.emit("start_private_room_match", { roomId });
  };

  // Modes metadata
  const modesMeta = [
    { id: "LIGHTNING", name: "Lightning", desc: "10s per soal • 20 soal", icon: Zap, color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
    { id: "ARENA", name: "Arena", desc: "15s per soal • 20 soal", icon: Shield, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
    { id: "STRATEGY", name: "Strategy", desc: "Taktis • Hidden Timer", icon: EyeOff, color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
    { id: "MARATHON", name: "Marathon", desc: "35s per soal • 50 soal", icon: Trophy, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" }
  ];

  const currentModeMeta = modesMeta.find(m => m.id === lobby?.mode) || modesMeta[1];
  const ModeIcon = currentModeMeta.icon;

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-bg-main text-white flex flex-col justify-center items-center p-4">
        <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-red-500/30 text-center neon-glow-red">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto animate-bounce" />
          <h2 className="text-2xl font-black mt-4 font-heading">Akses Ditolak</h2>
          <p className="text-slate-400 mt-2 font-ui">{errorMsg}</p>
          <Link href="/duel/choose-mode" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-bold transition-all cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
        </div>
      </div>
    );
  }

  if (!lobby) {
    return (
      <div className="min-h-screen bg-bg-main text-white flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-12 h-12 text-neon-blue animate-spin" />
        <p className="text-slate-400 text-sm font-medium animate-pulse font-ui">Memasuki Lobby Room...</p>
      </div>
    );
  }

  const hostPlayer = lobby.players.find(p => p.userId === lobby.hostId);

  return (
    <div className="min-h-screen bg-bg-main text-text-primary py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-between overflow-x-hidden">
      <PageTransition className="max-w-6xl mx-auto w-full flex-grow flex flex-col justify-start">
        {/* Back Link */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={handleLeaveRoom}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors duration-200 group text-sm font-ui cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Keluar Lobby
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 font-heading">
            Room Duel Privat
          </span>
        </div>

        {/* Top Info Banner */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/5 rounded-full blur-2xl -z-10" />
          <div className="flex items-center gap-4 min-w-0">
            <div className={`p-4 rounded-2xl border ${currentModeMeta.color} shrink-0`}>
              <ModeIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white font-heading tracking-wide">
                  {currentModeMeta.name} Mode
                </h1>
                <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan shrink-0">
                  CASUAL
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-ui mt-1">
                {currentModeMeta.desc} • Duel persahabatan tidak memengaruhi MMR global
              </p>
            </div>
          </div>

          {/* Room ID Badge */}
          <div className="flex flex-col items-end shrink-0 w-full sm:w-auto">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-heading mb-1.5">
              KODE LOBBY
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial text-center sm:text-left px-5 py-3 rounded-2xl border border-neon-blue/30 bg-neon-blue/5 text-neon-cyan font-black text-lg font-heading tracking-widest shadow-[0_0_15px_rgba(0,240,255,0.08)]">
                {roomId}
              </div>
              <button
                onClick={handleCopyCode}
                className="p-3.5 rounded-2xl border border-white/10 bg-bg-surface/50 hover:bg-bg-surface hover:text-neon-cyan transition-all cursor-pointer text-slate-400"
                title="Salin Kode Room"
              >
                {copied ? <Check className="w-5 h-5 text-neon-cyan" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
          {/* Players List (Column 1 & 2) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h2 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wider font-heading">
              <Users className="w-5 h-5 text-neon-blue" /> Gladiator di Room ({lobby.players.length}/2)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* Host Player Card */}
              {hostPlayer && (
                <div className="glass-card rounded-3xl p-6 border border-neon-blue/20 bg-bg-card relative overflow-hidden flex flex-col justify-between items-center text-center h-[260px]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue to-neon-cyan" />
                  <div className="text-right w-full">
                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-neon-blue/30 bg-neon-blue/10 text-neon-cyan font-heading">
                      HOST
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full border-2 border-neon-blue bg-neon-blue/10 flex items-center justify-center font-heading text-xl font-black text-neon-blue shadow-[0_0_20px_rgba(0,240,255,0.15)]">
                      {hostPlayer.username.slice(0, 2).toUpperCase()}
                    </div>
                    <h3 className="text-lg font-black text-white mt-3 font-heading">@{hostPlayer.username}</h3>
                    <p className="text-[10px] font-bold text-slate-400 font-ui mt-0.5 uppercase tracking-widest">Siap bertanding</p>
                  </div>
                  <div className="w-full flex justify-center text-xs font-bold text-neon-green flex items-center gap-1.5 font-heading">
                    <CheckCircle2 className="w-4 h-4" /> HOST READY
                  </div>
                </div>
              )}

              {/* Guest Player Card */}
              {guestPlayer ? (
                <div className={`glass-card rounded-3xl p-6 border ${isGuestReady ? "border-neon-purple/20" : "border-white/5"} bg-bg-card relative overflow-hidden flex flex-col justify-between items-center text-center h-[260px]`}>
                  {isGuestReady && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-purple to-neon-pink" />}
                  <div className="text-right w-full">
                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-slate-700 bg-slate-800 text-slate-300 font-heading">
                      GUEST
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-full border-2 ${isGuestReady ? "border-neon-purple text-neon-purple bg-neon-purple/10" : "border-slate-700 text-slate-400 bg-slate-800"} flex items-center justify-center font-heading text-xl font-black`}>
                      {guestPlayer.username.slice(0, 2).toUpperCase()}
                    </div>
                    <h3 className="text-lg font-black text-white mt-3 font-heading">@{guestPlayer.username}</h3>
                    <p className="text-[10px] font-bold text-slate-450 font-ui mt-0.5 uppercase tracking-widest">
                      {isGuestReady ? "Siap bertanding" : "Sedang bersiap..."}
                    </p>
                  </div>
                  <div className={`w-full flex justify-center text-xs font-black flex items-center gap-1.5 font-heading ${isGuestReady ? "text-neon-purple" : "text-amber-500 animate-pulse"}`}>
                    {isGuestReady ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> GLADIATOR READY
                      </>
                    ) : (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> MENUNGGU READY
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-3xl p-6 border border-white/5 bg-bg-card/40 border-dashed flex flex-col justify-center items-center text-center h-[260px] relative overflow-hidden">
                  <div className="w-16 h-16 rounded-full border-2 border-slate-800 border-dashed flex items-center justify-center text-slate-700 animate-pulse">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-slate-500 mt-4 font-heading uppercase tracking-widest">Menunggu Lawan...</h3>
                  <p className="text-xs text-slate-650 max-w-[200px] mt-1 font-ui">Bagikan kode room atau undang teman dari panel kanan.</p>
                </div>
              )}
            </div>

            {/* Game Controls Footer */}
            <div className="glass-card rounded-3xl p-6 border border-white/5 bg-bg-surface flex flex-col md:flex-row items-center justify-between gap-4 w-full">
              <div className="text-center md:text-left">
                <h4 className="text-sm font-black text-white font-heading">
                  {isHost ? "Mulai Duel Kompetisi" : "Konfirmasi Kesiapan Anda"}
                </h4>
                <p className="text-xs text-slate-400 font-ui mt-0.5">
                  {isHost 
                    ? "Pertandingan bisa dimulai setelah lawan masuk dan menandai status SIAP."
                    : "Klik tombol Siap untuk memberi tahu host bahwa Anda siap bertanding."
                  }
                </p>
              </div>

              {isHost ? (
                <button
                  onClick={handleStartMatch}
                  disabled={lobby.players.length !== 2 || !isGuestReady}
                  className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider font-heading flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    lobby.players.length === 2 && isGuestReady
                      ? "bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-lg hover:shadow-[0_0_24px_rgba(0,240,255,0.35)] hover:-translate-y-0.5"
                      : "bg-bg-surface border border-white/5 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <Play className="w-5 h-5" />
                  Mulai Pertandingan
                </button>
              ) : (
                <button
                  onClick={handleToggleReady}
                  className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider font-heading flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    isGuestReady
                      ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                      : "bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-lg hover:shadow-[0_0_20px_rgba(176,38,255,0.3)] hover:-translate-y-0.5"
                  }`}
                >
                  {isGuestReady ? "Batalkan Siap" : "Tandai Siap"}
                </button>
              )}
            </div>
          </div>

          {/* Lobby Settings & Invite Sidebar (Column 3) */}
          <div className="flex flex-col gap-6 w-full">
            {/* Mode selection for Host */}
            <div className="glass-card rounded-3xl p-6 border border-white/5 bg-bg-surface">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-heading mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-neon-gold" /> Pengaturan Mode
              </h3>
              
              <div className="flex flex-col gap-3">
                {modesMeta.map((mode) => {
                  const MIcon = mode.icon;
                  const isSelected = lobby.mode === mode.id;
                  
                  return (
                    <button
                      key={mode.id}
                      onClick={() => isHost && handleChangeMode(mode.id)}
                      disabled={!isHost}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all relative overflow-hidden ${
                        isSelected
                          ? "border-neon-blue/30 bg-neon-blue/5 text-white"
                          : isHost 
                            ? "border-white/5 bg-black/10 text-slate-400 hover:border-white/10 hover:text-white cursor-pointer"
                            : "border-white/5 bg-black/5 text-slate-500 cursor-default"
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl border shrink-0 ${isSelected ? currentModeMeta.color : "border-slate-800 text-slate-500"}`}>
                        <MIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black font-heading flex items-center gap-1.5">
                          {mode.name}
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate font-ui">{mode.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Invite Friends Panel */}
            <div className="glass-card rounded-3xl p-6 border border-white/5 bg-bg-surface flex flex-col max-h-[360px]">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-heading mb-4 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-neon-cyan" /> Undang Teman
              </h3>

              <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
                {loadingFriends ? (
                  <div className="text-center py-6 text-slate-500 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-neon-blue" />
                    <span className="text-[10px] uppercase font-bold tracking-widest font-heading">Memuat Teman...</span>
                  </div>
                ) : friends.filter(f => f.status === "ONLINE").length > 0 ? (
                  friends
                    .filter(f => f.status === "ONLINE")
                    .map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-white/5 bg-black/20 hover:border-white/10 transition-all">
                        <div className="flex items-center gap-2.5 min-w-0 font-ui">
                          <div className="w-8 h-8 rounded-full border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan flex items-center justify-center font-bold text-xs shrink-0">
                            {friend.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-white">@{friend.username}</p>
                            <span className="text-[8px] font-black uppercase text-neon-green tracking-widest font-heading flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-neon-green" /> ONLINE
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleInviteFriend(friend.id)}
                          disabled={invitedFriends[friend.id]}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider font-heading transition-all shrink-0 cursor-pointer ${
                            invitedFriends[friend.id]
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                              : "bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20"
                          }`}
                        >
                          {invitedFriends[friend.id] ? "Dikirim" : "Undang"}
                        </button>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-slate-500 font-ui text-xs">
                    Tidak ada teman yang sedang online saat ini.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}

export default function RoomLobbyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-main text-white flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-10 h-10 text-neon-blue animate-spin" />
        <p className="text-text-secondary text-sm font-medium animate-pulse font-ui">Memuat Lobby Room...</p>
      </div>
    }>
      <RoomLobbyContent />
    </Suspense>
  );
}
