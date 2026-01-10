import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Question } from "@shared/schema";

interface QuestionCardProps {
  question: Omit<Question, "correctAnswer" | "explanation">;
  selectedAnswer: string | string[];
  onAnswer: (answer: string | string[]) => void;
  index: number;
  total: number;
}

export function QuestionCard({ question, selectedAnswer, onAnswer, index, total }: QuestionCardProps) {
  const isSelected = (value: string) => {
    if (Array.isArray(selectedAnswer)) {
      return selectedAnswer.includes(value);
    }
    return selectedAnswer === value;
  };

  const handleOptionClick = (value: string) => {
    if (question.type === "MCQ_MULTI") {
      const current = Array.isArray(selectedAnswer) ? selectedAnswer : [];
      if (current.includes(value)) {
        onAnswer(current.filter((v) => v !== value));
      } else {
        onAnswer([...current, value]);
      }
    } else {
      onAnswer(value);
    }
  };

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto px-4 md:px-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm md:text-base font-medium text-muted-foreground uppercase tracking-wider">
          Question {index + 1} of {total}
        </span>
        <span className={cn(
          "px-3 py-1.5 md:py-1 rounded-full text-xs md:text-sm font-bold uppercase tracking-wide",
          question.difficulty === "EASY" && "bg-green-500/10 text-green-500",
          question.difficulty === "MEDIUM" && "bg-yellow-500/10 text-yellow-500",
          question.difficulty === "HARD" && "bg-red-500/10 text-red-500"
        )}>
          {question.difficulty}
        </span>
      </div>

      {/* Question Text */}
      <div className="glass-card p-4 md:p-6 rounded-xl mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl lg:text-2xl font-mona font-bold leading-tight mb-2 md:mb-4">
          {question.text}
        </h2>

        {question.codeSnippet && (
          <div className="mb-4 md:mb-6 rounded-xl overflow-hidden border border-white/5 bg-[#1e1e1e] relative group">
            <div className="absolute top-3 right-3 p-1.5 rounded-md bg-white/10 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <Code2 className="w-4 h-4" />
            </div>
            <pre className="p-3 md:p-4 overflow-x-auto text-xs md:text-sm font-mono text-gray-300">
              <code>{question.codeSnippet}</code>
            </pre>
          </div>
        )}

        {/* Options */}
        <div className="grid gap-2 md:gap-3">
          {question.options?.map((option, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOptionClick(option)}
              className={cn(
                "w-full p-3 md:p-4 text-left rounded-lg border transition-all duration-200 flex items-center justify-between group min-h-[50px] md:min-h-[60px]",
                isSelected(option)
                  ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                  : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
              )}
            >
              <div className="flex items-center gap-2 md:gap-3">
                <div className={cn(
                  "w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-sm md:text-base font-bold border transition-colors",
                  isSelected(option)
                    ? "bg-primary text-white border-primary"
                    : "bg-white/5 text-muted-foreground border-white/10 group-hover:border-white/20"
                )}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className={cn(
                  "text-sm md:text-base font-medium",
                  isSelected(option) ? "text-white" : "text-gray-300"
                )}>
                  {option}
                </span>
              </div>
              
              {isSelected(option) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary flex items-center justify-center text-white"
                >
                  <Check className="w-3 h-3 md:w-3.5 md:h-3.5 stroke-[2]" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
