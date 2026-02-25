/**
 * Transforms a Supabase Storage URL to use the image rendering endpoint
 * with width/height parameters for on-the-fly resizing.
 * 
 * Converts: /storage/v1/object/public/bucket/file
 * To:       /storage/v1/render/image/public/bucket/file?width=W&height=H&resize=contain
 */
export const getOptimizedImageUrl = (
  url: string,
  width: number,
  height?: number
): string => {
  if (!url) return url;
  
  // Only transform Supabase storage URLs
  if (!url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }

  const transformed = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );

  const params = new URLSearchParams();
  params.set('width', String(width));
  if (height) params.set('height', String(height));
  params.set('resize', 'contain');
  params.set('quality', '80');

  return `${transformed}?${params.toString()}`;
};
