"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Clock, Award, BookOpen, ChevronRight, CheckCircle, XCircle, Info, Sparkles, HelpCircle } from "lucide-react";
import api from "@/lib/api";

interface Question {
  id: string;
  questionText: string;
  options: Record<string, string>;
  difficulty: string;
  baseScore: number;
}

interface Feedback {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  scoreEarned: number;
  isLastQuestion: boolean;
}

export default function PracticePlayPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;

  // Session State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(10);

  // Play State
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timeStartedRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch current question (F5 Recovery Safe)
  const fetchCurrentQuestion = async () => {
    setLoading(true);
    setError(null);
    setSelectedOption(null);
    setFeedback(null);
    setTimerSeconds(0);

    try {
      const response = await api.get(`/practice/${matchId}/current`);
      
      if (response.data.finished) {
        router.push(`/practice/${matchId}/result`);
        return;
      }

      const { totalQuestions, currentQuestionIndex, question } = response.data;
      setQuestion(question);
      setTotalQuestions(totalQuestions);
      setCurrentQuestionIndex(currentQuestionIndex);
      
      // Start question timer
      timeStartedRef.current = Date.now();
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Gagal memuat soal aktif", err);
      setError(
        err.response?.data?.message ||
        "Gagal memuat sesi latihan. Silakan kembali ke dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentQuestion();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [matchId]);

  const handleSubmitAnswer = async () => {
    if (!selectedOption || !question || submitting || feedback) return;

    setSubmitting(true);
    // Stop local timer
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    const answerTimeMs = Date.now() - timeStartedRef.current;

    try {
      const response = await api.post(`/practice/${matchId}/submit`, {
        chosenOption: selectedOption,
        answerTimeMs,
      });

      setFeedback(response.data);
    } catch (err: any) {
      console.error("Gagal mengirim jawaban", err);
      setError("Gagal mengirim jawaban. Silakan coba klik tombol kirim lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (feedback?.isLastQuestion) {
      router.push(`/practice/${matchId}/result`);
    } else {
      fetchCurrentQuestion();
    }
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff?.toUpperCase()) {
      case "EASY":
        return "text-green-400 bg-green-500/10 border-green-500/20";
      case "MEDIUM":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "HARD":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col justify-center items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Menyiapkan tantanganmu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col justify-center items-center p-6 text-center">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 mb-6 max-w-md">
          <HelpCircle className="w-12 h-12 mx-auto mb-3" />
          <p className="text-sm font-semibold">{error}</p>
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

  if (!question) return null;

  const progressPercentage = (currentQuestionIndex / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Progress & Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-auto">
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider">Latihan Lari Solo</span>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
              Soal {currentQuestionIndex} dari {totalQuestions}
            </h2>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/40 border border-slate-700/40 rounded-lg text-xs font-semibold text-slate-300">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              {formatTime(timerSeconds)}
            </div>
            <div className={`px-3 py-1.5 border rounded-lg text-xs font-semibold uppercase ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs font-semibold text-indigo-300">
              <Award className="w-3.5 h-3.5" />
              {question.baseScore} PTS
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full mb-8 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Play Card */}
        <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative">
          
          {/* Question Text */}
          <div className="mb-8">
            <p className="text-lg sm:text-xl font-medium leading-relaxed text-slate-100 whitespace-pre-wrap">
              {question.questionText}
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {Object.entries(question.options).map(([key, value]) => {
              const isSelected = selectedOption === key;
              const hasSubmitted = !!feedback;
              const isOptionCorrect = feedback?.correctAnswer === key;
              const isOptionSelectedWrong = hasSubmitted && isSelected && !feedback.isCorrect;

              let buttonClass = "border-slate-800 bg-[#131A26] text-slate-300 hover:border-slate-700 hover:text-white";
              let keyBg = "bg-slate-800 text-slate-400";

              if (hasSubmitted) {
                if (isOptionCorrect) {
                  buttonClass = "border-green-500 bg-green-500/10 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.15)]";
                  keyBg = "bg-green-600 text-white";
                } else if (isOptionSelectedWrong) {
                  buttonClass = "border-red-500 bg-red-500/10 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.15)]";
                  keyBg = "bg-red-600 text-white";
                } else {
                  buttonClass = "border-slate-900 bg-slate-900/40 text-slate-600 opacity-60";
                  keyBg = "bg-slate-900 text-slate-700";
                }
              } else if (isSelected) {
                buttonClass = "border-indigo-500 bg-indigo-600/20 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]";
                keyBg = "bg-indigo-600 text-white";
              }

              return (
                <button
                  key={key}
                  type="button"
                  disabled={hasSubmitted}
                  onClick={() => setSelectedOption(key)}
                  className={`w-full text-left p-4 sm:p-5 rounded-2xl border text-sm sm:text-base font-medium flex items-center gap-4 transition-all duration-200 ${buttonClass}`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${keyBg}`}>
                    {key}
                  </span>
                  <span className="break-words">{value}</span>
                </button>
              );
            })}
          </div>

          {/* Action Footer */}
          {!feedback ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={!selectedOption || submitting}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group disabled:text-slate-600 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/10"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memeriksa...
                  </>
                ) : (
                  <>
                    Submit Jawaban
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="border-t border-slate-800/80 pt-8 animate-fadeIn">
              {/* Feedback Alert Header */}
              <div className={`p-5 rounded-2xl border mb-6 flex items-start gap-4 ${
                feedback.isCorrect 
                  ? "bg-green-500/10 border-green-500/20 text-green-300"
                  : "bg-red-500/10 border-red-500/20 text-red-300"
              }`}>
                {feedback.isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-base sm:text-lg">
                    {feedback.isCorrect ? "Jawaban Benar!" : "Jawaban Kurang Tepat!"}
                  </h4>
                  <p className="text-sm mt-1 text-slate-400">
                    {feedback.isCorrect 
                      ? `Kamu berhasil mendapatkan +${feedback.scoreEarned} PTS.` 
                      : `Jawaban yang benar adalah opsi ${feedback.correctAnswer}.`
                    }
                  </p>
                </div>
              </div>

              {/* Explanation Section */}
              {feedback.explanation && (
                <div className="bg-[#131A26]/80 border border-slate-800 rounded-2xl p-5 mb-8">
                  <h5 className="font-semibold text-slate-200 mb-2 flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    Pembahasan & Penjelasan:
                  </h5>
                  <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                    {feedback.explanation}
                  </p>
                </div>
              )}

              {/* Next Question Navigation */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  {feedback.isLastQuestion ? (
                    <>
                      Lihat Hasil Akhir
                      <Award className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </>
                  ) : (
                    <>
                      Soal Berikutnya
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
