"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users, BookOpenCheck, History, LogOut, 
  FolderPlus, Star, Sigma
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

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

  const menuItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Kelola User", icon: Users, isPlaceholder: true },
    { href: "/admin/categories", label: "Kelola Kategori", icon: FolderPlus },
    { href: "/admin/questions", label: "Kelola Soal", icon: BookOpenCheck },
    { href: "/admin/matches", label: "Riwayat Match", icon: History, isPlaceholder: true },
    { href: "/leaderboard", label: "Leaderboard", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Shared Admin Sidebar */}
      <aside className="w-full md:w-64 bg-[#0E131F] border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <Sigma className="h-6 w-6 text-neon-cyan" aria-hidden="true" />
          <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">MBA ADMIN</span>
          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-[10px] text-purple-400 border border-purple-500/20 font-bold">
            PRO
          </span>
        </div>

        <nav className="p-4 flex-grow flex flex-col gap-1 text-sm font-medium">
          {menuItems.map((item) => {
            // Check if current path matches item href (handling subroutes as active except for root /admin)
            const isActive = item.href === "/admin" 
              ? pathname === "/admin" 
              : pathname.startsWith(item.href);
            
            if (item.isPlaceholder) {
              return (
                <button
                  key={item.href}
                  disabled
                  title="Module belum tersedia"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-slate-600 transition-all text-left bg-transparent border-none cursor-not-allowed"
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all ${
                  isActive
                    ? "bg-[#1E1B4B] text-indigo-400 border-indigo-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#131A2B] border-transparent"
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2.5 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm">
              A
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">{user?.name || "Admin"}</div>
              <span className="text-[9px] text-slate-400">@{user?.username || "admin"}</span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/10 transition-all cursor-pointer bg-transparent"
          >
            <LogOut size={14} />
            <span>Log Out Admin</span>
          </button>
        </div>
      </aside>

      {/* Admin Children Content Container */}
      <div className="flex-grow overflow-y-auto">
        {children}
      </div>

    </div>
  );
}
