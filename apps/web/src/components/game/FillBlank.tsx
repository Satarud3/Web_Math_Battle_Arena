import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface FillBlankProps {
  selectedAnswer: string;
  onSelectAnswer: (val: string) => void;
  disabled: boolean;
  feedback: {
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string;
  } | null;
}

export default function FillBlank({
  selectedAnswer,
  onSelectAnswer,
  disabled,
  feedback,
}: FillBlankProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Cyber input filter: only allow numbers, minus sign, and decimal point
    const value = e.target.value;
    const cleanValue = value.replace(/[^0-9.-]/g, "");
    
    // Prevent multiple decimals or minus signs in wrong places
    const parts = cleanValue.split(".");
    let filteredValue = cleanValue;
    if (parts.length > 2) {
      filteredValue = parts[0] + "." + parts.slice(1).join("");
    }
    
    // Only allow minus sign at the very beginning
    if (filteredValue.indexOf("-") > 0) {
      filteredValue = filteredValue.replace(/-/g, (match, offset) => (offset === 0 ? "-" : ""));
    }

    onSelectAnswer(filteredValue);
  };

  const hasFeedback = !!feedback;
  let inputBorderClass = "border-white/10 bg-bg-surface/40 text-white focus:border-neon-blue focus:ring-1 focus:ring-neon-blue";
  if (hasFeedback) {
    if (feedback.isCorrect) {
      inputBorderClass = "border-neon-green/40 bg-neon-green/5 text-neon-green shadow-[0_0_15px_rgba(0,255,102,0.15)]";
    } else {
      inputBorderClass = "border-neon-red/40 bg-neon-red/5 text-neon-red shadow-[0_0_15px_rgba(255,51,102,0.15)]";
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto py-6 font-ui">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={selectedAnswer}
          onChange={handleChange}
          placeholder={disabled ? "Sesi dikunci" : "Masukkan angka hasil perhitungan..."}
          className={`w-full min-h-14 px-5 rounded-2xl border text-lg font-bold text-center tracking-wider transition-all duration-300 focus:outline-none ${inputBorderClass}`}
          aria-label="Kolom input jawaban numerik"
        />
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500 text-xs font-bold font-heading">
          NUMERIC ONLY
        </div>
      </div>

      {hasFeedback && !feedback.isCorrect && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-3.5 rounded-xl border border-neon-blue/20 bg-neon-blue/5 text-xs text-neon-blue font-bold"
        >
          Jawaban benar adalah: <span className="font-heading text-sm text-white ml-1">{feedback.correctAnswer}</span>
        </motion.div>
      )}
    </div>
  );
}
