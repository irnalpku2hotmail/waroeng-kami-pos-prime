// Dynamic sitemap built from live data.
// No ?type → sitemap index; ?type=pages|products|categories|brands|bundles → urlset.
// Site URL: SITE_URL secret → settings.seo_canonical_url. Lovable domains are rejected.
import { createClient } from 'npm:@supabase/supabase-js@2';

const TYPES = ['pages', 'products', 'categories', 'brands', 'bundles'] as const;
const xmlHeaders = { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' };
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const norm = (u: unknown) => {
  const s = typeof u === 'string' ? u : (u as any)?.value ?? (u as any)?.url ?? '';
  const v = String(s).trim().replace(/\/+$/, '');
  return /^https?:\/\/[^\s]+$/i.test(v) && !/lovable(project)?\.(app|dev|com)/i.test(v) ? v : '';
};

Deno.serve(async (req) => {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  let site = norm(Deno.env.get('SITE_URL'));
  if (!site) {
    const { data } = await sb.from('settings').select('value').eq('key', 'seo_canonical_url').maybeSingle();
    site = norm(data?.value);
  }
  if (!site) return new Response('Site URL belum diatur (Settings → SEO → Canonical URL).', { status: 503 });

  const type = new URL(req.url).searchParams.get('type');
  const self = `${Deno.env.get('SUPABASE_URL')}/functions/v1/sitemap`;

  if (!type) {
    const body = TYPES.map((t) => `  <sitemap><loc>${esc(`${self}?type=${t}`)}</loc></sitemap>`).join('\n');
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`, { headers: xmlHeaders });
  }
  if (!(TYPES as readonly string[]).includes(type)) return new Response('Unknown type', { status: 400 });

  const urls: { loc: string; lastmod?: string }[] = [];
  if (type === 'pages') urls.push({ loc: `${site}/` });
  if (type === 'products') {
    const { data } = await sb.from('products').select('id, updated_at').eq('is_active', true).limit(45000);
    data?.forEach((r) => urls.push({ loc: `${site}/product/${r.id}`, lastmod: r.updated_at }));
  }
  if (type === 'categories' || type === 'brands') {
    const isCat = type === 'categories';
    const fk = isCat ? 'category_id' : 'brand_id';
    const { data: used } = await sb.from('products').select(fk).eq('is_active', true).not(fk, 'is', null).limit(45000);
    const ids = [...new Set((used || []).map((r: any) => r[fk]))];
    if (ids.length) {
      const q = sb.from(isCat ? 'categories' : 'product_brands').select('slug, updated_at').in('id', ids).not('slug', 'is', null).eq('is_active', true);
      const { data } = await q;
      data?.forEach((r: any) => urls.push({ loc: `${site}/${isCat ? 'category' : 'brand'}/${encodeURIComponent(r.slug)}`, lastmod: r.updated_at }));
    }
  }
  if (type === 'bundles') {
    const { data } = await sb.from('bundles').select('slug, updated_at').eq('status', 'active');
    data?.filter((r) => r.slug).forEach((r) => urls.push({ loc: `${site}/bundle/${encodeURIComponent(r.slug)}`, lastmod: r.updated_at }));
  }

  const body = urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ''}</url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`, { headers: xmlHeaders });
});
