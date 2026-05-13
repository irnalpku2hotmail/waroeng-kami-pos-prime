/**
 * Image optimization helpers.
 * - Supabase Storage public URLs are rewritten to /render/image/public/ to
 *   leverage server-side resize + format negotiation (WebP/AVIF when
 *   browser supports it via Accept header).
 * - For non-Supabase URLs we return them as-is.
 */

const SUPABASE_HOST = "fkqfdwxunnymmsutbeuu.supabase.co";

interface OptimizeOptions {
  width?: number;
  height?: number;
  quality?: number; // 20-100
  resize?: "cover" | "contain" | "fill";
}

export function getOptimizedImageUrl(
  url: string | null | undefined,
  opts: OptimizeOptions = {}
): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.host !== SUPABASE_HOST) return url;
    if (!u.pathname.includes("/storage/v1/object/public/")) return url;

    const transformedPath = u.pathname.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    );

    const params = new URLSearchParams();
    if (opts.width) params.set("width", String(opts.width));
    if (opts.height) params.set("height", String(opts.height));
    params.set("quality", String(opts.quality ?? 70));
    params.set("resize", opts.resize ?? "cover");

    return `${u.origin}${transformedPath}?${params.toString()}`;
  } catch {
    return url;
  }
}
