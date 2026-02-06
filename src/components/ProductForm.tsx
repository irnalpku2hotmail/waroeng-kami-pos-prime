import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Plus, Minus, X, Upload } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import BarcodeScanner from '@/components/BarcodeScanner';

interface PriceVariant {
  id?: string;
  name: string;
  minimum_quantity: number;
  price: number;
}

interface UnitConversion {
  id?: string;
  from_unit_id: string;
  to_unit_id: string;
  conversion_factor: number;
}

interface ProductFormProps {
  product?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const ProductForm = ({ product, onClose, onSuccess }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    barcode: '',
    base_price: 0,
    selling_price: 0,
    min_stock: 10,
    loyalty_points: 0,
    category_id: '',
    unit_id: '',
    is_active: true,
    has_service_fee: false
  });

  const [priceVariants, setPriceVariants] = useState<PriceVariant[]>([]);
  const [unitConversions, setUnitConversions] = useState<UnitConversion[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch units
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase.from('units').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  // Ambil konversi unit dari Supabase saat edit atau refresh
  useEffect(() => {
    if (product?.id) {
      // Fetch dari Supabase
      (async () => {
        const { data: uc, error } = await supabase
          .from('unit_conversions')
          .select('*')
          .eq('product_id', product.id);
        if (!error && uc) {
          setUnitConversions(
            uc.map((ucItem: any) => ({
              id: ucItem.id,
              from_unit_id: ucItem.from_unit_id,
              to_unit_id: ucItem.to_unit_id,
              conversion_factor: ucItem.conversion_factor,
            }))
          );
        } else {
          setUnitConversions([]);
        }
      })();
    } else if (product && product.unit_conversions) {
      setUnitConversions(product.unit_conversions.map((uc: any) => ({
        id: uc.id,
        from_unit_id: uc.from_unit_id,
        to_unit_id: uc.to_unit_id,
        conversion_factor: uc.conversion_factor
      })));
    } else {
      setUnitConversions([]);
    }
  }, [product]);

  // Load existing product data
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        barcode: product.barcode || '',
        base_price: product.base_price || 0,
        selling_price: product.selling_price || 0,
        min_stock: product.min_stock || 10,
        loyalty_points: product.loyalty_points || 1,
        category_id: product.category_id || '',
        unit_id: product.unit_id || '',
        is_active: product.is_active !== false,
        has_service_fee: product.has_service_fee || false
      });

      if (product.price_variants) {
        setPriceVariants(product.price_variants.map((pv: any) => ({
          id: pv.id,
          name: pv.name,
          minimum_quantity: pv.minimum_quantity,
          price: pv.price
        })));
      }

      if (product.unit_conversions) {
        setUnitConversions(product.unit_conversions.map((uc: any) => ({
          id: uc.id,
          from_unit_id: uc.from_unit_id,
          to_unit_id: uc.to_unit_id,
          conversion_factor: uc.conversion_factor
        })));
      }

      if (product.image_url) {
        setImagePreview(product.image_url);
      }
    }
  }, [product]);

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const saveProduct = useMutation({
    mutationFn: async () => {
      let imageUrl = product?.image_url;
      
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const productData = {
        ...formData,
        image_url: imageUrl,
        category_id: formData.category_id || null,
        unit_id: formData.unit_id || null
      };

      if (product) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);
        
        if (error) throw error;

        // Update price variants
        if (priceVariants.length > 0) {
          // Delete existing variants
          await supabase
            .from('price_variants')
            .delete()
            .eq('product_id', product.id);

          // Insert new variants
          const variants = priceVariants.map(pv => ({
            product_id: product.id,
            name: pv.name,
            minimum_quantity: pv.minimum_quantity,
            price: pv.price,
            is_active: true
          }));

          const { error: variantError } = await supabase
            .from('price_variants')
            .insert(variants);

          if (variantError) throw variantError;
        }

        // --- Perbaikan bagian unit conversions: hapus dan tambah ulang ---
        // Hapus semua konversi eksisting produk
        await supabase
          .from('unit_conversions')
          .delete()
          .eq('product_id', product.id);

        // Insert ulang jika ada konversi
        if (unitConversions.length > 0) {
          const conversions = unitConversions.map(uc => ({
            product_id: product.id,
            from_unit_id: uc.from_unit_id,
            to_unit_id: uc.to_unit_id,
            conversion_factor: uc.conversion_factor
          }));
          const { error: conversionError } = await supabase
            .from('unit_conversions')
            .insert(conversions);
          if (conversionError) throw conversionError;
        }
        // --- END ---
        return { id: product.id };
      } else {
        // Create new product
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();
        
        if (error) throw error;

        // Insert price variants
        if (priceVariants.length > 0) {
          const variants = priceVariants.map(pv => ({
            product_id: newProduct.id,
            name: pv.name,
            minimum_quantity: pv.minimum_quantity,
            price: pv.price,
            is_active: true
          }));

          const { error: variantError } = await supabase
            .from('price_variants')
            .insert(variants);

          if (variantError) throw variantError;
        }

        // Insert konversi unit jika ada
        if (unitConversions.length > 0) {
          const conversions = unitConversions.map(uc => ({
            product_id: newProduct.id,
            from_unit_id: uc.from_unit_id,
            to_unit_id: uc.to_unit_id,
            conversion_factor: uc.conversion_factor
          }));

          const { error: conversionError } = await supabase
            .from('unit_conversions')
            .insert(conversions);

          if (conversionError) throw conversionError;
        }

        return newProduct;
      }
    },
    onSuccess: () => {
      toast({ 
        title: 'Berhasil', 
        description: `Produk berhasil ${product ? 'diupdate' : 'ditambahkan'}` 
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      console.error('Product save error:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Gagal menyimpan produk', 
        variant: 'destructive' 
      });
    }
  });

  const addPriceVariant = () => {
    setPriceVariants([...priceVariants, {
      name: '',
      minimum_quantity: 1,
      price: 0
    }]);
  };

  const updatePriceVariant = (index: number, field: keyof PriceVariant, value: any) => {
    const updated = [...priceVariants];
    updated[index] = { ...updated[index], [field]: value };
    setPriceVariants(updated);
  };

  const removePriceVariant = (index: number) => {
    setPriceVariants(priceVariants.filter((_, i) => i !== index));
  };

  const addUnitConversion = () => {
    setUnitConversions([...unitConversions, {
      from_unit_id: '',
      to_unit_id: '',
      conversion_factor: 1
    }]);
  };

  const updateUnitConversion = (index: number, field: keyof UnitConversion, value: any) => {
    const updated = [...unitConversions];
    updated[index] = { ...updated[index], [field]: value };
    setUnitConversions(updated);
  };

  const removeUnitConversion = (index: number) => {
    setUnitConversions(unitConversions.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Nama produk harus diisi', variant: 'destructive' });
      return;
    }
    
    if (formData.selling_price <= 0) {
      toast({ title: 'Error', description: 'Harga jual harus lebih dari 0', variant: 'destructive' });
      return;
    }

    saveProduct.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Produk *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nama produk"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi produk"
              />
            </div>

            <div>
              <Label htmlFor="barcode">Barcode</Label>
              <div className="flex gap-2">
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Kode barcode"
                  className="flex-1"
                />
                <BarcodeScanner 
                  onScanSuccess={(barcode) => setFormData({ ...formData, barcode })} 
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Kategori</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select value={formData.unit_id} onValueChange={(value) => setFormData({ ...formData, unit_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name} ({unit.abbreviation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Produk Aktif</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="has_service_fee"
                checked={formData.has_service_fee}
                onCheckedChange={(checked) => setFormData({ ...formData, has_service_fee: checked })}
              />
              <Label htmlFor="has_service_fee">Kenakan Biaya Layanan</Label>
            </div>
          </CardContent>
        </Card>

        {/* Pricing and Stock */}
        <Card>
          <CardHeader>
            <CardTitle>Harga & Stok</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="base_price">Harga Beli</Label>
              <Input
                id="base_price"
                type="number"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label htmlFor="selling_price">Harga Jual *</Label>
              <Input
                id="selling_price"
                type="number"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </div>

            {product && (
              <div>
                <Label>Stok Saat Ini</Label>
                <Input
                  value={product.current_stock || 0}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            )}

            <div>
              <Label htmlFor="min_stock">Stok Minimum</Label>
              <Input
                id="min_stock"
                type="number"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) || 10 })}
                placeholder="10"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="loyalty_points">Poin Loyalitas</Label>
              <Input
                id="loyalty_points"
                type="number"
                value={formData.loyalty_points}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setFormData({ ...formData, loyalty_points: isNaN(value) ? 0 : value });
                }}
                placeholder="0"
                min="0"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Image */}
      <Card>
        <CardHeader>
          <CardTitle>Gambar Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="image">Upload Gambar</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
            {imagePreview && (
              <div className="flex justify-center">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-w-xs max-h-48 object-cover rounded border"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Price Variants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Varian Harga Jual (Berdasarkan Pembelian Minimum)
            <Button type="button" variant="outline" size="sm" onClick={addPriceVariant}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Varian
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {priceVariants.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Belum ada varian harga</p>
          ) : (
            <div className="space-y-4">
              {priceVariants.map((variant, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label>Nama Varian</Label>
                    <Input
                      value={variant.name}
                      onChange={(e) => updatePriceVariant(index, 'name', e.target.value)}
                      placeholder="Contoh: Grosir"
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Pembelian Minimum</Label>
                    <Input
                      type="number"
                      value={variant.minimum_quantity}
                      onChange={(e) => updatePriceVariant(index, 'minimum_quantity', parseInt(e.target.value) || 1)}
                      placeholder="1"
                      min="1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Harga</Label>
                    <Input
                      type="number"
                      value={variant.price}
                      onChange={(e) => updatePriceVariant(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm"
                    onClick={() => removePriceVariant(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unit Conversions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Konversi Unit
            <Button type="button" variant="outline" size="sm" onClick={addUnitConversion}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Konversi
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unitConversions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Belum ada konversi unit</p>
          ) : (
            <div className="space-y-4">
              {unitConversions.map((conversion, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label>Dari Unit</Label>
                    <Select
                      value={conversion.from_unit_id}
                      onValueChange={(value) => updateUnitConversion(index, 'from_unit_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih unit asal" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map(unit => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name} ({unit.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Ke Unit</Label>
                    <Select
                      value={conversion.to_unit_id}
                      onValueChange={(value) => updateUnitConversion(index, 'to_unit_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih unit tujuan" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map(unit => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name} ({unit.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Faktor Konversi</Label>
                    <Input
                      type="number"
                      value={conversion.conversion_factor}
                      onChange={(e) => updateUnitConversion(index, 'conversion_factor', parseFloat(e.target.value) || 1)}
                      placeholder="1"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm"
                    onClick={() => removeUnitConversion(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={saveProduct.isPending}>
          {saveProduct.isPending ? 'Menyimpan...' : (product ? 'Update' : 'Simpan')}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
