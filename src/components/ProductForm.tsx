
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Upload, X, Package, Plus, Trash2 } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  barcode: z.string().optional(),
  description: z.string().optional(),
  category_id: z.string().optional(),
  unit_id: z.string().optional(),
  supplier_id: z.string().optional(),
  base_price: z.number().min(0, 'Harga dasar harus >= 0'),
  selling_price: z.number().min(0, 'Harga jual harus >= 0'),
  min_stock: z.number().min(0, 'Stok minimum harus >= 0'),
  min_quantity: z.number().min(1, 'Kuantitas minimum harus >= 1'),
  loyalty_points: z.number().min(0, 'Poin loyalitas harus >= 0'),
  is_active: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: any;
  onSuccess: () => void;
  onClose: () => void;
}

const ProductForm = ({ product, onSuccess, onClose }: ProductFormProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(product?.image_url || '');
  const [uploading, setUploading] = useState(false);
  const [priceVariants, setPriceVariants] = useState<any[]>(product?.price_variants || []);
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      barcode: product?.barcode || '',
      description: product?.description || '',
      category_id: product?.category_id || '',
      unit_id: product?.unit_id || '',
      supplier_id: product?.supplier_id || '',
      base_price: product?.base_price || 0,
      selling_price: product?.selling_price || 0,
      min_stock: product?.min_stock || 10,
      min_quantity: product?.min_quantity || 1,
      loyalty_points: product?.loyalty_points || 1,
      is_active: product?.is_active ?? true,
    }
  });

  const isActive = watch('is_active');

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const addPriceVariant = () => {
    setPriceVariants([...priceVariants, { 
      name: '', 
      price: 0, 
      minimum_quantity: 1, 
      is_active: true 
    }]);
  };

  const removePriceVariant = (index: number) => {
    setPriceVariants(priceVariants.filter((_, i) => i !== index));
  };

  const updatePriceVariant = (index: number, field: string, value: any) => {
    const updated = [...priceVariants];
    updated[index] = { ...updated[index], [field]: value };
    setPriceVariants(updated);
  };

  const createProduct = useMutation({
    mutationFn: async (data: any) => {
      const { error: productError } = await supabase
        .from('products')
        .insert([data]);
      if (productError) throw productError;

      if (priceVariants.length > 0) {
        const { data: productData } = await supabase
          .from('products')
          .select('id')
          .eq('name', data.name)
          .single();

        if (productData) {
          const variantsToInsert = priceVariants.map(variant => ({
            ...variant,
            product_id: productData.id
          }));

          const { error: variantsError } = await supabase
            .from('price_variants')
            .insert(variantsToInsert);
          if (variantsError) throw variantsError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Berhasil', description: 'Produk berhasil ditambahkan' });
      onSuccess();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateProduct = useMutation({
    mutationFn: async (data: any) => {
      const { error: productError } = await supabase
        .from('products')
        .update(data)
        .eq('id', product.id);
      if (productError) throw productError;

      // Delete existing price variants
      await supabase
        .from('price_variants')
        .delete()
        .eq('product_id', product.id);

      // Insert new price variants
      if (priceVariants.length > 0) {
        const variantsToInsert = priceVariants.map(variant => ({
          ...variant,
          product_id: product.id
        }));

        const { error: variantsError } = await supabase
          .from('price_variants')
          .insert(variantsToInsert);
        if (variantsError) throw variantsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Berhasil', description: 'Produk berhasil diperbarui' });
      onSuccess();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const onSubmit = async (data: ProductFormData) => {
    try {
      setUploading(true);
      let image_url = imagePreview;

      if (imageFile) {
        image_url = await uploadImage(imageFile);
      }

      const productData = {
        ...data,
        image_url,
        category_id: data.category_id || null,
        unit_id: data.unit_id || null,
        supplier_id: data.supplier_id || null,
      };

      if (product) {
        updateProduct.mutate(productData);
      } else {
        createProduct.mutate(productData);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Produk *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Masukkan nama produk"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              {...register('barcode')}
              placeholder="Masukkan barcode produk"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Masukkan deskripsi produk"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_id">Kategori</Label>
            <Select
              value={watch('category_id')}
              onValueChange={(value) => setValue('category_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_id">Unit</Label>
            <Select
              value={watch('unit_id')}
              onValueChange={(value) => setValue('unit_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name} ({unit.abbreviation})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier_id">Supplier</Label>
            <Select
              value={watch('supplier_id')}
              onValueChange={(value) => setValue('supplier_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="base_price">Harga Dasar *</Label>
            <Input
              id="base_price"
              type="number"
              {...register('base_price', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.base_price && (
              <p className="text-sm text-red-500">{errors.base_price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="selling_price">Harga Jual *</Label>
            <Input
              id="selling_price"
              type="number"
              {...register('selling_price', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.selling_price && (
              <p className="text-sm text-red-500">{errors.selling_price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_stock">Stok Minimum *</Label>
            <Input
              id="min_stock"
              type="number"
              {...register('min_stock', { valueAsNumber: true })}
              placeholder="10"
            />
            {errors.min_stock && (
              <p className="text-sm text-red-500">{errors.min_stock.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_quantity">Kuantitas Minimum *</Label>
            <Input
              id="min_quantity"
              type="number"
              {...register('min_quantity', { valueAsNumber: true })}
              placeholder="1"
            />
            {errors.min_quantity && (
              <p className="text-sm text-red-500">{errors.min_quantity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="loyalty_points">Poin Loyalitas *</Label>
            <Input
              id="loyalty_points"
              type="number"
              {...register('loyalty_points', { valueAsNumber: true })}
              placeholder="1"
            />
            {errors.loyalty_points && (
              <p className="text-sm text-red-500">{errors.loyalty_points.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
            <Label htmlFor="is_active">Status Aktif</Label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Gambar Produk</Label>
        <div className="flex items-center gap-4">
          {imagePreview ? (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Product preview" 
                className="w-24 h-24 object-cover rounded border"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="w-24 h-24 bg-gray-100 rounded border flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
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
              <Button type="button" variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Gambar
                </span>
              </Button>
            </Label>
            <p className="text-xs text-gray-500 mt-1">
              Format: JPG, PNG (Max: 5MB)
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Varian Harga</Label>
          <Button type="button" variant="outline" size="sm" onClick={addPriceVariant}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Varian
          </Button>
        </div>
        
        {priceVariants.map((variant, index) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1">
              <Label>Nama Varian</Label>
              <Input
                value={variant.name}
                onChange={(e) => updatePriceVariant(index, 'name', e.target.value)}
                placeholder="Contoh: Grosir"
              />
            </div>
            <div className="flex-1">
              <Label>Harga</Label>
              <Input
                type="number"
                value={variant.price}
                onChange={(e) => updatePriceVariant(index, 'price', Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <Label>Kuantitas Minimum</Label>
              <Input
                type="number"
                value={variant.minimum_quantity}
                onChange={(e) => updatePriceVariant(index, 'minimum_quantity', Number(e.target.value))}
                placeholder="1"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removePriceVariant(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button 
          type="submit" 
          disabled={uploading || createProduct.isPending || updateProduct.isPending}
        >
          {uploading ? 'Mengupload...' : product ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
