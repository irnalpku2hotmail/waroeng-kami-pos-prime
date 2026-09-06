
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Upload, X, Package } from 'lucide-react';
import { OPTIMIZED_CACHE_CONTROL } from '@/utils/imageOptimization';
import { compressImageToMaxSize, MAX_BYTES, COMPRESSION_FAILED_MESSAGE, formatBytes } from '@/lib/imageCompression';


const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  category?: any;
  onSuccess: () => void;
  onClose: () => void;
}

const CategoryForm = ({ category, onSuccess, onClose }: CategoryFormProps) => {
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>(String(category?.icon_url || ''));
  const [uploading, setUploading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [iconInfo, setIconInfo] = useState<{ original: string; optimized: string; format: string } | null>(null);
  const queryClient = useQueryClient();


  const { register, handleSubmit, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: String(category?.name || ''),
      description: String(category?.description || ''),
    }
  });

  const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOptimizing(true);
    try {
      const result = await compressImageToMaxSize(file, { target: 'category' });
      setIconFile(result.file);
      setIconPreview(URL.createObjectURL(result.file));
      setIconInfo({
        original: formatBytes(result.originalSize),
        optimized: formatBytes(result.size),
        format: result.format === 'original' ? (file.type.split('/')[1] || '').toUpperCase() : result.format,
      });
    } catch {
      setIconFile(null);
      setIconInfo(null);
      setIconPreview(String(category?.icon_url || ''));
      e.target.value = '';
      toast({ title: 'Gagal mengoptimasi gambar', description: COMPRESSION_FAILED_MESSAGE, variant: 'destructive' });
    } finally {
      setOptimizing(false);
    }
  };

  const removeIcon = () => {
    setIconFile(null);
    setIconPreview('');
    setIconInfo(null);
  };

  const uploadIcon = async (file: File): Promise<string> => {
    if (file.size > MAX_BYTES) throw new Error(COMPRESSION_FAILED_MESSAGE);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('category-icons')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: OPTIMIZED_CACHE_CONTROL,
        upsert: false,
      });


    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('category-icons')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const checkDuplicateName = async (name: string, excludeId?: string) => {
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', name);
    
    if (error) throw error;
    
    if (excludeId) {
      return data.some(cat => cat.id !== excludeId);
    }
    
    return data.length > 0;
  };

  const createCategory = useMutation({
    mutationFn: async (data: { name: string; description?: string; icon_url?: string }) => {
      // Check for duplicate name
      const isDuplicate = await checkDuplicateName(data.name);
      if (isDuplicate) {
        throw new Error('Nama kategori sudah ada, silakan gunakan nama lain');
      }

      const { error } = await supabase
        .from('categories')
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Berhasil', description: 'Kategori berhasil ditambahkan' });
      onSuccess();
    },
    onError: (error) => {
      toast({ title: 'Error', description: String(error.message), variant: 'destructive' });
    }
  });

  const updateCategory = useMutation({
    mutationFn: async (data: { name: string; description?: string; icon_url?: string }) => {
      // Check for duplicate name (excluding current category)
      const isDuplicate = await checkDuplicateName(data.name, category.id);
      if (isDuplicate) {
        throw new Error('Nama kategori sudah ada, silakan gunakan nama lain');
      }

      const { error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', category.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Berhasil', description: 'Kategori berhasil diperbarui' });
      onSuccess();
    },
    onError: (error) => {
      toast({ title: 'Error', description: String(error.message), variant: 'destructive' });
    }
  });

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setUploading(true);
      let icon_url = iconPreview;

      if (iconFile) {
        if (category?.icon_url) {
          const { deleteStorageFileByUrlAsync } = await import('@/utils/storageCleanup');
          deleteStorageFileByUrlAsync(String(category.icon_url));
        }
        icon_url = await uploadIcon(iconFile);
      } else if (category?.icon_url && !iconPreview) {
        const { deleteStorageFileByUrlAsync } = await import('@/utils/storageCleanup');
        deleteStorageFileByUrlAsync(String(category.icon_url));
      }

      const formData = { 
        name: String(data.name), 
        description: data.description ? String(data.description) : undefined, 
        icon_url: icon_url || undefined
      };

      if (category) {
        updateCategory.mutate(formData);
      } else {
        createCategory.mutate(formData);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: String(error.message), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Kategori</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Masukkan nama kategori"
        />
        {errors.name && (
          <p className="text-sm text-red-500">{String(errors.name.message)}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Masukkan deskripsi kategori (opsional)"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Icon Kategori</Label>
        <div className="flex items-center gap-4">
          {iconPreview ? (
            <div className="relative">
              <img 
                src={iconPreview} 
                alt="Icon preview" 
                className="w-16 h-16 object-cover rounded border"
              />
              <button
                type="button"
                onClick={removeIcon}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
              <Package className="h-6 w-6 text-gray-400" />
            </div>
          )}
          
          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleIconChange}
              className="hidden"
              id="icon-upload"
            />
            <Label htmlFor="icon-upload" className="cursor-pointer">
              <Button type="button" variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Icon
                </span>
              </Button>
            </Label>
            <p className="text-xs text-gray-500 mt-1">
              Format: JPG, PNG (Max: 2MB)
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button 
          type="submit" 
          disabled={uploading || createCategory.isPending || updateCategory.isPending}
        >
          {uploading ? 'Mengupload...' : category ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
};

export default CategoryForm;
