
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Edit, Trash2 } from 'lucide-react';

interface ProductsTableProps {
  products: any[];
  onEdit: (product: any) => void;
  onDelete: (id: string) => void;
}

const ProductsTable = ({ products, onEdit, onDelete }: ProductsTableProps) => (
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
      {products.map(product => (
        <TableRow key={product.id}>
          <TableCell>
            {product.image_url ? (
              <img src={product.image_url} alt={String(product.name)} className="w-12 h-12 object-cover rounded" />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </TableCell>
          <TableCell>
            <div>
              <div className="font-medium">{String(product.name)}</div>
              {product.barcode && (
                <div className="text-sm text-gray-500">{String(product.barcode)}</div>
              )}
            </div>
          </TableCell>
          <TableCell>{String(product.categories?.name || '-')}</TableCell>
          <TableCell>{String(product.units?.name || '-')}</TableCell>
          <TableCell>Rp {product.selling_price?.toLocaleString('id-ID')}</TableCell>
          <TableCell>
            <span className={product.current_stock < product.min_stock ? 'text-red-600' : 'text-green-600'}>
              {product.current_stock} (readonly)
            </span>
          </TableCell>
          <TableCell>
            {product.price_variants?.length > 0 ? (
              <div className="text-sm">
                {product.price_variants.map((variant: any) => (
                  <div key={variant.id}>
                    {String(variant.name)}: Rp {variant.price?.toLocaleString('id-ID')} (min: {variant.minimum_quantity})
                  </div>
                ))}
              </div>
            ) : '-'}
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
                onClick={() => onDelete(product.id)}
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

export default ProductsTable;
