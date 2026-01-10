import { useEffect, useState, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import {
  useSubmitAnswer,
  useFinishQuiz,
  useSaveProgress,
  useRestoreProgress,
  useQuizStatus,
} from "@/hooks/use-quiz";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import { QuestionCard } from "@/components/QuestionCard";
import { AntiCheatGuard } from "@/components/AntiCheatGuard";
import { Loader2, Timer, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { StartQuizResponse } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";

export default function Quiz() {
  const [, params] = useRoute("/quiz/:id?");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { data: quizStatus } = useQuizStatus();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRestoring, setIsRestoring] = useState(false);
  const [hasRestored, setHasRestored] = useState(false);

  const submitAnswer = useSubmitAnswer();
  const finishQuiz = useFinishQuiz();
  const saveProgress = useSaveProgress();
  const restoreProgress = useRestoreProgress();

  const activeQuiz = queryClient.getQueryData<StartQuizResponse>(["active-quiz"]);

  /* ---------------- RESTORE LOGIC ---------------- */

  useEffect(() => {
    if (!isAuthenticated || hasRestored) return;

    if (quizStatus?.activeAttempt && !activeQuiz) {
      setIsRestoring(true);
      restoreProgress.mutate(undefined, {
        onSuccess: (data) => {
          const cached = queryClient.getQueryData<StartQuizResponse>(["active-quiz"]);
          if (cached) {
            setCurrentQuestionIndex(data.currentQuestionIndex || 0);
            setAnswers(data.answers || {});
          }
          setHasRestored(true);
          setIsRestoring(false);
        },
        onError: () => {
          setIsRestoring(false);
          setHasRestored(true);
          setLocation("/");
        },
      });
    } else if (activeQuiz) {
      setHasRestored(true);
    } else if (!quizStatus?.activeAttempt) {
      setHasRestored(true);
      setLocation("/");
    }
  }, [quizStatus, activeQuiz, hasRestored, isAuthenticated]);

  /* ---------------- AUTOSAVE ---------------- */

  useEffect(() => {
    if (!activeQuiz) return;

    const interval = setInterval(() => {
      if (Object.keys(answers).length > 0) {
        saveProgress.mutate({
          questionIndex: currentQuestionIndex,
          answers,
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [answers, currentQuestionIndex, activeQuiz]);

  /* ---------------- TIMER ---------------- */

  useEffect(() => {
    if (!activeQuiz) return;

    const startTime = new Date(activeQuiz.startTime).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setTimeElapsed(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuiz]);

  /* ---------------- CLEANUP SAVE ---------------- */

  const saveOnExit = useCallback(() => {
    if (activeQuiz && Object.keys(answers).length > 0) {
      saveProgress.mutate({
        questionIndex: currentQuestionIndex,
        answers,
      });
    }
  }, [activeQuiz, answers, currentQuestionIndex]);

  useEffect(() => {
    return () => saveOnExit();
  }, [saveOnExit]);

  /* ---------------- ACTIONS ---------------- */

  const handleAnswer = (answer: any) => {
    if (!activeQuiz) return;
    const q = activeQuiz.questions[currentQuestionIndex];

    setAnswers((prev) => ({ ...prev, [q.id]: answer }));

    submitAnswer.mutate({
      questionId: q.id,
      answer,
    });
  };

  const handleNext = () => {
    if (!activeQuiz) return;

    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex((p) => p + 1);
    } else {
      finishQuiz.mutate(undefined, {
        onSuccess: () => setLocation("/"),
      });
    }
  };

  if (!isAuthenticated || (!hasRestored && !isRestoring)) return null;

  if (isRestoring) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!activeQuiz) return null;

  const currentQuestion = activeQuiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100;

  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;

  return (
    <AntiCheatGuard isActive={true}>
      <Layout>
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40">
          <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-3 font-mono text-lg font-bold">
            <Timer className="w-5 h-5" />
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
        </div>

        <div className="pt-24 pb-32">
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={answers[currentQuestion.id] || []}
            onAnswer={handleAnswer}
            index={currentQuestionIndex}
            total={activeQuiz.questions.length}
          />
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/90 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto flex justify-between">
            <button
              onClick={() => setCurrentQuestionIndex((p) => Math.max(0, p - 1))}
              disabled={currentQuestionIndex === 0}
              className="opacity-70 hover:opacity-100"
            >
              Previous
            </button>

            <button
              onClick={handleNext}
              className="bg-white text-black px-8 py-3 rounded-xl font-bold"
            >
              {currentQuestionIndex === activeQuiz.questions.length - 1
                ? "Finish"
                : "Next"}
              <ChevronRight className="inline ml-2 w-4 h-4" />
            </button>
          </div>
        </div>
      </Layout>
    </AntiCheatGuard>
  );
}
