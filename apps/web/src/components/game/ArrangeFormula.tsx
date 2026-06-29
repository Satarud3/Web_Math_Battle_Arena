import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, RefreshCw, ChevronRight } from "lucide-react";

interface ArrangeFormulaProps {
  questionData: string[] | null;
  selectedAnswer: string;
  onSelectAnswer: (val: string) => void;
  disabled: boolean;
  feedback: {
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string;
  } | null;
}

export default function ArrangeFormula({
  questionData,
  selectedAnswer,
  onSelectAnswer,
  disabled,
  feedback,
}: ArrangeFormulaProps) {
  const initialTokens = questionData || [];

  const [availableTokens, setAvailableTokens] = useState<string[]>([]);
  const [workspaceTokens, setWorkspaceTokens] = useState<string[]>([]);

  // Initialize and shuffle tokens
  useEffect(() => {
    if (initialTokens.length > 0) {
      // Fisher-Yates shuffle
      const shuffle = (array: string[]) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      };

      setAvailableTokens(shuffle(initialTokens));
      setWorkspaceTokens([]);
    }
  }, [questionData]);

  // Sync with external resets or answers
  useEffect(() => {
    if (!selectedAnswer) {
      // If cleared, put everything back to available (shuffled)
      if (workspaceTokens.length > 0) {
        setAvailableTokens((prev) => {
          const arr = [...prev, ...workspaceTokens];
          return arr;
        });
        setWorkspaceTokens([]);
      }
    }
  }, [selectedAnswer]);

  const handleTokenClick = (token: string, fromWorkspace: boolean) => {
    if (disabled || !!feedback) return;

    if (fromWorkspace) {
      // Remove from workspace, add to available
      setWorkspaceTokens((prev) => prev.filter((t, i) => i !== prev.indexOf(token)));
      setAvailableTokens((prev) => [...prev, token]);
      
      const newWorkspace = workspaceTokens.filter((t, i) => i !== workspaceTokens.indexOf(token));
      onSelectAnswer(newWorkspace.join(" "));
    } else {
      // Remove from available, add to workspace
      setAvailableTokens((prev) => prev.filter((t, i) => i !== prev.indexOf(token)));
      setWorkspaceTokens((prev) => [...prev, token]);

      const newWorkspace = [...workspaceTokens, token];
      onSelectAnswer(newWorkspace.join(" "));
    }
  };

  const handleReset = () => {
    if (disabled || !!feedback) return;
    setAvailableTokens([...availableTokens, ...workspaceTokens]);
    setWorkspaceTokens([]);
    onSelectAnswer("");
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-heading">
          <HelpCircle className="w-4 h-4 text-neon-blue" />
          Susun potongan rumus berikut ke dalam kotak hasil
        </span>
        {!feedback && !disabled && workspaceTokens.length > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Bersihkan
          </button>
        )}
      </div>

      {/* Workspace Area */}
      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 font-heading">Kotak Hasil Formula</div>
        <div className="min-h-[70px] p-4 rounded-xl border border-slate-800 bg-[#0c121d] flex flex-wrap gap-2.5 items-center justify-start shadow-inner">
          <AnimatePresence>
            {workspaceTokens.length === 0 ? (
              <span className="text-sm text-slate-600 italic">Klik pilihan di bawah untuk menyusun rumus...</span>
            ) : (
              workspaceTokens.map((token, index) => (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={`work-${token}-${index}`}
                  type="button"
                  disabled={disabled || !!feedback}
                  onClick={() => handleTokenClick(token, true)}
                  className={`px-4 py-2 bg-gradient-to-b from-indigo-600 to-indigo-700 text-white rounded-lg border border-indigo-500 font-mono font-bold text-base shadow-[0_0_10px_rgba(99,102,241,0.2)] ${
                    disabled || !!feedback ? "cursor-not-allowed opacity-85" : "cursor-pointer hover:from-indigo-500 hover:to-indigo-600 hover:scale-105"
                  } transition-all duration-150`}
                >
                  {token}
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Available Tokens Area */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2 font-heading">Pilihan Komponen</div>
        <div className="p-4 rounded-xl border border-slate-800 bg-[#131A26]/40 flex flex-wrap gap-2.5 items-center justify-center min-h-[70px]">
          {availableTokens.length === 0 && workspaceTokens.length > 0 ? (
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
              Semua komponen sudah digunakan <ChevronRight className="w-3.5 h-3.5 text-indigo-400" /> Silakan periksa hasil di atas.
            </span>
          ) : (
            availableTokens.map((token, index) => (
              <motion.button
                whileHover={!disabled && !feedback ? { scale: 1.05 } : {}}
                whileTap={!disabled && !feedback ? { scale: 0.95 } : {}}
                key={`avail-${token}-${index}`}
                type="button"
                disabled={disabled || !!feedback}
                onClick={() => handleTokenClick(token, false)}
                className={`px-4 py-2 bg-slate-800/80 border border-slate-700 text-slate-200 rounded-lg font-mono font-bold text-base hover:bg-slate-700 hover:text-white transition-colors duration-150 ${
                  disabled || !!feedback ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                }`}
              >
                {token}
              </motion.button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
