import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Edit, Trash2, Receipt, Upload, Eye, TrendingDown, Calendar } from 'lucide-react';
import Layout from '@/components/Layout';

const Expenses = () => {
  const [open, setOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<any>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [expenseData, setExpenseData] = useState({
    title: '',
    description: '',
    amount: 0,
    category: 'operational',
    expense_date: new Date().toISOString().split('T')[0],
    receipt_url: ''
  });

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, profiles(full_name)')
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Calculate today's and this month's totals
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format

  const todayTotal = expenses?.filter(expense => expense.expense_date === today)
    .reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

  const thisMonthTotal = expenses?.filter(expense => expense.expense_date.startsWith(currentMonth))
    .reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

  const uploadReceipt = useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('expense-receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('expense-receipts')
        .getPublicUrl(fileName);

      return data.publicUrl;
    },
    onSuccess: (url) => {
      setExpenseData(prev => ({ ...prev, receipt_url: url }));
      setReceiptFile(null);
      setUploading(false);
      toast({ title: 'Berhasil', description: 'Kwitansi berhasil diupload' });
    },
    onError: (error) => {
      setUploading(false);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const createExpense = useMutation({
    mutationFn: async (data: any) => {
      if (editExpense) {
        const { error } = await supabase
          .from('expenses')
          .update({
            title: data.title,
            description: data.description,
            amount: data.amount,
            category: data.category,
            expense_date: data.expense_date,
            receipt_url: data.receipt_url
          })
          .eq('id', editExpense.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert([{
            ...data,
            user_id: user?.id
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setOpen(false);
      resetForm();
      toast({ 
        title: 'Berhasil', 
        description: editExpense ? 'Pengeluaran berhasil diperbarui' : 'Pengeluaran berhasil ditambahkan' 
      });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Berhasil', description: 'Pengeluaran berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleEdit = (expense: any) => {
    setEditExpense(expense);
    setExpenseData({
      title: expense.title,
      description: expense.description || '',
      amount: expense.amount,
      category: expense.category,
      expense_date: expense.expense_date,
      receipt_url: expense.receipt_url || ''
    });
    setOpen(true);
  };

  const resetForm = () => {
    setEditExpense(null);
    setExpenseData({
      title: '',
      description: '',
      amount: 0,
      category: 'operational',
      expense_date: new Date().toISOString().split('T')[0],
      receipt_url: ''
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createExpense.mutate(expenseData);
  };

  const handleFileUpload = () => {
    if (receiptFile) {
      uploadReceipt.mutate(receiptFile);
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories = {
      operational: 'Operasional',
      inventory: 'Inventori',
      marketing: 'Marketing',
      maintenance: 'Maintenance',
      other: 'Lainnya'
    };
    return categories[category as keyof typeof categories] || category;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Expenses</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pengeluaran
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul *</Label>
                  <Input
                    id="title"
                    value={expenseData.title}
                    onChange={(e) => setExpenseData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Pembelian alat tulis"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={expenseData.description}
                    onChange={(e) => setExpenseData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detail pengeluaran"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Jumlah *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={expenseData.amount}
                      onChange={(e) => setExpenseData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense_date">Tanggal *</Label>
                    <Input
                      id="expense_date"
                      type="date"
                      value={expenseData.expense_date}
                      onChange={(e) => setExpenseData(prev => ({ ...prev, expense_date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori *</Label>
                  <Select
                    value={expenseData.category}
                    onValueChange={(value) => setExpenseData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operasional</SelectItem>
                      <SelectItem value="inventory">Inventori</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Upload Kwitansi</Label>
                  
                  {expenseData.receipt_url && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">Kwitansi tersimpan</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(expenseData.receipt_url, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Lihat
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <Button 
                      type="button"
                      onClick={handleFileUpload}
                      disabled={!receiptFile || uploading}
                      variant="outline"
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Mengupload...' : 'Upload Kwitansi'}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={!expenseData.title || !expenseData.amount}>
                    {editExpense ? 'Update Pengeluaran' : 'Tambah Pengeluaran'}
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
              <CardTitle className="text-sm font-medium">Today's Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                Rp {todayTotal.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-muted-foreground">Total expenses today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month's Expenses</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                Rp {thisMonthTotal.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-muted-foreground">Total expenses this month</p>
            </CardContent>
          </Card>
        </div>

        <div className="border rounded-lg">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : expenses?.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Belum ada pengeluaran</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kwitansi</TableHead>
                  <TableHead>Dibuat oleh</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses?.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{expense.title}</div>
                        {expense.description && (
                          <div className="text-sm text-gray-500">{expense.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryLabel(expense.category)}</TableCell>
                    <TableCell className="font-medium">
                      Rp {expense.amount.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      {new Date(expense.expense_date).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      {expense.receipt_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(expense.receipt_url, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{expense.profiles?.full_name || 'Unknown'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(expense)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteExpense.mutate(expense.id)}
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
        </div>
      </div>
    </Layout>
  );
};

export default Expenses;
