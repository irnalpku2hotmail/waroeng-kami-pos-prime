
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, AlertTriangle, Edit, BarChart3 } from 'lucide-react';
import StockAdjustmentModal from './StockAdjustmentModal';
import StockLevelDetailsModal from './StockLevelDetailsModal';

interface StockLevelTabProps {
  products: any[];
}

const StockLevelTab = ({ products }: StockLevelTabProps) => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const handleAdjustStock = (product: any) => {
    setSelectedProduct(product);
    setAdjustmentModalOpen(true);
  };

  const handleViewDetails = (product: any) => {
    setSelectedProduct(product);
    setDetailsModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Level Stok Produk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Produk</th>
                  <th className="text-left p-2">Kategori</th>
                  <th className="text-left p-2">Stok Saat Ini</th>
                  <th className="text-left p-2">Stok Minimum</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Harga Jual</th>
                  <th className="text-left p-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const isLowStock = product.current_stock <= product.min_stock;
                  const isOutOfStock = product.current_stock <= 0;
                  
                  return (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.barcode}</p>
                        </div>
                      </td>
                      <td className="p-2">
                        {product.categories?.name || '-'}
                      </td>
                      <td className="p-2">
                        <span className={`font-medium ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
                          {product.current_stock} {product.units?.abbreviation}
                        </span>
                      </td>
                      <td className="p-2">
                        {product.min_stock} {product.units?.abbreviation}
                      </td>
                      <td className="p-2">
                        {isOutOfStock ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Habis
                          </Badge>
                        ) : isLowStock ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Rendah
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Normal
                          </Badge>
                        )}
                      </td>
                      <td className="p-2">
                        Rp {product.selling_price?.toLocaleString('id-ID')}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(product)}
                            className="flex items-center gap-1"
                          >
                            <BarChart3 className="h-3 w-3" />
                            Detail
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAdjustStock(product)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Sesuaikan
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {products.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Tidak ada produk ditemukan
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <StockAdjustmentModal
          open={adjustmentModalOpen}
          onOpenChange={setAdjustmentModalOpen}
          product={selectedProduct}
        />
      )}

      {/* Stock Details Modal */}
      {selectedProduct && (
        <StockLevelDetailsModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          product={selectedProduct}
        />
      )}
    </>
  );
};

export default StockLevelTab;
