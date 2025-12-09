import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Phone, CheckCircle2, XCircle } from "lucide-react"

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string
  onChange: (value: string) => void
  isValid?: boolean
  className?: string
  showValidationIcon?: boolean
  label?: string
  required?: boolean
  helperText?: string
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ 
    value, 
    onChange, 
    isValid = false, 
    className, 
    showValidationIcon = true, 
    label = "Număr de telefon", 
    required = true,
    helperText = "Vă vom contacta la acest număr dacă apar detalii importante.",
    ...props 
  }, ref) => {
    // Function to format the phone number as user types
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let input = e.target.value
      
      // Remove all non-digit characters
      input = input.replace(/\D/g, '')
      
      // Format the number with spaces (if needed)
      if (input.length > 4 && input.length <= 7) {
        input = `${input.slice(0, 4)} ${input.slice(4)}`
      } else if (input.length > 7) {
        input = `${input.slice(0, 4)} ${input.slice(4, 7)} ${input.slice(7, 10)}`
      }
      
      onChange(input)
    }

    // Determine if we should show validation state
    const showValidation = value.length > 0 && showValidationIcon

    // Simple validation - Romanian mobile numbers generally start with 07
    const isValidRomanianMobile = 
      value.length >= 10 && 
      (value.startsWith('07') || value.startsWith('07'))

    const validationState = isValid || isValidRomanianMobile

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-600" />
            <span>{label}</span>
            {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          <Input
            type="tel"
            value={value}
            onChange={handleChange}
            className={cn(
              "w-full pr-10 transition-all duration-200",
              showValidation && validationState && "border-green-500 focus-visible:ring-green-500",
              showValidation && !validationState && "border-red-500 focus-visible:ring-red-500",
              className
            )}
            placeholder="07XX XXX XXX"
            ref={ref}
            {...props}
          />
          
          {showValidation && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm flex items-center">
              {validationState ? (
                <span className="text-green-500 flex items-center">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              ) : (
                <span className="text-red-500 flex items-center">
                  <XCircle className="h-4 w-4" />
                </span>
              )}
            </div>
          )}
        </div>
        {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
      </div>
    )
  }
)

PhoneInput.displayName = "PhoneInput"

export { PhoneInput } 