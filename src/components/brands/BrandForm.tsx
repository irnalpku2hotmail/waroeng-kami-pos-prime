import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Upload, X, Tag } from 'lucide-react';

const brandSchema = z.object({
  name: z.string().min(1, 'Nama brand wajib diisi'),
  website_url: z.string().optional(),
});

type BrandFormData = z.infer<typeof brandSchema>;

interface BrandFormProps {
  brand?: any;
  onSuccess: () => void;
  onClose: () => void;
}

const BrandForm = ({ brand, onSuccess, onClose }: BrandFormProps) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(brand?.logo_url || '');
  const [uploading, setUploading] = useState(false);
  const [isActive, setIsActive] = useState<boolean>(brand?.is_active ?? true);
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: brand?.name || '',
      website_url: brand?.website_url || '',
    }
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(String(ev.target?.result || ''));
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
  };

  const uploadLogo = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `brand_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('website-assets')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('website-assets')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const createBrand = useMutation({
    mutationFn: async (data: { name: string; website_url?: string; logo_url?: string; is_active: boolean }) => {
      const { error } = await supabase.from('product_brands').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({ title: 'Berhasil', description: 'Brand berhasil ditambahkan' });
      onSuccess();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateBrand = useMutation({
    mutationFn: async (data: { name: string; website_url?: string; logo_url?: string; is_active: boolean }) => {
      const { error } = await supabase.from('product_brands').update(data).eq('id', brand.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({ title: 'Berhasil', description: 'Brand berhasil diperbarui' });
      onSuccess();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const onSubmit = async (data: BrandFormData) => {
    try {
      setUploading(true);
      let logo_url = logoPreview;

      if (logoFile) {
        logo_url = await uploadLogo(logoFile);
      }

      const formData = {
        name: data.name,
        website_url: data.website_url || null,
        logo_url: logo_url || null,
        is_active: isActive,
      };

      if (brand) {
        updateBrand.mutate(formData);
      } else {
        createBrand.mutate(formData);
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
        <Label htmlFor="brand-name">Nama Brand</Label>
        <Input id="brand-name" {...register('name')} placeholder="Masukkan nama brand" />
        {errors.name && <p className="text-sm text-destructive">{String(errors.name.message)}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="website_url">Website (opsional)</Label>
        <Input id="website_url" {...register('website_url')} placeholder="https://example.com" />
      </div>

      <div className="space-y-2">
        <Label>Logo Brand</Label>
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <div className="relative">
              <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-cover rounded border" />
              <button type="button" onClick={removeLogo} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
              <Tag className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <Input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" id="logo-upload" />
            <Label htmlFor="logo-upload" className="cursor-pointer">
              <Button type="button" variant="outline" asChild>
                <span><Upload className="h-4 w-4 mr-2" />Upload Logo</span>
              </Button>
            </Label>
            <p className="text-xs text-muted-foreground mt-1">Format: JPG, PNG (Max: 2MB)</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="is-active">Status Aktif</Label>
        <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
        <Button type="submit" disabled={uploading || createBrand.isPending || updateBrand.isPending}>
          {uploading ? 'Mengupload...' : brand ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
};

export default BrandForm;
