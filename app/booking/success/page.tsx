'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getBookingById } from '@/lib/actions/booking';
import { BookingWithDetails } from '@/lib/actions/booking';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Suspense } from 'react';
import { CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');
  
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  
  useEffect(() => {
    async function fetchBookingDetails() {
      if (!bookingId) {
        setError('Nu a fost furnizat ID-ul rezervării');
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await getBookingById(bookingId);
        
        if (response.success && response.data) {
          setBooking(response.data);
          
          // If booking has advance payment and status is pending,
          // redirect to payment page automatically
          const booking = response.data;
          if (
            booking.advancePaymentAmount > 0 && 
            booking.status === 'pending'
          ) {
            // Automatically redirect to payment page after a short delay
            setRedirecting(true);
            const timer = setTimeout(() => {
              window.location.href = `/booking/payment?bookingId=${booking._id}`;
            }, 3000); // 3 second delay to allow the user to see the success message
            
            return () => clearTimeout(timer);
          }
        } else {
          setError(response.error || 'Nu s-au putut obține detaliile rezervării');
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
        setError('A apărut o eroare la obținerea detaliilor rezervării');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBookingDetails();
  }, [bookingId]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <p className="text-xl">Se încarcă detaliile rezervării...</p>
      </div>
    );
  }
  
  if (error || !booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500">Eroare rezervare</CardTitle>
            <CardDescription>A apărut o problemă cu rezervarea dvs.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error || 'Rezervarea nu a fost găsită'}</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/adventures">Explorează aventuri</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Check payment status to determine if we should show payment button
  const isPaidOrPending = ['payment_confirmed', 'confirmed', 'pending_payment', 'processing'].includes(booking.status);
  const isAwaitingPayment = ['awaiting confirmation', 'pending'].includes(booking.status);
  
  // Determine appropriate title and icon based on status
  let pageTitle = '';
  let pageDescription = '';
  let StatusIcon = CheckCircle;
  let iconColorClass = 'text-green-600';
  let bgColorClass = 'bg-green-100';
  
  if (isAwaitingPayment && booking.advancePaymentAmount > 0) {
    pageTitle = 'Cerere de rezervare înregistrată';
    pageDescription = 'Rezervarea necesită plata avansului pentru confirmare';
    StatusIcon = AlertTriangle;
    iconColorClass = 'text-yellow-600';
    bgColorClass = 'bg-yellow-100';
  } else if (isPaidOrPending) {
    pageTitle = 'Plata în curs de procesare';
    pageDescription = 'Rezervarea va fi confirmată după procesarea plății';
    StatusIcon = AlertTriangle;
    iconColorClass = 'text-blue-600';
    bgColorClass = 'bg-blue-100';
  } else {
    pageTitle = 'Rezervarea ta a fost confirmată!';
    pageDescription = 'Aventura ta este rezervată și gata de a începe';
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${bgColorClass}`}>
            <StatusIcon className={`h-6 w-6 ${iconColorClass}`} />
          </div>
          <CardTitle className="text-2xl">{pageTitle}</CardTitle>
          <CardDescription>{pageDescription}</CardDescription>
          {redirecting && (
            <p className="mt-2 text-sm text-blue-600">Se redirecționează către pagina de plată...</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Referință rezervare
            </div>
            <div className="text-lg font-semibold">{booking.orderId}</div>
          </div>
          
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Detalii aventură
            </h3>
            <p className="font-semibold">{booking.adventureTitle}</p>
            <p className="text-sm text-gray-500">
              {booking.date && typeof booking.date === 'string' 
                ? format(new Date(booking.date), 'd MMMM yyyy', { locale: ro }) 
                : booking.date instanceof Date 
                  ? format(booking.date, 'd MMMM yyyy', { locale: ro })
                  : 'Data indisponibilă'}
            </p>
          </div>
          
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              Plată
            </h3>
            <div className="flex justify-between">
              <span>Preț total:</span>
              <span className="font-semibold">{(
                (booking.kayakSelections?.caiacSingle || 0) * booking.price + 
                (booking.kayakSelections?.caiacDublu || 0) * booking.price * 2 + 
                (booking.kayakSelections?.placaSUP || 0) * booking.price
              ).toFixed(2)} lei</span>
            </div>
            
            {booking.advancePaymentAmount > 0 && (
              <>
                <div className="flex justify-between text-orange-600 dark:text-orange-400">
                  <span>Avans platit ({booking.advancePaymentPercentage}%):</span>
                  <span className="font-semibold">{booking.advancePaymentAmount.toFixed(2)} lei</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Rest de plată:</span>
                  <span className="font-semibold">
                    {(
                      (booking.kayakSelections?.caiacSingle || 0) * booking.price + 
                      (booking.kayakSelections?.caiacDublu || 0) * booking.price * 2 + 
                      (booking.kayakSelections?.placaSUP || 0) * booking.price - 
                      booking.advancePaymentAmount
                    ).toFixed(2)} lei
                  </span>
                </div>
                {!isPaidOrPending && isAwaitingPayment && (
                  <p className="mt-2 text-xs text-red-500 font-medium">
                    Rezervarea nu este confirmată până la plata avansului.
                  </p>
                )}
                {isPaidOrPending && (
                  <p className="mt-2 text-xs text-gray-500">
                    Avansul a fost plătit. Suma rămasă va fi plătită în numerar în ziua aventurii.
                  </p>
                )}
              </>
            )}
            
            <p className="mt-2 text-sm font-medium">
              Status: <span className={`${isAwaitingPayment && booking.advancePaymentAmount > 0 ? "text-yellow-600" : "text-green-600"}`}>
                {booking.status.replace(/_/g, ' ')}
              </span>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {isAwaitingPayment && booking.advancePaymentAmount > 0 && (
            <div className="w-full p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">Important: Rezervarea necesită confirmare prin plată</h3>
              <p className="text-sm text-yellow-800 mb-3">
                Pentru a confirma rezervarea, este necesar să achitați avansul de {Number(booking.advancePaymentAmount).toFixed(2)} lei online.
              </p>
              <Button 
                asChild 
                className="w-full bg-yellow-600 hover:bg-yellow-700 flex items-center justify-center"
              >
                <Link href={`/booking/payment?bookingId=${booking._id}`}>
                  <CreditCard className="mr-2 h-4 w-4" /> Plătește avansul online acum
                </Link>
              </Button>
            </div>
          )}
          
          <Button asChild className="w-full">
            <Link href="/dashboard/bookings">Vezi rezervările mele</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/adventures">Explorează mai multe aventuri</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
      <p className="text-xl">Se încarcă detaliile rezervării...</p>
    </div>}>
      <BookingSuccessContent />
    </Suspense>
  );
} 