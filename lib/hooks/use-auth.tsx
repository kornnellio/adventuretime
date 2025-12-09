'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Check for corrupted session state
  const isSessionCorrupted = status === 'authenticated' && (!session?.user || session.user === null);

  useEffect(() => {
    // Log session state
    console.log('AuthProvider - Session Status:', status);
    console.log('AuthProvider - Session Corrupted:', isSessionCorrupted);
    
    // Handle session states
    if (status === 'loading') {
      setIsLoading(true);
    } else if (status === 'authenticated' && session?.user) {
      // Valid authenticated session
      setUser({
        id: session.user.id,
        name: session.user.name || '',
        surname: session.user.surname,
        email: session.user.email || '',
        username: session.user.username
      });
      setIsLoading(false);
    } else if (isSessionCorrupted) {
      // Corrupted session - clear user but DON'T redirect
      console.log('AuthProvider - Detected corrupted session, clearing user state');
      setUser(null);
      setIsLoading(false);
      // DISABLED: No automatic redirects to prevent infinite loops
      // window.location.href = '/?force_logout=true';
    } else {
      // Not authenticated
      setUser(null);
      setIsLoading(false);
    }
  }, [session, status, isSessionCorrupted]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // After successful login, NextAuth session will be updated automatically
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const logout = async () => {
    try {
      // Simple redirect to the logout page
      window.location.href = '/logout';
      
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // If there's an error, redirect to home
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
