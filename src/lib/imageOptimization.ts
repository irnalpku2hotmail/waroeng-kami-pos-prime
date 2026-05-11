/**
 * Build an optimized URL for images stored in Supabase Storage by routing
 * them through the `/render/image/public/` transformation endpoint.
 *
 * Falls back to the original URL when:
 *  - URL is empty
 *  - URL is not a Supabase storage public URL (e.g. external CDN)
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  resize?: 'cover' | 'contain' | 'fill';
  format?: 'origin' | 'webp';
}

const SUPABASE_PUBLIC_PATH = '/storage/v1/object/public/';
const SUPABASE_RENDER_PATH = '/storage/v1/render/image/public/';

export function getOptimizedImageUrl(
  url: string | null | undefined,
  opts: ImageOptimizationOptions = {}
): string {
  if (!url) return '/placeholder.svg';

  // Only transform Supabase public-storage URLs
  if (!url.includes(SUPABASE_PUBLIC_PATH)) return url;

  const transformed = url.replace(SUPABASE_PUBLIC_PATH, SUPABASE_RENDER_PATH);

  const params = new URLSearchParams();
  if (opts.width) params.set('width', String(Math.round(opts.width)));
  if (opts.height) params.set('height', String(Math.round(opts.height)));
  params.set('quality', String(opts.quality ?? 70));
  params.set('resize', opts.resize ?? 'cover');
  // webp format gives ~30-60% size reduction over jpg/png
  if (opts.format !== 'origin') params.set('format', 'origin');
  // Note: Supabase image transform auto-negotiates webp via Accept header,
  // so we don't force format unless explicitly requested.

  return `${transformed}?${params.toString()}`;
}

/**
 * Build a srcset string for responsive images.
 */
export function buildSrcSet(
  url: string | null | undefined,
  widths: number[],
  opts: Omit<ImageOptimizationOptions, 'width'> = {}
): string | undefined {
  if (!url || !url.includes(SUPABASE_PUBLIC_PATH)) return undefined;
  return widths
    .map((w) => `${getOptimizedImageUrl(url, { ...opts, width: w })} ${w}w`)
    .join(', ');
}