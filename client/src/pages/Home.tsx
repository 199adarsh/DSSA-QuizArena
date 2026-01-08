import { useAuth } from "@/hooks/use-auth";
import { useQuizStatus, useStartQuiz } from "@/hooks/use-quiz";
import { Loader2, Play, Trophy, RotateCcw, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Layout } from "@/components/Layout";

export default function Home() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: status, isLoading: statusLoading } = useQuizStatus();
  const startQuiz = useStartQuiz();
  const [, setLocation] = useLocation();

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
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <h1 className="text-6xl md:text-8xl font-display font-bold mb-6 tracking-tight">
              Test Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-accent text-glow">
                Knowledge
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 font-light">
              Compete in real-time engineering challenges. Climb the leaderboard. Prove your skills.
            </p>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/api/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all"
            >
              Start Challenge <ArrowRight className="w-5 h-5" />
            </motion.a>
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
          <h1 className="text-4xl font-display font-bold mb-2">Welcome back, {user?.firstName}</h1>
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
                <button
                  onClick={() => setLocation(`/quiz/${status.activeAttempt!.id}`)}
                  className="w-full py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" /> Resume Quiz
                </button>
              </div>
            ) : status?.completedAttempt ? (
              <div className="relative z-10">
                <div className="mb-6 space-y-2">
                  <p className="text-muted-foreground">Last Attempt Score</p>
                  <div className="text-5xl font-display font-bold text-primary">
                    {status.completedAttempt.score} pts
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Completed {format(new Date(status.completedAttempt.completedAt!), "MMM d, h:mm a")}
                  </p>
                </div>
                <button
                  disabled
                  className="w-full py-4 rounded-xl bg-white/5 text-muted-foreground font-medium border border-white/5 cursor-not-allowed"
                >
                  Completed for today
                </button>
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
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-black/20 border border-white/5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    i === 1 ? "bg-yellow-500/20 text-yellow-500" :
                    i === 2 ? "bg-gray-400/20 text-gray-400" :
                    "bg-orange-700/20 text-orange-600"
                  }`}>
                    #{i}
                  </div>
                  <div className="h-2 w-24 bg-white/10 rounded-full" />
                  <div className="ml-auto h-4 w-12 bg-white/10 rounded" />
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6 group-hover:text-primary transition-colors">
              View full leaderboard &rarr;
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
