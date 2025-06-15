
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe } from 'lucide-react';
import Layout from '@/components/Layout';
import ColorSettings from '@/components/ColorSettings';
import WebsiteFaviconUpload from '@/components/WebsiteFaviconUpload';
import BannerManagement from '@/components/BannerManagement';

interface WebsiteSettings {
  id: string;
  navbar_color: string;
  footer_color: string;
  favicon_url: string | null;
}

const Website = () => {
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
            <ColorSettings settings={settings} />
          </TabsContent>

          <TabsContent value="favicon">
            <WebsiteFaviconUpload settings={settings} />
          </TabsContent>

          <TabsContent value="banners">
            <BannerManagement />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Website;
