import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCouponById, updateCoupon, CouponFormData } from '@/lib/actions/coupon';
import { ChevronLeft } from 'lucide-react';
import CouponForm from '@/components/control-panel/coupon-form';
import { getAdventures } from '@/lib/actions/adventure';

interface EditCouponPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: EditCouponPageProps) {
  const resolvedParams = await params;
  return {
    title: 'Edit Coupon - AdventureTime.Ro',
    description: 'Edit an existing discount coupon',
  };
}

export default async function EditCouponPage({ params, searchParams }: EditCouponPageProps) {
  const resolvedParams = await params;
  await searchParams; // Await searchParams even if we don't use it
  const { id } = resolvedParams;
  
  // Fetch the coupon data
  const { success: couponSuccess, data: coupon, error } = await getCouponById(id);
  
  if (!couponSuccess || !coupon) {
    notFound();
  }
  
  // Get adventures for the dropdown selector
  const { success: adventuresSuccess, data: adventures } = await getAdventures();
  
  const adventureOptions = adventuresSuccess && adventures
    ? adventures.map((adventure: any) => ({
        value: adventure._id,
        label: adventure.title,
      }))
    : [];

  // Define handleUpdateWithId as a server action
  async function handleUpdateWithId(data: CouponFormData) {
    'use server';
    return updateCoupon(id, data);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/control-panel/coupons">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Coupon</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coupon Details</CardTitle>
          <CardDescription>
            Edit the details of coupon code <strong>{coupon.code}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CouponForm 
            initialData={coupon} 
            onSubmit={handleUpdateWithId} 
            adventures={adventureOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
} 