
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart, Plus, Minus, Trash2, Package, Search } from 'lucide-react';
import Layout from '@/components/Layout';

interface CartItem {
  id: string;
  product: any;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const Cart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch products for search
  const { data: products = [] } = useQuery({
    queryKey: ['products-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .eq('is_active', true)
        .gt('current_stock', 0)
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: searchTerm.length > 0
  });

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.current_stock) {
        toast({ 
          title: 'Error', 
          description: 'Stok tidak mencukupi', 
          variant: 'destructive' 
        });
        return;
      }
      
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { 
              ...item, 
              quantity: item.quantity + 1,
              total_price: (item.quantity + 1) * item.unit_price
            }
          : item
      ));
    } else {
      const newItem: CartItem = {
        id: product.id,
        product: product,
        quantity: 1,
        unit_price: product.selling_price,
        total_price: product.selling_price
      };
      setCart([...cart, newItem]);
    }
    
    setSearchTerm('');
    toast({ title: 'Berhasil', description: `${product.name} ditambahkan ke keranjang` });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find(item => item.product.id === productId);
    if (item && newQuantity > item.product.current_stock) {
      toast({ 
        title: 'Error', 
        description: 'Stok tidak mencukupi', 
        variant: 'destructive' 
      });
      return;
    }

    setCart(cart.map(item => 
      item.product.id === productId 
        ? { 
            ...item, 
            quantity: newQuantity,
            total_price: newQuantity * item.unit_price
          }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.total_price, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Keranjang Belanja</h1>
          {cart.length > 0 && (
            <Button variant="outline" onClick={clearCart}>
              <Trash2 className="h-4 w-4 mr-2" />
              Kosongkan Keranjang
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Cari Produk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Cari nama produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {searchTerm && products.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => addToCart(product)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-gray-500">
                            Rp {product.selling_price.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <Badge variant={product.current_stock > 10 ? "default" : "destructive"}>
                          {product.current_stock} stok
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchTerm && products.length === 0 && (
                <div className="text-center py-4">
                  <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">Produk tidak ditemukan</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cart Items */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Item Keranjang ({getTotalItems()})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Keranjang masih kosong</p>
                  <p className="text-sm text-gray-400">Cari dan tambahkan produk ke keranjang</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.product.name}</div>
                              <div className="text-sm text-gray-500">
                                Stok: {item.product.current_stock}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            Rp {item.unit_price.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 0)}
                                className="w-16 text-center"
                                min="0"
                                max={item.product.current_stock}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                disabled={item.quantity >= item.product.current_stock}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            Rp {item.total_price.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(item.product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium">Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        Rp {getTotalAmount().toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={clearCart}>
                      Kosongkan
                    </Button>
                    <Button>
                      Lanjut ke Checkout
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
