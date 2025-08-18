'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import { AuthTokens } from '@/types';

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasTokens, setHasTokens] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Check for tokens on mount and set up polling
  useEffect(() => {
    const checkTokens = () => {
      const tokensExist = apiClient.isAuthenticated();
      setHasTokens(tokensExist);
      
      // If tokens were present before but now missing due to expiration,
      // redirect to login immediately
      if (hasTokens && !tokensExist) {
        router.push('/login');
      }
      
      if (!isInitialized) {
        setIsInitialized(true);
      }
    };

    checkTokens();
    // Check tokens periodically in case they expire
    const interval = setInterval(checkTokens, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [isInitialized, hasTokens, router]);

  // No user profile needed for single-user application

  // Login mutation
  const loginMutation = useMutation(
    (password: string) => apiClient.login(password),
    {
      onSuccess: (tokens: AuthTokens) => {
        setHasTokens(true); // Update token state immediately
        toast.success('Access granted!');
        router.push('/dashboard');
      },
      // Let errors bubble up to the calling component
    }
  );


  // Logout mutation
  const logoutMutation = useMutation(
    async () => {
      try {
        await apiClient.logout();
      } catch (error) {
        // Ignore logout API errors
      }
    },
    {
      onMutate: () => {
        // Immediately update state before API call
        setHasTokens(false);
      },
      onSettled: () => {
        // Clear tokens first
        apiClient.clearTokens();
        // Ensure tokens state is false immediately
        setHasTokens(false);
        
        // Show success message and redirect first
        setTimeout(() => {
          toast.success('Locked successfully');
          router.push('/login');
          
          // Clear cache after redirect to avoid disrupting WebSocket
          setTimeout(() => {
            queryClient.clear();
          }, 200);
        }, 100);
      },
    }
  );

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  const isAuthenticated = hasTokens && apiClient.isAuthenticated();
  const isLoading = !isInitialized;
  

  // Memoize callback functions to prevent unnecessary re-renders
  const login = useCallback(async (password: string) => {
    await loginMutation.mutateAsync(password);
  }, [loginMutation]);


  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isLoading,
    isAuthenticated,
    login,
    logout,
  }), [isLoading, isAuthenticated, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're not loading and not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      
      // Fallback redirect if Next.js router fails
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }, 1000);
    }
  }, [isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading };
}
