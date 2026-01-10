import { useAuth } from "@/hooks/use-auth";
import { useLeaderboard } from "@/hooks/use-quiz";
import { Trophy, Target, Clock, Medal, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useLeaderboard();
  const { user } = useAuth();
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (username: string) => {
    setImageErrors(prev => new Set(prev).add(username));
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  const topThree = leaderboard?.slice(0, 3) || [];
  const rest = leaderboard?.slice(3) || [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
            Global Leaderboard
          </h1>
          <p className="text-sm md:text-base text-muted-foreground px-2">
            Top performers ranked by score and speed
          </p>
        </div>

        {/* 🥇 Top 3 Podium */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-6 mb-6 md:mb-12 items-end">
          {topThree.map((entry) => (
            <div
              key={entry.username}
              className={cn(
                "glass-card p-2 sm:p-3 md:p-6 rounded-xl md:rounded-2xl flex flex-col items-center relative border-t-4",
                entry.rank === 1
                  ? "order-1 sm:order-1 md:order-2 h-32 sm:h-40 md:h-72 border-yellow-500 bg-yellow-500/5"
                  : entry.rank === 2
                  ? "order-2 sm:order-2 md:order-1 h-28 sm:h-36 md:h-64 border-gray-400 bg-gray-400/5"
                  : "order-3 h-24 sm:h-32 md:h-60 border-orange-700 bg-orange-700/5"
              )}
            >
              {entry.rank === 1 && (
                <Medal className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-yellow-500 absolute -top-3 sm:-top-4 md:-top-5" />
              )}

              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-16 md:h-16 rounded-full bg-white/10 mb-1 sm:mb-2 md:mb-4 mt-2 sm:mt-3 md:mt-6 overflow-hidden">
                {entry.profileImageUrl && !imageErrors.has(entry.username) ? (
                  <img
                    src={entry.profileImageUrl}
                    alt={entry.username}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(entry.username)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-sm sm:text-lg md:text-2xl">
                    {entry.username[0]}
                  </div>
                )}
              </div>

              <div className="font-bold text-xs sm:text-sm md:text-lg mb-1">
                {entry.username}
                {user?.firstName === entry.username && (
                  <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    YOU
                  </span>
                )}
              </div>
              <div className="text-lg sm:text-xl md:text-3xl font-bold text-primary mb-1 sm:mb-2">
                {entry.bestScore} pts
              </div>
           

              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-xs text-muted-foreground mt-auto">
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" /> {entry.accuracy}%
                </span>
                <span className="hidden sm:flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {entry.timeTaken}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 📱 Mobile Cards */}
        <div className="md:hidden space-y-2 sm:space-y-3">
          {rest.map((entry) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={entry.username}
              className={cn(
                "p-3 sm:p-4 rounded-xl border bg-white/5",
                user?.firstName === entry.username &&
                  "border-primary/30 bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs sm:text-sm">
                    #{entry.rank}
                  </div>
                  <div>
                    <p className="font-medium text-sm sm:text-base">
                      {entry.username}
                      {user?.firstName === entry.username && (
                        <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          YOU
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg sm:text-2xl font-bold text-primary">
                    {entry.bestScore}
                  </p>
      
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4" /> {entry.accuracy}%
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" /> {entry.timeTaken}
                </div>
            
                <div className="text-right text-xs text-muted-foreground">
                  {entry.lastAttemptAt &&
                    format(new Date(entry.lastAttemptAt), "MMM d")}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 🖥 Desktop Table */}
        <div className="hidden md:block glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5 text-xs uppercase">
              <tr>
                <th className="p-4">Rank</th>
                <th className="p-4">User</th>
                <th className="p-4 text-right">Best</th>
              

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
                  <td className="p-4">
                    {entry.username}
                    {user?.firstName === entry.username && (
                      <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        YOU
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right text-primary font-bold">
                    {entry.bestScore}
                  </td>
                  <td className="p-4 text-right">{entry.accuracy}%</td>
                  <td className="p-4 text-right">{entry.timeTaken}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
