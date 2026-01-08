import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./replit_integrations/auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { QUESTIONS } from "./questions";
import { Attempt } from "@shared/schema";

// Helper to check auth
function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);

  // Auth User Endpoint (from shared routes definition)
  app.get(api.auth.user.path, requireAuth, async (req, res) => {
    const user = await storage.getUser((req.user as any).claims.sub);
    res.json(user);
  });

  // Quiz Status
  app.get(api.quiz.status.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const attempt = await storage.getAttempt(userId);

    const activeAttempt = attempt?.status === "IN_PROGRESS" ? attempt : undefined;
    const completedAttempt = attempt?.status === "COMPLETED" || attempt?.status === "TIMEOUT" ? attempt : undefined;
    const canAttempt = !attempt; // Single attempt only

    res.json({
      canAttempt,
      activeAttempt,
      completedAttempt
    });
  });

  // Start Quiz
  app.post(api.quiz.start.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const existingAttempt = await storage.getAttempt(userId);

    if (existingAttempt) {
      if (existingAttempt.status === "IN_PROGRESS") {
        // Resume
        return res.status(201).json({
          attemptId: existingAttempt.id,
          questions: QUESTIONS.map(({ correctAnswer, explanation, ...q }) => q),
          startTime: existingAttempt.startedAt.toISOString()
        });
      }
      return res.status(400).json({ message: "You have already attempted the quiz." });
    }

    const attempt = await storage.createAttempt(userId);
    res.status(201).json({
      attemptId: attempt.id,
      questions: QUESTIONS.map(({ correctAnswer, explanation, ...q }) => q),
      startTime: attempt.startedAt.toISOString()
    });
  });

  // Submit Answer (Incremental)
  app.post(api.quiz.submitAnswer.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const { questionId, answer } = api.quiz.submitAnswer.input.parse(req.body);
    
    const attempt = await storage.getAttempt(userId);
    if (!attempt || attempt.status !== "IN_PROGRESS") {
      return res.status(400).json({ message: "No active attempt found." });
    }

    const currentAnswers = (attempt.answers as Record<string, any>) || {};
    const updatedAnswers = { ...currentAnswers, [questionId]: answer };

    await storage.updateAttempt(attempt.id, { answers: updatedAnswers });
    res.json({ success: true });
  });

  // Finish Quiz
  app.post(api.quiz.finish.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const attempt = await storage.getAttempt(userId);

    if (!attempt || attempt.status !== "IN_PROGRESS") {
      return res.status(400).json({ message: "No active attempt to finish." });
    }

    const answers = (attempt.answers as Record<string, any>) || {};
    let score = 0;
    
    // Calculate Score
    QUESTIONS.forEach(q => {
      const userAnswer = answers[q.id];
      if (!userAnswer) return;

      if (q.type === "MCQ_MULTI") {
         // Array comparison
         if (Array.isArray(userAnswer) && Array.isArray(q.correctAnswer)) {
            const sortedUser = [...userAnswer].sort();
            const sortedCorrect = [...(q.correctAnswer as string[])].sort();
            if (JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect)) {
              score += 10;
            }
         }
      } else {
        // String comparison
        if (userAnswer === q.correctAnswer) {
          score += 10;
        }
      }
    });

    const accuracy = Math.round((score / (QUESTIONS.length * 10)) * 100);
    const endTime = new Date();
    const startTime = new Date(attempt.startedAt);
    const timeTakenSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const finishedAttempt = await storage.finishAttempt(attempt.id, score, accuracy, timeTakenSeconds);
    res.json(finishedAttempt);
  });

  // Leaderboard
  app.get(api.leaderboard.list.path, async (req, res) => {
    const entries = await storage.getLeaderboard();
    
    const leaderboard = entries.map((e, index) => ({
      rank: index + 1,
      username: e.user.firstName ? `${e.user.firstName} ${e.user.lastName || ''}`.trim() : (e.user.username || 'Anonymous'),
      score: e.score || 0,
      accuracy: e.accuracy || 0,
      timeTaken: `${Math.floor((e.timeTakenSeconds || 0) / 60)}m ${(e.timeTakenSeconds || 0) % 60}s`,
      profileImageUrl: e.user.profileImageUrl
    }));

    res.json(leaderboard);
  });

  return httpServer;
}
