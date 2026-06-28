"use client";

import React, { useEffect, useState } from "react";
import { Target, ShieldCheck, Zap, Flame, BookOpen, Lock, Loader2, Award, type LucideIcon } from "lucide-react";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  requirementType: string;
  requirementValue: number;
  rewardPoint: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
}

interface AchievementGridProps {
  achievements?: Achievement[];
  loading?: boolean;
  compact?: boolean;
  limit?: number;
  showHeader?: boolean;
}

const IconMapper: Record<string, LucideIcon> = {
  Target: Target,
  ShieldCheck: ShieldCheck,
  Zap: Zap,
  Flame: Flame,
  BookOpen: BookOpen,
};

const GlowMapper: Record<string, { border: string; glow: string; text: string; bg: string }> = {
  Target: {
    border: "border-rose-500/40",
    glow: "shadow-[0_0_20px_rgba(244,63,94,0.25)]",
    text: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  ShieldCheck: {
    border: "border-emerald-500/40",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.25)]",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  Zap: {
    border: "border-amber-500/40",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.25)]",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  Flame: {
    border: "border-orange-500/40",
    glow: "shadow-[0_0_20px_rgba(249,115,22,0.25)]",
    text: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  BookOpen: {
    border: "border-purple-500/40",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.25)]",
    text: "text-purple-400",
    bg: "bg-purple-500/10",
  },
};

export default function AchievementGrid({
  achievements: controlledAchievements,
  loading: controlledLoading = false,
  compact = false,
  limit,
  showHeader = true,
}: AchievementGridProps = {}) {
  const [fetchedAchievements, setFetchedAchievements] = useState<Achievement[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isControlled = controlledAchievements !== undefined;

  useEffect(() => {
    if (isControlled) return;

    const fetchAchievements = async () => {
      try {
        const res = await api.get("/achievements/me");
        setFetchedAchievements(res.data);
      } catch (err: unknown) {
        console.error("Gagal mengambil data pencapaian", err);
        setError(getApiErrorMessage(err, "Gagal memuat daftar pencapaian."));
      } finally {
        setFetching(false);
      }
    };

    fetchAchievements();
  }, [isControlled]);

  const achievements = controlledAchievements ?? fetchedAchievements;
  const visibleAchievements = typeof limit === "number" ? achievements.slice(0, limit) : achievements;
  const loading = isControlled ? controlledLoading : fetching;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-sm font-medium animate-pulse">Memuat data pencapaian...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 text-center text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-black text-slate-200 uppercase tracking-wider">
          Pencapaian & Medali
        </h3>
      </div>}

      <div className={`grid grid-cols-1 gap-4 ${compact ? "" : "sm:grid-cols-2 md:grid-cols-3"}`}>
        {achievements.length === 0 && (
          <div className="col-span-full grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-700 bg-bg-card/40 p-6 text-center">
            <div>
              <Award className="mx-auto h-8 w-8 text-slate-600" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold text-slate-300">Belum ada pencapaian untuk ditampilkan.</p>
              <p className="mt-1 text-xs text-slate-500">Selesaikan latihan atau duel untuk mulai membuka medali.</p>
            </div>
          </div>
        )}
        {visibleAchievements.map((ach) => {
          const IconComponent = IconMapper[ach.icon] || Award;
          const style = GlowMapper[ach.icon] || {
            border: "border-slate-800",
            glow: "",
            text: "text-slate-400",
            bg: "bg-slate-850",
          };

          if (!ach.isUnlocked) {
            return (
              <div
                key={ach.id}
                className={`relative bg-[#0E1524]/40 border border-slate-800/60 rounded-2xl ${compact ? "p-4" : "p-5"} flex items-start gap-4 opacity-50 grayscale transition-all duration-300 hover:opacity-60`}
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800/40 border border-slate-700 flex items-center justify-center shrink-0 text-slate-500">
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400 text-sm truncate">{ach.name}</span>
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ach.description}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full w-0 rounded-full bg-slate-500" />
                  </div>
                  <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-600">Terkunci</p>
                </div>
              </div>
            );
          }

          return (
            <div
              key={ach.id}
              className={`relative bg-[#0E1524]/80 border ${style.border} ${style.glow} rounded-2xl ${compact ? "p-4" : "p-5"} flex items-start gap-4 transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className={`w-12 h-12 rounded-xl ${style.bg} border ${style.border} flex items-center justify-center shrink-0 ${style.text}`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-slate-100 text-sm truncate">{ach.name}</span>
                  <span className="text-[10px] font-bold text-emerald-400 shrink-0 uppercase tracking-wider">
                    Terbuka
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{ach.description}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/30">
                  <div className={`h-full w-full rounded-full ${style.bg}`} />
                </div>
                <div className="text-[9px] text-slate-500 mt-3 font-semibold">
                  Didapatkan pada:{" "}
                  {new Date(ach.unlockedAt!).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
