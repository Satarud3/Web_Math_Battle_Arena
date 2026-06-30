import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HelpCircle, RefreshCw } from "lucide-react";

interface MatchPairProps {
  questionData: {
    pairs?: Array<{ left: string; right: string }>;
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

export default function MatchPair({
  questionData,
  selectedAnswer,
  onSelectAnswer,
  disabled,
  feedback,
}: MatchPairProps) {
  const pairs = questionData?.pairs || [];

  const [leftItems, setLeftItems] = useState<string[]>([]);
  const [rightItems, setRightItems] = useState<string[]>([]);
  
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRightIdx, setSelectedRightIdx] = useState<number | null>(null);

  // Map of left item -> index of matched item in rightItems
  const [matches, setMatches] = useState<Record<string, number>>({});

  // Initialize and shuffle columns
  useEffect(() => {
    if (pairs.length > 0) {
      const lefts = pairs.map((p) => p.left);
      const rights = pairs.map((p) => p.right);

      // Simple Fisher-Yates shuffle
      const shuffle = (array: string[]) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      };

      const shuffledLefts = shuffle(lefts);
      const shuffledRights = shuffle(rights);

      setLeftItems(shuffledLefts);
      setRightItems(shuffledRights);
      setMatches({});
      setSelectedLeft(null);
      setSelectedRightIdx(null);
    }
  }, [questionData]);

  // Sync with selectedAnswer (for external resets or value restoration)
  useEffect(() => {
    if (!selectedAnswer) {
      setMatches({});
    } else {
      try {
        const parsed = JSON.parse(selectedAnswer);
        if (typeof parsed === "object" && parsed !== null) {
          const restoredMatches: Record<string, number> = {};
          const usedRightIndices = new Set<number>();
          
          for (const [leftText, rightText] of Object.entries(parsed)) {
            const idx = rightItems.findIndex((val, i) => val === rightText && !usedRightIndices.has(i));
            if (idx !== -1) {
              restoredMatches[leftText] = idx;
              usedRightIndices.add(idx);
            }
          }
          setMatches(restoredMatches);
        }
      } catch (e) {
        // Not a valid JSON, ignore
      }
    }
  }, [selectedAnswer, rightItems]);

  const handleLeftClick = (item: string) => {
    if (disabled || !!feedback) return;
    
    // If already matched, clicking it will unmatch it
    if (matches[item] !== undefined) {
      const newMatches = { ...matches };
      delete newMatches[item];
      setMatches(newMatches);
      
      const parentMatches: Record<string, string> = {};
      for (const [lText, rIdx] of Object.entries(newMatches)) {
        if (rightItems[rIdx] !== undefined) {
          parentMatches[lText] = rightItems[rIdx];
        }
      }
      onSelectAnswer(Object.keys(parentMatches).length > 0 ? JSON.stringify(parentMatches) : "");
      return;
    }

    setSelectedLeft(item);

    // If a right index was already selected, pair them
    if (selectedRightIdx !== null) {
      const newMatches = { ...matches, [item]: selectedRightIdx };
      setMatches(newMatches);
      
      const parentMatches: Record<string, string> = {};
      for (const [lText, rIdx] of Object.entries(newMatches)) {
        if (rightItems[rIdx] !== undefined) {
          parentMatches[lText] = rightItems[rIdx];
        }
      }
      onSelectAnswer(JSON.stringify(parentMatches));
      
      setSelectedLeft(null);
      setSelectedRightIdx(null);
    }
  };

  const handleRightClick = (idx: number) => {
    if (disabled || !!feedback) return;

    // Check if this right index is already matched
    const matchedLeft = Object.keys(matches).find((key) => matches[key] === idx);
    if (matchedLeft) {
      const newMatches = { ...matches };
      delete newMatches[matchedLeft];
      setMatches(newMatches);
      
      const parentMatches: Record<string, string> = {};
      for (const [lText, rIdx] of Object.entries(newMatches)) {
        if (rightItems[rIdx] !== undefined) {
          parentMatches[lText] = rightItems[rIdx];
        }
      }
      onSelectAnswer(Object.keys(parentMatches).length > 0 ? JSON.stringify(parentMatches) : "");
      return;
    }

    setSelectedRightIdx(idx);

    // If a left item was already selected, pair them
    if (selectedLeft) {
      const newMatches = { ...matches, [selectedLeft]: idx };
      setMatches(newMatches);
      
      const parentMatches: Record<string, string> = {};
      for (const [lText, rIdx] of Object.entries(newMatches)) {
        if (rightItems[rIdx] !== undefined) {
          parentMatches[lText] = rightItems[rIdx];
        }
      }
      onSelectAnswer(JSON.stringify(parentMatches));
      
      setSelectedLeft(null);
      setSelectedRightIdx(null);
    }
  };

  const handleReset = () => {
    if (disabled || !!feedback) return;
    setMatches({});
    setSelectedLeft(null);
    setSelectedRightIdx(null);
    onSelectAnswer("");
  };

  // Define styling colors for matched pairs
  const pairColors = [
    { border: "border-blue-500 bg-blue-500/10 text-blue-300", badge: "bg-blue-500 text-black" },
    { border: "border-purple-500 bg-purple-500/10 text-purple-300", badge: "bg-purple-500 text-white" },
    { border: "border-emerald-500 bg-emerald-500/10 text-emerald-300", badge: "bg-emerald-500 text-black" },
    { border: "border-amber-500 bg-amber-500/10 text-amber-300", badge: "bg-amber-500 text-black" },
    { border: "border-pink-500 bg-pink-500/10 text-pink-300", badge: "bg-pink-500 text-white" },
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-heading">
          <HelpCircle className="w-4 h-4 text-neon-blue" />
          Hubungkan pasangan kiri dengan kanan
        </span>
        {!feedback && !disabled && Object.keys(matches).length > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Reset Hubungan
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-3">
          <div className="text-center text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1 font-heading">Kolom Pertanyaan</div>
          {leftItems.map((item, index) => {
            const isSelected = selectedLeft === item;
            const matchedRightIdx = matches[item];
            const hasMatch = matchedRightIdx !== undefined;
            const pairIndex = hasMatch ? Object.keys(matches).indexOf(item) % pairColors.length : -1;
            const hasFeedback = !!feedback;

            let cardStyle = "border-slate-800 bg-[#131A26] text-slate-300 hover:border-slate-700 hover:text-white";
            let badgeComponent = null;

            if (hasMatch) {
              const colors = pairColors[pairIndex];
              cardStyle = `border-2 ${colors.border}`;
              badgeComponent = (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${colors.badge}`}>
                  {pairIndex + 1}
                </span>
              );
            } else if (isSelected) {
              cardStyle = "border-2 border-neon-blue bg-neon-blue/10 text-neon-blue shadow-[0_0_15px_rgba(0,240,255,0.15)]";
            }

            if (hasFeedback) {
              cardStyle = "border-slate-900 bg-slate-900/40 text-slate-600 opacity-60 cursor-not-allowed";
              badgeComponent = null;
            }

            return (
              <motion.button
                whileHover={!disabled && !hasFeedback ? { scale: 1.01 } : {}}
                whileTap={!disabled && !hasFeedback ? { scale: 0.99 } : {}}
                key={`left-${index}-${item}`}
                type="button"
                disabled={disabled || hasFeedback}
                onClick={() => handleLeftClick(item)}
                className={`w-full text-left p-4 rounded-xl border font-medium flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer ${cardStyle}`}
              >
                <span className="font-semibold break-words">{item}</span>
                {badgeComponent}
              </motion.button>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <div className="text-center text-xs font-bold uppercase tracking-wider text-purple-400 mb-1 font-heading">Kolom Jawaban</div>
          {rightItems.map((item, index) => {
            const isSelected = selectedRightIdx === index;
            const matchedLeft = Object.keys(matches).find((key) => matches[key] === index);
            const pairIndex = matchedLeft ? Object.keys(matches).indexOf(matchedLeft) % pairColors.length : -1;
            const hasFeedback = !!feedback;

            let cardStyle = "border-slate-800 bg-[#131A26] text-slate-300 hover:border-slate-700 hover:text-white";
            let badgeComponent = null;

            if (matchedLeft) {
              const colors = pairColors[pairIndex];
              cardStyle = `border-2 ${colors.border}`;
              badgeComponent = (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${colors.badge}`}>
                  {pairIndex + 1}
                </span>
              );
            } else if (isSelected) {
              cardStyle = "border-2 border-purple-500 bg-purple-500/10 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]";
            }

            if (hasFeedback) {
              cardStyle = "border-slate-900 bg-slate-900/40 text-slate-600 opacity-60 cursor-not-allowed";
              badgeComponent = null;
            }

            return (
              <motion.button
                whileHover={!disabled && !hasFeedback ? { scale: 1.01 } : {}}
                whileTap={!disabled && !hasFeedback ? { scale: 0.99 } : {}}
                key={`right-${index}-${item}`}
                type="button"
                disabled={disabled || hasFeedback}
                onClick={() => handleRightClick(index)}
                className={`w-full text-left p-4 rounded-xl border font-medium flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer ${cardStyle}`}
              >
                <span className="font-semibold break-words">{item}</span>
                {badgeComponent}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
