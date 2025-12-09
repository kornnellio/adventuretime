'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { createBooking } from '@/lib/actions/booking';
import { createPaymentIntent } from '@/lib/actions/paymentIntent';
import { getAdventureById } from '@/lib/actions/adventure';
import { validateCoupon } from '@/lib/actions/coupon';
import { useAuth } from '@/lib/hooks/use-auth';
import { CheckCircle2, Loader2, Plus, Minus, X, Tag } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BookingFormProps {
  adventureId: string;
  adventureTitle: string;
  adventurePrice: number;
  adventureDate: Date;
  availableKayakTypes?: {
    caiacSingle: boolean;
    caiacDublu: boolean;
    placaSUP: boolean;
  };
  advancePaymentPercentage?: number;
}

interface KayakSelections {
  caiacSingle: number;
  caiacDublu: number;
  placaSUP: number;
}

export function BookingForm({
  adventureId,
  adventureTitle,
  adventurePrice,
  adventureDate,
  availableKayakTypes = { caiacSingle: true, caiacDublu: false, placaSUP: false },
  advancePaymentPercentage = 30, // Default to 30% if not provided
}: BookingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [kayakSelections, setKayakSelections] = useState<KayakSelections>({
    caiacSingle: 0,
    caiacDublu: 0,
    placaSUP: 0
  });
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    discount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Calculate base price based on kayak selections
  const basePrice = 
    (kayakSelections.caiacSingle * adventurePrice) + 
    (kayakSelections.caiacDublu * adventurePrice * 2) + 
    (kayakSelections.placaSUP * adventurePrice);
  
  // Calculate total price after any coupon discount
  const totalPrice = appliedCoupon 
    ? Math.max(0, basePrice - appliedCoupon.discount)
    : basePrice;
  
  // Calculate advance payment amount
  const advancePaymentAmount = Math.round(totalPrice * advancePaymentPercentage / 100);
  const remainingAmount = Math.round(totalPrice - advancePaymentAmount);
  
  // Calculate total people count
  const totalPeople = 
    kayakSelections.caiacSingle + 
    (kayakSelections.caiacDublu * 2) + 
    kayakSelections.placaSUP;
  
  // Ensure the selected date is a valid date
  const bookingDate = adventureDate instanceof Date && !isNaN(adventureDate.getTime()) 
    ? adventureDate 
    : new Date();
  
  // Check if at least one kayak is selected
  const atLeastOneKayakSelected = 
    kayakSelections.caiacSingle > 0 || 
    kayakSelections.caiacDublu > 0 || 
    kayakSelections.placaSUP > 0;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Autentificare necesară",
        description: "Te rugăm să te autentifici pentru a continua rezervarea.",
        variant: "destructive"
      });
      // Redirect to login page
      router.push(`/login?redirect=/booking/${adventureId}?date=${bookingDate.toISOString()}`);
      return;
    }
    
    if (!atLeastOneKayakSelected) {
      toast({
        title: "Selecție necesară",
        description: "Te rugăm să selectezi cel puțin un caiac sau o placă SUP.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);

      // Use createPaymentIntent for advance/full payment to generate payment URL
      const response = await createPaymentIntent(
        adventureId,
        user.id,
        bookingDate,
        comments,
        kayakSelections,
        appliedCoupon ? {
          code: appliedCoupon.code,
          type: appliedCoupon.type,
          value: appliedCoupon.value,
          discount: appliedCoupon.discount
        } : undefined
      );
      
      if (response.success) {
        // Set redirecting state to show loading UI
        setRedirecting(true);
        
        // NEW LOGIC: Redirect to the phone number entry page with the intentId
        if (response.data && response.data.intentId) {
          router.push(`/booking/payment-intent?intentId=${response.data.intentId}`);
        } else {
          // This case should ideally not be reached if createPaymentIntent always returns an intentId on success.
          // Consider if this fallback is still appropriate or if it indicates an unexpected error.
          console.error("PaymentIntent creation succeeded but no intentId was returned.", response);
          toast({
            title: "Eroare Intermediară",
            description: "Intentul de plată a fost creat, dar ID-ul lipsește. Te rugăm încearcă din nou.",
            variant: "destructive"
          });
          setIsSubmitting(false);
          setRedirecting(false); // Reset redirecting state
          // router.push('/dashboard/bookings'); // Original fallback, review if needed
        }
      } else {
        toast({
          title: "Eroare",
          description: response.error || "A apărut o eroare la procesarea rezervării.",
          variant: "destructive"
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la procesarea rezervării. Te rugăm să încerci din nou.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };
  
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Te rugăm să introduci un cod promoțional');
      return;
    }
    
    setIsValidatingCoupon(true);
    setCouponError(null);
    
    try {
      const result = await validateCoupon(couponCode, adventureId, basePrice);
      
      if (result.success && result.valid && result.data) {
        // Calculate discount amount
        const coupon = result.data;
        let discountAmount = 0;
        
        if (coupon.type === 'percentage') {
          discountAmount = Math.round((basePrice * coupon.value) / 100);
        } else { // fixed discount
          discountAmount = Math.min(coupon.value, basePrice); // Can't discount more than base price
        }
        
        setAppliedCoupon({
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          discount: discountAmount
        });
        
        toast({
          title: "Cupon aplicat",
          description: `Cuponul "${coupon.code}" a fost aplicat cu succes.`,
          variant: "default"
        });
      } else {
        setCouponError(result.message || 'Cupon invalid sau expirat');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError('A apărut o eroare la validarea cuponului');
    } finally {
      setIsValidatingCoupon(false);
    }
  };
  
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };
  
  const increment = (type: keyof KayakSelections) => {
    const newSelections = {
      ...kayakSelections,
      [type]: kayakSelections[type] + 1
    };
    
    // Update the kayak selections
    setKayakSelections(newSelections);
    
    // If coupon is applied, recalculate the discount
    if (appliedCoupon) {
      // Calculate the new base price
      const newBasePrice = 
        (newSelections.caiacSingle * adventurePrice) + 
        (newSelections.caiacDublu * adventurePrice * 2) + 
        (newSelections.placaSUP * adventurePrice);
      
      // Calculate the new discount
      let newDiscount = 0;
      if (appliedCoupon.type === 'percentage') {
        newDiscount = Math.round((newBasePrice * appliedCoupon.value) / 100);
      } else { // fixed discount
        newDiscount = Math.min(appliedCoupon.value, newBasePrice);
      }
      
      // Update the applied coupon with the new discount
      setAppliedCoupon({
        ...appliedCoupon,
        discount: newDiscount
      });
    }
  };
  
  const decrement = (type: keyof KayakSelections) => {
    // Don't allow negative values
    if (kayakSelections[type] <= 0) return;
    
    const newSelections = {
      ...kayakSelections,
      [type]: kayakSelections[type] - 1
    };
    
    // Update the kayak selections
    setKayakSelections(newSelections);
    
    // If coupon is applied, recalculate the discount
    if (appliedCoupon) {
      // Calculate the new base price
      const newBasePrice = 
        (newSelections.caiacSingle * adventurePrice) + 
        (newSelections.caiacDublu * adventurePrice * 2) + 
        (newSelections.placaSUP * adventurePrice);
      
      // Calculate the new discount
      let newDiscount = 0;
      if (appliedCoupon.type === 'percentage') {
        newDiscount = Math.round((newBasePrice * appliedCoupon.value) / 100);
      } else { // fixed discount
        newDiscount = Math.min(appliedCoupon.value, newBasePrice);
      }
      
      // Update the applied coupon with the new discount
      setAppliedCoupon({
        ...appliedCoupon,
        discount: newDiscount
      });
    }
  };
  
  if (redirecting) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-6">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
        
        <h3 className="text-2xl font-bold mb-4">Te redirecționăm către pagina de plată...</h3>
        
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Vei fi redirecționat în câteva momente către pagina de plată pentru a finaliza rezervarea ta pentru aventura "{adventureTitle}".
        </p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Rezumat rezervare</h3>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between mb-2">
            <span>Aventură:</span>
            <span className="font-medium">{adventureTitle}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Data:</span>
            <span className="font-medium">
              {bookingDate.toLocaleDateString('ro-RO')}
            </span>
          </div>
          <div className="flex justify-between mb-4">
            <span>Preț per persoană:</span>
            <span className="font-medium">{adventurePrice} lei</span>
          </div>
          
          <h4 className="font-semibold mb-3">Selectează numărul și tipul ambarcațiunilor:</h4>
          
          {availableKayakTypes.caiacSingle && (
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-medium">Caiac single</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">1 persoană</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  type="button"
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => decrement('caiacSingle')}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-6 text-center">{kayakSelections.caiacSingle}</span>
                <Button 
                  type="button"
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => increment('caiacSingle')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {availableKayakTypes.caiacDublu && (
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-medium">Caiac dublu</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">2 persoane</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  type="button"
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => decrement('caiacDublu')}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-6 text-center">{kayakSelections.caiacDublu}</span>
                <Button 
                  type="button"
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => increment('caiacDublu')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {availableKayakTypes.placaSUP && (
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="font-medium">Placă SUP</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">1 persoană</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  type="button"
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => decrement('placaSUP')}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-6 text-center">{kayakSelections.placaSUP}</span>
                <Button 
                  type="button"
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => increment('placaSUP')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Coupon code input */}
          <div className="my-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold mb-2 flex items-center">
              <Tag className="h-4 w-4 mr-1" />
              Cod promoțional
            </h4>
            
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-2 rounded">
                <div>
                  <span className="font-medium text-green-700 dark:text-green-400">
                    {appliedCoupon.code}
                  </span>
                  <p className="text-xs text-green-600 dark:text-green-500">
                    {appliedCoupon.type === 'percentage' 
                      ? `Reducere ${appliedCoupon.value}%` 
                      : `Reducere ${appliedCoupon.value} lei`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-500"
                  onClick={removeCoupon}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Introdu codul promoțional"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="h-9"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="whitespace-nowrap"
                  onClick={handleApplyCoupon}
                  disabled={isValidatingCoupon || !couponCode.trim()}
                >
                  {isValidatingCoupon ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Aplică'
                  )}
                </Button>
              </div>
            )}
            
            {couponError && (
              <p className="text-xs text-red-500 mt-1">{couponError}</p>
            )}
          </div>
          
          <div className="border-t pt-4 border-gray-200 dark:border-gray-700">
            {totalPeople > 0 && (
              <div className="flex justify-between mb-2 text-gray-500">
                <span>Total participanți:</span>
                <span className="font-medium">{totalPeople} persoane</span>
              </div>
            )}
            
            {/* Show the original price and discount if a coupon is applied */}
            {appliedCoupon && (
              <>
                <div className="flex justify-between mb-1 text-gray-500">
                  <span>Preț inițial:</span>
                  <span className="font-medium line-through">{basePrice} lei</span>
                </div>
                <div className="flex justify-between mb-2 text-green-600 dark:text-green-500">
                  <span>Discount:</span>
                  <span className="font-medium">-{appliedCoupon.discount} lei</span>
                </div>
              </>
            )}
            
            <div className="flex justify-between mb-2 font-semibold">
              <span>Preț total:</span>
              <span>{totalPrice} lei</span>
            </div>
            <div className="flex justify-between mb-2 text-orange-600 dark:text-orange-400">
              <span>Avans (Acum):</span>
              <span className="font-medium">{advancePaymentAmount} lei</span>
            </div>
            <div className="flex justify-between mb-2 text-gray-500">
              <span>Rest de plată (Numerar):</span>
              <span className="font-medium">{remainingAmount} lei</span>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <label htmlFor="comments" className="block text-sm font-medium mb-1">
          Cerințe speciale sau comentarii
        </label>
        <Textarea
          id="comments"
          placeholder="Orice cerințe speciale sau comentarii pentru rezervarea ta..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="resize-none"
        />
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md mb-4">
        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
          Important: Rezervarea va fi confirmată doar după procesarea plății
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
          După ce confirmi rezervarea, vei fi redirecționat către pagina de plată pentru a finaliza procesul. Locul tău va fi rezervat doar după ce plata a fost procesată cu succes.
        </p>
      </div>
      
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting || !atLeastOneKayakSelected}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
            Se procesează...
          </>
        ) : (
          'Continuă către plată'
        )}
      </Button>
    </form>
  );
} 
