
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Image, Upload, Settings } from 'lucide-react';

interface FrontendSettings {
  header: string;
  footer: string;
  layout: string;
  banner_url: string;
  logo_url: string;
}

const initialSettings: FrontendSettings = {
  header: '',
  footer: '',
  layout: '',
  banner_url: '',
  logo_url: ''
};

const bucketName = 'frontend-assets';

const FrontendSettings = () => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Get current settings from Supabase
  const { data: settings, isLoading } = useQuery({
    queryKey: ['frontend-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'frontend_settings')
        .maybeSingle();
      if (error) throw error;
      return (data?.value as FrontendSettings) || initialSettings;
    }
  });

  // Save all settings mutation
  const updateSettings = useMutation({
    mutationFn: async (settingsData: FrontendSettings) => {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'frontend_settings',
          value: settingsData as any,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frontend-settings'] });
      toast({ title: 'Berhasil', description: 'Pengaturan frontend berhasil disimpan!' });
    },
    onError: (err: any) => {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    }
  });

  // Upload utility mutation (for logo/banner)
  const uploadAsset = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: 'logo' | 'banner' }) => {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filename = `${type}_${Date.now()}.${fileExt}`;
      // Remove old asset if exists
      const url = type === 'logo' ? settings?.logo_url : settings?.banner_url;
      if (url) {
        const previous = url.split('/').pop();
        if (previous) {
          await supabase.storage.from(bucketName).remove([previous]);
        }
      }
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: true
        });
      if (error) throw error;
      // get public URL
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filename);
      return { url: data.publicUrl, type };
    },
    onSuccess: ({ url, type }) => {
      const newSettings: FrontendSettings = {
        ...(settings || initialSettings),
        ...(type === 'logo' ? { logo_url: url } : { banner_url: url }),
      };
      updateSettings.mutate(newSettings);
      if (type === 'logo') {
        setLogoFile(null);
        setLogoPreview(null);
        toast({ title: 'Logo berhasil diupload!', description: 'Logo sudah diupdate.' });
      } else {
        setBannerFile(null);
        setBannerPreview(null);
        toast({ title: 'Banner berhasil diupload!', description: 'Banner sudah diupdate.' });
      }
    },
    onError: (err: any) => {
      toast({ title: 'Gagal upload', description: err.message, variant: 'destructive' });
    }
  });

  // File change handler util
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Ukuran file terlalu besar', description: 'Maksimal 5MB', variant: 'destructive' });
      return;
    }
    // allow only image
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      toast({ title: 'Format tidak didukung', description: 'File harus gambar', variant: 'destructive' });
      return;
    }
    // preview
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (type === 'logo') setLogoPreview(evt.target?.result as string);
      else setBannerPreview(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
    if (type === 'logo') setLogoFile(file);
    else setBannerFile(file);
  };

  // Submit settings (except file asset)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const newSettings: FrontendSettings = {
      header: fd.get('header')?.toString() || '',
      footer: fd.get('footer')?.toString() || '',
      layout: fd.get('layout')?.toString() || '',
      logo_url: settings?.logo_url || '',
      banner_url: settings?.banner_url || ''
    };
    updateSettings.mutate(newSettings);

    // If any files uploaded, upload after save settings
    if (logoFile) uploadAsset.mutate({ file: logoFile, type: 'logo' });
    if (bannerFile) uploadAsset.mutate({ file: bannerFile, type: 'banner' });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Settings className="inline mr-2" />FrontEnd Settings
          </CardTitle>
        </CardHeader>
        <CardContent><div className="py-8 text-center">Memuat...</div></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Settings className="inline mr-2" />
          Pengaturan Frontend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="border border-dashed rounded-md p-3 flex flex-col md:flex-row gap-5">
              <div className="w-32 h-32 relative flex items-center justify-center">
                {(logoPreview || settings?.logo_url) ? (
                  <img src={logoPreview || settings?.logo_url} alt="Logo" className="object-contain h-full w-full" />
                ) : (
                  <div className="bg-gray-100 border rounded w-full h-full flex justify-center items-center text-sm text-gray-400">
                    <Image className="w-8 h-8" /> Preview Logo
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center">
                <Input id="logo"
                  type="file"
                  accept="image/*"
                  onChange={e => handleFileChange(e, 'logo')}
                />
                <span className="text-xs text-gray-500">(PNG/JPG/JPEG/GIF/WebP/SVG, max 5MB)</span>
                {logoFile && (
                  <Button type="button" variant="secondary" size="sm"
                    className="mt-2"
                    onClick={() => uploadAsset.mutate({ file: logoFile, type: 'logo' })}>
                    <Upload className="mr-1 h-4 w-4" /> Upload Sekarang
                  </Button>
                )}
              </div>
            </div>
          </div>
          {/* Banner/Slider */}
          <div className="space-y-2">
            <Label>Banner/Slider</Label>
            <div className="border border-dashed rounded-md p-3 flex flex-col md:flex-row gap-5">
              <div className="w-full md:w-64 h-36 relative flex items-center justify-center">
                {(bannerPreview || settings?.banner_url) ? (
                  <img src={bannerPreview || settings?.banner_url} alt="Banner" className="object-cover h-full w-full rounded" />
                ) : (
                  <div className="bg-gray-100 border rounded w-full h-full flex justify-center items-center text-sm text-gray-400">
                    <Image className="w-8 h-8" /> Preview Banner
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center">
                <Input id="banner"
                  type="file"
                  accept="image/*"
                  onChange={e => handleFileChange(e, 'banner')}
                />
                <span className="text-xs text-gray-500">(PNG/JPG/JPEG/GIF/WebP, max 5MB)</span>
                {bannerFile && (
                  <Button type="button" variant="secondary" size="sm"
                          className="mt-2"
                          onClick={() => uploadAsset.mutate({ file: bannerFile, type: 'banner' })}>
                    <Upload className="mr-1 h-4 w-4" /> Upload Sekarang
                  </Button>
                )}
              </div>
            </div>
          </div>
          {/* Header/Footer/Layout */}
          <div className="space-y-2">
            <Label htmlFor="header">Header</Label>
            <Input id="header" name="header" defaultValue={settings?.header || ''} placeholder="Teks header atau html" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="footer">Footer</Label>
            <Input id="footer" name="footer" defaultValue={settings?.footer || ''} placeholder="Teks footer atau html" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="layout">Layout</Label>
            <Input id="layout" name="layout" defaultValue={settings?.layout || ''} placeholder="Contoh: simple, boxed, wide" />
          </div>
          <Button type="submit" className="w-full" disabled={updateSettings.isPending || uploadAsset.isPending}>
            {updateSettings.isPending || uploadAsset.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FrontendSettings;
