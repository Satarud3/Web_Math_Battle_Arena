import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

interface PuzzleProps {
  questionData: {
    sequence?: string;
    matrix?: string;
  } | null;
  selectedAnswer: string;
  onSelectAnswer: (val: string) => void;
  disabled: boolean;
  feedback: {
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string;
  } | null;
}

export default function Puzzle({
  questionData,
  selectedAnswer,
  onSelectAnswer,
  disabled,
  feedback,
}: PuzzleProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    if (!disabled && !feedback && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled, feedback, questionData]);

  const sequence = questionData?.sequence;
  const matrix = questionData?.matrix;

  // Render sequence badges
  const renderSequence = () => {
    if (!sequence) return null;
    
    // Split sequence by comma
    const parts = sequence.split(",").map((p) => p.trim());

    return (
      <div className="flex flex-wrap items-center justify-center gap-3 py-4">
        {parts.map((part, index) => {
          const isTarget = part.includes("[?]") || part === "?";
          
          if (isTarget) {
            return (
              <motion.div
                key={`seq-${index}`}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 rounded-2xl border-2 border-dashed border-neon-gold bg-neon-gold/5 flex items-center justify-center font-bold text-xl text-neon-gold shadow-[0_0_15px_rgba(234,179,8,0.1)]"
              >
                ?
              </motion.div>
            );
          }

          return (
            <div
              key={`seq-${index}`}
              className="w-16 h-16 rounded-2xl border border-slate-800 bg-[#131A26] flex items-center justify-center font-bold text-xl text-slate-100 shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
            >
              {part}
            </div>
          );
        })}
      </div>
    );
  };

  // Render matrix relation
  const renderMatrix = () => {
    if (!matrix) return null;

    // e.g., "3 -> 9, 5 -> [?]"
    const parts = matrix.split(",").map((p) => p.trim());

    return (
      <div className="flex flex-col items-center justify-center gap-4 py-4 font-mono text-lg">
        {parts.map((part, index) => {
          const isTarget = part.includes("[?]") || part.includes("?");
          
          // Split by ->
          const sides = part.split("->").map((s) => s.trim());
          const left = sides[0] || "";
          const right = sides[1] || "";

          return (
            <div
              key={`mat-${index}`}
              className={`flex items-center gap-4 px-6 py-3 rounded-xl border ${
                isTarget 
                  ? "border-neon-gold bg-neon-gold/5 text-neon-gold shadow-[0_0_15px_rgba(234,179,8,0.05)]" 
                  : "border-slate-800 bg-[#131A26]/60 text-slate-300"
              }`}
            >
              <span className="font-bold">{left}</span>
              <span className="text-slate-500">➔</span>
              {isTarget ? (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="font-black bg-neon-gold/20 px-3 py-1 rounded border border-neon-gold/40"
                >
                  ?
                </motion.span>
              ) : (
                <span className="font-bold text-white">{right}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Only allow numbers, minus, slash (for fractions), and decimal points
    const cleanVal = val.replace(/[^0-9\/\.-]/g, "");
    onSelectAnswer(cleanVal);
  };

  return (
    <div className="w-full">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-4 font-heading">
        <HelpCircle className="w-4 h-4 text-neon-blue" />
        Analisis pola di bawah ini, lalu ketik angka jawabannya
      </div>

      {/* Pattern Display Board */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-[#0c121d] mb-6 shadow-inner flex items-center justify-center min-h-[120px]">
        {sequence && renderSequence()}
        {matrix && renderMatrix()}
      </div>

      {/* Answer Input */}
      <div className="max-w-md mx-auto">
        <label htmlFor="puzzle-input" className="block text-center text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 font-heading">
          Masukkan Jawaban Angka
        </label>
        <div className="relative">
          <input
            id="puzzle-input"
            ref={inputRef}
            type="text"
            disabled={disabled || !!feedback}
            value={selectedAnswer}
            onChange={handleInputChange}
            placeholder="Ketik jawaban..."
            className="w-full text-center py-4 px-6 bg-[#131A26] border-2 border-slate-800 rounded-2xl text-xl font-bold font-mono text-white placeholder-slate-600 focus:outline-none focus:border-neon-blue focus:shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
