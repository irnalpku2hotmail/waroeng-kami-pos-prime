CREATE OR REPLACE FUNCTION public.slugify(_t text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT trim(both '-' from regexp_replace(lower(coalesce(_t,'')), '[^a-z0-9]+', '-', 'g'))
$$;

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.product_brands ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION public.set_unique_slug() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base text; cand text; i int := 1; taken boolean;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.slug IS NOT NULL AND NEW.slug <> '' AND NEW.name = OLD.name THEN RETURN NEW; END IF;
  base := nullif(public.slugify(NEW.name), '');
  IF base IS NULL THEN base := left(NEW.id::text, 8); END IF;
  cand := base;
  LOOP
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I.%I WHERE slug = $1 AND id <> $2)', TG_TABLE_SCHEMA, TG_TABLE_NAME)
      INTO taken USING cand, NEW.id;
    EXIT WHEN NOT taken;
    i := i + 1; cand := base || '-' || i;
  END LOOP;
  NEW.slug := cand;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS categories_set_slug ON public.categories;
CREATE TRIGGER categories_set_slug BEFORE INSERT OR UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_unique_slug();
DROP TRIGGER IF EXISTS product_brands_set_slug ON public.product_brands;
CREATE TRIGGER product_brands_set_slug BEFORE INSERT OR UPDATE ON public.product_brands FOR EACH ROW EXECUTE FUNCTION public.set_unique_slug();

UPDATE public.categories SET slug = NULL WHERE slug IS NULL;
UPDATE public.product_brands SET slug = NULL WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_key ON public.categories(slug);
CREATE UNIQUE INDEX IF NOT EXISTS product_brands_slug_key ON public.product_brands(slug);