
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
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Gift, Plus, Star, Trophy, Users, Upload } from 'lucide-react';

const PointsRewards = () => {
  const queryClient = useQueryClient();
  const [rewardData, setRewardData] = useState({
    name: '',
    points_required: 100,
    description: '',
    stock_quantity: 0
  });
  const [rewardImage, setRewardImage] = useState<File | null>(null);

  // Fetch rewards
  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
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

  // Upload reward image
  const uploadRewardImage = async (file: File, rewardId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${rewardId}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('reward-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('reward-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Create reward mutation
  const createRewardMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: reward, error } = await supabase
        .from('rewards')
        .insert({
          ...data,
          points_required: parseInt(data.points_required),
          stock_quantity: parseInt(data.stock_quantity)
        })
        .select()
        .single();

      if (error) throw error;

      // Upload image if provided
      if (rewardImage) {
        const imageUrl = await uploadRewardImage(rewardImage, reward.id);
        
        const { error: updateError } = await supabase
          .from('rewards')
          .update({ image_url: imageUrl })
          .eq('id', reward.id);

        if (updateError) throw updateError;
      }

      return reward;
    },
    onSuccess: () => {
      toast({ title: 'Reward created successfully' });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      setRewardData({
        name: '',
        points_required: 100,
        description: '',
        stock_quantity: 0
      });
      setRewardImage(null);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error creating reward', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Redeem reward mutation
  const redeemRewardMutation = useMutation({
    mutationFn: async ({ customerId, rewardId }: { customerId: string, rewardId: string }) => {
      const reward = rewards.find(r => r.id === rewardId);
      const customer = customers.find(c => c.id === customerId);
      
      if (!reward || !customer) throw new Error('Invalid reward or customer');
      if (customer.total_points < reward.points_required) {
        throw new Error('Insufficient points');
      }
      if (reward.stock_quantity <= 0) {
        throw new Error('Reward out of stock');
      }

      // Create point transaction
      const { error: pointError } = await supabase
        .from('point_transactions')
        .insert({
          customer_id: customerId,
          reward_id: rewardId,
          points_change: -reward.points_required,
          description: `Redeemed: ${reward.name}`
        });

      if (pointError) throw pointError;

      // Update customer points
      const { error: customerError } = await supabase
        .from('customers')
        .update({ 
          total_points: customer.total_points - reward.points_required 
        })
        .eq('id', customerId);

      if (customerError) throw customerError;

      // Update reward stock
      const { error: rewardError } = await supabase
        .from('rewards')
        .update({ 
          stock_quantity: reward.stock_quantity - 1 
        })
        .eq('id', rewardId);

      if (rewardError) throw rewardError;
    },
    onSuccess: () => {
      toast({ title: 'Reward redeemed successfully' });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['customers-points'] });
      queryClient.invalidateQueries({ queryKey: ['point-transactions'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error redeeming reward', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

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
                Add Reward
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Reward</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Reward Name *</Label>
                    <Input
                      value={rewardData.name}
                      onChange={(e) => setRewardData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Reward name"
                    />
                  </div>
                  <div>
                    <Label>Points Required *</Label>
                    <Input
                      type="number"
                      value={rewardData.points_required}
                      onChange={(e) => setRewardData(prev => ({ ...prev, points_required: parseInt(e.target.value) || 0 }))}
                      placeholder="100"
                    />
                  </div>
                </div>
                <div>
                  <Label>Stock Quantity</Label>
                  <Input
                    type="number"
                    value={rewardData.stock_quantity}
                    onChange={(e) => setRewardData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                    placeholder="0 = unlimited"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={rewardData.description}
                    onChange={(e) => setRewardData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Reward description"
                  />
                </div>
                <div>
                  <Label>Reward Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setRewardImage(e.target.files?.[0] || null)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => createRewardMutation.mutate(rewardData)}
                  disabled={createRewardMutation.isPending || !rewardData.name}
                >
                  {createRewardMutation.isPending ? 'Creating...' : 'Create Reward'}
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
            <TabsTrigger value="rewards">Rewards Catalog</TabsTrigger>
            <TabsTrigger value="leaderboard">Points Leaderboard</TabsTrigger>
            <TabsTrigger value="transactions">Point Transactions</TabsTrigger>
            <TabsTrigger value="redeem">Redeem Points</TabsTrigger>
          </TabsList>

          <TabsContent value="rewards">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {rewards.map((reward) => (
                <Card key={reward.id} className={!reward.is_active ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    {reward.image_url && (
                      <img 
                        src={reward.image_url} 
                        alt={reward.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h3 className="font-bold mb-2">{reward.name}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-yellow-600">
                        {reward.points_required} points
                      </Badge>
                      {reward.stock_quantity > 0 ? (
                        <Badge variant="outline">
                          {reward.stock_quantity} left
                        </Badge>
                      ) : reward.stock_quantity === 0 && reward.is_active ? (
                        <Badge variant="outline">Unlimited</Badge>
                      ) : (
                        <Badge variant="destructive">Out of Stock</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant={reward.is_active ? "destructive" : "default"}
                        onClick={() => {
                          // Toggle active status
                        }}
                      >
                        {reward.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
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
                  Points Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Member Since</TableHead>
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
                        <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
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
                <CardTitle>Point Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Points Change</TableHead>
                      <TableHead>Type</TableHead>
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

          <TabsContent value="redeem">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.slice(0, 10).map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-500">{customer.customer_code}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-yellow-600">
                            {customer.total_points.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              Redeem
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Available Rewards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rewards.filter(r => r.is_active).map((reward) => (
                      <div key={reward.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {reward.image_url && (
                            <img 
                              src={reward.image_url} 
                              alt={reward.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <div className="font-medium">{reward.name}</div>
                            <div className="text-sm text-gray-500">{reward.points_required} points</div>
                          </div>
                        </div>
                        <Badge variant={reward.stock_quantity > 0 || reward.stock_quantity === 0 ? 'default' : 'destructive'}>
                          {reward.stock_quantity > 0 ? `${reward.stock_quantity} left` : 
                           reward.stock_quantity === 0 ? 'Available' : 'Out of stock'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PointsRewards;
