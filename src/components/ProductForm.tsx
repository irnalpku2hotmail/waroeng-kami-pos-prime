
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Upload, Plus, X } from 'lucide-react';

interface ProductFormProps {
  editProduct?: any;
  onClose: () => void;
}

const ProductForm = ({ editProduct, onClose }: ProductFormProps) => {
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [priceVariants, setPriceVariants] = useState<any[]>(editProduct?.price_variants || []);
  const [unitConversions, setUnitConversions] = useState<any[]>(editProduct?.unit_conversions || []);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase.from('units').select('*');
      if (error) throw error;
      return data;
    }
  });

  const uploadImage = async (file: File, productId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}-${Math.random()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const createProduct = useMutation({
    mutationFn: async (product: any) => {
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();
      
      if (error) throw error;

      // Upload image if provided
      if (imageFile) {
        const imageUrl = await uploadImage(imageFile, newProduct.id);
        await supabase
          .from('products')
          .update({ image_url: imageUrl })
          .eq('id', newProduct.id);
      }

      // Insert price variants
      if (priceVariants.length > 0) {
        const variants = priceVariants.map(variant => ({
          ...variant,
          product_id: newProduct.id
        }));
        await supabase.from('price_variants').insert(variants);
      }

      // Insert unit conversions
      if (unitConversions.length > 0) {
        const conversions = unitConversions.map(conversion => ({
          ...conversion,
          product_id: newProduct.id
        }));
        await supabase.from('unit_conversions').insert(conversions);
      }

      return newProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
      toast({ title: 'Berhasil', description: 'Produk berhasil ditambahkan' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...product }: any) => {
      const { error } = await supabase.from('products').update(product).eq('id', id);
      if (error) throw error;

      // Upload new image if provided
      if (imageFile) {
        const imageUrl = await uploadImage(imageFile, id);
        await supabase
          .from('products')
          .update({ image_url: imageUrl })
          .eq('id', id);
      }

      // Update price variants
      await supabase.from('price_variants').delete().eq('product_id', id);
      if (priceVariants.length > 0) {
        const variants = priceVariants.map(variant => ({
          ...variant,
          product_id: id
        }));
        await supabase.from('price_variants').insert(variants);
      }

      // Update unit conversions
      await supabase.from('unit_conversions').delete().eq('product_id', id);
      if (unitConversions.length > 0) {
        const conversions = unitConversions.map(conversion => ({
          ...conversion,
          product_id: id
        }));
        await supabase.from('unit_conversions').insert(conversions);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
      toast({ title: 'Berhasil', description: 'Produk berhasil diupdate' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productData = {
      name: formData.get('name') as string,
      barcode: formData.get('barcode') as string,
      category_id: formData.get('category_id') as string || null,
      unit_id: formData.get('unit_id') as string || null,
      base_price: Number(formData.get('base_price')),
      selling_price: Number(formData.get('selling_price')),
      min_stock: Number(formData.get('min_stock')),
      loyalty_points: Number(formData.get('loyalty_points')),
      description: formData.get('description') as string,
      is_active: formData.get('is_active') === 'on'
    };

    if (editProduct) {
      updateProduct.mutate({ id: editProduct.id, ...productData });
    } else {
      createProduct.mutate(productData);
    }
  };

  const addPriceVariant = () => {
    setPriceVariants([...priceVariants, { name: '', price: 0, minimum_quantity: 1 }]);
  };

  const removePriceVariant = (index: number) => {
    setPriceVariants(priceVariants.filter((_, i) => i !== index));
  };

  const updatePriceVariant = (index: number, field: string, value: any) => {
    const updated = [...priceVariants];
    updated[index] = { ...updated[index], [field]: value };
    setPriceVariants(updated);
  };

  const addUnitConversion = () => {
    setUnitConversions([...unitConversions, { from_unit: '', to_unit: '', conversion_factor: 1 }]);
  };

  const removeUnitConversion = (index: number) => {
    setUnitConversions(unitConversions.filter((_, i) => i !== index));
  };

  const updateUnitConversion = (index: number, field: string, value: any) => {
    const updated = [...unitConversions];
    updated[index] = { ...updated[index], [field]: value };
    setUnitConversions(updated);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Produk *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={editProduct?.name}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="barcode">Barcode</Label>
          <Input
            id="barcode"
            name="barcode"
            defaultValue={editProduct?.barcode}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category_id">Kategori</Label>
          <Select name="category_id" defaultValue={editProduct?.category_id}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit_id">Unit</Label>
          <Select name="unit_id" defaultValue={editProduct?.unit_id}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih unit" />
            </SelectTrigger>
            <SelectContent>
              {units?.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.name} ({unit.abbreviation})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="base_price">Harga Pokok</Label>
          <Input
            id="base_price"
            name="base_price"
            type="number"
            defaultValue={editProduct?.base_price}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="selling_price">Harga Jual</Label>
          <Input
            id="selling_price"
            name="selling_price"
            type="number"
            defaultValue={editProduct?.selling_price}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min_stock">Stok Minimal</Label>
          <Input
            id="min_stock"
            name="min_stock"
            type="number"
            defaultValue={editProduct?.min_stock || 10}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loyalty_points">Poin Loyalty</Label>
          <Input
            id="loyalty_points"
            name="loyalty_points"
            type="number"
            defaultValue={editProduct?.loyalty_points || 1}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={editProduct?.description}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Gambar Produk</Label>
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
        {editProduct?.image_url && (
          <img src={editProduct.image_url} alt="Product" className="w-20 h-20 object-cover rounded" />
        )}
      </div>

      {/* Price Variants Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Varian Harga</Label>
          <Button type="button" size="sm" onClick={addPriceVariant}>
            <Plus className="h-4 w-4 mr-1" />
            Tambah Varian
          </Button>
        </div>
        {priceVariants.map((variant, index) => (
          <div key={index} className="grid grid-cols-4 gap-2 items-end">
            <div>
              <Label className="text-xs">Nama Varian</Label>
              <Input
                value={variant.name}
                onChange={(e) => updatePriceVariant(index, 'name', e.target.value)}
                placeholder="Grosir"
              />
            </div>
            <div>
              <Label className="text-xs">Harga</Label>
              <Input
                type="number"
                value={variant.price}
                onChange={(e) => updatePriceVariant(index, 'price', parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-xs">Min. Pembelian</Label>
              <Input
                type="number"
                value={variant.minimum_quantity}
                onChange={(e) => updatePriceVariant(index, 'minimum_quantity', parseInt(e.target.value))}
              />
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => removePriceVariant(index)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Unit Conversions Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Konversi Unit</Label>
          <Button type="button" size="sm" onClick={addUnitConversion}>
            <Plus className="h-4 w-4 mr-1" />
            Tambah Konversi
          </Button>
        </div>
        {unitConversions.map((conversion, index) => (
          <div key={index} className="grid grid-cols-4 gap-2 items-end">
            <div>
              <Label className="text-xs">Dari Unit</Label>
              <Input
                value={conversion.from_unit}
                onChange={(e) => updateUnitConversion(index, 'from_unit', e.target.value)}
                placeholder="carton"
              />
            </div>
            <div>
              <Label className="text-xs">Ke Unit</Label>
              <Input
                value={conversion.to_unit}
                onChange={(e) => updateUnitConversion(index, 'to_unit', e.target.value)}
                placeholder="pcs"
              />
            </div>
            <div>
              <Label className="text-xs">Faktor Konversi</Label>
              <Input
                type="number"
                value={conversion.conversion_factor}
                onChange={(e) => updateUnitConversion(index, 'conversion_factor', parseFloat(e.target.value))}
                placeholder="40"
              />
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => removeUnitConversion(index)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          name="is_active"
          defaultChecked={editProduct?.is_active ?? true}
        />
        <Label htmlFor="is_active">Produk Aktif</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit">
          {editProduct ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
