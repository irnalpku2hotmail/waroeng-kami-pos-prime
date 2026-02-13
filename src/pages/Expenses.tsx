
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Search, DollarSign, TrendingUp, Eye, FileText, Image } from 'lucide-react';
import Layout from '@/components/Layout';
import ExpenseDetailsModal from '@/components/ExpenseDetailsModal';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseReceiptViewer from '@/components/expenses/ExpenseReceiptViewer';
import PaginationComponent from '@/components/PaginationComponent';
import { Database } from '@/integrations/supabase/types';

type ExpenseCategory = Database['public']['Enums']['expense_category'];

const ITEMS_PER_PAGE = 10;

const Expenses = () => {
  const [open, setOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{ url: string | null; title: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const queryClient = useQueryClient();


  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses', searchTerm, categoryFilter, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabase
        .from('expenses')
        .select('*', { count: 'exact' });
      
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      
      const { data, error, count } = await query
        .order('expense_date', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return { data, count };
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['expenses-stats'],
    queryFn: async () => {
      const [totalExpenses, thisMonthExpenses] = await Promise.all([
        supabase.from('expenses').select('amount'),
        supabase.from('expenses').select('amount').gte('expense_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
      ]);

      const totalAmount = totalExpenses.data?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const thisMonthAmount = thisMonthExpenses.data?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

      return {
        totalExpenses: totalExpenses.data?.length || 0,
        totalAmount,
        thisMonthAmount
      };
    }
  });

  const expenses = expensesData?.data || [];
  const expensesCount = expensesData?.count || 0;
  const totalPages = Math.ceil(expensesCount / ITEMS_PER_PAGE);


  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-stats'] });
      toast({ title: 'Berhasil', description: 'Pengeluaran berhasil dihapus' });
      setDeleteExpenseId(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setDeleteExpenseId(null);
    }
  });

  const handleDeleteExpense = (id: string) => {
    setDeleteExpenseId(id);
  };

  const handleEdit = (expense: any) => {
    setEditExpense(expense);
    setOpen(true);
  };

  const handleViewReceipt = (expense: any) => {
    setSelectedReceipt({ url: expense.receipt_url, title: expense.title });
    setReceiptViewerOpen(true);
  };

  const handleDetails = (expense: any) => {
    setSelectedExpense(expense);
    setDetailsOpen(true);
  };

  const handleSuccess = () => {
    setOpen(false);
    setEditExpense(null);
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['expenses-stats'] });
  };

  const handleClose = () => {
    setOpen(false);
    setEditExpense(null);
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      operational: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      utilities: 'bg-green-100 text-green-800',
      supplies: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl md:text-3xl font-bold text-blue-800">Pengeluaran</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setOpen(true)} size="sm" className="text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2">
                <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Tambah Pengeluaran</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-[95vw] md:w-auto">
              <DialogHeader>
                <DialogTitle className="text-sm md:text-base">{editExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}</DialogTitle>
              </DialogHeader>
              <ExpenseForm
                expense={editExpense}
                onSuccess={handleSuccess}
                onClose={handleClose}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-2 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Total Pengeluaran</CardTitle>
              <FileText className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 md:p-4 pt-0">
              <div className="text-lg md:text-2xl font-bold text-blue-600">
                {stats?.totalExpenses || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-2 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Total Nilai</CardTitle>
              <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 md:p-4 pt-0">
              <div className="text-sm md:text-2xl font-bold text-green-600">
                {formatCurrency(stats?.totalAmount || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-2 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Bulan Ini</CardTitle>
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 md:p-4 pt-0">
              <div className="text-sm md:text-2xl font-bold text-purple-600">
                {formatCurrency(stats?.thisMonthAmount || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari pengeluaran..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(value) => {
            setCategoryFilter(value as 'all' | ExpenseCategory);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="operational">Operasional</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="utilities">Utilitas</SelectItem>
              <SelectItem value="supplies">Supplies</SelectItem>
              <SelectItem value="other">Lainnya</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Expenses Table */}
        <div className="border rounded-lg">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : expenses?.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
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
                  <TableHead>Bukti</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses?.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.title}</TableCell>
                    <TableCell>
                      <Badge className={getCategoryBadge(expense.category)}>
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(expense.amount)}</TableCell>
                    <TableCell>{new Date(expense.expense_date).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>
                      {expense.receipt_url ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewReceipt(expense)}
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
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
                          onClick={() => handleDeleteExpense(expense.id)}
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
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}

      {selectedReceipt && (
        <ExpenseReceiptViewer
          open={receiptViewerOpen}
          onOpenChange={setReceiptViewerOpen}
          receipt_url={selectedReceipt.url}
          title={selectedReceipt.title}
        />
      )}

      <AlertDialog open={deleteExpenseId !== null} onOpenChange={(open) => !open && setDeleteExpenseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pengeluaran ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteExpenseId && deleteExpense.mutate(deleteExpenseId)}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Expenses;
