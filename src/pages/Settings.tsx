
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
import { Settings as SettingsIcon, Upload, Trash2 } from 'lucide-react';
import Layout from '@/components/Layout';

const Settings = () => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch settings
  const { data: settings } = useQuery({
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
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({ title: 'Berhasil', description: 'Pengaturan berhasil disimpan' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Upload logo mutation
  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      return publicUrl;
    },
    onSuccess: (logoUrl) => {
      updateSettings.mutate({
        store_logo: { url: logoUrl }
      });
      setLogoFile(null);
      setLogoPreview(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = () => {
    if (logoFile) {
      uploadLogo.mutate(logoFile);
    }
  };

  const removeLogo = () => {
    updateSettings.mutate({
      store_logo: { url: null }
    });
  };

  const handleStoreInfoSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const storeData = {
      store_name: { name: formData.get('store_name') as string },
      store_address: { address: formData.get('store_address') as string },
      store_phone: { phone: formData.get('store_phone') as string },
      store_email: { email: formData.get('store_email') as string }
    };

    updateSettings.mutate(storeData);
  };

  const handleBusinessHoursSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const hoursData = {
      business_hours: {
        monday: { 
          open: formData.get('monday_open') as string, 
          close: formData.get('monday_close') as string 
        },
        tuesday: { 
          open: formData.get('tuesday_open') as string, 
          close: formData.get('tuesday_close') as string 
        },
        wednesday: { 
          open: formData.get('wednesday_open') as string, 
          close: formData.get('wednesday_close') as string 
        },
        thursday: { 
          open: formData.get('thursday_open') as string, 
          close: formData.get('thursday_close') as string 
        },
        friday: { 
          open: formData.get('friday_open') as string, 
          close: formData.get('friday_close') as string 
        },
        saturday: { 
          open: formData.get('saturday_open') as string, 
          close: formData.get('saturday_close') as string 
        },
        sunday: { 
          open: formData.get('sunday_open') as string, 
          close: formData.get('sunday_close') as string 
        }
      }
    };

    updateSettings.mutate(hoursData);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-blue-800" />
          <h1 className="text-3xl font-bold text-blue-800">Pengaturan Toko</h1>
        </div>

        <Tabs defaultValue="store-info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="store-info">Informasi Toko</TabsTrigger>
            <TabsTrigger value="business-hours">Jam Operasional</TabsTrigger>
            <TabsTrigger value="logo">Logo Toko</TabsTrigger>
          </TabsList>

          <TabsContent value="store-info">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Toko</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStoreInfoSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="store_name">Nama Toko</Label>
                    <Input
                      id="store_name"
                      name="store_name"
                      defaultValue={settings?.store_name?.name || ''}
                      placeholder="Nama toko Anda"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="store_address">Alamat</Label>
                    <Textarea
                      id="store_address"
                      name="store_address"
                      defaultValue={settings?.store_address?.address || ''}
                      placeholder="Alamat lengkap toko"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="store_phone">Telepon</Label>
                      <Input
                        id="store_phone"
                        name="store_phone"
                        defaultValue={settings?.store_phone?.phone || ''}
                        placeholder="+62 xxx xxx xxx"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="store_email">Email</Label>
                      <Input
                        id="store_email"
                        name="store_email"
                        type="email"
                        defaultValue={settings?.store_email?.email || ''}
                        placeholder="email@toko.com"
                      />
                    </div>
                  </div>
                  <Button type="submit">Simpan Informasi</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logo">
            <Card>
              <CardHeader>
                <CardTitle>Logo Toko</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Logo */}
                {settings?.store_logo?.url && (
                  <div className="space-y-2">
                    <Label>Logo Saat Ini</Label>
                    <div className="flex items-center gap-4">
                      <img
                        src={settings.store_logo.url}
                        alt="Current Logo"
                        className="h-16 w-16 object-contain border rounded"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={removeLogo}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus Logo
                      </Button>
                    </div>
                  </div>
                )}

                {/* Upload New Logo */}
                <div className="space-y-2">
                  <Label htmlFor="logo">Upload Logo Baru</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                  {logoPreview && (
                    <div className="flex items-center gap-4">
                      <img
                        src={logoPreview}
                        alt="Preview"
                        className="h-16 w-16 object-contain border rounded"
                      />
                      <Button onClick={handleLogoUpload} disabled={uploadLogo.isPending}>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadLogo.isPending ? 'Uploading...' : 'Upload Logo'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business-hours">
            <Card>
              <CardHeader>
                <CardTitle>Jam Operasional</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBusinessHoursSubmit} className="space-y-4">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <div key={day} className="grid grid-cols-3 gap-4 items-center">
                      <Label className="capitalize">{day}</Label>
                      <Input
                        name={`${day}_open`}
                        type="time"
                        defaultValue={settings?.business_hours?.[day]?.open || '09:00'}
                      />
                      <Input
                        name={`${day}_close`}
                        type="time"
                        defaultValue={settings?.business_hours?.[day]?.close || '17:00'}
                      />
                    </div>
                  ))}
                  <Button type="submit">Simpan Jam Operasional</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
