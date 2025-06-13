
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreditCard, History, Trophy, QrCode } from 'lucide-react';

interface CustomerDetailsProps {
  customer: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CustomerDetails = ({ customer, open, onOpenChange }: CustomerDetailsProps) => {
  // Fetch purchase history using the database function
  const { data: purchaseHistory = [] } = useQuery({
    queryKey: ['customer-purchase-history', customer?.id],
    queryFn: async () => {
      if (!customer?.id) return [];
      const { data, error } = await supabase.rpc('get_customer_purchase_history', {
        customer_uuid: customer.id
      });
      if (error) throw error;
      return data;
    },
    enabled: !!customer?.id
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
    enabled: !!customer?.id
  });

  if (!customer) return null;

  const generateQRCode = () => {
    // Simple QR code URL generator (you can replace with actual QR library)
    const qrData = `customer:${customer.customer_code}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Customer - {customer.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="purchases">Purchase History</TabsTrigger>
            <TabsTrigger value="points">Point History</TabsTrigger>
            <TabsTrigger value="member-card">Member Card</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer Code</label>
                    <p className="font-medium">{customer.customer_code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nama</label>
                    <p className="font-medium">{customer.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="font-medium">{customer.email || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telepon</label>
                    <p className="font-medium">{customer.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Points</label>
                    <p className="font-medium text-blue-600">{customer.total_points} pts</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Spent</label>
                    <p className="font-medium text-green-600">Rp {(customer.total_spent || 0).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Alamat</label>
                    <p className="font-medium">{customer.address || '-'}</p>
                  </div>
                  {customer.date_of_birth && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tanggal Lahir</label>
                      <p className="font-medium">{new Date(customer.date_of_birth).toLocaleDateString('id-ID')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Purchase History ({purchaseHistory.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {purchaseHistory.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">Belum ada riwayat pembelian</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>No. Transaksi</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Points Earned</TableHead>
                        <TableHead>Points Used</TableHead>
                        <TableHead>Items</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseHistory.map((transaction: any) => (
                        <TableRow key={transaction.transaction_id}>
                          <TableCell>
                            {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {transaction.transaction_number}
                          </TableCell>
                          <TableCell>
                            Rp {transaction.total_amount.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="text-green-600">
                            +{transaction.points_earned}
                          </TableCell>
                          <TableCell className="text-red-600">
                            -{transaction.points_used || 0}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {transaction.items.map((item: any, index: number) => (
                                <div key={index} className="text-sm">
                                  {item.product_name} x{item.quantity}
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
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Point History ({pointHistory.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pointHistory.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">Belum ada riwayat poin</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Points Change</TableHead>
                        <TableHead>Type</TableHead>
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
                            <span className={point.points_change > 0 ? 'text-green-600' : 'text-red-600'}>
                              {point.points_change > 0 ? '+' : ''}{point.points_change}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={point.points_change > 0 ? 'default' : 'destructive'}>
                              {point.points_change > 0 ? 'Earned' : 'Used'}
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

          <TabsContent value="member-card" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Member Card
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-md mx-auto">
                  {/* Member Card Design */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold">MEMBER CARD</h3>
                        <p className="text-sm opacity-90">Retail Store</p>
                      </div>
                      <CreditCard className="h-8 w-8" />
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div>
                        <p className="text-xs opacity-75">MEMBER NAME</p>
                        <p className="font-bold text-lg">{customer.name.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-xs opacity-75">MEMBER ID</p>
                        <p className="font-mono text-sm">{customer.customer_code}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs opacity-75">POINTS BALANCE</p>
                        <p className="font-bold text-xl">{customer.total_points}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-75">MEMBER SINCE</p>
                        <p className="text-sm">{new Date(customer.created_at).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="mt-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <QrCode className="h-5 w-5" />
                      <h4 className="font-medium">QR Code</h4>
                    </div>
                    <div className="bg-white p-4 rounded-lg border inline-block">
                      <img 
                        src={generateQRCode()} 
                        alt="Customer QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Scan QR code untuk identifikasi customer
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetails;
