'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { SuspenseWrapper } from './suspense-wrapper';

// This component is separate to isolate the useSearchParams call within Suspense
function SessionCheckerInner() {
  const { data: session, status } = useSession();
  const pathName = usePathname();
  const searchParams = useSearchParams();
  
  // Check if we're already in the logout process
  const isLoggingOut = pathName === '/logout' || 
                       searchParams.has('force_logout') || 
                       searchParams.has('session_reset');
  
  // Check for corrupted session state - only when status is authenticated but user is null
  const isSessionCorrupted = status === 'authenticated' && (!session?.user || session.user === null);
  
  useEffect(() => {
    // Log session state for debugging
    console.log('SessionChecker - Path:', pathName);
    console.log('SessionChecker - Session Status:', status);
    console.log('SessionChecker - Is Logging Out:', isLoggingOut);
    console.log('SessionChecker - Session Corrupted:', isSessionCorrupted);
    
    // DISABLED: No automatic redirects to prevent infinite loops
    // if (isSessionCorrupted && !isLoggingOut) {
    //   console.log('SessionChecker - Detected corrupted session, redirecting to logout');
    //   window.location.href = '/?force_logout=true';
    // }
  }, [session, status, isSessionCorrupted, pathName, isLoggingOut]);
  
  // This component doesn't render anything
  return null;
}

// Export the wrapped version
export function SessionChecker() {
  return (
    <SuspenseWrapper>
      <SessionCheckerInner />
    </SuspenseWrapper>
  );
} 
