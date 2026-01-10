import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

async function fetchApiUser(token: string): Promise<User | null> {
  const response = await fetch("/api/auth/user", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Failed to fetch user");

  return response.json();
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ---------------- AUTH LISTENER ---------------- */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.uid || "null");
      setFirebaseUser(user);

      if (user) {
        try {
          const token = await user.getIdToken();
          const userData = await fetchApiUser(token);
          queryClient.setQueryData(["/api/auth/user", user.uid], userData);
        } catch (error) {
          console.error("Failed to fetch user:", error);
        }
      } else {
        queryClient.removeQueries({ queryKey: ["/api/auth/user"] });
        queryClient.removeQueries({ queryKey: ["active-quiz"] });
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* ---------------- USER QUERY ---------------- */

  const { data: user, isLoading: isUserLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user", firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser) return null;
      const token = await firebaseUser.getIdToken();
      return fetchApiUser(token);
    },
    enabled: !!firebaseUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  /* ---------------- LOGIN ---------------- */

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (
        error.code !== "auth/cancelled-popup-request" &&
        error.code !== "auth/popup-closed-by-user"
      ) {
        console.error("Login error:", error);
      }
    }
  };

  /* ---------------- LOGOUT ---------------- */

  const logoutMutation = useMutation({
    mutationFn: () => signOut(auth),
    onSuccess: () => {
      queryClient.clear();
      setFirebaseUser(null);
    },
  });

  return {
    user,
    isLoading: isLoading || isUserLoading,
    isAuthenticated: !!user && !!firebaseUser,
    login,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
