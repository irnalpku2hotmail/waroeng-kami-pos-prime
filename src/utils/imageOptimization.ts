import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = 'https://fkqfdwxunnymmsutbeuu.supabase.co';

export interface ImgOpts {
  width?: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain' | 'fill';
}

/**
 * Returns a Supabase image transformation URL (compressed/resized) when possible.
 * - Full Supabase public URLs are rewritten to /render/image/public/ with size params.
 * - Relative storage paths are resolved against the given bucket via /render/image/public/.
 * - External (non-Supabase) URLs are returned unchanged.
 * - Falsy inputs return null so callers can render a placeholder.
 */
export const getOptimizedImageUrl = (
  imageUrl: string | null | undefined,
  opts: ImgOpts = {},
  bucket: string = 'product-images'
): string | null => {
  if (!imageUrl) return null;
  const { width, height, quality = 70, resize = 'cover' } = opts;

  const params = new URLSearchParams();
  if (width) params.set('width', String(width));
  if (height) params.set('height', String(height));
  params.set('quality', String(quality));
  params.set('resize', resize);
  const qs = params.toString();

  // Skip optimization for SVGs (transform endpoint doesn't process SVG)
  if (/\.svg($|\?)/i.test(imageUrl)) return imageUrl;

  if (imageUrl.includes('/storage/v1/object/public/')) {
    return imageUrl.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + '?' + qs;
  }

  if (imageUrl.startsWith('http')) {
    // External origin (e.g. googleusercontent, GCS) — cannot transform via Supabase
    return imageUrl;
  }

  // Relative path stored in a Supabase bucket
  const path = imageUrl.replace(/^\/+/, '');
  return `${SUPABASE_URL}/storage/v1/render/image/public/${bucket}/${path}?${qs}`;
};

// Keep supabase import referenced (reserved for future signed-URL use)
void supabase;