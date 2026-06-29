import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

interface TrueFalseProps {
  selectedAnswer: string;
  onSelectAnswer: (val: string) => void;
  disabled: boolean;
  feedback: {
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string;
  } | null;
}

export default function TrueFalse({
  selectedAnswer,
  onSelectAnswer,
  disabled,
  feedback,
}: TrueFalseProps) {

  // Keyboard shortcuts: B/T for True, S/F for False
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      const key = e.key.toUpperCase();
      if (key === "B" || key === "T") {
        onSelectAnswer("TRUE");
      } else if (key === "S" || key === "F") {
        onSelectAnswer("FALSE");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSelectAnswer, disabled]);

  const hasFeedback = !!feedback;

  const options = [
    { value: "TRUE", label: "BENAR", icon: Check, color: "neon-green", baseColor: "rgba(0, 255, 102, 0.15)", activeBorder: "border-neon-green" },
    { value: "FALSE", label: "SALAH", icon: X, color: "neon-red", baseColor: "rgba(255, 51, 102, 0.15)", activeBorder: "border-neon-red" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 max-w-2xl mx-auto font-heading">
      {options.map((opt) => {
        const isSelected = selectedAnswer === opt.value;
        const isCorrect = feedback?.correctAnswer === opt.value;
        const isSelectedWrong = hasFeedback && isSelected && !feedback.isCorrect;
        const Icon = opt.icon;

        let buttonClass = "border-white/5 bg-bg-surface/40 text-slate-300 hover:border-white/15 hover:text-white";
        let iconClass = "bg-bg-surface text-slate-500";

        if (hasFeedback) {
          if (isCorrect) {
            buttonClass = "border-neon-green/40 bg-neon-green/10 text-neon-green shadow-[0_0_20px_rgba(0,255,102,0.2)]";
            iconClass = "bg-neon-green text-white";
          } else if (isSelectedWrong) {
            buttonClass = "border-neon-red/40 bg-neon-red/10 text-neon-red shadow-[0_0_20px_rgba(255,51,102,0.2)]";
            iconClass = "bg-neon-red text-white";
          } else {
            buttonClass = "border-white/2 bg-black/10 text-slate-600 opacity-50 cursor-not-allowed";
            iconClass = "bg-black/25 text-slate-700";
          }
        } else if (isSelected) {
          buttonClass = `${opt.activeBorder} bg-${opt.color}/10 text-${opt.color} shadow-[0_0_20px_${opt.baseColor}]`;
          iconClass = `bg-${opt.color} text-white`;
        }

        return (
          <motion.button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onSelectAnswer(opt.value)}
            whileHover={!disabled ? { scale: 1.03 } : {}}
            whileTap={!disabled ? { scale: 0.97 } : {}}
            className={`w-full min-h-24 p-6 rounded-3xl border flex items-center justify-between transition-all duration-350 cursor-pointer ${buttonClass}`}
            aria-pressed={isSelected}
            aria-label={`Pernyataan bernilai ${opt.label}`}
          >
            <div className="flex flex-col items-start gap-1 text-left font-ui">
              <span className="text-xs text-slate-500 font-bold tracking-widest uppercase">Pilihan Taktis</span>
              <span className="text-xl font-black tracking-wider">{opt.label}</span>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${iconClass}`}>
              <Icon className="w-6 h-6" />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
