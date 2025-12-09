'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthDebug } from '@/components/debug/auth-debug';
import { createBooking } from '@/lib/actions/booking';

export default function DebugPage() {
  const { data: session, status } = useSession();
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [testAdventureId, setTestAdventureId] = useState<string | null>(null);
  const [adventureTitle, setAdventureTitle] = useState<string | null>(null);
  const [isLoadingAdventure, setIsLoadingAdventure] = useState(false);

  // Fetch a real adventure ID for testing
  useEffect(() => {
    const fetchAdventureId = async () => {
      setIsLoadingAdventure(true);
      try {
        const response = await fetch('/debug/get-adventure');
        const data = await response.json();
        
        if (data.success) {
          setTestAdventureId(data.adventureId);
          setAdventureTitle(data.title);
        } else {
          console.error('Failed to fetch adventure ID:', data.error);
        }
      } catch (error) {
        console.error('Error fetching adventure ID:', error);
      } finally {
        setIsLoadingAdventure(false);
      }
    };
    
    fetchAdventureId();
  }, []);

  const handleSignIn = () => {
    signIn();
  };

  const handleSignOut = () => {
    signOut();
  };

  const testBooking = async () => {
    if (!session?.user?.id) {
      setBookingError('No user ID available. Please sign in first.');
      return;
    }

    if (!testAdventureId) {
      setBookingError('No adventure ID available. Please wait for it to load or refresh the page.');
      return;
    }

    setIsBooking(true);
    setBookingError(null);
    setBookingResult(null);

    try {
      // Use current date at 12:00 as the booking date
      const bookingDate = new Date();
      bookingDate.setHours(12, 0, 0, 0);
      
      // Call createBooking with the correct parameter types
      // 1. adventureId: string
      // 2. userId: string
      // 3. bookingDate: Date
      // 4. comments?: string
      // 5. caiacSelections: { caiacSingle: number; caiacDublu: number; placaSUP: number }
      const result = await createBooking(
        testAdventureId,
        session.user.id,
        bookingDate,
        'Test booking from debug page',
        { caiacSingle: 1, caiacDublu: 0, placaSUP: 0 }
      );
      
      setBookingResult(result);
      
      if (!result.success) {
        setBookingError(result.error || 'Unknown booking error');
      }
    } catch (error: any) {
      console.error('Error testing booking:', error);
      setBookingError(error.message || 'An error occurred during booking test');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Authentication and Booking Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2">Current status: <span className="font-medium">{status}</span></p>
              {status === 'authenticated' ? (
                <Button onClick={handleSignOut}>Sign Out</Button>
              ) : (
                <Button onClick={handleSignIn}>Sign In</Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Booking Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2">
                Test Adventure: {isLoadingAdventure ? 'Loading...' : (
                  adventureTitle ? (
                    <span className="font-medium">{adventureTitle}</span>
                  ) : 'Not available'
                )}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                ID: {testAdventureId || 'Not available'}
              </p>
            </div>
            
            <Button 
              onClick={testBooking} 
              disabled={isBooking || status !== 'authenticated' || !testAdventureId}
            >
              {isBooking ? 'Testing...' : 'Test Booking'}
            </Button>
            
            {bookingError && (
              <div className="p-3 bg-red-100 text-red-800 rounded-md">
                <p className="font-medium">Error:</p>
                <p>{bookingError}</p>
              </div>
            )}
            
            {bookingResult && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Booking Result:</h3>
                <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto">
                  {JSON.stringify(bookingResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6">
        <AuthDebug />
      </div>
    </div>
  );
} 
