
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Package, Plus, TrendingUp, TrendingDown, AlertTriangle, Upload, Download, Edit, Trash2 } from 'lucide-react';
import PurchaseForm from '@/components/PurchaseForm';
import ReturnsForm from '@/components/ReturnsForm';

const Inventory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [editPurchase, setEditPurchase] = useState<any>(null);
  const [editReturn, setEditReturn] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustmentData, setAdjustmentData] = useState({
    adjustment_type: 'increase',
    quantity_change: 0,
    reason: ''
  });

  // Fetch products with stock info
  const { data: products = [] } = useQuery({
    queryKey: ['inventory-products', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation),
          suppliers(name)
        `);
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch stock adjustments
  const { data: adjustments = [] } = useQuery({
    queryKey: ['stock-adjustments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_adjustments')
        .select(`
          *,
          products(name, barcode),
          profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch purchases
  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('purchases')
        .select(`
          *,
          suppliers(name),
          profiles(full_name),
          purchase_items(*)
        `);
      
      if (searchTerm) {
        query = query.or(`purchase_number.ilike.%${searchTerm}%,invoice_number.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch returns
  const { data: returns = [] } = useQuery({
    queryKey: ['returns', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('returns')
        .select(`
          *,
          suppliers(name),
          profiles(full_name),
          return_items(*)
        `);
      
      if (searchTerm) {
        query = query.or(`return_number.ilike.%${searchTerm}%,invoice_number.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Delete mutations
  const deletePurchase = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('purchases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      toast({ title: 'Berhasil', description: 'Pembelian berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteReturn = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('returns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      toast({ title: 'Berhasil', description: 'Return berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Stock adjustment mutation
  const adjustStockMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('stock_adjustments')
        .insert({
          product_id: selectedProduct.id,
          user_id: user?.id,
          adjustment_type: data.adjustment_type,
          quantity_change: parseInt(data.quantity_change),
          previous_stock: selectedProduct.current_stock,
          new_stock: selectedProduct.current_stock + (data.adjustment_type === 'increase' ? parseInt(data.quantity_change) : -parseInt(data.quantity_change)),
          reason: data.reason
        });

      if (error) throw error;

      // Update product stock
      const newStock = data.adjustment_type === 'increase' 
        ? selectedProduct.current_stock + parseInt(data.quantity_change)
        : selectedProduct.current_stock - parseInt(data.quantity_change);

      const { error: updateError } = await supabase
        .from('products')
        .update({ current_stock: newStock })
        .eq('id', selectedProduct.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast({ title: 'Stok berhasil disesuaikan' });
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      setSelectedProduct(null);
      setAdjustmentData({ adjustment_type: 'increase', quantity_change: 0, reason: '' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error adjusting stock', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock);
  const processReturns = returns?.filter(r => r.status === 'process') || [];
  const successReturns = returns?.filter(r => r.status === 'success') || [];

  const handleClosePurchaseDialog = () => {
    setShowPurchaseDialog(false);
    setEditPurchase(null);
  };

  const handleCloseReturnDialog = () => {
    setShowReturnDialog(false);
    setEditReturn(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Manajemen Inventori</h1>
          <div className="flex gap-2">
            <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditPurchase(null)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Tambah Pembelian
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editPurchase ? 'Edit Pembelian' : 'Tambah Pembelian Baru'}</DialogTitle>
                </DialogHeader>
                <PurchaseForm 
                  purchase={editPurchase}
                  onSuccess={handleClosePurchaseDialog}
                  onCancel={handleClosePurchaseDialog}
                />
              </DialogContent>
            </Dialog>
            
            <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setEditReturn(null)}>
                  <Download className="h-4 w-4 mr-2" />
                  Tambah Return
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editReturn ? 'Edit Return' : 'Tambah Return Baru'}</DialogTitle>
                </DialogHeader>
                <ReturnsForm 
                  returnData={editReturn}
                  onSuccess={handleCloseReturnDialog}
                  onCancel={handleCloseReturnDialog}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <Input
            placeholder="Cari produk, pembelian, atau return..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {products.reduce((sum, p) => sum + (p.current_stock * p.base_price), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList>
            <TabsTrigger value="products">Stock Levels</TabsTrigger>
            <TabsTrigger value="purchases">Purchases ({purchases.length})</TabsTrigger>
            <TabsTrigger value="returns">Returns ({processReturns.length}/{successReturns.length})</TabsTrigger>
            <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
            <TabsTrigger value="low-stock">Low Stock Alert</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Current Stock Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Min Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-10 h-10 object-cover rounded" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.barcode}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{product.categories?.name}</TableCell>
                        <TableCell>{product.current_stock} {product.units?.abbreviation}</TableCell>
                        <TableCell>{product.min_stock}</TableCell>
                        <TableCell>
                          {product.current_stock <= product.min_stock ? (
                            <Badge variant="destructive">Low Stock</Badge>
                          ) : product.current_stock <= product.min_stock * 2 ? (
                            <Badge variant="secondary">Warning</Badge>
                          ) : (
                            <Badge variant="default">Good</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedProduct(product)}
                              >
                                Adjust
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adjust Stock - {selectedProduct?.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Current Stock: {selectedProduct?.current_stock} {selectedProduct?.units?.abbreviation}</Label>
                                </div>
                                <div>
                                  <Label>Adjustment Type</Label>
                                  <Select 
                                    value={adjustmentData.adjustment_type} 
                                    onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, adjustment_type: value }))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="increase">Increase</SelectItem>
                                      <SelectItem value="decrease">Decrease</SelectItem>
                                      <SelectItem value="correction">Correction</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Quantity</Label>
                                  <Input
                                    type="number"
                                    value={adjustmentData.quantity_change}
                                    onChange={(e) => setAdjustmentData(prev => ({ ...prev, quantity_change: parseInt(e.target.value) || 0 }))}
                                  />
                                </div>
                                <div>
                                  <Label>Reason</Label>
                                  <Textarea
                                    value={adjustmentData.reason}
                                    onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                                    placeholder="Reason for adjustment..."
                                  />
                                </div>
                                <Button 
                                  className="w-full" 
                                  onClick={() => adjustStockMutation.mutate(adjustmentData)}
                                  disabled={adjustStockMutation.isPending}
                                >
                                  {adjustStockMutation.isPending ? 'Adjusting...' : 'Adjust Stock'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle>Purchase History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Pembelian</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jatuh Tempo</TableHead>
                      <TableHead>Dibuat oleh</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">{purchase.purchase_number}</TableCell>
                        <TableCell>{purchase.invoice_number || '-'}</TableCell>
                        <TableCell>{purchase.suppliers?.name || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            purchase.payment_method === 'credit' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {purchase.payment_method === 'credit' ? 'Credit' : 'Cash'}
                          </span>
                        </TableCell>
                        <TableCell>Rp {purchase.total_amount?.toLocaleString('id-ID')}</TableCell>
                        <TableCell>
                          {new Date(purchase.purchase_date).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell>
                          {purchase.due_date ? new Date(purchase.due_date).toLocaleDateString('id-ID') : '-'}
                        </TableCell>
                        <TableCell>{purchase.profiles?.full_name || 'Unknown'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditPurchase(purchase);
                                setShowPurchaseDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deletePurchase.mutate(purchase.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="returns">
            <Tabs defaultValue="process" className="w-full">
              <TabsList>
                <TabsTrigger value="process">Process ({processReturns.length})</TabsTrigger>
                <TabsTrigger value="history">History ({successReturns.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="process">
                <Card>
                  <CardHeader>
                    <CardTitle>Returns in Process</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No. Return</TableHead>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Dibuat oleh</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processReturns.map((returnItem) => (
                          <TableRow key={returnItem.id}>
                            <TableCell className="font-medium">{returnItem.return_number}</TableCell>
                            <TableCell>{returnItem.invoice_number || '-'}</TableCell>
                            <TableCell>{returnItem.suppliers?.name || '-'}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                Process
                              </span>
                            </TableCell>
                            <TableCell>Rp {returnItem.total_amount?.toLocaleString('id-ID')}</TableCell>
                            <TableCell>
                              {new Date(returnItem.return_date).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell>{returnItem.profiles?.full_name || 'Unknown'}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditReturn(returnItem);
                                    setShowReturnDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteReturn.mutate(returnItem.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Completed Returns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No. Return</TableHead>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Dibuat oleh</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {successReturns.map((returnItem) => (
                          <TableRow key={returnItem.id}>
                            <TableCell className="font-medium">{returnItem.return_number}</TableCell>
                            <TableCell>{returnItem.invoice_number || '-'}</TableCell>
                            <TableCell>{returnItem.suppliers?.name || '-'}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                Success
                              </span>
                            </TableCell>
                            <TableCell>Rp {returnItem.total_amount?.toLocaleString('id-ID')}</TableCell>
                            <TableCell>
                              {new Date(returnItem.return_date).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell>{returnItem.profiles?.full_name || 'Unknown'}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteReturn.mutate(returnItem.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="adjustments">
            <Card>
              <CardHeader>
                <CardTitle>Stock Adjustments History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map((adjustment) => (
                      <TableRow key={adjustment.id}>
                        <TableCell>{new Date(adjustment.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{adjustment.products?.name}</TableCell>
                        <TableCell>
                          <Badge variant={adjustment.adjustment_type === 'increase' ? 'default' : 'destructive'}>
                            {adjustment.adjustment_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {adjustment.adjustment_type === 'increase' ? '+' : '-'}{adjustment.quantity_change}
                        </TableCell>
                        <TableCell>{adjustment.profiles?.full_name}</TableCell>
                        <TableCell>{adjustment.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="low-stock">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockProducts.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No low stock items</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Min Stock</TableHead>
                        <TableHead>Shortage</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-10 h-10 object-cover rounded" />
                              ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.barcode}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-red-600">{product.current_stock}</TableCell>
                          <TableCell>{product.min_stock}</TableCell>
                          <TableCell className="text-red-600">
                            {product.min_stock - product.current_stock}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setShowPurchaseDialog(true);
                                setEditPurchase(null);
                              }}
                            >
                              Reorder
                            </Button>
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
    </Layout>
  );
};

export default Inventory;
