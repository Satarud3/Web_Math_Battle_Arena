"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Brain, Sparkles, Play, Target, CheckCircle2, Flame, Trophy, Award, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import MathBackground from "@/components/ui/MathBackground";
import PageTransition from "@/components/PageTransition";
import GlassCard from "@/components/ui/GlassCard";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface StartPracticePayload {
  totalQuestions: number;
  categoryId?: string;
  difficulty?: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  isCompleted: boolean;
}

interface CampInfo {
  challenges: Challenge[];
  currentLevel: number;
  currentXp: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  currentStreak: number;
}

export default function PracticeSetupPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [campInfo, setCampInfo] = useState<CampInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCamp, setLoadingCamp] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Categories on Mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/question-categories");
        setCategories(response.data);
      } catch (err: unknown) {
        console.error("Gagal mengambil kategori", err);
        setError(getApiErrorMessage(err, "Gagal memuat kategori soal. Silakan coba beberapa saat lagi."));
      } finally {
        setLoading(false);
      }
    };

    const fetchCampInfo = async () => {
      try {
        const response = await api.get("/practice/daily-challenges");
        setCampInfo(response.data);
      } catch (err) {
        console.error("Gagal mengambil data training camp", err);
      } finally {
        setLoadingCamp(false);
      }
    };

    fetchCategories();
    fetchCampInfo();
  }, []);

  const handleStartPractice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: StartPracticePayload = {
        totalQuestions,
      };

      if (selectedCategoryId) {
        payload.categoryId = selectedCategoryId;
      }

      if (selectedDifficulty) {
        payload.difficulty = selectedDifficulty;
      }

      const response = await api.post("/practice/start", payload);
      const { matchId } = response.data;
      
      // Redirect to play session
      router.push(`/practice/${matchId}`);
    } catch (err: unknown) {
      console.error("Gagal memulai latihan", err);
      setError(getApiErrorMessage(err, "Gagal memulai sesi latihan. Pastikan bank soal memiliki cukup soal untuk pilihan Anda."));
      setIsSubmitting(false);
    }
  };

  const xpPercentage = campInfo
    ? Math.min(100, (campInfo.xpInCurrentLevel / campInfo.xpNeededForNextLevel) * 100)
    : 0;

  return (
    <div className="relative min-h-screen bg-bg-main text-white py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <MathBackground />
      <PageTransition className="max-w-4xl mx-auto">
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-neon-blue/10 border border-neon-blue/20 rounded-2xl text-neon-blue">
              <Brain className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-neon-blue to-neon-purple bg-clip-text text-transparent sm:text-4xl font-heading drop-shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                BATTLE TRAINING CAMP
              </h1>
              <p className="text-slate-400 mt-1 text-sm sm:text-base font-ui">
                Asah kemampuan logikamu, kumpulkan XP, dan naikkan tingkat Mastery Level.
              </p>
            </div>
          </div>

          {/* Daily Streak Indicator */}
          {!loadingCamp && campInfo && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-neon-gold/15 to-orange-500/5 border border-neon-gold/25 rounded-2xl shadow-[0_0_15px_rgba(255,184,0,0.1)] self-start md:self-auto shrink-0"
            >
              <div className="relative">
                <Flame className="w-8 h-8 text-neon-gold animate-bounce" />
                <div className="absolute inset-0 w-8 h-8 rounded-full bg-neon-gold/20 blur-sm pointer-events-none" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-neon-gold font-ui">Daily Streak</p>
                <p className="text-lg font-black text-white font-heading">{campInfo.currentStreak} HARI</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Mastery Progress Bar */}
        {!loadingCamp && campInfo && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 glass-card rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-neon-blue/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-neon-purple/20 bg-neon-purple/10 text-neon-purple font-black shadow-[0_0_12px_rgba(176,38,255,0.15)]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-ui">Mastery Progress</h3>
                  <p className="text-base font-black text-white font-heading">Level {campInfo.currentLevel}</p>
                </div>
              </div>
              <div className="text-right sm:text-right font-heading">
                <span className="text-sm font-black text-neon-blue">{campInfo.xpInCurrentLevel}</span>
                <span className="text-xs text-slate-500 font-bold"> / {campInfo.xpNeededForNextLevel} XP</span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                className="h-full bg-gradient-to-r from-neon-blue to-neon-purple rounded-full shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercentage}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}

        {/* Grid Layout: Configuration Form & Daily Challenges */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8">
          
          {/* Setup Card Form */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden h-full flex flex-col justify-between border border-white/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/5 rounded-full blur-3xl -z-10 pointer-events-none" />
            
            <form onSubmit={handleStartPractice} className="space-y-6">
              {/* Category Select */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2.5 flex items-center gap-2 font-ui">
                  <Target className="w-4 h-4 text-neon-blue" />
                  Pilih Kategori Soal
                </label>
                {loading ? (
                  <div className="h-12 bg-bg-surface/40 animate-pulse rounded-xl border border-white/5" />
                ) : (
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full bg-bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-neon-blue/40 focus:border-transparent transition-all font-ui cursor-pointer"
                  >
                    <option value="">Semua Kategori (Campuran)</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-slate-500 mt-2 font-ui">
                  Pilih topik spesifik atau biarkan default untuk latihan acak campuran.
                </p>
              </div>

              {/* Difficulty Select */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2.5 flex items-center gap-2 font-ui">
                  <Sparkles className="w-4 h-4 text-neon-purple" />
                  Tingkat Kesulitan
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-ui">
                  {[
                    { value: "", label: "Campuran" },
                    { value: "EASY", label: "Mudah" },
                    { value: "MEDIUM", label: "Sedang" },
                    { value: "HARD", label: "Sulit" },
                  ].map((difficultyOption) => (
                    <button
                      key={difficultyOption.value}
                      type="button"
                      onClick={() => setSelectedDifficulty(difficultyOption.value)}
                      className={`px-3 py-3 rounded-xl border text-xs font-bold transition-all duration-200 ${
                        selectedDifficulty === difficultyOption.value
                          ? "bg-neon-purple/20 border-neon-purple text-neon-purple shadow-[0_0_15px_rgba(176,38,255,0.15)]"
                          : "bg-bg-surface/45 border-white/5 text-slate-400 hover:border-white/15 hover:text-slate-200"
                      }`}
                    >
                      {difficultyOption.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Questions Select */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2.5 flex items-center gap-2 font-ui">
                  <CheckCircle2 className="w-4 h-4 text-neon-green" />
                  Jumlah Soal
                </label>
                <div className="grid grid-cols-3 gap-2 font-heading">
                  {[5, 10, 20].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setTotalQuestions(count)}
                      className={`px-3 py-3 rounded-xl border text-xs font-black transition-all duration-200 ${
                        totalQuestions === count
                          ? "bg-neon-green/20 border-neon-green text-neon-green shadow-[0_0_15px_rgba(0,255,102,0.15)]"
                          : "bg-bg-surface/45 border-white/5 text-slate-400 hover:border-white/15 hover:text-slate-200"
                      }`}
                    >
                      {count} Soal
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 flex items-start gap-3">
                  <span className="text-lg font-black">!</span>
                  <div className="text-sm">{error}</div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-[0_0_24px_rgba(0,240,255,0.3)] text-white font-black py-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 font-heading"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyiapkan Soal...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                      Mulai Sesi Latihan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Daily Challenges Column */}
          <div className="flex flex-col gap-5">
            <div className="glass-card rounded-3xl p-6 border border-white/5 flex-grow flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-4 tracking-tight flex items-center gap-2 font-heading">
                  <Trophy size={16} className="text-neon-gold" />
                  Tantangan Harian
                </h3>

                {loadingCamp ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="h-20 rounded-2xl bg-bg-surface/30 animate-pulse border border-white/5" />
                    ))}
                  </div>
                ) : campInfo && campInfo.challenges ? (
                  <div className="space-y-3">
                    {campInfo.challenges.map((challenge) => (
                      <div 
                        key={challenge.id} 
                        className={`p-4 rounded-2xl border transition-all duration-300 flex items-start gap-3 ${
                          challenge.isCompleted 
                            ? "bg-neon-green/5 border-neon-green/20" 
                            : "bg-bg-surface/20 border-white/5"
                        }`}
                      >
                        <div className={`grid h-8 w-8 place-items-center rounded-xl border shrink-0 mt-0.5 ${
                          challenge.isCompleted 
                            ? "border-neon-green/20 bg-neon-green/10 text-neon-green" 
                            : "border-white/10 bg-bg-surface text-slate-400"
                        }`}>
                          <CheckCircle2 size={16} />
                        </div>
                        <div className="min-w-0 flex-grow font-ui">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs font-bold truncate ${challenge.isCompleted ? "text-neon-green" : "text-white"}`}>
                              {challenge.title}
                            </p>
                            <span className="text-[10px] font-black text-neon-gold font-heading shrink-0">+{challenge.xpReward} XP</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{challenge.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm font-medium font-ui">
                    Gagal memuat tantangan harian.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Benefits Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 text-center glass-card-hover">
            <Sparkles className="mx-auto mb-2 h-5 w-5 text-neon-cyan" />
            <h3 className="font-bold text-slate-200 mb-1 text-sm font-ui">Feedback Instan</h3>
            <p className="text-slate-500 text-xs font-ui leading-relaxed">Dapatkan jawaban yang benar beserta penjelasannya langsung setelah menjawab.</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center glass-card-hover">
            <Target className="mx-auto mb-2 h-5 w-5 text-neon-gold" />
            <h3 className="font-bold text-slate-200 mb-1 text-sm font-ui">Statistik Akumulatif</h3>
            <p className="text-slate-500 text-xs font-ui leading-relaxed">Jawabanmu akan terekam untuk melatih akurasi profilmu secara keseluruhan.</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center glass-card-hover">
            <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-neon-green" />
            <h3 className="font-bold text-slate-200 mb-1 text-sm font-ui">Bebas Resiko</h3>
            <p className="text-slate-500 text-xs font-ui leading-relaxed">Mode latihan tidak mempengaruhi nilai ratingPoint (MMR) milikmu.</p>
          </div>
        </div>

      </PageTransition>
    </div>
  );
}
