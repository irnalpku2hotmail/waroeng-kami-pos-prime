
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Receipt, DollarSign, Calendar, TrendingUp, Download, FileImage, Eye } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { exportToExcel } from '@/utils/excelExport';
import ExpenseDetailsModal from '@/components/ExpenseDetailsModal';
import PaginationComponent from '@/components/PaginationComponent';

const ITEMS_PER_PAGE = 10;

const Expenses = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [expenseData, setExpenseData] = useState({
    title: '',
    amount: 0,
    category: 'operational' as const,
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    receipt_url: ''
  });

  // Fetch all users for filter
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      if (error) throw error;
      return data;
    }
  });

  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses', searchTerm, userFilter, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      let query = supabase
        .from('expenses')
        .select(`
          *,
          profiles(full_name)
        `, { count: 'exact' });
      
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (userFilter !== 'all') {
        query = query.eq('user_id', userFilter);
      }
      
      const { data, error, count } = await query
        .order('expense_date', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { data, count };
    }
  });

  const expenses = expensesData?.data || [];
  const expensesCount = expensesData?.count || 0;
  const totalPages = Math.ceil(expensesCount / ITEMS_PER_PAGE);

  // Query for all expenses for export
  const { data: allExpensesData } = useQuery({
    queryKey: ['all-expenses'],
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

  // Calculate today's total
  const todayTotal = expenses?.filter(expense => {
    const expenseDate = new Date(expense.expense_date).toDateString();
    const today = new Date().toDateString();
    return expenseDate === today;
  }).reduce((total, expense) => total + Number(expense.amount), 0) || 0;

  // Calculate this month's total
  const thisMonthTotal = expenses?.filter(expense => {
    const expenseDate = new Date(expense.expense_date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && 
           expenseDate.getFullYear() === now.getFullYear();
  }).reduce((total, expense) => total + Number(expense.amount), 0) || 0;

  // Calculate this year's total
  const thisYearTotal = expenses?.filter(expense => {
    const expenseDate = new Date(expense.expense_date);
    const now = new Date();
    return expenseDate.getFullYear() === now.getFullYear();
  }).reduce((total, expense) => total + Number(expense.amount), 0) || 0;

  const createExpense = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          ...data,
          user_id: user?.id
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Berhasil', description: 'Pengeluaran berhasil ditambahkan' });
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateExpense = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('expenses')
        .update(data)
        .eq('id', editExpense.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Berhasil', description: 'Pengeluaran berhasil diperbarui' });
      setOpen(false);
      resetForm();
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

  const resetForm = () => {
    setExpenseData({
      title: '',
      amount: 0,
      category: 'operational',
      expense_date: new Date().toISOString().split('T')[0],
      description: '',
      receipt_url: ''
    });
    setReceiptFile(null);
    setEditExpense(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalExpenseData: any = { ...expenseData };
    delete finalExpenseData.id; // ensure id is not in the data for insert/update

    if (receiptFile) {
      if (!user) {
        toast({ title: 'Error', description: 'Anda harus login untuk mengunggah file.', variant: 'destructive' });
        return;
      }

      // Handle old file deletion if a new one is uploaded
      if (editExpense && editExpense.receipt_url) {
        try {
          const oldFilePath = new URL(editExpense.receipt_url).pathname.split('/expense-receipts/')[1];
          if (oldFilePath) {
            await supabase.storage.from('expense-receipts').remove([oldFilePath]);
          }
        } catch(e) {
          console.error("Could not parse old file URL to delete file", e);
        }
      }

      const filePath = `${user.id}/${new Date().getTime()}-${receiptFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('expense-receipts')
        .upload(filePath, receiptFile);

      if (uploadError) {
        toast({ title: 'Error Upload', description: uploadError.message, variant: 'destructive' });
        return;
      }

      const { data: urlData } = supabase.storage
        .from('expense-receipts')
        .getPublicUrl(filePath);

      finalExpenseData.receipt_url = urlData.publicUrl;
    }

    if (editExpense) {
      updateExpense.mutate(finalExpenseData);
    } else {
      createExpense.mutate(finalExpenseData);
    }
  };

  const handleEdit = (expense: any) => {
    setEditExpense(expense);
    setExpenseData({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      expense_date: expense.expense_date,
      description: expense.description || '',
      receipt_url: expense.receipt_url || ''
    });
    setReceiptFile(null);
    setOpen(true);
  };

  const handleDetails = (expense: any) => {
    setSelectedExpense(expense);
    setDetailOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    resetForm();
  };

  const getCategoryBadge = (category: string) => {
    const categories = {
      operational: { label: 'Operasional', color: 'bg-blue-100 text-blue-800' },
      inventory: { label: 'Inventori', color: 'bg-green-100 text-green-800' },
      marketing: { label: 'Marketing', color: 'bg-purple-100 text-purple-800' },
      maintenance: { label: 'Pemeliharaan', color: 'bg-orange-100 text-orange-800' },
      utilities: { label: 'Utilitas', color: 'bg-gray-100 text-gray-800' },
      other: { label: 'Lainnya', color: 'bg-red-100 text-red-800' }
    };
    
    const cat = categories[category as keyof typeof categories] || categories.other;
    return <Badge className={cat.color}>{cat.label}</Badge>;
  };

  const handleExportToExcel = () => {
    if (!allExpensesData || allExpensesData.length === 0) {
      toast({ title: 'Warning', description: 'Tidak ada data untuk diekspor', variant: 'destructive' });
      return;
    }

    const exportData = allExpensesData.map(expense => ({
      'Judul Pengeluaran': expense.title,
      'Kategori': getCategoryLabel(expense.category),
      'Jumlah': Number(expense.amount),
      'Tanggal': new Date(expense.expense_date).toLocaleDateString('id-ID'),
      'Deskripsi': expense.description || '-',
      'Dibuat Oleh': expense.profiles?.full_name || 'Unknown',
      'Tanggal Dibuat': new Date(expense.created_at).toLocaleDateString('id-ID')
    }));

    exportToExcel(exportData, 'Data_Pengeluaran', 'Pengeluaran');
    toast({ title: 'Berhasil', description: 'Data berhasil diekspor ke Excel' });
  };

  const getCategoryLabel = (category: string) => {
    const categories = {
      operational: 'Operasional',
      inventory: 'Inventori',
      marketing: 'Marketing',
      maintenance: 'Pemeliharaan',
      utilities: 'Utilitas',
      other: 'Lainnya'
    };
    return categories[category as keyof typeof categories] || 'Lainnya';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Manajemen Pengeluaran</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Pengeluaran
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul Pengeluaran *</Label>
                    <Input
                      id="title"
                      value={expenseData.title}
                      onChange={(e) => setExpenseData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Contoh: Listrik Bulan Januari"
                      required
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
                        min="0"
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
                    <Select value={expenseData.category} onValueChange={(value: any) => setExpenseData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operational">Operasional</SelectItem>
                        <SelectItem value="inventory">Inventori</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="maintenance">Pemeliharaan</SelectItem>
                        <SelectItem value="utilities">Utilitas</SelectItem>
                        <SelectItem value="other">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receipt" className="flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      Bukti Pengeluaran (Opsional)
                    </Label>
                    <Input
                      id="receipt"
                      type="file"
                      onChange={(e) => setReceiptFile(e.target.files ? e.target.files[0] : null)}
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                    />
                     {expenseData.receipt_url && !receiptFile && (
                      <p className="text-sm text-gray-500 mt-1">
                        File saat ini: <a href={expenseData.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{expenseData.receipt_url.split('/').pop()}</a>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      value={expenseData.description}
                      onChange={(e) => setExpenseData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Deskripsi detail pengeluaran (opsional)"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={createExpense.isPending || updateExpense.isPending}>
                      {editExpense ? 'Update' : 'Simpan'} Pengeluaran
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hari Ini</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {todayTotal.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {thisMonthTotal.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tahun Ini</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {thisYearTotal.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expenses?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="Cari pengeluaran..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Filter berdasarkan user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua User</SelectItem>
              {users?.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  <TableHead>Dibuat oleh</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses?.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{expense.title}</p>
                        {expense.description && (
                          <p className="text-sm text-gray-500">{expense.description}</p>
                        )}
                        {expense.receipt_url && (
                           <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            Lihat Bukti
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(expense.category)}</TableCell>
                    <TableCell className="font-medium">
                      Rp {Number(expense.amount).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      {new Date(expense.expense_date).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>{expense.profiles?.full_name || 'Unknown'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDetails(expense)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
          
          {totalPages > 1 && (
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={expensesCount}
            />
          )}
        </div>
      </div>
      {selectedExpense && (
        <ExpenseDetailsModal
          expense={selectedExpense}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}
    </Layout>
  );
};

export default Expenses;
