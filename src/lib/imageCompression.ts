/**
 * Centralized client-side image compression for PRODUCT / CATEGORY / BRAND uploads.
 *
 * Hard limit: the returned file is guaranteed to be <= MAX_BYTES (50 KB).
 * If that cannot be achieved, a controlled CompressionError is thrown so the
 * caller can block the upload.
 *
 * Banners are intentionally NOT handled here (see utils/imageOptimization.ts).
 */

export const MAX_BYTES = 50 * 1024; // 51200

export type CompressionTarget = 'product' | 'category' | 'brand';

export interface CompressionResult {
  file: File;
  mimeType: string;
  size: number;
  originalSize: number;
  width: number;
  height: number;
  format: 'WebP' | 'JPEG' | 'PNG' | 'original';
}

export class CompressionError extends Error {
  constructor(message = 'Gambar tidak dapat dikompres hingga 50 KB.') {
    super(message);
    this.name = 'CompressionError';
  }
}

const START_DIM: Record<CompressionTarget, number> = {
  product: 1000,
  category: 400,
  brand: 320,
};

const QUALITY_STEPS = [0.82, 0.72, 0.62, 0.52, 0.42, 0.34, 0.26];
const DIM_STEPS = [1, 0.8, 0.65, 0.5, 0.4, 0.3, 0.22];
const MIN_DIM = 96;

/** File types we can safely process through a canvas. */
function isProcessable(file: File): boolean {
  if (!file?.type?.startsWith('image/')) return false;
  const skip = ['image/gif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
  return !skip.includes(file.type);
}

function loadImage(file: File): Promise<HTMLImageElement> {
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

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), type, quality);
    } catch {
      resolve(null);
    }
  });
}

/** Draw the source image at a given size, from the ORIGINAL element each time. */
function draw(img: HTMLImageElement, w: number, h: number, transparent: boolean): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  if (!transparent) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

/** Detect whether the drawn image actually uses alpha transparency. */
function hasAlpha(img: HTMLImageElement): boolean {
  try {
    const sample = 48;
    const canvas = document.createElement('canvas');
    canvas.width = sample;
    canvas.height = sample;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.clearRect(0, 0, sample, sample);
    ctx.drawImage(img, 0, 0, sample, sample);
    const { data } = ctx.getImageData(0, 0, sample, sample);
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function renameExt(name: string, ext: string): string {
  const base = (name || 'image').replace(/\.[^.]+$/, '');
  return `${base}.${ext}`;
}

async function supportsWebP(): Promise<boolean> {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const blob = await toBlob(canvas, 'image/webp', 0.8);
  return !!blob && blob.type === 'image/webp';
}

export interface CompressOptions {
  target?: CompressionTarget;
  maxBytes?: number;
  /** Force alpha preservation regardless of detection (brand logos). */
  preserveTransparency?: boolean;
}

/**
 * Compress an image so the result is guaranteed <= maxBytes.
 * Always re-encodes from the ORIGINAL decoded image (never recompresses output).
 */
export async function compressImageToMaxSize(
  file: File,
  options: CompressOptions = {},
): Promise<CompressionResult> {
  const target = options.target ?? 'product';
  const maxBytes = options.maxBytes ?? MAX_BYTES;

  if (!isProcessable(file)) {
    // Can't safely re-encode (SVG/GIF/etc). Accept only if already small enough.
    if (file.size <= maxBytes) {
      return {
        file,
        mimeType: file.type,
        size: file.size,
        originalSize: file.size,
        width: 0,
        height: 0,
        format: 'original',
      };
    }
    throw new CompressionError();
  }

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    throw new CompressionError();
  }

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  if (!srcW || !srcH) throw new CompressionError();

  const transparent = options.preserveTransparency ?? hasAlpha(img);
  const webp = await supportsWebP();

  // Base dimensions: never upscale, cap at the target's max dimension.
  const baseScale = Math.min(1, START_DIM[target] / Math.max(srcW, srcH));

  // Fast path: source already small enough and reasonably sized — keep as-is.
  if (file.size <= maxBytes && baseScale === 1) {
    return {
      file,
      mimeType: file.type,
      size: file.size,
      originalSize: file.size,
      width: srcW,
      height: srcH,
      format: 'original',
    };
  }

  for (const dimStep of DIM_STEPS) {
    const scale = baseScale * dimStep;
    const w = Math.max(1, Math.round(srcW * scale));
    const h = Math.max(1, Math.round(srcH * scale));
    if (Math.max(w, h) < MIN_DIM && dimStep !== DIM_STEPS[0]) break;

    const canvas = draw(img, w, h, transparent);
    if (!canvas) throw new CompressionError();

    // Lossy candidates, best quality first.
    const lossyMime = webp ? 'image/webp' : transparent ? null : 'image/jpeg';
    if (lossyMime) {
      const ext = lossyMime === 'image/webp' ? 'webp' : 'jpg';
      const format: CompressionResult['format'] = lossyMime === 'image/webp' ? 'WebP' : 'JPEG';
      for (const quality of QUALITY_STEPS) {
        const blob = await toBlob(canvas, lossyMime, quality);
        if (!blob || blob.size === 0 || blob.type !== lossyMime) break;
        if (blob.size <= maxBytes) {
          return {
            file: new File([blob], renameExt(file.name, ext), {
              type: lossyMime,
              lastModified: Date.now(),
            }),
            mimeType: lossyMime,
            size: blob.size,
            originalSize: file.size,
            width: w,
            height: h,
            format,
          };
        }
      }
    }

    // Transparent fallback when WebP is unavailable: PNG (lossless, size via dimensions).
    if (transparent && !webp) {
      const blob = await toBlob(canvas, 'image/png');
      if (blob && blob.size > 0 && blob.size <= maxBytes) {
        return {
          file: new File([blob], renameExt(file.name, 'png'), {
            type: 'image/png',
            lastModified: Date.now(),
          }),
          mimeType: 'image/png',
          size: blob.size,
          originalSize: file.size,
          width: w,
          height: h,
          format: 'PNG',
        };
      }
    }
  }

  throw new CompressionError();
}

export const COMPRESSION_FAILED_MESSAGE =
  'Foto tidak dapat dikompres hingga 50 KB. Silakan gunakan gambar dengan resolusi atau detail yang lebih sederhana.';

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}
