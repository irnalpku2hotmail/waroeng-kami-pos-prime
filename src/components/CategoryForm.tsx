
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
  const [iconPreview, setIconPreview] = useState<string>(category?.icon_url || '');
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
    }
  });

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setIconPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeIcon = () => {
    setIconFile(null);
    setIconPreview('');
  };

  const uploadIcon = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('category-icons')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('category-icons')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const createCategory = useMutation({
    mutationFn: async (data: { name: string; description?: string; icon_url?: string }) => {
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
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateCategory = useMutation({
    mutationFn: async (data: { name: string; description?: string; icon_url?: string }) => {
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
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setUploading(true);
      let icon_url = iconPreview;

      if (iconFile) {
        icon_url = await uploadIcon(iconFile);
      }

      const formData = { 
        name: data.name, 
        description: data.description || undefined, 
        icon_url 
      };

      if (category) {
        updateCategory.mutate(formData);
      } else {
        createCategory.mutate(formData);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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
          <p className="text-sm text-red-500">{errors.name.message}</p>
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
