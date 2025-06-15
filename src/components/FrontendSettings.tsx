import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Image, Upload, Settings, XCircle } from 'lucide-react';

interface FrontendSettings {
  header: string;
  footer: string;
  banner_urls: string[];
  logo_url: string;
}

const initialSettings: FrontendSettings = {
  header: '',
  footer: '',
  banner_urls: [],
  logo_url: ''
};

const bucketName = 'frontend-assets';

// Type guard untuk data settings
function isFrontendSettings(val: any): val is FrontendSettings {
  return val &&
    typeof val === 'object' &&
    typeof val.header === 'string' &&
    typeof val.footer === 'string' &&
    Array.isArray(val.banner_urls) &&
    typeof val.logo_url === 'string';
}

// Update favicon di index.html
function updateFavicon(url: string) {
  let linkTag = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
  if (!linkTag) {
    linkTag = document.createElement('link');
    linkTag.rel = 'icon';
    document.head.appendChild(linkTag);
  }
  linkTag.type = 'image/png';
  linkTag.href = url;
}

const FrontendSettings = () => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreviews, setBannerPreviews] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['frontend-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'frontend_settings')
        .maybeSingle();
      if (error) throw error;
      return isFrontendSettings(data?.value) ? data.value : initialSettings;
    }
  });

  // Save/update settings mutation
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

  // Upload logo (update settings, update favicon)
  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filename = `logo_${Date.now()}.${fileExt}`;
      if (settings?.logo_url) {
        // Remove old logo
        const prev = settings.logo_url.split('/').pop();
        if (prev) await supabase.storage.from(bucketName).remove([prev]);
      }
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filename, file, { cacheControl: '3600', upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filename);
      return data.publicUrl;
    },
    onSuccess: (logoUrl) => {
      updateSettings.mutate({
        ...(settings || initialSettings),
        logo_url: logoUrl
      });
      setLogoFile(null);
      setLogoPreview(null);
      updateFavicon(logoUrl);
      toast({ title: 'Logo & Favicon berhasil diupload!', description: 'Logo sudah diupdate.' });
    },
    onError: (err: any) => {
      toast({ title: 'Gagal upload logo', description: err.message, variant: 'destructive' });
    }
  });

  // Upload banner (array)
  const uploadBanner = useMutation({
    mutationFn: async (files: File[]) => {
      const urls: string[] = [];
      for (const file of files) {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
        const filename = `banner_${Date.now()}_${Math.floor(Math.random()*1000)}.${fileExt}`;
        const { error } = await supabase.storage.from(bucketName).upload(filename, file, { cacheControl: '3600', upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from(bucketName).getPublicUrl(filename);
        urls.push(data.publicUrl);
      }
      return urls;
    },
    onSuccess: (bannerUrls) => {
      const mergedUrls = [...(settings?.banner_urls || []), ...bannerUrls];
      updateSettings.mutate({
        ...(settings || initialSettings),
        banner_urls: mergedUrls
      });
      setBannerFiles([]);
      setBannerPreviews([]);
      toast({ title: 'Banner berhasil diupload!', description: 'Banner/slider sudah diupdate.' });
    },
    onError: (err: any) => {
      toast({ title: 'Gagal upload banner', description: err.message, variant: 'destructive' });
    }
  });

  // Hapus satu banner
  const handleDeleteBanner = async (url: string) => {
    const filename = url.split('/').pop();
    if (filename) await supabase.storage.from(bucketName).remove([filename]);
    // Remove from setting
    const filtered = (settings?.banner_urls || []).filter(u => u !== url);
    updateSettings.mutate({
      ...(settings || initialSettings),
      banner_urls: filtered
    });
    toast({ title: 'Banner dihapus', description: 'Banner berhasil dihapus.' });
  };

  // Handle file change
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner'
  ) => {
    if (type === 'logo') {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Ukuran file terlalu besar', description: 'Maksimal 5MB', variant: 'destructive' });
        return;
      }
      const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowed.includes(file.type)) {
        toast({ title: 'Format tidak didukung', description: 'File harus gambar', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => setLogoPreview(evt.target?.result as string);
      reader.readAsDataURL(file);
      setLogoFile(file);
    } else {
      const files = Array.from(e.target.files || []);
      const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      const oversize = files.some(f => f.size > 5 * 1024 * 1024);
      const anyInvalid = files.some(f => !allowed.includes(f.type));
      if (oversize) {
        toast({ title: 'Ukuran file terlalu besar', description: 'Maksimal 5MB', variant: 'destructive' });
        return;
      }
      if (anyInvalid) {
        toast({ title: 'Format tidak didukung', description: 'File harus gambar', variant: 'destructive' });
        return;
      }
      setBannerFiles(files);
      // preview
      Promise.all(files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve(evt.target?.result as string);
          reader.readAsDataURL(file);
        });
      })).then(setBannerPreviews);
    }
  };

  // Submit header/footer saja
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const newSettings: FrontendSettings = {
      header: fd.get('header')?.toString() || '',
      footer: fd.get('footer')?.toString() || '',
      banner_urls: settings?.banner_urls || [],
      logo_url: settings?.logo_url || ''
    };
    updateSettings.mutate(newSettings);

    // Upload file jika ada
    if (logoFile) uploadLogo.mutate(logoFile);
    if (bannerFiles.length > 0) uploadBanner.mutate(bannerFiles);
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
          {/* Logo/Favicon */}
          <div className="space-y-2">
            <Label>Logo (Favicon)</Label>
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
                    onClick={() => uploadLogo.mutate(logoFile)}>
                    <Upload className="mr-1 h-4 w-4" /> Upload Logo & Favicon
                  </Button>
                )}
              </div>
            </div>
          </div>
          {/* Banner/Slider (multiple) */}
          <div className="space-y-2">
            <Label>Banner/Slider</Label>
            <div className="border border-dashed rounded-md p-3 flex flex-col md:flex-row gap-5">
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-2">
                {/* existing banners */}
                {(settings?.banner_urls || []).map((url, idx) => (
                  <div key={url} className="relative group border rounded overflow-hidden h-24 flex justify-center items-center bg-gray-50">
                    <img src={url} alt={`Banner ${idx + 1}`} className="object-cover h-full w-full" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 rounded-full bg-white p-0.5 shadow group-hover:opacity-100 opacity-0 transition"
                      onClick={() => handleDeleteBanner(url)}
                      title="Hapus Banner"
                    >
                      <XCircle className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                ))}
                {/* preview baru */}
                {bannerPreviews.map((src, idx) => (
                  <div key={`preview-${idx}`} className="relative border rounded overflow-hidden h-24 flex justify-center items-center bg-gray-50">
                    <img src={src} alt={`Preview Banner ${idx + 1}`} className="object-cover h-full w-full opacity-50" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col justify-center min-w-[160px]">
                <Input id="banner"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => handleFileChange(e, 'banner')}
                />
                <span className="text-xs text-gray-500">(PNG/JPG/JPEG/GIF/WebP/SVG, max 5MB, multiple)</span>
                {bannerFiles.length > 0 && (
                  <Button type="button" variant="secondary" size="sm"
                    className="mt-2"
                    onClick={() => uploadBanner.mutate(bannerFiles)}>
                    <Upload className="mr-1 h-4 w-4" /> Upload Semua Banner
                  </Button>
                )}
              </div>
            </div>
          </div>
          {/* Header/Footer */}
          <div className="space-y-2">
            <Label htmlFor="header">Header</Label>
            <Input id="header" name="header" defaultValue={settings?.header || ''} placeholder="Teks header atau html" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="footer">Footer</Label>
            <Input id="footer" name="footer" defaultValue={settings?.footer || ''} placeholder="Teks footer atau html" />
          </div>
          <Button type="submit" className="w-full" disabled={updateSettings.isPending || uploadLogo.isPending || uploadBanner.isPending}>
            {updateSettings.isPending || uploadLogo.isPending || uploadBanner.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FrontendSettings;
