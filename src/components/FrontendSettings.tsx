
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, X, Upload, Image } from 'lucide-react';

const FrontendSettings = () => {
  const queryClient = useQueryClient();
  const [newBannerUrl, setNewBannerUrl] = useState('');

  // Fetch frontend settings
  const { data: settings } = useQuery({
    queryKey: ['frontend-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['banner_images', 'banner_enabled', 'hero_title', 'hero_subtitle']);
      
      if (error) throw error;
      
      const settingsObj: Record<string, any> = {};
      data?.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      return settingsObj;
    }
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (settingsData: Record<string, any>) => {
      const promises = Object.entries(settingsData).map(async ([key, value]) => {
        const { error } = await supabase
          .from('settings')
          .upsert({ 
            key, 
            value,
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'key' 
          });
        if (error) throw error;
      });
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frontend-settings'] });
      toast({ title: 'Berhasil', description: 'Pengaturan frontend berhasil disimpan' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const bannerImages = settings?.banner_images || [];
  const isBannerEnabled = settings?.banner_enabled !== false;

  const handleToggleBanner = (enabled: boolean) => {
    updateSettings.mutate({ banner_enabled: enabled });
  };

  const handleAddBanner = () => {
    if (!newBannerUrl.trim()) return;
    
    const updatedImages = [...bannerImages, newBannerUrl.trim()];
    updateSettings.mutate({ banner_images: updatedImages });
    setNewBannerUrl('');
  };

  const handleRemoveBanner = (index: number) => {
    const updatedImages = bannerImages.filter((_: any, i: number) => i !== index);
    updateSettings.mutate({ banner_images: updatedImages });
  };

  const handleHeroSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const heroData = {
      hero_title: formData.get('hero_title') as string,
      hero_subtitle: formData.get('hero_subtitle') as string,
    };

    updateSettings.mutate(heroData);
  };

  return (
    <div className="space-y-6">
      {/* Banner Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Pengaturan Banner
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="banner-enabled" className="text-sm">
                Aktifkan Banner
              </Label>
              <Switch
                id="banner-enabled"
                checked={isBannerEnabled}
                onCheckedChange={handleToggleBanner}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Banner */}
          <div className="space-y-4">
            <Label>Tambah Banner Baru</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Masukkan URL gambar banner..."
                value={newBannerUrl}
                onChange={(e) => setNewBannerUrl(e.target.value)}
              />
              <Button onClick={handleAddBanner} disabled={!newBannerUrl.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Ukuran yang disarankan: 1200x400 piksel. Format: JPG, PNG, WebP
            </p>
          </div>

          {/* Banner List */}
          <div className="space-y-4">
            <Label>Daftar Banner ({bannerImages.length})</Label>
            {bannerImages.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                <Upload className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Belum ada banner yang ditambahkan</p>
                <p className="text-sm">Tambahkan banner untuk ditampilkan di halaman home</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bannerImages.map((imageUrl: string, index: number) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt={`Banner ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveBanner(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Badge className="absolute bottom-2 left-2">
                      Banner {index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Banner Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Informasi Banner</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Banner akan berganti otomatis setiap 7 detik</li>
              <li>• Menggunakan efek coverflow untuk transisi yang menarik</li>
              <li>• Pengguna dapat navigasi manual dengan tombol panah</li>
              <li>• Indicator dots menunjukkan posisi banner aktif</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Hero Section Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Hero Section</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleHeroSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hero_title">Judul Hero</Label>
              <Input
                id="hero_title"
                name="hero_title"
                defaultValue={settings?.hero_title || ''}
                placeholder="Judul utama hero section"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_subtitle">Subtitle Hero</Label>
              <Input
                id="hero_subtitle"
                name="hero_subtitle"
                defaultValue={settings?.hero_subtitle || ''}
                placeholder="Subtitle hero section"
              />
            </div>
            <Button type="submit">
              Simpan Pengaturan Hero
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FrontendSettings;
