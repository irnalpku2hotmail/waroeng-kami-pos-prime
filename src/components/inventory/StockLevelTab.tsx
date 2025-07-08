
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  barcode: string;
  image_url?: string;
  current_stock: number;
  min_stock: number;
  categories?: { name: string };
  units?: { abbreviation: string };
}

interface StockLevelTabProps {
  products: Product[];
  onAdjustStock: (product: Product) => void;
}

const StockLevelTab = ({ products, onAdjustStock }: StockLevelTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Level Stok Saat Ini</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Stok Saat Ini</TableHead>
              <TableHead>Stok Minimum</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.barcode}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{product.categories?.name}</TableCell>
                <TableCell>{product.current_stock} {product.units?.abbreviation}</TableCell>
                <TableCell>{product.min_stock}</TableCell>
                <TableCell>
                  {product.current_stock <= product.min_stock ? (
                    <Badge variant="destructive">Stok Rendah</Badge>
                  ) : product.current_stock <= product.min_stock * 2 ? (
                    <Badge variant="secondary">Peringatan</Badge>
                  ) : (
                    <Badge variant="default">Baik</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onAdjustStock(product)}
                  >
                    Sesuaikan
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default StockLevelTab;
