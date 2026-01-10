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
      className="w-full max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Question {index + 1} of {total}
        </span>
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
          question.difficulty === "EASY" && "bg-green-500/10 text-green-500",
          question.difficulty === "MEDIUM" && "bg-yellow-500/10 text-yellow-500",
          question.difficulty === "HARD" && "bg-red-500/10 text-red-500"
        )}>
          {question.difficulty}
        </span>
      </div>

      {/* Question Text */}
      <div className="glass-card p-8 rounded-2xl mb-8">
        <h2 className="text-2xl md:text-3xl font-mona font-bold leading-tight mb-6">
          {question.text}
        </h2>

        {question.codeSnippet && (
          <div className="mb-6 rounded-xl overflow-hidden border border-white/5 bg-[#1e1e1e] relative group">
            <div className="absolute top-3 right-3 p-1.5 rounded-md bg-white/10 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <Code2 className="w-4 h-4" />
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono text-gray-300">
              <code>{question.codeSnippet}</code>
            </pre>
          </div>
        )}

        {/* Options */}
        <div className="grid gap-3">
          {question.options?.map((option, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleOptionClick(option)}
              className={cn(
                "w-full p-4 md:p-5 text-left rounded-xl border transition-all duration-200 flex items-center justify-between group",
                isSelected(option)
                  ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                  : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors",
                  isSelected(option)
                    ? "bg-primary text-white border-primary"
                    : "bg-white/5 text-muted-foreground border-white/10 group-hover:border-white/20"
                )}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className={cn(
                  "font-medium text-lg",
                  isSelected(option) ? "text-white" : "text-gray-300"
                )}>
                  {option}
                </span>
              </div>
              
              {isSelected(option) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
