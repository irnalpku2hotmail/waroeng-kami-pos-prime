
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Search, Globe, Image } from 'lucide-react';

const SEOSettings = () => {
  const queryClient = useQueryClient();

  // Fetch SEO settings
  const { data: settings } = useQuery({
    queryKey: ['seo-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', [
          'seo_title',
          'seo_description',
          'seo_keywords',
          'seo_author',
          'seo_robots',
          'seo_canonical_url',
          'seo_og_title',
          'seo_og_description',
          'seo_og_image',
          'seo_twitter_card',
          'seo_twitter_site',
          'seo_schema_type',
          'seo_google_analytics',
          'seo_google_tag_manager'
        ]);
      if (error) throw error;
      
      const settingsObj: Record<string, any> = {};
      data?.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      return settingsObj;
    }
  });

  // Update SEO settings mutation
  const updateSEOSettings = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['seo-settings'] });
      toast({ title: 'Berhasil', description: 'Pengaturan SEO berhasil disimpan' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleBasicSEOSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const seoData = {
      seo_title: formData.get('seo_title') as string,
      seo_description: formData.get('seo_description') as string,
      seo_keywords: formData.get('seo_keywords') as string,
      seo_author: formData.get('seo_author') as string,
      seo_robots: formData.get('seo_robots') as string,
      seo_canonical_url: formData.get('seo_canonical_url') as string
    };

    updateSEOSettings.mutate(seoData);
  };

  const handleSocialMediaSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const socialData = {
      seo_og_title: formData.get('seo_og_title') as string,
      seo_og_description: formData.get('seo_og_description') as string,
      seo_og_image: formData.get('seo_og_image') as string,
      seo_twitter_card: formData.get('seo_twitter_card') as string,
      seo_twitter_site: formData.get('seo_twitter_site') as string,
      seo_schema_type: formData.get('seo_schema_type') as string
    };

    updateSEOSettings.mutate(socialData);
  };

  const handleAnalyticsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const analyticsData = {
      seo_google_analytics: formData.get('seo_google_analytics') as string,
      seo_google_tag_manager: formData.get('seo_google_tag_manager') as string
    };

    updateSEOSettings.mutate(analyticsData);
  };

  return (
    <div className="space-y-6">
      {/* Basic SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            SEO Dasar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBasicSEOSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seo_title">Judul Website (Title Tag)</Label>
              <Input
                id="seo_title"
                name="seo_title"
                defaultValue={settings?.seo_title || ''}
                placeholder="Toko Online Terbaik - Belanja Mudah dan Aman"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">Maksimal 60 karakter untuk hasil optimal di search engine</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="seo_description">Deskripsi Website (Meta Description)</Label>
              <Textarea
                id="seo_description"
                name="seo_description"
                defaultValue={settings?.seo_description || ''}
                placeholder="Belanja online mudah dan aman di toko kami. Dapatkan produk berkualitas dengan harga terbaik dan pengiriman cepat."
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">Maksimal 160 karakter untuk tampilan optimal di search engine</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_keywords">Kata Kunci (Keywords)</Label>
              <Input
                id="seo_keywords"
                name="seo_keywords"
                defaultValue={settings?.seo_keywords || ''}
                placeholder="toko online, belanja online, produk berkualitas"
              />
              <p className="text-xs text-muted-foreground">Pisahkan dengan koma, maksimal 10 kata kunci</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seo_author">Penulis/Author</Label>
                <Input
                  id="seo_author"
                  name="seo_author"
                  defaultValue={settings?.seo_author || ''}
                  placeholder="Nama Toko"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo_robots">Robots Meta Tag</Label>
                <select
                  id="seo_robots"
                  name="seo_robots"
                  defaultValue={settings?.seo_robots || 'index,follow'}
                  className="w-full p-2 border rounded"
                >
                  <option value="index,follow">Index, Follow</option>
                  <option value="noindex,nofollow">No Index, No Follow</option>
                  <option value="index,nofollow">Index, No Follow</option>
                  <option value="noindex,follow">No Index, Follow</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_canonical_url">Canonical URL</Label>
              <Input
                id="seo_canonical_url"
                name="seo_canonical_url"
                defaultValue={settings?.seo_canonical_url || ''}
                placeholder="https://yourdomain.com"
              />
            </div>

            <Button type="submit" disabled={updateSEOSettings.isPending}>
              {updateSEOSettings.isPending ? 'Menyimpan...' : 'Simpan SEO Dasar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Social Media & Open Graph */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Media Sosial & Open Graph
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSocialMediaSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seo_og_title">Open Graph Title</Label>
              <Input
                id="seo_og_title"
                name="seo_og_title"
                defaultValue={settings?.seo_og_title || ''}
                placeholder="Judul untuk tampilan di Facebook, WhatsApp, dll"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_og_description">Open Graph Description</Label>
              <Textarea
                id="seo_og_description"
                name="seo_og_description"
                defaultValue={settings?.seo_og_description || ''}
                placeholder="Deskripsi untuk tampilan di media sosial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_og_image">Open Graph Image URL</Label>
              <Input
                id="seo_og_image"
                name="seo_og_image"
                defaultValue={settings?.seo_og_image || ''}
                placeholder="https://yourdomain.com/og-image.jpg"
              />
              <p className="text-xs text-muted-foreground">Rekomendasi ukuran: 1200x630 pixels</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seo_twitter_card">Twitter Card Type</Label>
                <select
                  id="seo_twitter_card"
                  name="seo_twitter_card"
                  defaultValue={settings?.seo_twitter_card || 'summary_large_image'}
                  className="w-full p-2 border rounded"
                >
                  <option value="summary">Summary</option>
                  <option value="summary_large_image">Summary Large Image</option>
                  <option value="app">App</option>
                  <option value="player">Player</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo_twitter_site">Twitter Site Handle</Label>
                <Input
                  id="seo_twitter_site"
                  name="seo_twitter_site"
                  defaultValue={settings?.seo_twitter_site || ''}
                  placeholder="@namatoko"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_schema_type">Schema.org Type</Label>
              <select
                id="seo_schema_type"
                name="seo_schema_type"
                defaultValue={settings?.seo_schema_type || 'Store'}
                className="w-full p-2 border rounded"
              >
                <option value="Store">Store</option>
                <option value="Organization">Organization</option>
                <option value="LocalBusiness">Local Business</option>
                <option value="WebSite">Website</option>
              </select>
            </div>

            <Button type="submit" disabled={updateSEOSettings.isPending}>
              {updateSEOSettings.isPending ? 'Menyimpan...' : 'Simpan Pengaturan Media Sosial'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Analytics & Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAnalyticsSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seo_google_analytics">Google Analytics ID</Label>
              <Input
                id="seo_google_analytics"
                name="seo_google_analytics"
                defaultValue={settings?.seo_google_analytics || ''}
                placeholder="G-XXXXXXXXXX atau UA-XXXXXXXXX"
              />
              <p className="text-xs text-muted-foreground">Google Analytics tracking code untuk analisis website</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_google_tag_manager">Google Tag Manager ID</Label>
              <Input
                id="seo_google_tag_manager"
                name="seo_google_tag_manager"
                defaultValue={settings?.seo_google_tag_manager || ''}
                placeholder="GTM-XXXXXXX"
              />
              <p className="text-xs text-muted-foreground">Google Tag Manager container ID</p>
            </div>

            <Button type="submit" disabled={updateSEOSettings.isPending}>
              {updateSEOSettings.isPending ? 'Menyimpan...' : 'Simpan Pengaturan Analytics'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SEOSettings;
