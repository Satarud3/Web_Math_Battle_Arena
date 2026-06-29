import React from "react";
import { motion } from "framer-motion";
import MultipleChoice from "./MultipleChoice";
import FillBlank from "./FillBlank";
import TrueFalse from "./TrueFalse";
import SelectMultiple from "./SelectMultiple";
import DragOrder from "./DragOrder";
import MatchPair from "./stubs/MatchPair";
import ArrangeFormula from "./ArrangeFormula";
import Puzzle from "./Puzzle";
import {
  BuildEquation,
  NumberLine,
  CoordinatePlane,
  GeometryBuilder,
  FunctionGraph,
  SwipeAnswer,
} from "./stubs";

export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "FILL_BLANK"
  | "TRUE_FALSE"
  | "SELECT_MULTIPLE"
  | "MATCH_PAIR"
  | "DRAG_ORDER"
  | "ARRANGE_FORMULA"
  | "BUILD_EQUATION"
  | "NUMBER_LINE"
  | "COORDINATE_PLANE"
  | "GEOMETRY_BUILDER"
  | "FUNCTION_GRAPH"
  | "SWIPE_ANSWER"
  | "PUZZLE";

interface Question {
  id: string;
  questionText: string;
  type: QuestionType;
  questionData?: any; // JSON containing question parameters
  options?: any; // Fallback options for legacy MC questions
  difficulty?: string;
  baseScore?: number;
}

interface QuestionRendererProps {
  question: Question;
  selectedAnswer: string;
  onSelectAnswer: (val: string) => void;
  disabled: boolean;
  feedback: {
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string;
  } | null;
}

const REGISTRY: Record<QuestionType, React.ComponentType<any>> = {
  MULTIPLE_CHOICE: MultipleChoice,
  FILL_BLANK: FillBlank,
  TRUE_FALSE: TrueFalse,
  SELECT_MULTIPLE: SelectMultiple,
  DRAG_ORDER: DragOrder,
  MATCH_PAIR: MatchPair,
  ARRANGE_FORMULA: ArrangeFormula,
  BUILD_EQUATION: BuildEquation,
  NUMBER_LINE: NumberLine,
  COORDINATE_PLANE: CoordinatePlane,
  GEOMETRY_BUILDER: GeometryBuilder,
  FUNCTION_GRAPH: FunctionGraph,
  SWIPE_ANSWER: SwipeAnswer,
  PUZZLE: Puzzle,
};

export default function QuestionRenderer({
  question,
  selectedAnswer,
  onSelectAnswer,
  disabled,
  feedback,
}: QuestionRendererProps) {
  const Component = REGISTRY[question.type] || MultipleChoice;

  // Fallback options for legacy MC questions
  const options = question.questionData || question.options || {};

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-full"
    >
      <Component
        options={options}
        question={question}
        questionData={question.questionData}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={onSelectAnswer}
        disabled={disabled}
        feedback={feedback}
      />
    </motion.div>
  );
}
