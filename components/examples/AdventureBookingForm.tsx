'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CaiacSelection, CaiacSelections } from '../CaiacSelection';
import { CaiacSelectionSummary } from '../CaiacSelectionSummary';
import { Textarea } from '../ui/textarea';
import { createBooking } from '@/lib/actions/booking';

// Helper function to convert CaiacSelections to the backend format
const mapCaiacSelections = (selections: CaiacSelections): { caiacSingle: number; caiacDublu: number; placaSUP: number } => {
  return {
    caiacSingle: selections.single,
    caiacDublu: selections.double,
    placaSUP: selections.sup
  };
};

export interface AdventureBookingFormProps {
  adventureId: string;
  userId: string;
  adventurePrice: number;
  advancePaymentPercentage: number;
  availableCaiacs: {
    single: boolean;
    double: boolean;
    sup: boolean;
  };
  adventureTitle: string;
  availableDates?: Date[];
}

export function AdventureBookingForm({
  adventureId,
  userId,
  adventurePrice,
  advancePaymentPercentage,
  availableCaiacs,
  adventureTitle,
  availableDates = [],
}: AdventureBookingFormProps) {
  // State for form values
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [caiacSelections, setCaiacSelections] = useState<CaiacSelections>({
    single: 0,
    double: 0,
    sup: 0,
  });
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate total price for display
  const totalPrice = 
    (caiacSelections.single * adventurePrice) + 
    (caiacSelections.double * adventurePrice * 2) + 
    (caiacSelections.sup * adventurePrice);
  
  const advancePayment = Math.round(totalPrice * (advancePaymentPercentage / 100));
  
  // Check if any item is selected
  const isAnySelected = 
    caiacSelections.single > 0 || 
    caiacSelections.double > 0 || 
    caiacSelections.sup > 0;

  // Handle form submission
  const handleSubmit = async () => {
    // Reset previous errors/results
    setError(null);
    setBookingResult(null);
    
    // Validate form
    if (!date) {
      setError('Te rugăm să selectezi o dată pentru aventură.');
      return;
    }
    
    if (!isAnySelected) {
      setError('Te rugăm să selectezi cel puțin un caiac sau o placă SUP.');
      return;
    }
    
    // Submit form
    setIsSubmitting(true);
    try {
      const result = await createBooking(
        adventureId,
        userId,
        date,
        comments,
        mapCaiacSelections(caiacSelections)
      );
      
      if (result.success) {
        setBookingResult(result.data);
      } else {
        setError(result.error || 'A apărut o eroare la crearea rezervării.');
      }
    } catch (err) {
      setError('A apărut o eroare la procesarea rezervării.');
      console.error('Booking error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // If booking was successful, show confirmation
  if (bookingResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">Rezervare Confirmată</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Detalii Rezervare</h3>
            <p className="text-sm text-muted-foreground">{adventureTitle}</p>
          </div>
          
          <div>
            <h3 className="font-medium">Data</h3>
            <p className="text-sm">{format(date!, 'dd MMMM yyyy')}</p>
          </div>
          
          <CaiacSelectionSummary 
            caiacSelections={caiacSelections}
            showPrices={true}
            basePrice={adventurePrice}
            variant="detailed"
          />
          
          <div className="border rounded-md p-4 space-y-2">
            <div className="flex justify-between">
              <span>Total:</span>
              <span className="font-medium">{formatPrice(totalPrice)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Avans ({advancePaymentPercentage}%):</span>
              <span>{formatPrice(advancePayment)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Rest de plată:</span>
              <span>{formatPrice(totalPrice - advancePayment)}</span>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium">ID Rezervare</h3>
            <p className="text-sm">{bookingResult.orderId}</p>
          </div>
          
          <div>
            <h3 className="font-medium">Status</h3>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {bookingResult.status}
            </div>
          </div>
          
          {comments && (
            <div>
              <h3 className="font-medium">Comentarii</h3>
              <p className="text-sm">{comments}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
            Rezervă o altă aventură
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rezervă {adventureTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Selectează Data</h3>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "dd MMMM yyyy") : "Selectează o dată"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                disabled={(date) => 
                  availableDates.length > 0 
                    ? !availableDates.some(d => d.toDateString() === date.toDateString())
                    : date < new Date()
                }
              />
            </PopoverContent>
          </Popover>
        </div>

        <Separator />
        
        <CaiacSelection
          adventurePrice={adventurePrice}
          advancePaymentPercentage={advancePaymentPercentage}
          availableCaiacs={availableCaiacs}
          onSelectionChange={setCaiacSelections}
        />
        
        <Separator />
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Comentarii adiționale</h3>
          <Textarea 
            placeholder="Notează aici orice informații suplimentare pentru organizatori..." 
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </div>
        
        <div className="border rounded-md p-4 space-y-2">
          <div className="flex justify-between">
            <span>Total:</span>
            <span className="font-medium">{formatPrice(totalPrice)}</span>
          </div>
          
          {advancePaymentPercentage > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span>Avans ({advancePaymentPercentage}%):</span>
                <span>{formatPrice(advancePayment)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Rest de plată:</span>
                <span>{formatPrice(totalPrice - advancePayment)}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          className="w-full" 
          disabled={isSubmitting || !date || !isAnySelected}
        >
          {isSubmitting ? "Se procesează..." : "Rezervă acum"}
        </Button>
      </CardFooter>
    </Card>
  );
} 