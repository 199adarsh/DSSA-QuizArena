import { useAuth } from "@/hooks/use-auth";
import { useLeaderboard } from "@/hooks/use-quiz";
import { Trophy, Target, Clock, Medal, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useLeaderboard();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-mona font-bold mb-4">
            Global Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Top performers ranked by score and speed
          </p>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
          {leaderboard?.slice(0, 3).map((entry) => (
            <div
              key={entry.username}
              className={cn(
                "glass-card p-6 rounded-2xl flex flex-col items-center relative border-t-4",
                entry.rank === 1
                  ? "order-1 md:order-2 h-72 border-yellow-500 bg-yellow-500/5"
                  : entry.rank === 2
                  ? "order-2 md:order-1 h-64 border-gray-400 bg-gray-400/5"
                  : "order-3 h-60 border-orange-700 bg-orange-700/5"
              )}
            >
              {entry.rank === 1 && (
                <Medal className="w-10 h-10 text-yellow-500 absolute -top-5" />
              )}

              <div className="w-16 h-16 rounded-full bg-white/10 mb-4 mt-6 overflow-hidden">
                {entry.profileImageUrl ? (
                  <img
                    src={entry.profileImageUrl}
                    alt={entry.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-2xl">
                    {entry.username[0]}
                  </div>
                )}
              </div>

              <div className="font-bold text-lg mb-1">{entry.username}</div>
              <div className="text-3xl font-bold text-primary mb-2">
                {entry.bestScore} pts
              </div>
              <div className="text-xs text-muted-foreground mb-4">
                Total: {entry.totalScore} pts • {entry.attempts} attempts
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto">
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" /> {entry.accuracy}%
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {entry.timeTaken}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Cards */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="md:hidden space-y-3 p-4">
            {leaderboard?.map((entry) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={entry.username}
                className={cn(
                  "p-4 rounded-xl border",
                  user?.firstName === entry.username &&
                    "border-primary/30 bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">
                      #{entry.rank}
                    </div>
                    <div>
                      <p className="font-medium">{entry.username}</p>
                      {user?.firstName === entry.username && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {entry.bestScore}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total: {entry.totalScore}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" /> {entry.accuracy}%
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {entry.timeTaken}
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" /> {entry.attempts}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {entry.lastAttemptAt &&
                      format(new Date(entry.lastAttemptAt), "MMM d")}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead className="bg-white/5 text-xs uppercase">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">User</th>
                  <th className="p-4 text-right">Best</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-right">Attempts</th>
                  <th className="p-4 text-right">Accuracy</th>
                  <th className="p-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard?.map((entry) => (
                  <tr
                    key={entry.username}
                    className={cn(
                      "border-b border-white/5",
                      user?.firstName === entry.username && "bg-primary/10"
                    )}
                  >
                    <td className="p-4">#{entry.rank}</td>
                    <td className="p-4">{entry.username}</td>
                    <td className="p-4 text-right text-primary font-bold">
                      {entry.bestScore}
                    </td>
                    <td className="p-4 text-right">{entry.totalScore}</td>
                    <td className="p-4 text-right">{entry.attempts}</td>
                    <td className="p-4 text-right">{entry.accuracy}%</td>
                    <td className="p-4 text-right">{entry.timeTaken}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {(!leaderboard || leaderboard.length === 0) && (
          <div className="p-8 text-center text-muted-foreground">
            No attempts yet. Be the first to take the quiz!
          </div>
        )}
      </div>
    </Layout>
  );
}
