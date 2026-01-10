import { useAuth } from "@/hooks/use-auth";
import { useQuizStatus, useStartQuiz, useLeaderboard, useRestartQuiz } from "@/hooks/use-quiz";
import { Loader2, Play, Trophy, RotateCcw, ArrowRight, Lock, Key } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Layout } from "@/components/Layout";
import { PasswordDialog } from '@/components/PasswordDialog';
import { ReattemptDialog } from '@/components/ReattemptDialog';
import { useState } from 'react';
import { useQueryClient } from "@tanstack/react-query";

export default function Home() {
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const { data: status, isLoading: statusLoading } = useQuizStatus();
  const { data: leaderboardData, isLoading: leaderboardLoading } = useLeaderboard();
  const startQuiz = useStartQuiz();
  const restartQuiz = useRestartQuiz();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isReattemptDialogOpen, setIsReattemptDialogOpen] = useState(false);

  if (authLoading || (isAuthenticated && statusLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Not authenticated landing page
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex min-h-[80vh] items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-4xl text-center"
          >
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-neutral-400">
              AI-powered learning platform
            </p>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
            <span className="block md:inline">DSSA</span>{" "}
            <span className="block md:inline">Quiz Arena</span>
          </h1>


            <p className="mt-6 text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto">
              A next-generation competitive environment for future data scientists.
            </p>

            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => login()}
              className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-white backdrop-blur-md hover:bg-white/5 transition-all"
            >
              Start Challenge
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>

      </Layout>
    );
  }

  // Authenticated Dashboard
  return (
    <Layout>
        <div className="max-w-5xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-mona font-bold mb-2">Welcome back, {user?.firstName}</h1>
            <p className="text-muted-foreground text-lg">Ready for today's challenge?</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Action Card */}
            <div className="glass-card p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <h2 className="text-2xl font-bold mb-4 relative z-10">Daily Quiz Challenge</h2>
              
              {status?.activeAttempt ? (
                <div className="relative z-10">
                  <p className="text-yellow-400 mb-6 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                    In Progress
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setLocation(`/quiz/${status.activeAttempt!.id}`)}
                      className="w-full py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="w-5 h-5" /> Resume Quiz
                    </button>
                    <button
                      onClick={() => setIsPasswordDialogOpen(true)}
                      className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-5 h-5" /> Restart
                    </button>
                  </div>
                </div>
              ) : status?.completedAttempt ? (
                <div className="relative z-10">
                  <div className="mb-6 space-y-2">
                    <p className="text-muted-foreground">Last Attempt Score</p>
                    <div className="text-5xl font-mona font-bold text-primary">
                      {status.completedAttempt.score} pts
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Completed {format(new Date(status.completedAttempt.completedAt!), "MMM d, h:mm a")}
                    </p>
                    {status.nextRetakeAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Can retake in {format(new Date(status.nextRetakeAt), "MMM d 'at' h:mm a")}
                      </p>
                    )}
                  </div>
                  {status.canAttempt ? (
                    <button
                      onClick={() => startQuiz.mutate()}
                      disabled={startQuiz.isPending}
                      className="w-full py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
                    >
                      {startQuiz.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Play className="w-5 h-5" /> Start New Quiz
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <button
                        disabled
                        className="w-full py-4 rounded-xl bg-white/5 text-muted-foreground font-medium border border-white/5 cursor-not-allowed"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Lock className="w-4 h-4" />
                          Quiz Locked - Retake Available Tomorrow
                        </div>
                      </button>
                      <button
                        onClick={() => setIsReattemptDialogOpen(true)}
                        className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all flex items-center justify-center gap-2"
                      >
                        <Key className="w-4 h-4" />
                        Request Reattempt
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative z-10">
                  <p className="text-muted-foreground mb-6">
                    10 questions • 15 minutes • Engineering & System Design
                  </p>
                  <button
                    onClick={() => startQuiz.mutate(undefined, {
                      onSuccess: (data) => setLocation(`/quiz/${data.attemptId}`)
                    })}
                    disabled={startQuiz.isPending}
                    className="w-full py-4 rounded-xl bg-white text-black font-bold hover:bg-gray-100 transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {startQuiz.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Play className="w-5 h-5 fill-current" />
                    )}
                    Start New Quiz
                  </button>
                </div>
              )}
            </div>

            {/* Leaderboard Teaser */}
            <div 
              onClick={() => setLocation("/leaderboard")}
              className="glass-panel p-8 rounded-3xl cursor-pointer hover:bg-white/5 transition-colors border-gradient group"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Top Performers</h2>
                <Trophy className="w-6 h-6 text-yellow-500 group-hover:scale-110 transition-transform" />
              </div>
              
              <div className="space-y-4">
                {leaderboardLoading ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-black/20 border border-white/5">
                      <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
                      <div className="h-2 w-24 bg-white/10 rounded-full animate-pulse" />
                      <div className="ml-auto h-4 w-12 bg-white/10 rounded animate-pulse" />
                    </div>
                  ))
                ) : (
                  leaderboardData?.slice(0, 3).map((entry, i) => (
                    <div key={entry.username} className="flex items-center gap-4 p-3 rounded-xl bg-black/20 border border-white/5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        i === 0 ? "bg-yellow-500/20 text-yellow-500" :
                        i === 1 ? "bg-gray-400/20 text-gray-400" :
                        "bg-orange-700/20 text-orange-600"
                      }`}>
                        #{i + 1}
                      </div>
                      <span className="font-medium text-white">{entry.username}</span>
                      <span className="ml-auto font-bold text-lg text-primary">{entry.score} pts</span>
                    </div>
                  ))
                )}
              </div>
              <p className="text-center text-sm text-muted-foreground mt-6 group-hover:text-primary transition-colors">
                View full leaderboard &rarr;
              </p>
            </div>
          </div>
        </div>
      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        onConfirm={() => {
          setIsPasswordDialogOpen(false);
          restartQuiz.mutate(undefined, {
            onSuccess: () => {
              startQuiz.mutate(undefined, {
                onSuccess: (data) => setLocation(`/quiz/${data.attemptId}`),
              });
            },
          });
        }}
      />
      <ReattemptDialog 
        open={isReattemptDialogOpen}
        onOpenChange={setIsReattemptDialogOpen}
        onSuccess={() => {
          // Invalidate quiz status to refresh the UI
          queryClient.invalidateQueries({ queryKey: ['/api/quiz/status'] });
        }}
      />
    </Layout>
  );
}
