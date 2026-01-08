import { z } from "zod";

export * from "./models/auth";

// Quiz Configuration Types (stored in JSON/Code, not DB, but types are shared)
export type QuestionType = "MCQ_SINGLE" | "MCQ_MULTI" | "TRUE_FALSE" | "CODE";

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer: string | string[]; // string for SINGLE/TF, array for MULTI
  difficulty: "EASY" | "MEDIUM" | "HARD";
  explanation?: string;
  codeSnippet?: string;
}

// Schemas
export const insertAttemptSchema = z.object({
  userId: z.string(),
  answers: z.record(z.any()).optional(),
});

// Types
export interface Attempt {
  id: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  score?: number;
  accuracy?: number;
  timeTakenSeconds?: number;
  answers?: Record<string, any>;
  status: "IN_PROGRESS" | "COMPLETED" | "TIMEOUT";
}
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;

// API Types
export interface QuizStatusResponse {
  canAttempt: boolean;
  activeAttempt?: Attempt;
  completedAttempt?: Attempt;
}

export interface StartQuizResponse {
  attemptId: string;
  questions: Omit<Question, "correctAnswer" | "explanation">[]; // Sanitize for frontend
  startTime: string;
}

export interface SubmitAnswerRequest {
  questionId: string;
  answer: string | string[];
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  accuracy: number;
  timeTaken: string; // formatted string or seconds
  profileImageUrl?: string;
}
