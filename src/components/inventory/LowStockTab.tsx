
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  barcode: string;
  image_url?: string;
  current_stock: number;
  min_stock: number;
}

interface LowStockTabProps {
  lowStockProducts: Product[];
}

const LowStockTab = ({ lowStockProducts }: LowStockTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          Peringatan Stok Rendah
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lowStockProducts.length === 0 ? (
          <p className="text-center py-8 text-gray-500">Tidak ada produk dengan stok rendah</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Stok Saat Ini</TableHead>
                <TableHead>Stok Minimum</TableHead>
                <TableHead>Kekurangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img src={product.image_url} alt={String(product.name)} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{String(product.name)}</div>
                        <div className="text-sm text-gray-500">{String(product.barcode)}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-red-600">{product.current_stock}</TableCell>
                  <TableCell>{product.min_stock}</TableCell>
                  <TableCell className="text-red-600">
                    {product.min_stock - product.current_stock}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default LowStockTab;
