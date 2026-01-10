import type { Express, Response, NextFunction } from "express";
import type { Request as ExpressRequest } from "express";
import { isAuthenticated } from "./replitAuth";
import * as api from "@shared/routes";
import { storage } from "../../storage";
import { User } from "@shared/schema";

// Declare module to augment Express's Request type
declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string;
      firstName?: string;
      profileImageUrl?: string;
    }
  }
}

export async function registerAuthRoutes(app: Express): Promise<void> {
  app.get(
    "/api/auth/user",
    isAuthenticated,
    async (req: ExpressRequest & { user?: User }, res: Response, next: NextFunction) => {  
      try {
        const userId = req.user!.id;
        const user = await storage.getUser(userId);
        res.json(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
      next();
    }
  );

  app.get(
    "/api/leaderboard",
    async (_req: ExpressRequest, res: Response, next: NextFunction) => {
      try {
        const entries = await storage.getLeaderboard();
        console.log("Leaderboard API result:", entries);
        res.json(entries);
      } catch (error) {
        console.error("Leaderboard error:", error);
        res.status(500).json({ message: "Failed to load leaderboard" });
      }
      next();
    }
  );
}
