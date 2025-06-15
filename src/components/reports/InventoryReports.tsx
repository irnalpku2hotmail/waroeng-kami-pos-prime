
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const InventoryReports = () => {
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
