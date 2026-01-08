import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

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

// DB Tables
export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // References users.id (but users.id is varchar in auth schema, ensuring match)
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  score: integer("score").default(0),
  accuracy: integer("accuracy").default(0), // multiplied by 100 for integer precision? or just percentage 0-100
  timeTakenSeconds: integer("time_taken_seconds").default(0),
  answers: jsonb("answers").$type<Record<string, any>>().default({}), // questionId -> answer
  status: text("status").$type<"IN_PROGRESS" | "COMPLETED" | "TIMEOUT">().default("IN_PROGRESS").notNull(),
});

// Schemas
export const insertAttemptSchema = createInsertSchema(attempts).omit({ 
  id: true, 
  startedAt: true, 
  completedAt: true, 
  status: true 
});

// Types
export type Attempt = typeof attempts.$inferSelect;
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;

// API Types
export interface QuizStatusResponse {
  canAttempt: boolean;
  activeAttempt?: Attempt;
  completedAttempt?: Attempt;
}

export interface StartQuizResponse {
  attemptId: number;
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
