"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Swords, Award, CheckCircle, XCircle, HelpCircle, Zap, BrainCircuit } from "lucide-react";
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
  ratingPoint?: number;
  tier?: string;
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
  playersInfo?: Record<string, { username?: string; score?: number; hasAnswered?: boolean; ratingPoint?: number; tier?: string }>;
  hasAnswered?: boolean;
  chosenOption?: string;
  battleMode?: string;
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
  const [battleMode, setBattleMode] = useState("ARENA");
  const [showIntro, setShowIntro] = useState(true);
  const [shouldShake, setShouldShake] = useState(false);
  
  // Refined mechanics states (Strategy & Marathon)
  const [isSuddenDeath, setIsSuddenDeath] = useState(false);
  const [checkpointInfo, setCheckpointInfo] = useState<{ currentCheckpoint: number; leaderUserId: string; resumeTime: number } | null>(null);

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
      try {
        console.log("[Socket] Reconnect state received:", data);
        setBattleMode(data.battleMode || "ARENA");
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
            ratingPoint: pInfo.ratingPoint || 1000,
            tier: pInfo.tier || "Silver",
          };
        }
        setPlayers(initialPlayers);
      } catch (err) {
        console.error("Error in handleReconnectState:", err);
      }
    };

    const handleQuestionSent = (data: ArenaStatePayload) => {
      try {
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

        // Reset refined mechanics states
        setIsSuddenDeath(false);
        setCheckpointInfo(null);

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
      } catch (err) {
        console.error("Error in handleQuestionSent:", err);
      }
    };

    const handlePlayerAnswered = (data: { userId: string }) => {
      try {
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
      } catch (err) {
        console.error("Error in handlePlayerAnswered:", err);
      }
    };

    const handleAnswerResult = (data: AnswerResultPayload) => {
      try {
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
          if (data.players) {
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
          }
          return next;
        });
      } catch (err) {
        console.error("Error in handleAnswerResult:", err);
      }
    };

    const handleMatchFinished = (data: MatchFinishedPayload) => {
      try {
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
      } catch (err) {
        console.error("Error in handleMatchFinished:", err);
        router.push(`/arena/${matchId}/result`);
      }
    };

    const handleStrategySuddenDeath = (data: { endTime: number; triggerUserId: string }) => {
      try {
        console.log("[Socket] Strategy Sudden Death triggered!", data);
        setEndTime(data.endTime);
        setIsSuddenDeath(true);
      } catch (err) {
        console.error("Error in handleStrategySuddenDeath:", err);
      }
    };

    const handleMarathonCheckpoint = (data: { currentCheckpoint: number; leaderUserId: string; resumeTime: number }) => {
      try {
        console.log("[Socket] Marathon Checkpoint reached!", data);
        setCheckpointInfo(data);
      } catch (err) {
        console.error("Error in handleMarathonCheckpoint:", err);
      }
    };

    socket.on("connect", onConnect);
    socket.on("reconnect_state", handleReconnectState);
    socket.on("question_sent", handleQuestionSent);
    socket.on("player_answered", handlePlayerAnswered);
    socket.on("answer_result", handleAnswerResult);
    socket.on("match_finished", handleMatchFinished);
    socket.on("strategy_sudden_death", handleStrategySuddenDeath);
    socket.on("marathon_checkpoint", handleMarathonCheckpoint);

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
      socket.off("strategy_sudden_death", handleStrategySuddenDeath);
      socket.off("marathon_checkpoint", handleMarathonCheckpoint);
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

  // Handle VS Intro Overlay Timeout
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setShowIntro(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Handle Combo Screen Shake
  useEffect(() => {
    if (comboCount >= 3) {
      setShouldShake(true);
      const timer = setTimeout(() => setShouldShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [comboCount]);

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
        <p className="text-text-secondary text-sm font-medium animate-pulse font-ui">Menghubungkan ke arena...</p>
      </div>
    );
  }

  // Find users
  const myId = user?.id || "";
  const me = players[myId] || { username: user?.username || "You", score: 0, hasAnswered: false, ratingPoint: 1000, tier: "Silver" };
  const opponentId = Object.keys(players).find((id) => id !== myId) || "";
  const opponent = players[opponentId] || { username: "Lawan", score: 0, hasAnswered: false, ratingPoint: 1000, tier: "Silver" };

  const formatTimer = (secs: number) => {
    if (typeof secs !== "number" || isNaN(secs)) return "0.0";
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

  // Mode label styling
  const modeLabels: Record<string, string> = {
    LIGHTNING: "⚡ Lightning",
    ARENA: "🔥 Arena",
    STRATEGY: "🧠 Strategy",
    MARATHON: "👑 Marathon",
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-primary py-8 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      {/* VS INTRO SCREEN OVERLAY */}
      <AnimatePresence>
        {showIntro && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-deep/98 backdrop-blur-md overflow-hidden"
          >
            {/* Cyber Lines Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-neon-blue to-transparent animate-pulse" />
              <div className="absolute top-0 left-2/4 w-px h-full bg-gradient-to-b from-transparent via-neon-purple to-transparent animate-pulse" />
              <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-neon-gold to-transparent animate-pulse" />
            </div>

            <div className="max-w-4xl w-full px-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative z-10">
              {/* Player 1 (Me) */}
              <motion.div
                initial={{ x: -150, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 65, delay: 0.2 }}
                className="glass-card p-6 sm:p-8 rounded-3xl border border-blue-500/30 bg-blue-500/5 shadow-[0_0_35px_rgba(59,130,246,0.15)] text-center flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full bg-blue-600/20 border-2 border-blue-500/55 flex items-center justify-center text-3xl font-black text-blue-400 shadow-md mb-4 font-heading">
                  {me.username.slice(0, 1).toUpperCase()}
                </div>
                <h2 className="text-2xl font-black text-white truncate max-w-full font-heading">@{me.username}</h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 mt-1.5 font-heading">
                  {me.tier || "Silver"}
                </span>
                <span className="text-sm font-black text-white mt-4 font-heading bg-blue-600/10 px-4 py-2 rounded-xl border border-blue-500/20 shadow-inner">
                  {me.ratingPoint || 1000} RP
                </span>
              </motion.div>

              {/* VS in Middle */}
              <div className="flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 85, delay: 0.4 }}
                  className="w-24 h-24 rounded-full bg-gradient-to-tr from-neon-blue via-neon-purple to-neon-gold flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.45)] border border-white/10"
                >
                  <span className="text-3xl font-black text-white italic font-heading">VS</span>
                </motion.div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500 mt-5 font-heading"
                >
                  {modeLabels[battleMode] || "🔥 Arena"} Duel
                </motion.span>
              </div>

              {/* Player 2 (Opponent) */}
              <motion.div
                initial={{ x: 150, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 65, delay: 0.2 }}
                className="glass-card p-6 sm:p-8 rounded-3xl border border-purple-500/30 bg-purple-500/5 shadow-[0_0_35px_rgba(168,85,247,0.15)] text-center flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full bg-purple-600/20 border-2 border-purple-500/55 flex items-center justify-center text-3xl font-black text-purple-400 shadow-md mb-4 font-heading">
                  {opponent.username.slice(0, 1).toUpperCase()}
                </div>
                <h2 className="text-2xl font-black text-white truncate max-w-full font-heading">@{opponent.username}</h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 mt-1.5 font-heading">
                  {opponent.tier || "Silver"}
                </span>
                <span className="text-sm font-black text-white mt-4 font-heading bg-purple-600/10 px-4 py-2 rounded-xl border border-purple-500/20 shadow-inner">
                  {opponent.ratingPoint || 1000} RP
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REST AREA OVERLAY (MARATHON MODE) */}
      <AnimatePresence>
        {checkpointInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-deep/95 backdrop-blur-md p-6 text-center"
          >
            <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-neon-blue/30 bg-bg-surface shadow-[0_0_50px_rgba(0,240,255,0.2)] flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-neon-blue/20 bg-neon-blue/5 text-neon-cyan font-heading mb-4">
                CHECKPOINT {checkpointInfo.currentCheckpoint} SELESAI
              </span>
              <h2 className="text-2xl font-black text-white font-heading tracking-wide uppercase">
                Rest Area
              </h2>
              <p className="text-slate-400 mt-2 text-xs sm:text-sm font-ui leading-relaxed">
                Mengisi energi siber... Jeda istirahat sejenak untuk memulihkan stamina berpikir Anda.
              </p>

              {/* Progress Bar Hitung Mundur */}
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-6 mb-2">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 7, ease: "linear" }}
                  className="h-full bg-gradient-to-r from-neon-blue to-neon-purple shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-heading mb-4">
                Pertandingan berlanjut otomatis
              </span>

              {/* Steady Mind Buff Emblem */}
              {user?.id === checkpointInfo.leaderUserId && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-4 p-4 w-full rounded-2xl border border-neon-gold/30 bg-neon-gold/5 shadow-[0_0_25px_rgba(234,179,8,0.15)] flex flex-col items-center"
                >
                  <Award className="w-10 h-10 text-neon-gold animate-bounce" />
                  <span className="text-xs font-black uppercase tracking-wider text-neon-gold mt-2 font-heading">
                    Steady Mind Buff
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 font-ui">
                    Anda sedang memimpin! Pertahankan konsentrasi.
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        {/* SCOREBOARD CONTAINER */}
        <div className="grid grid-cols-3 bg-bg-card/90 border border-slate-800 rounded-2xl p-4 mb-8 shadow-[0_0_20px_rgba(0,240,255,0.1)] items-center relative overflow-hidden backdrop-blur-md">
          {/* Player 1 Left */}
          <div className="text-left flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative">
              {me.hasAnswered && (
                <span className="absolute -inset-1 rounded-full bg-neon-blue/40 animate-ping opacity-75" />
              )}
              <div className="relative z-10 w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-sm shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.15)] font-heading">
                {me.username.slice(0, 1).toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-100 max-w-[120px] truncate font-ui">
                @{me.username}
              </div>
              <div className="text-xl sm:text-2xl font-black text-blue-400">{me.score} <span className="text-xs font-semibold text-slate-550">PTS</span></div>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${myAnswerState.className} font-heading`}>
                {myAnswerState.label}
              </span>
            </div>
          </div>

          {/* VS & Timer Middle */}
          <div className="text-center flex flex-col items-center justify-center z-10">
            <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-widest mb-1 font-heading">
              {modeLabels[battleMode] || "🔥 Arena"} | Soal {currentNum} / {totalQuestions}
            </span>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-lg transition-all duration-300 ${
              feedback 
                ? "bg-slate-800 border-slate-700" 
                : battleMode === "STRATEGY"
                ? isSuddenDeath
                  ? "bg-red-500/10 border-red-500 shadow-red-500/10 animate-pulse"
                  : "bg-purple-500/10 border-purple-500 shadow-purple-500/10"
                : timeLeft <= 5 
                ? "bg-red-500/10 border-red-500 shadow-red-500/10 animate-pulse" 
                : "bg-indigo-500/10 border-indigo-500 shadow-indigo-500/10"
            }`}>
              {feedback ? (
                <Swords className="w-6 h-6 text-slate-400" />
              ) : battleMode === "STRATEGY" ? (
                isSuddenDeath ? (
                  <motion.span 
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="text-lg font-black text-red-500 font-heading"
                  >
                    {formatTimer(timeLeft)}
                  </motion.span>
                ) : (
                  <BrainCircuit className="w-6 h-6 text-purple-400 animate-pulse" />
                )
              ) : (
                <span className={`text-lg font-black ${timeLeft <= 5 ? "text-red-400" : "text-white"} font-heading`}>
                  {formatTimer(timeLeft)}
                </span>
              )}
            </div>
          </div>

          {/* Player 2 Right */}
          <div className="text-right flex flex-col sm:flex-row-reverse items-end sm:items-center gap-3">
            <div className="relative">
              {opponent.hasAnswered && (
                <span className="absolute -inset-1 rounded-full bg-neon-purple/40 animate-ping opacity-75" />
              )}
              <div className="relative z-10 w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-400 text-sm shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.15)] font-heading">
                {opponent.username.slice(0, 1).toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-100 max-w-[120px] truncate font-ui">
                @{opponent.username}
              </div>
              <div className="text-xl sm:text-2xl font-black text-purple-400">{opponent.score} <span className="text-xs font-semibold text-slate-550">PTS</span></div>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${opponentAnswerState.className} font-heading`}>
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
              className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-neon-gold/30 bg-neon-gold/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-neon-gold font-heading"
            >
              <Zap className="h-4 w-4" aria-hidden="true" />
              {comboMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ACTIVE QUESTION PANEL */}
        {question && (
          <motion.div 
            animate={shouldShake ? {
              x: [0, -8, 8, -8, 8, -4, 4, 0],
              y: [0, 4, -4, 4, -4, 2, -2, 0],
            } : {}}
            transition={{ duration: 0.4 }}
            className="bg-bg-card/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/5 rounded-full blur-3xl -z-10" />

            {/* Strategy Sudden Death Alert Banner */}
            {isSuddenDeath && !me.hasAnswered && !feedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs sm:text-sm font-bold flex items-center gap-3 font-ui animate-pulse"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span>Lawan telah mengunci jawaban! Waktu Anda tinggal 10 detik!</span>
              </motion.div>
            )}

            {/* Question Text */}
            <div className="mb-8">
              <p className="text-lg sm:text-xl font-semibold leading-relaxed text-slate-100 whitespace-pre-wrap font-heading">
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
                className="text-center p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-center justify-center gap-3 text-slate-450 text-sm animate-pulse font-ui"
              >
                <div className="w-4 h-4 border-2 border-indigo-400/20 border-t-indigo-400 rounded-full animate-spin" />
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
                  <div className="font-ui">
                    <h4 className="font-bold text-sm sm:text-base font-heading">
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
                  <div className="bg-[#131A26]/80 border border-slate-800 rounded-xl p-4 font-ui">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5 font-heading">
                      <Award className="w-4 h-4 text-neon-gold" /> Pembahasan Soal
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {feedback.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
