'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/hooks/use-auth';
import { createVoucherPurchase, initiateVoucherPayment } from '@/lib/actions/voucherPurchase';
import { Gift, CreditCard, Info } from 'lucide-react';

const VOUCHER_AMOUNTS = [100, 200, 300, 400, 500];
const PROCESSING_FEE = 20;

export default function VoucherePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVoucherPurchase = async () => {
    if (!user) {
      toast({
        title: "Eroare",
        description: "Trebuie să fii autentificat pentru a cumpăra vouchere.",
        variant: "destructive"
      });
      router.push('/login');
      return;
    }

    if (!selectedAmount) {
      toast({
        title: "Eroare",
        description: "Te rugăm să selectezi valoarea voucherului.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create voucher purchase
      const createResult = await createVoucherPurchase(
        user.id,
        selectedAmount,
        phoneNumber
      );

      if (!createResult.success || !createResult.data) {
        throw new Error(createResult.error || 'Failed to create voucher purchase');
      }

      // Initiate payment
      const paymentResult = await initiateVoucherPayment(
        createResult.data.voucherPurchaseId,
        phoneNumber
      );

      if (!paymentResult.success || !paymentResult.data) {
        throw new Error(paymentResult.error || 'Failed to initiate payment');
      }

      // Redirect to payment
      if (paymentResult.data.paymentUrl) {
        window.location.href = paymentResult.data.paymentUrl;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Voucher purchase error:', error);
      toast({
        title: "Eroare",
        description: error instanceof Error ? error.message : "A apărut o eroare la procesarea voucherului.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };



  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Vouchere Cadou AdventureTime
            </h1>
            <p className="text-gray-300 text-lg">
              Oferă aventură în cadou! Cumpără vouchere pentru cei dragi.
            </p>
          </div>

          {/* Info Card */}
          <Card className="bg-card border-border mb-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Info className="h-6 w-6 text-blue-400 mt-1" />
                <div>
                  <h3 className="text-white font-semibold mb-2">Informații importante</h3>
                  <ul className="text-gray-300 space-y-1 text-sm">
                    <li>• Din suma plătită se percepe o taxă de comision de 20 lei</li>
                    <li>• Voucherul generat va avea exact valoarea selectată (fără taxa de comision)</li>
                    <li>• Suma achiziționată poate fi folosită la orice eveniment</li>
                    <li>• Codul voucherului va fi trimis pe email după confirmarea plății</li>
                    <li>• Voucherul este valabil 1 an de la data emiterii</li>
                    <li>• Voucherul poate fi folosit o singură dată</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Voucher Selection */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Gift className="h-5 w-5 text-orange-500" />
                  Selectează valoarea voucherului
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Alege suma pe care dorești să o oferi în cadou
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {VOUCHER_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setSelectedAmount(amount)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedAmount === amount
                          ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                          : 'border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white'
                      }`}
                    >
                      <div className="text-2xl font-bold">{amount}</div>
                      <div className="text-sm">lei</div>
                    </button>
                  ))}
                </div>

                {selectedAmount && (
                  <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Rezumat comandă:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-300">
                        <span>Valoare voucher:</span>
                        <span>{selectedAmount} lei</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Taxa de procesare:</span>
                        <span>{PROCESSING_FEE} lei</span>
                      </div>
                      <div className="flex justify-between text-white font-semibold border-t border-gray-600 pt-2">
                        <span>Total de plată:</span>
                        <span>{selectedAmount + PROCESSING_FEE} lei</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Purchase Form */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-500" />
                  Finalizează comanda
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Completează datele și procesează plata
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!user ? (
                  <div className="text-center py-8">
                    <p className="text-gray-300 mb-4">
                      Trebuie să fii autentificat pentru a cumpăra vouchere.
                    </p>
                    <Button
                      onClick={() => router.push('/login')}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      Autentifică-te
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300">
                        Email (pentru trimiterea voucherului)
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={user.email}
                        disabled
                        className="bg-gray-800 border-gray-600 text-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-300">
                        Număr de telefon (opțional)
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="07xxxxxxxx"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                      />
                    </div>

                    <Button
                      onClick={handleVoucherPurchase}
                      disabled={!selectedAmount || isProcessing}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Se procesează...
                        </>
                      ) : (
                        <>
                          Plătește {selectedAmount ? selectedAmount + PROCESSING_FEE : '0'} lei
                        </>
                      )}
                    </Button>

                    {selectedAmount && (
                      <p className="text-xs text-gray-400 text-center">
                        Vei fi redirecționat către Netopia pentru plată securizată
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 