import { Helmet } from 'react-helmet-async';
import { useSettings } from '@/hooks/useSettings';
import { resolveSeoConfig, safeJsonLd, ROBOTS } from '@/lib/seoConfig';

interface SEOProps {
  /** Page title; omit to use the admin SEO title. */
  title?: string;
  description?: string;
  path?: string;
  robots?: string;
  image?: string | null;
  type?: 'website' | 'product';
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/** Per-route SEO engine. All defaults come from admin SEO settings. */
export const SEO = ({ title, description, path = '', robots, image, type = 'website', jsonLd }: SEOProps) => {
  const { data: settings } = useSettings();
  const cfg = resolveSeoConfig(settings);
  const t = title?.trim() || cfg.title;
  const d = description?.trim() || cfg.description;
  const url = `${cfg.siteUrl}${path}`;
  const r = robots || cfg.robots;
  const indexable = r.startsWith('index');
  const ogTitle = title ? t : cfg.ogTitle;
  const ogDesc = description ? d : cfg.ogDescription;
  const img = image && /^https:\/\//.test(image) ? image : cfg.ogImage;

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
      {jsonLd && <script type="application/ld+json">{safeJsonLd(jsonLd)}</script>}
    </Helmet>
  );
};

/** Site-wide head: favicon (from admin settings) + private-route noindex default. */
export const SiteHead = ({ isPrivate }: { isPrivate: boolean }) => {
  const { data: settings } = useSettings();
  const cfg = resolveSeoConfig(settings);
  return (
    <Helmet>
      {cfg.favicon && <link rel="icon" type={cfg.favicon.type} href={cfg.favicon.url} />}
      {isPrivate && <meta name="robots" content={ROBOTS.private} />}
    </Helmet>
  );
};

export { ROBOTS };
export default SEO;
