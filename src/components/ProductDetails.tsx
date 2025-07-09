
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Barcode, Tag, DollarSign, Layers, TrendingUp } from 'lucide-react';

interface ProductDetailsProps {
  product: any;
}

const ProductDetails = ({ product }: ProductDetailsProps) => {
  return (
    <div className="space-y-6">
      {/* Product Image and Basic Info */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-48 h-48 object-cover rounded-lg border"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-200 rounded-lg border flex items-center justify-center">
              <Package className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{product.name}</h2>
            <p className="text-gray-600 mt-2">{product.description || 'Tidak ada deskripsi'}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant={product.is_active ? 'default' : 'secondary'}>
              {product.is_active ? 'Aktif' : 'Nonaktif'}
            </Badge>
            {product.barcode && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Barcode className="h-4 w-4" />
                {product.barcode}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Harga Jual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {product.selling_price?.toLocaleString('id-ID') || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Harga Dasar: Rp {product.base_price?.toLocaleString('id-ID') || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Tersedia</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {product.current_stock} {product.units?.abbreviation || 'pcs'}
            </div>
            <p className="text-xs text-muted-foreground">
              Min. Stok: {product.min_stock}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategori</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {product.categories?.name || 'Tidak ada kategori'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Poin Loyalitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {product.loyalty_points} poin
            </div>
            <p className="text-xs text-muted-foreground">
              Min. Qty: {product.min_quantity}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Tambahan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Dibuat:</span>
            <span>{new Date(product.created_at).toLocaleDateString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Terakhir Diupdate:</span>
            <span>{new Date(product.updated_at).toLocaleDateString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Unit:</span>
            <span>{product.units?.name || 'Tidak ada unit'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductDetails;
