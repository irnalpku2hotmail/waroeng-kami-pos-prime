
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Settings, Upload, Image } from 'lucide-react';

interface FrontendSettings {
  banner_url: string;
  welcome_message: string;
  featured_categories_limit: number;
}

const FrontendSettings = () => {
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch frontend settings
  const { data: settings } = useQuery({
    queryKey: ['frontend-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'frontend_settings')
        .single();
      if (error) {
        return {
          banner_url: '',
          welcome_message: 'Selamat datang di toko kami',
          featured_categories_limit: 5
        } as FrontendSettings;
      }
      return data.value as unknown as FrontendSettings;
    }
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (settingsData: FrontendSettings) => {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'frontend_settings',
          value: settingsData as any,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frontend-settings'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: 'Berhasil',
        description: 'Pengaturan frontend berhasil disimpan'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Upload banner mutation
  const uploadBanner = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `banner_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('frontend-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('frontend-assets')
        .getPublicUrl(fileName);

      return data.publicUrl;
    },
    onSuccess: (bannerUrl) => {
      const newSettings: FrontendSettings = {
        ...settings || { banner_url: '', welcome_message: 'Selamat datang di toko kami', featured_categories_limit: 5 },
        banner_url: bannerUrl
      };
      updateSettings.mutate(newSettings);
      setBannerFile(null);
      setBannerPreview(null);
      toast({
        title: 'Berhasil',
        description: 'Banner berhasil diupload'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Upload',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Ukuran file terlalu besar. Maksimal 5MB',
          variant: 'destructive'
        });
        return;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Error',
          description: 'Format file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP',
          variant: 'destructive'
        });
        return;
      }

      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newSettings: FrontendSettings = {
      ...settings || { banner_url: '', welcome_message: 'Selamat datang di toko kami', featured_categories_limit: 5 },
      welcome_message: formData.get('welcome_message') as string,
      featured_categories_limit: parseInt(formData.get('featured_categories_limit') as string) || 5
    };

    if (bannerFile) {
      uploadBanner.mutate(bannerFile);
    } else {
      updateSettings.mutate(newSettings);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Pengaturan Frontend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Banner Upload */}
          <div className="space-y-2">
            <Label>Banner Utama</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {(bannerPreview || settings?.banner_url) && (
                <div className="mb-4">
                  <img 
                    src={bannerPreview || settings?.banner_url} 
                    alt="Banner Preview" 
                    className="w-full h-48 object-cover rounded"
                  />
                </div>
              )}
              <div className="text-center">
                <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <Label htmlFor="banner" className="cursor-pointer">
                  <Button type="button" variant="outline" className="mb-2">
                    <Upload className="h-4 w-4 mr-2" />
                    {settings?.banner_url ? 'Ganti Banner' : 'Upload Banner'}
                  </Button>
                </Label>
                <Input
                  id="banner"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleBannerChange}
                  className="hidden"
                />
                <p className="text-sm text-gray-500">
                  Upload gambar banner untuk halaman utama (maksimal 5MB, format: JPEG, PNG, GIF, WebP)
                </p>
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="space-y-2">
            <Label htmlFor="welcome_message">Pesan Selamat Datang</Label>
            <Input
              id="welcome_message"
              name="welcome_message"
              defaultValue={settings?.welcome_message || ''}
              placeholder="Selamat datang di toko kami"
            />
          </div>

          {/* Featured Categories Limit */}
          <div className="space-y-2">
            <Label htmlFor="featured_categories_limit">Jumlah Kategori Unggulan</Label>
            <Input
              id="featured_categories_limit"
              name="featured_categories_limit"
              type="number"
              min="3"
              max="10"
              defaultValue={settings?.featured_categories_limit || 5}
              placeholder="5"
            />
            <p className="text-sm text-gray-500">
              Jumlah kategori yang ditampilkan di halaman utama sebelum tombol "Lihat Semua"
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={updateSettings.isPending || uploadBanner.isPending}
            className="w-full"
          >
            {updateSettings.isPending || uploadBanner.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FrontendSettings;
