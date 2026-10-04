import { Helmet } from 'react-helmet-async';
import { useSettings } from '@/hooks/useSettings';
import { resolveSeoConfig, safeJsonLd, withSite, ROBOTS, type SeoConfig } from '@/lib/seoConfig';

type JsonLd = Record<string, unknown> | Record<string, unknown>[];

interface SEOProps {
  /** Page title (may contain "{site}"); omit to use the admin SEO title. Store name is appended automatically. */
  title?: string;
  description?: string;
  path?: string;
  robots?: string;
  image?: string | null;
  type?: 'website' | 'product';
  /** Static JSON-LD or a builder receiving the central SEO config. */
  jsonLd?: JsonLd | ((cfg: SeoConfig) => JsonLd | undefined);
}

/** Per-route SEO engine. All defaults come from admin SEO settings. */
export const SEO = ({ title, description, path = '', robots, image, type = 'website', jsonLd }: SEOProps) => {
  const { data: settings } = useSettings();
  const cfg = resolveSeoConfig(settings);
  const pageTitle = title?.trim() ? withSite(title.trim(), cfg.siteName) : '';
  const t = pageTitle ? (pageTitle.includes(cfg.siteName) ? pageTitle : `${pageTitle} — ${cfg.siteName}`) : cfg.title;
  const d = description?.trim() ? withSite(description.trim(), cfg.siteName) : cfg.description;
  const url = `${cfg.siteUrl}${path}`;
  const r = robots || cfg.robots;
  const indexable = r.startsWith('index');
  const ogTitle = title ? t : cfg.ogTitle;
  const ogDesc = description ? d : cfg.ogDescription;
  const img = image && /^https:\/\//.test(image) ? image : cfg.ogImage;
  const ld = typeof jsonLd === 'function' ? jsonLd(cfg) : jsonLd;


  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description" content={d} />
      <meta name="robots" content={r} />
      {cfg.keywords && <meta name="keywords" content={cfg.keywords} />}
      <meta name="author" content={cfg.author} />
      {indexable && <link rel="canonical" href={url} />}
      <meta property="og:site_name" content={cfg.siteName} />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      {img && <meta property="og:image" content={img} />}
      <meta name="twitter:card" content={cfg.twitterCard} />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDesc} />
      {img && <meta name="twitter:image" content={img} />}
      {cfg.twitterSite && <meta name="twitter:site" content={cfg.twitterSite} />}
      {ld && <script type="application/ld+json">{safeJsonLd(ld)}</script>}
    </Helmet>
  );
};

/** Site-wide head: favicon (from admin settings) + private-route noindex default. */
export const SiteHead = ({ isPrivate }: { isPrivate: boolean }) => {
  const { data: settings } = useSettings();
  const cfg = resolveSeoConfig(settings);
  return (
    <Helmet>
      {cfg.favicon
        ? <link rel="icon" type={cfg.favicon.type} href={cfg.favicon.url} />
        : <link rel="icon" type="image/x-icon" href="/favicon.ico" />}
      {isPrivate && <meta name="robots" content={ROBOTS.private} />}
    </Helmet>
  );
};

export { ROBOTS };
export default SEO;
