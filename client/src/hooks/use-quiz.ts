import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

export function useQuizStatus() {
  return useQuery({
    queryKey: [api.quiz.status.path],
    queryFn: async () => {
      const res = await fetch(api.quiz.status.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch quiz status");
      return api.quiz.status.responses[200].parse(await res.json());
    },
  });
}

export function useStartQuiz() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.quiz.start.path, {
        method: api.quiz.start.method,
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.quiz.start.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to start quiz");
      }
      return api.quiz.start.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      // Invalidate status so dashboard updates
      queryClient.invalidateQueries({ queryKey: [api.quiz.status.path] });
      // We might want to cache the active quiz data too
      queryClient.setQueryData(["active-quiz"], data);
    },
    onError: (error) => {
      toast({
        title: "Error starting quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSubmitAnswer() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.quiz.submitAnswer.input>) => {
      const res = await fetch(api.quiz.submitAnswer.path, {
        method: api.quiz.submitAnswer.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      return api.quiz.submitAnswer.responses[200].parse(await res.json());
    },
    onError: () => {
      toast({
        title: "Sync Error",
        description: "Failed to save your answer. Please check your connection.",
        variant: "destructive",
      });
    },
  });
}

export function useFinishQuiz() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.quiz.finish.path, {
        method: api.quiz.finish.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to finish quiz");
      return api.quiz.finish.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.quiz.status.path] });
      queryClient.removeQueries({ queryKey: ["active-quiz"] });
      toast({
        title: "Quiz Completed",
        description: "Your results have been submitted.",
      });
    },
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: [api.leaderboard.list.path],
    queryFn: async () => {
      const res = await fetch(api.leaderboard.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return api.leaderboard.list.responses[200].parse(await res.json());
    },
  });
}
