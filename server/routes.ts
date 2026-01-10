import type { Express, Response, NextFunction } from "express";
import { DecodedIdToken } from "firebase-admin/auth";
import { type Server } from "http";
import { Request } from "./types";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { QUESTIONS } from "./questions";
import { auth } from "./firebase";

// Quiz attempt state machine
const ATTEMPT_STATES = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  TIMEOUT: 'TIMEOUT',
  LOCKED: 'LOCKED'
} as const;

function validateStateTransition(currentState: string, newState: string): boolean {
  const validTransitions: Record<string, string[]> = {
    [ATTEMPT_STATES.NOT_STARTED]: [ATTEMPT_STATES.IN_PROGRESS],
    [ATTEMPT_STATES.IN_PROGRESS]: [ATTEMPT_STATES.COMPLETED, ATTEMPT_STATES.TIMEOUT],
    [ATTEMPT_STATES.COMPLETED]: [ATTEMPT_STATES.LOCKED],
    [ATTEMPT_STATES.TIMEOUT]: [ATTEMPT_STATES.LOCKED],
    [ATTEMPT_STATES.LOCKED]: []
  };
  
  return validTransitions[currentState]?.includes(newState) || false;
}

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
    
    try {
      // Get active attempt for this user
      const attempt = await storage.getAttempt(userId);
      const user = await storage.getUser(userId);
      
      console.log('Quiz status check for user', userId, ':', { attempt, user });

      // State machine: Determine current state and eligibility
      let canAttempt = false;
      let activeAttempt = undefined;
      let completedAttempt = undefined;
      
      if (attempt?.status === ATTEMPT_STATES.IN_PROGRESS) {
        // User can continue an in-progress attempt
        console.log('STATE: IN_PROGRESS - User can continue');
        activeAttempt = attempt;
        canAttempt = true;
      } else if (!attempt) {
        // No attempt exists, user can start a new one
        console.log('STATE: NOT_STARTED - User can start new quiz');
        canAttempt = true;
      } else if (attempt.status === ATTEMPT_STATES.COMPLETED || attempt.status === ATTEMPT_STATES.TIMEOUT) {
        completedAttempt = attempt;
        
        if (user?.canRetakeAt) {
          // Check if enough time has passed for retake
          const retakeTime = new Date(user.canRetakeAt);
          canAttempt = new Date() >= retakeTime;
          console.log('STATE: COMPLETED - Retake check:', { canAttempt, retakeTime: retakeTime.toISOString() });
        } else {
          // First time completion - allow immediate retake
          console.log('STATE: COMPLETED - First completion, allowing retake');
          canAttempt = true;
        }
      } else {
        console.log('STATE: LOCKED or invalid state - No attempts allowed');
        canAttempt = false;
      }
      
      const response = {
        canAttempt,
        activeAttempt,
        completedAttempt,
        nextRetakeAt: user?.canRetakeAt
      };
      
      console.log('Final status response:', response);
      res.json(response);
    } catch (error) {
      console.error('Error fetching quiz status:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ------------------------
  // START QUIZ
  // ------------------------
  app.post(api.quiz.start.path, requireAuth, async (req: any, res) => {
    const userId = req.user!.uid;
    
    try {
      const existingAttempt = await storage.getAttempt(userId);
      console.log('Existing attempt for user', userId, ':', existingAttempt);

      if (existingAttempt && existingAttempt.status === ATTEMPT_STATES.IN_PROGRESS) {
        console.log('Continuing existing IN_PROGRESS attempt');
        return res.status(201).json({
          attemptId: existingAttempt.id,
          questions: QUESTIONS.map(({ correctAnswer, explanation, ...q }) => q),
          startTime: existingAttempt.startedAt,
        });
      }

      if (existingAttempt && (existingAttempt.status === ATTEMPT_STATES.COMPLETED || existingAttempt.status === ATTEMPT_STATES.TIMEOUT)) {
        // Check if user can retake
        const user = await storage.getUser(userId);
        const canRetake = !user?.canRetakeAt || new Date() >= new Date(user.canRetakeAt);
        
        if (!canRetake) {
          return res.status(400).json({ 
            message: "Quiz is locked. Please wait until the retake time or use admin password to unlock." 
          });
        }
        
        console.log('Deleting completed attempt to start new one');
        await storage.deleteAttempt(userId);
      }

      const attempt = await storage.createAttempt(userId);
      console.log('Created new attempt:', attempt.id);

      res.status(201).json({
        attemptId: attempt.id,
        questions: QUESTIONS.map(({ correctAnswer, explanation, ...q }) => q),
        startTime: attempt.startedAt,
      });
    } catch (error) {
      console.error('Error starting quiz:', error);
      res.status(500).json({ message: "Failed to start quiz" });
    }
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
    
    try {
      const attempt = await storage.getAttempt(userId);

      if (!attempt || attempt.status !== ATTEMPT_STATES.IN_PROGRESS) {
        return res.status(400).json({ message: "No active attempt to finish." });
      }

      // Validate state transition
      if (!validateStateTransition(attempt.status, ATTEMPT_STATES.COMPLETED)) {
        return res.status(400).json({ message: "Invalid state transition." });
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

      console.log(`Quiz completed for user ${userId}: score=${score}, accuracy=${accuracy}%, time=${timeTakenSeconds}s`);
      res.json(finishedAttempt);
    } catch (error) {
      console.error('Error finishing quiz:', error);
      res.status(500).json({ message: "Failed to finish quiz" });
    }
  });

  // ------------------------
  // SAVE QUIZ PROGRESS
  // ------------------------
  app.post("/api/quiz/save-progress", requireAuth, async (req: any, res) => {
    const userId = req.user!.uid;
    const { questionIndex, answers } = req.body;
    
    try {
      const attempt = await storage.getAttempt(userId);
      if (!attempt || attempt.status !== ATTEMPT_STATES.IN_PROGRESS) {
        return res.status(400).json({ 
          message: "No active quiz in progress" 
        });
      }
      
      // Update attempt with progress
      await storage.updateAttempt(attempt.id, {
        currentQuestionIndex: questionIndex,
        answers: answers
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving quiz progress:', error);
      res.status(500).json({ 
        message: "Failed to save progress" 
      });
    }
  });

  // ------------------------
  // RESTORE QUIZ PROGRESS
  // ------------------------
  app.post("/api/quiz/restore-progress", requireAuth, async (req: any, res) => {
    const userId = req.user!.uid;
    
    try {
      const attempt = await storage.getAttempt(userId);
      if (!attempt || attempt.status !== ATTEMPT_STATES.IN_PROGRESS) {
        return res.status(400).json({ 
          message: "No active quiz to restore" 
        });
      }
      
      // Get full questions for the quiz
      const questions = QUESTIONS.map(({ correctAnswer, explanation, ...q }) => q);
      
      res.json({ 
        success: true,
        attemptId: attempt.id,
        currentQuestionIndex: attempt.currentQuestionIndex || 0,
        answers: attempt.answers || {},
        startTime: attempt.startedAt,
        questions: questions
      });
    } catch (error) {
      console.error('Error restoring quiz progress:', error);
      res.status(500).json({ 
        message: "Failed to restore progress" 
      });
    }
  });
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
    
    console.log('=== REATTEMPT REQUEST DEBUG ===');
    console.log('User ID:', userId);
    console.log('Request body:', { password: password ? '***' : 'missing', reason });
    console.log('Environment REATTEMPT_PASSWORD:', process.env.REATTEMPT_PASSWORD ? '***' : 'not set');
    
    // Secure password - in production, use environment variables
    const REATTEMPT_PASSWORD = process.env.REATTEMPT_PASSWORD || "2024!Secure";
    
    // Get client info for logging
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    if (!password) {
      console.log('ERROR: No password provided');
      return res.status(403).json({ 
        message: "Password is required." 
      });
    }
    
    if (password !== REATTEMPT_PASSWORD) {
      console.log('ERROR: Password mismatch');
      return res.status(403).json({ 
        message: "Invalid password. Please contact your administrator." 
      });
    }
    
    try {
      console.log('Password validated successfully');
      
      // Check current attempt status
      const existingAttempt = await storage.getAttempt(userId);
      if (existingAttempt && existingAttempt.status === ATTEMPT_STATES.IN_PROGRESS) {
        return res.status(400).json({
          message: "Quiz is already in progress. Continue with the existing attempt."
        });
      }
      
      // Delete any existing completed/locked attempt
      if (existingAttempt) {
        await storage.deleteAttempt(userId);
      }
      
      // Update user to allow immediate retake
      await storage.updateUserStats(userId, {
        canRetakeAt: new Date().toISOString() // Allow immediate retake
      });
      
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
