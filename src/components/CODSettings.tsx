
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Truck, Save } from 'lucide-react';

const CODSettings = () => {
  const [settings, setSettings] = useState({
    enabled: true,
    delivery_fee: 10000,
    max_distance: 10,
    min_order: 50000,
    service_fee: 5000
  });

  const queryClient = useQueryClient();

  const { data: codSettings, isLoading } = useQuery({
    queryKey: ['cod-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'cod_settings')
        .single();
      if (error) {
        console.log('No COD settings found, using defaults');
        return settings;
      }
      return data.value;
    }
  });

  useEffect(() => {
    if (codSettings) {
      setSettings(codSettings as typeof settings);
    }
  }, [codSettings]);

  const updateSettings = useMutation({
    mutationFn: async (newSettings: typeof settings) => {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'cod_settings',
          value: newSettings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cod-settings'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: 'Berhasil',
        description: 'Pengaturan COD berhasil disimpan'
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
    updateSettings.mutate(settings);
  };

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Pengaturan Cash on Delivery (COD)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable COD */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Aktifkan COD</Label>
            <p className="text-sm text-gray-500">
              Izinkan pelanggan untuk membayar saat barang diterima
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => handleInputChange('enabled', checked)}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Delivery Fee */}
            <div className="space-y-2">
              <Label htmlFor="delivery_fee">Ongkos Kirim (Rp)</Label>
              <Input
                id="delivery_fee"
                type="number"
                value={settings.delivery_fee}
                onChange={(e) => handleInputChange('delivery_fee', Number(e.target.value))}
                placeholder="10000"
              />
              <p className="text-sm text-gray-500">
                Biaya pengiriman yang akan dikenakan untuk setiap pesanan COD
              </p>
            </div>

            {/* Maximum Distance */}
            <div className="space-y-2">
              <Label htmlFor="max_distance">Jarak Maksimum (KM)</Label>
              <Input
                id="max_distance"
                type="number"
                value={settings.max_distance}
                onChange={(e) => handleInputChange('max_distance', Number(e.target.value))}
                placeholder="10"
              />
              <p className="text-sm text-gray-500">
                Jarak maksimum pengiriman untuk layanan COD
              </p>
            </div>

            {/* Minimum Order */}
            <div className="space-y-2">
              <Label htmlFor="min_order">Minimum Pesanan (Rp)</Label>
              <Input
                id="min_order"
                type="number"
                value={settings.min_order}
                onChange={(e) => handleInputChange('min_order', Number(e.target.value))}
                placeholder="50000"
              />
              <p className="text-sm text-gray-500">
                Nilai minimum pesanan untuk dapat menggunakan layanan COD
              </p>
            </div>
          </>
        )}

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
  );
};

export default CODSettings;
