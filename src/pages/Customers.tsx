
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Eye, Phone, Mail, MapPin, Calendar, Gift } from 'lucide-react';
import Layout from '@/components/Layout';
import CustomerDetails from '@/components/CustomerDetails';
import CustomerStats from '@/components/customers/CustomerStats';
import CustomerRanking from '@/components/customers/CustomerRanking';

const Customers = () => {
  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select('*')
        .order('total_points', { ascending: false });
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,customer_code.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  const handleViewDetails = (customer: any) => {
    setSelectedCustomer(customer);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedCustomer(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <CustomerStats />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Customer</h1>
            <p className="text-gray-600">Kelola data customer dan program loyalitas</p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Customer
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Customers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers?.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{customer.name}</CardTitle>
                      <CardDescription>{customer.customer_code}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {customer.total_points} pts
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        {customer.phone}
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        {customer.email}
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{customer.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Gift className="h-4 w-4" />
                      Spent: Rp {customer.total_spent.toLocaleString('id-ID')}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {new Date(customer.created_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(customer)}
                      className="w-full"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Lihat Detail
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Customer Ranking - Moved to bottom */}
        <CustomerRanking />

        {/* Customer Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detail Customer</DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <CustomerDetails customer={selectedCustomer} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Customers;
