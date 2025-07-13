import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Upload, X, Plus } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  description: z.string().optional(),
  base_price: z.number().min(0, 'Harga dasar harus lebih besar dari 0'),
  selling_price: z.number().min(0, 'Harga jual harus lebih besar dari 0'),
  min_quantity: z.number().min(1, 'Jumlah minimum harus lebih besar dari 0'),
  min_stock: z.number().min(0, 'Stok minimum tidak boleh negatif'),
  current_stock: z.number().min(0, 'Stok saat ini tidak boleh negatif'),
  loyalty_points: z.number().min(0, 'Poin loyalitas tidak boleh negatif'),
  category_id: z.string().optional(),
  unit_id: z.string().optional(),
  barcode: z.string().optional(),
  is_active: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: any;
  onSuccess: () => void;
  onClose: () => void;
}

const ProductForm = ({ product, onSuccess, onClose }: ProductFormProps) => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      base_price: 0,
      selling_price: 0,
      min_quantity: 1,
      min_stock: 10,
      current_stock: 0,
      loyalty_points: 1,
      is_active: true,
      barcode: '',
    }
  });

  useEffect(() => {
    if (product) {
      setValue('name', product.name);
      setValue('description', product.description || '');
      setValue('base_price', Number(product.base_price));
      setValue('selling_price', Number(product.selling_price));
      setValue('min_quantity', product.min_quantity);
      setValue('min_stock', product.min_stock);
      setValue('current_stock', product.current_stock);
      setValue('loyalty_points', product.loyalty_points);
      setValue('category_id', product.category_id || '');
      setValue('unit_id', product.unit_id || '');
      setValue('barcode', product.barcode || '');
      setValue('is_active', product.is_active);
      
      // Handle existing images - check for both single string and array
      if (product.image_url) {
        const urls = Array.isArray(product.image_url) ? product.image_url : [product.image_url];
        setExistingImageUrls(urls);
      }
    }
  }, [product, setValue]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024;
      if (!isValid) {
        toast({
          title: 'Error',
          description: `File ${file.name} tidak valid. Pastikan file adalah gambar dan ukuran maksimal 5MB.`,
          variant: 'destructive'
        });
      }
      return isValid;
    });
    
    setImageFiles(prev => [...prev, ...validFiles]);
  };

  const removeImageFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    });

    return Promise.all(uploadPromises);
  };

  const createProduct = useMutation({
    mutationFn: async (data: ProductFormData & { image_urls: string[] }) => {
      const { image_urls, ...productData } = data;
      
      // Ensure all required fields are present
      const productToInsert = {
        name: productData.name,
        description: productData.description || null,
        base_price: productData.base_price,
        selling_price: productData.selling_price,
        min_quantity: productData.min_quantity,
        min_stock: productData.min_stock,
        current_stock: productData.current_stock,
        loyalty_points: productData.loyalty_points,
        category_id: productData.category_id || null,
        unit_id: productData.unit_id || null,
        barcode: productData.barcode || null,
        is_active: productData.is_active,
        image_url: image_urls.length > 0 ? JSON.stringify(image_urls) : null
      };
      
      const { error } = await supabase.from('products').insert(productToInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
      toast({ title: 'Berhasil', description: 'Produk berhasil ditambahkan' });
      onSuccess();
    },
    onError: (error) => {
      console.error('Error creating product:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateProduct = useMutation({
    mutationFn: async (data: ProductFormData & { image_urls: string[] }) => {
      const { image_urls, ...productData } = data;
      
      // Ensure all required fields are present
      const productToUpdate = {
        name: productData.name,
        description: productData.description || null,
        base_price: productData.base_price,
        selling_price: productData.selling_price,
        min_quantity: productData.min_quantity,
        min_stock: productData.min_stock,
        current_stock: productData.current_stock,
        loyalty_points: productData.loyalty_points,
        category_id: productData.category_id || null,
        unit_id: productData.unit_id || null,
        barcode: productData.barcode || null,
        is_active: productData.is_active,
        image_url: image_urls.length > 0 ? JSON.stringify(image_urls) : null
      };
      
      const { error } = await supabase
        .from('products')
        .update(productToUpdate)
        .eq('id', product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
      toast({ title: 'Berhasil', description: 'Produk berhasil diperbarui' });
      onSuccess();
    },
    onError: (error) => {
      console.error('Error updating product:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const onFormSubmit = async (data: ProductFormData) => {
    setUploading(true);
    try {
      let imageUrls: string[] = [...existingImageUrls];

      if (imageFiles.length > 0) {
        const uploadedUrls = await uploadImages(imageFiles);
        imageUrls = [...imageUrls, ...uploadedUrls];
      }

      const formDataWithImages = { ...data, image_urls: imageUrls };

      if (product) {
        updateProduct.mutate(formDataWithImages);
      } else {
        createProduct.mutate(formDataWithImages);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengupload gambar. Silakan coba lagi.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{product ? 'Edit Produk' : 'Tambah Produk Baru'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label>Gambar Produk</Label>
            
            {/* Existing Images */}
            {existingImageUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {existingImageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Product ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New Image Files */}
            {imageFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imageFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImageFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-500">
                  Klik untuk menambah gambar (maksimal 5MB per file)
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Masukkan nama produk"
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                {...register('barcode')}
                placeholder="Masukkan barcode"
              />
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category_id">Kategori</Label>
              <Select value={watch('category_id')} onValueChange={(value) => setValue('category_id', value)}>
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
              <Label htmlFor="unit_id">Satuan</Label>
              <Select value={watch('unit_id')} onValueChange={(value) => setValue('unit_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih satuan" />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_price">Harga Dasar *</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                {...register('base_price', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.base_price && <p className="text-red-500 text-sm">{errors.base_price.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="selling_price">Harga Jual *</Label>
              <Input
                id="selling_price"
                type="number"
                step="0.01"
                {...register('selling_price', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.selling_price && <p className="text-red-500 text-sm">{errors.selling_price.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_quantity">Jumlah Minimum *</Label>
              <Input
                id="min_quantity"
                type="number"
                {...register('min_quantity', { valueAsNumber: true })}
                placeholder="1"
              />
              {errors.min_quantity && <p className="text-red-500 text-sm">{errors.min_quantity.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_stock">Stok Minimum *</Label>
              <Input
                id="min_stock"
                type="number"
                {...register('min_stock', { valueAsNumber: true })}
                placeholder="10"
              />
              {errors.min_stock && <p className="text-red-500 text-sm">{errors.min_stock.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_stock">Stok Saat Ini *</Label>
              <Input
                id="current_stock"
                type="number"
                {...register('current_stock', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.current_stock && <p className="text-red-500 text-sm">{errors.current_stock.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loyalty_points">Poin Loyalitas</Label>
            <Input
              id="loyalty_points"
              type="number"
              {...register('loyalty_points', { valueAsNumber: true })}
              placeholder="1"
            />
            {errors.loyalty_points && <p className="text-red-500 text-sm">{errors.loyalty_points.message}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={watch('is_active')}
              onCheckedChange={(checked) => setValue('is_active', !!checked)}
            />
            <Label htmlFor="is_active">Produk Aktif</Label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={uploading || createProduct.isPending || updateProduct.isPending}>
              {uploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Mengupload...
                </>
              ) : (
                product ? 'Update Produk' : 'Tambah Produk'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProductForm;
