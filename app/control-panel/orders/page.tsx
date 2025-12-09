'use client';

import Link from 'next/link';
import { getOrders } from '@/lib/actions/order';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Pencil, RefreshCw } from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import DeleteOrderButton from '@/components/control-panel/delete-order-button';
import { OrderWithUser } from '@/lib/actions/order';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function getStatusColor(status: string) {
  // Log the status for debugging
  console.log(`Getting status color for: "${status}"`);
  
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-500 hover:bg-green-600';
    case 'awaiting confirmation':
      return 'bg-amber-500 hover:bg-amber-600';
    case 'confirmed':
      return 'bg-emerald-500 hover:bg-emerald-600';
    case 'pending':
      return 'bg-yellow-500 hover:bg-yellow-600';
    case 'cancelled':
      return 'bg-red-500 hover:bg-red-600';
    case 'processing':
      return 'bg-blue-500 hover:bg-blue-600';
    default:
      console.log(`Unknown status: "${status}"`);
      return 'bg-gray-500 hover:bg-gray-600';
  }
}

// Helper function to format date range
function formatDateRange(order: OrderWithUser) {
  const startDate = order.startDate || order.date;
  const endDate = order.endDate;
  
  if (!startDate) return 'No date';
  
  if (!endDate) return formatDate(startDate);
  
  // Check if dates are the same
  const sDate = new Date(startDate);
  const eDate = new Date(endDate);
  
  if (sDate.toDateString() === eDate.toDateString()) {
    return formatDate(startDate);
  }
  
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { success, data, error } = await getOrders();
      if (success && data) {
        setOrders(data);
      } else {
        setError(error || 'Failed to load orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchOrders();
    
    // Set up an interval to refresh the data every 30 seconds
    const intervalId = setInterval(() => {
      fetchOrders();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const handleRefresh = () => {
    fetchOrders();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            Manage your orders. You can view details, update status, or delete orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center p-6">
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : error ? (
            <div className="text-center p-6">
              <p className="text-red-500">{error}</p>
            </div>
          ) : orders?.length === 0 ? (
            <div className="text-center p-6">
              <p className="text-muted-foreground">No orders found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.map((order: OrderWithUser) => (
                  <TableRow key={order._id.toString()}>
                    <TableCell className="font-medium">{order.orderId}</TableCell>
                    <TableCell>{formatDateRange(order)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{order.user.name} {order.user.surname}</span>
                        <span className="text-xs text-muted-foreground">{order.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{order.phoneNumber || '-'}</TableCell>
                    <TableCell>{formatPrice(order.total)}</TableCell>
                    <TableCell>
                      {order.kayakSelections ? (
                        <div className="text-xs">
                          {order.kayakSelections.caiacSingle > 0 && (
                            <div>{order.kayakSelections.caiacSingle} × Single</div>
                          )}
                          {order.kayakSelections.caiacDublu > 0 && (
                            <div>{order.kayakSelections.caiacDublu} × Dublu</div>
                          )}
                          {order.kayakSelections.placaSUP > 0 && (
                            <div>{order.kayakSelections.placaSUP} × SUP</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Nu sunt detalii</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/control-panel/orders/${order.user._id}/${order._id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteOrderButton 
                          userId={order.user._id.toString()} 
                          orderId={order._id.toString()} 
                          onDeleted={fetchOrders}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 