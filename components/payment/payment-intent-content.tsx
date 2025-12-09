'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getPaymentIntentById, initiatePaymentWithPhoneNumber } from '@/lib/actions/paymentIntent';
import { Loader2, AlertCircle, CheckCircle2, XCircle, Phone, Calendar, MapPin, Clock, CreditCard, User, Waves } from 'lucide-react';
import { PhoneInput } from "@/components/ui/phone-input";
import { Separator } from '@/components/ui/separator';

interface PaymentTransactionDetails {
  ntpID?: string;
  dateTime?: string | Date;
  cardMasked?: string;
  message?: string;
}

interface PaymentIntentData {
  _id: string;
  intentId: string;
  adventureId: string;
  adventureTitle: string;
  startDate: string | Date;
  endDate: string | Date;
  price: number;
  kayakSelections: {
    caiacSingle: number;
    caiacDublu: number;
    placaSUP: number;
  };
  advancePaymentPercentage: number;
  advancePaymentAmount: number;
  phoneNumber?: string;
  paymentStatus: string;
  location?: string;
  paymentTransactionDetails?: PaymentTransactionDetails;
  // Coupon related fields
  couponCode?: string;
  couponType?: 'percentage' | 'fixed';
  couponValue?: number;
  couponDiscount?: number;
  originalPrice?: number;
  [key: string]: any; // For any additional properties
}

export default function PaymentIntentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intentId = searchParams.get('intentId');

  // State to capture user's phone number
  const [phone, setPhone] = useState("");
  const [validPhone, setValidPhone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentData | null>(null);

  // Fetch payment intent details when the component mounts
  useEffect(() => {
    async function fetchPaymentIntentDetails() {
      if (!intentId) {
        setError('Nu a fost furnizat ID-ul intenției de plată');
        setLoading(false);
        return;
      }

      try {
        // Get the payment intent details
        const result = await getPaymentIntentById(intentId);
        
        if (!result.success || !result.data) {
          setError(result.error || 'Nu s-au putut încărca detaliile intenției de plată');
          setLoading(false);
          return;
        }

        const pi = result.data as PaymentIntentData;
        setPaymentIntent(pi);
        // Initialize phone if already stored on intent
        if (pi.phoneNumber) {
          setPhone(pi.phoneNumber);
          // Validate phone number
          const phoneRegex = /^07\d{8}$/;
          const cleanPhone = pi.phoneNumber.replace(/\s+/g, "");
          setValidPhone(phoneRegex.test(cleanPhone));
        }
        setLoading(false);
        
        // If payment status is already confirmed, redirect to result page
        if (result.data.paymentStatus === 'confirmed') {
          router.push(`/booking/payment-result?intentId=${intentId}`);
        }
      } catch (error) {
        console.error('Eroare la încărcarea detaliilor intenției de plată:', error);
        setError('A apărut o eroare la încărcarea detaliilor intenției de plată');
        setLoading(false);
      }
    }

    fetchPaymentIntentDetails();
  }, [intentId, router]);

  // Function to initiate payment
  const handleCreatePaymentIntent = async () => {
    if (!intentId) {
      setError("Nu a fost furnizat ID-ul rezervării.");
      return;
    }
    
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
    setProcessing(true);
    
    try {
      const result = await initiatePaymentWithPhoneNumber(intentId, cleanPhone);
      
      if (result.success && result.data && result.data.paymentUrl) {
        // Open the payment URL in a new window
        window.open(result.data.paymentUrl, '_blank');
        
        // Redirect to payment result page
        router.push(`/booking/payment-result?intentId=${intentId}&status=processing`);
      } else {
        setError(result.error || "A apărut o eroare la procesarea plății. Te rugăm să încerci din nou.");
      }
    } catch (error) {
      console.error("Eroare la inițierea plății cu număr de telefon:", error);
      setError("A apărut o eroare la procesarea plății. Te rugăm să încerci din nou.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg font-medium">Se încarcă detaliile plății...</p>
      </div>
    );
  }

  if (!paymentIntent) {
    return (
      <div className="container mx-auto max-w-4xl py-16">
        <Alert variant="destructive" className="mb-6 shadow-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nu s-a găsit</AlertTitle>
          <AlertDescription>Informațiile despre plată nu au putut fi găsite.</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/adventures')}>
          Înapoi la Aventuri
        </Button>
      </div>
    );
  }

  const isPendingPayment = ['pending', 'processing'].includes(paymentIntent.paymentStatus);
  const isPaymentFailed = ['declined', 'expired', 'error', 'cancelled'].includes(paymentIntent.paymentStatus);
  
  // Determine if payment button should be disabled
  const disablePaymentButton = processing || paymentIntent.paymentStatus === 'confirmed';

  // Calculate total price and remaining payment
  const totalPrice = Math.round(
    (paymentIntent.kayakSelections?.caiacSingle || 0) * paymentIntent.price +
    (paymentIntent.kayakSelections?.caiacDublu || 0) * paymentIntent.price * 2 +
    (paymentIntent.kayakSelections?.placaSUP || 0) * paymentIntent.price
  );
  
  // Calculate original price before coupon discount
  const originalTotalPrice = paymentIntent.originalPrice || totalPrice;
  const finalPrice = paymentIntent.couponDiscount ? Math.max(0, originalTotalPrice - paymentIntent.couponDiscount) : totalPrice;
  
  const remainingPayment = Math.round(finalPrice - paymentIntent.advancePaymentAmount);

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6">
      <h1 className="text-3xl font-bold mb-2 text-center">Finalizare Plată</h1>
      <p className="text-gray-400 mb-6 text-center">Completează informațiile necesare pentru a continua cu plata</p>
      
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Eroare</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status Alerts */}
      {paymentIntent.paymentStatus === 'confirmed' && (
        <Alert className="mb-6 border border-green-600 bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Plată Finalizată</AlertTitle>
          <AlertDescription>
            Plata dvs. a fost procesată cu succes și rezervarea a fost creată.
          </AlertDescription>
        </Alert>
      )}
      
      {paymentIntent.paymentStatus === 'awaiting confirmation' && (
        <Alert className="mb-6 border border-green-600 bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Plată Finalizată</AlertTitle>
          <AlertDescription>
            Plata dvs. a fost procesată cu succes și rezervarea a fost creată. Vă vom contacta în curând pentru confirmarea finală în funcție de disponibilitatea locurilor.
          </AlertDescription>
        </Alert>
      )}
      
      {isPendingPayment && (
        <Alert className="mb-6 border border-yellow-600 bg-yellow-950/20">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertTitle>Plată Necesară</AlertTitle>
          <AlertDescription>
            Vă rugăm să finalizați plata pentru a confirma rezervarea aventurii.
          </AlertDescription>
        </Alert>
      )}
      
      {isPaymentFailed && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Plată Eșuată</AlertTitle>
          <AlertDescription>
            {paymentIntent.paymentTransactionDetails?.message || 'Plata dvs. nu a putut fi procesată. Vă rugăm să încercați din nou.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Adventure Details Card */}
        <div className="lg:col-span-2">
          <Card className="h-full border border-gray-800 bg-gray-950/50">
            <CardHeader className="border-b border-gray-800 bg-gray-900">
              <div className="flex items-center gap-2">
                <Waves className="h-5 w-5 text-white" />
                <CardTitle>{paymentIntent.adventureTitle}</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Referință Rezervare: {paymentIntent.intentId}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-5">
              <div className="space-y-5">
                <div className="flex flex-col md:flex-row md:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-gray-400">Data Aventurii</p>
                      <p className="font-semibold">
                        {new Date(paymentIntent.startDate).toLocaleDateString('ro-RO')}
                        {paymentIntent.endDate && paymentIntent.endDate !== paymentIntent.startDate && 
                          ` - ${new Date(paymentIntent.endDate).toLocaleDateString('ro-RO')}`}
                      </p>
                    </div>
                  </div>
                  
                  {paymentIntent.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-gray-400">Locație</p>
                        <p className="font-semibold">{paymentIntent.location}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <Separator className="bg-gray-800" />
                
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center">
                    <Waves className="h-4 w-4 mr-2 text-gray-400" />
                    Detalii Ambarcațiuni
                  </h3>
                  <div className="space-y-2">
                    {paymentIntent.kayakSelections?.caiacSingle > 0 && (
                      <div className="flex justify-between items-center py-3 px-4 border border-gray-800 rounded-md bg-gray-900/50">
                        <span className="font-medium">Caiac Single</span>
                        <div className="text-right">
                          <span className="font-semibold">{paymentIntent.kayakSelections.caiacSingle} x {paymentIntent.price} lei</span>
                          <p className="text-sm text-gray-400">
                            {paymentIntent.kayakSelections.caiacSingle} x {paymentIntent.price} = {paymentIntent.kayakSelections.caiacSingle * paymentIntent.price} lei
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {paymentIntent.kayakSelections?.caiacDublu > 0 && (
                      <div className="flex justify-between items-center py-3 px-4 border border-gray-800 rounded-md bg-gray-900/50">
                        <span className="font-medium">Caiac Dublu</span>
                        <div className="text-right">
                          <span className="font-semibold">{paymentIntent.kayakSelections.caiacDublu} x {paymentIntent.price * 2} lei</span>
                          <p className="text-sm text-gray-400">
                            {paymentIntent.kayakSelections.caiacDublu} x {paymentIntent.price * 2} = {paymentIntent.kayakSelections.caiacDublu * paymentIntent.price * 2} lei
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {paymentIntent.kayakSelections?.placaSUP > 0 && (
                      <div className="flex justify-between items-center py-3 px-4 border border-gray-800 rounded-md bg-gray-900/50">
                        <span className="font-medium">Placă SUP</span>
                        <div className="text-right">
                          <span className="font-semibold">{paymentIntent.kayakSelections.placaSUP} x {paymentIntent.price} lei</span>
                          <p className="text-sm text-gray-400">
                            {paymentIntent.kayakSelections.placaSUP} x {paymentIntent.price} = {paymentIntent.kayakSelections.placaSUP * paymentIntent.price} lei
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {paymentIntent.paymentTransactionDetails && (
                  <>
                    <Separator className="bg-gray-800" />
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                        Detalii Ultima Tranzacție
                      </h3>
                      <div className="border border-gray-800 p-4 rounded-md bg-gray-900/50 space-y-2">
                        {paymentIntent.paymentTransactionDetails.dateTime && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Data:</span>
                            <span className="font-medium">
                              {new Date(paymentIntent.paymentTransactionDetails.dateTime).toLocaleString('ro-RO')}
                            </span>
                          </div>
                        )}
                        
                        {paymentIntent.paymentTransactionDetails.message && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Status:</span>
                            <span className="font-medium capitalize">
                              {paymentIntent.paymentTransactionDetails.message}
                            </span>
                          </div>
                        )}
                        
                        {paymentIntent.paymentTransactionDetails.cardMasked && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Card:</span>
                            <span className="font-medium">
                              {paymentIntent.paymentTransactionDetails.cardMasked}
                            </span>
                          </div>
                        )}
                        
                        {paymentIntent.paymentTransactionDetails.ntpID && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">ID Tranzacție:</span>
                            <span className="font-medium">
                              {paymentIntent.paymentTransactionDetails.ntpID}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                
                {/* Coupon Information */}
                {paymentIntent.couponCode && (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-green-500" />
                        Cupon Aplicat
                      </h3>
                      <div className="border border-green-600 bg-green-950/20 p-4 rounded-md space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Cod cupon:</span>
                          <span className="font-bold text-green-400">{paymentIntent.couponCode}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Tip reducere:</span>
                          <span className="font-medium text-green-400">
                            {paymentIntent.couponType === 'percentage' 
                              ? `${paymentIntent.couponValue}%` 
                              : `${paymentIntent.couponValue} lei`
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Reducere aplicată:</span>
                          <span className="font-bold text-green-400">-{Math.round(paymentIntent.couponDiscount || 0)} lei</span>
                        </div>
                      </div>
                    </div>
                    <Separator className="bg-gray-800" />
                  </>
                )}
                
                <div className="p-4 rounded-md border border-gray-800 bg-gray-900">
                  <h3 className="font-semibold mb-2 flex items-center text-white">
                    <AlertCircle className="h-4 w-4 mr-2 text-white" />
                    Informații Importante
                  </h3>
                  <p className="text-sm text-gray-300">
                    Rezervarea dvs. va fi confirmată doar după verificarea manuală a disponibilității și confirmarea din partea noastră.
                    Plata este necesară pentru a putea procesa rezervarea dvs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Payment Summary and Contact Info */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Phone Input Card */}
            <Card className="border border-gray-800 bg-gray-950/50">
              <CardHeader className="pb-2 border-b border-gray-800 bg-gray-900">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  Informații Contact
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Vă vom contacta dacă este necesar
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    isValid={validPhone}
                    required
                    helperText="Introduceți un număr de telefon valid"
                    disabled={loading}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Payment Summary Card */}
            <Card className="border border-gray-800 bg-gray-950/50">
              <CardHeader className="pb-2 border-b border-gray-800 bg-gray-900">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  Rezumat Plată
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Detaliile sumei de plată
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {paymentIntent.couponCode && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Preț original:</span>
                        <span className="font-semibold line-through text-gray-500">{Math.round(originalTotalPrice)} lei</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Cupon ({paymentIntent.couponCode}):</span>
                        <span className="font-semibold text-green-400">-{Math.round(paymentIntent.couponDiscount || 0)} lei</span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">{paymentIntent.couponCode ? 'Preț final:' : 'Preț Total:'}</span>
                    <span className="font-semibold">{Math.round(finalPrice)} lei</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Avans ({paymentIntent.advancePaymentPercentage}%):</span>
                    <span className="font-semibold">{Math.round(paymentIntent.advancePaymentAmount)} lei</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Rest de plată la fața locului:</span>
                    <span className="font-semibold">{remainingPayment} lei</span>
                  </div>
                  
                  <Separator className="bg-gray-800" />
                  
                  <div className="flex justify-between items-center pt-2 text-lg">
                    <span className="font-medium">Total de plătit acum:</span>
                    <span className="font-bold text-white">{Math.round(paymentIntent.advancePaymentAmount)} lei</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  variant="default"
                  size="lg"
                  className="w-full py-6 text-lg font-bold bg-white hover:bg-gray-200 text-black border-0"
                  disabled={disablePaymentButton}
                  onClick={handleCreatePaymentIntent}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Se procesează
                    </>
                  ) : paymentIntent.paymentStatus === 'confirmed' ? (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" /> Plată Finalizată
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" /> Plătește {Math.round(paymentIntent.advancePaymentAmount)} lei
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full border border-gray-700 hover:bg-gray-800"
                  onClick={() => router.push('/adventures')}
                >
                  Înapoi la Aventuri
                </Button>
              </CardFooter>
            </Card>
            
            {/* Payment Provider Info */}
            <div className="text-sm text-gray-400 p-4 border border-gray-800 rounded-md bg-gray-900/30">
              <p className="flex items-start gap-2">
                <CreditCard className="h-4 w-4 flex-shrink-0 mt-0.5" />
                Plata se procesează securizat prin Netopia Payments.
                După finalizare, veți fi redirecționat înapoi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 