import type { Express, Response, NextFunction } from "express";
import { DecodedIdToken } from "firebase-admin/auth";
import { type Server } from "http";
import { Request } from "./types";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { QUESTIONS } from "./questions";
import { auth } from "./firebase";

async function requireAuth(req: any, res: Response, next: NextFunction) {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  console.log('Received token on server:', idToken);

  if (process.env.NODE_ENV === "development" && !idToken) {
    req.user = {
      uid: "local-dev-user",
      email: "dev@example.com",
      name: "Dev User",
      picture: "https://www.gravatar.com/avatar/",
    } as any;
    return next();
  }
  if (!idToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log('Decoded token on server:', decodedToken);
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
    const user = await storage.getUser(userId);
    
    console.log('Quiz status check for user', userId, ':', { attempt, user });

    const activeAttempt = attempt?.status === "IN_PROGRESS" ? attempt : undefined;

    const completedAttempt =
      attempt?.status === "COMPLETED" || attempt?.status === "TIMEOUT"
        ? attempt
        : undefined;

    // Check if user can retake based on time restriction
    let canAttempt = !attempt;
    if (completedAttempt && user?.canRetakeAt) {
      const retakeTime = new Date(user.canRetakeAt);
      canAttempt = new Date() >= retakeTime;
    } else if (completedAttempt && !user?.canRetakeAt) {
      // Old users without canRetakeAt field - set it now
      const retakeTime = new Date();
      retakeTime.setHours(retakeTime.getHours() + 24);
      await storage.updateUserStats(userId, {
        canRetakeAt: retakeTime.toISOString()
      });
      canAttempt = false;
    }

    console.log('Quiz status response:', { 
      canAttempt, 
      activeAttempt, 
      completedAttempt,
      nextRetakeAt: user?.canRetakeAt 
    });

    res.json({
      canAttempt,
      activeAttempt,
      completedAttempt,
      nextRetakeAt: user?.canRetakeAt
    });
  });

  // ------------------------
  // START QUIZ
  // ------------------------
  app.post(api.quiz.start.path, requireAuth, async (req: any, res) => {
    const userId = req.user!.uid;
    const existingAttempt = await storage.getAttempt(userId);
    console.log('Existing attempt for user', userId, ':', existingAttempt);

    if (existingAttempt && existingAttempt.status === "IN_PROGRESS") {
      console.log('Quiz is in progress, returning existing attempt');
      return res.status(201).json({
        attemptId: existingAttempt.id,
        questions: QUESTIONS.map(({ correctAnswer, explanation, ...q }) => q),
        startTime: existingAttempt.startedAt,
      });
    }

    if (existingAttempt && existingAttempt.status !== "IN_PROGRESS") {
      // Allow starting a new quiz if the previous one is completed or timed out
      console.log('Deleting completed attempt with status:', existingAttempt.status);
      await storage.deleteAttempt(userId);
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
  // RESTART QUIZ
  // ------------------------
  app.post(api.quiz.restart.path, requireAuth, async (req: any, res) => {
    const userId = req.user!.uid;
    await storage.deleteAttempt(userId);
    res.json({ success: true });
  });

  // ------------------------
  // REATTEMPT QUIZ
  // ------------------------
  app.post(api.quiz.reattempt.path, requireAuth, async (req: any, res) => {
    const userId = req.user!.uid;
    const { password, reason } = req.body;
    
    // Secure password - in production, use environment variables
    const REATTEMPT_PASSWORD = process.env.REATTEMPT_PASSWORD || "Admin@2024!Secure";
    
    // Get client info for logging
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    console.log(`Reattempt request from user ${userId}:`, { 
      password: password ? 'provided' : 'missing', 
      reason, 
      ipAddress,
      userAgent: userAgent?.substring(0, 100) 
    });
    
    if (password !== REATTEMPT_PASSWORD) {
      // Log failed attempt
      await storage.logReattempt(userId, false, reason, ipAddress, userAgent);
      
      return res.status(403).json({ 
        message: "Invalid password. Please contact your administrator." 
      });
    }
    
    try {
      // Delete any existing attempt
      await storage.deleteAttempt(userId);
      
      // Update user to allow immediate retake
      await storage.updateUserStats(userId, {
        canRetakeAt: new Date().toISOString() // Allow immediate retake
      });
      
      // Log successful reattempt
      await storage.logReattempt(userId, true, reason, ipAddress, userAgent);
      
      console.log(`Reattempt granted for user ${userId}`);
      
      res.json({ 
        success: true, 
        message: "Quiz unlocked successfully. You can now retake the quiz." 
      });
    } catch (error) {
      console.error('Error processing reattempt:', error);
      res.status(500).json({ 
        message: "Internal server error. Please try again." 
      });
    }
  });

  // ------------------------
  // LEADERBOARD
  // ------------------------
  app.get(api.leaderboard.list.path, async (_req, res) => {
    const entries = await storage.getLeaderboard();
    res.json(entries);
  });

  return httpServer;
}
