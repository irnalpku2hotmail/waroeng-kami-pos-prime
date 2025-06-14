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
import { Save, Store, Truck, Globe, Receipt, Upload, Building } from 'lucide-react';
import Layout from '@/components/Layout';
import CODSettings from '@/components/CODSettings';

const Settings = () => {
  const [storeSettings, setStoreSettings] = useState({
    store_name: '',
    store_phone: '',
    store_email: '',
    store_address: '',
    banner_title: '',
    banner_subtitle: '',
    store_logo: ''
  });

  const [frontendSettings, setFrontendSettings] = useState({
    show_products: true,
    show_categories: true,
    show_search: true,
    show_cart: true,
    show_promotions: true,
    theme_color: '#3B82F6'
  });

  const [receiptSettings, setReceiptSettings] = useState({
    receipt_header: '',
    receipt_footer: '',
    show_barcode: true,
    show_qr_code: false,
    paper_size: 'A4',
    font_size: '12'
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
        banner_subtitle: settings.banner_subtitle?.text || '',
        store_logo: settings.store_logo?.url || ''
      });

      setFrontendSettings({
        show_products: settings.frontend_show_products?.enabled ?? true,
        show_categories: settings.frontend_show_categories?.enabled ?? true,
        show_search: settings.frontend_show_search?.enabled ?? true,
        show_cart: settings.frontend_show_cart?.enabled ?? true,
        show_promotions: settings.frontend_show_promotions?.enabled ?? true,
        theme_color: settings.frontend_theme_color?.color || '#3B82F6'
      });

      setReceiptSettings({
        receipt_header: settings.receipt_header?.text || '',
        receipt_footer: settings.receipt_footer?.text || '',
        show_barcode: settings.receipt_show_barcode?.enabled ?? true,
        show_qr_code: settings.receipt_show_qr_code?.enabled ?? false,
        paper_size: settings.receipt_paper_size?.size || 'A4',
        font_size: settings.receipt_font_size?.size || '12'
      });
    }
  }, [settings]);

  const uploadLogo = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const updateStoreSettings = useMutation({
    mutationFn: async (newSettings: typeof storeSettings) => {
      let logoUrl = newSettings.store_logo;
      
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }

      const settingsToUpdate = [
        { key: 'store_name', value: { name: newSettings.store_name } },
        { key: 'store_phone', value: { phone: newSettings.store_phone } },
        { key: 'store_email', value: { email: newSettings.store_email } },
        { key: 'store_address', value: { address: newSettings.store_address } },
        { key: 'banner_title', value: { text: newSettings.banner_title } },
        { key: 'banner_subtitle', value: { text: newSettings.banner_subtitle } },
        { key: 'store_logo', value: { url: logoUrl } }
      ];

      for (const setting of settingsToUpdate) {
        const { error } = await supabase
          .from('settings')
          .upsert(setting, { onConflict: 'key' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setLogoFile(null);
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

  const updateFrontendSettings = useMutation({
    mutationFn: async (newSettings: typeof frontendSettings) => {
      const settingsToUpdate = [
        { key: 'frontend_show_products', value: { enabled: newSettings.show_products } },
        { key: 'frontend_show_categories', value: { enabled: newSettings.show_categories } },
        { key: 'frontend_show_search', value: { enabled: newSettings.show_search } },
        { key: 'frontend_show_cart', value: { enabled: newSettings.show_cart } },
        { key: 'frontend_show_promotions', value: { enabled: newSettings.show_promotions } },
        { key: 'frontend_theme_color', value: { color: newSettings.theme_color } }
      ];

      for (const setting of settingsToUpdate) {
        const { error } = await supabase
          .from('settings')
          .upsert(setting, { onConflict: 'key' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: 'Berhasil',
        description: 'Pengaturan frontend berhasil disimpan'
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

  const updateReceiptSettings = useMutation({
    mutationFn: async (newSettings: typeof receiptSettings) => {
      const settingsToUpdate = [
        { key: 'receipt_header', value: { text: newSettings.receipt_header } },
        { key: 'receipt_footer', value: { text: newSettings.receipt_footer } },
        { key: 'receipt_show_barcode', value: { enabled: newSettings.show_barcode } },
        { key: 'receipt_show_qr_code', value: { enabled: newSettings.show_qr_code } },
        { key: 'receipt_paper_size', value: { size: newSettings.paper_size } },
        { key: 'receipt_font_size', value: { size: newSettings.font_size } }
      ];

      for (const setting of settingsToUpdate) {
        const { error } = await supabase
          .from('settings')
          .upsert(setting, { onConflict: 'key' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: 'Berhasil',
        description: 'Pengaturan receipt berhasil disimpan'
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

  const handleStoreSettingsSave = () => {
    updateStoreSettings.mutate(storeSettings);
  };

  const handleFrontendSettingsSave = () => {
    updateFrontendSettings.mutate(frontendSettings);
  };

  const handleReceiptSettingsSave = () => {
    updateReceiptSettings.mutate(receiptSettings);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      // Preview the logo
      const reader = new FileReader();
      reader.onload = (e) => {
        setStoreSettings(prev => ({ ...prev, store_logo: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
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
            <TabsTrigger value="frontend" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Frontend
            </TabsTrigger>
            <TabsTrigger value="receipt" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Receipt
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
                {/* Logo Upload */}
                <div className="space-y-4">
                  <Label>Logo Aplikasi</Label>
                  <div className="flex items-center gap-4">
                    {storeSettings.store_logo && (
                      <div className="relative">
                        <img 
                          src={storeSettings.store_logo} 
                          alt="Store Logo" 
                          className="w-20 h-20 object-contain border rounded"
                        />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Label htmlFor="logo-upload" asChild>
                        <Button variant="outline" className="cursor-pointer" disabled={uploading}>
                          <Upload className="h-4 w-4 mr-2" />
                          {uploading ? 'Uploading...' : storeSettings.store_logo ? 'Ganti Logo' : 'Upload Logo'}
                        </Button>
                      </Label>
                    </div>
                  </div>
                </div>

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
                    onClick={handleStoreSettingsSave}
                    disabled={updateStoreSettings.isPending || uploading}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateStoreSettings.isPending || uploading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="frontend">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Pengaturan Frontend
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Fitur Tampilan</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show_products">Tampilkan Produk</Label>
                        <input
                          id="show_products"
                          type="checkbox"
                          checked={frontendSettings.show_products}
                          onChange={(e) => setFrontendSettings(prev => ({ ...prev, show_products: e.target.checked }))}
                          className="rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="show_categories">Tampilkan Kategori</Label>
                        <input
                          id="show_categories"
                          type="checkbox"
                          checked={frontendSettings.show_categories}
                          onChange={(e) => setFrontendSettings(prev => ({ ...prev, show_categories: e.target.checked }))}
                          className="rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="show_search">Tampilkan Pencarian</Label>
                        <input
                          id="show_search"
                          type="checkbox"
                          checked={frontendSettings.show_search}
                          onChange={(e) => setFrontendSettings(prev => ({ ...prev, show_search: e.target.checked }))}
                          className="rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="show_cart">Tampilkan Keranjang</Label>
                        <input
                          id="show_cart"
                          type="checkbox"
                          checked={frontendSettings.show_cart}
                          onChange={(e) => setFrontendSettings(prev => ({ ...prev, show_cart: e.target.checked }))}
                          className="rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="show_promotions">Tampilkan Promosi</Label>
                        <input
                          id="show_promotions"
                          type="checkbox"
                          checked={frontendSettings.show_promotions}
                          onChange={(e) => setFrontendSettings(prev => ({ ...prev, show_promotions: e.target.checked }))}
                          className="rounded"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Tema</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="theme_color">Warna Tema</Label>
                      <Input
                        id="theme_color"
                        type="color"
                        value={frontendSettings.theme_color}
                        onChange={(e) => setFrontendSettings(prev => ({ ...prev, theme_color: e.target.value }))}
                        className="w-20 h-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={handleFrontendSettingsSave}
                    disabled={updateFrontendSettings.isPending}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateFrontendSettings.isPending ? 'Menyimpan...' : 'Simpan Pengaturan Frontend'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipt">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Pengaturan Receipt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Header & Footer</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="receipt_header">Header Receipt</Label>
                      <Textarea
                        id="receipt_header"
                        value={receiptSettings.receipt_header}
                        onChange={(e) => setReceiptSettings(prev => ({ ...prev, receipt_header: e.target.value }))}
                        placeholder="Terima kasih telah berbelanja"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="receipt_footer">Footer Receipt</Label>
                      <Textarea
                        id="receipt_footer"
                        value={receiptSettings.receipt_footer}
                        onChange={(e) => setReceiptSettings(prev => ({ ...prev, receipt_footer: e.target.value }))}
                        placeholder="Barang yang sudah dibeli tidak dapat dikembalikan"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Format & Tampilan</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show_barcode">Tampilkan Barcode</Label>
                        <input
                          id="show_barcode"
                          type="checkbox"
                          checked={receiptSettings.show_barcode}
                          onChange={(e) => setReceiptSettings(prev => ({ ...prev, show_barcode: e.target.checked }))}
                          className="rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="show_qr_code">Tampilkan QR Code</Label>
                        <input
                          id="show_qr_code"
                          type="checkbox"
                          checked={receiptSettings.show_qr_code}
                          onChange={(e) => setReceiptSettings(prev => ({ ...prev, show_qr_code: e.target.checked }))}
                          className="rounded"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paper_size">Ukuran Kertas</Label>
                        <select
                          id="paper_size"
                          value={receiptSettings.paper_size}
                          onChange={(e) => setReceiptSettings(prev => ({ ...prev, paper_size: e.target.value }))}
                          className="w-full p-2 border rounded"
                        >
                          <option value="A4">A4</option>
                          <option value="thermal">Thermal (58mm)</option>
                          <option value="thermal80">Thermal (80mm)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="font_size">Ukuran Font</Label>
                        <select
                          id="font_size"
                          value={receiptSettings.font_size}
                          onChange={(e) => setReceiptSettings(prev => ({ ...prev, font_size: e.target.value }))}
                          className="w-full p-2 border rounded"
                        >
                          <option value="10">10px</option>
                          <option value="12">12px</option>
                          <option value="14">14px</option>
                          <option value="16">16px</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={handleReceiptSettingsSave}
                    disabled={updateReceiptSettings.isPending}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateReceiptSettings.isPending ? 'Menyimpan...' : 'Simpan Pengaturan Receipt'}
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
