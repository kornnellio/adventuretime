'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AuthDebug() {
  const { data: session, status } = useSession();
  const { user } = useAuth();
  const [apiUser, setApiUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApiSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      setApiUser(data.user);
    } catch (err) {
      setError('Failed to fetch API session');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Auth Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium mb-1">NextAuth Session Status:</h3>
          <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto">
            {status}
          </pre>
        </div>

        {session && (
          <div>
            <h3 className="font-medium mb-1">NextAuth Session User:</h3>
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(session.user, null, 2)}
            </pre>
          </div>
        )}

        <div>
          <h3 className="font-medium mb-1">useAuth Hook User:</h3>
          <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto">
            {user ? JSON.stringify(user, null, 2) : 'No user from useAuth hook'}
          </pre>
        </div>

        <div>
          <h3 className="font-medium mb-1">API Session User:</h3>
          {loading ? (
            <p className="text-sm">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : (
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto">
              {apiUser ? JSON.stringify(apiUser, null, 2) : 'No user from API'}
            </pre>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={fetchApiSession}
            disabled={loading}
          >
            Fetch API Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 