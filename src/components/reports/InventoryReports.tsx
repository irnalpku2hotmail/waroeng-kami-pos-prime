import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addDays, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

const InventoryReports = () => {
  const [bestFilter, setBestFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'range'>('monthly');
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);

  // Low stock products
  const { data: lowStockProducts, isLoading: isLoadingLowStock } = useQuery({
    queryKey: ['low-stock-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('name, current_stock, min_stock, selling_price')
        .lt('current_stock', 20)
        .order('current_stock', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Out of stock products
  const { data: outOfStockProducts, isLoading: isLoadingOutOfStock } = useQuery({
    queryKey: ['out-of-stock-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('name, current_stock, min_stock, selling_price')
        .eq('current_stock', 0);

      if (error) throw error;
      return data;
    },
  });

  // Produk terlaris (dari POS & COD)
  const { data: bestProducts, isLoading: loadingBest } = useQuery({
    queryKey: ['best-products', bestFilter, range],
    queryFn: async () => {
      // Determine date range
      const today = new Date();
      let from, to;
      if (bestFilter === 'daily') {
        from = format(today, 'yyyy-MM-dd');
        to = format(today, 'yyyy-MM-dd');
      } else if (bestFilter === 'weekly') {
        from = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        to = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      } else if (bestFilter === 'monthly') {
        from = format(startOfMonth(today), 'yyyy-MM-dd');
        to = format(endOfMonth(today), 'yyyy-MM-dd');
      } else if (bestFilter === 'yearly') {
        from = format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd');
        to = format(new Date(today.getFullYear(), 11, 31), 'yyyy-MM-dd');
      } else if (bestFilter === 'range' && range) {
        from = range.from;
        to = range.to;
      } else {
        from = format(today, 'yyyy-MM-dd');
        to = format(today, 'yyyy-MM-dd');
      }

      // Ambil transaction_items (POS)
      const { data: trxItems, error: trxItemsError } = await supabase
        .from('transaction_items')
        .select(`product_id, quantity, total_price, products(name)`)
        .gte('created_at', from + 'T00:00:00')
        .lte('created_at', to + 'T23:59:59');

      if (trxItemsError) throw trxItemsError;

      // Ambil order_items (COD/Deli)
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select(`product_id, quantity, total_price, products(name)`)
        .gte('created_at', from + 'T00:00:00')
        .lte('created_at', to + 'T23:59:59');

      if (orderItemsError) throw orderItemsError;

      // Gabungkan & akumulasi per produk
      const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

      for (const item of trxItems || []) {
        if (!item.product_id) continue;
        const name = item.products?.name || 'Tidak diketahui';
        if (!productMap[item.product_id]) productMap[item.product_id] = { name, quantity: 0, revenue: 0 };
        productMap[item.product_id].quantity += item.quantity || 0;
        productMap[item.product_id].revenue += item.total_price || 0;
      }

      for (const item of orderItems || []) {
        if (!item.product_id) continue;
        const name = item.products?.name || 'Tidak diketahui';
        if (!productMap[item.product_id]) productMap[item.product_id] = { name, quantity: 0, revenue: 0 };
        productMap[item.product_id].quantity += item.quantity || 0;
        productMap[item.product_id].revenue += item.total_price || 0;
      }

      return Object.values(productMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    }
  });

  const getStockStatus = (currentStock: number, minStock: number) => {
    if (currentStock === 0) {
      return <Badge variant="destructive">Habis</Badge>;
    } else if (currentStock <= minStock) {
      return <Badge className="bg-yellow-100 text-yellow-800">Stok Rendah</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">Normal</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter produk terlaris */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 justify-between">
            <CardTitle>Produk Terlaris</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={bestFilter} onValueChange={(val) => setBestFilter(val as any)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Harian</SelectItem>
                  <SelectItem value="weekly">Mingguan</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                  <SelectItem value="range">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              {bestFilter === "range" && (
                <>
                  <input type="date" className="border p-1 rounded text-xs"
                    value={range?.from || ''}
                    onChange={e => setRange(r => ({ ...(r || {}), from: e.target.value }))} />
                  <span>s/d</span>
                  <input type="date" className="border p-1 rounded text-xs"
                    value={range?.to || ''}
                    onChange={e => setRange(r => ({ ...(r || {}), to: e.target.value }))} />
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingBest ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-1/4 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-1/2 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : bestProducts && bestProducts.length > 0 ? (
                bestProducts.map((prod, idx) => (
                  <TableRow key={prod.name}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">{prod.name}</TableCell>
                    <TableCell className="text-right">{prod.quantity}</TableCell>
                    <TableCell className="text-right">Rp {prod.revenue.toLocaleString('id-ID')}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">Tidak ada data.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Produk Stok Rendah</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Stok Saat Ini</TableHead>
                  <TableHead className="text-right">Stok Minimum</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingLowStock ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-1/4 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-1/4 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  lowStockProducts?.map((product) => (
                    <TableRow key={product.name}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">{product.current_stock}</TableCell>
                      <TableCell className="text-right">{product.min_stock}</TableCell>
                      <TableCell>{getStockStatus(product.current_stock, product.min_stock)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produk Habis</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Harga Jual</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingOutOfStock ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-1/2 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-1/3" /></TableCell>
                    </TableRow>
                  ))
                ) : outOfStockProducts && outOfStockProducts.length > 0 ? (
                  outOfStockProducts.map((product) => (
                    <TableRow key={product.name}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">Rp {product.selling_price.toLocaleString('id-ID')}</TableCell>
                      <TableCell><Badge variant="destructive">Habis</Badge></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      Tidak ada produk yang habis.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InventoryReports;
