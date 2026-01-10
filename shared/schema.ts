import { z } from "zod";

export * from "./models/auth";

// Quiz Configuration Types
export type QuestionType = "MCQ_SINGLE" | "MCQ_MULTI" | "TRUE_FALSE" | "CODE";

export interface User {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  totalAttempts?: number;
  bestScore?: number;
  totalScore?: number;
  lastAttemptAt?: string;
  canRetakeAt?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer: string | string[];
  difficulty: "EASY" | "MEDIUM" | "HARD";
  explanation?: string;
  codeSnippet?: string;
}

/* ---------------- ATTEMPT SCHEMA ---------------- */

export const insertAttemptSchema = z.object({
  userId: z.string(),
  answers: z.record(z.any()).optional(),
  currentQuestionIndex: z.number().optional(),   // ✅ FIX
  status: z.enum(["IN_PROGRESS", "COMPLETED", "TIMEOUT"]).optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  score: z.number().optional(),
  accuracy: z.number().optional(),
  timeTakenSeconds: z.number().optional(),
});

export interface Attempt {
  id: string;
  userId: string;
  startedAt: string;
  answers?: Record<string, any>;
  currentQuestionIndex?: number;                 // ✅ FIX
  status: "IN_PROGRESS" | "COMPLETED" | "TIMEOUT";
  completedAt?: string;
  score?: number;
  accuracy?: number;
  timeTakenSeconds?: number;
}

export type InsertAttempt = z.infer<typeof insertAttemptSchema>;

/* ---------------- API TYPES ---------------- */

export interface QuizStatusResponse {
  canAttempt: boolean;
  activeAttempt?: Attempt;
  completedAttempt?: Attempt;
  nextRetakeAt?: string;
}

export interface StartQuizResponse {
  attemptId: string;
  questions: Omit<Question, "correctAnswer" | "explanation">[];
  startTime: string;
}

export interface SubmitAnswerRequest {
  questionId: string;
  answer: string | string[];
}

export interface ReattemptLog {
  id: string;
  userId: string;
  timestamp: string;
  reason?: string;
  granted: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  bestScore: number;
  totalScore: number;
  attempts: number;
  accuracy: number;
  timeTaken: string;
  profileImageUrl?: string;
  lastAttemptAt?: string;
}
