import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { addMonths, format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

const ExpenseReports = () => {
  // Add filter
  const [filter, setFilter] = useState<'monthly' | 'yearly' | 'range'>('monthly');
  const [range, setRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

  // Expenses by category, filtered
  const { data: expensesByCategory, isLoading: isLoadingExpensesByCategory } = useQuery({
    queryKey: ['expenses-by-category', filter, range],
    queryFn: async () => {
      // filtering logic
      const today = new Date();
      let from = '', to = '';
      if (filter === 'monthly') {
        from = format(startOfMonth(today), 'yyyy-MM-dd');
        to = format(endOfMonth(today), 'yyyy-MM-dd');
      } else if (filter === 'yearly') {
        from = format(startOfYear(today), 'yyyy-MM-dd');
        to = format(endOfYear(today), 'yyyy-MM-dd');
      } else if (filter === 'range' && range.from && range.to) {
        from = range.from;
        to = range.to;
      }

      let query = supabase.from('expenses').select('category, amount, expense_date');

      if (from && to) {
        query = query.gte('expense_date', from).lte('expense_date', to);
      }

      const { data, error } = await query;

      if (error) throw error;

      const categoryExpenses = data.reduce((acc, expense) => {
        const category = expense.category || 'Lainnya';
        if (!acc[category]) {
          acc[category] = { name: category, value: 0, count: 0 };
        }
        acc[category].value += expense.amount || 0;
        acc[category].count += 1;
        return acc;
      }, {} as Record<string, { name: string; value: number; count: number }>);

      return Object.values(categoryExpenses);
    },
  });

  // Monthly/yearly expenses trend
  const { data: monthlyExpenses, isLoading: isLoadingMonthlyExpenses } = useQuery({
    queryKey: ['monthly-expenses', filter, range],
    queryFn: async () => {
      // filtering
      const today = new Date();
      let from = '', to = '';
      if (filter === 'monthly') {
        from = format(startOfMonth(today), 'yyyy-MM-dd');
        to = format(endOfMonth(today), 'yyyy-MM-dd');
      } else if (filter === 'yearly') {
        from = format(startOfYear(today), 'yyyy-MM-dd');
        to = format(endOfYear(today), 'yyyy-MM-dd');
      } else if (filter === 'range' && range.from && range.to) {
        from = range.from;
        to = range.to;
      }

      let q = supabase.from('expenses').select('expense_date, amount').order('expense_date', { ascending: true });
      if (from && to) q = q.gte('expense_date', from).lte('expense_date', to);

      const { data, error } = await q;
      if (error) throw error;

      const monthlyData = data.reduce((acc, expense) => {
        const date = new Date(expense.expense_date);
        const monthKey = filter === "yearly"
          ? `${date.getFullYear()}`
          : filter === "monthly"
            ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!acc[monthKey]) {
          acc[monthKey] = { month: monthKey, total: 0, count: 0 };
        }
        acc[monthKey].total += expense.amount || 0;
        acc[monthKey].count += 1;
        return acc;
      }, {} as Record<string, { month: string; total: number; count: number }>);

      return Object.values(monthlyData)
        .map(item => ({
          name: filter === "yearly"
            ? item.month
            : new Date(item.month + '-01').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
          Total: item.total,
          Transaksi: item.count
        }))
        .slice(-12);
    },
  });

  const COLORS = ['#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a'];  

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex gap-4 items-center">
        <Select value={filter} onValueChange={(val) => setFilter(val as any)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Bulanan</SelectItem>
            <SelectItem value="yearly">Tahunan</SelectItem>
            <SelectItem value="range">Custom Range</SelectItem>
          </SelectContent>
        </Select>
        {filter === 'range' && (
          <>
            <input
              type="date"
              className="border p-1 rounded text-xs"
              value={range.from}
              onChange={e => setRange(r => ({
                from: e.target.value,
                to: r.to
              }))}
            />
            <span>s/d</span>
            <input
              type="date"
              className="border p-1 rounded text-xs"
              value={range.to}
              onChange={e => setRange(r => ({
                from: r.from,
                to: e.target.value
              }))}
            />
          </>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Pengeluaran per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingExpensesByCategory ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expensesByCategory?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, "Total"]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Monthly Expenses Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tren Pengeluaran Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingMonthlyExpenses ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyExpenses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                  <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, "Pengeluaran"]} />
                  <Bar dataKey="Total" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expense Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Pengeluaran per Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Jumlah Transaksi</TableHead>
                <TableHead className="text-right">Total Pengeluaran</TableHead>
                <TableHead className="text-right">Rata-rata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingExpensesByCategory ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-1/4 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-1/2 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-1/2 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                expensesByCategory?.map((category) => (
                  <TableRow key={category.name}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-right">{category.count}</TableCell>
                    <TableCell className="text-right">Rp {category.value.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-right">Rp {(category.value / category.count).toLocaleString('id-ID')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseReports;
