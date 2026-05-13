/**
 * Centralized client-side image optimization for Lapau.id.
 *
 * Goals:
 *  - Resize images proportionally to a sensible max dimension
 *  - Convert to a modern lightweight format (AVIF -> WebP -> original)
 *  - Reduce file size aggressively while keeping good visual quality
 *  - Never break the existing upload flow: on ANY failure we fall back
 *    to the original File untouched.
 *
 * Usage:
 *   const optimized = await optimizeImage(file, 'product');
 *   await supabase.storage.from(bucket).upload(path, optimized.file, {
 *     contentType: optimized.file.type,
 *     cacheControl: '2592000',
 *     upsert: false,
 *   });
 */

export type OptimizationPreset =
  | 'thumbnail'   // 300px, q60   (grid/list)
  | 'product'    // 1200px, q75  (product detail / generic product image)
  | 'category'   // 400px,  q70
  | 'brand'      // 300px,  q75  (logo)
  | 'banner'     // 1600px, q80
  | 'avatar'     // 400px,  q75
  | 'receipt';   // 1600px, q75  (expense receipts kept as image; PDFs skipped)

interface PresetConfig {
  maxDim: number;
  quality: number;
}

const PRESETS: Record<OptimizationPreset, PresetConfig> = {
  thumbnail: { maxDim: 300, quality: 0.6 },
  product:   { maxDim: 1200, quality: 0.75 },
  category:  { maxDim: 400, quality: 0.7 },
  brand:     { maxDim: 300, quality: 0.78 },
  banner:    { maxDim: 1600, quality: 0.8 },
  avatar:    { maxDim: 400, quality: 0.78 },
  receipt:   { maxDim: 1600, quality: 0.75 },
};

export interface OptimizedImage {
  file: File;
  optimized: boolean;
  format: 'avif' | 'webp' | 'original';
}

/** Return true for file types we can safely process via canvas. */
function isOptimizableImage(file: File): boolean {
  if (!file || !file.type) return false;
  if (!file.type.startsWith('image/')) return false;
  // Skip animated / vector / unknown formats — pass through unchanged.
  const skip = ['image/gif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
  return !skip.includes(file.type);
}

function loadImageBitmap(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), type, quality);
    } catch {
      resolve(null);
    }
  });
}

function changeExt(name: string, ext: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  return `${base}.${ext}`;
}

/**
 * Optimize an image file. Always resolves — falls back to the original on any error.
 */
export async function optimizeImage(
  file: File,
  preset: OptimizationPreset = 'product',
): Promise<OptimizedImage> {
  if (!isOptimizableImage(file)) {
    return { file, optimized: false, format: 'original' };
  }

  const cfg = PRESETS[preset];

  try {
    const img = await loadImageBitmap(file);
    const { width, height } = img;
    if (!width || !height) {
      return { file, optimized: false, format: 'original' };
    }

    // Compute target size while preserving aspect ratio.
    const scale = Math.min(1, cfg.maxDim / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { file, optimized: false, format: 'original' };

    // High-quality downscale.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    // Try AVIF first (modern Chromium), then WebP.
    const tryEncode = async (
      mime: string,
      ext: 'avif' | 'webp',
    ): Promise<OptimizedImage | null> => {
      const blob = await canvasToBlob(canvas, mime, cfg.quality);
      if (!blob || blob.size === 0) return null;
      // Some browsers silently fall back to PNG if the requested mime is unsupported.
      if (blob.type !== mime) return null;
      // Don't keep the optimized version if it ended up bigger than the source.
      if (blob.size >= file.size && scale === 1) return null;
      const optimizedFile = new File([blob], changeExt(file.name || `image.${ext}`, ext), {
        type: mime,
        lastModified: Date.now(),
      });
      return { file: optimizedFile, optimized: true, format: ext };
    };

    const avif = await tryEncode('image/avif', 'avif');
    if (avif) return avif;

    const webp = await tryEncode('image/webp', 'webp');
    if (webp) return webp;

    // Last resort: re-encode as JPEG when the source is a large raster.
    if (file.type !== 'image/webp' && file.type !== 'image/avif') {
      const jpeg = await canvasToBlob(canvas, 'image/jpeg', cfg.quality);
      if (jpeg && jpeg.size > 0 && jpeg.size < file.size) {
        const optimizedFile = new File([jpeg], changeExt(file.name || 'image.jpg', 'jpg'), {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        return { file: optimizedFile, optimized: true, format: 'original' };
      }
    }

    return { file, optimized: false, format: 'original' };
  } catch (err) {
    // Never block uploads — return original on any error.
    if (typeof console !== 'undefined') console.warn('[imageOptimization] fallback to original:', err);
    return { file, optimized: false, format: 'original' };
  }
}

/** Long cache lifetime (30 days) for optimized uploads — safe because filenames are unique. */
export const OPTIMIZED_CACHE_CONTROL = '2592000';
