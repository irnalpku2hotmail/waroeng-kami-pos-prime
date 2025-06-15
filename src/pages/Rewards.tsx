
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Gift, Search, X, Star, Package, Users } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';

const Rewards = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State for Reward Management
  const [open, setOpen] = useState(false);
  const [editReward, setEditReward] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [rewardData, setRewardData] = useState({
    name: '',
    description: '',
    stock_quantity: 0,
    is_active: true
  });

  // State for Point Exchange
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Query for products (for reward creation)
  const { data: products = [] } = useQuery({
    queryKey: ['products-search', productSearch],
    queryFn: async () => {
      if (!productSearch.trim()) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${productSearch}%`)
        .eq('is_active', true)
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: productSearch.length > 0
  });

  // Query for rewards (for management tab)
  const { data: allRewards, isLoading: isLoadingAllRewards } = useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select(`
          *,
          reward_items (
            id,
            quantity,
            points_required,
            products (id, name, selling_price, image_url)
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Query for customer stats
  const { data: customerStats } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('total_points');
      if (error) throw error;
      const totalPoints = data?.reduce((sum, customer) => sum + (customer.total_points || 0), 0) || 0;
      return { totalPoints };
    }
  });

  // Query for customers (for exchange tab)
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];
      let query = supabase.from('customers').select('*');
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,customer_code.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }
      const { data, error } = await query.order('name').limit(10);
      if (error) throw error;
      return data;
    },
    enabled: searchTerm.length > 0
  });

  // Query for available rewards (for exchange tab)
  const { data: exchangeableRewards = [] } = useQuery({
    queryKey: ['available-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select(`*, reward_items (id, quantity, points_required, products (id, name, selling_price, image_url))`)
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Query for recent exchanges (for history tab)
  const { data: recentExchanges = [] } = useQuery({
    queryKey: ['recent-exchanges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('point_exchanges')
        .select(`*, customers(name, customer_code), rewards(name), profiles(full_name)`)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    }
  });

  // Totals for summary cards
  const totalAvailableRewards = allRewards?.filter(reward => reward.is_active && reward.stock_quantity > 0).length || 0;
  const totalAvailablePoints = customerStats?.totalPoints || 0;

  // Mutations for Reward Management
  const createReward = useMutation({
    mutationFn: async (data: any) => {
      const { data: reward, error } = await supabase.from('rewards').insert({ name: data.name, description: data.description, stock_quantity: data.stock_quantity, is_active: data.is_active }).select().single();
      if (error) throw error;
      if (selectedProducts.length > 0) {
        const rewardItems = selectedProducts.map(product => ({ reward_id: reward.id, product_id: product.id, quantity: product.quantity, points_required: product.points_required }));
        const { error: itemsError } = await supabase.from('reward_items').insert(rewardItems);
        if (itemsError) throw itemsError;
      }
      return reward;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      setOpen(false);
      setRewardData({ name: '', description: '', stock_quantity: 0, is_active: true });
      setSelectedProducts([]);
      toast({ title: 'Berhasil', description: 'Reward berhasil dibuat' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateReward = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase.from('rewards').update({ name: data.name, description: data.description, stock_quantity: data.stock_quantity, is_active: data.is_active }).eq('id', id);
      if (error) throw error;
      await supabase.from('reward_items').delete().eq('reward_id', id);
      if (selectedProducts.length > 0) {
        const rewardItems = selectedProducts.map(product => ({ reward_id: id, product_id: product.id, quantity: product.quantity, points_required: product.points_required }));
        const { error: itemsError } = await supabase.from('reward_items').insert(rewardItems);
        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      setOpen(false);
      setEditReward(null);
      setRewardData({ name: '', description: '', stock_quantity: 0, is_active: true });
      setSelectedProducts([]);
      toast({ title: 'Berhasil', description: 'Reward berhasil diupdate' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteReward = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rewards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      toast({ title: 'Berhasil', description: 'Reward berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Mutation for Point Exchange
  const processExchange = useMutation({
    mutationFn: async ({ customerId, rewardId, pointsCost, quantity }: any) => {
      const { data: customer, error: customerError } = await supabase.from('customers').select('total_points').eq('id', customerId).single();
      if (customerError) throw customerError;
      if (customer.total_points < pointsCost) throw new Error('Customer tidak memiliki poin yang cukup');
      const { data: reward, error: rewardError } = await supabase.from('rewards').select('stock_quantity').eq('id', rewardId).single();
      if (rewardError) throw rewardError;
      if (reward.stock_quantity < quantity) throw new Error('Stok reward tidak mencukupi');
      const { data: exchange, error: exchangeError } = await supabase.from('point_exchanges').insert({ customer_id: customerId, reward_id: rewardId, points_used: pointsCost, quantity: quantity, total_points_cost: pointsCost, processed_by: user?.id }).select().single();
      if (exchangeError) throw exchangeError;
      const { error: updateError } = await supabase.from('customers').update({ total_points: customer.total_points - pointsCost }).eq('id', customerId);
      if (updateError) throw updateError;
      const { error: stockError } = await supabase.from('rewards').update({ stock_quantity: reward.stock_quantity - quantity }).eq('id', rewardId);
      if (stockError) throw stockError;
      const { error: transactionError } = await supabase.from('point_transactions').insert({ customer_id: customerId, reward_id: rewardId, points_change: -pointsCost, description: `Penukaran reward` });
      if (transactionError) throw transactionError;
      return exchange;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-search'] });
      queryClient.invalidateQueries({ queryKey: ['available-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['recent-exchanges'] });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      const currentSelectedCustomer = selectedCustomer;
      if (currentSelectedCustomer) {
        queryClient.invalidateQueries({queryKey: ['customers', currentSelectedCustomer.id]});
      }
      setSelectedCustomer(null);
      setSearchTerm('');
      toast({ title: 'Berhasil', description: 'Penukaran poin berhasil diproses' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Handlers
  const addProductToReward = (product: any) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      toast({ title: 'Produk sudah ditambahkan', variant: 'destructive' });
      return;
    }
    setSelectedProducts([...selectedProducts, { ...product, quantity: 1, points_required: 100 }]);
    setProductSearch('');
    setShowProductSearch(false);
  };
  
  const removeProductFromReward = (productId: string) => setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  const updateProductRewardData = (productId: string, field: string, value: any) => setSelectedProducts(selectedProducts.map(p => p.id === productId ? { ...p, [field]: value } : p));
  
  const handleEdit = (reward: any) => {
    setEditReward(reward);
    setRewardData({ name: reward.name, description: reward.description || '', stock_quantity: reward.stock_quantity, is_active: reward.is_active });
    setSelectedProducts(reward.reward_items?.map((item: any) => ({ ...item.products, quantity: item.quantity, points_required: item.points_required })) || []);
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editReward) {
      updateReward.mutate({ id: editReward.id, ...rewardData });
    } else {
      createReward.mutate(rewardData);
    }
  };
  
  const handleExchange = (reward: any) => {
    if (!selectedCustomer) {
      toast({ title: 'Error', description: 'Pilih customer terlebih dahulu', variant: 'destructive' });
      return;
    }
    const totalPointsCost = reward.reward_items?.reduce((sum: number, item: any) => sum + item.points_required, 0) || 0;
    processExchange.mutate({ customerId: selectedCustomer.id, rewardId: reward.id, pointsCost: totalPointsCost, quantity: 1 });
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-blue-800">Rewards</h1>

        <Tabs defaultValue="exchange" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="exchange">Exchange Points</TabsTrigger>
            <TabsTrigger value="manage">Manage Rewards</TabsTrigger>
            <TabsTrigger value="history">Exchange History</TabsTrigger>
          </TabsList>

          <TabsContent value="exchange" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Pilih Customer</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder="Cari nama, kode, atau telepon customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <Button variant="outline"><Search className="h-4 w-4" /></Button>
                  </div>
                  {selectedCustomer && (
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <h3 className="font-semibold">{selectedCustomer.name}</h3>
                      <p className="text-sm text-gray-600">Kode: {selectedCustomer.customer_code}</p>
                      <p className="text-sm text-gray-600">Telepon: {selectedCustomer.phone}</p>
                      <div className="flex items-center gap-2 mt-2"><Star className="h-4 w-4 text-yellow-500" /><span className="font-medium">{selectedCustomer.total_points} Poin</span></div>
                      <Button size="sm" variant="outline" onClick={() => setSelectedCustomer(null)} className="mt-2">Ganti Customer</Button>
                    </div>
                  )}
                  {searchTerm && customers.length > 0 && !selectedCustomer && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {customers.map((customer) => (
                        <div key={customer.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                          <div className="flex justify-between items-center">
                            <div><h4 className="font-medium">{customer.name}</h4><p className="text-sm text-gray-500">{customer.customer_code}</p></div>
                            <div className="text-right"><div className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" /><span className="font-medium">{customer.total_points}</span></div></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5" />Reward Tersedia</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {exchangeableRewards.map((reward) => {
                      const totalPoints = reward.reward_items?.reduce((sum: number, item: any) => sum + item.points_required, 0) || 0;
                      const canAfford = selectedCustomer && selectedCustomer.total_points >= totalPoints;
                      return (
                        <div key={reward.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div><h4 className="font-medium">{reward.name}</h4>{reward.description && (<p className="text-sm text-gray-600">{reward.description}</p>)}</div>
                            <Badge variant={reward.stock_quantity > 0 ? "default" : "destructive"}>{reward.stock_quantity} tersisa</Badge>
                          </div>
                          {reward.reward_items && reward.reward_items.length > 0 && (
                            <div className="text-sm space-y-1 mb-3">
                              {reward.reward_items.map((item: any) => (<div key={item.id} className="flex justify-between"><span>{item.quantity}x {item.products?.name}</span><span>{item.points_required} poin</span></div>))}
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" /><span className="font-bold">{totalPoints} Poin</span></div>
                            <Button size="sm" onClick={() => handleExchange(reward)} disabled={!selectedCustomer || !canAfford || reward.stock_quantity === 0}>Tukar</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="manage" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div/>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditReward(null); setRewardData({ name: '', description: '', stock_quantity: 0, is_active: true }); setSelectedProducts([]); }}>
                      <Plus className="h-4 w-4 mr-2" />Tambah Reward
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editReward ? 'Edit Reward' : 'Tambah Reward Baru'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="name">Nama Reward *</Label><Input id="name" value={rewardData.name} onChange={(e) => setRewardData(prev => ({ ...prev, name: e.target.value }))} placeholder="Reward Menarik" required/></div>
                        <div className="space-y-2"><Label htmlFor="stock_quantity">Stok Tersedia</Label><Input id="stock_quantity" type="number" value={rewardData.stock_quantity} onChange={(e) => setRewardData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))} placeholder="0"/></div>
                      </div>
                      <div className="space-y-2"><Label htmlFor="description">Deskripsi</Label><Textarea id="description" value={rewardData.description} onChange={(e) => setRewardData(prev => ({ ...prev, description: e.target.value }))} placeholder="Deskripsi reward"/></div>
                      <div className="flex items-center space-x-2"><Switch id="is_active" checked={rewardData.is_active} onCheckedChange={(checked) => setRewardData(prev => ({ ...prev, is_active: checked }))}/><Label htmlFor="is_active">Status Aktif</Label></div>
                      <div>
                        <Label>Produk Reward</Label>
                        <div className="space-y-2">
                          <Button type="button" variant="outline" onClick={() => setShowProductSearch(!showProductSearch)} className="w-full"><Search className="h-4 w-4 mr-2" />Cari Produk</Button>
                          {showProductSearch && (
                            <div className="border rounded-lg p-4 space-y-2">
                              <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Cari produk..."/>
                              {products.length > 0 && (<div className="max-h-40 overflow-y-auto space-y-1">{products.map((product) => (<div key={product.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => addProductToReward(product)}><span>{product.name}</span><span className="text-sm text-gray-500">Rp {product.selling_price.toLocaleString()}</span></div>))}</div>)}
                            </div>
                          )}
                          {selectedProducts.length > 0 && (
                            <div className="space-y-2"><Label>Produk Terpilih:</Label>
                              <div className="space-y-3">
                                {selectedProducts.map((product) => (
                                  <div key={product.id} className="border rounded-lg p-4 space-y-2">
                                    <div className="flex items-center justify-between"><span className="font-medium">{product.name}</span><Button type="button" size="sm" variant="outline" onClick={() => removeProductFromReward(product.id)}><X className="h-4 w-4" /></Button></div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div><Label className="text-xs">Jumlah</Label><Input type="number" value={product.quantity} onChange={(e) => updateProductRewardData(product.id, 'quantity', parseInt(e.target.value) || 1)} min="1" className="h-8"/></div>
                                      <div><Label className="text-xs">Poin Diperlukan</Label><Input type="number" value={product.points_required} onChange={(e) => updateProductRewardData(product.id, 'points_required', parseInt(e.target.value) || 0)} min="0" className="h-8"/></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button type="submit" disabled={!rewardData.name}>{editReward ? 'Update' : 'Simpan'}</Button></div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Available Rewards</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-purple-600">{totalAvailableRewards}</div><p className="text-xs text-muted-foreground">Active rewards in stock</p></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Available Points</CardTitle><Star className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{totalAvailablePoints.toLocaleString('id-ID')} pts</div><p className="text-xs text-muted-foreground">Points across all customers</p></CardContent></Card>
              </div>
              <div className="border rounded-lg">
                {isLoadingAllRewards ? (<div className="text-center py-8">Loading...</div>) : allRewards?.length === 0 ? (<div className="text-center py-8"><Gift className="h-12 w-12 mx-auto text-gray-400 mb-4" /><p className="text-gray-500">Belum ada reward</p></div>) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Nama Reward</TableHead><TableHead>Produk</TableHead><TableHead>Stok</TableHead><TableHead>Status</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {allRewards?.map((reward) => (
                        <TableRow key={reward.id}>
                          <TableCell><div><div className="font-medium">{reward.name}</div>{reward.description && (<div className="text-sm text-gray-500">{reward.description}</div>)}</div></TableCell>
                          <TableCell>{reward.reward_items?.length > 0 ? (<div className="space-y-1">{reward.reward_items.map((item: any) => (<div key={item.id} className="text-sm">{item.quantity}x {item.products?.name} ({item.points_required} poin)</div>))}</div>) : (<span className="text-gray-500">Tidak ada produk</span>)}</TableCell>
                          <TableCell><Badge variant={reward.stock_quantity > 0 ? "default" : "destructive"}>{reward.stock_quantity} tersedia</Badge></TableCell>
                          <TableCell><Badge variant={reward.is_active ? "default" : "secondary"}>{reward.is_active ? 'Aktif' : 'Nonaktif'}</Badge></TableCell>
                          <TableCell><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => handleEdit(reward)}><Edit className="h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => deleteReward.mutate(reward.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Riwayat Penukaran Terbaru</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentExchanges.map((exchange) => (
                    <div key={exchange.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{exchange.customers?.name}</h4>
                        <p className="text-sm text-gray-600">{exchange.rewards?.name}</p>
                        <p className="text-xs text-gray-500">{new Date(exchange.created_at).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" /><span className="font-medium">-{exchange.points_used}</span></div>
                        <p className="text-xs text-gray-500">oleh {exchange.profiles?.full_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Rewards;
