import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Transform a Supabase Storage public URL to use image resizing.
 * Replaces /object/public/ with /render/image/public/ and adds width/height params.
 */
export function getResizedImageUrl(url: string | null | undefined, width: number, height?: number): string {
  if (!url) return '/placeholder.svg';
  // Only transform Supabase storage URLs
  if (url.includes('/storage/v1/object/public/')) {
    const transformed = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    const h = height || width;
    return `${transformed}?width=${width}&height=${h}&resize=cover`;
  }
  return url;
}
