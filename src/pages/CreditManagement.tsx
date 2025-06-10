
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
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { CreditCard, DollarSign, AlertTriangle, CheckCircle, Calendar, Plus } from 'lucide-react';

const CreditManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({
    payment_amount: 0,
    notes: ''
  });

  // Fetch credit transactions
  const { data: creditTransactions = [] } = useQuery({
    queryKey: ['credit-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          customers(name, customer_code, phone),
          profiles(full_name)
        `)
        .eq('is_credit', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch credit payments
  const { data: creditPayments = [] } = useQuery({
    queryKey: ['credit-payments', selectedTransaction?.id],
    queryFn: async () => {
      if (!selectedTransaction?.id) return [];
      
      const { data, error } = await supabase
        .from('credit_payments')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('transaction_id', selectedTransaction.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTransaction?.id
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('credit_payments')
        .insert({
          transaction_id: selectedTransaction.id,
          payment_amount: parseFloat(data.payment_amount),
          user_id: user?.id,
          notes: data.notes
        });

      if (error) throw error;

      // Update transaction paid amount
      const newPaidAmount = selectedTransaction.paid_amount + parseFloat(data.payment_amount);
      
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ paid_amount: newPaidAmount })
        .eq('id', selectedTransaction.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast({ title: 'Payment recorded successfully' });
      queryClient.invalidateQueries({ queryKey: ['credit-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['credit-payments'] });
      setPaymentData({ payment_amount: 0, notes: '' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error recording payment', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const getStatusBadge = (transaction: any) => {
    const remaining = transaction.total_amount - transaction.paid_amount;
    const isOverdue = new Date(transaction.due_date) < new Date();
    
    if (remaining <= 0) {
      return <Badge className="bg-green-600">Paid</Badge>;
    } else if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else {
      return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const totalCredit = creditTransactions.reduce((sum, t) => sum + (t.total_amount - t.paid_amount), 0);
  const overdueTransactions = creditTransactions.filter(t => 
    new Date(t.due_date) < new Date() && (t.total_amount - t.paid_amount) > 0
  );
  const dueSoonTransactions = creditTransactions.filter(t => {
    const daysRemaining = getDaysRemaining(t.due_date);
    return daysRemaining <= 7 && daysRemaining > 0 && (t.total_amount - t.paid_amount) > 0;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Credit Management</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                Rp {totalCredit.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Accounts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueTransactions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{dueSoonTransactions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{creditTransactions.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Credits</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="due-soon">Due Soon</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Credit Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Transaction #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditTransactions.map((transaction) => {
                      const remaining = transaction.total_amount - transaction.paid_amount;
                      const daysRemaining = getDaysRemaining(transaction.due_date);
                      
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>{transaction.transaction_number}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{transaction.customers?.name}</div>
                              <div className="text-sm text-gray-500">{transaction.customers?.customer_code}</div>
                            </div>
                          </TableCell>
                          <TableCell>Rp {transaction.total_amount.toLocaleString()}</TableCell>
                          <TableCell>Rp {transaction.paid_amount.toLocaleString()}</TableCell>
                          <TableCell className={remaining > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                            Rp {remaining.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div>
                              {new Date(transaction.due_date).toLocaleDateString()}
                              {daysRemaining > 0 && remaining > 0 && (
                                <div className="text-sm text-gray-500">{daysRemaining} days left</div>
                              )}
                              {daysRemaining < 0 && remaining > 0 && (
                                <div className="text-sm text-red-600">{Math.abs(daysRemaining)} days overdue</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(transaction)}</TableCell>
                          <TableCell>
                            {remaining > 0 && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    onClick={() => setSelectedTransaction(transaction)}
                                  >
                                    Pay
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Record Payment - {selectedTransaction?.transaction_number}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                      <div>
                                        <Label className="text-sm text-gray-600">Customer</Label>
                                        <div className="font-medium">{selectedTransaction?.customers?.name}</div>
                                      </div>
                                      <div>
                                        <Label className="text-sm text-gray-600">Outstanding Balance</Label>
                                        <div className="font-bold text-red-600">
                                          Rp {(selectedTransaction?.total_amount - selectedTransaction?.paid_amount)?.toLocaleString()}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <Label>Payment Amount *</Label>
                                      <Input
                                        type="number"
                                        value={paymentData.payment_amount}
                                        onChange={(e) => setPaymentData(prev => ({ ...prev, payment_amount: parseFloat(e.target.value) || 0 }))}
                                        placeholder="Enter payment amount"
                                        max={selectedTransaction?.total_amount - selectedTransaction?.paid_amount}
                                      />
                                    </div>
                                    
                                    <div>
                                      <Label>Notes</Label>
                                      <Textarea
                                        value={paymentData.notes}
                                        onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Payment notes (optional)"
                                      />
                                    </div>

                                    {creditPayments.length > 0 && (
                                      <div>
                                        <Label>Payment History</Label>
                                        <div className="max-h-40 overflow-y-auto border rounded-lg">
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead className="text-xs">Date</TableHead>
                                                <TableHead className="text-xs">Amount</TableHead>
                                                <TableHead className="text-xs">By</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {creditPayments.map((payment) => (
                                                <TableRow key={payment.id}>
                                                  <TableCell className="text-xs">{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                                                  <TableCell className="text-xs">Rp {payment.payment_amount.toLocaleString()}</TableCell>
                                                  <TableCell className="text-xs">{payment.profiles?.full_name}</TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      </div>
                                    )}
                                    
                                    <Button 
                                      className="w-full" 
                                      onClick={() => createPaymentMutation.mutate(paymentData)}
                                      disabled={createPaymentMutation.isPending || paymentData.payment_amount <= 0}
                                    >
                                      {createPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overdue">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Overdue Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overdueTransactions.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No overdue accounts</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount Due</TableHead>
                        <TableHead>Days Overdue</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overdueTransactions.map((transaction) => {
                        const daysOverdue = Math.abs(getDaysRemaining(transaction.due_date));
                        const remaining = transaction.total_amount - transaction.paid_amount;
                        
                        return (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{transaction.customers?.name}</div>
                                <div className="text-sm text-gray-500">{transaction.transaction_number}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-red-600 font-bold">
                              Rp {remaining.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-red-600">
                              {daysOverdue} days
                            </TableCell>
                            <TableCell>{transaction.customers?.phone}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  Call
                                </Button>
                                <Button size="sm" variant="outline">
                                  SMS
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="due-soon">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-yellow-600" />
                  Due This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dueSoonTransactions.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No accounts due this week</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount Due</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Days Left</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dueSoonTransactions.map((transaction) => {
                        const daysLeft = getDaysRemaining(transaction.due_date);
                        const remaining = transaction.total_amount - transaction.paid_amount;
                        
                        return (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{transaction.customers?.name}</div>
                                <div className="text-sm text-gray-500">{transaction.transaction_number}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-yellow-600 font-bold">
                              Rp {remaining.toLocaleString()}
                            </TableCell>
                            <TableCell>{new Date(transaction.due_date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-yellow-600">
                              {daysLeft} days
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">
                                Remind
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paid">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Paid Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Transaction #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid Date</TableHead>
                      <TableHead>Payment Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditTransactions
                      .filter(t => t.total_amount - t.paid_amount <= 0)
                      .map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.customers?.name}</TableCell>
                          <TableCell>{transaction.transaction_number}</TableCell>
                          <TableCell>Rp {transaction.total_amount.toLocaleString()}</TableCell>
                          <TableCell>{new Date(transaction.updated_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-600">Paid</Badge>
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

export default CreditManagement;
