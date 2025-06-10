
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
import { Users, Plus, Star, CreditCard, QrCode, Upload } from 'lucide-react';

const Customers = () => {
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    date_of_birth: ''
  });
  const [memberCardFile, setMemberCardFile] = useState<File | null>(null);

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch customer transactions
  const { data: customerTransactions = [] } = useQuery({
    queryKey: ['customer-transactions', selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer?.id) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_id', selectedCustomer.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCustomer?.id
  });

  // Generate unique customer code
  const generateCustomerCode = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CUS${year}${month}${random}`;
  };

  // Upload member card image
  const uploadMemberCard = async (file: File, customerId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${customerId}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('member-cards')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('member-cards')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const customerCode = generateCustomerCode();
      
      const { data: customer, error } = await supabase
        .from('customers')
        .insert({
          customer_code: customerCode,
          ...data
        })
        .select()
        .single();

      if (error) throw error;

      // Upload member card if provided
      if (memberCardFile) {
        const imageUrl = await uploadMemberCard(memberCardFile, customer.id);
        
        const { error: updateError } = await supabase
          .from('customers')
          .update({ member_card_url: imageUrl })
          .eq('id', customer.id);

        if (updateError) throw updateError;
      }

      return customer;
    },
    onSuccess: () => {
      toast({ title: 'Customer created successfully' });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setCustomerData({ name: '', phone: '', email: '', address: '', date_of_birth: '' });
      setMemberCardFile(null);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error creating customer', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      let updateData = { ...data };

      // Upload new member card if provided
      if (memberCardFile) {
        const imageUrl = await uploadMemberCard(memberCardFile, id);
        updateData.member_card_url = imageUrl;
      }

      const { error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Customer updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedCustomer(null);
      setMemberCardFile(null);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error updating customer', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const getTierBadge = (totalSpent: number) => {
    if (totalSpent >= 10000000) return <Badge className="bg-yellow-500">Gold</Badge>;
    if (totalSpent >= 5000000) return <Badge className="bg-gray-400">Silver</Badge>;
    if (totalSpent >= 1000000) return <Badge className="bg-amber-600">Bronze</Badge>;
    return <Badge variant="outline">Regular</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={customerData.name}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={customerData.phone}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={customerData.email}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={customerData.date_of_birth}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Address</Label>
                  <Textarea
                    value={customerData.address}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Customer address"
                  />
                </div>
                <div>
                  <Label>Member Card Photo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setMemberCardFile(e.target.files?.[0] || null)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => createCustomerMutation.mutate(customerData)}
                  disabled={createCustomerMutation.isPending || !customerData.name}
                >
                  {createCustomerMutation.isPending ? 'Creating...' : 'Create Customer'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gold Members</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {customers.filter(c => c.total_spent >= 10000000).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.reduce((sum, c) => sum + c.total_points, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {customers.reduce((sum, c) => sum + c.total_spent, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="customers" className="w-full">
          <TabsList>
            <TabsTrigger value="customers">All Customers</TabsTrigger>
            <TabsTrigger value="vip">VIP Members</TabsTrigger>
            <TabsTrigger value="birthday">Birthday This Month</TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Customer Database</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Member Since</TableHead>
                      <TableHead>Actions</TableHead>
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
                            <div className="text-sm">{customer.phone}</div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getTierBadge(customer.total_spent)}</TableCell>
                        <TableCell>{customer.total_points.toLocaleString()}</TableCell>
                        <TableCell>Rp {customer.total_spent.toLocaleString()}</TableCell>
                        <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setSelectedCustomer(customer)}
                                >
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>Customer Details - {selectedCustomer?.name}</DialogTitle>
                                </DialogHeader>
                                <Tabs defaultValue="info" className="w-full">
                                  <TabsList>
                                    <TabsTrigger value="info">Information</TabsTrigger>
                                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                                    <TabsTrigger value="points">Points History</TabsTrigger>
                                  </TabsList>
                                  <TabsContent value="info" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Customer Code</Label>
                                        <div className="font-mono text-lg">{selectedCustomer?.customer_code}</div>
                                      </div>
                                      <div>
                                        <Label>Member Tier</Label>
                                        <div>{getTierBadge(selectedCustomer?.total_spent || 0)}</div>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Total Points</Label>
                                        <div className="text-2xl font-bold text-blue-600">
                                          {selectedCustomer?.total_points.toLocaleString()}
                                        </div>
                                      </div>
                                      <div>
                                        <Label>Total Spent</Label>
                                        <div className="text-2xl font-bold text-green-600">
                                          Rp {selectedCustomer?.total_spent.toLocaleString()}
                                        </div>
                                      </div>
                                    </div>
                                    {selectedCustomer?.member_card_url && (
                                      <div>
                                        <Label>Member Card</Label>
                                        <img 
                                          src={selectedCustomer.member_card_url} 
                                          alt="Member card"
                                          className="w-full max-w-sm border rounded-lg"
                                        />
                                      </div>
                                    )}
                                  </TabsContent>
                                  <TabsContent value="transactions">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Date</TableHead>
                                          <TableHead>Transaction #</TableHead>
                                          <TableHead>Amount</TableHead>
                                          <TableHead>Points Earned</TableHead>
                                          <TableHead>Payment</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {customerTransactions.map((transaction) => (
                                          <TableRow key={transaction.id}>
                                            <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell>{transaction.transaction_number}</TableCell>
                                            <TableCell>Rp {transaction.total_amount.toLocaleString()}</TableCell>
                                            <TableCell>+{transaction.points_earned}</TableCell>
                                            <TableCell>
                                              <Badge variant={transaction.payment_type === 'cash' ? 'default' : 'secondary'}>
                                                {transaction.payment_type}
                                              </Badge>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </TabsContent>
                                </Tabs>
                              </DialogContent>
                            </Dialog>
                            <Button size="sm" variant="outline">
                              <QrCode className="h-4 w-4" />
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

          <TabsContent value="vip">
            <Card>
              <CardHeader>
                <CardTitle>VIP Members (Gold Tier)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Last Purchase</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers
                      .filter(c => c.total_spent >= 10000000)
                      .map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-500">{customer.customer_code}</div>
                            </div>
                          </TableCell>
                          <TableCell>Rp {customer.total_spent.toLocaleString()}</TableCell>
                          <TableCell>{customer.total_points.toLocaleString()}</TableCell>
                          <TableCell>{new Date(customer.updated_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="birthday">
            <Card>
              <CardHeader>
                <CardTitle>Birthday This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Birthday</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers
                      .filter(c => c.date_of_birth && new Date(c.date_of_birth).getMonth() === new Date().getMonth())
                      .map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-500">{customer.customer_code}</div>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(customer.date_of_birth).toLocaleDateString()}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              Send Greeting
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
      </div>
    </Layout>
  );
};

export default Customers;
