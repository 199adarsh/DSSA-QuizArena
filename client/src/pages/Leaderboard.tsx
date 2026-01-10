import { useLeaderboard } from "@/hooks/use-quiz";
import { Layout } from "@/components/Layout";
import { Loader2, Medal, Clock, Target } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

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
              <div className="text-3xl font-mona font-bold text-primary mb-2">{entry.score} pts</div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto w-full justify-center border-t border-white/5 pt-4">
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" /> {entry.accuracy}%
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {entry.timeTaken}s
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* List View */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4 pl-6 font-medium">Rank</th>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium text-right">Score</th>
                <th className="p-4 font-medium text-right hidden md:table-cell">Accuracy</th>
                <th className="p-4 font-medium text-right hidden md:table-cell">Time</th>
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
                    user?.email === entry.username && "bg-primary/10 hover:bg-primary/20" // Assuming username fallback if needed
                  )}
                >
                  <td className="p-4 pl-6 font-mono text-muted-foreground">#{entry.rank}</td>
                  <td className="p-4 font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs overflow-hidden">
                       {entry.profileImageUrl ? (
                        <img src={entry.profileImageUrl} alt={entry.username} className="w-full h-full object-cover" />
                      ) : (
                        entry.username[0]
                      )}
                    </div>
                    {entry.username}
                    {user?.firstName === entry.username && (
                      <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-2">YOU</span>
                    )}
                  </td>
                  <td className="p-4 text-right font-bold text-primary">{entry.score}</td>
                  <td className="p-4 text-right text-muted-foreground hidden md:table-cell">{entry.accuracy}%</td>
                  <td className="p-4 text-right text-muted-foreground font-mono hidden md:table-cell">{entry.timeTaken}s</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {leaderboard?.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No attempts yet. Be the first to take the quiz!
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
