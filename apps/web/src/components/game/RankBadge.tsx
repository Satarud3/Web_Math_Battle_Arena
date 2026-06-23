interface RankBadgeProps {
  tier?: string | null;
  ratingPoint?: number | null;
}

const rankMap: Record<string, { label: string; color: string; target: string }> = {
  bronze: { label: "Apprentice", color: "text-amber-300 border-amber-400/30 bg-amber-400/10", target: "Euler" },
  silver: { label: "Euler", color: "text-slate-200 border-slate-300/30 bg-slate-200/10", target: "Newton" },
  gold: { label: "Newton", color: "text-yellow-300 border-yellow-300/30 bg-yellow-300/10", target: "Gauss" },
  platinum: { label: "Gauss", color: "text-cyan-300 border-cyan-300/30 bg-cyan-300/10", target: "Ramanujan" },
  master: { label: "Legend Sigma", color: "text-purple-300 border-purple-300/30 bg-purple-300/10", target: "Arena Crown" },
};

export default function RankBadge({ tier, ratingPoint = 1000 }: RankBadgeProps) {
  const key = (tier || "bronze").toLowerCase();
  const rank = rankMap[key] || rankMap.bronze;
  const progress = Math.min(100, Math.max(8, ((ratingPoint || 1000) % 500) / 5));

  return (
    <div className={`rounded-2xl border p-4 ${rank.color}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">Math Division</p>
          <p className="mt-1 text-lg font-black text-white">{rank.label}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/15 bg-white/10 text-lg font-black">
          Σ
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
        <div className="h-full rounded-full bg-current transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-[11px] font-semibold text-slate-300">
        {ratingPoint || 1000} RP menuju {rank.target}
      </p>
    </div>
  );
}
