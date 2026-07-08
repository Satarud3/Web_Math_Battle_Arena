"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, FileQuestion, Swords, RadioTower, PlusCircle, FolderPlus,
  ShieldAlert, Clock, RefreshCw
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { getApiStatus } from "@/lib/errors";
import ClientDateFormatter from "@/components/ui/ClientDateFormatter";

interface AdminStats {
  totalUsers: number;
  totalQuestions: number;
  totalActiveMatches: number;
}

interface RecentUser {
  id: string;
  name: string;
  username: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  role: string;
}

interface MatchPlayer {
  userId: string;
  totalScore: number;
  result: string | null;
  user: {
    username: string;
  };
}

interface RecentMatch {
  id: string;
  mode: string;
  status: string;
  winnerUserId: string | null;
  createdAt: string;
  winner?: {
    username: string;
  } | null;
  matchPlayers: MatchPlayer[];
}

export default function AdminPage() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdminData = useCallback(async () => {
    try {
      setError(null);
      const [statsRes, usersRes, matchesRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/users/recent"),
        api.get("/admin/matches/recent"),
      ]);

      setStats(statsRes.data);
      setRecentUsers(usersRes.data);
      setRecentMatches(matchesRes.data);
    } catch (error: unknown) {
      console.error("Failed to fetch admin dashboard data", error);
      setError("Gagal mengambil data administratif. Pastikan Anda masuk sebagai ADMIN.");
      const status = getApiStatus(error);
      if (status === 401 || status === 403) {
        logout();
        router.push("/login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout, router]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchAdminData());
  }, [fetchAdminData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Panel Kontrol Admin
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Pantau statistik global, perbarui database soal, dan kelola aktivitas game.
            </p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#121824] hover:bg-[#172030] border border-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span>Segarkan</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400 text-sm flex items-center gap-2.5">
            <ShieldAlert size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-28 rounded-xl bg-[#0E131F] animate-pulse border border-slate-800" />
            ))
          ) : (
            <>
              {/* Stat Total Users */}
              <div className="p-5 bg-[#0E131F] border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total User Terdaftar</span>
                  <div className="text-3xl font-black text-white mt-1.5">{stats?.totalUsers || 0}</div>
                  <span className="text-[9px] text-indigo-400 font-semibold">Aktif di Arena</span>
                </div>
                <div className="w-11 h-11 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center text-lg">
                  <Users size={19} aria-hidden="true" />
                </div>
              </div>

              {/* Stat Total Questions */}
              <div className="p-5 bg-[#0E131F] border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Soal</span>
                  <div className="text-3xl font-black text-white mt-1.5">{stats?.totalQuestions || 0}</div>
                  <span className="text-[9px] text-emerald-400 font-semibold">Aktif di Bank Soal</span>
                </div>
                <div className="w-11 h-11 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center text-lg">
                  <FileQuestion size={19} aria-hidden="true" />
                </div>
              </div>

              {/* Stat Active Matches */}
              <div className="p-5 bg-[#0E131F] border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Duel Berjalan</span>
                  <div className="text-3xl font-black text-white mt-1.5">{stats?.totalActiveMatches || 0}</div>
                  <span className="text-[9px] text-purple-400 font-semibold">Matchmaking Real-time</span>
                </div>
                <div className="w-11 h-11 bg-purple-500/10 text-purple-400 rounded-lg flex items-center justify-center text-lg">
                  <Swords size={19} aria-hidden="true" />
                </div>
              </div>

              {/* Stat Active Rooms */}
              <div className="p-5 bg-[#0E131F] border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Rooms</span>
                  <div className="text-3xl font-black text-white mt-1.5">{stats?.totalActiveMatches || 0}</div>
                  <span className="text-[9px] text-amber-400 font-semibold">Tersinkronisasi Socket.IO</span>
                </div>
                <div className="w-11 h-11 bg-amber-500/10 text-amber-400 rounded-lg flex items-center justify-center text-lg">
                  <RadioTower size={19} aria-hidden="true" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Action Area */}
        <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">Tindakan Cepat (Quick Actions)</h3>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => router.push("/admin/questions/create")}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md"
            >
              <PlusCircle size={14} />
              <span>Tambah Soal</span>
            </button>
            <button 
              onClick={() => router.push("/admin/categories")}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#172030] hover:bg-[#202C42] border border-slate-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              <FolderPlus size={14} className="text-indigo-400" />
              <span>Tambah Kategori</span>
            </button>
          </div>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Recent Users Table */}
          <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-6 flex flex-col">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Users size={16} className="text-indigo-400" />
              User Pendaftar Terbaru
            </h3>

            {loading ? (
              <div className="h-48 bg-[#0B0F15] rounded-xl animate-pulse" />
            ) : recentUsers.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">Belum ada user terdaftar.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-400 font-semibold">
                      <th className="py-3 px-2">Nama</th>
                      <th className="py-3 px-2">Username</th>
                      <th className="py-3 px-2">Email</th>
                      <th className="py-3 px-2">Role</th>
                      <th className="py-3 px-2">Terdaftar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {recentUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#121927]/30 transition-colors">
                        <td className="py-3 px-2 font-semibold text-white">{u.name}</td>
                        <td className="py-3 px-2 text-indigo-400">@{u.username}</td>
                        <td className="py-3 px-2 text-slate-400">{u.email}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === "ADMIN" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-[10px] text-slate-500">
                          <ClientDateFormatter dateString={u.createdAt} options={{ day: "numeric", month: "short" }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Matches Table */}
          <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-6 flex flex-col">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Clock size={16} className="text-emerald-400" />
              Pertandingan Terbaru di Sistem
            </h3>

            {loading ? (
              <div className="h-48 bg-[#0B0F15] rounded-xl animate-pulse" />
            ) : recentMatches.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">Belum ada pertandingan berlangsung.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-400 font-semibold">
                      <th className="py-3 px-2">ID Match</th>
                      <th className="py-3 px-2">Mode</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2">Pemain</th>
                      <th className="py-3 px-2">Pemenang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {recentMatches.map((m) => (
                      <tr key={m.id} className="hover:bg-[#121927]/30 transition-colors">
                        <td className="py-3 px-2 font-mono text-[10px] text-slate-500">
                          {m.id.substring(0, 8)}...
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-bold text-slate-300">{m.mode}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            m.status === "FINISHED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : m.status === "ACTIVE" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-400">
                          {m.matchPlayers.map((p) => p.user.username).join(" vs ") || "-"}
                        </td>
                        <td className="py-3 px-2 font-semibold text-emerald-400">
                          {m.winner ? `@${m.winner.username}` : m.status === "FINISHED" ? "DRAW" : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
  );
}
