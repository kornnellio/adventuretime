'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getBookingById } from '@/lib/actions/booking';
import { getPaymentIntentById } from '@/lib/actions/paymentIntent';
import { getVoucherPurchaseById } from '@/lib/actions/voucherPurchase';
import { Loader2, AlertCircle, CheckCircle2, XCircle, ArrowRight, Gift } from 'lucide-react';

interface PaymentTransactionDetails {
  ntpID?: string;
  dateTime?: string | Date;
  cardMasked?: string;
  message?: string;
}

interface Adventure {
  title?: string;
  location?: string;
  images?: string[];
}

interface PaymentResultData {
  _id: string;
  intentId?: string;
  orderId?: string;
  adventureId: string;
  adventureTitle?: string;
  adventure?: Adventure;
  startDate: string | Date;
  endDate: string | Date;
  price: number;
  kayakSelections?: {
    caiacSingle: number;
    caiacDublu: number;
    placaSUP: number;
  };
  advancePaymentPercentage: number;
  advancePaymentAmount: number;
  paymentStatus: string;
  location?: string;
  paymentTransactionDetails?: PaymentTransactionDetails;
  [key: string]: any; // For any additional properties
}

export default function PaymentResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const intentId = searchParams.get('intentId');
  const voucherPurchaseId = searchParams.get('voucherPurchaseId');
  const id = voucherPurchaseId || intentId || bookingId;
  const isPaymentIntent = !!intentId;
  const isVoucherPurchase = !!voucherPurchaseId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResultData | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    async function fetchPaymentData() {
      if (!id) {
        setError('Nu a fost furnizat ID-ul rezervării, intenției de plată sau cumpărării de voucher');
        setLoading(false);
        return;
      }

      try {
        let result;
        
        if (isVoucherPurchase) {
          result = await getVoucherPurchaseById(id);
        } else if (isPaymentIntent) {
          result = await getPaymentIntentById(id);
        } else {
          result = await getBookingById(id);
        }

        if (!result.success || !result.data) {
          const entityType = isVoucherPurchase ? 'cumpărării de voucher' : (isPaymentIntent ? 'intenției de plată' : 'rezervării');
          setError(result.error || `Nu s-au putut încărca detaliile ${entityType}`);
          setLoading(false);
          return;
        }

        // Check if status is provided in URL (useful for dev mode)
        const statusFromUrl = searchParams.get('status');
        if (statusFromUrl && process.env.NODE_ENV === 'development') {
          // In dev mode, override status from URL parameter if provided
          if (isVoucherPurchase) {
            result.data.status = statusFromUrl;
          } else {
            result.data.paymentStatus = statusFromUrl;
          }
        }

        setPaymentResult(result.data as PaymentResultData);

        // If payment is still processing, continue auto-refresh
        const paymentStatus = isVoucherPurchase ? result.data.status : result.data.paymentStatus;
        if (paymentStatus === 'processing') {
          setAutoRefresh(true);
        } else {
          setAutoRefresh(false);
        }

        setLoading(false);
      } catch (error) {
        const entityType = isVoucherPurchase ? 'cumpărării de voucher' : (isPaymentIntent ? 'intenției de plată' : 'rezervării');
        console.error(`Eroare la încărcarea detaliilor ${entityType}:`, error);
        setError(`A apărut o eroare la încărcarea detaliilor ${entityType}`);
        setLoading(false);
      }
    }

    fetchPaymentData();
      }, [id, isPaymentIntent, isVoucherPurchase, refreshCount, searchParams]);

  // Auto-refresh every 5 seconds if payment is still processing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh && !loading) {
      interval = setInterval(() => {
        setRefreshCount(prev => prev + 1);
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, loading]);

  const handleManualRefresh = () => {
    setLoading(true);
    setRefreshCount(prev => prev + 1);
  };

  const getTitle = () => {
    if (!paymentResult) return isVoucherPurchase ? 'Rezultatul Cumpărării Voucherului' : 'Rezultatul Plății';
    
    const paymentStatus = isVoucherPurchase ? paymentResult.status : paymentResult.paymentStatus;
    
    if (paymentStatus === 'confirmed' || paymentStatus === 'completed') {
      return isVoucherPurchase ? 'Voucher Cumpărat cu Succes' : 'Plată Reușită';
    }
    if (paymentStatus === 'processing' || paymentStatus === 'payment_confirmed') return 'Procesare Plată';
    if (['declined', 'cancelled', 'error'].includes(paymentStatus)) {
      return isVoucherPurchase ? 'Cumpărare Voucher Eșuată' : 'Plată Eșuată';
    }
    return isVoucherPurchase ? 'Rezultatul Cumpărării Voucherului' : 'Rezultatul Plății';
  };

  const getPaymentStatus = () => {
    if (!paymentResult) return null;
    
    const status = isVoucherPurchase ? paymentResult.status : paymentResult.paymentStatus;
    
    if (status === 'confirmed' || status === 'completed' || status === 'payment_confirmed') {
      return (
        <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>{isVoucherPurchase ? 'Voucher Cumpărat cu Succes' : 'Plată Reușită'}</AlertTitle>
          <AlertDescription>
            {isVoucherPurchase
              ? 'Voucherul dvs. a fost cumpărat cu succes. Codul voucherului a fost trimis pe email.'
              : (isPaymentIntent
                ? 'Plata dvs. a fost procesată cu succes. Rezervarea dvs. a fost creată.'
                : 'Plata dvs. a fost procesată cu succes. Rezervarea dvs. este confirmată.')}
          </AlertDescription>
        </Alert>
      );
    }
    
    if (status === 'processing') {
      return (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200 text-yellow-800">
          <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />
          <AlertTitle>Procesare Plată</AlertTitle>
          <AlertDescription>
            Plata dvs. este în curs de procesare. Această pagină se va actualiza automat pentru a afișa statusul.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (['declined', 'cancelled', 'error', 'expired'].includes(status)) {
      return (
        <Alert className="mb-6 bg-red-50 border-red-200 text-red-800">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertTitle>Plată Eșuată</AlertTitle>
          <AlertDescription>
            {paymentResult.paymentTransactionDetails?.message || 'Plata dvs. nu a putut fi procesată. Vă rugăm să încercați din nou.'}
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Status Plată: {status}</AlertTitle>
        <AlertDescription>
          {paymentResult.paymentTransactionDetails?.message || 'Vă rugăm să verificați statusul plății dvs.'}
        </AlertDescription>
      </Alert>
    );
  };

  // Helper function to render voucher details
  const renderVoucherDetails = () => {
    if (!isVoucherPurchase || !paymentResult) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Gift className="mr-2 h-5 w-5" />
            Detalii Voucher
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Număr Comandă</p>
              <p className="font-medium">{paymentResult.orderId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valoare Voucher</p>
              <p className="font-medium">{paymentResult.voucherAmount} lei</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Plătit</p>
              <p className="font-medium">{paymentResult.totalAmount} lei</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{paymentResult.status}</p>
            </div>
          </div>
          
          {paymentResult.generatedCouponCode && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Codul Voucherului</h4>
              <p className="text-2xl font-bold text-blue-600 tracking-wider">
                {paymentResult.generatedCouponCode}
              </p>
              <p className="text-sm text-blue-600 mt-2">
                Salvează acest cod pentru a-l folosi la următoarea rezervare!
              </p>
            </div>
          )}
          
          {paymentResult.paymentTransactionDetails && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold mb-2">Detalii Tranzacție</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                {paymentResult.paymentTransactionDetails.ntpID && (
                  <p>ID Tranzacție: {paymentResult.paymentTransactionDetails.ntpID}</p>
                )}
                {paymentResult.paymentTransactionDetails.dateTime && (
                  <p>Data: {new Date(paymentResult.paymentTransactionDetails.dateTime).toLocaleString('ro-RO')}</p>
                )}
                {paymentResult.paymentTransactionDetails.cardMasked && (
                  <p>Card: {paymentResult.paymentTransactionDetails.cardMasked}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Helper function to calculate total price
  const calculateTotalPrice = (): number => {
    if (!paymentResult || !paymentResult.kayakSelections) {
      // Fallback to price if no kayak selections (legacy data)
      return paymentResult?.price || 0;
    }
    
    return (
      (paymentResult.kayakSelections.caiacSingle || 0) * paymentResult.price + 
      (paymentResult.kayakSelections.caiacDublu || 0) * paymentResult.price * 2 + 
      (paymentResult.kayakSelections.placaSUP || 0) * paymentResult.price
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Se verifică statusul plății...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl py-12">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Eroare</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/adventures')}>
          Înapoi la Aventuri
        </Button>
      </div>
    );
  }

  if (!paymentResult) {
    return (
      <div className="container mx-auto max-w-4xl py-12">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nu s-a găsit</AlertTitle>
          <AlertDescription>
            Informațiile despre {isPaymentIntent ? 'intenția de plată' : 'rezervare'} nu au putut fi găsite.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/adventures')}>
          Înapoi la Aventuri
        </Button>
      </div>
    );
  }

  const title = isPaymentIntent ? paymentResult.adventureTitle : paymentResult.adventure?.title;
  const paymentStatus = paymentResult.paymentStatus;
  const showPayButton = isPaymentIntent && ['pending', 'declined', 'cancelled', 'error', 'expired'].includes(paymentStatus);
  const showMyBookingsButton = paymentStatus === 'confirmed' || (!isPaymentIntent && paymentStatus !== 'processing');

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <h1 className="text-3xl font-bold mb-8">{getTitle()}</h1>
      
      {getPaymentStatus()}
      
      {isVoucherPurchase ? renderVoucherDetails() : (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{title || 'Rezervare Aventură'}</CardTitle>
          <CardDescription>
            {isPaymentIntent
              ? `Referință Plată: ${paymentResult.intentId}`
              : `Referință Rezervare: ${paymentResult._id}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Detalii Aventură</h3>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Data de început:</span>{' '}
                {new Date(paymentResult.startDate).toLocaleDateString('ro-RO')}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Data de sfârșit:</span>{' '}
                {new Date(paymentResult.endDate).toLocaleDateString('ro-RO')}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Status:</span>{' '}
                <span className="capitalize">{paymentResult.paymentStatus.replace(/_/g, ' ')}</span>
              </p>
              {(paymentResult.location || paymentResult.adventure?.location) && (
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Locație:</span>{' '}
                  {paymentResult.location || paymentResult.adventure?.location}
                </p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Detalii Plată</h3>
              
              {paymentResult.kayakSelections && (
                <>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Ambarcațiuni selectate:</h4>
                  {paymentResult.kayakSelections.caiacSingle > 0 && (
                    <p className="text-sm text-gray-600 mb-1 ml-2">
                      <span className="font-medium">Caiac Single:</span> {paymentResult.kayakSelections.caiacSingle} x {paymentResult.price} RON
                    </p>
                  )}
                  {paymentResult.kayakSelections.caiacDublu > 0 && (
                    <p className="text-sm text-gray-600 mb-1 ml-2">
                      <span className="font-medium">Caiac Dublu:</span> {paymentResult.kayakSelections.caiacDublu} x {paymentResult.price * 2} RON
                    </p>
                  )}
                  {paymentResult.kayakSelections.placaSUP > 0 && (
                    <p className="text-sm text-gray-600 mb-1 ml-2">
                      <span className="font-medium">Placă SUP:</span> {paymentResult.kayakSelections.placaSUP} x {paymentResult.price} RON
                    </p>
                  )}
                </>
              )}
              
              <p className="text-sm text-gray-600 mb-1 mt-2">
                <span className="font-medium">Preț Total:</span>{' '}
                {Math.round(calculateTotalPrice())} lei
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Plată în Avans ({paymentResult.advancePaymentPercentage}%):</span>{' '}
                {Math.round(paymentResult.advancePaymentAmount || 0)} lei
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Rest de plată:</span>{' '}
                {Math.round(calculateTotalPrice() - (paymentResult.advancePaymentAmount || 0))} lei
              </p>
              {paymentResult.paymentTransactionDetails?.ntpID && (
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">ID Tranzacție:</span>{' '}
                  {paymentResult.paymentTransactionDetails.ntpID}
                </p>
              )}
            </div>
          </div>
          
          {paymentResult.paymentTransactionDetails && (
            <div className="mt-6 border-t pt-4">
              <h3 className="font-semibold text-lg mb-2">Detalii Tranzacție</h3>
              {paymentResult.paymentTransactionDetails.dateTime && (
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Data:</span>{' '}
                  {new Date(paymentResult.paymentTransactionDetails.dateTime).toLocaleString('ro-RO')}
                </p>
              )}
              {paymentResult.paymentTransactionDetails.message && (
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Mesaj:</span>{' '}
                  {paymentResult.paymentTransactionDetails.message}
                </p>
              )}
              {paymentResult.paymentTransactionDetails.cardMasked && (
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Card:</span>{' '}
                  {paymentResult.paymentTransactionDetails.cardMasked}
                </p>
              )}
            </div>
          )}
          
          {paymentStatus === 'processing' && (
            <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Plată în Curs</h3>
              <p className="text-sm text-blue-800 mb-2">
                Plata dvs. este în curs de procesare. Această pagină se va actualiza automat la fiecare câteva secunde
                pentru a verifica actualizările.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleManualRefresh}
                className="flex items-center space-x-1 text-blue-600 border-blue-300"
              >
                <span>Actualizare Acum</span>
                <Loader2 className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          {showMyBookingsButton && (
            <Button
              variant="default"
              className="flex-1 flex items-center"
              onClick={() => router.push('/dashboard/bookings')}
            >
              <span>Vezi Rezervările Mele</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          
          {showPayButton && intentId && (
            <Button
              variant="default"
              className="flex-1"
              onClick={() => router.push(`/booking/payment-intent?intentId=${intentId}`)}
            >
              Încearcă Plata din Nou
            </Button>
          )}
          
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/adventures')}
          >
            Înapoi la Aventuri
          </Button>
        </CardFooter>
      </Card>
      )}
    </div>
  );
} 