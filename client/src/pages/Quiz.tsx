import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useStartQuiz, useSubmitAnswer, useFinishQuiz } from "@/hooks/use-quiz";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import { QuestionCard } from "@/components/QuestionCard";
import { AntiCheatGuard } from "@/components/AntiCheatGuard";
import { Loader2, Timer, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { StartQuizResponse } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";

export default function Quiz() {
  const [, params] = useRoute("/quiz/:id");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const activeQuiz = queryClient.getQueryData<StartQuizResponse>(["active-quiz"]);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const submitAnswer = useSubmitAnswer();
  const finishQuiz = useFinishQuiz();

  // If no active quiz data, redirect (simple handling, ideally fetch active attempt)
  useEffect(() => {
    if (!activeQuiz) {
      setLocation("/");
    }
  }, [activeQuiz, setLocation]);

  // Timer Logic
  useEffect(() => {
    if (!activeQuiz) return;
    
    // Calculate elapsed time from start
    const startTime = new Date(activeQuiz.startTime).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setTimeLeft(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuiz]);

  const handleAnswer = (answer: string | string[]) => {
    if (!activeQuiz) return;
    const question = activeQuiz.questions[currentQuestionIndex];
    
    // Optimistic update local state
    setAnswers(prev => ({ ...prev, [question.id]: answer }));

    // Sync to server
    submitAnswer.mutate({
      questionId: question.id,
      answer: answer,
    });
  };

  const handleNext = () => {
    if (!activeQuiz) return;
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishQuiz.mutate(undefined, {
        onSuccess: () => setLocation("/")
      });
    }
  };

  if (!isAuthenticated || !activeQuiz) return null;

  const currentQuestion = activeQuiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100;
  
  // Format timer
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <AntiCheatGuard isActive={true}>
      <Layout>
        {/* Top Bar */}
        <div className="fixed top-20 left-0 right-0 z-40 container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Progress Bar */}
            <div className="w-full max-w-md h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            {/* Timer */}
            <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 font-mono text-lg font-bold text-primary shadow-lg shadow-primary/10">
              <Timer className="w-4 h-4" />
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </div>
        </div>

        <div className="pt-16 pb-32">
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={answers[currentQuestion.id] || []}
            onAnswer={handleAnswer}
            index={currentQuestionIndex}
            total={activeQuiz.questions.length}
          />
        </div>

        {/* Footer Navigation */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-xl border-t border-white/5 z-40">
          <div className="container max-w-3xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="text-muted-foreground hover:text-white disabled:opacity-50 transition-colors font-medium px-4 py-2"
            >
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={finishQuiz.isPending}
              className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center gap-2 shadow-lg shadow-white/10 hover:shadow-white/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              {finishQuiz.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : currentQuestionIndex === activeQuiz.questions.length - 1 ? (
                "Finish Quiz"
              ) : (
                <>
                  Next Question <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </Layout>
    </AntiCheatGuard>
  );
}
