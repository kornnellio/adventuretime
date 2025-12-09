'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import PaymentIntentContent from '@/components/payment/payment-intent-content';

export default function PaymentIntentPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto max-w-4xl py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Se încarcă detaliile plății...</p>
      </div>
    }>
      <PaymentIntentContent />
    </Suspense>
  );
} 