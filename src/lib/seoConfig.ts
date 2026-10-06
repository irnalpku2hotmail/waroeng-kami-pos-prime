// Central SEO configuration: resolves admin SEO settings (settings table) into
// safe values with fallbacks. Never returns undefined/null/"" values to tags.
// Site URL priority: VITE_SITE_URL → settings.seo_canonical_url → current origin.
// Brand priority: settings.store_name → neutral generic fallback (no hardcoded brand).

export const FALLBACK_SITE_NAME = 'Toko Online';

export const ROBOTS = {
  index: 'index,follow',
  search: 'noindex,follow',
  private: 'noindex,nofollow',
  notFound: 'noindex,follow',
} as const;

const SCHEMA_TYPES = ['Organization', 'LocalBusiness', 'Store', 'WebSite'] as const;
export type SchemaType = (typeof SCHEMA_TYPES)[number];

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
  if (!/^https?:\/\/[^\s]+$/i.test(u) || /lovable(project)?\.(app|dev|com)/i.test(u)) return '';
  return u.replace(/\/+$/, '');
};

const envSiteUrl = () => normalizeSiteUrl(str(import.meta.env.VITE_SITE_URL));
const originUrl = () => (typeof window !== 'undefined' ? window.location.origin.replace(/\/+$/, '') : '');

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
  schemaType: SchemaType;
  favicon: { url: string; type: string } | null;
}

/** Replace "{site}" placeholder with the configured store name. */
export const withSite = (text: string, siteName: string) => text.replace(/\{site\}/g, siteName);

export const resolveSeoConfig = (s: Record<string, any> | undefined): SeoConfig => {
  s = s || {};
  const siteName = str(s.store_name) || FALLBACK_SITE_NAME;
  const title = str(s.seo_title) || `${siteName} — Belanja Mudah & Berkualitas`;
  const description =
    str(s.seo_description) || `${siteName} — belanja online mudah, hemat & berkualitas. Temukan produk pilihan dengan harga terbaik.`;
  const ogImageRaw = str(s.seo_og_image);
  const robots = str(s.seo_robots);
  const tw = str(s.seo_twitter_site);
  const fav = s.favicon_url;
  const favUrl = str(fav?.url ?? fav);
  const schemaRaw = str(s.seo_schema_type);
  return {
    siteUrl: envSiteUrl() || normalizeSiteUrl(str(s.seo_canonical_url)) || originUrl(),
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
    schemaType: (SCHEMA_TYPES as readonly string[]).includes(schemaRaw) ? (schemaRaw as SchemaType) : 'Store',
    favicon: /^https:\/\//.test(favUrl) ? { url: favUrl, type: str(fav?.type) || 'image/png' } : null,
  };
};

/** Site-level JSON-LD: WebSite + business entity (per seo_schema_type), no duplicates. */
export const buildSiteJsonLd = (cfg: SeoConfig) => {
  const url = `${cfg.siteUrl}/`;
  const website: Record<string, unknown> = {
    '@type': 'WebSite', '@id': `${url}#website`, name: cfg.siteName, url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${cfg.siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
  if (cfg.schemaType === 'WebSite') return { '@context': 'https://schema.org', ...website };
  const entity: Record<string, unknown> = {
    '@type': cfg.schemaType, '@id': `${url}#org`, name: cfg.siteName, url,
    ...(cfg.favicon ? { logo: cfg.favicon.url } : {}),
    ...(cfg.ogImage ? { image: cfg.ogImage } : {}),
  };
  website.publisher = { '@id': `${url}#org` };
  return { '@context': 'https://schema.org', '@graph': [website, entity] };
};

/** Escape "<" so JSON-LD can never break out of its <script> tag. */
export const safeJsonLd = (data: unknown) => (JSON.stringify(data) ?? '{}').replace(/</g, '\\u003c');

/** BreadcrumbList JSON-LD with absolute URLs built from the dynamic site URL. */
export const buildBreadcrumbJsonLd = (cfg: SeoConfig, items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem', position: i + 1, name: it.name, item: `${cfg.siteUrl}${it.path}`,
  })),
});
