
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Image, Upload, Settings, Trash } from 'lucide-react';

interface FrontendSettings {
  header: string;
  banner_urls: string[];
  logo_url?: string;
}

const initialSettings: FrontendSettings = {
  header: '',
  banner_urls: [],
  logo_url: '',
};

const bucketName = 'frontend-assets';

// Better type guard
function isFrontendSettings(val: unknown): val is FrontendSettings {
  return (
    !!val &&
    typeof val === 'object' &&
    !Array.isArray(val) &&
    'header' in val &&
    'banner_urls' in val &&
    Array.isArray((val as any).banner_urls)
  );
}

const FrontendSettings = () => {
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);
  const [bannerPreviews, setBannerPreviews] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Query for current settings (expecting banner_urls array)
  const { data: settings, isLoading } = useQuery({
    queryKey: ['frontend-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'frontend_settings')
        .maybeSingle();
      if (error) throw error;

      // Handle empty/null/malformed values
      const value = data?.value;
      if (isFrontendSettings(value)) return value;

      // fallback migration from older shapes
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const bannerUrl = (value as any).banner_url;
        return {
          header: (value as any).header || '',
          // if old data: string banner_url
          banner_urls: bannerUrl ? [bannerUrl] : [],
          logo_url: (value as any).logo_url || '',
        };
      }

      // fall back to empty settings if missing or wrong type
      return initialSettings;
    },
  });

  // Save updated settings
  const updateSettings = useMutation({
    mutationFn: async (settingsData: FrontendSettings) => {
      const { error } = await supabase
        .from('settings')
        .upsert(
          {
            key: 'frontend_settings',
            value: settingsData as any,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frontend-settings'] });
      toast({
        title: 'Berhasil',
        description: 'Pengaturan frontend berhasil disimpan!',
      });
      setBannerFiles([]);
      setBannerPreviews([]);
      setLogoFile(null);
      setLogoPreview(null);
    },
    onError: (err: any) => {
      toast({
        title: 'Gagal',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  // Upload banner/banners
  const uploadBannerFiles = useMutation({
    mutationFn: async (files: File[]) => {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
        const filename = `banner_${Date.now()}_${i}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filename, file, {
            cacheControl: '3600',
            upsert: true,
          });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from(bucketName).getPublicUrl(filename);
        uploadedUrls.push(data.publicUrl);
      }
      return uploadedUrls;
    },
    onSuccess: (newUrls: string[]) => {
      const newSettings: FrontendSettings = {
        header: settings?.header || '',
        banner_urls: [
          ...(settings?.banner_urls ?? []),
          ...newUrls,
        ],
        logo_url: settings?.logo_url || '',
      };
      updateSettings.mutate(newSettings);
      toast({
        title: 'Banner berhasil diupload!',
        description: `${newUrls.length} banner ditambahkan.`,
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Gagal upload',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  // Logic upload logo
  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filename = `logo_${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: true,
        });
      if (error) throw error;
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filename);

      // update favicon on index.html
      const link = document.querySelector("link[rel~='icon']");
      if (link) {
        link.setAttribute('href', data.publicUrl);
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = data.publicUrl;
        document.head.appendChild(newLink);
      }
      return data.publicUrl;
    },
    onSuccess: (logoUrl: string) => {
      const newSettings: FrontendSettings = {
        ...(settings ?? initialSettings),
        logo_url: logoUrl,
        banner_urls: settings?.banner_urls ?? [],
        header: settings?.header ?? '',
      };
      updateSettings.mutate(newSettings);
      setLogoFile(null);
      setLogoPreview(null);

      toast({
        title: 'Logo berhasil diupload!',
        description: 'Logo/favIcon sudah diupdate.',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Gagal upload',
        description: err.message || "Gagal upload logo",
        variant: 'destructive',
      });
    },
  });

  // File handler banners (multi-image)
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];
    for (let f of files) {
      if (f.size > 5 * 1024 * 1024) {
        toast({
          title: 'Ukuran file terlalu besar',
          description: 'Maksimal 5MB',
          variant: 'destructive',
        });
        return;
      }
      if (!allowed.includes(f.type)) {
        toast({
          title: 'Format tidak didukung',
          description: 'File harus gambar',
          variant: 'destructive',
        });
        return;
      }
    }
    setBannerFiles(files);
    const fileReaders = files.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve(evt.target?.result as string);
          reader.readAsDataURL(file);
        })
    );
    Promise.all(fileReaders).then((previews) => setBannerPreviews(previews));
  };

  // File handler for logo only
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Ukuran file terlalu besar',
        description: 'Maksimal 5MB',
        variant: 'destructive',
      });
      return;
    }
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];
    if (!allowed.includes(file.type)) {
      toast({
        title: 'Format tidak didukung',
        description: 'File harus gambar',
        variant: 'destructive',
      });
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setLogoPreview(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove banner (from settings)
  const handleRemoveBanner = (idx: number) => {
    if (!settings?.banner_urls) return;
    const newBanners = [...settings.banner_urls];
    newBanners.splice(idx, 1);
    const newSettings: FrontendSettings = {
      ...(settings as FrontendSettings),
      banner_urls: newBanners,
      header: settings.header ?? "",
      logo_url: settings.logo_url ?? "",
    };
    updateSettings.mutate(newSettings);
  };

  // Save settings (header, banners, logo)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const newSettings: FrontendSettings = {
      header: fd.get('header')?.toString() || '',
      banner_urls: settings?.banner_urls ?? [],
      logo_url: settings?.logo_url || '',
    };
    updateSettings.mutate(newSettings);

    // upload files if ada (logo or new banners)
    if (logoFile) uploadLogo.mutate(logoFile);
    if (bannerFiles.length > 0) uploadBannerFiles.mutate(bannerFiles);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Settings className="inline mr-2" />
            Pengaturan Frontend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">Memuat...</div>
        </CardContent>
      </Card>
    );
  }

  // Make sure to only access properties if settings is FrontendSettings
  const safeSettings = isFrontendSettings(settings) ? settings : initialSettings;

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
          {/* Logo Section */}
          <div className="space-y-2">
            <Label>Logo & Favicon</Label>
            <div className="border border-dashed rounded-md p-3 flex flex-col md:flex-row gap-5">
              <div className="w-32 h-32 relative flex items-center justify-center">
                {logoPreview || safeSettings.logo_url ? (
                  <img
                    src={logoPreview || safeSettings.logo_url}
                    alt="Logo"
                    className="object-contain h-full w-full"
                  />
                ) : (
                  <div className="bg-gray-100 border rounded w-full h-full flex justify-center items-center text-sm text-gray-400">
                    <Image className="w-8 h-8" /> Preview Logo
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
                <span className="text-xs text-gray-500">
                  (PNG/JPG/JPEG/GIF/WebP/SVG, max 5MB)
                </span>
                {logoFile && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    onClick={() => uploadLogo.mutate(logoFile)}
                  >
                    <Upload className="mr-1 h-4 w-4" /> Upload Logo
                  </Button>
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Logo juga otomatis menjadi favicon pada halaman frontend.
            </div>
          </div>

          {/* Banner / Carousel Section */}
          <div className="space-y-2">
            <Label>Banners/Slider (bisa lebih dari satu gambar)</Label>
            <div className="border border-dashed rounded-md p-3">
              <div className="flex flex-wrap gap-4 mb-4">
                {safeSettings.banner_urls.length > 0 ? safeSettings.banner_urls.map((url, idx) => (
                  <div className="relative w-40 h-24" key={url + idx}>
                    <img
                      src={url}
                      alt={`Banner-${idx}`}
                      className="object-cover w-full h-full rounded"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1"
                      onClick={() => handleRemoveBanner(idx)}
                      title="Hapus banner"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                )) : (
                  <div className="bg-gray-100 border rounded w-40 h-24 flex justify-center items-center text-sm text-gray-400">
                    <Image className="w-8 h-8" /> Tidak ada Banner
                  </div>
                )}
              </div>
              {bannerPreviews.length > 0 && (
                <div className="flex flex-wrap gap-4 mb-4 border-t pt-2">
                  {bannerPreviews.map((p, idx) => (
                    <div className="w-40 h-24 relative" key={idx}>
                      <img
                        src={p}
                        alt={`Preview-Banner-${idx}`}
                        className="object-cover w-full h-full rounded border"
                      />
                    </div>
                  ))}
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="mt-1"
                      variant="secondary"
                      onClick={() => uploadBannerFiles.mutate(bannerFiles)}
                      disabled={uploadBannerFiles.isPending}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      {uploadBannerFiles.isPending ? 'Mengupload...' : 'Upload Semua'}
                    </Button>
                  </div>
                </div>
              )}
              <Input
                id="banners"
                type="file"
                accept="image/*"
                multiple
                onChange={handleBannerChange}
              />
              <span className="text-xs text-gray-500">
                Upload satu kali untuk banyak gambar (PNG/JPG/JPEG/GIF/WebP/SVG, max 5MB/gambar)
              </span>
            </div>
          </div>

          {/* Header only */}
          <div className="space-y-2">
            <Label htmlFor="header">Header</Label>
            <Input
              id="header"
              name="header"
              defaultValue={safeSettings.header}
              placeholder="Teks header atau html"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={
              updateSettings.isPending ||
              uploadBannerFiles.isPending ||
              uploadLogo.isPending
            }
          >
            {updateSettings.isPending ||
            uploadBannerFiles.isPending ||
            uploadLogo.isPending
              ? 'Menyimpan...'
              : 'Simpan Pengaturan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FrontendSettings;
