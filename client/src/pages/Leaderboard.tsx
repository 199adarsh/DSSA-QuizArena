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
          <h1 className="text-4xl md:text-5xl font-mona font-bold mb-4">Global Leaderboard</h1>
          <p className="text-muted-foreground">Top performers ranked by score and speed</p>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
          {leaderboard?.slice(0, 3).map((entry) => (
            <div 
              key={entry.username}
              className={cn(
                "glass-card p-6 rounded-2xl flex flex-col items-center relative border-t-4",
                entry.rank === 1 ? "order-1 md:order-2 h-72 border-yellow-500 bg-yellow-500/5 shadow-[0_0_50px_-12px_rgba(234,179,8,0.3)]" :
                entry.rank === 2 ? "order-2 md:order-1 h-64 border-gray-400 bg-gray-400/5" :
                "order-3 h-60 border-orange-700 bg-orange-700/5"
              )}
            >
              {entry.rank === 1 && (
                <Medal className="w-10 h-10 text-yellow-500 absolute -top-5 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
              )}
              
              <div className="w-16 h-16 rounded-full bg-white/10 mb-4 mt-6 overflow-hidden ring-4 ring-white/5">
                {entry.profileImageUrl ? (
                  <img src={entry.profileImageUrl} alt={entry.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-2xl">
                    {entry.username[0]}
                  </div>
                )}
              </div>
              
              <div className="font-bold text-lg mb-1">{entry.username}</div>
              <div className="text-3xl font-mona font-bold text-primary mb-2">{entry.bestScore} pts</div>
              <div className="text-xs text-muted-foreground mb-4">
                Total: {entry.totalScore} pts • {entry.attempts} attempts
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto w-full justify-center border-t border-white/5 pt-4">
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

        {/* List View */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 p-4">
            {leaderboard?.map((entry) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={entry.username}
                className={cn(
                  "p-4 rounded-xl border transition-all",
                  user?.email === entry.username && "border-primary/30 bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                      entry.rank === 1 ? "bg-yellow-500 text-white" :
                      entry.rank === 2 ? "bg-gray-400 text-white" :
                      entry.rank === 3 ? "bg-orange-600 text-white" :
                      "bg-white/10 text-white"
                    )}>
                      #{entry.rank}
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.profileImageUrl ? (
                        <img src={entry.profileImageUrl} alt={entry.username} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                          {entry.username[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white">{entry.username}</p>
                        {user?.email === entry.username && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-2">YOU</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{entry.bestScore}</p>
                    <p className="text-xs text-muted-foreground">Total: {entry.totalScore}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span>{entry.accuracy}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{entry.timeTaken}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-muted-foreground" />
                    <span>{entry.attempts}</span>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {entry.lastAttemptAt && format(new Date(entry.lastAttemptAt), "MMM d")}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4 pl-6 font-medium">Rank</th>
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium text-right">Best Score</th>
                  <th className="p-4 font-medium text-right hidden lg:table-cell">Total</th>
                  <th className="p-4 font-medium text-right hidden lg:table-cell">Attempts</th>
                  <th className="p-4 font-medium text-right hidden lg:table-cell">Accuracy</th>
                  <th className="p-4 font-medium text-right hidden lg:table-cell">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaderboard?.slice(3).map((entry) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    key={entry.username}
                    className={cn(
                      "hover:bg-white/5 transition-colors",
                      user?.email === entry.username && "bg-primary/10 hover:bg-primary/20"
                    )}
                  >
                    <td className="p-4 pl-6 font-mono text-muted-foreground">#{entry.rank}</td>
                    <td className="p-4 font-medium flex items-center gap-3">
                      {entry.profileImageUrl ? (
                        <img src={entry.profileImageUrl} alt={entry.username} className="w-8 h-8 rounded-full" />
                      ) : (
                        entry.username[0]
                      )}
                      {entry.username}
                      {user?.email === entry.username && (
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-2">YOU</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-bold text-primary">{entry.bestScore || entry.score}</td>
                    <td className="p-4 text-right text-muted-foreground hidden lg:table-cell">{entry.totalScore || 0}</td>
                    <td className="p-4 text-right text-muted-foreground hidden lg:table-cell">{entry.attempts || 1}</td>
                    <td className="p-4 text-right text-muted-foreground hidden lg:table-cell">{entry.accuracy}%</td>
                    <td className="p-4 text-right text-muted-foreground font-mono hidden lg:table-cell">{entry.timeTaken}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {leaderboard?.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No attempts yet. Be the first to take the quiz!
          </div>
        )}
      </div>
    </Layout>
  );
}
