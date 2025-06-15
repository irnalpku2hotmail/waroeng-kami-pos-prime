
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface WebsiteSettings {
  id: string;
  navbar_color: string;
  footer_color: string;
  favicon_url: string | null;
}

interface ColorSettingsProps {
  settings?: WebsiteSettings;
}

const ColorSettings = ({ settings }: ColorSettingsProps) => {
  const queryClient = useQueryClient();

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
      toast({ title: 'Berhasil', description: 'Pengaturan warna berhasil disimpan' });
    },
    onError: (error: any) => {
      console.error('Update settings error:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

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

  return (
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
  );
};

export default ColorSettings;
