"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Brain, Sparkles, Play, Target, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

export default function PracticeSetupPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
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
      } catch (err: any) {
        console.error("Gagal mengambil kategori", err);
        setError("Gagal memuat kategori soal. Silakan coba beberapa saat lagi.");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleStartPractice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
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
    } catch (err: any) {
      console.error("Gagal memulai latihan", err);
      setError(
        err.response?.data?.message || 
        "Gagal memulai sesi latihan. Pastikan bank soal memiliki cukup soal untuk pilihan Anda."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200 mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
            <Brain className="w-10 h-10 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent sm:text-4xl">
              Mode Latihan Mandiri
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">
              Asah kemampuan matematikamu tanpa batas waktu dan tingkatkan akurasimu.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div className="text-sm">{error}</div>
          </div>
        )}

        {/* Setup Card */}
        <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
          
          <form onSubmit={handleStartPractice} className="space-y-8">
            {/* Category Select */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                Pilih Kategori Soal
              </label>
              {loading ? (
                <div className="h-12 bg-slate-800/40 animate-pulse rounded-xl border border-slate-800" />
              ) : (
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full bg-[#131A26] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="">Semua Kategori (Campuran)</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Pilih kategori spesifik untuk fokus latihan topik tertentu, atau biarkan default untuk latihan campuran.
              </p>
            </div>

            {/* Difficulty Select */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Tingkat Kesulitan
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                      selectedDifficulty === difficultyOption.value
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                        : "bg-[#131A26] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {difficultyOption.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Questions Select */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                Jumlah Soal
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[5, 10, 20].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setTotalQuestions(count)}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                      totalQuestions === count
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                        : "bg-[#131A26] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {count} Soal
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-indigo-500/10 hover:shadow-2xl"
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

        {/* Benefits Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0E1524]/40 border border-slate-800/60 rounded-2xl p-6 text-center">
            <div className="text-xl mb-2">⚡</div>
            <h3 className="font-semibold text-slate-200 mb-1 text-sm">Feedback Instan</h3>
            <p className="text-slate-500 text-xs">Dapatkan jawaban yang benar beserta penjelasannya langsung setelah menjawab.</p>
          </div>
          <div className="bg-[#0E1524]/40 border border-slate-800/60 rounded-2xl p-6 text-center">
            <div className="text-xl mb-2">🎯</div>
            <h3 className="font-semibold text-slate-200 mb-1 text-sm">Statistik Akumulatif</h3>
            <p className="text-slate-500 text-xs">Jawabanmu akan terekam untuk melatih akurasi profilmu secara keseluruhan.</p>
          </div>
          <div className="bg-[#0E1524]/40 border border-slate-800/60 rounded-2xl p-6 text-center">
            <div className="text-xl mb-2">🛡️</div>
            <h3 className="font-semibold text-slate-200 mb-1 text-sm">Bebas Resiko</h3>
            <p className="text-slate-500 text-xs">Mode latihan tidak mempengaruhi Ranking Point (MMR) milikmu.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
