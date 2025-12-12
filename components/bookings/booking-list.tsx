import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '../ui/card';
import { cn, formatImageUrl, normalizeStatus } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Clock } from 'lucide-react';

interface BookingProps {
  destination: string;
  date: string;
  imageUrl: string;
  price?: number;
  advancePaymentAmount?: number;
  status?: string;
  isPaymentIntent?: boolean;
  id?: string;
}

interface BookingListProps {
  bookings: BookingProps[];
  showViewAll?: boolean;
  showHeader?: boolean;
  className?: string;
}

export function BookingList({ 
  bookings, 
  showViewAll = true, 
  showHeader = true,
  className
}: BookingListProps) {
  // Helper function to get status badge color
  const getStatusBadgeClass = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-800";
    
    // Normalize the status first
    const normalizedStatus = normalizeStatus(status);
    console.log(`getStatusBadgeClass called with status: "${status}" -> "${normalizedStatus}"`, normalizedStatus === 'awaiting confirmation');
    
    if (normalizedStatus === 'confirmed' || normalizedStatus === 'payment_confirmed') {
      return "bg-green-100 text-green-800";
    }
    
    if (normalizedStatus === 'pending' || normalizedStatus === 'awaiting confirmation' || normalizedStatus.includes('awaiting')) {
      console.log('Matched awaiting confirmation case!');
      return "bg-yellow-100 text-yellow-800";
    }
    
    if (normalizedStatus === 'pending_payment' || normalizedStatus === 'processing') {
      return "bg-blue-100 text-blue-800";
    }
    
    if (normalizedStatus === 'declined' || normalizedStatus === 'expired' || normalizedStatus === 'error') {
      return "bg-red-100 text-red-800";
    }
    
    if (normalizedStatus === 'cancelled') {
      return "bg-red-100 text-red-800";
    }
    
    if (normalizedStatus === 'completed') {
      return "bg-blue-100 text-blue-800";
    }
    
    console.log('No match found, using default');
    return "bg-gray-100 text-gray-800";
  };
  
  return (
    <div className={cn("space-y-3", className)}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-white">Rezervări</h2>
          {showViewAll && (
            <Link href="/dashboard/bookings" className="text-orange-500 hover:text-orange-600 text-xs sm:text-sm">
              Vezi Toate
            </Link>
          )}
        </div>
      )}
      <div className="space-y-2 sm:space-y-3">
        {bookings.length > 0 ? (
          bookings.map((booking, index) => (
            <Card key={index} className="bg-card border-none">
              <CardContent className="p-2 sm:p-3 flex items-center gap-2 sm:gap-3">
                <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={formatImageUrl(booking.imageUrl)}
                    alt={booking.destination}
                    fill
                    className="object-cover"
                    sizes="48px"
                    priority
                  />
                  {booking.isPaymentIntent && (
                    <div className="absolute inset-0 bg-blue-900/30 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xs sm:text-sm font-medium text-white truncate">
                      {booking.destination}
                    </h3>
                    {booking.status && (
                      <Badge className={`${getStatusBadgeClass(booking.status)} ml-1 text-[10px] py-0 px-1.5`}>
                        {(() => {
                          // Debug logging to see the exact status value
                          const normalizedStatus = normalizeStatus(booking.status);
                          console.log(`BookingList status: "${booking.status}" -> "${normalizedStatus}"`, typeof normalizedStatus);
                          console.log('Direct comparison:', normalizedStatus === 'awaiting confirmation');
                          console.log('Includes check:', normalizedStatus.includes('awaiting'));
                          
                          return booking.isPaymentIntent ? 'În așteptare' : 
                            normalizedStatus === 'pending' ? 'În așteptare' : 
                            normalizedStatus === 'confirmed' ? 'Confirmată' : 
                            normalizedStatus === 'processing' ? 'Procesare' : 
                            normalizedStatus === 'pending_payment' ? 'Neplătită' : 
                            normalizedStatus === 'payment_confirmed' ? 'Plătită' :
                            normalizedStatus === 'awaiting confirmation' || normalizedStatus.includes('awaiting') ? 'În așteptarea confirmării' : 
                            normalizedStatus === 'declined' ? 'Respinsă' : 
                            normalizedStatus === 'error' ? 'Eroare' : 
                            booking.status;
                        })()}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{booking.date}</p>
                  {booking.price && (
                    <div className="flex flex-col mt-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Total:</span>
                        <span className="text-white">{booking.price} lei</span>
                      </div>
                      {booking.advancePaymentAmount && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">{booking.isPaymentIntent ? 'Avans:' : 'Avans plătit:'}</span>
                          <span className="text-orange-400">{booking.advancePaymentAmount} lei</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {booking.isPaymentIntent && booking.id && (
                    <div className="mt-2">
                      <Link 
                        href={`/booking/payment-intent?intentId=${booking.id}`}
                        className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white text-xs rounded py-1 px-2"
                      >
                        <CreditCard className="h-3 w-3 mr-1" /> Continuă plata
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-4 sm:py-6">
            <p className="text-gray-400 text-xs sm:text-sm">Nu ai rezervări viitoare</p>
          </div>
        )}
      </div>
    </div>
  );
} 