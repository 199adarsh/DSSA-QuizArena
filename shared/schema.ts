import { z } from "zod";
import { pgTable, text, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";

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

/* ---------------- DRIZZLE SCHEMA ---------------- */

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  totalAttempts: integer("total_attempts").default(0),
  bestScore: integer("best_score").default(0),
  totalScore: integer("total_score").default(0),
  lastAttemptAt: timestamp("last_attempt_at"),
  canRetakeAt: timestamp("can_retake_at"),
});

export const attempts = pgTable("attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").defaultNow(),
  answers: jsonb("answers").$type<Record<string, any>>(),
  currentQuestionIndex: integer("current_question_index").default(0),
  status: text("status").$type<"IN_PROGRESS" | "COMPLETED" | "TIMEOUT">().default("IN_PROGRESS"),
  completedAt: timestamp("completed_at"),
  score: integer("score").default(0),
  accuracy: integer("accuracy").default(0),
  timeTakenSeconds: integer("time_taken_seconds").default(0),
});

export const reattemptLogs = pgTable("reattempt_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  timestamp: timestamp("timestamp").defaultNow(),
  reason: text("reason"),
  granted: boolean("granted").default(false),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

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
