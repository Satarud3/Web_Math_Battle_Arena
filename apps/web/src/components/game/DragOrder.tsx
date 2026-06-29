import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, GripVertical } from "lucide-react";

interface DragOrderProps {
  options: Record<string, string>; // e.g., {"A": "10", "B": "20", "C": "30"}
  selectedAnswer: string; // Comma-separated ordered keys, e.g., "B,A,C"
  onSelectAnswer: (val: string) => void;
  disabled: boolean;
  feedback: {
    isCorrect: boolean;
    correctAnswer: string; // Comma-separated ordered keys, e.g., "A,B,C"
    explanation?: string;
  } | null;
}

export default function DragOrder({
  options,
  selectedAnswer,
  onSelectAnswer,
  disabled,
  feedback,
}: DragOrderProps) {
  const [items, setItems] = useState<string[]>([]);

  // Initialize items from selectedAnswer or default options keys
  useEffect(() => {
    const keys = Object.keys(options);
    if (selectedAnswer) {
      setItems(selectedAnswer.split(","));
    } else {
      setItems(keys);
      onSelectAnswer(keys.join(","));
    }
  }, [options, selectedAnswer]);

  const moveItem = (index: number, direction: "up" | "down") => {
    if (disabled) return;
    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    // Swap items
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    setItems(newItems);
    onSelectAnswer(newItems.join(","));
  };

  const hasFeedback = !!feedback;
  const correctOrder = feedback?.correctAnswer ? feedback.correctAnswer.split(",") : [];

  return (
    <div className="flex flex-col gap-3 max-w-lg mx-auto py-4 font-ui">
      <div className="text-center text-xs text-slate-500 mb-2 font-bold uppercase tracking-wider">
        Urutkan dari atas ke bawah:
      </div>

      <AnimatePresence mode="popLayout">
        {items.map((key, idx) => {
          const value = options[key];
          const hasSubmitted = !!feedback;
          const isCorrectPos = hasSubmitted && correctOrder[idx] === key;

          let cardClass = "border-white/5 bg-bg-surface/40 text-slate-300";
          if (hasSubmitted) {
            if (isCorrectPos) {
              cardClass = "border-neon-green/30 bg-neon-green/10 text-neon-green shadow-[0_0_15px_rgba(0,255,102,0.15)]";
            } else {
              cardClass = "border-neon-red/30 bg-neon-red/10 text-neon-red shadow-[0_0_15px_rgba(255,51,102,0.15)]";
            }
          }

          return (
            <motion.div
              key={key}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={`flex items-center justify-between p-4 rounded-2xl border text-sm sm:text-base font-bold transition-all ${cardClass}`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="text-slate-500 cursor-grab active:cursor-grabbing shrink-0">
                  <GripVertical className="w-5 h-5" />
                </div>
                <span className="w-6.5 h-6.5 rounded-lg bg-bg-surface/50 border border-white/5 flex items-center justify-center font-heading font-black text-xs text-slate-400 shrink-0">
                  {idx + 1}
                </span>
                <span className="break-words truncate">{value}</span>
              </div>

              {!disabled && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, "up")}
                    className="p-2 rounded-xl bg-bg-surface border border-white/5 text-slate-450 hover:border-neon-blue hover:text-neon-blue disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-455 transition-all"
                    aria-label={`Pindahkan Soal ${idx + 1} ke atas`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === items.length - 1}
                    onClick={() => moveItem(idx, "down")}
                    className="p-2 rounded-xl bg-bg-surface border border-white/5 text-slate-455 hover:border-neon-blue hover:text-neon-blue disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-455 transition-all"
                    aria-label={`Pindahkan Soal ${idx + 1} ke bawah`}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {hasFeedback && !feedback.isCorrect && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-2xl border border-neon-blue/20 bg-neon-blue/5 text-xs text-neon-blue font-bold text-center"
        >
          Urutan yang benar adalah:{" "}
          <span className="font-heading text-sm text-white ml-1 block mt-2">
            {correctOrder.map((k, i) => `${i + 1}. ${options[k]}`).join("  ➡  ")}
          </span>
        </motion.div>
      )}
    </div>
  );
}
