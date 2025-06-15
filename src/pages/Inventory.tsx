import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Package, TrendingUp, AlertTriangle } from 'lucide-react';

const Inventory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
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

  // Stock adjustment mutation
  const adjustStockMutation = useMutation({
    mutationFn: async (data: any) => {
      const currentStock = selectedProduct.current_stock;
      const quantityChange = parseInt(data.quantity_change);
      let newStock: number;
      let quantityForRecord: number;
      
      if (data.adjustment_type === 'correction') {
        newStock = quantityChange;
        quantityForRecord = Math.abs(currentStock - newStock);
      } else {
        newStock = data.adjustment_type === 'increase' 
          ? currentStock + quantityChange
          : currentStock - quantityChange;
        quantityForRecord = quantityChange;
      }

      const { error } = await supabase
        .from('stock_adjustments')
        .insert({
          product_id: selectedProduct.id,
          user_id: user?.id,
          adjustment_type: data.adjustment_type,
          quantity_change: quantityForRecord,
          previous_stock: currentStock,
          new_stock: newStock,
          reason: data.reason
        });

      if (error) throw error;

      // Update product stock
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
      setIsAdjustmentDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error adjusting stock', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const handleOpenAdjustDialog = (product: any) => {
    setSelectedProduct(product);
    setAdjustmentData({ adjustment_type: 'increase', quantity_change: 0, reason: '' });
    setIsAdjustmentDialogOpen(true);
  };

  const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Manajemen Inventori</h1>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <Input
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produk Stok Rendah</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Nilai Stok</CardTitle>
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
            <TabsTrigger value="products">Level Stok</TabsTrigger>
            <TabsTrigger value="adjustments">Penyesuaian</TabsTrigger>
            <TabsTrigger value="low-stock">Peringatan Stok Rendah</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Level Stok Saat Ini</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Stok Saat Ini</TableHead>
                      <TableHead>Stok Minimum</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
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
                            <Badge variant="destructive">Stok Rendah</Badge>
                          ) : product.current_stock <= product.min_stock * 2 ? (
                            <Badge variant="secondary">Peringatan</Badge>
                          ) : (
                            <Badge variant="default">Baik</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleOpenAdjustDialog(product)}
                          >
                            Sesuaikan
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="adjustments">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Penyesuaian Stok</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Perubahan</TableHead>
                      <TableHead>Pengguna</TableHead>
                      <TableHead>Alasan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map((adjustment) => (
                      <TableRow key={adjustment.id}>
                        <TableCell>{new Date(adjustment.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{adjustment.products?.name}</TableCell>
                        <TableCell>
                          <Badge variant={
                            adjustment.adjustment_type === 'increase' ? 'default' :
                            adjustment.adjustment_type === 'decrease' ? 'destructive' : 'secondary'
                          }>
                            {adjustment.adjustment_type === 'increase' ? 'Tambah' : 
                             adjustment.adjustment_type === 'decrease' ? 'Kurangi' : 'Koreksi'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {adjustment.adjustment_type === 'correction' ? (
                            `${adjustment.previous_stock} → ${adjustment.new_stock}`
                          ) : (
                            `${adjustment.adjustment_type === 'increase' ? '+' : '-'}${adjustment.quantity_change}`
                          )}
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
                  Peringatan Stok Rendah
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockProducts.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">Tidak ada produk dengan stok rendah</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Stok Saat Ini</TableHead>
                        <TableHead>Stok Minimum</TableHead>
                        <TableHead>Kekurangan</TableHead>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Sesuaikan Stok - {selectedProduct?.name}</DialogTitle>
              <DialogDescription>
                Lakukan penyesuaian jumlah stok produk. Perubahan ini akan tercatat dalam riwayat.
              </DialogDescription>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4 py-4">
                <div>
                  <Label>Stok Saat Ini: {selectedProduct.current_stock} {selectedProduct.units?.abbreviation}</Label>
                </div>
                <div>
                  <Label htmlFor="adjustment_type">Jenis Penyesuaian</Label>
                  <Select
                    name="adjustment_type"
                    value={adjustmentData.adjustment_type} 
                    onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, adjustment_type: value }))}
                  >
                    <SelectTrigger id="adjustment_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="increase">Tambah</SelectItem>
                      <SelectItem value="decrease">Kurangi</SelectItem>
                      <SelectItem value="correction">Koreksi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity_change">Jumlah</Label>
                  <Input
                    id="quantity_change"
                    type="number"
                    value={adjustmentData.quantity_change}
                    onChange={(e) => setAdjustmentData(prev => ({ ...prev, quantity_change: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Alasan</Label>
                  <Textarea
                    id="reason"
                    value={adjustmentData.reason}
                    onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Alasan penyesuaian..."
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => adjustStockMutation.mutate(adjustmentData)}
                  disabled={adjustStockMutation.isPending}
                >
                  {adjustStockMutation.isPending ? 'Menyesuaikan...' : 'Simpan Penyesuaian'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Inventory;
