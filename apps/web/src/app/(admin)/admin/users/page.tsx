"use client";

import React, { useCallback, useEffect, useState } from "react";
import { 
  Users, ShieldAlert, Trash2, Search, X, CheckCircle, 
  AlertTriangle, RefreshCw, ChevronLeft, ChevronRight,
  Shield, UserCheck, UserX, Trash
} from "lucide-react";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  role: string;
}

interface Toast {
  type: "success" | "error" | "info";
  message: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Action states
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        search: debouncedSearch || undefined,
        page,
        limit,
      };
      const response = await api.get("/admin/users", { params });
      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (err: unknown) {
      console.error("Gagal memuat daftar user", err);
      setError("Gagal memuat daftar user. Pastikan Anda masuk sebagai ADMIN.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, limit]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchUsers());
  }, [fetchUsers]);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setActionLoading(`status-${userId}`);
      await api.patch(`/admin/users/${userId}/status`);
      showToast("success", `Status user berhasil ${currentStatus ? "dinonaktifkan" : "diaktifkan"}!`);
      fetchUsers();
    } catch (err: unknown) {
      console.error("Gagal merubah status user", err);
      showToast("error", getApiErrorMessage(err, "Gagal mengubah status user"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setActionLoading(`role-${userId}`);
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      showToast("success", `Role user berhasil diubah menjadi ${newRole}!`);
      fetchUsers();
    } catch (err: unknown) {
      console.error("Gagal merubah role user", err);
      showToast("error", getApiErrorMessage(err, "Gagal mengubah role user"));
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/admin/users/${deleteTarget.id}`);
      showToast("success", `Akun @${deleteTarget.username} berhasil dihapus dari database.`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: unknown) {
      console.error("Gagal menghapus user", err);
      showToast("error", getApiErrorMessage(err, "Gagal menghapus user"));
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 animate-bounce flex items-center gap-3 px-5 py-4 rounded-xl border shadow-2xl bg-[#0E1524] text-xs font-semibold ${toast.type === "success" ? "border-emerald-500/40 text-emerald-400" : "border-red-500/40 text-red-400"}`}
        >
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Users className="text-indigo-400" size={28} />
            <span>Kelola User</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pantau dan kelola hak akses gladiator, atur hak admin, serta blokir/hapus akun user.
          </p>
        </div>
        <button 
          onClick={fetchUsers}
          className="p-2.5 bg-[#121824] hover:bg-[#172030] border border-slate-700 text-slate-300 rounded-lg transition-all cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#0E131F]/80 backdrop-blur border border-white/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="relative flex-grow max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="Cari user berdasarkan nama, username, atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#131A26] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 bg-[#131A26] px-4 py-2.5 rounded-xl border border-white/5">
          <Users size={14} className="text-indigo-400" />
          <span>Total Gladiator Terdaftar: <strong className="text-white">{total}</strong></span>
        </div>
      </div>

      {/* User Table container */}
      <div className="bg-[#0E131F]/80 backdrop-blur border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-10 space-y-4">
            <div className="h-6 w-1/4 bg-[#141B2D] rounded animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-12 bg-[#141B2D] rounded animate-pulse" />
              ))}
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
            <Users className="mb-2 h-10 w-10 text-slate-500" aria-hidden="true" />
            <h4 className="font-bold text-white text-sm">User Tidak Ditemukan</h4>
            <p className="mt-1">Tidak ada user yang cocok dengan kriteria pencarian Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-semibold bg-[#111827]/40">
                  <th className="py-4 px-6">Gladiator Info</th>
                  <th className="py-4 px-6 w-52">Email</th>
                  <th className="py-4 px-6 text-center w-36">Role</th>
                  <th className="py-4 px-6 text-center w-28">Status Keaktifan</th>
                  <th className="py-4 px-6 text-right w-44">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {users.map((u) => {
                  const isStatusLoading = actionLoading === `status-${u.id}`;
                  const isRoleLoading = actionLoading === `role-${u.id}`;

                  return (
                    <tr key={u.id} className={`hover:bg-[#121927]/30 transition-colors ${!u.isActive ? "opacity-55" : ""}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 shadow-md">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm leading-snug">{u.name}</div>
                            <div className="text-slate-400 text-xs mt-0.5">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-medium">{u.email}</td>
                      <td className="py-4 px-6 text-center">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={isRoleLoading}
                          className="bg-[#131A26] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <option value="PLAYER">PLAYER</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="MODERATOR">MODERATOR</option>
                        </select>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          u.isActive 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-slate-800 text-slate-500 border border-slate-700"
                        }`}>
                          {u.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2.5">
                          <button
                            onClick={() => handleToggleStatus(u.id, u.isActive)}
                            disabled={isStatusLoading}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
                              u.isActive
                                ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20"
                                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                            }`}
                            title={u.isActive ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                          >
                            {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                          <button 
                            onClick={() => setDeleteTarget(u)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Akun Permanen"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center bg-[#0E131F]/30">
            <span className="text-slate-400 text-xs">
              Halaman <strong className="text-white">{page}</strong> dari <strong className="text-white">{totalPages}</strong> ({total} total data)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-white/10 hover:bg-white/5 text-slate-300 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-white/10 hover:bg-white/5 text-slate-300 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-[#06080D]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E131F] border border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <AlertTriangle size={24} aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hapus Akun Gladiator?</h3>
                <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                  Apakah Anda yakin ingin menghapus akun <strong className="text-white">{deleteTarget.name} (@{deleteTarget.username})</strong> secara permanen?
                  <br />
                  <span className="text-[10px] text-red-400 font-semibold block mt-3 bg-red-950/20 p-3 rounded-xl border border-red-900/30 text-left">
                    Peringatan: Tindakan ini bersifat destruktif dan akan menghapus seluruh data statistik game, peringkat MMR, riwayat transaksi MMR, pencapaian, dan jawaban pertandingan yang berkaitan dengan user ini!
                  </span>
                </p>
              </div>

              <div className="flex w-full gap-3 mt-2">
                <button 
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {deleting ? "Menghapus..." : "Ya, Hapus Akun"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
