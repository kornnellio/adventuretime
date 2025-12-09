'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getBookingById } from '@/lib/actions/booking';
import { initiateNetopiaPayment, getBookingPaymentDetails } from '@/lib/actions/payment';
import { Loader2, AlertCircle, CheckCircle2, XCircle, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PhoneInput } from "@/components/ui/phone-input";

interface BookingData {
  _id: string;
  adventureTitle: string;
  orderId: string;
  startDate: string | Date;
  endDate: string | Date;
  status: string;
  location?: string;
  price: number;
  advancePaymentPercentage: number;
  advancePaymentAmount: number;
  statusMessage?: string;
  phoneNumber?: string;
  kayakSelections?: {
    caiacSingle: number;
    caiacDublu: number;
    placaSUP: number;
  };
}

interface PaymentTransactionDetails {
  ntpID: string;
  dateTime: string | Date;
  cardMasked?: string;
}

interface PaymentInfoData {
  paymentTransactionDetails?: PaymentTransactionDetails;
}

export default function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  // Helper function to calculate total price based on kayak selections
  const calculateTotalPrice = (booking: BookingData): number => {
    if (!booking.kayakSelections) {
      return booking.price; // Fallback to original price if no kayak selections
    }
    
    return (
      (booking.kayakSelections.caiacSingle || 0) * booking.price + 
      (booking.kayakSelections.caiacDublu || 0) * booking.price * 2 + 
      (booking.kayakSelections.placaSUP || 0) * booking.price
    );
  };

  // State for phone number
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfoData | null>(null);
  const [validPhone, setValidPhone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch booking details when the component mounts
  useEffect(() => {
    async function fetchBookingDetails() {
      if (!bookingId) {
        setError('Nu a fost furnizat ID-ul rezervării');
        setLoading(false);
        return;
      }

      try {
        // Get the booking details
        const result = await getBookingById(bookingId);
        
        if (!result.success || !result.data) {
          setError(result.error || 'Nu s-au putut încărca detaliile rezervării');
          setLoading(false);
          return;
        }

        const bookingData = result.data as BookingData;
        setBooking(bookingData);
        
        // Initialize phone if already stored on booking
        if (bookingData.phoneNumber) {
          setPhone(bookingData.phoneNumber);
          // Validate phone number
          const phoneRegex = /^07\d{8}$/;
          const cleanPhone = bookingData.phoneNumber.replace(/\s+/g, "");
          setValidPhone(phoneRegex.test(cleanPhone));
        }
        
        // Get payment details if they exist
        const paymentResult = await getBookingPaymentDetails(bookingId);
        
        if (paymentResult.success && paymentResult.data) {
          setPaymentInfo(paymentResult.data as PaymentInfoData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Eroare la încărcarea detaliilor rezervării:', error);
        setError('A apărut o eroare la încărcarea detaliilor rezervării');
        setLoading(false);
      }
    }

    fetchBookingDetails();
  }, [bookingId]);

  // Function to initiate payment
  const handleInitiatePayment = async () => {
    // Phone validation 
    const phoneRegex = /^07\d{8}$/;
    const cleanPhone = phone.replace(/\s+/g, "");
    
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      setValidPhone(false);
      setError("Te rugăm să introduci un număr de telefon valid (ex: 07XX XXX XXX).");
      return;
    }
    
    setValidPhone(true);
    setError(null);
    
    if (!booking || !booking._id) {
      setError("Datele de rezervare lipsesc. Vă rugăm reîncărcați pagina.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const result = await initiateNetopiaPayment(booking._id, cleanPhone);

      if (!result.success || !result.data) {
        setError(result.error || 'Nu s-a putut iniția plata');
        setProcessing(false);
        return;
      }

      // Open the payment URL in a new window
      window.open(result.data.paymentUrl, '_blank');
      
      // Redirect to payment result page
      router.push(`/booking/payment-result?bookingId=${booking._id}`);
    } catch (error) {
      console.error('Eroare la inițierea plății:', error);
      setError('A apărut o eroare la inițierea plății');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Se încarcă detaliile rezervării...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto max-w-4xl py-12">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nu s-a găsit</AlertTitle>
          <AlertDescription>Informațiile despre rezervare nu au putut fi găsite.</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/dashboard/bookings')}>
          Înapoi la Rezervările Mele
        </Button>
      </div>
    );
  }

  const isPaymentConfirmed = booking.status === 'payment_confirmed' || booking.status === 'confirmed' || booking.status === 'awaiting confirmation';
  const isPendingPayment = booking.status === 'pending_payment';
  
  // Determine if payment button should be disabled
  const disablePaymentButton = processing || isPaymentConfirmed || isPendingPayment;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Plată pentru Aventură</h1>
      
      {/* Display error alert if any */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Eroare</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Phone number input */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <PhoneInput
              value={phone}
              onChange={setPhone}
              isValid={validPhone}
              required
              helperText="Vă vom contacta la acest număr dacă apar detalii importante despre experiența dvs."
              disabled={submitting}
            />
          </div>
        </CardContent>
      </Card>

      {isPaymentConfirmed && booking.status === 'confirmed' && (
        <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Plată Finalizată</AlertTitle>
          <AlertDescription>
            Plata dvs. a fost procesată cu succes. Puteți vedea detaliile rezervării în contul dvs.
          </AlertDescription>
        </Alert>
      )}
      
      {isPaymentConfirmed && booking.status === 'awaiting confirmation' && (
        <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Plată Finalizată</AlertTitle>
          <AlertDescription>
            Plata dvs. a fost procesată cu succes. Vă vom contacta în curând pentru confirmarea finală în funcție de disponibilitatea locurilor.
          </AlertDescription>
        </Alert>
      )}
      
      {isPendingPayment && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200 text-yellow-800">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>Plată în Curs</AlertTitle>
          <AlertDescription>
            Plata dvs. este în curs de procesare. Vă rugăm să verificați mai târziu pentru actualizări.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{booking.adventureTitle}</CardTitle>
          <CardDescription>
            Referință Rezervare: {booking.orderId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2">Detalii Rezervare</h3>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Data de început:</span>{' '}
              {new Date(booking.startDate).toLocaleDateString('ro-RO')}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Data de sfârșit:</span>{' '}
              {new Date(booking.endDate).toLocaleDateString('ro-RO')}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Status:</span>{' '}
              <span className="capitalize">{booking.status.replace(/_/g, ' ')}</span>
            </p>
            {booking.location && (
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Locație:</span> {booking.location}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Detalii Plată</h3>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Preț per persoană:</span> {booking.price.toFixed(2)} RON
              </p>
              
              {booking.kayakSelections && (
                <>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Ambarcațiuni selectate:</h4>
                  {booking.kayakSelections.caiacSingle > 0 && (
                    <p className="text-sm text-gray-600 mb-1 ml-2">
                      <span className="font-medium">Caiac Single:</span> {booking.kayakSelections.caiacSingle} x {booking.price} RON
                    </p>
                  )}
                  {booking.kayakSelections.caiacDublu > 0 && (
                    <p className="text-sm text-gray-600 mb-1 ml-2">
                      <span className="font-medium">Caiac Dublu:</span> {booking.kayakSelections.caiacDublu} x {booking.price * 2} RON
                    </p>
                  )}
                  {booking.kayakSelections.placaSUP > 0 && (
                    <p className="text-sm text-gray-600 mb-1 ml-2">
                      <span className="font-medium">Placă SUP:</span> {booking.kayakSelections.placaSUP} x {booking.price} RON
                    </p>
                  )}
                </>
              )}
              
              <p className="text-sm text-gray-600 mb-1 mt-2">
                <span className="font-medium">Preț Total:</span> {calculateTotalPrice(booking)} RON
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Plată în Avans ({booking.advancePaymentPercentage}%):</span>{' '}
                {booking.advancePaymentAmount.toFixed(2)} RON
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Plată Rămasă:</span>{' '}
                {(calculateTotalPrice(booking) - booking.advancePaymentAmount).toFixed(2)} RON
              </p>
              {paymentInfo?.paymentTransactionDetails?.ntpID && (
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">ID Tranzacție:</span>{' '}
                  {paymentInfo.paymentTransactionDetails.ntpID}
                </p>
              )}
            </div>
            <div>
              {paymentInfo?.paymentTransactionDetails && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="font-semibold text-lg mb-2">Detalii Ultima Tranzacție</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Data:</span>{' '}
                    {new Date(paymentInfo.paymentTransactionDetails.dateTime).toLocaleString('ro-RO')}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Status:</span>{' '}
                    <span className="capitalize">{booking.statusMessage || 'Necunoscut'}</span>
                  </p>
                  {paymentInfo.paymentTransactionDetails.cardMasked && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Card:</span>{' '}
                      {paymentInfo.paymentTransactionDetails.cardMasked}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <Button
            variant="default"
            className="flex-1"
            disabled={disablePaymentButton}
            onClick={handleInitiatePayment}
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Se procesează
              </>
            ) : isPaymentConfirmed ? (
              'Plată Finalizată'
            ) : isPendingPayment ? (
              'Plată în Curs'
            ) : (
              'Plătește Acum'
            )}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/dashboard/bookings')}
          >
            Înapoi la Rezervările Mele
          </Button>
        </CardFooter>
      </Card>
      
      <div className="text-sm text-gray-500 mt-8">
        <p>
          <strong>Notă:</strong> Când apăsați "Plătește Acum", veți fi redirecționat către procesatorul nostru securizat de plăți, Netopia Payments.
          După finalizarea plății, veți fi redirecționat înapoi pe site-ul nostru.
        </p>
      </div>
    </div>
  );
} 
