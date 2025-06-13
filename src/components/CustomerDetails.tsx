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

interface CustomerDetailsProps {
  customer: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CustomerDetails = ({ customer, open, onOpenChange }: CustomerDetailsProps) => {
  // Fetch purchase history
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

  const generateQRCode = async () => {
    if (!customer) return;
    
    try {
      // Generate QR code URL using a service like qr-server.com
      const qrData = JSON.stringify({
        customerId: customer.id,
        customerCode: customer.customer_code,
        name: customer.name
      });
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
      
      // Update customer with QR code URL
      const { error } = await supabase
        .from('customers')
        .update({ qr_code_url: qrCodeUrl })
        .eq('id', customer.id);
      
      if (error) throw error;
      
      toast({ title: 'Berhasil', description: 'QR Code berhasil dibuat' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const printMemberCard = () => {
    if (!customer) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

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
            .card-header { text-align: center; margin-bottom: 10px; }
            .store-name { font-size: 16px; font-weight: bold; }
            .member-info { margin: 8px 0; }
            .member-name { font-size: 14px; font-weight: bold; }
            .member-code { font-size: 12px; }
            .qr-code { text-align: center; margin-top: 10px; }
            .qr-code img { width: 60px; height: 60px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="card-header">
              <div class="store-name">SmartPOS</div>
              <div style="font-size: 12px;">MEMBER CARD</div>
            </div>
            <div class="member-info">
              <div class="member-name">${customer.name}</div>
              <div class="member-code">ID: ${customer.customer_code}</div>
              <div style="font-size: 10px;">Bergabung: ${new Date(customer.created_at).toLocaleDateString('id-ID')}</div>
            </div>
            ${customer.qr_code_url ? `
              <div class="qr-code">
                <img src="${customer.qr_code_url}" alt="QR Code" />
              </div>
            ` : ''}
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
                  Member Card
                </span>
                <div className="flex gap-2">
                  {!customer.qr_code_url && (
                    <Button size="sm" variant="outline" onClick={generateQRCode}>
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate QR
                    </Button>
                  )}
                  <Button size="sm" onClick={printMemberCard}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Card
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
                      <h3 className="text-xl font-bold">SmartPOS</h3>
                      <p className="text-sm opacity-90">MEMBER CARD</p>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-lg font-semibold">{customer.name}</p>
                      <p className="text-sm opacity-90">ID: {customer.customer_code}</p>
                      <p className="text-xs opacity-75">
                        Bergabung: {new Date(customer.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    
                    {customer.qr_code_url && (
                      <div className="absolute bottom-4 right-4">
                        <img 
                          src={customer.qr_code_url} 
                          alt="QR Code" 
                          className="w-16 h-16 bg-white p-1 rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History Tabs */}
          <Tabs defaultValue="purchases" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="purchases">Riwayat Pembelian</TabsTrigger>
              <TabsTrigger value="points">Riwayat Point</TabsTrigger>
            </TabsList>
            
            <TabsContent value="purchases" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Pembelian</CardTitle>
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
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetails;
