
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Upload, X } from 'lucide-react';

interface ProductFormProps {
  product?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const ProductForm = ({ product, onSuccess, onCancel }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    description: '',
    category_id: '',
    unit_id: '',
    supplier_id: '',
    base_price: 0,
    selling_price: 0,
    min_stock: 10,
    min_quantity: 1,
    loyalty_points: 1,
    is_active: true,
    image_url: ''
  });

  const [priceVariants, setPriceVariants] = useState([
    { name: '', minimum_quantity: 1, price: 0, is_active: true }
  ]);

  const [unitConversions, setUnitConversions] = useState([
    { from_unit_id: '', to_unit_id: '', conversion_factor: 1 }
  ]);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
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

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('suppliers').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        barcode: product.barcode || '',
        description: product.description || '',
        category_id: product.category_id || '',
        unit_id: product.unit_id || '',
        supplier_id: product.supplier_id || '',
        base_price: product.base_price || 0,
        selling_price: product.selling_price || 0,
        min_stock: product.min_stock || 10,
        min_quantity: product.min_quantity || 1,
        loyalty_points: product.loyalty_points || 1,
        is_active: product.is_active ?? true,
        image_url: product.image_url || ''
      });

      if (product.price_variants?.length > 0) {
        setPriceVariants(product.price_variants);
      }

      if (product.unit_conversions?.length > 0) {
        setUnitConversions(product.unit_conversions);
      }

      if (product.image_url) {
        setImagePreview(product.image_url);
      }
    }
  }, [product]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;

    const fileExt = selectedImage.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, selectedImage);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const saveProduct = useMutation({
    mutationFn: async (data: any) => {
      let imageUrl = formData.image_url;
      
      if (selectedImage) {
        imageUrl = await uploadImage();
      }

      const productData = { ...data, image_url: imageUrl };

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);
        if (error) throw error;

        // Update price variants
        await supabase.from('price_variants').delete().eq('product_id', product.id);
        if (priceVariants.some(pv => pv.name && pv.price > 0)) {
          const validVariants = priceVariants.filter(pv => pv.name && pv.price > 0);
          const { error: variantError } = await supabase
            .from('price_variants')
            .insert(validVariants.map(pv => ({ ...pv, product_id: product.id })));
          if (variantError) throw variantError;
        }

        // Update unit conversions
        await supabase.from('unit_conversions').delete().eq('product_id', product.id);
        if (unitConversions.some(uc => uc.from_unit_id && uc.to_unit_id && uc.conversion_factor > 0)) {
          const validConversions = unitConversions.filter(uc => uc.from_unit_id && uc.to_unit_id && uc.conversion_factor > 0);
          const { error: conversionError } = await supabase
            .from('unit_conversions')
            .insert(validConversions.map(uc => ({ ...uc, product_id: product.id })));
          if (conversionError) throw conversionError;
        }
      } else {
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();
        if (error) throw error;

        // Add price variants
        if (priceVariants.some(pv => pv.name && pv.price > 0)) {
          const validVariants = priceVariants.filter(pv => pv.name && pv.price > 0);
          const { error: variantError } = await supabase
            .from('price_variants')
            .insert(validVariants.map(pv => ({ ...pv, product_id: newProduct.id })));
          if (variantError) throw variantError;
        }

        // Add unit conversions
        if (unitConversions.some(uc => uc.from_unit_id && uc.to_unit_id && uc.conversion_factor > 0)) {
          const validConversions = unitConversions.filter(uc => uc.from_unit_id && uc.to_unit_id && uc.conversion_factor > 0);
          const { error: conversionError } = await supabase
            .from('unit_conversions')
            .insert(validConversions.map(uc => ({ ...uc, product_id: newProduct.id })));
          if (conversionError) throw conversionError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Berhasil', description: `Produk berhasil ${product ? 'diperbarui' : 'ditambahkan'}` });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const addPriceVariant = () => {
    setPriceVariants([...priceVariants, { name: '', minimum_quantity: 1, price: 0, is_active: true }]);
  };

  const removePriceVariant = (index: number) => {
    setPriceVariants(priceVariants.filter((_, i) => i !== index));
  };

  const addUnitConversion = () => {
    setUnitConversions([...unitConversions, { from_unit_id: '', to_unit_id: '', conversion_factor: 1 }]);
  };

  const removeUnitConversion = (index: number) => {
    setUnitConversions(unitConversions.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProduct.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Dasar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nama Produk *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="category">Kategori</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select value={formData.unit_id} onValueChange={(value) => setFormData(prev => ({ ...prev, unit_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>{unit.name} ({unit.abbreviation})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Select value={formData.supplier_id} onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <Label>Gambar Produk</Label>
            <div className="flex items-center gap-4 mt-2">
              {imagePreview && (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded border" />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0"
                    onClick={() => {
                      setImagePreview('');
                      setSelectedImage(null);
                      setFormData(prev => ({ ...prev, image_url: '' }));
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50">
                    <Upload className="w-4 h-4" />
                    Pilih Gambar
                  </div>
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Harga</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="base_price">Harga Beli *</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                value={formData.base_price}
                onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="selling_price">Harga Jual *</Label>
              <Input
                id="selling_price"
                type="number"
                step="0.01"
                value={formData.selling_price}
                onChange={(e) => setFormData(prev => ({ ...prev, selling_price: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Variants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Varian Harga (Berdasarkan Minimum Pembelian)
            <Button type="button" size="sm" onClick={addPriceVariant}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Varian
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {priceVariants.map((variant, index) => (
            <div key={index} className="flex items-center gap-4 p-4 border rounded">
              <div className="flex-1">
                <Label>Nama Varian</Label>
                <Input
                  value={variant.name}
                  onChange={(e) => {
                    const updated = [...priceVariants];
                    updated[index].name = e.target.value;
                    setPriceVariants(updated);
                  }}
                  placeholder="Contoh: Grosir"
                />
              </div>
              <div className="flex-1">
                <Label>Minimum Kuantitas</Label>
                <Input
                  type="number"
                  value={variant.minimum_quantity}
                  onChange={(e) => {
                    const updated = [...priceVariants];
                    updated[index].minimum_quantity = parseInt(e.target.value) || 1;
                    setPriceVariants(updated);
                  }}
                />
              </div>
              <div className="flex-1">
                <Label>Harga</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={variant.price}
                  onChange={(e) => {
                    const updated = [...priceVariants];
                    updated[index].price = parseFloat(e.target.value) || 0;
                    setPriceVariants(updated);
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={variant.is_active}
                  onCheckedChange={(checked) => {
                    const updated = [...priceVariants];
                    updated[index].is_active = checked;
                    setPriceVariants(updated);
                  }}
                />
                <Label>Aktif</Label>
              </div>
              {priceVariants.length > 1 && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removePriceVariant(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Unit Conversions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Konversi Unit
            <Button type="button" size="sm" onClick={addUnitConversion}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Konversi
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {unitConversions.map((conversion, index) => (
            <div key={index} className="flex items-center gap-4 p-4 border rounded">
              <div className="flex-1">
                <Label>Dari Unit</Label>
                <Select 
                  value={conversion.from_unit_id} 
                  onValueChange={(value) => {
                    const updated = [...unitConversions];
                    updated[index].from_unit_id = value;
                    setUnitConversions(updated);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Ke Unit</Label>
                <Select 
                  value={conversion.to_unit_id} 
                  onValueChange={(value) => {
                    const updated = [...unitConversions];
                    updated[index].to_unit_id = value;
                    setUnitConversions(updated);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Faktor Konversi</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={conversion.conversion_factor}
                  onChange={(e) => {
                    const updated = [...unitConversions];
                    updated[index].conversion_factor = parseFloat(e.target.value) || 1;
                    setUnitConversions(updated);
                  }}
                />
              </div>
              {unitConversions.length > 1 && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removeUnitConversion(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Stock & Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Stok & Pengaturan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {product && (
              <div>
                <Label>Stok Saat Ini (Read-only)</Label>
                <Input value={product.current_stock || 0} disabled />
              </div>
            )}
            <div>
              <Label htmlFor="min_stock">Minimum Stok *</Label>
              <Input
                id="min_stock"
                type="number"
                value={formData.min_stock}
                onChange={(e) => setFormData(prev => ({ ...prev, min_stock: parseInt(e.target.value) || 0 }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="min_quantity">Minimum Kuantitas</Label>
              <Input
                id="min_quantity"
                type="number"
                value={formData.min_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, min_quantity: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="loyalty_points">Poin Loyalitas</Label>
              <Input
                id="loyalty_points"
                type="number"
                value={formData.loyalty_points}
                onChange={(e) => setFormData(prev => ({ ...prev, loyalty_points: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Produk Aktif</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={saveProduct.isPending}>
          {saveProduct.isPending ? 'Menyimpan...' : product ? 'Update Produk' : 'Tambah Produk'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
