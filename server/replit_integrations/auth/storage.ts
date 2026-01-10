import { User } from "@shared/schema";
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from "../../firebase";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(decodedToken: DecodedIdToken): Promise<User>;
}

class AuthStorage implements IAuthStorage {
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
}

export const authStorage = new AuthStorage();
