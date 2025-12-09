import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createCoupon } from '@/lib/actions/coupon';
import { ChevronLeft } from 'lucide-react';
import CouponForm from '@/components/control-panel/coupon-form';
import { getAdventures } from '@/lib/actions/adventure';

export const metadata = {
  title: 'Create Coupon - AdventureTime.Ro',
  description: 'Create a new discount coupon',
};

export default async function NewCouponPage() {
  // Get adventures for the dropdown selector
  const { success, data: adventures } = await getAdventures();
  
  const adventureOptions = success && adventures
    ? adventures.map((adventure: any) => ({
        value: adventure._id,
        label: adventure.title,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/control-panel/coupons">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create Coupon</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coupon Details</CardTitle>
          <CardDescription>
            Add a new discount coupon for your customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CouponForm onSubmit={createCoupon} adventures={adventureOptions} />
        </CardContent>
      </Card>
    </div>
  );
} 