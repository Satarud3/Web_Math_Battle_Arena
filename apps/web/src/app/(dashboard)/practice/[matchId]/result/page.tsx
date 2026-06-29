"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Home, Play, CheckCircle2, XCircle, Clock, Target, Award, BookOpen, ChevronDown, ChevronUp, Trophy, ThumbsUp, Dumbbell, Bot, RotateCcw, Sparkles, Zap, Flame, Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import MathBackground from "@/components/ui/MathBackground";
import PageTransition from "@/components/PageTransition";
import GlassCard from "@/components/ui/GlassCard";

interface QuestionResult {
  id: string;
  questionText: string;
  options: Record<string, string>;
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  selectedAnswer: string;
  isCorrect: boolean;
  answerTimeMs: number;
  scoreEarned: number;
}

interface MatchResultData {
  matchId: string;
  totalScore: number;
  correctCount: number;
  wrongCount: number;
  avgAnswerTime: number;
  accuracy: number;
  startedAt: string;
  endedAt: string;
  questions: QuestionResult[];
  xpEarned: number;
  masteryIncreased: boolean;
  currentLevel: number;
  nextLevelProgress: number;
  bestCombo: number;
  strongestCategory: string;
  completedChallenges: string[];
}

/* ── SCORE TICKER COMPONENT ───────────────────────────── */
function ScoreTicker({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }

    const totalMiliseconds = duration * 1000;
    const incrementTime = Math.max(10, Math.floor(totalMiliseconds / end));
    
    const timer = setInterval(() => {
      start += Math.ceil(end / (totalMiliseconds / 15));
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, 15);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
}

export default function PracticeResultPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResultData | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await api.get(`/practice/${matchId}/result`);
        setResult(response.data);
        if (response.data.masteryIncreased) {
          // Trigger the gold level up modal
          setTimeout(() => {
            setShowLevelUpModal(true);
          }, 800);
        }
      } catch (error: unknown) {
        console.error("Gagal mengambil hasil latihan", error);
        setError(getApiErrorMessage(error, "Gagal memuat hasil latihan. Pastikan Anda menyelesaikan latihan terlebih dahulu."));
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [matchId]);

  const formatDuration = (ms: number) => {
    const totalSecs = Math.round(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const toggleQuestionExpand = (id: string) => {
    setExpandedQuestionId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main text-white flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-12 h-12 text-neon-blue animate-spin" />
        <p className="text-slate-400 text-sm font-medium animate-pulse font-ui">Menganalisis hasil latihan...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-bg-main text-white flex flex-col justify-center items-center p-6 text-center">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 mb-6 max-w-md font-ui">
          <p className="text-sm font-semibold">{error || "Data tidak ditemukan."}</p>
        </div>
        <button
          onClick={() => router.push("/practice")}
          className="bg-neon-blue hover:bg-neon-blue/80 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all duration-200 font-heading"
        >
          KEMBALI KE SETUP
        </button>
      </div>
    );
  }

  const performanceFeedback = () => {
    if (result.accuracy >= 90) return { title: "Legendary Focus!", desc: "Konsentrasi dan ketepatanmu berada pada level ksatria elite.", icon: Trophy };
    if (result.accuracy >= 70) return { title: "Great Run!", desc: "Fondasinya sudah sangat kuat. Pertahankan tempo ini.", icon: ThumbsUp };
    if (result.accuracy >= 50) return { title: "Good Progress!", desc: "Langkah yang bagus. Pelajari konsep yang masih meleset.", icon: Sparkles };
    return { title: "Training Needed", desc: "Terus mencoba! Gunakan pembahasan di bawah untuk memahami polanya.", icon: Dumbbell };
  };

  const feedbackInfo = performanceFeedback();
  const FeedbackIcon = feedbackInfo.icon;
  const wrongQuestions = result.questions.filter((question) => !question.isCorrect);
  const fastestQuestion = result.questions.reduce<QuestionResult | null>((fastest, question) => !fastest || question.answerTimeMs < fastest.answerTimeMs ? question : fastest, null);
  const coachSummary = result.accuracy >= 80
    ? "Akurasi sudah sangat kuat. Coba tingkatkan kecepatan waktu berpikir Anda untuk mendorong performa duel."
    : result.accuracy >= 50
      ? "Anda memahami sebagian besar pola. Fokus pada pembahasan soal yang salah sebelum kembali bermain."
      : "Mulai dari ritme yang lebih lambat. Prioritaskan ketelitian sebelum mengejar kecepatan menjawab.";

  return (
    <div className="min-h-screen bg-bg-main text-white py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <MathBackground />
      <PageTransition className="max-w-4xl mx-auto z-10 relative">

        {/* Level Up Pop-up Modal */}
        <AnimatePresence>
          {showLevelUpModal && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-md px-4">
              <motion.div 
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md rounded-3xl border border-neon-gold/40 bg-bg-surface p-8 text-center shadow-[0_0_80px_rgba(255,184,0,0.3)] relative overflow-hidden"
              >
                {/* Gold Glow particles */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-neon-gold/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-neon-purple/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative mb-4">
                    <Award className="h-16 w-16 text-neon-gold animate-bounce" />
                    <div className="absolute inset-0 rounded-full bg-neon-gold/25 blur-md pointer-events-none" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-neon-gold font-heading">Level Up!</p>
                  <h2 className="mt-3 text-3xl font-black text-white font-heading">MASTERY INCREASED</h2>
                  <p className="mt-2 text-sm text-slate-400 font-ui leading-relaxed">
                    Selamat! Pengetahuan matematikalemu berkembang. Anda telah mencapai tingkat kepakaran baru.
                  </p>
                  <div className="mt-6 p-4 rounded-2xl bg-neon-gold/10 border border-neon-gold/20 w-full font-heading">
                    <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider">Tingkat Baru</span>
                    <span className="text-2xl font-black text-neon-gold">LEVEL {result.currentLevel}</span>
                  </div>
                  <button 
                    onClick={() => setShowLevelUpModal(false)}
                    className="mt-8 px-6 py-2.5 bg-gradient-to-r from-neon-gold to-orange-500 text-white text-xs font-black rounded-xl uppercase tracking-wider font-heading hover:shadow-[0_0_20px_rgba(255,184,0,0.3)] transition-all"
                  >
                    Lanjutkan
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Back Link */}
        <div className="mb-8">
          <Link 
            href="/practice" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-neon-blue transition-colors duration-200 group text-sm font-ui"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Training Camp
          </Link>
        </div>

        {/* Hero Performance Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-10 shadow-2xl mb-8 text-center relative overflow-hidden border border-white/5 neon-glow-blue">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl -z-10" />
          
          <FeedbackIcon className="mx-auto mb-4 h-14 w-14 text-neon-blue animate-pulse" aria-hidden="true" />
          <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-white via-neon-blue to-neon-purple bg-clip-text text-transparent font-heading">
            {feedbackInfo.title}
          </h1>
          <p className="text-slate-300 mt-2 text-sm sm:text-base max-w-md mx-auto font-ui leading-relaxed">
            {feedbackInfo.desc}
          </p>

          {/* Large Stats Display */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 font-heading">
            <div className="bg-bg-surface/30 border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center glass-card-hover">
              <Zap className="w-6 h-6 text-neon-blue mb-2" />
              <span className="text-2xl font-black text-white">
                +<ScoreTicker value={result.xpEarned} />
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 font-ui">XP Diperoleh</span>
            </div>
            
            <div className="bg-bg-surface/30 border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center glass-card-hover">
              <Target className="w-6 h-6 text-neon-purple mb-2" />
              <span className="text-2xl font-black text-white">
                <ScoreTicker value={result.accuracy} />%
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 font-ui">Akurasi</span>
            </div>

            <div className="bg-bg-surface/30 border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center glass-card-hover">
              <CheckCircle2 className="w-6 h-6 text-neon-green mb-2" />
              <span className="text-2xl font-black text-white">
                {result.correctCount} <span className="text-xs text-slate-500 font-bold">/ {result.questions.length}</span>
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 font-ui">Benar</span>
            </div>

            <div className="bg-bg-surface/30 border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center glass-card-hover">
              <Clock className="w-6 h-6 text-neon-gold mb-2" />
              <span className="text-2xl font-black text-white">{formatDuration(result.avgAnswerTime)}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 font-ui">Rerata Waktu</span>
            </div>
          </div>
        </div>

        {/* Daily Challenges Completed Today */}
        {result.completedChallenges && result.completedChallenges.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 rounded-2xl border border-neon-green/20 bg-neon-green/5 flex flex-col gap-3 font-ui"
          >
            <div className="flex items-center gap-2 text-neon-green font-bold text-sm">
              <CheckCircle2 size={18} />
              <span>Tantangan Harian Diselesaikan!</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.completedChallenges.map((challengeName) => (
                <span key={challengeName} className="px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/25 text-neon-green text-xs font-bold font-heading uppercase tracking-wide">
                  {challengeName}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        <section className="mb-10 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <div className="rounded-2xl border border-neon-blue/20 bg-neon-blue/5 p-5 sm:p-6 flex flex-col justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-neon-blue/20 bg-neon-blue/10 text-neon-blue">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neon-blue font-heading">AI Coach Summary</p>
                <h2 className="mt-1 text-lg font-black text-white font-heading">Rangkuman Sesi</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300 font-ui">{coachSummary}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs font-ui">
              <div className="rounded-xl border border-white/5 bg-bg-surface/35 p-3">
                <p className="font-bold text-neon-green">Kekuatan Utama</p>
                <p className="mt-1 text-slate-300">{result.accuracy >= 70 ? "Konsistensi jawaban tinggi" : "Kategori: " + result.strongestCategory}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-bg-surface/35 p-3">
                <p className="font-bold text-neon-purple">Fokus Latihan</p>
                <p className="mt-1 text-slate-300">{wrongQuestions.length ? `${wrongQuestions.length} soal perlu diulang` : "Tingkatkan kesulitan"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-bg-surface/35 p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neon-gold font-heading">Performance Signal</p>
              <div className="mt-4 space-y-4 font-ui">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-400">Best Combo</span>
                  <span className="font-black text-white font-heading flex items-center gap-1">
                    <Flame className="w-4 h-4 text-neon-gold" /> {result.bestCombo} Soal
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-400">Strongest Category</span>
                  <span className="font-black text-white font-heading">{result.strongestCategory}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-400">Respon Tercepat</span>
                  <span className="font-black text-white font-heading">{fastestQuestion ? formatDuration(fastestQuestion.answerTimeMs) : "--"}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => router.push("/practice")} 
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neon-gold/30 bg-neon-gold/10 px-4 text-sm font-bold text-neon-gold transition hover:bg-neon-gold/20 font-ui"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Latih Ulang Soal Salah
            </button>
          </div>
        </section>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10 font-heading">
          <Link
            href="/practice"
            className="flex-1 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-black py-4 rounded-2xl shadow-lg hover:shadow-[0_0_24px_rgba(0,240,255,0.25)] transition-all duration-200 flex items-center justify-center gap-2 group hover:-translate-y-0.5"
          >
            <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
            Mulai Latihan Baru
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 bg-bg-surface/80 hover:bg-bg-surface text-slate-200 border border-white/10 font-black py-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            <Home className="w-5 h-5" />
            Kembali ke Dashboard
          </Link>
        </div>

        {/* Detailed Question Review List */}
        <div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 font-heading">
            <BookOpen className="w-5 h-5 text-neon-purple" />
            Review Soal & Jawaban
          </h2>

          <div className="space-y-4">
            {result.questions.map((q, idx) => {
              const isExpanded = expandedQuestionId === q.id;

              return (
                <div 
                  key={q.id}
                  className="glass-card rounded-2xl overflow-hidden border border-white/5"
                >
                  {/* Collapsible Header */}
                  <button
                    type="button"
                    onClick={() => toggleQuestionExpand(q.id)}
                    className="w-full text-left p-5 flex justify-between items-center gap-4 hover:bg-bg-surface/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {q.isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-neon-green shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-neon-red shrink-0" />
                      )}
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-slate-100 line-clamp-1 text-left font-ui">
                          Soal {idx + 1}: {q.questionText}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1 font-ui">
                          <span className="uppercase font-extrabold text-neon-blue font-heading">{q.difficulty}</span>
                          <span>/</span>
                          <span>Waktu Jawab: {formatDuration(q.answerTimeMs)}</span>
                          <span>/</span>
                          <span className="font-heading font-black text-slate-300">+{q.scoreEarned} PTS</span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-450 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-450 shrink-0" />
                    )}
                  </button>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="p-5 border-t border-white/5 bg-bg-surface/10 space-y-6">
                      {/* Question Details */}
                      <div>
                        <p className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium font-ui">
                          {q.questionText}
                        </p>
                      </div>

                      {/* Options List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-ui">
                        {Object.entries(q.options).map(([key, val]) => {
                          const isUserSelected = q.selectedAnswer === key;
                          const isCorrectOpt = q.correctAnswer === key;

                          let optClass = "border-white/5 bg-bg-surface/30 text-slate-400";
                          let keyClass = "bg-bg-surface text-slate-550";

                          if (isCorrectOpt) {
                            optClass = "border-neon-green/30 bg-neon-green/10 text-neon-green";
                            keyClass = "bg-neon-green text-white";
                          } else if (isUserSelected) {
                            optClass = "border-neon-red/30 bg-neon-red/10 text-neon-red";
                            keyClass = "bg-neon-red text-white";
                          }

                          return (
                            <div 
                              key={key} 
                              className={`p-3.5 border rounded-xl flex items-center gap-3 text-xs sm:text-sm font-medium ${optClass}`}
                            >
                              <span className={`w-6.5 h-6.5 rounded flex items-center justify-center font-bold text-xs shrink-0 ${keyClass}`}>
                                {key}
                              </span>
                              <span className="break-words">{val}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation Block */}
                      {q.explanation && (
                        <div className="bg-bg-surface/45 border border-white/5 rounded-xl p-4">
                          <h5 className="font-bold text-xs text-neon-blue uppercase tracking-wider mb-2 flex items-center gap-2 font-heading">
                            <BookOpen className="w-3.5 h-3.5" />
                            Pembahasan & Penjelasan
                          </h5>
                          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-ui">
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

      </PageTransition>
    </div>
  );
}
