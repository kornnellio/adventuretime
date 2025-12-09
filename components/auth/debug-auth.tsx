'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function DebugAuth() {
  const { data: session, status } = useSession();
  const [isVisible, setIsVisible] = useState(false);
  
  // Determine the actual authentication state
  const actuallyAuthenticated = status === 'authenticated' && session?.user !== null;
  const sessionCorrupted = status === 'authenticated' && !session?.user;
  
  useEffect(() => {
    // Check if we're in development mode
    if (process.env.NODE_ENV !== 'production') {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Show debug panel when pressing Ctrl+Shift+D
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
          setIsVisible(prev => !prev);
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);
  
  // Log the session state for debugging
  useEffect(() => {
    console.log('Debug - Session Status:', status);
    console.log('Debug - Actually Authenticated:', actuallyAuthenticated);
    console.log('Debug - Session Corrupted:', sessionCorrupted);
  }, [session, status, actuallyAuthenticated, sessionCorrupted]);
  
  if (!isVisible) return null;
  
  const handleForceLogout = async () => {
    try {
      // First clear all cookies manually
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      });
      
      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Call the API to clear server-side cookies
      await fetch('/api/auth/clear-session', { method: 'POST' });
      
      // Reload the page without any parameters
      window.location.href = '/';
    } catch (error) {
      console.error('Force logout error:', error);
      // Last resort - reload the page
      window.location.reload();
    }
  };
  
  const handleResetSession = async () => {
    try {
      console.log('Debug - Resetting corrupted session');
      
      // First clear all cookies manually
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      });
      
      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Call the clear session API
      await fetch('/api/auth/clear-session', { method: 'POST' });
      
      // Reload the page without any parameters
      window.location.href = '/';
    } catch (error) {
      console.error('Reset session error:', error);
      // Last resort - reload the page
      window.location.reload();
    }
  };
  
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        maxWidth: '400px',
        maxHeight: '300px',
        overflow: 'auto',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}
    >
      <h3 style={{ margin: '0 0 10px 0' }}>Auth Debug</h3>
      <div>
        <strong>Status:</strong> {status}
      </div>
      <div>
        <strong>Is Authenticated:</strong> {status === 'authenticated' ? 'true' : 'false'}
      </div>
      <div>
        <strong>Actually Authenticated:</strong> {actuallyAuthenticated ? 'true' : 'false'}
      </div>
      <div>
        <strong>Session Corrupted:</strong> {sessionCorrupted ? 'true' : 'false'}
      </div>
      {session && (
        <div>
          <strong>Session:</strong>
          <pre>{JSON.stringify(session, null, 2)}</pre>
        </div>
      )}
      <div style={{ marginTop: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        <button 
          onClick={handleForceLogout}
          style={{
            background: '#ff4d4f',
            border: 'none',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Force Logout
        </button>
        {sessionCorrupted && (
          <button 
            onClick={handleResetSession}
            style={{
              background: '#52c41a',
              border: 'none',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Fix Corrupted Session
          </button>
        )}
        <button 
          onClick={() => window.location.reload()}
          style={{
            background: '#1890ff',
            border: 'none',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
      </div>
      {sessionCorrupted && (
        <div style={{ marginTop: '10px', color: '#ff4d4f' }}>
          <strong>Detected corrupted session!</strong> The session thinks you're authenticated but has no user data.
          <br />
          Click "Fix Corrupted Session" to resolve this issue.
        </div>
      )}
    </div>
  );
} 