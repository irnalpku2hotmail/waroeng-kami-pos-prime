
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Gift, Plus, Star, Trophy, Users, Search, X } from 'lucide-react';

const PointsRewards = () => {
  const queryClient = useQueryClient();
  const [rewardData, setRewardData] = useState({
    name: '',
    points_required: 100,
    description: '',
    stock_quantity: 0
  });
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);

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

  // Fetch rewards
  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select(`
          *,
          reward_items (
            id,
            quantity,
            products (
              id,
              name,
              selling_price
            )
          )
        `)
        .order('points_required');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch point transactions
  const { data: pointTransactions = [] } = useQuery({
    queryKey: ['point-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('point_transactions')
        .select(`
          *,
          customers(name, customer_code),
          rewards(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch customers with points
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('total_points', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Create reward mutation
  const createRewardMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: reward, error } = await supabase
        .from('rewards')
        .insert({
          name: data.name,
          points_required: parseInt(data.points_required),
          description: data.description,
          stock_quantity: parseInt(data.stock_quantity)
        })
        .select()
        .single();

      if (error) throw error;

      // Insert reward items
      if (selectedProducts.length > 0) {
        const rewardItems = selectedProducts.map(product => ({
          reward_id: reward.id,
          product_id: product.id,
          quantity: product.quantity
        }));

        const { error: itemsError } = await supabase
          .from('reward_items')
          .insert(rewardItems);

        if (itemsError) throw itemsError;
      }

      return reward;
    },
    onSuccess: () => {
      toast({ title: 'Reward berhasil dibuat' });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      setRewardData({
        name: '',
        points_required: 100,
        description: '',
        stock_quantity: 0
      });
      setSelectedProducts([]);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error membuat reward', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const addProductToReward = (product: any) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      toast({ title: 'Produk sudah ditambahkan', variant: 'destructive' });
      return;
    }
    setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    setProductSearch('');
    setShowProductSearch(false);
  };

  const removeProductFromReward = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.id === productId ? { ...p, quantity: Math.max(1, quantity) } : p
    ));
  };

  const totalPoints = customers.reduce((sum, customer) => sum + customer.total_points, 0);
  const totalRedemptions = pointTransactions.filter(t => t.points_change < 0).length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Points & Rewards</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Tambah Reward
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Buat Reward Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nama Reward *</Label>
                    <Input
                      value={rewardData.name}
                      onChange={(e) => setRewardData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nama reward"
                    />
                  </div>
                  <div>
                    <Label>Poin yang Dibutuhkan *</Label>
                    <Input
                      type="number"
                      value={rewardData.points_required}
                      onChange={(e) => setRewardData(prev => ({ ...prev, points_required: parseInt(e.target.value) || 0 }))}
                      placeholder="100"
                    />
                  </div>
                </div>
                <div>
                  <Label>Stok</Label>
                  <Input
                    type="number"
                    value={rewardData.stock_quantity}
                    onChange={(e) => setRewardData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                    placeholder="0 = unlimited"
                  />
                </div>
                <div>
                  <Label>Deskripsi</Label>
                  <Textarea
                    value={rewardData.description}
                    onChange={(e) => setRewardData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Deskripsi reward"
                  />
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
                        {selectedProducts.map((product) => (
                          <div key={product.id} className="flex items-center gap-2 p-2 border rounded">
                            <span className="flex-1">{product.name}</span>
                            <Input
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) => updateProductQuantity(product.id, parseInt(e.target.value))}
                              className="w-20"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeProductFromReward(product.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => createRewardMutation.mutate(rewardData)}
                  disabled={createRewardMutation.isPending || !rewardData.name}
                >
                  {createRewardMutation.isPending ? 'Membuat...' : 'Buat Reward'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {totalPoints.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rewards</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rewards.filter(r => r.is_active).length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRedemptions}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rewards" className="w-full">
          <TabsList>
            <TabsTrigger value="rewards">Katalog Rewards</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard Poin</TabsTrigger>
            <TabsTrigger value="transactions">Transaksi Poin</TabsTrigger>
          </TabsList>

          <TabsContent value="rewards">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map((reward) => (
                <Card key={reward.id} className={!reward.is_active ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    <h3 className="font-bold mb-2">{reward.name}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-yellow-600">
                        {reward.points_required} poin
                      </Badge>
                      {reward.stock_quantity > 0 ? (
                        <Badge variant="outline">
                          {reward.stock_quantity} tersisa
                        </Badge>
                      ) : reward.stock_quantity === 0 && reward.is_active ? (
                        <Badge variant="outline">Unlimited</Badge>
                      ) : (
                        <Badge variant="destructive">Habis</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                    
                    {reward.reward_items && reward.reward_items.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1">Produk:</p>
                        {reward.reward_items.map((item: any) => (
                          <div key={item.id} className="text-xs text-gray-600">
                            {item.quantity}x {item.products?.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Leaderboard Poin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Peringkat</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Poin</TableHead>
                      <TableHead>Total Belanja</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.slice(0, 20).map((customer, index) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {index === 0 && <Trophy className="h-4 w-4 text-yellow-600" />}
                            {index === 1 && <Trophy className="h-4 w-4 text-gray-400" />}
                            {index === 2 && <Trophy className="h-4 w-4 text-amber-600" />}
                            #{index + 1}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.customer_code}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-yellow-600">
                          {customer.total_points.toLocaleString()}
                        </TableCell>
                        <TableCell>Rp {customer.total_spent.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Transaksi Poin</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Perubahan Poin</TableHead>
                      <TableHead>Tipe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pointTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.customers?.name}</div>
                            <div className="text-sm text-gray-500">{transaction.customers?.customer_code}</div>
                          </div>
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className={transaction.points_change > 0 ? 'text-green-600' : 'text-red-600'}>
                          {transaction.points_change > 0 ? '+' : ''}{transaction.points_change}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.points_change > 0 ? 'default' : 'destructive'}>
                            {transaction.points_change > 0 ? 'Earned' : 'Redeemed'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PointsRewards;
