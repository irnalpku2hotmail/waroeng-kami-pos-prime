import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SEO, { ROBOTS } from '@/components/SEO';
import { buildBreadcrumbJsonLd } from '@/lib/seoConfig';
import ProductCardSmall from '@/components/home/ProductCardSmall';
import MinimalFooter from '@/components/frontend/MinimalFooter';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

type Kind = 'category' | 'brand';

/** Public SEO landing page for a category (/category/:slug) or brand (/brand/:slug). */
const CatalogPage = ({ kind }: { kind: Kind }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['catalog-page', kind, slug],
    enabled: !!slug,
    queryFn: async () => {
      const table = kind === 'category' ? 'categories' : 'product_brands';
      let q = (supabase.from(table as any) as any).select('*').eq('slug', slug);
      q = q.eq('is_active', true);
      const { data: entity } = await q.maybeSingle();
      if (!entity) return null;
      const { data: products } = await supabase
        .from('products')
        .select('id, name, selling_price, current_stock, image_url')
        .eq(kind === 'category' ? 'category_id' : 'brand_id', entity.id)
        .eq('is_active', true)
        .order('name')
        .limit(200);
      return { entity, products: products || [] };
    },
  });

  const label = kind === 'category' ? 'Kategori' : 'Brand';
  const path = `/${kind}/${slug}`;
  const entity: any = data?.entity;
  const products = data?.products || [];
  const indexable = !!entity && products.length > 0;
  const desc = entity?.description
    ? String(entity.description).slice(0, 155)
    : entity ? `Belanja produk ${label.toLowerCase()} ${entity.name} di {site}. ${products.length} produk tersedia dengan harga terbaik.` : undefined;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={entity ? `${entity.name} — ${label}` : label}
        description={desc}
        path={path}
        robots={isLoading ? undefined : indexable ? ROBOTS.index : ROBOTS.notFound}
        image={kind === 'category' ? entity?.icon_url : entity?.logo_url}
        jsonLd={entity ? (cfg) => buildBreadcrumbJsonLd(cfg, [
          { name: 'Beranda', path: '/' },
          { name: entity.name, path },
        ]) : undefined}
      />
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Kembali"><ArrowLeft className="h-5 w-5" /></button>
          <Link to="/" className="text-sm font-semibold">Beranda</Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-4">
        {isLoading ? (
          <Skeleton className="h-8 w-48 mb-4" />
        ) : !entity ? (
          <p className="py-16 text-center text-muted-foreground">{label} tidak ditemukan.</p>
        ) : (
          <>
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-2">
              <Link to="/">Beranda</Link> / <span>{entity.name}</span>
            </nav>
            <h1 className="text-xl font-bold mb-1">{entity.name}</h1>
            {entity.description && <p className="text-sm text-muted-foreground mb-4">{entity.description}</p>}
            {products.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">Belum ada produk.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {products.map((p: any) => (
                  <ProductCardSmall key={p.id} product={p} onProductClick={(id) => navigate(`/product/${id}`)} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <MinimalFooter />
    </div>
  );
};

export default CatalogPage;
