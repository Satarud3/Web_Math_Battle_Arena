import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Square, CheckSquare } from "lucide-react";

interface SelectMultipleProps {
  options: Record<string, string>;
  selectedAnswer: string; // Comma-separated sorted keys, e.g., "A,C"
  onSelectAnswer: (val: string) => void;
  disabled: boolean;
  feedback: {
    isCorrect: boolean;
    correctAnswer: string; // Comma-separated sorted keys, e.g., "A,C"
    explanation?: string;
  } | null;
}

export default function SelectMultiple({
  options,
  selectedAnswer,
  onSelectAnswer,
  disabled,
  feedback,
}: SelectMultipleProps) {
  const selectedKeys = selectedAnswer ? selectedAnswer.split(",") : [];

  const handleToggle = (key: string) => {
    if (disabled) return;
    let newKeys = [...selectedKeys];
    if (newKeys.includes(key)) {
      newKeys = newKeys.filter((k) => k !== key);
    } else {
      newKeys.push(key);
    }
    // Sort keys alphabetically to ensure consistent format (e.g. "A,C")
    newKeys.sort();
    onSelectAnswer(newKeys.join(","));
  };

  // Keyboard shortcuts: 1, 2, 3, 4 to toggle option keys in order of appearance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      const index = parseInt(e.key, 10) - 1;
      const keys = Object.keys(options);
      if (index >= 0 && index < keys.length) {
        handleToggle(keys[index]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options, selectedAnswer, disabled]);

  const hasFeedback = !!feedback;
  const correctKeys = feedback?.correctAnswer ? feedback.correctAnswer.split(",") : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-ui">
      {Object.entries(options).map(([key, value], idx) => {
        const isSelected = selectedKeys.includes(key);
        const hasSubmitted = !!feedback;
        
        // In multiple selection, an option is correct if it should be selected and is, 
        // or shouldn't be selected and isn't.
        // But for visual feedback, we highlight:
        // - Green (correct answer): If it was part of the correct answer set
        // - Red (wrong selection): If it was selected by the user but is NOT part of the correct answer set
        const isCorrectOption = correctKeys.includes(key);
        const isSelectedWrong = hasSubmitted && isSelected && !isCorrectOption;

        let buttonClass = "border-white/5 bg-bg-surface/40 text-slate-300 hover:border-white/15 hover:text-white";
        let checkClass = "text-slate-500";

        if (hasSubmitted) {
          if (isCorrectOption) {
            buttonClass = "border-neon-green/30 bg-neon-green/10 text-neon-green shadow-[0_0_15px_rgba(0,255,102,0.15)]";
            checkClass = "text-neon-green";
          } else if (isSelectedWrong) {
            buttonClass = "border-neon-red/30 bg-neon-red/10 text-neon-red shadow-[0_0_15px_rgba(255,51,102,0.15)]";
            checkClass = "text-neon-red";
          } else {
            buttonClass = "border-white/2 bg-black/10 text-slate-600 opacity-50 cursor-not-allowed";
            checkClass = "text-slate-700";
          }
        } else if (isSelected) {
          buttonClass = "border-neon-blue bg-neon-blue/10 text-neon-blue shadow-[0_0_15px_rgba(0,240,255,0.15)]";
          checkClass = "text-neon-blue";
        }

        return (
          <motion.button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => handleToggle(key)}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            className={`w-full text-left p-4 sm:p-5 rounded-2xl border text-sm sm:text-base font-bold flex items-center justify-between transition-all duration-200 cursor-pointer ${buttonClass}`}
            aria-pressed={isSelected}
            aria-label={`Opsi ${key} (Pilihan ${idx + 1}): ${value}`}
          >
            <div className="flex items-center gap-4 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-bg-surface/50 border border-white/5 flex items-center justify-center font-heading font-black text-xs text-slate-400 shrink-0">
                {idx + 1}
              </span>
              <span className="break-words truncate">{value}</span>
            </div>
            <div className={`shrink-0 ${checkClass}`}>
              {isSelected ? <CheckSquare className="w-5.5 h-5.5" /> : <Square className="w-5.5 h-5.5" />}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
