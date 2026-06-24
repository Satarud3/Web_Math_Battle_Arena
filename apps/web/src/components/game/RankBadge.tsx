interface RankBadgeProps {
  tier?: string | null;
  ratingPoint?: number | null;
  globalRank?: number | null;
  compact?: boolean;
}

const rankMap: Record<string, { label: string; color: string; target: string; description: string; targetRp: number }> = {
  bronze: { label: "Apprentice", color: "text-amber-300 border-amber-400/30 bg-amber-400/10", target: "Euler", description: "Bangun fondasi logikamu.", targetRp: 1200 },
  silver: { label: "Euler", color: "text-slate-200 border-slate-300/30 bg-slate-200/10", target: "Newton", description: "Mulai membaca pola di arena.", targetRp: 1600 },
  gold: { label: "Newton", color: "text-yellow-300 border-yellow-300/30 bg-yellow-300/10", target: "Gauss", description: "Presisi dan tempo jadi senjatamu.", targetRp: 2000 },
  platinum: { label: "Gauss", color: "text-cyan-300 border-cyan-300/30 bg-cyan-300/10", target: "Ramanujan", description: "Kalkulasi cepat, keputusan tajam.", targetRp: 2500 },
  master: { label: "Ramanujan", color: "text-purple-300 border-purple-300/30 bg-purple-300/10", target: "Archimedes", description: "Intuisi matematis tingkat elite.", targetRp: 3000 },
  archimedes: { label: "Archimedes", color: "text-pink-300 border-pink-300/30 bg-pink-300/10", target: "Legend Sigma", description: "Puncak strategi dan ketahanan.", targetRp: 3500 },
  legend: { label: "Legend Sigma", color: "text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10", target: "Arena Crown", description: "Legenda yang membentuk arena.", targetRp: 4000 },
};

export default function RankBadge({ tier, ratingPoint = 1000, globalRank, compact = false }: RankBadgeProps) {
  const key = (tier || "bronze").toLowerCase();
  const rank = rankMap[key] || rankMap.bronze;
  const points = ratingPoint || 1000;
  const progress = Math.min(100, Math.max(8, (points / rank.targetRp) * 100));
  const remaining = Math.max(0, rank.targetRp - points);

  return (
    <div className={`rounded-2xl border ${compact ? "p-3" : "p-4"} ${rank.color}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">Math Division</p>
          <p className={`${compact ? "text-base" : "text-lg"} mt-1 font-black text-white`}>{rank.label}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/15 bg-white/10 text-lg font-black" aria-label={`${rank.label} rank badge`}>
          Σ
        </div>
      </div>
      {!compact && <p className="mt-2 text-[11px] font-medium text-slate-200">{rank.description}</p>}
      <div className={`${compact ? "mt-3" : "mt-4"} h-2 overflow-hidden rounded-full bg-black/30`} aria-label={`${Math.round(progress)} percent menuju ${rank.target}`}>
        <div className="h-full rounded-full bg-current transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-[11px] font-semibold text-slate-300">
        {remaining > 0 ? `${remaining} RP lagi menuju ${rank.target}` : `${points} RP menuju ${rank.target}`}
      </p>
      {globalRank && <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Global rank #{globalRank}</p>}
    </div>
  );
}
