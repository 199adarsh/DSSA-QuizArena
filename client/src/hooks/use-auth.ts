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
      setFirebaseUser(user);
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
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
    await signInWithPopup(auth, provider);
  };

  const logoutMutation = useMutation({
    mutationFn: () => signOut(auth),
    onSuccess: () => {
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
