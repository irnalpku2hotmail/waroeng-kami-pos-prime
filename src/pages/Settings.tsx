
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Settings as SettingsIcon } from 'lucide-react';
import Layout from '@/components/Layout';
import CODSettings from '@/components/CODSettings';
import StoreInfoForm from '@/components/settings/StoreInfoForm';
import ReceiptSettingsForm from '@/components/settings/ReceiptSettingsForm';
import { Skeleton } from '@/components/ui/skeleton';

const Settings = () => {
  const queryClient = useQueryClient();

  // Fetch settings
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
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const SettingsSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );

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
            {isLoading ? <SettingsSkeleton /> : <StoreInfoForm settings={settings} updateSettings={updateSettings} />}
          </TabsContent>

          <TabsContent value="receipt">
            {isLoading ? <SettingsSkeleton /> : <ReceiptSettingsForm settings={settings} updateSettings={updateSettings} />}
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
