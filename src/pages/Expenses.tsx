
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Receipt, Plus, TrendingUp, Calendar, DollarSign, Upload } from 'lucide-react';

const Expenses = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expenseData, setExpenseData] = useState({
    title: '',
    category: 'operational',
    amount: 0,
    description: '',
    expense_date: new Date().toISOString().split('T')[0]
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Fetch expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          profiles(full_name)
        `)
        .order('expense_date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Upload receipt
  const uploadReceipt = async (file: File, expenseId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${expenseId}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('expense-receipts')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('expense-receipts')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: expense, error } = await supabase
        .from('expenses')
        .insert({
          ...data,
          amount: parseFloat(data.amount),
          user_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Upload receipt if provided
      if (receiptFile) {
        const receiptUrl = await uploadReceipt(receiptFile, expense.id);
        
        const { error: updateError } = await supabase
          .from('expenses')
          .update({ receipt_url: receiptUrl })
          .eq('id', expense.id);

        if (updateError) throw updateError;
      }

      return expense;
    },
    onSuccess: () => {
      toast({ title: 'Expense recorded successfully' });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setExpenseData({
        title: '',
        category: 'operational',
        amount: 0,
        description: '',
        expense_date: new Date().toISOString().split('T')[0]
      });
      setReceiptFile(null);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error recording expense', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      operational: 'bg-blue-600',
      maintenance: 'bg-orange-600',
      utilities: 'bg-green-600',
      supplies: 'bg-purple-600',
      other: 'bg-gray-600'
    };
    
    return <Badge className={colors[category] || 'bg-gray-600'}>{category}</Badge>;
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const thisMonthExpenses = expenses.filter(expense => 
    new Date(expense.expense_date).getMonth() === new Date().getMonth()
  ).reduce((sum, expense) => sum + expense.amount, 0);

  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Expense Management</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Record New Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Title *</Label>
                    <Input
                      value={expenseData.title}
                      onChange={(e) => setExpenseData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Expense title"
                    />
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Select value={expenseData.category} onValueChange={(value) => setExpenseData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="supplies">Supplies</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Amount *</Label>
                    <Input
                      type="number"
                      value={expenseData.amount}
                      onChange={(e) => setExpenseData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={expenseData.expense_date}
                      onChange={(e) => setExpenseData(prev => ({ ...prev, expense_date: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={expenseData.description}
                    onChange={(e) => setExpenseData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Expense description (optional)"
                  />
                </div>
                <div>
                  <Label>Receipt</Label>
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => createExpenseMutation.mutate(expenseData)}
                  disabled={createExpenseMutation.isPending || !expenseData.title || expenseData.amount <= 0}
                >
                  {createExpenseMutation.isPending ? 'Recording...' : 'Record Expense'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                Rp {totalExpenses.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {thisMonthExpenses.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expenses.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg per Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {Math.round(totalExpenses / 12).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(expensesByCategory).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(category)}
                      <span className="capitalize">{category}</span>
                    </div>
                    <span className="font-bold">Rp {amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenses.slice(0, 5).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{expense.title}</div>
                      <div className="text-sm text-gray-500">{new Date(expense.expense_date).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">Rp {expense.amount.toLocaleString()}</div>
                      {getCategoryBadge(expense.category)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Recorded By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{expense.title}</TableCell>
                    <TableCell>{getCategoryBadge(expense.category)}</TableCell>
                    <TableCell className="text-red-600 font-bold">
                      Rp {expense.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                    <TableCell>
                      {expense.receipt_url ? (
                        <Button size="sm" variant="outline" asChild>
                          <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer">
                            <Upload className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-gray-400">No receipt</span>
                      )}
                    </TableCell>
                    <TableCell>{expense.profiles?.full_name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Expenses;
