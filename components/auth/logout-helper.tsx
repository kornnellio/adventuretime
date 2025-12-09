'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { SuspenseWrapper } from './suspense-wrapper';

// This component is separate to isolate the useSearchParams call within Suspense
function LogoutHelperInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLoggingOut = searchParams.get('logout') === 'true';

  useEffect(() => {
    console.log('LogoutHelper - Component mounted');
    console.log('LogoutHelper - isLoggingOut:', isLoggingOut);
    
    if (isLoggingOut) {
      console.log('LogoutHelper - Logout parameter detected, performing cleanup');
      // Clear any client-side caches
      if (typeof window !== 'undefined') {
        // Clear localStorage items related to auth
        localStorage.removeItem('next-auth.session-token');
        localStorage.removeItem('next-auth.callback-url');
        localStorage.removeItem('next-auth.csrf-token');
        
        // Clear sessionStorage items
        sessionStorage.clear();
        
        // Call the custom logout API
        console.log('LogoutHelper - Calling custom logout API');
        fetch('/api/auth/logout', { method: 'POST' })
          .then(() => {
            console.log('LogoutHelper - API call successful, redirecting');
            // Force a hard refresh to clear any in-memory state
            window.location.href = '/';
          })
          .catch(error => {
            console.error('Error during logout cleanup:', error);
            console.log('LogoutHelper - API call failed, still redirecting');
            // Still redirect even if there's an error
            window.location.href = '/';
          });
      }
    }
  }, [isLoggingOut]);

  return null; // This component doesn't render anything
}

// Export the wrapped version
export function LogoutHelper() {
  return (
    <SuspenseWrapper>
      <LogoutHelperInner />
    </SuspenseWrapper>
  );
} 