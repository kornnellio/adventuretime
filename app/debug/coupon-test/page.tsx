'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCouponByCode, incrementCouponUsage } from '@/lib/actions/coupon';

export default function CouponTestPage() {
  const [couponCode, setCouponCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setLoading(true);
    try {
      const result = await getCouponByCode(couponCode);
      setResult(result);
    } catch (error) {
      setResult({ success: false, error: 'Error checking coupon' });
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async () => {
    if (!couponCode.trim()) return;
    
    setLoading(true);
    try {
      const result = await incrementCouponUsage(couponCode);
      setResult(result);
      // Refresh coupon data after increment
      if (result.success) {
        setTimeout(() => checkCoupon(), 500);
      }
    } catch (error) {
      setResult({ success: false, error: 'Error incrementing coupon usage' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Coupon Debug Tool</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Coupon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              placeholder="Enter coupon code (e.g., VOUCHER-F8FF1AEF)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={checkCoupon} disabled={loading}>
              Check Coupon
            </Button>
            <Button onClick={incrementUsage} disabled={loading} variant="secondary">
              Increment Usage
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 