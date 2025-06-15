
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  barcode?: string;
  image_url?: string;
  categories?: { name: string };
  units?: { name: string };
  selling_price: number;
  current_stock: number;
  min_stock: number;
  price_variants?: Array<{
    id: string;
    name: string;
    price: number;
    minimum_quantity: number;
  }>;
  is_active: boolean;
}

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

const ProductsTable = ({ products, onEdit, onDelete }: ProductsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Gambar</TableHead>
          <TableHead>Nama Produk</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Harga Jual</TableHead>
          <TableHead>Stok</TableHead>
          <TableHead>Varian Harga</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded" />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{product.name}</div>
                {product.barcode && (
                  <div className="text-sm text-gray-500">{product.barcode}</div>
                )}
              </div>
            </TableCell>
            <TableCell>{product.categories?.name || '-'}</TableCell>
            <TableCell>{product.units?.name || '-'}</TableCell>
            <TableCell>Rp {product.selling_price?.toLocaleString('id-ID')}</TableCell>
            <TableCell>
              <span className={product.current_stock <= product.min_stock ? 'text-red-600' : 'text-green-600'}>
                {product.current_stock}
              </span>
              <span className="text-gray-400 text-xs ml-1">
                (min: {product.min_stock})
              </span>
            </TableCell>
            <TableCell>
              {product.price_variants?.length > 0 ? (
                <div className="text-sm">
                  {product.price_variants.slice(0, 2).map((variant: any) => (
                    <div key={variant.id} className="text-xs">
                      {variant.name}: Rp {variant.price?.toLocaleString('id-ID')} (min: {variant.minimum_quantity})
                    </div>
                  ))}
                  {product.price_variants.length > 2 && (
                    <div className="text-xs text-gray-500">+{product.price_variants.length - 2} lainnya</div>
                  )}
                </div>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-xs ${
                product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {product.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(product)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
                      onDelete(product.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ProductsTable;
