"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Swords, Award, CheckCircle, XCircle, HelpCircle, Zap } from "lucide-react";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import QuestionRenderer, { QuestionType } from "@/components/game/QuestionRenderer";

interface Question {
  id: string;
  questionText: string;
  type: QuestionType;
  questionData?: any;
  options?: Record<string, string>;
}

interface PlayerState {
  username: string;
  score: number;
  hasAnswered: boolean;
  chosenOption?: string;
  isCorrect?: boolean;
  scoreEarned?: number;
}

interface AchievementUnlock {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface ArenaStatePayload {
  questionId: string;
  questionText: string;
  type: QuestionType;
  questionData?: any;
  options?: Record<string, string>;
  currentQuestionNumber: number;
  totalQuestions: number;
  endTime: number;
  scores?: Record<string, number>;
  playersInfo?: Record<string, { username?: string; score?: number; hasAnswered?: boolean }>;
  hasAnswered?: boolean;
  chosenOption?: string;
}

interface AnswerResultPayload {
  correctAnswer: string;
  explanation?: string;
  players: Record<string, {
    totalScore: number;
    chosenOption?: string;
    isCorrect?: boolean;
    scoreEarned?: number;
  }>;
}

interface MatchFinishedPayload {
  unlockedAchievements?: Record<string, AchievementUnlock[]>;
}

export default function ArenaPlayPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;
  const { user } = useAuthStore();

  // Session & Question state
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<Question | null>(null);
  const [currentNum, setCurrentNum] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(10);
  
  // Game states
  const [players, setPlayers] = useState<Record<string, PlayerState>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correctAnswer: string; explanation?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<AchievementUnlock[]>([]);
  const [comboCount, setComboCount] = useState(0);

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
      socket.emit("join_arena", { matchId });
    };

    const handleReconnectState = (data: ArenaStatePayload) => {
      console.log("[Socket] Reconnect state received:", data);
      setQuestion({
        id: data.questionId,
        questionText: data.questionText,
        type: data.type,
        questionData: data.questionData,
        options: data.options,
      });
      setCurrentNum(data.currentQuestionNumber);
      setTotalQuestions(data.totalQuestions);
      setEndTime(data.endTime);
      setLoading(false);

      if (data.hasAnswered) {
        setSelectedOption(data.chosenOption ?? null);
        setSubmitting(true);
      } else {
        setSelectedOption(null);
        setSubmitting(false);
      }

      // Restore scoreboard state
      const initialPlayers: Record<string, PlayerState> = {};
      const scores = data.scores || {};
      const playersInfo = data.playersInfo || {};
      const allUids = Array.from(new Set([...Object.keys(scores), ...Object.keys(playersInfo)]));

      for (const uid of allUids) {
        const score = scores[uid] !== undefined ? scores[uid] : (playersInfo[uid]?.score || 0);
        const pInfo = playersInfo[uid] || {};
        const username = uid === user?.id 
          ? user.username 
          : (pInfo.username || "Opponent");
        initialPlayers[uid] = {
          username,
          score: score as number,
          hasAnswered: pInfo.hasAnswered || false,
        };
      }
      setPlayers(initialPlayers);
    };

    const handleQuestionSent = (data: ArenaStatePayload) => {
      console.log("[Socket] New question received:", data);
      setQuestion({
        id: data.questionId,
        questionText: data.questionText,
        type: data.type,
        questionData: data.questionData,
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
        const next = { ...prev };
        if (!next[data.userId]) {
          const fallbackUsername = data.userId === user?.id ? (user?.username || "You") : "Lawan";
          next[data.userId] = {
            username: fallbackUsername,
            score: 0,
            hasAnswered: true,
          };
        } else {
          next[data.userId] = {
            ...next[data.userId],
            hasAnswered: true,
          };
        }
        return next;
      });
    };

    const handleAnswerResult = (data: AnswerResultPayload) => {
      console.log("[Socket] Question answer result:", data);
      setFeedback({
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
      });

      const myResult = user?.id ? data.players[user.id] : undefined;
      setComboCount((previous) => myResult?.isCorrect ? previous + 1 : 0);

      // Update both players in state
      setPlayers((prev) => {
        const next = { ...prev };
        for (const [uid, resultDetails] of Object.entries(data.players)) {
          if (next[uid]) {
            next[uid] = {
              ...next[uid],
              score: resultDetails.totalScore,
              hasAnswered: true,
              chosenOption: resultDetails.chosenOption,
              isCorrect: resultDetails.isCorrect,
              scoreEarned: resultDetails.scoreEarned,
            };
          } else {
            const fallbackUsername = uid === user?.id ? (user?.username || "You") : "Lawan";
            next[uid] = {
              username: fallbackUsername,
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

    const handleMatchFinished = (data: MatchFinishedPayload) => {
      console.log("[Socket] Match finished:", data);
      
      const myAchievements = user?.id && data.unlockedAchievements ? data.unlockedAchievements[user.id] || [] : [];
      if (myAchievements.length > 0) {
        setUnlockedAchievements(myAchievements);
        // Delay redirect to allow reading
        setTimeout(() => {
          router.push(`/arena/${matchId}/result`);
        }, 5000);
      } else {
        setTimeout(() => {
          router.push(`/arena/${matchId}/result`);
        }, 1500);
      }
    };

    socket.on("connect", onConnect);
    socket.on("reconnect_state", handleReconnectState);
    socket.on("question_sent", handleQuestionSent);
    socket.on("player_answered", handlePlayerAnswered);
    socket.on("answer_result", handleAnswerResult);
    socket.on("match_finished", handleMatchFinished);

    // Join/Re-verify room
    if (socket.connected) {
      console.log("[Socket] Already connected, joining arena immediately");
      socket.emit("join_arena", { matchId });
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

  const handleSelectOptionFromRenderer = (val: string) => {
    if (me.hasAnswered || submitting || feedback) return;

    setSelectedOption(val);

    // Immediate submission for MC and TF types
    if (question?.type === "MULTIPLE_CHOICE" || question?.type === "TRUE_FALSE") {
      setSubmitting(true);
      socket.emit("submit_answer", {
        matchId,
        chosenOption: val,
      });
    }
  };

  const handleManualSubmit = () => {
    if (!selectedOption || me.hasAnswered || submitting || feedback) return;
    setSubmitting(true);
    socket.emit("submit_answer", {
      matchId,
      chosenOption: selectedOption,
    });
  };

  const showSubmitButton = question && question.type !== "MULTIPLE_CHOICE" && question.type !== "TRUE_FALSE";

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main text-white flex flex-col justify-center items-center gap-4">
        <div className="w-12 h-12 border-4 border-neon-blue/20 border-t-neon-blue rounded-full animate-spin" />
        <p className="text-text-secondary text-sm font-medium animate-pulse">Menghubungkan ke arena...</p>
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

  const getAnswerState = (player: PlayerState) => {
    if (player.hasAnswered) return { label: "Answered", className: "text-emerald-400" };
    if (timeLeft <= 0) return { label: "Timeout", className: "text-red-400" };
    return { label: "Thinking", className: "text-amber-500 animate-pulse" };
  };

  const myAnswerState = getAnswerState(me);
  const opponentAnswerState = getAnswerState(opponent);
  const comboMessage = comboCount >= 5 ? "Flawless Logic" : comboCount >= 3 ? `Combo x${comboCount}` : comboCount >= 2 ? "Speed Strike" : null;

  return (
    <div className="min-h-screen bg-bg-main text-text-primary py-8 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      <div className="max-w-4xl mx-auto">
        
        {/* SCOREBOARD CONTAINER */}
        <div className="grid grid-cols-3 bg-bg-card/90 border border-slate-800 rounded-2xl p-4 mb-8 shadow-[0_0_20px_rgba(0,240,255,0.1)] items-center relative overflow-hidden backdrop-blur-md">
          {/* Player 1 Left */}
          <div className="text-left flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-sm shrink-0">
              {me.username.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-100 max-w-[120px] truncate">
                @{me.username}
              </div>
              <div className="text-xl sm:text-2xl font-black text-blue-400">{me.score} <span className="text-xs font-semibold text-slate-500">PTS</span></div>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${myAnswerState.className}`}>
                {myAnswerState.label}
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
              {opponent.username.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-100 max-w-[120px] truncate">
                @{opponent.username}
              </div>
              <div className="text-xl sm:text-2xl font-black text-purple-400">{opponent.score} <span className="text-xs font-semibold text-slate-500">PTS</span></div>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${opponentAnswerState.className}`}>
                {opponentAnswerState.label}
              </span>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {comboMessage && !feedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-neon-gold/30 bg-neon-gold/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-neon-gold"
            >
              <Zap className="h-4 w-4" aria-hidden="true" />
              {comboMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ACTIVE QUESTION PANEL */}
        {question && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-card/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/5 rounded-full blur-3xl -z-10" />

            {/* Question Text */}
            <div className="mb-8">
              <p className="text-lg sm:text-xl font-semibold leading-relaxed text-slate-100 whitespace-pre-wrap">
                {question.questionText}
              </p>
            </div>

            {/* Dynamic Question Renderer */}
            <div className="mb-8">
              <QuestionRenderer
                question={question}
                selectedAnswer={selectedOption || ""}
                onSelectAnswer={handleSelectOptionFromRenderer}
                disabled={me.hasAnswered || !!feedback || submitting}
                feedback={feedback ? { isCorrect: !!me.isCorrect, correctAnswer: feedback.correctAnswer, explanation: feedback.explanation } : null}
              />
            </div>

            {/* Manual Submit Button for complex question types */}
            {showSubmitButton && !me.hasAnswered && !feedback && (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleManualSubmit}
                  disabled={!selectedOption || submitting}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-[0_0_24px_rgba(0,240,255,0.3)] text-white font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5 font-heading disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Kirim Jawaban
                </button>
              </div>
            )}

            {/* Waiting status for other player */}
            {selectedOption && !feedback && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-center justify-center gap-3 text-slate-400 text-sm animate-pulse"
              >
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Menunggu lawan menjawab...</span>
              </motion.div>
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
                        : `Jawaban benar adalah: ${feedback.correctAnswer}.`
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

          </motion.div>
        )}

      </div>

      {/* Real-time Achievement Unlock Alert Popup Overlay */}
      <AnimatePresence>
        {unlockedAchievements.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0B0F19]/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4"
          >
            <div className="space-y-4 max-w-sm w-full">
              {unlockedAchievements.map((ach, index) => {
                return (
                  <motion.div 
                    initial={{ scale: 0.5, y: 50, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: index * 0.2 }}
                    key={ach.id} 
                    className="bg-bg-card border-2 border-neon-gold/50 shadow-[0_0_30px_rgba(255,184,0,0.3)] p-6 rounded-3xl text-center space-y-3 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-neon-gold/10 to-transparent pointer-events-none" />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="flex justify-center"
                    >
                      <Award className="h-12 w-12 text-neon-gold" />
                    </motion.div>
                    <h3 className="text-xl font-black text-neon-gold tracking-wider">
                      ACHIEVEMENT UNLOCKED!
                    </h3>
                    <div className="bg-neon-gold/10 border border-neon-gold/20 py-2 px-4 rounded-xl inline-block font-extrabold text-sm text-neon-gold drop-shadow-[0_0_5px_rgba(255,184,0,0.8)]">
                      {ach.name}
                    </div>
                    <p className="text-text-secondary text-xs leading-relaxed">
                      {ach.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
