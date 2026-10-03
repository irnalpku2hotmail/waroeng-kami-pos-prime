// Central SEO configuration: resolves admin SEO settings (settings table) into
// safe values with fallbacks. Never returns undefined/null/"" values to tags.

export const FALLBACK_SITE_URL = 'https://tinggalklik.lovable.app';
export const FALLBACK_SITE_NAME = 'LAPAU.ID';
export const FALLBACK_TITLE = 'LAPAU.ID — Marketplace Belanja Mudah & Berkualitas';
export const FALLBACK_DESCRIPTION =
  'LAPAU.ID — marketplace belanja online mudah, hemat & berkualitas dengan gratis ongkir ke seluruh Indonesia. Temukan ribuan produk pilihan.';

export const ROBOTS = {
  index: 'index,follow',
  search: 'noindex,follow',
  private: 'noindex,nofollow',
  notFound: 'noindex,follow',
} as const;

const str = (v: unknown): string => {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    for (const k of ['value', 'name', 'url', 'text']) if (typeof o[k] === 'string') return (o[k] as string).trim();
  }
  return '';
};

const isLovableAsset = (u: string) => /lovable\.dev\/opengraph|lovable_dev/i.test(u);

const normalizeSiteUrl = (u: string) => {
  if (!/^https:\/\/[^\s]+$/i.test(u)) return '';
  // Never canonicalize to Lovable preview domains
  if (/id-preview--|lovableproject\.com/i.test(u)) return '';
  return u.replace(/\/+$/, '');
};

export interface SeoConfig {
  siteUrl: string;
  siteName: string;
  title: string;
  description: string;
  keywords: string;
  author: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  twitterSite: string;
  schemaType: string;
  favicon: { url: string; type: string } | null;
}

export const resolveSeoConfig = (s: Record<string, any> | undefined): SeoConfig => {
  s = s || {};
  const siteName = str(s.store_name) || FALLBACK_SITE_NAME;
  const title = str(s.seo_title) || (str(s.store_name) ? `${siteName}` : FALLBACK_TITLE);
  const description = str(s.seo_description) || FALLBACK_DESCRIPTION;
  const ogImageRaw = str(s.seo_og_image);
  const robots = str(s.seo_robots);
  const tw = str(s.seo_twitter_site);
  const fav = s.favicon_url;
  const favUrl = str(fav?.url ?? fav);
  return {
    siteUrl: normalizeSiteUrl(str(s.seo_canonical_url)) || FALLBACK_SITE_URL,
    siteName,
    title,
    description,
    keywords: str(s.seo_keywords),
    author: str(s.seo_author) || siteName,
    robots: /^(no)?index,(no)?follow$/.test(robots) ? robots : ROBOTS.index,
    ogTitle: str(s.seo_og_title) || title,
    ogDescription: str(s.seo_og_description) || description,
    ogImage: /^https:\/\//.test(ogImageRaw) && !isLovableAsset(ogImageRaw) ? ogImageRaw : '',
    twitterCard: str(s.seo_twitter_card) || 'summary_large_image',
    twitterSite: /^@?\w{1,15}$/.test(tw) && !/lovable/i.test(tw) ? (tw.startsWith('@') ? tw : `@${tw}`) : '',
    schemaType: str(s.seo_schema_type) || 'Store',
    favicon: /^https:\/\//.test(favUrl)
      ? { url: favUrl, type: str(fav?.type) || 'image/png' }
      : null,
  };
};

/** Escape "<" so JSON-LD can never break out of its <script> tag. */
export const safeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
