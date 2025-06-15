
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
import { Settings as SettingsIcon } from 'lucide-react';
import Layout from '@/components/Layout';
import CODSettings from '@/components/CODSettings';

const Settings = () => {
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

  const handleReceiptSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const receiptData = {
      receipt_settings: {
        header_text: formData.get('header_text') as string,
        footer_text: formData.get('footer_text') as string,
        show_logo: formData.get('show_logo') === 'on',
        show_cashier: formData.get('show_cashier') === 'on',
        show_qr_code: formData.get('show_qr_code') === 'on',
        paper_size: formData.get('paper_size') as string
      }
    };

    updateSettings.mutate(receiptData);
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
            <TabsTrigger value="receipt">Pengaturan Struk</TabsTrigger>
            <TabsTrigger value="cod">COD Settings</TabsTrigger>
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

          <TabsContent value="receipt">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Struk</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleReceiptSettingsSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="header_text">Teks Header Struk</Label>
                    <Textarea
                      id="header_text"
                      name="header_text"
                      defaultValue={settings?.receipt_settings?.header_text || ''}
                      placeholder="Terima kasih telah berbelanja di toko kami"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footer_text">Teks Footer Struk</Label>
                    <Textarea
                      id="footer_text"
                      name="footer_text"
                      defaultValue={settings?.receipt_settings?.footer_text || ''}
                      placeholder="Barang yang sudah dibeli tidak dapat dikembalikan"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paper_size">Ukuran Kertas</Label>
                      <select
                        id="paper_size"
                        name="paper_size"
                        defaultValue={settings?.receipt_settings?.paper_size || '80mm'}
                        className="w-full p-2 border rounded"
                      >
                        <option value="58mm">58mm</option>
                        <option value="80mm">80mm</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="show_logo"
                        name="show_logo"
                        defaultChecked={settings?.receipt_settings?.show_logo || false}
                      />
                      <Label htmlFor="show_logo">Tampilkan Logo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="show_cashier"
                        name="show_cashier"
                        defaultChecked={settings?.receipt_settings?.show_cashier || true}
                      />
                      <Label htmlFor="show_cashier">Tampilkan Nama Kasir</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="show_qr_code"
                        name="show_qr_code"
                        defaultChecked={settings?.receipt_settings?.show_qr_code || true}
                      />
                      <Label htmlFor="show_qr_code">Tampilkan QR Code (Nomor Transaksi)</Label>
                    </div>
                  </div>
                  <Button type="submit">Simpan Pengaturan Struk</Button>
                </form>
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
