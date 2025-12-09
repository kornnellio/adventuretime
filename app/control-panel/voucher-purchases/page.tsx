'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { getAllVoucherPurchases } from '@/lib/actions/voucherPurchase';
import { Gift, Search, RefreshCw, Copy, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface VoucherPurchase {
  _id: string;
  orderId: string;
  username: string;
  email: string;
  voucherAmount: number;
  totalAmount: number;
  processingFee: number;
  status: string;
  generatedCouponCode?: string;
  createdAt: string;
  updatedAt: string;
}

export default function VoucherPurchasesPage() {
  const [voucherPurchases, setVoucherPurchases] = useState<VoucherPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchVoucherPurchases = async () => {
    setLoading(true);
    try {
      const result = await getAllVoucherPurchases();
      if (result.success && result.data) {
        setVoucherPurchases(result.data);
      } else {
        toast({
          title: "Eroare",
          description: result.error || "Nu s-au putut încărca cumpărările de vouchere",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching voucher purchases:', error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la încărcarea datelor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoucherPurchases();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'completed': { label: 'Completat', variant: 'default' as const },
      'payment_confirmed': { label: 'Plată Confirmată', variant: 'secondary' as const },
      'pending_payment': { label: 'Plată în Așteptare', variant: 'outline' as const },
      'declined': { label: 'Refuzat', variant: 'destructive' as const },
      'cancelled': { label: 'Anulat', variant: 'destructive' as const },
      'error': { label: 'Eroare', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'outline' as const 
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiat",
      description: "Textul a fost copiat în clipboard",
    });
  };

  const filteredVoucherPurchases = voucherPurchases.filter(purchase =>
    purchase.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (purchase.generatedCouponCode && purchase.generatedCouponCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const completedCount = voucherPurchases.filter(p => p.status === 'completed').length;
  const totalRevenue = voucherPurchases
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.totalAmount, 0);
  const totalVoucherValue = voucherPurchases
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.voucherAmount, 0);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Se încarcă...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gift className="h-8 w-8" />
            Cumpărări Vouchere
          </h1>
          <p className="text-muted-foreground">
            Gestionează cumpărările de vouchere și codurile generate
          </p>
        </div>
        <Button onClick={fetchVoucherPurchases} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reîmprospătează
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Vouchere Vândute</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Venituri Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue} lei</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Valoare Vouchere Generate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVoucherValue} lei</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Căutare</CardTitle>
          <CardDescription>
            Caută după numărul comenzii, nume client, email sau cod voucher
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută cumpărări de vouchere..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Voucher Purchases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cumpărări Vouchere ({filteredVoucherPurchases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredVoucherPurchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nu s-au găsit cumpărări de vouchere
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comandă</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Valoare Voucher</TableHead>
                    <TableHead>Total Plătit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cod Voucher</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVoucherPurchases.map((purchase) => (
                    <TableRow key={purchase._id}>
                      <TableCell>
                        <div className="font-medium">{purchase.orderId}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{purchase.username}</div>
                          <div className="text-sm text-muted-foreground">{purchase.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{purchase.voucherAmount} lei</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{purchase.totalAmount} lei</div>
                        <div className="text-xs text-muted-foreground">
                          (inc. {purchase.processingFee} lei taxă)
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(purchase.status)}
                      </TableCell>
                      <TableCell>
                        {purchase.generatedCouponCode ? (
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-muted rounded text-sm">
                              {purchase.generatedCouponCode}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(purchase.generatedCouponCode!)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(purchase.createdAt).toLocaleDateString('ro-RO')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(purchase.createdAt).toLocaleTimeString('ro-RO')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(purchase.email)}
                            title="Copiază email"
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 