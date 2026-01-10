import { db } from './db';
import { User, Attempt, InsertAttempt, LeaderboardEntry, ReattemptLog } from '@shared/schema';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface IStorage {
  upsertUser(decodedToken: DecodedIdToken): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getAttempt(userId: string): Promise<Attempt | undefined>;
  createAttempt(userId: string): Promise<Attempt>;
  updateAttempt(attemptId: string, updates: Partial<InsertAttempt>): Promise<Attempt>;
  finishAttempt(attemptId: string, score: number, accuracy: number, timeTakenSeconds: number): Promise<Attempt>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;
  deleteAttempt(userId: string): Promise<void>;
  getUserAttempts(userId: string): Promise<Attempt[]>;
  updateUserStats(userId: string, stats: Partial<User>): Promise<void>;
  logReattempt(userId: string, granted: boolean, reason?: string, ipAddress?: string, userAgent?: string): Promise<void>;
  getReattemptLogs(userId?: string): Promise<ReattemptLog[]>;
  saveProgress(userId: string, questionIndex: number, answers: Record<string, any>): Promise<void>;
  restoreProgress(userId: string): Promise<Attempt | undefined>;
}

export class FirebaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const snapshot = await db.ref(`users/${id}`).once('value');
    return snapshot.val();
  }

  async upsertUser(decodedToken: DecodedIdToken): Promise<User> {
    const userRef = db.ref(`users/${decodedToken.uid}`);
    const snapshot = await userRef.once('value');
    let user = snapshot.val();

    if (!user) {
      const newUser: User = {
        id: decodedToken.uid,
        email: decodedToken.email,
        firstName: decodedToken.name?.split(' ')[0],
        profileImageUrl: decodedToken.picture,
        createdAt: new Date().toISOString(),
      };
      await userRef.set(newUser);
      user = newUser;
    }

    return user;
  }

  async getAttempt(userId: string): Promise<Attempt | undefined> {
    console.log('Getting attempt for user:', userId);
    const snapshot = await db.ref('attempts').orderByChild('userId').equalTo(userId).once('value');
    const attempts = snapshot.val();
    console.log('Raw attempts data:', attempts);
    if (!attempts) {
      console.log('No attempts found for user');
      return undefined;
    }
    const attemptId = Object.keys(attempts)[0];
    const attempt = { ...attempts[attemptId], id: attemptId };
    console.log('Returning attempt:', attempt);
    return attempt;
  }

  async createAttempt(userId: string): Promise<Attempt> {
    const newAttemptRef = db.ref('attempts').push();
    const attemptData: Attempt = {
      userId,
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      id: newAttemptRef.key!,
      score: 0,
      accuracy: 0,
      timeTakenSeconds: 0,
      answers: {}
    };
    await newAttemptRef.set(attemptData);
    return attemptData;
  }

  async updateAttempt(attemptId: string, updates: Partial<InsertAttempt>): Promise<Attempt> {
    const attemptRef = db.ref(`attempts/${attemptId}`);
    await attemptRef.update(updates);
    const snapshot = await attemptRef.once('value');
    return { ...snapshot.val(), id: attemptId };
  }

  async finishAttempt(attemptId: string, score: number, accuracy: number, timeTakenSeconds: number): Promise<Attempt> {
    const attemptRef = db.ref(`attempts/${attemptId}`);
    const snapshot = await attemptRef.once('value');
    const attempt = snapshot.val();
    
    const updates = {
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
      score,
      accuracy,
      timeTakenSeconds
    };
    await attemptRef.update(updates);
    
    // Update user statistics
    const user = await this.getUser(attempt.userId);
    if (user) {
      const totalAttempts = (user.totalAttempts || 0) + 1;
      const totalScore = (user.totalScore || 0) + score;
      const bestScore = Math.max(user.bestScore || 0, score);
      
      // Set next retake time (24 hours from now)
      const canRetakeAt = new Date();
      canRetakeAt.setHours(canRetakeAt.getHours() + 24);
      
      await this.updateUserStats(attempt.userId, {
        totalAttempts,
        totalScore,
        bestScore,
        lastAttemptAt: new Date().toISOString(),
        canRetakeAt: canRetakeAt.toISOString()
      });
    }
    
    return { ...attempt, ...updates, id: attemptId };
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const usersSnapshot = await db.ref('users').once('value');
    const users = usersSnapshot.val() || {};
    
    const leaderboard: LeaderboardEntry[] = [];

    for (const userId in users) {
      const user = users[userId];
      if (user.totalAttempts && user.totalAttempts > 0) {
        const attemptsSnapshot = await db.ref('attempts').orderByChild('userId').equalTo(userId).once('value');
        const attempts = attemptsSnapshot.val() || {};
        
        let bestScore = 0;
        let bestAccuracy = 0;
        let bestTime = 0;
        let lastAttemptAt = user.lastAttemptAt;

        // Find the best attempt
        for (const attemptId in attempts) {
          const attempt = attempts[attemptId];
          if (attempt.status === 'COMPLETED' && attempt.score > bestScore) {
            bestScore = attempt.score;
            bestAccuracy = attempt.accuracy || 0;
            bestTime = attempt.timeTakenSeconds || 0;
          }
        }

        leaderboard.push({
          rank: 0, // Will be set after sorting
          username: user.firstName || 'Anonymous',
          score: bestScore, // Current best score for display
          bestScore,
          totalScore: user.totalScore || 0,
          attempts: user.totalAttempts || 0,
          accuracy: bestAccuracy,
          timeTaken: `${bestTime}s`,
          profileImageUrl: user.profileImageUrl,
          lastAttemptAt
        });
      }
    }

    // Sort by best score, then accuracy, then time
    leaderboard.sort((a, b) => {
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return parseInt(a.timeTaken) - parseInt(b.timeTaken);
    });

    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return leaderboard.slice(0, 50); // Top 50
  }

  async getUserAttempts(userId: string): Promise<Attempt[]> {
    const snapshot = await db.ref('attempts').orderByChild('userId').equalTo(userId).once('value');
    const attempts = snapshot.val() || {};
    
    const userAttempts: Attempt[] = [];
    for (const attemptId in attempts) {
      userAttempts.push({ ...attempts[attemptId], id: attemptId });
    }
    
    return userAttempts.sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  async updateUserStats(userId: string, stats: Partial<User>): Promise<void> {
    const userRef = db.ref(`users/${userId}`);
    await userRef.update({
      ...stats,
      updatedAt: new Date().toISOString()
    });
  }

  async logReattempt(userId: string, granted: boolean, reason?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const reattemptRef = db.ref('reattempts').push();
    const logEntry: ReattemptLog = {
      id: reattemptRef.key!,
      userId,
      timestamp: new Date().toISOString(),
      reason,
      granted,
      ipAddress,
      userAgent
    };
    await reattemptRef.set(logEntry);
  }

  async saveProgress(userId: string, questionIndex: number, answers: Record<string, any>): Promise<void> {
    const attempt = await this.getAttempt(userId);
    if (!attempt || attempt.status !== "IN_PROGRESS") {
      throw new Error("No active quiz in progress");
    }
    
    await this.updateAttempt(attempt.id, {
      currentQuestionIndex: questionIndex,
      answers
    });
    console.log(`Saved progress for user ${userId}: question ${questionIndex}, ${Object.keys(answers).length} answers`);
  }

  async restoreProgress(userId: string): Promise<Attempt | undefined> {
    const attempt = await this.getAttempt(userId);
    if (!attempt || attempt.status !== "IN_PROGRESS") {
      throw new Error("No active quiz to restore");
    }
    
    console.log(`Restored progress for user ${userId}: question ${attempt.currentQuestionIndex || 0}, ${Object.keys(attempt.answers || {}).length} answers`);
    return attempt;
  }

  async getReattemptLogs(userId?: string): Promise<ReattemptLog[]> {
    let snapshot;
    if (userId) {
      snapshot = await db.ref('reattempts').orderByChild('userId').equalTo(userId).once('value');
    } else {
      snapshot = await db.ref('reattempts').once('value');
    }
    
    const logs = snapshot.val() || {};
    const reattemptLogs: ReattemptLog[] = [];
    
    for (const logId in logs) {
      reattemptLogs.push({ ...logs[logId], id: logId });
    }
    
    return reattemptLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async deleteAttempt(userId: string): Promise<void> {
    console.log('Attempting to delete attempt for user:', userId);
    const snapshot = await db.ref('attempts').orderByChild('userId').equalTo(userId).once('value');
    const attempts = snapshot.val();
    console.log('Found attempts:', attempts);
    if (attempts) {
      const attemptIds = Object.keys(attempts);
      console.log('Deleting attempt IDs:', attemptIds);
      // Delete all attempts for this user (there should only be one)
      await Promise.all(
        attemptIds.map(attemptId => db.ref(`attempts/${attemptId}`).remove())
      );
      console.log('Successfully deleted attempts');
    } else {
      console.log('No attempts found to delete');
    }
  }
}

export const storage = new FirebaseStorage();

