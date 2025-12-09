'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '../ui/card';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

export interface CaiacAvailabilityToggleProps {
  initialValues?: {
    single: boolean;
    double: boolean;
    sup: boolean;
  };
  onChange: (values: { single: boolean; double: boolean; sup: boolean }) => void;
  className?: string;
  disabled?: boolean;
}

export function CaiacAvailabilityToggle({
  initialValues = { single: true, double: true, sup: true },
  onChange,
  className,
  disabled = false,
}: CaiacAvailabilityToggleProps) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);

  // Update parent component when values change
  useEffect(() => {
    onChange(values);
  }, [values, onChange]);

  // Handle toggle change
  const handleToggleChange = (key: keyof typeof values) => {
    // Create a new state object with the toggled value
    const newValues = { ...values, [key]: !values[key] };
    
    // Check if at least one option is selected
    const atLeastOneSelected = Object.values(newValues).some(value => value);
    
    if (!atLeastOneSelected) {
      setError('Cel puțin un tip de echipament trebuie să fie disponibil');
      return;
    }
    
    setError(null);
    setValues(newValues);
  };

  return (
    <Card className={cn("mb-6", className)}>
      <CardHeader>
        <CardTitle>Echipament Disponibil</CardTitle>
        <CardDescription>
          Selectează tipurile de caiace și plăci SUP disponibile pentru această aventură
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="available-single"
              checked={values.single}
              onCheckedChange={() => handleToggleChange('single')}
              disabled={disabled}
            />
            <Label htmlFor="available-single" className="cursor-pointer">
              Caiac Single
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="available-double"
              checked={values.double}
              onCheckedChange={() => handleToggleChange('double')}
              disabled={disabled}
            />
            <Label htmlFor="available-double" className="cursor-pointer">
              Caiac Dublu
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="available-sup"
              checked={values.sup}
              onCheckedChange={() => handleToggleChange('sup')}
              disabled={disabled}
            />
            <Label htmlFor="available-sup" className="cursor-pointer">
              Placă SUP
            </Label>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mt-4">
          Notă: Cel puțin un tip de echipament trebuie să fie disponibil pentru aventură.
        </p>
      </CardContent>
    </Card>
  );
} 