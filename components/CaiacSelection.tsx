'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';

export interface CaiacSelectionProps {
  adventurePrice: number;
  advancePaymentPercentage: number;
  availableCaiacs: {
    single: boolean;
    double: boolean;
    sup: boolean;
  };
  onSelectionChange: (selections: CaiacSelections) => void;
  initialSelections?: CaiacSelections;
  className?: string;
}

export interface CaiacSelections {
  single: number;
  double: number;
  sup: number;
}

export function CaiacSelection({
  adventurePrice,
  advancePaymentPercentage,
  availableCaiacs,
  onSelectionChange,
  initialSelections = { single: 0, double: 0, sup: 0 },
  className,
}: CaiacSelectionProps) {
  const [selections, setSelections] = useState<CaiacSelections>(initialSelections);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [advancePayment, setAdvancePayment] = useState<number>(0);

  // Calculate total price whenever selections change
  useEffect(() => {
    const calculatedTotal = 
      (selections.single * adventurePrice) + 
      (selections.double * adventurePrice * 2) + 
      (selections.sup * adventurePrice);
    
    setTotalPrice(calculatedTotal);
    setAdvancePayment(Math.round(calculatedTotal * (advancePaymentPercentage / 100)));
    
    // Notify parent of selection changes
    onSelectionChange(selections);
  }, [selections, adventurePrice, advancePaymentPercentage, onSelectionChange]);

  // Handle quantity change
  const handleQuantityChange = (type: keyof CaiacSelections, change: 1 | -1) => {
    setSelections(prev => {
      const newValue = Math.max(0, prev[type] + change);
      return { ...prev, [type]: newValue };
    });
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

  // Check if any item is selected
  const isAnySelected = selections.single > 0 || selections.double > 0 || selections.sup > 0;

  // Check if any equipment type is available
  const isAnyAvailable = availableCaiacs.single || availableCaiacs.double || availableCaiacs.sup;

  if (!isAnyAvailable) {
    return (
      <Card className={cn("mb-6", className)}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Nu sunt disponibile caiace pentru această aventură.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("mb-6", className)}>
      <CardHeader>
        <CardTitle>Selectează Echipamentul</CardTitle>
        <CardDescription>
          Alege numărul de caiace și plăci SUP pentru această aventură
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {availableCaiacs.single && (
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="single-kayak" className="text-base font-medium">
                Caiac Single
              </Label>
              <p className="text-sm text-muted-foreground">
                {formatPrice(adventurePrice)} / caiac
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuantityChange('single', -1)}
                disabled={selections.single <= 0}
              >
                -
              </Button>
              <span className="w-8 text-center">{selections.single}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuantityChange('single', 1)}
              >
                +
              </Button>
            </div>
          </div>
        )}

        {availableCaiacs.double && (
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="double-kayak" className="text-base font-medium">
                Caiac Dublu
              </Label>
              <p className="text-sm text-muted-foreground">
                {formatPrice(adventurePrice * 2)} / caiac
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuantityChange('double', -1)}
                disabled={selections.double <= 0}
              >
                -
              </Button>
              <span className="w-8 text-center">{selections.double}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuantityChange('double', 1)}
              >
                +
              </Button>
            </div>
          </div>
        )}

        {availableCaiacs.sup && (
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sup-board" className="text-base font-medium">
                Placă SUP
              </Label>
              <p className="text-sm text-muted-foreground">
                {formatPrice(adventurePrice)} / placă
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuantityChange('sup', -1)}
                disabled={selections.sup <= 0}
              >
                -
              </Button>
              <span className="w-8 text-center">{selections.sup}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuantityChange('sup', 1)}
              >
                +
              </Button>
            </div>
          </div>
        )}

        <div className="h-px w-full bg-border my-4" />

        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total:</span>
            <span className="font-medium">{formatPrice(totalPrice)}</span>
          </div>
          
          {advancePaymentPercentage > 0 && (
            <>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Avans ({advancePaymentPercentage}%):</span>
                <span>{formatPrice(advancePayment)}</span>
              </div>
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Rest de plată:</span>
                <span>{formatPrice(totalPrice - advancePayment)}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-center">
        {!isAnySelected && (
          <p className="text-sm text-orange-500">
            Te rugăm să selectezi cel puțin un caiac sau o placă SUP.
          </p>
        )}
      </CardFooter>
    </Card>
  );
} 