import React, { useEffect } from "react";
import { motion } from "framer-motion";

interface MultipleChoiceProps {
  options: Record<string, string>;
  selectedAnswer: string;
  onSelectAnswer: (key: string) => void;
  disabled: boolean;
  feedback: {
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string;
  } | null;
}

export default function MultipleChoice({
  options,
  selectedAnswer,
  onSelectAnswer,
  disabled,
  feedback,
}: MultipleChoiceProps) {
  
  // Keyboard shortcuts: A, B, C, D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      const key = e.key.toUpperCase();
      if (options[key]) {
        onSelectAnswer(key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options, onSelectAnswer, disabled]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(options).map(([key, value]) => {
        const isSelected = selectedAnswer === key;
        const hasFeedback = !!feedback;
        const isCorrect = feedback?.correctAnswer === key;
        const isSelectedWrong = hasFeedback && isSelected && !feedback.isCorrect;

        let buttonClass = "border-white/5 bg-bg-surface/40 text-slate-300 hover:border-white/15 hover:text-white";
        let badgeClass = "bg-bg-surface text-slate-500";

        if (hasFeedback) {
          if (isCorrect) {
            buttonClass = "border-neon-green/30 bg-neon-green/10 text-neon-green shadow-[0_0_15px_rgba(0,255,102,0.15)]";
            badgeClass = "bg-neon-green text-white";
          } else if (isSelectedWrong) {
            buttonClass = "border-neon-red/30 bg-neon-red/10 text-neon-red shadow-[0_0_15px_rgba(255,51,102,0.15)]";
            badgeClass = "bg-neon-red text-white";
          } else {
            buttonClass = "border-white/2 bg-black/10 text-slate-600 opacity-50 cursor-not-allowed";
            badgeClass = "bg-black/20 text-slate-750";
          }
        } else if (isSelected) {
          buttonClass = "border-neon-blue bg-neon-blue/10 text-neon-blue shadow-[0_0_15px_rgba(0,240,255,0.15)]";
          badgeClass = "bg-neon-blue text-white";
        }

        return (
          <motion.button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onSelectAnswer(key)}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            className={`w-full text-left p-4 sm:p-5 rounded-2xl border text-sm sm:text-base font-bold flex items-center gap-4 transition-all duration-200 cursor-pointer ${buttonClass}`}
            aria-pressed={isSelected}
            aria-label={`Opsi ${key}: ${value}`}
          >
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-colors font-heading ${badgeClass}`}>
              {key}
            </span>
            <span className="break-words font-ui">{value}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
