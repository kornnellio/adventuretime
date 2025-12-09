'use client';

import { Suspense } from 'react';
import { UserBookings } from '@/components/dashboard/user-bookings';
import { SuspenseWrapper } from '@/components/auth/suspense-wrapper';

export default function BookingsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Rezervările Mele</h1>
        <p className="text-gray-400 mt-1">Vizualizează și gestionează toate rezervările tale de aventuri</p>
      </div>
      
      <div className="bg-card rounded-lg p-5">
        <SuspenseWrapper fallback={
          <div className="flex justify-center items-center py-12">
            <div className="animate-pulse text-center">
              <p className="text-gray-400">Se încarcă rezervările...</p>
            </div>
          </div>
        }>
          <UserBookings />
        </SuspenseWrapper>
      </div>
    </div>
  );
} 