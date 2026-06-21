"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Clock, Swords, Trophy, Activity, Award, CheckCircle, XCircle, ArrowRight, HelpCircle } from "lucide-react";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";

interface Question {
  id: string;
  questionText: string;
  options: Record<string, string>;
}

interface PlayerState {
  username: string;
  score: number;
  hasAnswered: boolean;
  chosenOption?: string;
  isCorrect?: boolean;
  scoreEarned?: number;
}

export default function ArenaPlayPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;
  const { user } = useAuthStore();

  // Session & Question state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [currentNum, setCurrentNum] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(10);
  
  // Game states
  const [players, setPlayers] = useState<Record<string, PlayerState>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Server controlled timing
  const [endTime, setEndTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15.0);

  // Timer Ref
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Establish connection and reconnect handling
    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      console.log("[Socket] Reconnected to server inside Arena");
      setError(null);
    };

    const handleReconnectState = (data: any) => {
      console.log("[Socket] Reconnect state received:", data);
      setQuestion({
        id: data.questionId,
        questionText: data.questionText,
        options: data.options,
      });
      setCurrentNum(data.currentQuestionNumber);
      setTotalQuestions(data.totalQuestions);
      setEndTime(data.endTime);
      setLoading(false);

      // Restore scoreboard state
      const initialPlayers: Record<string, PlayerState> = {};
      for (const [uid, score] of Object.entries(data.scores)) {
        const username = uid === user?.id 
          ? user.username 
          : (data.playersInfo?.[uid]?.username || "Opponent");
        initialPlayers[uid] = {
          username,
          score: score as number,
          hasAnswered: false,
        };
      }
      setPlayers(initialPlayers);
    };

    const handleQuestionSent = (data: any) => {
      console.log("[Socket] New question received:", data);
      setQuestion({
        id: data.questionId,
        questionText: data.questionText,
        options: data.options,
      });
      setCurrentNum(data.currentQuestionNumber);
      setTotalQuestions(data.totalQuestions);
      setEndTime(data.endTime);
      setSelectedOption(null);
      setFeedback(null);
      setSubmitting(false);
      setLoading(false);

      // Reset players status answered
      setPlayers((prev) => {
        const next = { ...prev };
        for (const uid of Object.keys(next)) {
          next[uid] = {
            ...next[uid],
            hasAnswered: false,
            chosenOption: undefined,
            isCorrect: undefined,
            scoreEarned: undefined,
          };
        }
        return next;
      });
    };

    const handlePlayerAnswered = (data: { userId: string }) => {
      console.log("[Socket] Player answered:", data.userId);
      setPlayers((prev) => {
        if (!prev[data.userId]) return prev;
        return {
          ...prev,
          [data.userId]: {
            ...prev[data.userId],
            hasAnswered: true,
          },
        };
      });
    };

    const handleAnswerResult = (data: any) => {
      console.log("[Socket] Question answer result:", data);
      setFeedback({
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
      });

      // Update both players in state
      setPlayers((prev) => {
        const next = { ...prev };
        for (const [uid, details] of Object.entries(data.players)) {
          if (next[uid]) {
            const resultDetails = details as any;
            next[uid] = {
              ...next[uid],
              score: resultDetails.totalScore,
              hasAnswered: true,
              chosenOption: resultDetails.chosenOption,
              isCorrect: resultDetails.isCorrect,
              scoreEarned: resultDetails.scoreEarned,
            };
          }
        }
        return next;
      });
    };

    const handleMatchFinished = (data: any) => {
      console.log("[Socket] Match finished:", data);
      // Wait 1.5s for final results transition
      setTimeout(() => {
        router.push(`/arena/${matchId}/result`);
      }, 1500);
    };

    socket.on("connect", onConnect);
    socket.on("reconnect_state", handleReconnectState);
    socket.on("question_sent", handleQuestionSent);
    socket.on("player_answered", handlePlayerAnswered);
    socket.on("answer_result", handleAnswerResult);
    socket.on("match_finished", handleMatchFinished);

    // Join/Re-verify room
    if (socket.connected) {
      // Handled automatically by socket gateway connection reconnect check
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("reconnect_state", handleReconnectState);
      socket.off("question_sent", handleQuestionSent);
      socket.off("player_answered", handlePlayerAnswered);
      socket.off("answer_result", handleAnswerResult);
      socket.off("match_finished", handleMatchFinished);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [matchId, router, user]);

  // Handle countdown tick based on endTime
  useEffect(() => {
    if (!endTime || feedback) return;

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const diff = endTime - now;
      const secs = Math.max(0, diff / 1000);
      setTimeLeft(secs);

      if (secs <= 0) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      }
    }, 100);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [endTime, feedback]);

  const handleSelectOption = (optionKey: string) => {
    if (selectedOption || submitting || feedback) return;

    setSelectedOption(optionKey);
    setSubmitting(true);

    socket.emit("submit_answer", {
      matchId,
      chosenOption: optionKey,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col justify-center items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Menghubungkan ke arena...</p>
      </div>
    );
  }

  // Find users
  const myId = user?.id || "";
  const me = players[myId] || { username: user?.username || "You", score: 0, hasAnswered: false };
  const opponentId = Object.keys(players).find((id) => id !== myId) || "";
  const opponent = players[opponentId] || { username: "Lawan", score: 0, hasAnswered: false };

  const formatTimer = (secs: number) => {
    return secs.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* SCOREBOARD CONTAINER */}
        <div className="grid grid-cols-3 bg-[#0E1524]/90 border border-slate-800 rounded-2xl p-4 mb-8 shadow-xl items-center relative overflow-hidden">
          {/* Player 1 Left */}
          <div className="text-left flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-sm shrink-0">
              P1
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-100 max-w-[120px] truncate">
                @{me.username}
              </div>
              <div className="text-xl sm:text-2xl font-black text-blue-400">{me.score} <span className="text-xs font-semibold text-slate-500">PTS</span></div>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${me.hasAnswered ? "text-emerald-400" : "text-amber-500 animate-pulse"}`}>
                {me.hasAnswered ? "✓ Menjawab" : "Berpikir..."}
              </span>
            </div>
          </div>

          {/* VS & Timer Middle */}
          <div className="text-center flex flex-col items-center justify-center z-10">
            <span className="text-xs uppercase font-extrabold text-slate-500 tracking-widest mb-1">
              Soal {currentNum} / {totalQuestions}
            </span>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-lg transition-all duration-300 ${
              feedback 
                ? "bg-slate-800 border-slate-700" 
                : timeLeft <= 5 
                ? "bg-red-500/10 border-red-500 shadow-red-500/10 animate-pulse" 
                : "bg-indigo-500/10 border-indigo-500 shadow-indigo-500/10"
            }`}>
              {feedback ? (
                <Swords className="w-6 h-6 text-slate-400" />
              ) : (
                <span className={`text-lg font-black ${timeLeft <= 5 ? "text-red-400" : "text-white"}`}>
                  {formatTimer(timeLeft)}
                </span>
              )}
            </div>
          </div>

          {/* Player 2 Right */}
          <div className="text-right flex flex-col sm:flex-row-reverse items-end sm:items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-400 text-sm shrink-0">
              P2
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-100 max-w-[120px] truncate">
                @{opponent.username}
              </div>
              <div className="text-xl sm:text-2xl font-black text-purple-400">{opponent.score} <span className="text-xs font-semibold text-slate-500">PTS</span></div>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${opponent.hasAnswered ? "text-emerald-400" : "text-amber-500 animate-pulse"}`}>
                {opponent.hasAnswered ? "✓ Menjawab" : "Berpikir..."}
              </span>
            </div>
          </div>
        </div>

        {/* ACTIVE QUESTION PANEL */}
        {question && (
          <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10" />

            {/* Question Text */}
            <div className="mb-8">
              <p className="text-lg sm:text-xl font-semibold leading-relaxed text-slate-100 whitespace-pre-wrap">
                {question.questionText}
              </p>
            </div>

            {/* Options List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {Object.entries(question.options).map(([key, val]) => {
                const isSelected = selectedOption === key;
                const hasFeedback = !!feedback;
                const isCorrectOption = feedback?.correctAnswer === key;
                
                // Track visual states for both players during answer result feedback
                const p1Chosen = me.chosenOption === key;
                const p2Chosen = opponent.chosenOption === key;

                let btnStyle = "border-slate-800 bg-[#131A26] text-slate-300 hover:border-slate-700 hover:text-white";
                let keyStyle = "bg-slate-800 text-slate-400";

                if (hasFeedback) {
                  if (isCorrectOption) {
                    btnStyle = "border-green-500 bg-green-500/10 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.15)]";
                    keyStyle = "bg-green-600 text-white";
                  } else if (p1Chosen && !me.isCorrect) {
                    btnStyle = "border-red-500 bg-red-500/10 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.15)]";
                    keyStyle = "bg-red-600 text-white";
                  } else {
                    btnStyle = "border-slate-900 bg-slate-900/40 text-slate-600 opacity-50";
                    keyStyle = "bg-slate-900 text-slate-700";
                  }
                } else if (isSelected) {
                  btnStyle = "border-indigo-500 bg-indigo-600/20 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]";
                  keyStyle = "bg-indigo-600 text-white";
                }

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isSelected || hasFeedback || submitting}
                    onClick={() => handleSelectOption(key)}
                    className={`w-full text-left p-4 sm:p-5 rounded-2xl border text-sm sm:text-base font-semibold flex items-center justify-between gap-4 transition-all duration-200 ${btnStyle}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${keyStyle}`}>
                        {key}
                      </span>
                      <span className="break-words">{val}</span>
                    </div>

                    {/* Small badges showing which player answered which option */}
                    {hasFeedback && (p1Chosen || p2Chosen) && (
                      <div className="flex gap-1">
                        {p1Chosen && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            P1
                          </span>
                        )}
                        {p2Chosen && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            P2
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Waiting status for other player */}
            {selectedOption && !feedback && (
              <div className="text-center p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-center justify-center gap-3 text-slate-400 text-sm animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Jawabanmu dikirim. Menunggu lawan selesai menjawab...</span>
              </div>
            )}

            {/* Feedback & explanation container */}
            {feedback && (
              <div className="border-t border-slate-800/80 pt-6 animate-fadeIn">
                {/* Result Message Banner */}
                <div className={`p-4 rounded-xl border mb-5 flex items-start gap-4 ${
                  me.isCorrect 
                    ? "bg-green-500/10 border-green-500/20 text-green-300"
                    : "bg-red-500/10 border-red-500/20 text-red-300"
                }`}>
                  {me.isCorrect ? (
                    <CheckCircle className="w-5.5 h-5.5 text-green-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5.5 h-5.5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm sm:text-base">
                      {me.isCorrect ? "Jawabanmu Benar!" : "Jawabanmu Kurang Tepat!"}
                    </h4>
                    <p className="text-xs mt-0.5 text-slate-400">
                      {me.isCorrect 
                        ? `Kamu memperoleh +${me.scoreEarned} PTS (Termasuk Bonus Waktu).`
                        : `Jawaban benar adalah opsi ${feedback.correctAnswer}.`
                      }
                      {opponent.chosenOption && (
                        <span className="block mt-1 text-slate-500">
                          Opponent memilih opsi {opponent.chosenOption} ({opponent.isCorrect ? "Benar" : "Salah"}) | +{opponent.scoreEarned} PTS
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Explanation Card */}
                {feedback.explanation && (
                  <div className="bg-[#131A26]/80 border border-slate-800 rounded-xl p-4">
                    <h5 className="font-bold text-slate-300 mb-1.5 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                      Pembahasan & Penjelasan:
                    </h5>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                      {feedback.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

// Simple loader helper
function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
