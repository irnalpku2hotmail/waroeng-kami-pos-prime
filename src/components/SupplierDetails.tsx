
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Building2, ShoppingCart, RotateCcw } from 'lucide-react';

interface SupplierDetailsProps {
  supplier: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SupplierDetails = ({ supplier, open, onOpenChange }: SupplierDetailsProps) => {
  const [purchaseHistoryYear, setPurchaseHistoryYear] = useState<string>('all');
  const [returnHistoryYear, setReturnHistoryYear] = useState<string>('all');

  // Get available years for filters
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  // Fetch purchase history using the database function
  const { data: allPurchaseHistory = [] } = useQuery({
    queryKey: ['supplier-purchase-history', supplier?.id],
    queryFn: async () => {
      if (!supplier?.id) return [];
      const { data, error } = await supabase.rpc('get_supplier_purchase_history', {
        supplier_uuid: supplier.id
      });
      if (error) throw error;
      return data;
    },
    enabled: !!supplier?.id
  });

  // Filter purchase history by year
  const purchaseHistory = allPurchaseHistory.filter(purchase => {
    if (purchaseHistoryYear === 'all') return true;
    const purchaseYear = new Date(purchase.purchase_date).getFullYear();
    return purchaseYear.toString() === purchaseHistoryYear;
  });

  // Fetch return history using the database function
  const { data: allReturnHistory = [] } = useQuery({
    queryKey: ['supplier-return-history', supplier?.id],
    queryFn: async () => {
      if (!supplier?.id) return [];
      const { data, error } = await supabase.rpc('get_supplier_return_history', {
        supplier_uuid: supplier.id
      });
      if (error) throw error;
      return data;
    },
    enabled: !!supplier?.id
  });

  // Filter return history by year
  const returnHistory = allReturnHistory.filter(returnItem => {
    if (returnHistoryYear === 'all') return true;
    const returnYear = new Date(returnItem.return_date).getFullYear();
    return returnYear.toString() === returnHistoryYear;
  });

  if (!supplier) return null;

  const getTotalPurchaseAmount = () => {
    return purchaseHistory.reduce((sum: number, purchase: any) => sum + parseFloat(purchase.total_amount), 0);
  };

  const getTotalReturnAmount = () => {
    return returnHistory.reduce((sum: number, returnItem: any) => sum + parseFloat(returnItem.total_amount), 0);
  };

  const getOverduePurchases = () => {
    return purchaseHistory.filter((purchase: any) => purchase.status === 'overdue');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Supplier - {supplier.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="purchases">Purchase History</TabsTrigger>
            <TabsTrigger value="returns">Return History</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Supplier Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Supplier Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nama Supplier</label>
                    <p className="font-medium">{supplier.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Kontak Person</label>
                    <p className="font-medium">{supplier.contact_person || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telepon</label>
                    <p className="font-medium">{supplier.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="font-medium">{supplier.email || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Alamat</label>
                    <p className="font-medium">{supplier.address || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Bergabung Sejak</label>
                    <p className="font-medium">{new Date(supplier.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Purchase Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Purchase Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Purchases</label>
                    <p className="text-2xl font-bold text-blue-600">{purchaseHistory.length}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Amount</label>
                    <p className="text-xl font-bold text-green-600">
                      Rp {getTotalPurchaseAmount().toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Overdue Payments</label>
                    <p className="text-lg font-bold text-red-600">{getOverduePurchases().length}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Return Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5" />
                    Return Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Returns</label>
                    <p className="text-2xl font-bold text-orange-600">{returnHistory.length}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Return Amount</label>
                    <p className="text-xl font-bold text-red-600">
                      Rp {getTotalReturnAmount().toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Success Rate</label>
                    <p className="text-lg font-bold text-gray-600">
                      {returnHistory.length > 0 
                        ? Math.round((returnHistory.filter((r: any) => r.status === 'success').length / returnHistory.length) * 100)
                        : 0}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="purchases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Purchase History ({purchaseHistory.length})
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="purchase-year-filter" className="text-sm font-normal">
                      Filter Tahun:
                    </Label>
                    <Select
                      value={purchaseHistoryYear}
                      onValueChange={setPurchaseHistoryYear}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua</SelectItem>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
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
                  <p className="text-center py-8 text-gray-500">Belum ada riwayat pembelian</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>No. Purchase</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Items</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseHistory.map((purchase: any) => (
                        <TableRow key={purchase.purchase_id}>
                          <TableCell>
                            {new Date(purchase.purchase_date).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {purchase.purchase_number}
                          </TableCell>
                          <TableCell>
                            <Badge variant={purchase.payment_method === 'credit' ? 'secondary' : 'default'}>
                              {purchase.payment_method}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              purchase.status === 'overdue' ? 'destructive' :
                              purchase.status === 'pending' ? 'secondary' : 'default'
                            }>
                              {purchase.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            Rp {parseFloat(purchase.total_amount).toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 max-w-xs">
                              {purchase.items.map((item: any, index: number) => (
                                <div key={index} className="text-sm">
                                  <div className="font-medium">{item.product_name}</div>
                                  <div className="text-gray-500">
                                    Qty: {item.quantity} @ Rp {parseFloat(item.unit_cost).toLocaleString('id-ID')}
                                    {item.expiration_date && (
                                      <span className="ml-2 text-orange-600">
                                        Exp: {new Date(item.expiration_date).toLocaleDateString('id-ID')}
                                      </span>
                                    )}
                                  </div>
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

          <TabsContent value="returns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5" />
                    Return History ({returnHistory.length})
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="return-year-filter" className="text-sm font-normal">
                      Filter Tahun:
                    </Label>
                    <Select
                      value={returnHistoryYear}
                      onValueChange={setReturnHistoryYear}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua</SelectItem>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {returnHistory.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">Belum ada riwayat return</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>No. Return</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Items</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returnHistory.map((returnItem: any) => (
                        <TableRow key={returnItem.return_id}>
                          <TableCell>
                            {new Date(returnItem.return_date).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {returnItem.return_number}
                          </TableCell>
                          <TableCell>
                            <Badge variant={returnItem.status === 'success' ? 'default' : 'secondary'}>
                              {returnItem.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={returnItem.reason}>
                              {returnItem.reason || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            Rp {parseFloat(returnItem.total_amount).toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 max-w-xs">
                              {returnItem.items.map((item: any, index: number) => (
                                <div key={index} className="text-sm">
                                  <div className="font-medium">{item.product_name}</div>
                                  <div className="text-gray-500">
                                    Qty: {item.quantity} @ Rp {parseFloat(item.unit_cost).toLocaleString('id-ID')}
                                  </div>
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierDetails;
