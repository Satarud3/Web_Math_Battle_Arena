"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Swords, Zap, Shield, EyeOff, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";

interface BattleModeOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  glowColor: string;
  badge: string;
  rules: string[];
}

export default function ChooseModePage() {
  const router = useRouter();

  const modes: BattleModeOption[] = [
    {
      id: "LIGHTNING",
      name: "Lightning Battle",
      description: "Duel kilat berkecepatan tinggi. Siapa cepat dia menguasai arena!",
      icon: Zap,
      color: "from-amber-500 to-yellow-400",
      glowColor: "rgba(245, 158, 11, 0.15)",
      badge: "⚡ FAST PACED",
      rules: [
        "10 detik per soal",
        "Total 20 soal matematika",
        "Bonus waktu aktif (3x pengali)",
        "MMR global bertambah/berkurang",
      ],
    },
    {
      id: "ARENA",
      name: "Arena Battle",
      description: "Format tanding standar seimbang. Uji kemampuan taktik dan kecepatan.",
      icon: Shield,
      color: "from-blue-600 to-cyan-450",
      glowColor: "rgba(6, 182, 212, 0.15)",
      badge: "🔥 TOURNAMENT",
      rules: [
        "15 detik per soal",
        "Total 20 soal matematika",
        "Bonus waktu aktif (2x pengali)",
        "MMR global bertambah/berkurang",
      ],
    },
    {
      id: "STRATEGY",
      name: "Strategy Battle",
      description: "Duel taktis tanpa indikator waktu. Peringkat kecepatan respons adalah kunci.",
      icon: EyeOff,
      color: "from-purple-600 to-pink-500",
      glowColor: "rgba(168, 85, 247, 0.15)",
      badge: "🧠 HIDDEN TIMER",
      rules: [
        "45 detik waktu berpikir dasar",
        "Sudden Death 10 detik terpicu jika lawan mengunci jawaban",
        "Skor tetap berdasarkan peringkat kecepatan (100 / 70 PTS)",
        "MMR global bertambah/berkurang",
      ],
    },
    {
      id: "MARATHON",
      name: "Marathon Battle",
      description: "Uji ketahanan mental dan akurasi mutlak. Sesi panjang tanpa ruang untuk salah.",
      icon: Trophy,
      color: "from-emerald-600 to-teal-500",
      glowColor: "rgba(16, 185, 129, 0.15)",
      badge: "👑 ENDURANCE",
      rules: [
        "Total 50 soal matematika jangka panjang",
        "35 detik durasi per soal",
        "Sistem Stamina Checkpoint & Rest Area tiap 10 soal",
        "Poin akurasi flat (tanpa bonus kecepatan)",
        "MMR global bertambah/berkurang",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-bg-main text-text-primary py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-between overflow-x-hidden">
      <PageTransition className="max-w-6xl mx-auto w-full flex-grow flex flex-col justify-center">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-neon-blue transition-colors duration-200 group text-sm font-ui"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black bg-gradient-to-r from-neon-blue via-neon-purple to-neon-gold bg-clip-text text-transparent sm:text-5xl font-heading drop-shadow-[0_0_20px_rgba(0,240,255,0.25)] uppercase tracking-wider">
            Pilih Mode Duel
          </h1>
          <p className="text-slate-400 mt-3 text-sm sm:text-base max-w-xl mx-auto font-ui leading-relaxed">
            Pilih jenis pertempuran kompetitif yang sesuai dengan gaya bermainmu. Setiap mode terikat pada MMR global Anda.
          </p>
        </div>

        {/* Modes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto w-full">
          {modes.map((mode, index) => {
            const Icon = mode.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                key={mode.id}
                onClick={() => router.push(`/duel?mode=${mode.id}`)}
                className="group relative rounded-3xl border border-slate-800 bg-bg-card/70 p-6 sm:p-8 shadow-2xl transition-all duration-300 hover:border-slate-700 hover:bg-bg-card cursor-pointer overflow-hidden flex flex-col justify-between"
                style={{
                  boxShadow: `0 10px 30px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02) inset`,
                }}
                whileHover={{
                  y: -5,
                  boxShadow: `0 20px 40px -10px rgba(0,0,0,0.7), 0 0 20px ${mode.glowColor}`,
                }}
              >
                {/* Mode Glow Effect */}
                <div
                  className="absolute -right-16 -top-16 w-36 h-36 rounded-full blur-3xl opacity-10 group-hover:opacity-25 transition-opacity duration-300"
                  style={{ backgroundColor: `var(--color-neon-${mode.id === "LIGHTNING" ? "gold" : mode.id === "ARENA" ? "blue" : mode.id === "STRATEGY" ? "purple" : "green"})` }}
                />

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${mode.color} text-black font-bold shadow-md shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/5 bg-white/5 text-slate-350">
                      {mode.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white group-hover:text-neon-cyan transition-colors font-heading mb-2">
                    {mode.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 font-ui leading-relaxed mb-6">
                    {mode.description}
                  </p>
                </div>

                <div className="border-t border-slate-850 pt-4">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 font-heading">
                    Aturan Pertandingan:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-350 font-ui">
                    {mode.rules.map((rule, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${mode.color}`} />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </PageTransition>
    </div>
  );
}
