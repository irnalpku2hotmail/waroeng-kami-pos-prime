/**
 * Build a Supabase Storage Image Transformation URL.
 * For Supabase public-object URLs, swaps `/object/public/` with
 * `/render/image/public/` and appends width/height/quality params so the
 * server returns a properly sized (and WebP-encoded) image.
 * For non-Supabase URLs, returns the original URL unchanged.
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  opts: { width?: number; height?: number; quality?: number; resize?: 'cover' | 'contain' | 'fill' } = {}
): string {
  if (!url) return '';
  try {
    if (!url.includes('/storage/v1/object/public/')) return url;
    const transformed = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    const params = new URLSearchParams();
    if (opts.width) params.set('width', String(Math.round(opts.width)));
    if (opts.height) params.set('height', String(Math.round(opts.height)));
    params.set('quality', String(opts.quality ?? 70));
    params.set('resize', opts.resize ?? 'cover');
    return `${transformed}?${params.toString()}`;
  } catch {
    return url;
  }
}
