'use client';

import { useState, useEffect, useRef } from 'react';
import { getOrderById, updateOrderStatus } from '@/lib/actions/order';
import { notFound, useRouter } from 'next/navigation';
import { use } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatPrice } from '@/lib/utils';
import DeleteOrderButton from '@/components/control-panel/delete-order-button';
import LTREditor from '@/components/control-panel/ltr-editor';

const ORDER_STATUSES = [
  'awaiting confirmation',
  'confirmed',
  'processing',
  'completed',
  'cancelled'
] as const;

// Define the exact status type from the ORDER_STATUSES array
type StatusType = typeof ORDER_STATUSES[number];

export default function EditOrderPage({ params }: { params: Promise<{ userId: string, orderId: string }> }) {
  // Properly unwrap params using React.use()
  const { userId, orderId } = use(params);
  
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState<StatusType>(ORDER_STATUSES[0]);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showEditor, setShowEditor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  // Fetch order data
  const fetchOrderData = async () => {
    if (!userId || !orderId || fetchAttempted) return;
    
    setIsLoading(true);
    try {
      const { success, data, error } = await getOrderById(userId, orderId);
      
      if (!success || !data) {
        toast({
          title: 'Error',
          description: error || 'Failed to load order data',
          variant: 'destructive',
        });
        return;
      }
      
      setOrder(data);
      setCurrentStatus(data.status as StatusType);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load order data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setFetchAttempted(true);
    }
  };

  // Fetch data once on component mount
  useEffect(() => {
    fetchOrderData();
  }, [userId, orderId]); // Safe to include these as dependencies since they won't change

  // Show the message editor when status changes to confirmed
  useEffect(() => {
    setShowEditor(currentStatus === 'confirmed');
  }, [currentStatus]);

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!userId || !orderId) return;
    
    setIsSubmitting(true);
    try {
      // We don't need editorRef anymore, we use the statusMessage state directly
      const message = currentStatus === 'confirmed' ? statusMessage : '';
      
      const result = await updateOrderStatus(userId, orderId, currentStatus, message);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast({
        title: 'Success',
        description: 'Order status updated successfully',
      });
      
      // Update the local state with the returned data
      if (result.data) {
        setOrder(result.data);
        // Reset the status message
        setStatusMessage('');
      }
      
      // Refresh all routes to ensure data is current
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order status',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual retry button if loading fails
  const handleRetry = () => {
    setFetchAttempted(false);
    fetchOrderData();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
          <Button variant="outline" asChild>
            <Link href="/control-panel/orders">Back to Orders</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-8">
              <p className="mb-4">Loading order details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If fetch was attempted but no order was found
  if (fetchAttempted && !order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
          <Button variant="outline" asChild>
            <Link href="/control-panel/orders">Back to Orders</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-8">
              <p className="mb-4">Failed to load order details</p>
              <Button onClick={handleRetry}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no order data yet (should not happen with auto-loading)
  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
          <Button variant="outline" asChild>
            <Link href="/control-panel/orders">Back to Orders</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-8">
              <p className="mb-4">Order data not available</p>
              <Button onClick={handleRetry}>Load Order Details</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/control-panel/orders">Back to Orders</Link>
          </Button>
          <DeleteOrderButton userId={userId} orderId={orderId} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order #{order.orderId}</CardTitle>
            <CardDescription>
              Placed on {format(new Date(order.date), 'PPP')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Products</h3>
                <div className="border rounded-md divide-y">
                  {order.products.map((product: any, index: number) => (
                    <div key={index} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{product.name || product.title || 'Product'}</p>
                        {product.variation && (
                          <p className="text-sm text-muted-foreground">{product.variation}</p>
                        )}
                        {/* Add kayak selection display */}
                        {order.kayakSelections && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <p className="font-medium">Ambarcațiuni:</p>
                            <ul className="list-disc list-inside">
                              {order.kayakSelections.caiacSingle > 0 && (
                                <li>{order.kayakSelections.caiacSingle} caiac{order.kayakSelections.caiacSingle > 1 ? 'e' : ''} single</li>
                              )}
                              {order.kayakSelections.caiacDublu > 0 && (
                                <li>{order.kayakSelections.caiacDublu} caiac{order.kayakSelections.caiacDublu > 1 ? 'e' : ''} dublu</li>
                              )}
                              {order.kayakSelections.placaSUP > 0 && (
                                <li>{order.kayakSelections.placaSUP} plac{order.kayakSelections.placaSUP > 1 ? 'i' : 'ă'} SUP</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {product.pricePerPerson ? (
                          <>
                            <p>{formatPrice(product.pricePerPerson)} per person</p>
                            <p className="text-sm text-muted-foreground">
                              {product.numberOfPeople > 1 ? `${product.numberOfPeople} people` : '1 person'}
                            </p>
                          </>
                        ) : (
                          <p>{formatPrice(product.price || 0)}</p>
                        )}
                        {product.quantity > 1 && (
                          <p className="text-sm text-muted-foreground">x{product.quantity}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="p-4 flex justify-between items-center bg-muted/50">
                    <p className="font-semibold">Total</p>
                    <p className="font-semibold">{formatPrice(order.total)}</p>
                  </div>
                </div>
              </div>
              
              {/* Adventure Details Section */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-lg mb-2">Adventure Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Details */}
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium">Title</p>
                      <p>{order.adventureTitle || order.details?.title || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium">Location</p>
                      <p>{order.location || order.details?.location || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium">Meeting Point</p>
                      <p>{order.meetingPoint || order.details?.meetingPoint || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium">Difficulty</p>
                      <p>{order.difficulty || order.details?.difficulty || 'Not specified'}</p>
                    </div>
                    
                    {(order.details?.duration?.value && order.details?.duration?.unit) && (
                      <div>
                        <p className="font-medium">Duration</p>
                        <p>{order.details.duration.value} {order.details.duration.unit}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Payment Details */}
                  <div className="space-y-2">
                    {order.advancePayment !== undefined && (
                      <div>
                        <p className="font-medium">Advance Payment</p>
                        <p>{formatPrice(order.advancePayment)}</p>
                      </div>
                    )}
                    
                    {order.advancePaymentPercentage !== undefined && (
                      <div>
                        <p className="font-medium">Advance Payment Percentage</p>
                        <p>{order.advancePaymentPercentage}%</p>
                      </div>
                    )}
                    
                    {/* Show actual remaining payment without forcing it to 0 */}
                    {order.total !== undefined && order.advancePayment !== undefined && (
                      <div>
                        <p className="font-medium">Remaining Payment</p>
                        <p>{formatPrice(order.total - order.advancePayment)}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="font-medium">Start Date</p>
                      <p>{order.startDate ? format(new Date(order.startDate), 'PPP') : format(new Date(order.date), 'PPP')}</p>
                    </div>
                    
                    {order.endDate && (
                      <div>
                        <p className="font-medium">End Date</p>
                        <p>{format(new Date(order.endDate), 'PPP')}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Lists of Information */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.details?.requirements && order.details.requirements.length > 0 && (
                    <div>
                      <p className="font-medium mb-1">Requirements</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {order.details.requirements.map((req: string, index: number) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {order.details?.includedItems && order.details.includedItems.length > 0 && (
                    <div>
                      <p className="font-medium mb-1">Included Items</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {order.details.includedItems.map((item: string, index: number) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {order.details?.excludedItems && order.details.excludedItems.length > 0 && (
                    <div>
                      <p className="font-medium mb-1">Excluded Items</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {order.details.excludedItems.map((item: string, index: number) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {order.details?.equipmentNeeded && order.details.equipmentNeeded.length > 0 && (
                    <div>
                      <p className="font-medium mb-1">Equipment Needed</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {order.details.equipmentNeeded.map((item: string, index: number) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {order.comments && (
                    <div className="col-span-2">
                      <p className="font-medium mb-1">Cerințe speciale sau comentarii:</p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-sm">{order.comments}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-lg mb-4">Update Status</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Order Status</Label>
                    <Select
                      value={currentStatus}
                      onValueChange={(val: string) => setCurrentStatus(val as StatusType)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map(status => (
                          <SelectItem key={status} value={status} className="capitalize">
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {showEditor && (
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="status-message">Custom Message for Email Notification</Label>
                      <div className="border rounded-md">
                        <LTREditor
                          initialValue={statusMessage}
                          onEditorChange={(content) => {
                            setStatusMessage(content);
                          }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This message will be included in the confirmation email sent to the customer.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-end mt-4">
                    <Button
                      type="button"
                      onClick={handleStatusUpdate}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Updating...' : 'Update Status'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Contact Details</h3>
                <p>{order.user.name} {order.user.surname}</p>
                <p>{order.user.email}</p>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-1">Customer Account</h3>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/control-panel/users/${order.user._id}`}>
                    View Customer Profile
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 