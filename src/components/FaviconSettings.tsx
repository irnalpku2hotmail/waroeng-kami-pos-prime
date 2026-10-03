import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Star } from 'lucide-react';

const BUCKET = 'website-assets';
const MAX_SIZE = 256 * 1024;
const TYPES: Record<string, string> = {
  png: 'image/png',
  ico: 'image/x-icon',
};

const FaviconSettings = () => {
  const qc = useQueryClient();
  const { data: settings } = useSettings();
  const current = settings?.favicon_url as { url?: string; path?: string } | undefined;
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['settings'] });
    qc.invalidateQueries({ queryKey: ['seo-settings'] });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const mime = TYPES[ext];
    const okMime = file.type === mime || (ext === 'ico' && /icon/.test(file.type || 'icon'));
    if (!mime || !okMime) {
      toast({ title: 'Format tidak didukung', description: 'Gunakan file PNG atau ICO.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast({ title: 'File terlalu besar', description: 'Maksimal 256 KB.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    const path = `branding/favicon-${Date.now()}.${ext}`;
    try {
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: mime, cacheControl: '31536000', upsert: false,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const { error: dbErr } = await supabase.from('settings').upsert(
        { key: 'favicon_url', value: { url: pub.publicUrl, path, type: mime }, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      );
      if (dbErr) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw dbErr;
      }
      if (current?.path && current.path !== path) await supabase.storage.from(BUCKET).remove([current.path]);
      refresh();
      toast({ title: 'Berhasil', description: 'Favicon diperbarui' });
    } catch (err: any) {
      toast({ title: 'Gagal mengunggah favicon', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.from('settings').delete().eq('key', 'favicon_url');
      if (error) throw error;
      if (current?.path) await supabase.storage.from(BUCKET).remove([current.path]);
      refresh();
      toast({ title: 'Berhasil', description: 'Favicon dihapus, kembali ke default' });
    } catch (err: any) {
      toast({ title: 'Gagal menghapus favicon', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5" />Favicon</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 border rounded flex items-center justify-center bg-muted">
            <img src={current?.url || '/favicon.ico'} alt="Favicon saat ini" className="h-8 w-8 object-contain" />
          </div>
          <p className="text-sm text-muted-foreground">
            {current?.url ? 'Favicon kustom aktif.' : 'Menggunakan favicon default.'}<br />
            Format PNG atau ICO, maks. 256 KB. Disarankan persegi 32×32 – 512×512.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild disabled={busy}>
            <label className="cursor-pointer">
              {busy ? 'Memproses...' : current?.url ? 'Ganti Favicon' : 'Upload Favicon'}
              <input type="file" accept=".png,.ico,image/png,image/x-icon" className="hidden" onChange={handleFile} disabled={busy} />
            </label>
          </Button>
          {current?.url && (
            <Button variant="outline" onClick={handleRemove} disabled={busy}>Hapus</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FaviconSettings;
