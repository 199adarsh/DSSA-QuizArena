import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@shared/models/auth';

async function fetchApiUser(token: string): Promise<User | null> {
  const response = await fetch('/api/auth/user', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user);
      if (user) {
        const token = await user.getIdToken();
        console.log('Firebase ID Token:', token);
      }
      setFirebaseUser(user);
      
      // Always clear quiz-related data when auth state changes
      queryClient.removeQueries({ queryKey: ['/api/quiz/status'] });
      queryClient.removeQueries({ queryKey: ['active-quiz'] });
      queryClient.removeQueries({ queryKey: ['/api/leaderboard/list'] });
      
      if (user) {
        // Invalidate and refetch user data
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        // Force refetch quiz status after a short delay to ensure auth is fully set
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/quiz/status'] });
          queryClient.invalidateQueries({ queryKey: ['/api/leaderboard/list'] });
        }, 100);
      } else {
        // Clear all cached data when logged out
        queryClient.clear();
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [queryClient]);

  const { data: user } = useQuery<User | null>({
    queryKey: ['/api/auth/user', firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser) return null;
      const token = await firebaseUser.getIdToken();
      return fetchApiUser(token);
    },
    enabled: !!firebaseUser,
  });

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        console.error('Firebase login error:', error);
      }
    }
  };

  const logoutMutation = useMutation({
    mutationFn: () => signOut(auth),
    onSuccess: () => {
      // Clear all cached data when logging out
      queryClient.clear();
      queryClient.setQueryData(['/api/auth/user', firebaseUser?.uid], null);
      setFirebaseUser(null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !!firebaseUser,
    login,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
