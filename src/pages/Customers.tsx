import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, MoreHorizontal, Eye, Edit, Users, TrendingUp, Calendar } from 'lucide-react';
import Layout from '@/components/Layout';
import CustomerDetails from '@/components/CustomerDetails';
import PaginationComponent from '@/components/PaginationComponent';

const ITEMS_PER_PAGE = 20;

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch customers with pagination
  const { data: customersData } = useQuery({
    queryKey: ['customers', searchTerm, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,customer_code.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: data || [],
        count: count || 0
      };
    }
  });

  // Fetch customer stats
  const { data: customerStats } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('total_spent, total_points, created_at');
      
      if (error) throw error;

      const totalCustomers = data.length;
      const totalSpent = data.reduce((sum, customer) => sum + customer.total_spent, 0);
      const totalPoints = data.reduce((sum, customer) => sum + customer.total_points, 0);
      
      // Calculate new customers this month
      const thisMonth = new Date();
      thisMonth.setDate(1); // First day of current month
      const newThisMonth = data.filter(customer => 
        new Date(customer.created_at) >= thisMonth
      ).length;

      return {
        totalCustomers,
        totalSpent,
        totalPoints,
        newThisMonth
      };
    }
  });

  const customers = customersData?.data || [];
  const totalCustomers = customersData?.count || 0;
  const totalPages = Math.ceil(totalCustomers / ITEMS_PER_PAGE);

  const handleViewDetails = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDetailsOpen(true);
  };

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Customers</h1>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customerStats?.totalCustomers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {(customerStats?.totalSpent || 0).toLocaleString('id-ID')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <Badge className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(customerStats?.totalPoints || 0).toLocaleString('id-ID')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customerStats?.newThisMonth || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search customers by name, code, phone, or email..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Customers ({totalCustomers})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.customer_code}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{customer.phone || '-'}</div>
                            <div className="text-sm text-gray-500">{customer.email || '-'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            Rp {customer.total_spent.toLocaleString('id-ID')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {customer.total_points} points
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(customer.created_at).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(customer)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(customer)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={ITEMS_PER_PAGE}
                  totalItems={totalCustomers}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
              <DialogDescription>
                View detailed information about {selectedCustomer?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedCustomer && (
              <CustomerDetails customer={selectedCustomer} />
            )}
          </DialogContent>
        </Dialog>

        {/* Customer Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
              </DialogTitle>
            </DialogHeader>
            {/* Customer form component would go here */}
            <div className="p-4 text-center text-gray-500">
              Customer form component to be implemented
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Customers;
