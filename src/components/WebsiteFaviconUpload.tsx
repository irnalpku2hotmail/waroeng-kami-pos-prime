
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Upload, Image } from 'lucide-react';

interface WebsiteSettings {
  id: string;
  navbar_color: string;
  footer_color: string;
  favicon_url: string | null;
}

interface WebsiteFaviconUploadProps {
  settings?: WebsiteSettings;
}

const WebsiteFaviconUpload = ({ settings }: WebsiteFaviconUploadProps) => {
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
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
      toast({ title: 'Berhasil', description: 'Pengaturan website berhasil disimpan' });
    },
    onError: (error: any) => {
      console.error('Update settings error:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Upload favicon mutation
  const uploadFavicon = useMutation({
    mutationFn: async (file: File) => {
      console.log('Starting favicon upload:', file.name);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `favicon_${Date.now()}.${fileExt}`;
      
      // Remove old favicon if exists, but don't fail the upload if it doesn't.
      if (settings?.favicon_url) {
        try {
          const oldFileName = settings.favicon_url.split('/').pop();
          if (oldFileName && oldFileName.startsWith('favicon_')) {
            console.log('Removing old favicon:', oldFileName);
            await supabase.storage
              .from('website-assets')
              .remove([oldFileName]);
          }
        } catch (error) {
          console.warn('Could not remove old favicon. Continuing with upload.', error);
        }
      }
      
      console.log('Uploading new favicon:', fileName);
      const { error: uploadError } = await supabase.storage
        .from('website-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('website-assets')
        .getPublicUrl(fileName);

      console.log('Favicon uploaded successfully:', data.publicUrl);
      return data.publicUrl;
    },
    onSuccess: async (faviconUrl, file: File) => {
      console.log('Updating settings with new favicon URL:', faviconUrl);
      await updateSettings.mutateAsync({ favicon_url: faviconUrl });
      
      // Update favicon in HTML head
      const existingLink = document.querySelector("link[rel*='icon']");
      if (existingLink) {
        existingLink.remove();
      }
      
      const link = document.createElement('link');
      link.setAttribute('rel', 'icon');
      link.setAttribute('href', faviconUrl);
      link.setAttribute('type', file.type); // Use correct file type
      document.head.appendChild(link);

      setFaviconFile(null);
      setFaviconPreview(null);
      
      toast({
        title: 'Berhasil',
        description: 'Favicon berhasil diupload dan diterapkan'
      });
    },
    onError: (error: any) => {
      console.error('Favicon upload error:', error);
      toast({
        title: 'Error Upload',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Favicon file selected:', file.name, file.size, file.type);
      
      // Check file size (1MB limit for favicon)
      if (file.size > 1 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Ukuran file terlalu besar. Maksimal 1MB untuk favicon',
          variant: 'destructive'
        });
        return;
      }

      // Check file type
      const allowedTypes = ['image/png', 'image/x-icon', 'image/jpeg', 'image/ico'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Error',
          description: 'Format file tidak didukung. Gunakan PNG, ICO, atau JPEG',
          variant: 'destructive'
        });
        return;
      }

      setFaviconFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFaviconPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconSubmit = () => {
    if (faviconFile) {
      console.log('Submitting favicon upload');
      uploadFavicon.mutate(faviconFile);
    } else {
      toast({
        title: 'Error',
        description: 'Pilih file favicon terlebih dahulu',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Favicon Website</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            {(faviconPreview || settings?.favicon_url) && (
              <div className="mb-4 flex items-center gap-2">
                <img 
                  src={faviconPreview || settings?.favicon_url || ''} 
                  alt="Favicon Preview" 
                  className="w-8 h-8 object-cover rounded"
                />
                <span className="text-sm text-gray-600">Preview Favicon</span>
              </div>
            )}
            <div className="text-center">
              <Image className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <Label htmlFor="favicon" className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" className="mb-2">
                  <Upload className="h-4 w-4 mr-2" />
                  {settings?.favicon_url ? 'Ganti Favicon' : 'Upload Favicon'}
                </Button>
              </Label>
              <Input
                id="favicon"
                type="file"
                accept="image/png,image/x-icon,image/jpeg,.ico"
                onChange={handleFaviconChange}
                className="hidden"
              />
              <p className="text-xs text-gray-500">
                Upload favicon untuk website (maksimal 1MB, format: PNG, ICO, JPEG)
              </p>
            </div>
          </div>
          {faviconFile && (
            <Button 
              onClick={handleFaviconSubmit}
              disabled={uploadFavicon.isPending}
              className="w-full"
            >
              {uploadFavicon.isPending ? 'Mengupload...' : 'Upload Favicon'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WebsiteFaviconUpload;
