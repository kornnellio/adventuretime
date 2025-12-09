'use client';

import { cn } from '@/lib/utils';

export interface CaiacSelectionSummaryProps {
  caiacSelections: {
    single: number;
    double: number;
    sup: number;
  };
  showPrices?: boolean;
  basePrice?: number;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export function CaiacSelectionSummary({
  caiacSelections,
  showPrices = false,
  basePrice = 0,
  className,
  variant = 'default',
}: CaiacSelectionSummaryProps) {
  const { single, double, sup } = caiacSelections;
  const hasSelections = single > 0 || double > 0 || sup > 0;

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Generate description of selections
  const getSelectionDescription = () => {
    if (!hasSelections) {
      return "Fără echipament selectat";
    }

    const items = [];
    if (single > 0) {
      items.push(`${single} caiac${single > 1 ? 'e' : ''} single`);
    }
    if (double > 0) {
      items.push(`${double} caiac${double > 1 ? 'e' : ''} duble`);
    }
    if (sup > 0) {
      items.push(`${sup} plac${sup > 1 ? 'i' : 'ă'} SUP`);
    }

    return items.join(', ');
  };

  if (variant === 'compact') {
    return (
      <div className={cn("text-sm", className)}>
        {hasSelections ? getSelectionDescription() : "Fără echipament selectat"}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn("space-y-2", className)}>
        <h4 className="font-medium text-base">Echipament Selectat</h4>
        {!hasSelections && <p className="text-sm text-muted-foreground">Fără echipament selectat</p>}
        
        {single > 0 && (
          <div className="flex justify-between items-center">
            <span>Caiac Single</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-secondary rounded-md text-sm">
                {single} {single === 1 ? 'bucată' : 'bucăți'}
              </span>
              {showPrices && basePrice > 0 && (
                <span className="text-sm">
                  {formatPrice(single * basePrice)}
                </span>
              )}
            </div>
          </div>
        )}
        
        {double > 0 && (
          <div className="flex justify-between items-center">
            <span>Caiac Dublu</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-secondary rounded-md text-sm">
                {double} {double === 1 ? 'bucată' : 'bucăți'}
              </span>
              {showPrices && basePrice > 0 && (
                <span className="text-sm">
                  {formatPrice(double * basePrice * 2)}
                </span>
              )}
            </div>
          </div>
        )}
        
        {sup > 0 && (
          <div className="flex justify-between items-center">
            <span>Placă SUP</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-secondary rounded-md text-sm">
                {sup} {sup === 1 ? 'bucată' : 'bucăți'}
              </span>
              {showPrices && basePrice > 0 && (
                <span className="text-sm">
                  {formatPrice(sup * basePrice)}
                </span>
              )}
            </div>
          </div>
        )}
        
        {showPrices && basePrice > 0 && hasSelections && (
          <div className="flex justify-between items-center pt-2 font-medium border-t">
            <span>Total echipament:</span>
            <span>
              {formatPrice(
                (single * basePrice) + 
                (double * basePrice * 2) + 
                (sup * basePrice)
              )}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("", className)}>
      <h4 className="text-sm font-medium text-muted-foreground mb-1">Echipament</h4>
      <div className="space-y-1">
        {!hasSelections && <p className="text-sm">Fără echipament selectat</p>}
        
        {single > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{single} × Caiac Single</span>
            {showPrices && basePrice > 0 && (
              <span className="text-sm text-muted-foreground">
                ({formatPrice(basePrice)} / buc)
              </span>
            )}
          </div>
        )}
        
        {double > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{double} × Caiac Dublu</span>
            {showPrices && basePrice > 0 && (
              <span className="text-sm text-muted-foreground">
                ({formatPrice(basePrice * 2)} / buc)
              </span>
            )}
          </div>
        )}
        
        {sup > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{sup} × Placă SUP</span>
            {showPrices && basePrice > 0 && (
              <span className="text-sm text-muted-foreground">
                ({formatPrice(basePrice)} / buc)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 