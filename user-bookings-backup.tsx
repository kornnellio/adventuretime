'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format, isAfter, startOfDay } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getUserBookingsAndIntents, cancelBooking } from '@/lib/actions/booking';
import { getAdventureById } from '@/lib/actions/adventure';
import { useAuth } from '@/lib/hooks/use-auth';
import { ro } from 'date-fns/locale';
import { toast } from 'sonner';
import { formatImageUrl, normalizeStatus } from '@/lib/utils';
import { CreditCard, Check, Slash, X, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Booking {
  _id: string;
  orderId: string;
  adventureId: string;
  adventureTitle: string;
  date: Date;
  startDate?: Date;
  endDate?: Date;
  price: number;
  status: string;
  kayakSelections: {
    caiacSingle: number;
    caiacDublu: number;
    placaSUP: number;
  };
  advancePaymentAmount: number;
  remainingPayment: number;
  details?: {
    totalPrice?: number;
    location?: string;
    meetingPoint?: string;
    difficulty?: string;
  };
  adventureImage?: string;
  isPaymentIntent?: boolean;
}

const calculateTotalPrice = (kayakSelections: { caiacSingle: number; caiacDublu: number; placaSUP: number }, price: number) => {
  return (
    (kayakSelections.caiacSingle * price) +
    (kayakSelections.caiacDublu * price * 2) +
    (kayakSelections.placaSUP * price)
  );
};

const calculateTotalParticipants = (kayakSelections: { caiacSingle: number; caiacDublu: number; placaSUP: number }) => {
  return (
    kayakSelections.caiacSingle +
    (kayakSelections.caiacDublu * 2) +
    kayakSelections.placaSUP
  );
};

const formatStatus = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'Confirmată';
    case 'pending':
      return 'În așteptare';
    case 'cancelled':
      return 'Anulată';
    default:
      return status;
  }
};

export function UserBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  const fetchBookings = async () => {
    if (!user) {
      console.log("No user found in UserBookings component");
      setError('Nu există un utilizator autentificat. Te rugăm să te autentifici pentru a vedea rezervările.');
      setIsLoading(false);
      return;
    }

    console.log("Fetching bookings for user:", user.id);
    try {
      const response = await getUserBookingsAndIntents(user.id);
      
      if (response.success && response.data) {
        console.log(`Got ${response.data.length} bookings/intents from API`);
        const userBookings = response.data;
        
        // Filter out past bookings - only show future bookings
        const today = startOfDay(new Date());
        const futureBookings = userBookings.filter((booking: Booking) => {
          // Keep all payment intents
          if (booking.isPaymentIntent) {
            return true;
          }
          
          // Filter bookings by date
          const bookingDate = new Date(booking.startDate || booking.date);
          return isAfter(bookingDate, today);
        });
        
        const bookingsWithImages = await Promise.all(
          futureBookings.map(async function(booking: Booking) {
            if (booking.adventureImage) {
              return booking;
            }
            
            try {
              const adventureResponse = await getAdventureById(booking.adventureId);
              if (adventureResponse.success && adventureResponse.data) {
                const adventure = adventureResponse.data;
                const adventureImage = adventure.images && adventure.images.length > 0
                  ? adventure.images[0]
                  : undefined;
                
                return { ...booking, adventureImage };
              }
              return booking;
            } catch (error) {
              console.error(`Error fetching adventure ${booking.adventureId}:`, error);
              return booking;
            }
          })
        );
        
        setBookings(bookingsWithImages);
      } else {
        console.error("Error from getUserBookingsAndIntents:", response.error);
        setError(response.error || 'Nu s-au putut încărca rezervările');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('A apărut o eroare la încărcarea rezervărilor tale');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Ești sigur că vrei să anulezi această rezervare?')) {
      return;
    }
    
    setIsCancelling(bookingId);
    
    try {
      const response = await cancelBooking(bookingId);
      
      if (response.success) {
        toast.success('Rezervarea a fost anulată cu succes');
        // Refresh bookings list
        fetchBookings();
      } else {
        toast.error(response.error || 'Nu s-a putut anula rezervarea');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('A apărut o eroare la anularea rezervării');
    } finally {
      setIsCancelling(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-pulse text-center">
          <p className="text-gray-400">Se încarcă rezervările...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Încearcă din nou
        </Button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-xl font-medium text-white mb-2">Nu ai nicio rezervare</h3>
        <p className="text-gray-400 mb-6">Nu ai făcut încă nicio rezervare pentru aventuri.</p>
        <Button asChild size="lg">
          <Link href="/adventures">Descoperă Aventuri</Link>
        </Button>
      </div>
    );
  }

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    
    switch (normalizedStatus) {
      case 'confirmed':
      case 'payment_confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
      case 'awaiting confirmation':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'pending_payment':
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'declined':
      case 'expired':
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    
    switch (normalizedStatus) {
      case 'confirmed':
      case 'payment_confirmed':
        return <Check className="h-3 w-3 mr-1" />;
      case 'pending':
      case 'awaiting confirmation':
        return <Clock className="h-3 w-3 mr-1" />;
      case 'pending_payment':
        return <Clock className="h-3 w-3 mr-1" />;
      case 'processing':
        return <Loader2 className="h-3 w-3 mr-1 animate-spin" />;
      case 'declined':
      case 'expired':
      case 'error':
        return <X className="h-3 w-3 mr-1" />;
      case 'cancelled':
        return <Slash className="h-3 w-3 mr-1" />;
      case 'completed':
        return <Check className="h-3 w-3 mr-1" />;
      default:
        return <AlertTriangle className="h-3 w-3 mr-1" />;
    }
  };

  // Helper function to translate status
  const translateStatus = (status: string) => {
    // Log the exact status value for debugging
    const normalizedStatus = normalizeStatus(status);
    console.log(`Status value: "${status}" -> "${normalizedStatus}"`, typeof normalizedStatus);
    console.log('Direct comparison:', normalizedStatus === 'awaiting confirmation');
    console.log('Includes check:', normalizedStatus.includes('awaiting'));
    
    if (normalizedStatus === 'confirmed') return 'Confirmată';
    if (normalizedStatus === 'pending') return 'În așteptare';
    if (normalizedStatus === 'awaiting confirmation' || normalizedStatus.includes('awaiting')) return 'În așteptarea confirmării';
    if (normalizedStatus === 'cancelled') return 'Anulată';
    if (normalizedStatus === 'completed') return 'Finalizată';
    if (normalizedStatus === 'pending_payment') return 'Plată în curs';
    if (normalizedStatus === 'payment_confirmed') return 'Plată confirmată';
    if (normalizedStatus === 'declined') return 'Plată respinsă';
    if (normalizedStatus === 'expired') return 'Plată expirată';
    if (normalizedStatus === 'error') return 'Eroare plată';
    if (normalizedStatus === 'processing') return 'Procesare plată';
    
    return status.replace(/_/g, ' ');
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookings.map((booking) => (
                          <Card key={booking._id} className="overflow-hidden bg-card border-none hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-0">
              <div className="flex flex-col">
                <div className="relative h-48 w-full">
                  <Image
                    src={booking.adventureImage || '/placeholder.jpg'}
                    alt={booking.adventureTitle}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">{booking.adventureTitle}</h3>
                  
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={cn(
                        "font-medium",
                        booking.status === 'confirmed' && "text-green-500",
                        booking.status === 'pending' && "text-yellow-500",
                        booking.status === 'cancelled' && "text-red-500"
                      )}>
                        {translateStatus(booking.status)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Data:</span>
                      <span className="text-white font-medium">
                        {format(new Date(booking.startDate || booking.date), 'dd.MM.yyyy')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Preț total:</span>
                      <span className="text-white font-medium">
                        {Number(booking.details?.totalPrice || calculateTotalPrice(booking.kayakSelections, booking.price)).toFixed(2)} lei
                      </span>
                    </div>
                    
                    {booking.advancePaymentAmount > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span>Avans plătit:</span>
                          <span className="text-green-500 font-medium">
                            {Number(booking.advancePaymentAmount).toFixed(2)} lei
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Rest de plată:</span>
                          <span className="text-white font-medium">
                            {Number(booking.remainingPayment).toFixed(2)} lei
                          </span>
                        </div>
                      </>
                    )}
                    
                    <div className="flex justify-between">
                      <span>Participanți:</span>
                      <span className="text-white font-medium">
                        {calculateTotalParticipants(booking.kayakSelections)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-5 flex flex-col space-y-2">
                    {/* Payment intent specific actions */}
                    {booking.isPaymentIntent && ['pending', 'declined', 'expired', 'error'].includes(booking.status) && (
                      <Button
                        asChild
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        <Link href={`/booking/payment?bookingId=${booking._id}`} className="flex items-center justify-center">
                          <CreditCard className="mr-2 h-4 w-4" /> Reîncearcă plata
                        </Link>
                      </Button>
                    )}
                    
                    {/* For payment intents that are processing */}
                    {booking.isPaymentIntent && booking.status === 'processing' && (
                      <Button
                        asChild
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                        size="sm"
                      >
                        <Link href={`/booking/payment/status?intentId=${booking.orderId}`} className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifică statusul plății
                        </Link>
                      </Button>
                    )}
                    
                    {/* Regular booking payment buttons */}
                    {!booking.isPaymentIntent && ['pending'].includes(booking.status) && booking.advancePaymentAmount > 0 && (
                      <Button
                        asChild
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        <Link href={`/booking/payment?bookingId=${booking._id}`} className="flex items-center justify-center">
                          <CreditCard className="mr-2 h-4 w-4" /> Plătește avansul
                        </Link>
                      </Button>
                    )}
                    
                    {!booking.isPaymentIntent && ['declined', 'expired', 'error'].includes(booking.status) && (
                      <Button
                        asChild
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        <Link href={`/booking/payment?bookingId=${booking._id}`} className="flex items-center justify-center">
                          <CreditCard className="mr-2 h-4 w-4" /> Reîncearcă plata
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}