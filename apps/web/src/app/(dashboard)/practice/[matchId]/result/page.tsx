"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Home, Play, CheckCircle2, XCircle, Clock, Target, Award, BookOpen, ChevronDown, ChevronUp, Trophy, ThumbsUp, Dumbbell } from "lucide-react";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";

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
}

export default function PracticeResultPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResultData | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await api.get(`/practice/${matchId}/result`);
        setResult(response.data);
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
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col justify-center items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Menghitung skormu...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col justify-center items-center p-6 text-center">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 mb-6 max-w-md">
          <p className="text-sm font-semibold">{error || "Data tidak ditemukan."}</p>
        </div>
        <button
          onClick={() => router.push("/practice")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl shadow-lg transition-all duration-200"
        >
          Kembali ke Setup
        </button>
      </div>
    );
  }

  const performanceFeedback = () => {
    if (result.accuracy >= 80) return { title: "Luar Biasa!", desc: "Kamu sangat menguasai materi ini! Pertahankan prestasimu.", icon: Trophy };
    if (result.accuracy >= 60) return { title: "Kerja Bagus!", desc: "Akurasi yang solid. Sedikit latihan lagi untuk meraih nilai sempurna.", icon: ThumbsUp };
    return { title: "Tetap Semangat!", desc: "Belajar dari kesalahan di pembahasan di bawah dan coba lagi.", icon: Dumbbell };
  };

  const feedbackInfo = performanceFeedback();
  const FeedbackIcon = feedbackInfo.icon;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Hero Performance Card */}
        <div className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#0F172A]/80 border border-indigo-900/40 rounded-3xl p-6 sm:p-10 shadow-2xl mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
          
          <FeedbackIcon className="mx-auto mb-4 h-14 w-14 text-neon-cyan" aria-hidden="true" />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
            {feedbackInfo.title}
          </h1>
          <p className="text-slate-300 mt-2 text-sm sm:text-base max-w-md mx-auto">
            {feedbackInfo.desc}
          </p>

          {/* Large Stats Display */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0B0F19]/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-center items-center">
              <Award className="w-6 h-6 text-indigo-400 mb-2" />
              <span className="text-2xl font-black text-white">{result.totalScore}</span>
              <span className="text-xs text-slate-500 font-medium uppercase mt-1">Total Skor</span>
            </div>
            
            <div className="bg-[#0B0F19]/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-center items-center">
              <Target className="w-6 h-6 text-emerald-400 mb-2" />
              <span className="text-2xl font-black text-white">{result.accuracy}%</span>
              <span className="text-xs text-slate-500 font-medium uppercase mt-1">Akurasi</span>
            </div>

            <div className="bg-[#0B0F19]/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-center items-center">
              <CheckCircle2 className="w-6 h-6 text-green-400 mb-2" />
              <span className="text-2xl font-black text-white">
                {result.correctCount} <span className="text-xs text-slate-500">/ {result.questions.length}</span>
              </span>
              <span className="text-xs text-slate-500 font-medium uppercase mt-1">Benar</span>
            </div>

            <div className="bg-[#0B0F19]/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-center items-center">
              <Clock className="w-6 h-6 text-amber-400 mb-2" />
              <span className="text-2xl font-black text-white">{formatDuration(result.avgAnswerTime)}</span>
              <span className="text-xs text-slate-500 font-medium uppercase mt-1">Rerata Waktu</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <Link
            href="/practice"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
            Mulai Latihan Baru
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-bold py-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Kembali ke Dashboard
          </Link>
        </div>

        {/* Detailed Question Review List */}
        <div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Review Soal & Jawaban
          </h2>

          <div className="space-y-4">
            {result.questions.map((q, idx) => {
              const isExpanded = expandedQuestionId === q.id;

              return (
                <div 
                  key={q.id}
                  className="bg-[#0E1524]/60 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-200"
                >
                  {/* Collapsible Header */}
                  <button
                    type="button"
                    onClick={() => toggleQuestionExpand(q.id)}
                    className="w-full text-left p-5 flex justify-between items-center gap-4 hover:bg-[#131A26]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {q.isCorrect ? (
                        <CheckCircle2 className="w-5.5 h-5.5 text-green-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5.5 h-5.5 text-red-400 shrink-0" />
                      )}
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-slate-100 line-clamp-1 text-left">
                          Soal {idx + 1}: {q.questionText}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="uppercase font-semibold text-indigo-400">{q.difficulty}</span>
                          <span>/</span>
                          <span>Waktu Jawab: {formatDuration(q.answerTimeMs)}</span>
                          <span>/</span>
                          <span>Skor: +{q.scoreEarned} PTS</span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-800 bg-[#0E1524]/40 space-y-6 animate-slideDown">
                      {/* Question Details */}
                      <div>
                        <p className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium">
                          {q.questionText}
                        </p>
                      </div>

                      {/* Options List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(q.options).map(([key, val]) => {
                          const isUserSelected = q.selectedAnswer === key;
                          const isCorrectOpt = q.correctAnswer === key;

                          let optClass = "border-slate-800/60 bg-[#131A26]/40 text-slate-400";
                          let keyClass = "bg-slate-800 text-slate-500";

                          if (isCorrectOpt) {
                            optClass = "border-green-500 bg-green-500/10 text-green-300";
                            keyClass = "bg-green-600 text-white";
                          } else if (isUserSelected) {
                            optClass = "border-red-500 bg-red-500/10 text-red-300";
                            keyClass = "bg-red-600 text-white";
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
                        <div className="bg-[#131A26]/60 border border-slate-800/80 rounded-xl p-4">
                          <h5 className="font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5" />
                            Pembahasan & Penjelasan
                          </h5>
                          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
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

      </div>
    </div>
  );
}
