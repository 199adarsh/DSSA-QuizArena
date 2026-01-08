import type { Express, Response, NextFunction } from "express";
import { DecodedIdToken } from "firebase-admin/auth";
import { type Server } from "http";
import { Request } from "./types";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { QUESTIONS } from "./questions";
import { auth } from "./firebase";

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === "development") {
    req.user = {
      uid: "local-dev-user",
      email: "dev@example.com",
      name: "Dev User",
      picture: "https://www.gravatar.com/avatar/",
    } as any;
    return next();
  }

  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ------------------------
  // AUTH USER
  // ------------------------
  app.get(api.auth.user.path, requireAuth, async (req: any, res) => {
    const user = await storage.upsertUser(req.user!);
    res.json(user);
  });

  // ------------------------
  // QUIZ STATUS
  // ------------------------
  app.get(api.quiz.status.path, requireAuth, async (req: any, res) => {
    const userId = req.user!.uid;
    const attempt = await storage.getAttempt(userId);

    const activeAttempt = attempt?.status === "IN_PROGRESS" ? attempt : undefined;

    const completedAttempt =
      attempt?.status === "COMPLETED" || attempt?.status === "TIMEOUT"
        ? attempt
        : undefined;

    res.json({
      canAttempt: !attempt,
      activeAttempt,
      completedAttempt,
    });
  });

  // ------------------------
  // START QUIZ
  // ------------------------
  app.post(api.quiz.start.path, requireAuth, async (req: any, res) => {
    const userId = req.user!.uid;
    const existingAttempt = await storage.getAttempt(userId);

    if (existingAttempt) {
      if (existingAttempt.status === "IN_PROGRESS") {
        return res.status(201).json({
          attemptId: existingAttempt.id,
          questions: QUESTIONS.map(({ correctAnswer, explanation, ...q }) => q),
          startTime: existingAttempt.startedAt,
        });
      }

      return res
        .status(400)
        .json({ message: "You have already attempted the quiz." });
    }

    const attempt = await storage.createAttempt(userId);

    res.status(201).json({
      attemptId: attempt.id,
      questions: QUESTIONS.map(({ correctAnswer, explanation, ...q }) => q),
      startTime: attempt.startedAt,
    });
  });

  // ------------------------
  // SUBMIT ANSWER
  // ------------------------
  app.post(api.quiz.submitAnswer.path, requireAuth, async (req: any, res) => {
    const userId = req.user!.uid;
    const { questionId, answer } = api.quiz.submitAnswer.input.parse(req.body);

    const attempt = await storage.getAttempt(userId);
    if (!attempt || attempt.status !== "IN_PROGRESS") {
      return res.status(400).json({ message: "No active attempt found." });
    }

    const currentAnswers = (attempt.answers as Record<string, any>) || {};
    const updatedAnswers = {
      ...currentAnswers,
      [questionId]: answer,
    };

    await storage.updateAttempt(attempt.id, {
      answers: updatedAnswers,
    });

    res.json({ success: true });
  });

  // ------------------------
  // FINISH QUIZ
  // ------------------------
  app.post(api.quiz.finish.path, requireAuth, async (req: any, res) => {
    const userId = req.user!.uid;
    const attempt = await storage.getAttempt(userId);

    if (!attempt || attempt.status !== "IN_PROGRESS") {
      return res.status(400).json({ message: "No active attempt to finish." });
    }

    const answers = (attempt.answers as Record<string, any>) || {};
    let score = 0;

    QUESTIONS.forEach((q) => {
      const userAnswer = answers[q.id];
      if (!userAnswer) return;

      if (q.type === "MCQ_MULTI") {
        if (Array.isArray(userAnswer) && Array.isArray(q.correctAnswer)) {
          const sortedUser = [...userAnswer].sort();
          const sortedCorrect = [...q.correctAnswer].sort();
          if (JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect)) {
            score += 10;
          }
        }
      } else {
        if (userAnswer === q.correctAnswer) {
          score += 10;
        }
      }
    });

    const accuracy = Math.round((score / (QUESTIONS.length * 10)) * 100);

    const endTime = new Date();
    const startTime = new Date(attempt.startedAt);
    const timeTakenSeconds = Math.floor(
      (endTime.getTime() - startTime.getTime()) / 1000
    );

    const finishedAttempt = await storage.finishAttempt(
      attempt.id,
      score,
      accuracy,
      timeTakenSeconds
    );

    res.json(finishedAttempt);
  });

  // ------------------------
  // LEADERBOARD
  // ------------------------
  app.get(api.leaderboard.list.path, async (_req, res) => {
    const entries = await storage.getLeaderboard();

    const leaderboard = entries.map((e, index) => ({
      rank: index + 1,
      username: e.user.firstName
        ? `${e.user.firstName} ${e.user.lastName || ""}`.trim()
        : e.user.email || "Anonymous",
      score: e.score || 0,
      accuracy: e.accuracy || 0,
      timeTaken: `${Math.floor((e.timeTakenSeconds || 0) / 60)}m ${
        (e.timeTakenSeconds || 0) % 60
      }s`,
      profileImageUrl: e.user.profileImageUrl,
    }));

    res.json(leaderboard);
  });

  return httpServer;
}
