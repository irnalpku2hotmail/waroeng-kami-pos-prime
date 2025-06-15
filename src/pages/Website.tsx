
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Globe, Upload, Image, Trash2, Plus } from 'lucide-react';
import Layout from '@/components/Layout';

interface WebsiteSettings {
  id: string;
  navbar_color: string;
  footer_color: string;
  favicon_url: string | null;
}

interface WebsiteBanner {
  id: string;
  title: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
}

const Website = () => {
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerTitle, setBannerTitle] = useState('');
  const queryClient = useQueryClient();

  // Fetch website settings
  const { data: settings } = useQuery({
    queryKey: ['website-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_settings')
        .select('*')
        .single();
      if (error) throw error;
      return data as WebsiteSettings;
    }
  });

  // Fetch website banners
  const { data: banners } = useQuery({
    queryKey: ['website-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_banners')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as WebsiteBanner[];
    }
  });

  // Update website settings mutation
  const updateSettings = useMutation({
    mutationFn: async (settingsData: Partial<WebsiteSettings>) => {
      if (!settings?.id) {
        throw new Error('Settings ID not found');
      }
      
      const { error } = await supabase
        .from('website_settings')
        .update({
          ...settingsData,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-settings'] });
      toast({ title: 'Berhasil', description: 'Pengaturan website berhasil disimpan' });
    },
    onError: (error: any) => {
      console.error('Update settings error:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Upload favicon mutation
  const uploadFavicon = useMutation({
    mutationFn: async (file: File) => {
      console.log('Starting favicon upload:', file.name);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `favicon_${Date.now()}.${fileExt}`;
      
      // Remove old favicon if exists
      if (settings?.favicon_url) {
        const oldFileName = settings.favicon_url.split('/').pop();
        if (oldFileName && oldFileName.startsWith('favicon_')) {
          console.log('Removing old favicon:', oldFileName);
          await supabase.storage
            .from('website-assets')
            .remove([oldFileName]);
        }
      }
      
      console.log('Uploading new favicon:', fileName);
      const { error: uploadError } = await supabase.storage
        .from('website-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('website-assets')
        .getPublicUrl(fileName);

      console.log('Favicon uploaded successfully:', data.publicUrl);
      return data.publicUrl;
    },
    onSuccess: async (faviconUrl) => {
      console.log('Updating settings with new favicon URL:', faviconUrl);
      await updateSettings.mutateAsync({ favicon_url: faviconUrl });
      
      // Update favicon in HTML head
      const existingLink = document.querySelector("link[rel*='icon']");
      if (existingLink) {
        existingLink.remove();
      }
      
      const link = document.createElement('link');
      link.setAttribute('rel', 'icon');
      link.setAttribute('href', faviconUrl);
      link.setAttribute('type', 'image/png');
      document.head.appendChild(link);

      setFaviconFile(null);
      setFaviconPreview(null);
      
      toast({
        title: 'Berhasil',
        description: 'Favicon berhasil diupload dan diterapkan'
      });
    },
    onError: (error: any) => {
      console.error('Favicon upload error:', error);
      toast({
        title: 'Error Upload',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Upload banner mutation
  const uploadBanner = useMutation({
    mutationFn: async ({ file, title }: { file: File; title: string }) => {
      console.log('Starting banner upload:', file.name, 'with title:', title);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `banner_${Date.now()}.${fileExt}`;
      
      console.log('Uploading banner file:', fileName);
      const { error: uploadError } = await supabase.storage
        .from('website-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Banner upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('website-assets')
        .getPublicUrl(fileName);

      console.log('Banner uploaded to storage, inserting record:', data.publicUrl);
      
      // Insert banner record
      const { error: insertError } = await supabase
        .from('website_banners')
        .insert({
          title,
          image_url: data.publicUrl,
          sort_order: (banners?.length || 0) + 1
        });

      if (insertError) {
        console.error('Banner insert error:', insertError);
        throw insertError;
      }

      console.log('Banner record inserted successfully');
      return data.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-banners'] });
      setBannerFile(null);
      setBannerPreview(null);
      setBannerTitle('');
      toast({
        title: 'Berhasil',
        description: 'Banner berhasil diupload'
      });
    },
    onError: (error: any) => {
      console.error('Banner upload mutation error:', error);
      toast({
        title: 'Error Upload',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete banner mutation
  const deleteBanner = useMutation({
    mutationFn: async (bannerId: string) => {
      console.log('Deleting banner:', bannerId);
      
      const banner = banners?.find(b => b.id === bannerId);
      if (banner) {
        // Delete file from storage
        const fileName = banner.image_url.split('/').pop();
        if (fileName) {
          console.log('Removing banner file from storage:', fileName);
          await supabase.storage
            .from('website-assets')
            .remove([fileName]);
        }
      }

      const { error } = await supabase
        .from('website_banners')
        .delete()
        .eq('id', bannerId);
      if (error) throw error;
      
      console.log('Banner deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-banners'] });
      toast({
        title: 'Berhasil',
        description: 'Banner berhasil dihapus'
      });
    },
    onError: (error: any) => {
      console.error('Delete banner error:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Favicon file selected:', file.name, file.size, file.type);
      
      // Check file size (1MB limit for favicon)
      if (file.size > 1 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Ukuran file terlalu besar. Maksimal 1MB untuk favicon',
          variant: 'destructive'
        });
        return;
      }

      // Check file type
      const allowedTypes = ['image/png', 'image/x-icon', 'image/jpeg', 'image/ico'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Error',
          description: 'Format file tidak didukung. Gunakan PNG, ICO, atau JPEG',
          variant: 'destructive'
        });
        return;
      }

      setFaviconFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFaviconPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Banner file selected:', file.name, file.size, file.type);
      
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

  const handleColorSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const colorData = {
      navbar_color: formData.get('navbar_color') as string,
      footer_color: formData.get('footer_color') as string
    };

    console.log('Submitting color data:', colorData);
    updateSettings.mutate(colorData);
  };

  const handleFaviconSubmit = () => {
    if (faviconFile) {
      console.log('Submitting favicon upload');
      uploadFavicon.mutate(faviconFile);
    } else {
      toast({
        title: 'Error',
        description: 'Pilih file favicon terlebih dahulu',
        variant: 'destructive'
      });
    }
  };

  const handleBannerSubmit = () => {
    if (bannerFile && bannerTitle.trim()) {
      console.log('Submitting banner upload');
      uploadBanner.mutate({ file: bannerFile, title: bannerTitle.trim() });
    } else {
      toast({
        title: 'Error',
        description: 'Pilih file banner dan masukkan judul terlebih dahulu',
        variant: 'destructive'
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Globe className="h-8 w-8 text-blue-800" />
          <h1 className="text-3xl font-bold text-blue-800">Pengaturan Website</h1>
        </div>

        <Tabs defaultValue="colors" className="space-y-4">
          <TabsList>
            <TabsTrigger value="colors">Warna</TabsTrigger>
            <TabsTrigger value="favicon">Favicon</TabsTrigger>
            <TabsTrigger value="banners">Banner</TabsTrigger>
          </TabsList>

          <TabsContent value="colors">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Warna</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleColorSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="navbar_color">Warna Navbar</Label>
                      <Input
                        id="navbar_color"
                        name="navbar_color"
                        type="color"
                        defaultValue={settings?.navbar_color || '#1f2937'}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footer_color">Warna Footer</Label>
                      <Input
                        id="footer_color"
                        name="footer_color"
                        type="color"
                        defaultValue={settings?.footer_color || '#1f2937'}
                        className="h-12"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={updateSettings.isPending}>
                    {updateSettings.isPending ? 'Menyimpan...' : 'Simpan Warna'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favicon">
            <Card>
              <CardHeader>
                <CardTitle>Favicon Website</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {(faviconPreview || settings?.favicon_url) && (
                      <div className="mb-4 flex items-center gap-2">
                        <img 
                          src={faviconPreview || settings?.favicon_url || ''} 
                          alt="Favicon Preview" 
                          className="w-8 h-8 object-cover rounded"
                        />
                        <span className="text-sm text-gray-600">Preview Favicon</span>
                      </div>
                    )}
                    <div className="text-center">
                      <Image className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <Label htmlFor="favicon" className="cursor-pointer">
                        <Button type="button" variant="outline" size="sm" className="mb-2">
                          <Upload className="h-4 w-4 mr-2" />
                          {settings?.favicon_url ? 'Ganti Favicon' : 'Upload Favicon'}
                        </Button>
                      </Label>
                      <Input
                        id="favicon"
                        type="file"
                        accept="image/png,image/x-icon,image/jpeg,.ico"
                        onChange={handleFaviconChange}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-500">
                        Upload favicon untuk website (maksimal 1MB, format: PNG, ICO, JPEG)
                      </p>
                    </div>
                  </div>
                  {faviconFile && (
                    <Button 
                      onClick={handleFaviconSubmit}
                      disabled={uploadFavicon.isPending}
                      className="w-full"
                    >
                      {uploadFavicon.isPending ? 'Mengupload...' : 'Upload Favicon'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banners">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Upload Banner Baru
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="banner_title">Judul Banner</Label>
                      <Input
                        id="banner_title"
                        value={bannerTitle}
                        onChange={(e) => setBannerTitle(e.target.value)}
                        placeholder="Masukkan judul banner"
                      />
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      {bannerPreview && (
                        <div className="mb-4">
                          <img 
                            src={bannerPreview} 
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
                            Upload Banner
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
                          Upload gambar banner (maksimal 5MB, format: JPEG, PNG, GIF, WebP)
                        </p>
                      </div>
                    </div>
                    {bannerFile && bannerTitle.trim() && (
                      <Button 
                        onClick={handleBannerSubmit}
                        disabled={uploadBanner.isPending}
                        className="w-full"
                      >
                        {uploadBanner.isPending ? 'Mengupload...' : 'Upload Banner'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Banner yang Ada</CardTitle>
                </CardHeader>
                <CardContent>
                  {banners && banners.length > 0 ? (
                    <div className="grid gap-4">
                      {banners.map((banner) => (
                        <div key={banner.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <img 
                            src={banner.image_url} 
                            alt={banner.title}
                            className="w-20 h-20 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium">{banner.title}</h3>
                            <p className="text-sm text-gray-500">
                              Status: {banner.is_active ? 'Aktif' : 'Tidak Aktif'}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteBanner.mutate(banner.id)}
                            disabled={deleteBanner.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Belum ada banner yang diupload
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Website;
