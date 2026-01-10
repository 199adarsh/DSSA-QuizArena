import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";

async function getHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export function useSaveProgress() {
  return useMutation({
    mutationFn: async ({ questionIndex, answers }: { questionIndex: number; answers: Record<string, any> }) => {
      const headers = await getHeaders();
      const res = await fetch(api.quiz.saveProgress.path, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ questionIndex, answers }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save progress");
      }

      return await res.json();
    },
    onSuccess: () => {
      console.log('Progress saved successfully');
    },
    onError: (error) => {
      console.error('Save progress error:', error);
    },
  });
}

export function useRestoreProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const headers = await getHeaders();
      const res = await fetch(api.quiz.restoreProgress.path, {
        method: "POST",
        headers,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to restore progress");
      }

      const result = await res.json();
      
      // Update the active quiz data in cache with full data
      queryClient.setQueryData(["active-quiz"], {
        attemptId: result.attemptId,
        questions: result.questions,
        startTime: result.startTime,
        currentQuestionIndex: result.currentQuestionIndex,
        answers: result.answers
      });
      
      return result;
    },
    onSuccess: (data) => {
      console.log('Progress restored successfully');
    },
    onError: (error) => {
      console.error('Restore progress error:', error);
    },
  });
}

export function useQuizStatus() {
  return useQuery({
    queryKey: [api.quiz.status.path],
    queryFn: async () => {
      console.log('Fetching quiz status...', auth.currentUser?.uid);
      const headers = await getHeaders();
      const res = await fetch(api.quiz.status.path, { headers });
      if (res.status === 401) {
        console.log('User not authenticated');
        return null;
      }
      if (!res.ok) {
        console.error('Failed to fetch quiz status:', res.status);
        throw new Error("Failed to fetch quiz status");
      }
      const data = await res.json();
      console.log('Quiz status response:', data);
      return data; // Return the full response including nextRetakeAt
    },
    enabled: !!auth.currentUser,
    staleTime: 5 * 1000, // 5 seconds for faster UI updates
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useStartQuiz() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const headers = await getHeaders();
      const res = await fetch(api.quiz.start.path, {
        method: api.quiz.start.method,
        headers,
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
      // Set active quiz data without invalidating status
      queryClient.setQueryData(["active-quiz"], data);
    },
    onError: (error) => {
      console.error('Start quiz error:', error);
      toast({
        title: "Error starting quiz",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useSubmitAnswer() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.quiz.submitAnswer.input>) => {
      const headers = await getHeaders();
      const res = await fetch(api.quiz.submitAnswer.path, {
        method: api.quiz.submitAnswer.method,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
      const headers = await getHeaders();
      const res = await fetch(api.quiz.finish.path, {
        method: api.quiz.finish.method,
        headers,
      });
      if (!res.ok) throw new Error("Failed to finish quiz");
      return api.quiz.finish.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      // Remove active quiz and set new status
      queryClient.removeQueries({ queryKey: ["active-quiz"] });
      queryClient.invalidateQueries({ queryKey: [api.quiz.status.path] });
      toast({
        title: "Quiz Completed",
        description: "Your results have been submitted.",
      });
    },
  });
}

export function useRestartQuiz() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const headers = await getHeaders();
      const res = await fetch(api.quiz.restart.path, {
        method: api.quiz.restart.method,
        headers,
      });
      if (!res.ok) throw new Error("Failed to restart quiz");
      return api.quiz.restart.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      // Only invalidate status, don't clear everything
      queryClient.invalidateQueries({ queryKey: [api.quiz.status.path] });
      toast({
        title: "Quiz Restarted",
        description: "Your previous attempt has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error restarting quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: [api.leaderboard.list.path],
    queryFn: async () => {
      const headers = await getHeaders();
      const res = await fetch(api.leaderboard.list.path, { headers });
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return api.leaderboard.list.responses[200].parse(await res.json());
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export { getHeaders };
