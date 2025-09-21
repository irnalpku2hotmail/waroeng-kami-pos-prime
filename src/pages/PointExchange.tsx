
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Gift, Search, Star, Users } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';

const PointExchange = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];
      
      let query = supabase
        .from('customers')
        .select(`
          id,
          name,
          customer_code,
          email,
          phone,
          total_points
        `);
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,customer_code.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query
        .order('name')
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: searchTerm.length > 0
  });

  // Fetch available rewards
  const { data: rewards = [] } = useQuery({
    queryKey: ['available-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
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
        `)
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch recent exchanges
  const { data: recentExchanges = [] } = useQuery({
    queryKey: ['recent-exchanges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('point_exchanges')
        .select(`
          *,
          customers(name, customer_code),
          rewards(name),
          profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  const processExchange = useMutation({
    mutationFn: async ({ customerId, rewardId, pointsCost, quantity }: any) => {
      // Check if customer has enough points
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('total_points')
        .eq('id', customerId)
        .single();

      if (customerError) throw customerError;

      if (customer.total_points < pointsCost) {
        throw new Error('Customer tidak memiliki poin yang cukup');
      }

      // Get current reward stock
      const { data: reward, error: rewardError } = await supabase
        .from('rewards')
        .select('stock_quantity')
        .eq('id', rewardId)
        .single();

      if (rewardError) throw rewardError;

      if (reward.stock_quantity < quantity) {
        throw new Error('Stok reward tidak mencukupi');
      }

      // Create point exchange record
      const { data: exchange, error: exchangeError } = await supabase
        .from('point_exchanges')
        .insert({
          customer_id: customerId,
          reward_id: rewardId,
          points_used: pointsCost,
          quantity: quantity,
          total_points_cost: pointsCost,
          processed_by: user?.id
        })
        .select()
        .single();

      if (exchangeError) throw exchangeError;

      // Update customer points
      const { error: updateError } = await supabase
        .from('customers')
        .update({ total_points: customer.total_points - pointsCost })
        .eq('id', customerId);

      if (updateError) throw updateError;

      // Update reward stock
      const { error: stockError } = await supabase
        .from('rewards')
        .update({ stock_quantity: reward.stock_quantity - quantity })
        .eq('id', rewardId);

      if (stockError) throw stockError;

      // Create point transaction record
      const { error: transactionError } = await supabase
        .from('point_transactions')
        .insert({
          customer_id: customerId,
          reward_id: rewardId,
          points_change: -pointsCost,
          description: `Penukaran reward`
        });

      if (transactionError) throw transactionError;

      return exchange;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-search'] });
      queryClient.invalidateQueries({ queryKey: ['available-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['recent-exchanges'] });
      setSelectedCustomer(null);
      setSearchTerm('');
      toast({ title: 'Berhasil', description: 'Penukaran poin berhasil diproses' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleExchange = (reward: any) => {
    if (!selectedCustomer) {
      toast({ title: 'Error', description: 'Pilih customer terlebih dahulu', variant: 'destructive' });
      return;
    }

    const totalPointsCost = reward.reward_items?.reduce((sum: number, item: any) => sum + item.points_required, 0) || 0;
    
    processExchange.mutate({
      customerId: selectedCustomer.id,
      rewardId: reward.id,
      pointsCost: totalPointsCost,
      quantity: 1
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Point Exchange</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pilih Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Cari nama, kode, atau telepon customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {selectedCustomer && (
                <div className="p-4 border rounded-lg bg-blue-50">
                  <h3 className="font-semibold">{selectedCustomer.name}</h3>
                  <p className="text-sm text-gray-600">Kode: {selectedCustomer.customer_code}</p>
                  <p className="text-sm text-gray-600">Telepon: {selectedCustomer.phone}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{selectedCustomer.total_points} Poin</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setSelectedCustomer(null)}
                    className="mt-2"
                  >
                    Ganti Customer
                  </Button>
                </div>
              )}

              {searchTerm && customers.length > 0 && !selectedCustomer && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{customer.name}</h4>
                          <p className="text-sm text-gray-500">{customer.customer_code}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{customer.total_points}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Rewards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Reward Tersedia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {rewards.map((reward) => {
                  const totalPoints = reward.reward_items?.reduce((sum: number, item: any) => sum + item.points_required, 0) || 0;
                  const canAfford = selectedCustomer && selectedCustomer.total_points >= totalPoints;
                  
                  return (
                    <div key={reward.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{reward.name}</h4>
                          {reward.description && (
                            <p className="text-sm text-gray-600">{reward.description}</p>
                          )}
                        </div>
                        <Badge variant={reward.stock_quantity > 0 ? "default" : "destructive"}>
                          {reward.stock_quantity} tersisa
                        </Badge>
                      </div>
                      
                      {reward.reward_items && reward.reward_items.length > 0 && (
                        <div className="text-sm space-y-1 mb-3">
                          {reward.reward_items.map((item: any) => (
                            <div key={item.id} className="flex justify-between">
                              <span>{item.quantity}x {item.products?.name}</span>
                              <span>{item.points_required} poin</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-bold">{totalPoints} Poin</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleExchange(reward)}
                          disabled={!selectedCustomer || !canAfford || reward.stock_quantity === 0}
                        >
                          Tukar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Exchanges */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Penukaran Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentExchanges.map((exchange) => (
                <div key={exchange.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{exchange.customers?.name}</h4>
                    <p className="text-sm text-gray-600">{exchange.rewards?.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(exchange.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">-{exchange.points_used}</span>
                    </div>
                    <p className="text-xs text-gray-500">oleh {exchange.profiles?.full_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PointExchange;
