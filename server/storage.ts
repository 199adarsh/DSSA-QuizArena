import { db } from './db';
import { User, Attempt, InsertAttempt } from '@shared/schema';

import { DecodedIdToken } from 'firebase-admin/auth';

export interface IStorage {
  upsertUser(decodedToken: DecodedIdToken): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getAttempt(userId: string): Promise<Attempt | undefined>;
  createAttempt(userId: string): Promise<Attempt>;
  updateAttempt(attemptId: string, updates: Partial<InsertAttempt>): Promise<Attempt>;
  finishAttempt(attemptId: string, score: number, accuracy: number, timeTakenSeconds: number): Promise<Attempt>;
  getLeaderboard(): Promise<(Attempt & { user: User })[]>;
  deleteAttempt(userId: string): Promise<void>;
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
    const updates = {
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
      score,
      accuracy,
      timeTakenSeconds
    };
    await attemptRef.update(updates);
    const snapshot = await attemptRef.once('value');
    return { ...snapshot.val(), id: attemptId };
  }

  async getLeaderboard(): Promise<(Attempt & { user: User })[]> {
    const attemptsSnapshot = await db.ref('attempts').orderByChild('score').limitToLast(50).once('value');
    const attempts = attemptsSnapshot.val() || {};
    const leaderboard: (Attempt & { user: User })[] = [];

    for (const attemptId in attempts) {
      const attempt = attempts[attemptId];
      if (attempt.status === 'COMPLETED') {
        const user = await this.getUser(attempt.userId);
        if (user) {
          leaderboard.push({ ...attempt, id: attemptId, user });
        }
      }
    }

    return leaderboard.sort((a, b) => {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;

      const accuracyA = a.accuracy || 0;
      const accuracyB = b.accuracy || 0;
      if (accuracyB !== accuracyA) return accuracyB - accuracyA;

      const timeA = a.timeTakenSeconds || 0;
      const timeB = b.timeTakenSeconds || 0;
      return timeA - timeB;
    });
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

