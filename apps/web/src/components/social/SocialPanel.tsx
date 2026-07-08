"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { socket } from "@/lib/socket";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UserPlus, 
  UserMinus, 
  Check, 
  X, 
  Search, 
  Users, 
  UserX, 
  Loader2, 
  AlertCircle,
  XCircle,
  Swords,
  Play
} from "lucide-react";

interface Friend {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  status: "ONLINE" | "OFFLINE" | "IN_GAME";
  friendshipId: string;
}

interface PendingRequest {
  id: string;
  sender: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  };
}

interface SearchedUser {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
}

export default function SocialPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  
  // Search and Preview Card States
  const [searchUsername, setSearchUsername] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchedUser, setSearchedUser] = useState<SearchedUser | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const [searchError, setSearchError] = useState("");
  const [searchSuccess, setSearchSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Invite states
  const [activeInvite, setActiveInvite] = useState<{ inviteId: string; friendId: string; username: string } | null>(null);
  const [incomingInvite, setIncomingInvite] = useState<{ inviteId: string; senderId: string; senderUsername: string; mode: string } | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [friendsRes, requestsRes] = await Promise.all([
        api.get<Friend[]>("/friends/list"),
        api.get<PendingRequest[]>("/friends/pending"),
      ]);
      setFriends(friendsRes.data);
      setRequests(requestsRes.data);
    } catch (err) {
      console.error("Gagal memuat data pertemanan", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
    }

    // Listen to real-time status changes
    socket.on("friend_status_change", ({ userId, status }) => {
      setFriends((prevFriends) =>
        prevFriends.map((f) =>
          f.id === userId ? { ...f, status } : f
        )
      );
    });

    // Outgoing invite confirmed by server
    socket.on("invite_sent", ({ inviteId, friendId }) => {
      setActiveInvite((prev) => {
        if (prev && prev.friendId === friendId) {
          return { ...prev, inviteId };
        }
        return prev;
      });
    });

    // Incoming invite received
    socket.on("match_invite_received", ({ inviteId, senderId, senderUsername, mode }) => {
      setIncomingInvite({ inviteId, senderId, senderUsername, mode });
    });

    // Incoming invite cancelled by sender
    socket.on("match_invite_cancelled", ({ inviteId }) => {
      setIncomingInvite((prev) => (prev && prev.inviteId === inviteId ? null : prev));
    });

    // Outgoing invite rejected by recipient
    socket.on("match_invite_rejected", ({ inviteId, receiverUsername }) => {
      setActiveInvite((prev) => {
        if (prev && prev.inviteId === inviteId) {
          showToast("error", `@${receiverUsername} menolak tantangan duel Anda.`);
          return null;
        }
        return prev;
      });
    });

    // General invite error handler
    socket.on("invite_error", ({ message }) => {
      showToast("error", message);
      setActiveInvite(null);
    });

    // Redirect to match screen when private match starts
    socket.on("match_found", (data: { matchId: string }) => {
      showToast("success", "Pertandingan dimulai! Bersiaplah gladiator...");
      setActiveInvite(null);
      setIncomingInvite(null);
      setTimeout(() => {
        router.push(`/arena/${data.matchId}`);
      }, 1500);
    });

    return () => {
      socket.off("friend_status_change");
      socket.off("invite_sent");
      socket.off("match_invite_received");
      socket.off("match_invite_cancelled");
      socket.off("match_invite_rejected");
      socket.off("invite_error");
      socket.off("match_found");
    };
  }, [router]);

  // Search user profile (Preview Card phase)
  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;

    setIsSearching(true);
    setSearchError("");
    setSearchSuccess("");
    setSearchedUser(null);

    try {
      const res = await api.get<SearchedUser>(`/users/${searchUsername.trim()}/profile`);
      setSearchedUser(res.data);
    } catch (err: any) {
      const msg = err.response?.status === 404 
        ? `Gladiator @${searchUsername} tidak ditemukan`
        : "Gagal mencari gladiator";
      setSearchError(msg);
    } finally {
      setIsSearching(false);
    }
  };

  // Send friend request (Explicit confirmation from Preview Card)
  const handleSendRequest = async () => {
    if (!searchedUser) return;

    setIsAdding(true);
    setSearchError("");
    setSearchSuccess("");

    try {
      await api.post("/friends/request", { targetUsername: searchedUser.username });
      setSearchSuccess(`Permintaan pertemanan dikirim ke @${searchedUser.username}`);
      setSearchedUser(null);
      setSearchUsername("");
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Gagal mengirim permintaan pertemanan";
      setSearchError(msg);
    } finally {
      setIsAdding(false);
    }
  };

  // Accept friend request
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await api.patch(`/friends/accept/${requestId}`);
      fetchData();
    } catch (err) {
      console.error("Gagal menerima pertemanan", err);
    }
  };

  // Reject/Delete friend request or remove friend
  const handleRemoveFriendOrRequest = async (friendId: string) => {
    try {
      await api.delete(`/friends/remove/${friendId}`);
      fetchData();
    } catch (err) {
      console.error("Gagal menghapus hubungan pertemanan", err);
    }
  };

  // Outgoing private duel invitation
  const handleChallengeFriend = (friendId: string, username: string) => {
    setActiveInvite({ inviteId: "", friendId, username });
    socket.emit("send_match_invite", { friendId, mode: "ARENA" });
  };

  const handleCancelInvite = () => {
    if (activeInvite && activeInvite.inviteId) {
      socket.emit("cancel_match_invite", { inviteId: activeInvite.inviteId });
    }
    setActiveInvite(null);
  };

  // Incoming private duel actions
  const handleAcceptChallenge = () => {
    if (incomingInvite) {
      socket.emit("accept_match_invite", { inviteId: incomingInvite.inviteId });
    }
  };

  const handleRejectChallenge = () => {
    if (incomingInvite) {
      socket.emit("reject_match_invite", { inviteId: incomingInvite.inviteId });
      setIncomingInvite(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-bg-surface/35 backdrop-blur-md border border-white/5 rounded-2xl p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 animate-bounce flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl bg-[#0E1524] text-xs font-semibold ${toast.type === "success" ? "border-emerald-500/40 text-emerald-400" : "border-red-500/40 text-red-400"}`}
        >
          {toast.type === "success" ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Outgoing Challenge (Waiting) Overlay Modal */}
      {activeInvite && (
        <div className="absolute inset-0 bg-[#06080D]/90 backdrop-blur-md z-30 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.25)] animate-pulse">
            <Swords className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold text-sm mt-4">Tantangan Dikirim!</h3>
          <p className="text-slate-400 text-[10px] mt-1.5 leading-relaxed max-w-[200px]">
            Menunggu <strong className="text-indigo-400">@{activeInvite.username}</strong> menerima duel matematika Anda...
          </p>
          <button
            type="button"
            onClick={handleCancelInvite}
            className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] font-black rounded-lg transition-colors cursor-pointer border-none"
          >
            Batalkan Tantangan
          </button>
        </div>
      )}

      {/* Incoming Challenge (Accept/Reject) Overlay Modal */}
      {incomingInvite && (
        <div className="absolute inset-0 bg-[#06080D]/90 backdrop-blur-md z-30 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 bg-fuchsia-500/10 text-fuchsia-400 rounded-full flex items-center justify-center border border-fuchsia-500/20 shadow-[0_0_20px_rgba(217,70,239,0.25)] animate-bounce">
            <Swords className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold text-sm mt-4">Tantangan Duel!</h3>
          <p className="text-slate-400 text-[10px] mt-1.5 leading-relaxed max-w-[220px]">
            Gladiator <strong className="text-fuchsia-400">@{incomingInvite.senderUsername}</strong> menantang Anda bertanding di arena matematika!
          </p>
          <div className="flex gap-2 w-full mt-6">
            <button
              type="button"
              onClick={handleRejectChallenge}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] font-bold rounded-lg transition-colors cursor-pointer border-none"
            >
              Tolak
            </button>
            <button
              type="button"
              onClick={handleAcceptChallenge}
              className="flex-1 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-[10px] font-bold rounded-lg shadow-lg shadow-fuchsia-600/15 transition-all cursor-pointer flex items-center justify-center gap-1 border-none"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Terima</span>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
        <Users className="w-5 h-5 text-neon-blue" />
        <h2 className="font-heading font-black text-lg text-white tracking-wider">NEURAL SOCIAL</h2>
      </div>

      {/* User Search Form */}
      <form onSubmit={handleSearchUser} className="mb-4">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Cari username gladiator..."
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-4 pr-12 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/60 transition-colors"
          />
          <button
            type="submit"
            disabled={isSearching || !searchUsername.trim()}
            className="absolute right-1.5 h-7 px-3 bg-neon-blue/20 hover:bg-neon-blue/30 border border-neon-blue/40 rounded-lg text-[10px] font-black text-neon-blue uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
          >
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Cari</span>
              </>
            )}
          </button>
        </div>
        {searchError && (
          <p className="text-[10px] text-rose-500 mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {searchError}
          </p>
        )}
        {searchSuccess && (
          <p className="text-[10px] text-emerald-400 mt-1.5 flex items-center gap-1">
            <Check className="w-3 h-3" /> {searchSuccess}
          </p>
        )}
      </form>

      {/* Client Preview Card */}
      <AnimatePresence>
        {searchedUser && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-neon-blue/5 border border-neon-blue/20 rounded-xl flex items-center justify-between gap-3 relative overflow-hidden"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Avatar */}
              <Link 
                href={`/profile/${searchedUser.username}`}
                className="w-9 h-9 rounded-lg overflow-hidden bg-bg-surface border border-white/10 flex items-center justify-center cursor-pointer shrink-0 hover:border-indigo-500/50 transition-colors"
              >
                {searchedUser.avatarUrl ? (
                  <img
                    src={searchedUser.avatarUrl}
                    alt={searchedUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-black text-slate-400">
                    {searchedUser.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </Link>

              {/* Name Details */}
              <div className="min-w-0">
                <Link 
                  href={`/profile/${searchedUser.username}`}
                  className="text-xs font-bold text-white block hover:text-indigo-400 transition-colors truncate cursor-pointer font-sans no-underline"
                >
                  {searchedUser.name}
                </Link>
                <div className="text-[10px] text-slate-400 truncate">@{searchedUser.username}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                href={`/profile/${searchedUser.username}`}
                className="px-2.5 py-1.5 bg-[#131A26] hover:bg-slate-800 border border-white/10 text-[10px] font-black text-slate-300 rounded-lg transition-colors cursor-pointer font-sans no-underline"
              >
                Profil
              </Link>
              <button
                type="button"
                onClick={handleSendRequest}
                disabled={isAdding}
                className="px-2.5 py-1.5 bg-neon-blue hover:bg-neon-blue/80 text-[10px] font-black text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50 border-none"
              >
                {isAdding ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSearchedUser(null)}
                className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                title="Batal"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2 mb-3 border-b border-white/5 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("friends")}
          className={`flex-1 pb-1 text-xs font-black uppercase tracking-wider transition-colors relative cursor-pointer border-none bg-transparent ${
            activeTab === "friends" ? "text-neon-blue" : "text-slate-400 hover:text-white"
          }`}
        >
          Teman ({friends.length})
          {activeTab === "friends" && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue shadow-[0_0_8px_#00f0ff]"
            />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`flex-1 pb-1 text-xs font-black uppercase tracking-wider transition-colors relative cursor-pointer border-none bg-transparent ${
            activeTab === "requests" ? "text-neon-purple" : "text-slate-400 hover:text-white"
          }`}
        >
          Permintaan ({requests.length})
          {activeTab === "requests" && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-purple shadow-[0_0_8px_#d946ef]"
            />
          )}
        </button>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[350px] min-h-[200px] custom-scrollbar">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 py-8 text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-neon-blue" />
            <span>Menyelaraskan koneksi...</span>
          </div>
        ) : activeTab === "friends" ? (
          <AnimatePresence initial={false}>
            {friends.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center py-8 text-center text-slate-500"
              >
                <Users className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-xs font-medium">Belum ada teman</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Mulai dengan mencari username mereka di atas!</p>
              </motion.div>
            ) : (
              friends.map((friend) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Avatar with Status Indicator */}
                    <Link
                      href={`/profile/${friend.username}`}
                      className="relative w-8 h-8 rounded-lg overflow-hidden bg-bg-surface border border-white/10 flex items-center justify-center cursor-pointer shrink-0 hover:border-indigo-500/40 transition-colors"
                    >
                      {friend.avatarUrl ? (
                        <img
                          src={friend.avatarUrl}
                          alt={friend.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-black text-slate-400">
                          {friend.name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                      
                      {/* Status Dot */}
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-bg-main ${
                          friend.status === "ONLINE"
                            ? "bg-emerald-500 shadow-[0_0_6px_#10b981]"
                            : friend.status === "IN_GAME"
                            ? "bg-fuchsia-500 shadow-[0_0_6px_#d946ef] animate-pulse"
                            : "bg-slate-500"
                        }`}
                        title={friend.status}
                      />
                    </Link>

                    {/* Name / Username */}
                    <div className="min-w-0">
                      <Link 
                        href={`/profile/${friend.username}`}
                        className="text-xs font-bold text-white leading-none block hover:text-indigo-400 transition-colors truncate cursor-pointer font-sans no-underline"
                      >
                        {friend.name}
                      </Link>
                      <div className="text-[10px] text-slate-400 mt-1 truncate">@{friend.username}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {friend.status === "IN_GAME" ? (
                      <span className="text-[8px] font-black text-fuchsia-400 bg-fuchsia-950/40 border border-fuchsia-900/50 px-1.5 py-0.5 rounded uppercase tracking-wider mr-1">
                        IN BATTLE
                      </span>
                    ) : friend.status === "ONLINE" ? (
                      <button
                        type="button"
                        onClick={() => handleChallengeFriend(friend.id, friend.username)}
                        className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 text-indigo-400 rounded-lg hover:border-indigo-500/40 transition-all cursor-pointer mr-1 bg-transparent"
                        title="Tantang Duel Matematika"
                      >
                        <Swords className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleRemoveFriendOrRequest(friend.id)}
                      className="p-1.5 hover:bg-rose-950/30 hover:text-rose-400 text-slate-400 rounded-lg border border-transparent hover:border-rose-900/40 transition-all cursor-pointer bg-transparent"
                      title="Hapus Teman"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        ) : (
          <AnimatePresence initial={false}>
            {requests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center py-8 text-center text-slate-500"
              >
                <UserX className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-xs font-medium">Tidak ada permintaan</p>
              </motion.div>
            ) : (
              requests.map((req) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Avatar */}
                    <Link
                      href={`/profile/${req.sender.username}`}
                      className="w-8 h-8 rounded-lg overflow-hidden bg-bg-surface border border-white/10 flex items-center justify-center cursor-pointer shrink-0 hover:border-indigo-500/40 transition-colors"
                    >
                      {req.sender.avatarUrl ? (
                        <img
                          src={req.sender.avatarUrl}
                          alt={req.sender.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-black text-slate-400">
                          {req.sender.name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </Link>

                    {/* Name / Username */}
                    <div className="min-w-0">
                      <Link 
                        href={`/profile/${req.sender.username}`}
                        className="text-xs font-bold text-white leading-none block hover:text-indigo-400 transition-colors truncate cursor-pointer font-sans no-underline"
                      >
                        {req.sender.name}
                      </Link>
                      <div className="text-[10px] text-slate-400 mt-1 truncate">@{req.sender.username}</div>
                    </div>
                  </div>

                  {/* Accept / Reject Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAcceptRequest(req.id)}
                      className="p-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                      title="Setujui"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveFriendOrRequest(req.sender.id)}
                      className="p-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                      title="Tolak"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
