
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, CreditCard, Gift, History, Printer, QrCode } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface CustomerDetailsProps {
  customer: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CustomerDetails = ({ customer, open, onOpenChange }: CustomerDetailsProps) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Fetch store settings
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'store_info')
        .single();
      if (error) {
        return {
          store_name: 'LAPAU.ID',
          phone: '',
          address: '',
          email: ''
        };
      }
      return data.value as any;
    }
  });

  // Fetch purchase history with year filter
  const { data: purchaseHistory = [] } = useQuery({
    queryKey: ['customer-purchase-history', customer?.id, selectedYear],
    queryFn: async () => {
      if (!customer?.id) return [];
      
      // Fetch transactions with items
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          id,
          transaction_number,
          total_amount,
          points_earned,
          points_used,
          created_at,
          transaction_items(
            quantity,
            products(name)
          )
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!transactions) return [];
      
      // Transform the data to match expected format
      const transformedData = transactions.map((t: any) => ({
        transaction_id: t.id,
        transaction_number: t.transaction_number,
        total_amount: t.total_amount,
        points_earned: t.points_earned || 0,
        points_used: t.points_used || 0,
        created_at: t.created_at,
        items: t.transaction_items?.map((item: any) => ({
          product_name: item.products?.name || 'Unknown',
          quantity: item.quantity
        })) || []
      }));
      
      // Filter by year if selected
      if (selectedYear !== 'all') {
        return transformedData.filter((transaction: any) => {
          const year = new Date(transaction.created_at).getFullYear().toString();
          return year === selectedYear;
        });
      }
      
      return transformedData;
    },
    enabled: !!customer?.id && open
  });

  // Fetch point transactions
  const { data: pointHistory = [] } = useQuery({
    queryKey: ['customer-point-history', customer?.id],
    queryFn: async () => {
      if (!customer?.id) return [];
      const { data, error } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!customer?.id && open
  });

  // Fetch point exchanges (redemption history)
  const { data: pointExchanges = [] } = useQuery({
    queryKey: ['customer-point-exchanges', customer?.id],
    queryFn: async () => {
      if (!customer?.id) return [];
      const { data, error } = await supabase
        .from('point_exchanges')
        .select(`
          *,
          rewards(name, description)
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!customer?.id && open
  });

  // Get available years for filter
  const availableYears = React.useMemo(() => {
    if (!purchaseHistory || purchaseHistory.length === 0) return [];
    
    const years = new Set<string>();
    purchaseHistory.forEach((transaction: any) => {
      const year = new Date(transaction.created_at).getFullYear().toString();
      years.add(year);
    });
    
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [purchaseHistory]);

  const generateQRCode = async () => {
    if (!customer) return;
    
    try {
      // QR code will now use customer ID directly, no need to update DB
      toast({ title: 'Berhasil', description: 'QR Code berhasil dibuat' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const printMemberCard = () => {
    if (!customer) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const storeName = storeSettings?.store_name || 'LAPAU.ID';
    const storePhone = storeSettings?.phone || '';
    const storeAddress = storeSettings?.address || '';

    const memberCardHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Member Card - ${customer.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .card { 
              width: 85mm; 
              height: 54mm; 
              border: 2px solid #000; 
              border-radius: 8px; 
              padding: 10px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              position: relative;
            }
            .card-header { text-align: center; margin-bottom: 8px; }
            .store-name { font-size: 16px; font-weight: bold; }
            .store-info { font-size: 9px; opacity: 0.9; }
            .member-info { margin: 6px 0; }
            .member-name { font-size: 14px; font-weight: bold; }
            .member-code { font-size: 12px; }
            .qr-code { text-align: center; margin-top: 8px; }
            .qr-code img { width: 50px; height: 50px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="card-header">
              <div class="store-name">${storeName}</div>
              <div style="font-size: 12px;">MEMBER CARD</div>
              ${storePhone ? `<div class="store-info">${storePhone}</div>` : ''}
              ${storeAddress ? `<div class="store-info">${storeAddress}</div>` : ''}
            </div>
            <div class="member-info">
              <div class="member-name">${customer.name}</div>
              <div class="member-code">ID: ${customer.id}</div>
              <div style="font-size: 10px;">Bergabung: ${new Date(customer.created_at).toLocaleDateString('id-ID')}</div>
            </div>
            <div class="qr-code">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(customer.id)}" alt="QR Code" />
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(memberCardHTML);
    printWindow.document.close();
    printWindow.print();
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Detail Customer: {customer.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Points</p>
                    <p className="text-2xl font-bold text-blue-600">{customer.total_points}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Belanja</p>
                    <p className="text-2xl font-bold text-green-600">
                      Rp {(customer.total_spent || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Transaksi</p>
                    <p className="text-2xl font-bold text-purple-600">{purchaseHistory.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Member Card Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Kartu Member
                </span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={printMemberCard}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Kartu
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="w-96 h-60 bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                  
                  <div className="relative z-10">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold">{storeSettings?.store_name || 'LAPAU.ID'}</h3>
                      <p className="text-sm opacity-90">KARTU MEMBER</p>
                      {storeSettings?.phone && (
                        <p className="text-xs opacity-75">{storeSettings.phone}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-lg font-semibold">{customer.name}</p>
                      <p className="text-sm opacity-90">ID: {customer.id}</p>
                      <p className="text-xs opacity-75">
                        Bergabung: {new Date(customer.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    
                    <div className="absolute bottom-4 right-4">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(customer.id)}`}
                        alt="QR Code" 
                        className="w-16 h-16 bg-white p-1 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History Tabs */}
          <Tabs defaultValue="purchases" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transactions">Riwayat Transaksi</TabsTrigger>
              <TabsTrigger value="points">Riwayat Point</TabsTrigger>
              <TabsTrigger value="redemptions">Riwayat Redeem</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Riwayat Pembelian</span>
                    <div className="flex gap-2">
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Pilih Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Tahun</SelectItem>
                          {availableYears.map(year => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {purchaseHistory.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Belum ada riwayat pembelian</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No. Transaksi</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead>Items</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseHistory.map((transaction: any) => (
                          <TableRow key={transaction.transaction_id}>
                            <TableCell className="font-medium">
                              {transaction.transaction_number}
                            </TableCell>
                            <TableCell>
                              {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell>
                              Rp {transaction.total_amount.toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {transaction.points_earned > 0 && (
                                  <Badge variant="secondary">
                                    +{transaction.points_earned}
                                  </Badge>
                                )}
                                {transaction.points_used > 0 && (
                                  <Badge variant="destructive">
                                    -{transaction.points_used}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {transaction.items?.map((item: any, index: number) => (
                                  <div key={index}>
                                    {item.product_name} ({item.quantity}x)
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="points" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Point</CardTitle>
                </CardHeader>
                <CardContent>
                  {pointHistory.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Belum ada riwayat point</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Deskripsi</TableHead>
                          <TableHead>Perubahan Point</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pointHistory.map((point: any) => (
                          <TableRow key={point.id}>
                            <TableCell>
                              {new Date(point.created_at).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell>{point.description}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={point.points_change > 0 ? "secondary" : "destructive"}
                              >
                                {point.points_change > 0 ? '+' : ''}{point.points_change}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="redemptions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Redeem Point</CardTitle>
                </CardHeader>
                <CardContent>
                  {pointExchanges.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Belum ada riwayat redeem point</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Reward</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Points Digunakan</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pointExchanges.map((exchange: any) => (
                          <TableRow key={exchange.id}>
                            <TableCell>
                              {new Date(exchange.created_at).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{exchange.rewards?.name}</p>
                                {exchange.rewards?.description && (
                                  <p className="text-sm text-gray-500">{exchange.rewards.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{exchange.quantity}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">
                                -{exchange.points_used}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={exchange.status === 'completed' ? 'default' : 'secondary'}
                              >
                                {exchange.status === 'completed' ? 'Selesai' : 'Pending'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetails;
