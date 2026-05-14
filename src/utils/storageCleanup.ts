import { supabase } from '@/integrations/supabase/client';

/**
 * Centralized Supabase Storage cleanup utility.
 *
 * Parses a Supabase public/render URL and removes the underlying object
 * from the appropriate bucket. All operations are best-effort: failures
 * are logged but never thrown, so DB delete flows continue safely even
 * if the file is already missing or storage is temporarily unavailable.
 */

export interface ParsedStorageUrl {
  bucket: string;
  path: string;
}

/**
 * Parse a Supabase storage URL into { bucket, path }.
 * Supports both /object/public/<bucket>/<path> and
 * /render/image/public/<bucket>/<path> formats.
 */
export function parseStorageUrl(url: string | null | undefined): ParsedStorageUrl | null {
  if (!url || typeof url !== 'string') return null;
  try {
    const u = new URL(url);
    // Match either /storage/v1/object/public/<bucket>/<path>
    // or /storage/v1/render/image/public/<bucket>/<path>
    const m = u.pathname.match(/\/storage\/v1\/(?:object|render\/image)\/public\/([^/]+)\/(.+)$/);
    if (!m) return null;
    const bucket = decodeURIComponent(m[1]);
    const path = decodeURIComponent(m[2]);
    if (!bucket || !path) return null;
    return { bucket, path };
  } catch {
    return null;
  }
}

/**
 * Remove a single file from Supabase Storage given its public URL.
 * Never throws — returns true on success, false otherwise.
 */
export async function deleteStorageFileByUrl(url: string | null | undefined): Promise<boolean> {
  const parsed = parseStorageUrl(url);
  if (!parsed) return false;
  try {
    const { error } = await supabase.storage.from(parsed.bucket).remove([parsed.path]);
    if (error) {
      console.warn('[storageCleanup] remove failed:', parsed, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[storageCleanup] remove threw:', err);
    return false;
  }
}

/**
 * Remove multiple files (possibly across different buckets) given a list of URLs.
 * Groups by bucket to minimize round-trips. Always resolves; never throws.
 */
export async function deleteStorageFilesByUrls(
  urls: Array<string | null | undefined>
): Promise<void> {
  const grouped = new Map<string, string[]>();
  for (const u of urls) {
    const parsed = parseStorageUrl(u);
    if (!parsed) continue;
    const arr = grouped.get(parsed.bucket) ?? [];
    arr.push(parsed.path);
    grouped.set(parsed.bucket, arr);
  }
  await Promise.all(
    Array.from(grouped.entries()).map(async ([bucket, paths]) => {
      try {
        const { error } = await supabase.storage.from(bucket).remove(paths);
        if (error) console.warn('[storageCleanup] batch remove failed:', bucket, error.message);
      } catch (err) {
        console.warn('[storageCleanup] batch remove threw:', err);
      }
    })
  );
}

/**
 * Fire-and-forget variant: schedules deletion without blocking the caller.
 * Useful right after a DB row delete to keep the UI snappy.
 */
export function deleteStorageFileByUrlAsync(url: string | null | undefined): void {
  void deleteStorageFileByUrl(url);
}

export function deleteStorageFilesByUrlsAsync(urls: Array<string | null | undefined>): void {
  void deleteStorageFilesByUrls(urls);
}