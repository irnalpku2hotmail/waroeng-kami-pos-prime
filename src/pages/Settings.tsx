
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Store, Package, Settings as SettingsIcon, Trash2, Plus } from 'lucide-react';
import Layout from '@/components/Layout';

interface Brand {
  id: string;
  name: string;
  website_url: string;
  logo_url: string;
  is_active: boolean;
}

const Settings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('store');
  const [newBrand, setNewBrand] = useState({
    name: '',
    website_url: '',
    logo_url: '',
    is_active: true
  });

  // Fetch settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;
      
      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);
      
      return settingsMap;
    }
  });

  // Fetch brands
  const { data: brands = [], isLoading: brandsLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_brands')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Brand[];
    }
  });

  const updateSettings = useMutation({
    mutationFn: async (settingsData: Record<string, any>) => {
      const promises = Object.entries(settingsData).map(([key, value]) => {
        return supabase
          .from('settings')
          .upsert({
            key,
            value,
            updated_at: new Date().toISOString()
          });
      });

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: 'Berhasil!',
        description: 'Pengaturan telah disimpan',
      });
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan pengaturan',
        variant: 'destructive'
      });
    }
  });

  const createBrand = useMutation({
    mutationFn: async (brandData: Omit<Brand, 'id'>) => {
      const { error } = await supabase
        .from('product_brands')
        .insert(brandData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setNewBrand({
        name: '',
        website_url: '',
        logo_url: '',
        is_active: true
      });
      toast({
        title: 'Berhasil!',
        description: 'Brand baru telah ditambahkan',
      });
    },
    onError: (error) => {
      console.error('Error creating brand:', error);
      toast({
        title: 'Error',
        description: 'Gagal menambahkan brand',
        variant: 'destructive'
      });
    }
  });

  const updateBrand = useMutation({
    mutationFn: async ({ id, ...brandData }: Partial<Brand> & { id: string }) => {
      const { error } = await supabase
        .from('product_brands')
        .update(brandData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: 'Berhasil!',
        description: 'Brand telah diperbarui',
      });
    },
    onError: (error) => {
      console.error('Error updating brand:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui brand',
        variant: 'destructive'
      });
    }
  });

  const deleteBrand = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_brands')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: 'Berhasil!',
        description: 'Brand telah dihapus',
      });
    },
    onError: (error) => {
      console.error('Error deleting brand:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus brand',
        variant: 'destructive'
      });
    }
  });

  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const settingsData = {
      store_name: formData.get('store_name'),
      store_address: formData.get('store_address'),
      store_phone: formData.get('store_phone'),
      store_email: formData.get('store_email'),
    };
    updateSettings.mutate(settingsData);
  };

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.name.trim()) {
      toast({
        title: 'Error',
        description: 'Nama brand tidak boleh kosong',
        variant: 'destructive'
      });
      return;
    }
    createBrand.mutate(newBrand);
  };

  const handleToggleBrandActive = (brand: Brand) => {
    updateBrand.mutate({
      id: brand.id,
      is_active: !brand.is_active
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Pengaturan</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Info Toko
            </TabsTrigger>
            <TabsTrigger value="brands" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Brand
            </TabsTrigger>
          </TabsList>

          <TabsContent value="store" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Toko</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveStoreSettings} className="space-y-4">
                  <div>
                    <Label htmlFor="store_name">Nama Toko</Label>
                    <Input
                      id="store_name"
                      name="store_name"
                      defaultValue={settings?.store_name || ''}
                      placeholder="Masukkan nama toko"
                    />
                  </div>
                  <div>
                    <Label htmlFor="store_address">Alamat Toko</Label>
                    <Input
                      id="store_address"
                      name="store_address"
                      defaultValue={settings?.store_address || ''}
                      placeholder="Masukkan alamat toko"
                    />
                  </div>
                  <div>
                    <Label htmlFor="store_phone">Nomor Telepon</Label>
                    <Input
                      id="store_phone"
                      name="store_phone"
                      defaultValue={settings?.store_phone || ''}
                      placeholder="Masukkan nomor telepon"
                    />
                  </div>
                  <div>
                    <Label htmlFor="store_email">Email</Label>
                    <Input
                      id="store_email"
                      name="store_email"
                      type="email"
                      defaultValue={settings?.store_email || ''}
                      placeholder="Masukkan email toko"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={updateSettings.isPending}
                  >
                    {updateSettings.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="brands" className="space-y-4">
            {/* Add New Brand */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Tambah Brand Baru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddBrand} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="brand_name">Nama Brand *</Label>
                      <Input
                        id="brand_name"
                        value={newBrand.name}
                        onChange={(e) => setNewBrand({...newBrand, name: e.target.value})}
                        placeholder="Masukkan nama brand"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="brand_website">Website URL</Label>
                      <Input
                        id="brand_website"
                        value={newBrand.website_url}
                        onChange={(e) => setNewBrand({...newBrand, website_url: e.target.value})}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="brand_logo">Logo URL</Label>
                    <Input
                      id="brand_logo"
                      value={newBrand.logo_url}
                      onChange={(e) => setNewBrand({...newBrand, logo_url: e.target.value})}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="brand_active"
                      checked={newBrand.is_active}
                      onCheckedChange={(checked) => setNewBrand({...newBrand, is_active: checked})}
                    />
                    <Label htmlFor="brand_active">Aktif</Label>
                  </div>
                  <Button
                    type="submit"
                    disabled={createBrand.isPending}
                  >
                    {createBrand.isPending ? 'Menambahkan...' : 'Tambah Brand'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Brands List */}
            <Card>
              <CardHeader>
                <CardTitle>Daftar Brand</CardTitle>
              </CardHeader>
              <CardContent>
                {brandsLoading ? (
                  <p className="text-center py-4">Memuat brand...</p>
                ) : brands.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">Belum ada brand</p>
                ) : (
                  <div className="space-y-3">
                    {brands.map((brand) => (
                      <div key={brand.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                            {brand.logo_url ? (
                              <img 
                                src={brand.logo_url} 
                                alt={brand.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium">{brand.name}</h3>
                            {brand.website_url && (
                              <p className="text-sm text-gray-600">{brand.website_url}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={brand.is_active}
                            onCheckedChange={() => handleToggleBrandActive(brand)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => deleteBrand.mutate(brand.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
