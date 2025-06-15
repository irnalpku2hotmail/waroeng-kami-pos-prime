import { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import InventoryStats from '@/components/inventory/InventoryStats';
import StockLevelTable from '@/components/inventory/StockLevelTable';
import LoadingSkeleton from '@/components/inventory/LoadingSkeleton';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [purchaseSearchTerm, setPurchaseSearchTerm] = useState('');
  const [returnSearchTerm, setReturnSearchTerm] = useState('');

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    adjustment_type: 'increase',
    quantity_change: 0,
    reason: ''
  });

  // Purchase states
  const [open, setOpen] = useState(false);
  const [editPurchase, setEditPurchase] = useState<any>(null);
  const [selectedPurchaseForPayment, setSelectedPurchaseForPayment] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPurchaseForDetail, setSelectedPurchaseForDetail] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Return states
  const [returnOpen, setReturnOpen] = useState(false);
  const [editReturn, setEditReturn] = useState<any>(null);
  const [selectedReturnForDetail, setSelectedReturnForDetail] = useState<any>(null);
  const [returnDetailDialogOpen, setReturnDetailDialogOpen] = useState(false);

  // Fetch products with loading optimization
  const { data: products = [], isLoading: productsLoading } = useQuery({
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
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch purchases
  const { data: purchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ['purchases', purchaseSearchTerm],
    queryFn: async () => {
      let query = supabase
        .from('purchases')
        .select(`
          *,
          suppliers(name),
          profiles(full_name),
          purchase_items(*,
            products(name)
          )
        `);
      
      if (purchaseSearchTerm) {
        query = query.or(`purchase_number.ilike.%${purchaseSearchTerm}%,invoice_number.ilike.%${purchaseSearchTerm}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch returns
  const { data: returns, isLoading: returnsLoading } = useQuery({
    queryKey: ['returns', returnSearchTerm],
    queryFn: async () => {
      let query = supabase
        .from('returns')
        .select(`
          *,
          suppliers(name),
          profiles(full_name),
          return_items(*,
            products(name)
          )
        `);
      
      if (returnSearchTerm) {
        query = query.or(`return_number.ilike.%${returnSearchTerm}%,invoice_number.ilike.%${returnSearchTerm}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
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

  // Purchase mutations
  const deletePurchase = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('purchases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast({ title: 'Berhasil', description: 'Pembelian berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const markAsPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('purchases')
        .update({ payment_method: 'cash' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast({ title: 'Berhasil', description: 'Pembelian berhasil ditandai sebagai lunas' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Return mutations
  const deleteReturn = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('returns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast({ title: 'Berhasil', description: 'Return berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateReturnStatus = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('returns')
        .update({ status: 'success' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast({ title: 'Berhasil', description: 'Status return berhasil diubah ke Success' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock);
  const totalStockValue = products.reduce((sum, p) => sum + (p.current_stock * p.base_price), 0);

  const handleCloseDialog = () => {
    setOpen(false);
    setEditPurchase(null);
  };

  const handleCloseReturnDialog = () => {
    setReturnOpen(false);
    setEditReturn(null);
  };

  const openPaymentDialog = (purchase: any) => {
    setSelectedPurchaseForPayment(purchase);
    setPaymentDialogOpen(true);
  };

  const openDetailDialog = (purchase: any) => {
    setSelectedPurchaseForDetail(purchase);
    setDetailDialogOpen(true);
  };

  const openReturnDetailDialog = (returnData: any) => {
    setSelectedReturnForDetail(returnData);
    setReturnDetailDialogOpen(true);
  };

  const getPaymentStatus = (purchase: any) => {
    if (purchase.payment_method === 'cash') {
      return <Badge className="bg-green-600">Paid</Badge>;
    } else if (purchase.payment_method === 'credit') {
      const isOverdue = purchase.due_date && new Date(purchase.due_date) < new Date();
      return (
        <Badge className={isOverdue ? 'bg-red-600' : 'bg-orange-600'}>
          {isOverdue ? 'Overdue' : 'Pending'}
        </Badge>
      );
    }
    return <Badge className="bg-gray-600">Unknown</Badge>;
  };

  const processReturns = returns?.filter(r => r.status === 'process') || [];
  const successReturns = returns?.filter(r => r.status === 'success') || [];

  const ReturnTable = ({ data }: { data: any[] }) => (
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
        {data.map((returnItem) => (
          <TableRow key={returnItem.id}>
            <TableCell className="font-medium">{returnItem.return_number}</TableCell>
            <TableCell>{returnItem.invoice_number || '-'}</TableCell>
            <TableCell>{returnItem.suppliers?.name || '-'}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-xs ${
                returnItem.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {returnItem.status === 'success' ? 'Success' : 'Process'}
              </span>
            </TableCell>
            <TableCell>Rp {returnItem.total_amount?.toLocaleString('id-ID')}</TableCell>
            <TableCell>
              {new Date(returnItem.return_date).toLocaleDateString('id-ID')}
            </TableCell>
            <TableCell>{returnItem.profiles?.full_name || 'Unknown'}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => openReturnDetailDialog(returnItem)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Detail
                  </DropdownMenuItem>
                  {returnItem.status === 'process' && (
                    <DropdownMenuItem
                      onClick={() => updateReturnStatus.mutate(returnItem.id)}
                      className="text-green-600 focus:text-green-600"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Complete
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      setEditReturn(returnItem);
                      setReturnOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => deleteReturn.mutate(returnItem.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (productsLoading) {
    return (
      <Layout>
        <LoadingSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Manajemen Inventori</h1>
        </div>

        <InventoryStats 
          totalProducts={products.length}
          lowStockProducts={lowStockProducts.length}
          totalStockValue={totalStockValue}
        />

        <Tabs defaultValue="products" className="w-full">
          <TabsList>
            <TabsTrigger value="products">Level Stok</TabsTrigger>
            <TabsTrigger value="adjustments">Penyesuaian</TabsTrigger>
            <TabsTrigger value="low-stock">Peringatan Stok Rendah</TabsTrigger>
            <TabsTrigger value="purchases">Pembelian</TabsTrigger>
            <TabsTrigger value="returns">Return</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Suspense fallback={<LoadingSkeleton />}>
              <StockLevelTable 
                products={products}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </Suspense>
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
                      <TableHead>Jumlah</TableHead>
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
                          <Badge variant={adjustment.adjustment_type === 'increase' ? 'default' : 'destructive'}>
                            {adjustment.adjustment_type === 'increase' ? 'Tambah' : 
                             adjustment.adjustment_type === 'decrease' ? 'Kurangi' : 'Koreksi'}
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

          <TabsContent value="purchases">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Manajemen Pembelian</h3>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditPurchase(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Pembelian
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editPurchase ? 'Edit Pembelian' : 'Tambah Pembelian Baru'}</DialogTitle>
                    </DialogHeader>
                    <PurchaseForm 
                      purchase={editPurchase}
                      onSuccess={handleCloseDialog}
                      onCancel={handleCloseDialog}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex gap-4">
                <Input
                  placeholder="Cari nomor pembelian atau invoice..."
                  value={purchaseSearchTerm}
                  onChange={(e) => setPurchaseSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="border rounded-lg">
                {purchasesLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : purchases?.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Belum ada pembelian</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. Pembelian</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Jatuh Tempo</TableHead>
                        <TableHead>Dibuat oleh</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases?.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell className="font-medium">{purchase.purchase_number}</TableCell>
                          <TableCell>{purchase.invoice_number || '-'}</TableCell>
                          <TableCell>{purchase.suppliers?.name || '-'}</TableCell>
                          <TableCell>{getPaymentStatus(purchase)}</TableCell>
                          <TableCell>Rp {purchase.total_amount?.toLocaleString('id-ID')}</TableCell>
                          <TableCell>
                            {new Date(purchase.purchase_date).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell>
                            {purchase.due_date ? new Date(purchase.due_date).toLocaleDateString('id-ID') : '-'}
                          </TableCell>
                          <TableCell>{purchase.profiles?.full_name || 'Unknown'}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => openDetailDialog(purchase)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Detail
                                </DropdownMenuItem>
                                {purchase.payment_method === 'credit' && (
                                  <>
                                    <DropdownMenuItem onClick={() => openPaymentDialog(purchase)}>
                                      <CreditCard className="h-4 w-4 mr-2" />
                                      Catat Pembayaran
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => markAsPaid.mutate(purchase.id)}>
                                      <Check className="h-4 w-4 mr-2" />
                                      Tandai Lunas
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setEditPurchase(purchase);
                                    setOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => deletePurchase.mutate(purchase.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Credit Payment Dialog */}
              <CreditPaymentForm
                purchase={selectedPurchaseForPayment}
                open={paymentDialogOpen}
                onOpenChange={setPaymentDialogOpen}
              />

              {/* Purchase Detail Dialog */}
              <PurchaseDetailModal
                purchase={selectedPurchaseForDetail}
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
              />
            </div>
          </TabsContent>

          <TabsContent value="returns">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Manajemen Return</h3>
                <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditReturn(null)}>
                      <Plus className="h-4 w-4 mr-2" />
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

              <div className="flex gap-4">
                <Input
                  placeholder="Cari nomor return atau invoice..."
                  value={returnSearchTerm}
                  onChange={(e) => setReturnSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <Tabs defaultValue="process" className="w-full">
                <TabsList>
                  <TabsTrigger value="process">Process ({processReturns.length})</TabsTrigger>
                  <TabsTrigger value="history">History ({successReturns.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="process">
                  <div className="border rounded-lg">
                    {returnsLoading ? (
                      <div className="text-center py-8">Loading...</div>
                    ) : processReturns.length === 0 ? (
                      <div className="text-center py-8">
                        <RotateCcw className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">Belum ada return dalam proses</p>
                      </div>
                    ) : (
                      <ReturnTable data={processReturns} />
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="history">
                  <div className="border rounded-lg">
                    {returnsLoading ? (
                      <div className="text-center py-8">Loading...</div>
                    ) : successReturns.length === 0 ? (
                      <div className="text-center py-8">
                        <RotateCcw className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">Belum ada return yang selesai</p>
                      </div>
                    ) : (
                      <ReturnTable data={successReturns} />
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Inventory;
