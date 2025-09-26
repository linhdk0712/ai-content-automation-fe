import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { supabaseService } from '../services/supabase.service';
import { User, Session } from '@supabase/supabase-js';

interface SupabaseContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | null>(null);

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

interface SupabaseProviderProps {
  children: ReactNode;
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  useEffect(() => {
    const handleAuthStateChanged = ({ user, session }: { user: User | null; session: Session | null }) => {
      setUser(user);
      setSession(session);
      setIsLoading(false);
      setError(null);
    };

    const handleSignedIn = ({ user, session }: { user: User | null; session: Session | null }) => {
      console.log('User signed in:', user?.email);
    };

    const handleSignedOut = () => {
      console.log('User signed out');
      setUser(null);
      setSession(null);
    };

    // Set up event listeners
    supabaseService.on('authStateChanged', handleAuthStateChanged);
    supabaseService.on('signedIn', handleSignedIn);
    supabaseService.on('signedOut', handleSignedOut);

    // Initial state
    setUser(supabaseService.user);
    setSession(supabaseService.session);
    setIsLoading(false);

    return () => {
      supabaseService.off('authStateChanged', handleAuthStateChanged);
      supabaseService.off('signedIn', handleSignedIn);
      supabaseService.off('signedOut', handleSignedOut);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      return await supabaseService.signIn(email, password);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign in failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    try {
      setError(null);
      setIsLoading(true);
      return await supabaseService.signUp(email, password, metadata);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign up failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await supabaseService.signOut();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign out failed');
      setError(error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await supabaseService.resetPassword(email);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Password reset failed');
      setError(error);
      throw error;
    }
  };

  const contextValue: SupabaseContextType = React.useMemo(() => ({
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword
  }), [user, session, isLoading, error]);

  return (
    <SupabaseContext.Provider value={contextValue}>
      {children}
    </SupabaseContext.Provider>
  );
};

// Backward compatibility - export with old names
export const RealTimeContext = SupabaseContext;
export const useRealTimeContext = useSupabase;
export const RealTimeProvider = SupabaseProvider;