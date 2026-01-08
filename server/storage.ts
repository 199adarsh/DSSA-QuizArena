import { users, attempts, type User, type InsertUser, type Attempt, type InsertAttempt } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User (from auth, but exposed here if needed)
  getUser(id: string): Promise<User | undefined>;
  
  // Quiz
  getAttempt(userId: string): Promise<Attempt | undefined>;
  createAttempt(userId: string): Promise<Attempt>;
  updateAttempt(id: number, updates: Partial<InsertAttempt>): Promise<Attempt>;
  finishAttempt(id: number, score: number, accuracy: number, timeTakenSeconds: number): Promise<Attempt>;
  
  // Leaderboard
  getLeaderboard(): Promise<(Attempt & { user: User })[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getAttempt(userId: string): Promise<Attempt | undefined> {
    // Get the most recent attempt or the active one
    const [attempt] = await db
      .select()
      .from(attempts)
      .where(eq(attempts.userId, userId))
      .orderBy(desc(attempts.startedAt))
      .limit(1);
    return attempt;
  }

  async createAttempt(userId: string): Promise<Attempt> {
    const [attempt] = await db
      .insert(attempts)
      .values({
        userId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      })
      .returning();
    return attempt;
  }

  async updateAttempt(id: number, updates: Partial<InsertAttempt>): Promise<Attempt> {
    const [attempt] = await db
      .update(attempts)
      .set(updates)
      .where(eq(attempts.id, id))
      .returning();
    return attempt;
  }

  async finishAttempt(id: number, score: number, accuracy: number, timeTakenSeconds: number): Promise<Attempt> {
    const [attempt] = await db
      .update(attempts)
      .set({
        status: "COMPLETED",
        completedAt: new Date(),
        score,
        accuracy,
        timeTakenSeconds
      })
      .where(eq(attempts.id, id))
      .returning();
    return attempt;
  }

  async getLeaderboard(): Promise<(Attempt & { user: User })[]> {
    // Join attempts with users
    const results = await db
      .select({
        attempt: attempts,
        user: users,
      })
      .from(attempts)
      .innerJoin(users, eq(attempts.userId, users.id))
      .where(eq(attempts.status, "COMPLETED"))
      .orderBy(desc(attempts.score), desc(attempts.accuracy), eq(attempts.timeTakenSeconds, 0) ? desc(attempts.timeTakenSeconds) : desc(attempts.timeTakenSeconds)) // Tie-breakers
      .limit(50);

    return results.map(r => ({ ...r.attempt, user: r.user }));
  }
}

export const storage = new DatabaseStorage();
