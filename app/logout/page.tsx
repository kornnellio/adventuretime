'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      console.log('Logout page - Starting logout process');
      
      try {
        // First clear all cookies manually on client side
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        });
        
        // Clear localStorage and sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        
        // Call the API to clear server-side cookies
        console.log('Logout page - Calling clear session API');
        await fetch('/api/auth/clear-session', { method: 'POST' });
        
        // Then use NextAuth signOut without redirect
        console.log('Logout page - Calling NextAuth signOut');
        await signOut({ redirect: false });
        
        // Finally redirect to home without any parameters
        console.log('Logout page - Redirecting to home');
        window.location.href = '/';
      } catch (error) {
        console.error('Logout error:', error);
        // If there's an error, still redirect to home
        window.location.href = '/';
      }
    };
    
    performLogout();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Logging out...</h1>
        <p className="text-muted-foreground">Please wait while we log you out.</p>
      </div>
    </div>
  );
} 