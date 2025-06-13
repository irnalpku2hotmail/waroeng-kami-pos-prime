import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Store, Receipt, Palette, Upload, Trash2 } from 'lucide-react';
import Layout from '@/components/Layout';

const Settings = () => {
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*');
      if (error) throw error;
      
      // Convert array to object for easier access
      const settingsObj: any = {};
      data.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      return settingsObj;
    }
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('settings')
        .upsert({ key, value }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({ title: 'Berhasil', description: 'Pengaturan berhasil disimpan' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const { data: banners } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from('banners')
        .list('', { limit: 50, sortBy: { column: 'created_at', order: 'desc' } });
      if (error) throw error;
      
      return data.map(file => ({
        ...file,
        url: supabase.storage.from('banners').getPublicUrl(file.name).data.publicUrl
      }));
    }
  });

  const uploadBanner = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      return fileName;
    },
    onSuccess: () => {
      setBannerFile(null);
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast({ title: 'Berhasil', description: 'Banner berhasil diupload' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteBanner = useMutation({
    mutationFn: async (fileName: string) => {
      const { error } = await supabase.storage
        .from('banners')
        .remove([fileName]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast({ title: 'Berhasil', description: 'Banner berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleStoreSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const storeSettings = {
      store_name: formData.get('store_name') as string,
      store_address: formData.get('store_address') as string,
      store_phone: formData.get('store_phone') as string,
      store_email: formData.get('store_email') as string,
    };

    updateSetting.mutate({ key: 'store_info', value: storeSettings });
  };

  const handleReceiptSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const receiptSettings = {
      receipt_header: formData.get('receipt_header') as string,
      receipt_footer: formData.get('receipt_footer') as string,
      show_logo: formData.get('show_logo') === 'on',
      show_store_info: formData.get('show_store_info') === 'on',
    };

    updateSetting.mutate({ key: 'receipt_settings', value: receiptSettings });
  };

  const handleBannerUpload = () => {
    if (bannerFile) {
      uploadBanner.mutate(bannerFile);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-blue-800">Pengaturan</h1>
        </div>

        <Tabs defaultValue="store" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Toko
            </TabsTrigger>
            <TabsTrigger value="receipt" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Struk
            </TabsTrigger>
            <TabsTrigger value="frontend" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Frontend
            </TabsTrigger>
          </TabsList>

          <TabsContent value="store">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Toko</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStoreSettingsSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="store_name">Nama Toko *</Label>
                    <Input
                      id="store_name"
                      name="store_name"
                      defaultValue={settings?.store_info?.store_name || ''}
                      placeholder="WaroengKami"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="store_address">Alamat Toko</Label>
                    <Textarea
                      id="store_address"
                      name="store_address"
                      defaultValue={settings?.store_info?.store_address || ''}
                      placeholder="Jl. Raya No. 123, Jakarta"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="store_phone">Telepon Toko</Label>
                      <Input
                        id="store_phone"
                        name="store_phone"
                        defaultValue={settings?.store_info?.store_phone || ''}
                        placeholder="021-1234567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="store_email">Email Toko</Label>
                      <Input
                        id="store_email"
                        name="store_email"
                        type="email"
                        defaultValue={settings?.store_info?.store_email || ''}
                        placeholder="info@waroengkami.com"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={updateSetting.isPending}>
                    {updateSetting.isPending ? 'Menyimpan...' : 'Simpan Pengaturan Toko'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipt">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Struk</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleReceiptSettingsSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="receipt_header">Header Struk</Label>
                    <Textarea
                      id="receipt_header"
                      name="receipt_header"
                      defaultValue={settings?.receipt_settings?.receipt_header || ''}
                      placeholder="Terima kasih telah berbelanja di WaroengKami"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="receipt_footer">Footer Struk</Label>
                    <Textarea
                      id="receipt_footer"
                      name="receipt_footer"
                      defaultValue={settings?.receipt_settings?.receipt_footer || ''}
                      placeholder="Barang yang sudah dibeli tidak dapat dikembalikan"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="show_logo"
                        name="show_logo"
                        defaultChecked={settings?.receipt_settings?.show_logo || false}
                        className="rounded"
                      />
                      <Label htmlFor="show_logo">Tampilkan logo di struk</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="show_store_info"
                        name="show_store_info"
                        defaultChecked={settings?.receipt_settings?.show_store_info || true}
                        className="rounded"
                      />
                      <Label htmlFor="show_store_info">Tampilkan informasi toko di struk</Label>
                    </div>
                  </div>
                  <Button type="submit" disabled={updateSetting.isPending}>
                    {updateSetting.isPending ? 'Menyimpan...' : 'Simpan Pengaturan Struk'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="frontend">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Frontend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Banner Management</Label>
                  <p className="text-sm text-gray-600 mb-4">Upload dan kelola banner untuk halaman utama aplikasi</p>
                  
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <Button 
                        onClick={handleBannerUpload}
                        disabled={!bannerFile || uploadBanner.isPending}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {uploadBanner.isPending ? 'Mengupload...' : 'Upload Banner'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                      {banners?.map((banner) => (
                        <div key={banner.name} className="relative group">
                          <img 
                            src={banner.url} 
                            alt={`Banner ${banner.name}`}
                            className="w-full h-32 object-cover rounded-lg border shadow-sm"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deleteBanner.mutate(banner.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 truncate">{banner.name}</p>
                        </div>
                      ))}
                    </div>

                    {banners?.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <Palette className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">Belum ada banner yang diupload</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
