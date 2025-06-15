
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Upload, Image } from 'lucide-react';

interface FaviconUploadProps {
  currentFavicon?: string;
}

const FaviconUpload = ({ currentFavicon }: FaviconUploadProps) => {
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Upload favicon mutation
  const uploadFavicon = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `favicon_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('frontend-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('frontend-assets')
        .getPublicUrl(fileName);

      return data.publicUrl;
    },
    onSuccess: async (faviconUrl) => {
      // Update favicon in settings
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'favicon_url',
          value: { url: faviconUrl } as any,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      // Update favicon in HTML head
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.setAttribute('rel', 'icon');
      link.setAttribute('href', faviconUrl);
      link.setAttribute('type', 'image/png');
      document.getElementsByTagName('head')[0].appendChild(link);

      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setFaviconFile(null);
      setFaviconPreview(null);
      toast({
        title: 'Berhasil',
        description: 'Favicon berhasil diupload dan diterapkan'
      });
    },
    onError: (error: any) => {
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
      const allowedTypes = ['image/png', 'image/x-icon', 'image/jpeg'];
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

  const handleSubmit = () => {
    if (faviconFile) {
      uploadFavicon.mutate(faviconFile);
    }
  };

  return (
    <div className="space-y-4">
      <Label>Favicon Website</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        {(faviconPreview || currentFavicon) && (
          <div className="mb-4 flex items-center gap-2">
            <img 
              src={faviconPreview || currentFavicon} 
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
              {currentFavicon ? 'Ganti Favicon' : 'Upload Favicon'}
            </Button>
          </Label>
          <Input
            id="favicon"
            type="file"
            accept="image/png,image/x-icon,image/jpeg"
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
          onClick={handleSubmit}
          disabled={uploadFavicon.isPending}
          className="w-full"
        >
          {uploadFavicon.isPending ? 'Mengupload...' : 'Upload Favicon'}
        </Button>
      )}
    </div>
  );
};

export default FaviconUpload;
