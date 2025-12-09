import Link from 'next/link';
import { format } from 'date-fns';
import { getCoupons } from '@/lib/actions/coupon';
import { Button } from '@/components/ui/button';
import { ICoupon } from '@/lib/models/coupon';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, PenLine, Tag } from 'lucide-react';
import DeleteCouponButton from '@/components/control-panel/delete-coupon-button';

export const metadata = {
  title: 'Coupons - AdventureTime.Ro',
  description: 'Manage discount coupons on AdventureTime.Ro',
};

export default async function CouponsPage() {
  const { success, data: coupons, error } = await getCoupons();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">
            Create and manage discount coupons for your adventures.
          </p>
        </div>
        <Button asChild>
          <Link href="/control-panel/coupons/new">
            <Plus className="mr-2 h-4 w-4" />
            New Coupon
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        {!success ? (
          <div className="flex flex-col items-center justify-center p-6">
            <p className="text-red-500 mb-2">Failed to load coupons</p>
            <p className="text-muted-foreground">{error || 'Unknown error occurred'}</p>
          </div>
        ) : coupons?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10">
            <h3 className="text-xl font-semibold mb-2">No coupons yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first coupon to offer discounts to your customers.
            </p>
            <Button asChild>
              <Link href="/control-panel/coupons/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Coupon
              </Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableCaption>A list of all discount coupons.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons?.map((coupon: ICoupon & { _id: string }) => (
                <TableRow key={coupon._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <span>{coupon.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {coupon.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value.toFixed(2)}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span>From: {format(new Date(coupon.startDate), 'PP')}</span>
                      {coupon.endDate && (
                        <span>To: {format(new Date(coupon.endDate), 'PP')}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span>Used: {coupon.usedCount} times</span>
                      {coupon.maxUses && (
                        <span>Max: {coupon.maxUses} times</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={coupon.isActive ? "default" : "secondary"}>
                      {coupon.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="outline" asChild>
                        <Link href={`/control-panel/coupons/${coupon._id}`}>
                          <PenLine className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteCouponButton couponId={coupon._id} couponCode={coupon.code} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
} 
