
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Search, Plus, Upload, ImageIcon, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BundleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundle?: any;
  onSuccess: () => void;
}

const BundleFormModal = ({ open, onOpenChange, bundle, onSuccess }: BundleFormModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [bundleType, setBundleType] = useState('fixed');
  const [status, setStatus] = useState('draft');
  const [discountPrice, setDiscountPrice] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<{ product_id: string; quantity: number; name: string; price: number; stock: number }[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [] } = useQuery({
    queryKey: ['bundle-products-search', productSearch],
    queryFn: async () => {
      let query = supabase.from('products').select('id, name, selling_price, current_stock, image_url').eq('is_active', true).limit(20);
      if (productSearch) query = query.ilike('name', `%${productSearch}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (bundle) {
      setName(bundle.name);
      setDescription(bundle.description || '');
      setImageUrl(bundle.image_url || '');
      setImagePreview(bundle.image_url || null);
      setBundleType(bundle.bundle_type);
      setStatus(bundle.status);
      setDiscountPrice(bundle.discount_price);
      setSelectedProducts(
        (bundle.bundle_items || []).map((bi: any) => ({
          product_id: bi.product_id,
          quantity: bi.quantity,
          name: bi.products?.name || '',
          price: bi.products?.selling_price || 0,
          stock: bi.products?.current_stock || 0,
        }))
      );
    } else {
      setName(''); setDescription(''); setImageUrl(''); setImagePreview(null); setBundleType('fixed'); setStatus('draft'); setDiscountPrice(0); setSelectedProducts([]);
    }
  }, [bundle, open]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'File harus berupa gambar', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Ukuran file maksimal 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `bundles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('bundle-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('bundle-images')
        .getPublicUrl(filePath);

      setImageUrl(urlData.publicUrl);
      setImagePreview(urlData.publicUrl);
      toast({ title: 'Berhasil', description: 'Gambar berhasil diupload' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Gagal upload gambar', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImageUrl('');
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const originalPrice = selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name || selectedProducts.length === 0) throw new Error('Nama dan produk wajib diisi');
      if (discountPrice <= 0 || discountPrice >= originalPrice) throw new Error('Harga diskon harus lebih kecil dari harga total');

      const bundleData = {
        name, slug, description: description || null, image_url: imageUrl || null,
        bundle_type: bundleType, status, discount_price: discountPrice, original_price: originalPrice,
      };

      let bundleId: string;

      if (bundle) {
        const { error } = await supabase.from('bundles').update(bundleData).eq('id', bundle.id);
        if (error) throw error;
        bundleId = bundle.id;
        await supabase.from('bundle_items').delete().eq('bundle_id', bundleId);
      } else {
        const { data, error } = await supabase.from('bundles').insert(bundleData).select('id').single();
        if (error) throw error;
        bundleId = data.id;
      }

      const items = selectedProducts.map(p => ({ bundle_id: bundleId, product_id: p.product_id, quantity: p.quantity }));
      const { error: itemsError } = await supabase.from('bundle_items').insert(items);
      if (itemsError) throw itemsError;
    },
    onSuccess: () => {
      toast({ title: 'Berhasil', description: bundle ? 'Bundling diperbarui' : 'Bundling dibuat' });
      onSuccess();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const addProduct = (product: any) => {
    if (selectedProducts.find(p => p.product_id === product.id)) return;
    setSelectedProducts(prev => [...prev, { product_id: product.id, quantity: 1, name: product.name, price: product.selling_price, stock: product.current_stock }]);
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.product_id !== productId));
  };

  const updateQty = (productId: string, qty: number) => {
    setSelectedProducts(prev => prev.map(p => p.product_id === productId ? { ...p, quantity: Math.max(1, qty) } : p));
  };

  const formatPrice = (p: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bundle ? 'Edit Bundling' : 'Buat Bundling Baru'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nama Paket</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Paket Hemat Ramadan" />
              {slug && <p className="text-xs text-muted-foreground mt-1">Slug: {slug}</p>}
            </div>
            <div className="col-span-2">
              <Label>Deskripsi (maks 150 karakter)</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value.slice(0, 150))} maxLength={150} placeholder="Deskripsi singkat paket" />
            </div>
            <div>
              <Label>Tipe</Label>
              <Select value={bundleType} onValueChange={setBundleType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Bundle</SelectItem>
                  <SelectItem value="optional">Optional Bundle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Image Upload */}
            <div className="col-span-2">
              <Label>Gambar Bundling</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {imagePreview ? (
                <div className="relative mt-2 rounded-lg overflow-hidden border border-border bg-muted/30">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 px-2 backdrop-blur-sm bg-background/80"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      <span className="ml-1 text-xs">Ganti</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="h-8 px-2 backdrop-blur-sm"
                      onClick={removeImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="mt-2 w-full h-36 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm">Mengupload...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-sm font-medium">Klik untuk upload gambar</span>
                      <span className="text-xs">JPG, PNG, WebP • Maks 5MB</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <Label>Produk dalam Paket</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Cari produk..." className="pl-9" />
            </div>
            {productSearch && (
              <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg divide-y">
                {products.filter(p => !selectedProducts.find(sp => sp.product_id === p.id)).map(product => (
                  <button key={product.id} onClick={() => addProduct(product)} className="w-full flex items-center gap-3 p-2 hover:bg-muted text-left text-sm">
                    <Plus className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="flex-1 truncate">{product.name}</span>
                    <span className="text-muted-foreground">{formatPrice(product.selling_price)}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected products */}
            <div className="mt-3 space-y-2">
              {selectedProducts.map(p => (
                <div key={p.product_id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                  <span className="flex-1 text-sm truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{formatPrice(p.price)}</span>
                  <Input type="number" value={p.quantity} onChange={e => updateQty(p.product_id, parseInt(e.target.value) || 1)} className="w-16 h-8 text-center" min={1} />
                  <Button size="sm" variant="ghost" onClick={() => removeProduct(p.product_id)}><X className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Harga Normal (Total)</span>
              <span className="font-medium">{formatPrice(originalPrice)}</span>
            </div>
            <div>
              <Label>Harga Diskon Bundling</Label>
              <Input type="number" value={discountPrice} onChange={e => setDiscountPrice(Number(e.target.value))} />
            </div>
            {discountPrice > 0 && originalPrice > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600 font-medium">Hemat</span>
                <span className="text-green-600 font-bold">
                  {formatPrice(originalPrice - discountPrice)} ({((originalPrice - discountPrice) / originalPrice * 100).toFixed(1)}%)
                </span>
              </div>
            )}
          </div>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || uploading} className="w-full">
            {saveMutation.isPending ? 'Menyimpan...' : bundle ? 'Update Bundling' : 'Simpan Bundling'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BundleFormModal;
