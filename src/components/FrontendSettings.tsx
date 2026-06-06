
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { X, Upload, Image, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { optimizeImage, OPTIMIZED_CACHE_CONTROL } from '@/utils/imageOptimization';

const FrontendSettings = () => {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch frontend settings
  const { data: settings } = useQuery({
    queryKey: ['frontend-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['banner_images', 'banner_enabled']);
      
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

  const bannerImages: string[] = Array.isArray(settings?.banner_images) ? settings!.banner_images : [];
  const isBannerEnabled = settings?.banner_enabled !== false;

  const handleToggleBanner = (enabled: boolean) => {
    updateSettings.mutate({ banner_enabled: enabled });
  };

  const extractStoragePath = (url: string): string | null => {
    const marker = '/storage/v1/object/public/frontend-assets/';
    const i = url.indexOf(marker);
    return i >= 0 ? decodeURIComponent(url.slice(i + marker.length)) : null;
  };

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const raw of Array.from(files)) {
        const optimized = await optimizeImage(raw, 'banner');
        const ext = optimized.file.name.split('.').pop() || 'jpg';
        const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage
          .from('frontend-assets')
          .upload(path, optimized.file, {
            contentType: optimized.file.type,
            cacheControl: OPTIMIZED_CACHE_CONTROL,
            upsert: false,
          });
        if (error) throw error;
        const { data: pub } = supabase.storage.from('frontend-assets').getPublicUrl(path);
        uploaded.push(pub.publicUrl);
      }
      updateSettings.mutate({ banner_images: [...bannerImages, ...uploaded] });
    } catch (e: any) {
      toast({ title: 'Upload gagal', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveBanner = async (index: number) => {
    const url = bannerImages[index];
    const updatedImages = bannerImages.filter((_, i) => i !== index);
    updateSettings.mutate({ banner_images: updatedImages });
    const path = extractStoragePath(url);
    if (path) {
      await supabase.storage.from('frontend-assets').remove([path]);
    }
  };

  const moveBanner = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= bannerImages.length) return;
    const next = [...bannerImages];
    [next[index], next[target]] = [next[target], next[index]];
    updateSettings.mutate({ banner_images: next });
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
          {/* Upload New Banner */}
          <div className="space-y-3">
            <Label>Upload Banner Baru</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUploadFiles(e.target.files)}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              type="button"
            >
              {uploading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Mengupload...</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Pilih Gambar</>
              )}
            </Button>
            <p className="text-sm text-gray-600">
              Ukuran disarankan 1200×400px. Format JPG/PNG/WebP. Gambar akan dioptimalkan otomatis dan disimpan di Storage aplikasi.
            </p>
          </div>

          {/* Banner List */}
          <div className="space-y-4">
            <Label>Daftar Banner ({bannerImages.length})</Label>
            {bannerImages.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                <Upload className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Belum ada banner yang ditambahkan</p>
                <p className="text-sm">Upload banner untuk ditampilkan di halaman home</p>
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
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => moveBanner(index, -1)}
                        disabled={index === 0}
                        title="Pindah ke kiri"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => moveBanner(index, 1)}
                        disabled={index === bannerImages.length - 1}
                        title="Pindah ke kanan"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveBanner(index)}
                        title="Hapus"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
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
              <li>• Gambar disimpan di Supabase Storage (bucket: frontend-assets)</li>
              <li>• Urutan banner mengikuti daftar di atas — gunakan panah untuk reorder</li>
              <li>• Banner berganti otomatis dengan efek carousel</li>
              <li>• Hapus banner untuk menghapus file dari Storage</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FrontendSettings;
