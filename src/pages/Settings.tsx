
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Save, Store, Truck } from 'lucide-react';
import Layout from '@/components/Layout';
import CODSettings from '@/components/CODSettings';

const Settings = () => {
  const [storeSettings, setStoreSettings] = useState({
    store_name: '',
    store_phone: '',
    store_email: '',
    store_address: '',
    banner_title: '',
    banner_subtitle: ''
  });

  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*');
      if (error) throw error;
      
      const settingsObj: Record<string, any> = {};
      data?.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      return settingsObj;
    }
  });

  useEffect(() => {
    if (settings) {
      setStoreSettings({
        store_name: settings.store_name?.name || '',
        store_phone: settings.store_phone?.phone || '',
        store_email: settings.store_email?.email || '',
        store_address: settings.store_address?.address || '',
        banner_title: settings.banner_title?.text || '',
        banner_subtitle: settings.banner_subtitle?.text || ''
      });
    }
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: async (newSettings: typeof storeSettings) => {
      const settingsToUpdate = [
        { key: 'store_name', value: { name: newSettings.store_name } },
        { key: 'store_phone', value: { phone: newSettings.store_phone } },
        { key: 'store_email', value: { email: newSettings.store_email } },
        { key: 'store_address', value: { address: newSettings.store_address } },
        { key: 'banner_title', value: { text: newSettings.banner_title } },
        { key: 'banner_subtitle', value: { text: newSettings.banner_subtitle } }
      ];

      for (const setting of settingsToUpdate) {
        const { error } = await supabase
          .from('settings')
          .upsert(setting);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: 'Berhasil',
        description: 'Pengaturan toko berhasil disimpan'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSave = () => {
    updateSettings.mutate(storeSettings);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-8">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-blue-800">Pengaturan</h1>

        <Tabs defaultValue="store" className="space-y-6">
          <TabsList>
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Toko
            </TabsTrigger>
            <TabsTrigger value="cod" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              COD
            </TabsTrigger>
          </TabsList>

          <TabsContent value="store">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Pengaturan Toko
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Store Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="store_name">Nama Toko</Label>
                    <Input
                      id="store_name"
                      value={storeSettings.store_name}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, store_name: e.target.value }))}
                      placeholder="SmartPOS"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="store_phone">Telepon Toko</Label>
                    <Input
                      id="store_phone"
                      value={storeSettings.store_phone}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, store_phone: e.target.value }))}
                      placeholder="+62 123 456 7890"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="store_email">Email Toko</Label>
                    <Input
                      id="store_email"
                      type="email"
                      value={storeSettings.store_email}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, store_email: e.target.value }))}
                      placeholder="info@smartpos.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="store_address">Alamat Toko</Label>
                    <Input
                      id="store_address"
                      value={storeSettings.store_address}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, store_address: e.target.value }))}
                      placeholder="Jakarta, Indonesia"
                    />
                  </div>
                </div>

                {/* Banner Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Pengaturan Banner Website</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="banner_title">Judul Banner</Label>
                    <Input
                      id="banner_title"
                      value={storeSettings.banner_title}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, banner_title: e.target.value }))}
                      placeholder="Belanja Mudah & Hemat"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="banner_subtitle">Subjudul Banner</Label>
                    <Textarea
                      id="banner_subtitle"
                      value={storeSettings.banner_subtitle}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, banner_subtitle: e.target.value }))}
                      placeholder="Temukan berbagai produk berkualitas dengan harga terbaik di SmartPOS"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <Button 
                    onClick={handleSave}
                    disabled={updateSettings.isPending}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateSettings.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cod">
            <CODSettings />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
