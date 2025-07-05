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
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Gift, Search, X, Star, Package, Eye } from 'lucide-react';
import Layout from '@/components/Layout';
import RewardDetailsModal from '@/components/RewardDetailsModal';
import PaginationComponent from '@/components/PaginationComponent';

const ITEMS_PER_PAGE = 10;

const PointsRewards = () => {
  const [open, setOpen] = useState(false);
  const [editReward, setEditReward] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const [rewardData, setRewardData] = useState({
    name: '',
    description: '',
    stock_quantity: 0,
    is_active: true
  });

  // Fetch products for search
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

  const { data: rewardsData, isLoading } = useQuery({
    queryKey: ['rewards', currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      const { data, error, count } = await supabase
        .from('rewards')
        .select(`
          *,
          reward_items (
            id,
            quantity,
            points_required,
            products (
              id,
              name,
              selling_price,
              image_url
            )
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { data, count };
    }
  });

  const rewards = rewardsData?.data || [];
  const rewardsCount = rewardsData?.count || 0;
  const totalPages = Math.ceil(rewardsCount / ITEMS_PER_PAGE);

  // Get total available points from all customers
  const { data: customerStats } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('total_points');
      if (error) throw error;
      
      const totalPoints = data?.reduce((sum, customer) => sum + (customer.total_points || 0), 0) || 0;
      return { totalPoints };
    }
  });

  // Calculate totals
  const totalAvailableRewards = rewards?.filter(reward => reward.is_active && reward.stock_quantity > 0).length || 0;
  const totalAvailablePoints = customerStats?.totalPoints || 0;

  const createReward = useMutation({
    mutationFn: async (data: any) => {
      const { data: reward, error } = await supabase
        .from('rewards')
        .insert({
          name: data.name,
          description: data.description,
          stock_quantity: data.stock_quantity,
          is_active: data.is_active
        })
        .select()
        .single();

      if (error) throw error;

      // Insert reward items
      if (selectedProducts.length > 0) {
        const rewardItems = selectedProducts.map(product => ({
          reward_id: reward.id,
          product_id: product.id,
          quantity: product.quantity,
          points_required: product.points_required
        }));

        const { error: itemsError } = await supabase
          .from('reward_items')
          .insert(rewardItems);

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
      const { error } = await supabase
        .from('rewards')
        .update({
          name: data.name,
          description: data.description,
          stock_quantity: data.stock_quantity,
          is_active: data.is_active
        })
        .eq('id', id);

      if (error) throw error;

      // Delete existing reward items and insert new ones
      await supabase.from('reward_items').delete().eq('reward_id', id);
      
      if (selectedProducts.length > 0) {
        const rewardItems = selectedProducts.map(product => ({
          reward_id: id,
          product_id: product.id,
          quantity: product.quantity,
          points_required: product.points_required
        }));

        const { error: itemsError } = await supabase
          .from('reward_items')
          .insert(rewardItems);

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

  const addProductToReward = (product: any) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      toast({ title: 'Produk sudah ditambahkan', variant: 'destructive' });
      return;
    }
    setSelectedProducts([...selectedProducts, { 
      ...product, 
      quantity: 1,
      points_required: 100
    }]);
    setProductSearch('');
    setShowProductSearch(false);
  };

  const removeProductFromReward = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const updateProductRewardData = (productId: string, field: string, value: any) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.id === productId ? { ...p, [field]: value } : p
    ));
  };

  const handleEdit = (reward: any) => {
    setEditReward(reward);
    setRewardData({
      name: reward.name,
      description: reward.description || '',
      stock_quantity: reward.stock_quantity,
      is_active: reward.is_active
    });
    setSelectedProducts(reward.reward_items?.map((item: any) => ({
      ...item.products,
      quantity: item.quantity,
      points_required: item.points_required
    })) || []);
    setOpen(true);
  };

  const handleDetails = (reward: any) => {
    setSelectedReward(reward);
    setDetailOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editReward) {
      updateReward.mutate({ id: editReward.id, ...rewardData });
    } else {
      createReward.mutate(rewardData);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Points & Rewards</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditReward(null);
                setRewardData({ name: '', description: '', stock_quantity: 0, is_active: true });
                setSelectedProducts([]);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Reward
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editReward ? 'Edit Reward' : 'Tambah Reward Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Reward *</Label>
                    <Input
                      id="name"
                      value={rewardData.name}
                      onChange={(e) => setRewardData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Reward Menarik"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">Stok Tersedia</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      value={rewardData.stock_quantity}
                      onChange={(e) => setRewardData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={rewardData.description}
                    onChange={(e) => setRewardData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Deskripsi reward"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={rewardData.is_active}
                    onCheckedChange={(checked) => setRewardData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Status Aktif</Label>
                </div>

                <div>
                  <Label>Produk Reward</Label>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowProductSearch(!showProductSearch)}
                      className="w-full"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Cari Produk
                    </Button>
                    
                    {showProductSearch && (
                      <div className="border rounded-lg p-4 space-y-2">
                        <Input
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Cari produk..."
                        />
                        {products.length > 0 && (
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {products.map((product) => (
                              <div
                                key={product.id}
                                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                                onClick={() => addProductToReward(product)}
                              >
                                <span>{product.name}</span>
                                <span className="text-sm text-gray-500">
                                  Rp {product.selling_price.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedProducts.length > 0 && (
                      <div className="space-y-2">
                        <Label>Produk Terpilih:</Label>
                        <div className="space-y-3">
                          {selectedProducts.map((product) => (
                            <div key={product.id} className="border rounded-lg p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{product.name}</span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeProductFromReward(product.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs">Jumlah</Label>
                                  <Input
                                    type="number"
                                    value={product.quantity}
                                    onChange={(e) => updateProductRewardData(product.id, 'quantity', parseInt(e.target.value) || 1)}
                                    min="1"
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Poin Diperlukan</Label>
                                  <Input
                                    type="number"
                                    value={product.points_required}
                                    onChange={(e) => updateProductRewardData(product.id, 'points_required', parseInt(e.target.value) || 0)}
                                    min="0"
                                    className="h-8"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={!rewardData.name}>
                    {editReward ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Rewards</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {totalAvailableRewards}
              </div>
              <p className="text-xs text-muted-foreground">Active rewards in stock</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Available Points</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {totalAvailablePoints.toLocaleString('id-ID')} pts
              </div>
              <p className="text-xs text-muted-foreground">Points across all customers</p>
            </CardContent>
          </Card>
        </div>

        <div className="border rounded-lg">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : rewards?.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Belum ada reward</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Reward</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards?.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reward.name}</div>
                        {reward.description && (
                          <div className="text-sm text-gray-500">{reward.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {reward.reward_items?.length > 0 ? (
                        <div className="space-y-1">
                          {reward.reward_items.map((item: any) => (
                            <div key={item.id} className="text-sm">
                              {item.quantity}x {item.products?.name} ({item.points_required} poin)
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">Tidak ada produk</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={reward.stock_quantity > 0 ? "default" : "destructive"}>
                        {reward.stock_quantity} tersedia
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={reward.is_active ? "default" : "secondary"}>
                        {reward.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDetails(reward)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(reward)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteReward.mutate(reward.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {totalPages > 1 && (
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={rewardsCount}
            />
          )}
        </div>
      </div>
      {selectedReward && (
        <RewardDetailsModal
          reward={selectedReward}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}
    </Layout>
  );
};

export default PointsRewards;
