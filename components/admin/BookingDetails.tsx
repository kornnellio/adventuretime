'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { CaiacSelectionSummary } from '../CaiacSelectionSummary';
import { updateBookingStatus } from '@/lib/actions/booking';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from '../ui/textarea';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
  'awaiting confirmation': 'bg-purple-100 text-purple-800',
  pending_payment: 'bg-orange-100 text-orange-800',
  payment_confirmed: 'bg-teal-100 text-teal-800',
  declined: 'bg-gray-100 text-gray-800',
  expired: 'bg-gray-100 text-gray-800',
  error: 'bg-red-100 text-red-800',
  processing: 'bg-indigo-100 text-indigo-800',
};

export interface BookingDetailsProps {
  booking: {
    _id: string;
    orderId: string;
    userId: string;
    username: string;
    adventureId: string;
    adventureTitle: string;
    date?: Date;
    startDate: Date;
    endDate: Date;
    price: number; // Total price
    caiacSelections: {
      single: number;
      double: number;
      sup: number;
    };
    basePrice?: number; // Per unit price (optional)
    advancePaymentPercentage: number;
    advancePaymentAmount: number;
    status: string;
    statusMessage?: string;
    comments?: string;
    paymentUrl?: string;
    paymentTransactionDetails?: any;
    createdAt: Date;
    updatedAt: Date;
    phoneNumber?: string;
    couponCode?: string;
    couponType?: string;
    couponValue?: number;
    couponDiscount?: number;
    originalPrice?: number;
    kayakSelections?: {
      caiacSingle: number;
      caiacDublu: number;
      placaSUP: number;
    };
  };
  onStatusChange?: () => void;
}

export function BookingDetails({ booking, onStatusChange }: BookingDetailsProps) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>(booking.status);
  const [statusMessage, setStatusMessage] = useState<string>(booking.statusMessage || '');
  const [isPaymentLinkDialogOpen, setIsPaymentLinkDialogOpen] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd MMM yyyy');
  };

  // Handle status update submission
  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    setUpdateError(null);
    
    try {
      const result = await updateBookingStatus(
        booking._id,
        newStatus as any, // Type assertion for simplicity
        statusMessage
      );
      
      if (result.success) {
        setIsUpdateDialogOpen(false);
        if (onStatusChange) {
          onStatusChange();
        }
      } else {
        setUpdateError(result.error || 'Failed to update booking status');
      }
    } catch (err) {
      setUpdateError('Error updating booking status');
      console.error('Status update error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">Detalii rezervare #{booking.orderId}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Creată la {format(new Date(booking.createdAt), 'dd.MM.yyyy HH:mm')}
          </p>
        </div>
        
        <Badge className={statusColors[booking.status] || 'bg-gray-100'}>
          {booking.status}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Client</h3>
            <p className="text-base">{booking.username}</p>
            {booking.phoneNumber && (
              <p className="text-sm">Tel: {booking.phoneNumber}</p>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Aventură</h3>
            <p className="text-base">{booking.adventureTitle}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Data</h3>
            <p className="text-base">{formatDate(booking.startDate)}</p>
            {booking.startDate !== booking.endDate && (
              <p className="text-sm">până la {formatDate(booking.endDate)}</p>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Preț Total</h3>
            <p className="text-base font-medium">{formatPrice(booking.price)}</p>
            <div className="flex space-x-2 text-sm">
              <span>Avans: {formatPrice(booking.advancePaymentAmount)}</span>
              <span>•</span>
              <span>Rest: {formatPrice(booking.price - booking.advancePaymentAmount)}</span>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <CaiacSelectionSummary 
          caiacSelections={booking.caiacSelections}
          showPrices={true}
          basePrice={booking.basePrice || booking.price / (
            booking.caiacSelections.single + 
            (booking.caiacSelections.double * 2) + 
            booking.caiacSelections.sup
          )}
          variant="detailed"
        />
        
        {booking.comments && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-1">Comentarii Client</h3>
              <p className="text-sm bg-gray-50 p-3 rounded">{booking.comments}</p>
            </div>
          </>
        )}
        
        {booking.statusMessage && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-1">Mesaj Status</h3>
              <p className="text-sm bg-gray-50 p-3 rounded">{booking.statusMessage}</p>
            </div>
          </>
        )}
        
        {booking.paymentUrl && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-1">Link plată</h3>
              <Dialog open={isPaymentLinkDialogOpen} onOpenChange={setIsPaymentLinkDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Vezi link plată</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Link plată</DialogTitle>
                    <DialogDescription>
                      Clientul poate utiliza acest link pentru a efectua plata.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="bg-gray-50 p-3 rounded text-sm break-all">
                    {booking.paymentUrl}
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(booking.paymentUrl || '');
                        setIsPaymentLinkDialogOpen(false);
                      }}
                    >
                      Copiază link
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </>
        )}
        
        {booking.paymentTransactionDetails && (
          <>
            <Separator />
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="payment-details">
                <AccordionTrigger>Detalii tranzacție</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    {Object.entries(booking.paymentTransactionDetails).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-2">
                        <div className="font-medium">{key}</div>
                        <div className="col-span-2 break-words">{String(value)}</div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}
        
        {/* Price Details */}
        <div className="space-y-2 mt-4">
          <div className="flex justify-between">
            <span>Base Price:</span>
            <span className="font-medium">{booking.price} lei</span>
          </div>
          
          {/* Kayak selections */}
          {booking.kayakSelections && (
            <div className="mt-2">
              <h4 className="text-sm font-semibold mb-1">Kayak Selections</h4>
              <CaiacSelectionSummary 
                caiacSelections={{
                  single: booking.kayakSelections.caiacSingle,
                  double: booking.kayakSelections.caiacDublu,
                  sup: booking.kayakSelections.placaSUP
                }}
                basePrice={booking.price}
                showPrices={true}
              />
            </div>
          )}
          
          {/* Coupon information */}
          {booking.couponCode && (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md mt-3 border border-green-200 dark:border-green-800/30">
              <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">Applied Coupon</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-green-700 dark:text-green-400">Code:</span>
                <span className="font-medium text-green-700 dark:text-green-400">{booking.couponCode}</span>
                
                <span className="text-green-700 dark:text-green-400">Type:</span>
                <span className="font-medium text-green-700 dark:text-green-400">
                  {booking.couponType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                </span>
                
                <span className="text-green-700 dark:text-green-400">Value:</span>
                <span className="font-medium text-green-700 dark:text-green-400">
                  {booking.couponType === 'percentage' ? `${booking.couponValue}%` : `${booking.couponValue} lei`}
                </span>
                
                <span className="text-green-700 dark:text-green-400">Discount:</span>
                <span className="font-medium text-green-700 dark:text-green-400">
                  {booking.couponDiscount} lei
                </span>
                
                {booking.originalPrice && (
                  <>
                    <span className="text-green-700 dark:text-green-400">Original Price:</span>
                    <span className="font-medium text-green-700 dark:text-green-400 line-through">
                      {booking.originalPrice} lei
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span>Total Price:</span>
              <span>
                {booking.couponDiscount 
                  ? Math.max(0, (booking.originalPrice || 0) - booking.couponDiscount)
                  : (booking.advancePaymentAmount && booking.advancePaymentPercentage
                    ? Math.round((booking.advancePaymentAmount / booking.advancePaymentPercentage) * 100)
                    : (booking.kayakSelections 
                        ? (booking.kayakSelections.caiacSingle * booking.price) + 
                          (booking.kayakSelections.caiacDublu * booking.price * 2) + 
                          (booking.kayakSelections.placaSUP * booking.price)
                        : booking.price)
                  )
                } lei
              </span>
            </div>
            <div className="flex justify-between">
              <span>Advance Payment:</span>
              <span className="text-orange-600">{booking.advancePaymentAmount} lei ({booking.advancePaymentPercentage}%)</span>
            </div>
            <div className="flex justify-between">
              <span>Remaining Payment:</span>
              <span className="text-blue-600">
                {booking.couponDiscount 
                  ? Math.max(0, ((booking.originalPrice || 0) - booking.couponDiscount) - booking.advancePaymentAmount)
                  : (booking.advancePaymentAmount && booking.advancePaymentPercentage
                    ? Math.round((booking.advancePaymentAmount / booking.advancePaymentPercentage) * 100) - booking.advancePaymentAmount
                    : 0
                  )
                } lei
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Actualizează Status</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Actualizează statusul rezervării</DialogTitle>
              <DialogDescription>
                Schimbă statusul rezervării și adaugă un mesaj opțional.
              </DialogDescription>
            </DialogHeader>
            
            {updateError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 mb-4">
                {updateError}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Status</h4>
                <Select
                  value={newStatus}
                  onValueChange={setNewStatus}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">În așteptare</SelectItem>
                    <SelectItem value="confirmed">Confirmată</SelectItem>
                    <SelectItem value="cancelled">Anulată</SelectItem>
                    <SelectItem value="completed">Finalizată</SelectItem>
                    <SelectItem value="awaiting confirmation">Așteaptă confirmare</SelectItem>
                    <SelectItem value="pending_payment">Așteptare plată</SelectItem>
                    <SelectItem value="payment_confirmed">Plată confirmată</SelectItem>
                    <SelectItem value="declined">Refuzată</SelectItem>
                    <SelectItem value="expired">Expirată</SelectItem>
                    <SelectItem value="error">Eroare</SelectItem>
                    <SelectItem value="processing">În procesare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Mesaj status (opțional)</h4>
                <Textarea
                  placeholder="Adaugă un mesaj referitor la status..."
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  disabled={isUpdating}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsUpdateDialogOpen(false)}
                disabled={isUpdating}
              >
                Anulează
              </Button>
              <Button 
                onClick={handleUpdateStatus}
                disabled={isUpdating}
              >
                {isUpdating ? "Se actualizează..." : "Actualizează"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
} 