
-- Add tags column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create GIN index for tags array search
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING GIN(tags);

-- Create trigram index on product name for fuzzy search
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING GIN(name gin_trgm_ops);

-- Create trigram index on tags for fuzzy search  
CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON public.products USING GIN(description gin_trgm_ops);

-- Create enhanced search function with relevance scoring and typo tolerance
CREATE OR REPLACE FUNCTION public.search_products_ranked(
  search_term text,
  category_filter uuid DEFAULT NULL,
  brand_filter uuid DEFAULT NULL,
  min_price numeric DEFAULT NULL,
  max_price numeric DEFAULT NULL,
  max_results integer DEFAULT 100
)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  selling_price numeric,
  current_stock integer,
  image_url text,
  category_id uuid,
  brand_id uuid,
  tags text[],
  barcode text,
  base_price numeric,
  is_active boolean,
  min_quantity integer,
  loyalty_points integer,
  has_service_fee boolean,
  relevance_score numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
  search_words text[];
  word text;
BEGIN
  -- Split search term into words
  search_words := string_to_array(lower(trim(search_term)), ' ');
  
  RETURN QUERY
  WITH scored AS (
    SELECT 
      p.id,
      p.name,
      p.description,
      p.selling_price,
      p.current_stock,
      p.image_url,
      p.category_id,
      p.brand_id,
      p.tags,
      p.barcode,
      p.base_price,
      p.is_active,
      p.min_quantity,
      p.loyalty_points,
      p.has_service_fee,
      (
        -- Exact name match
        CASE WHEN lower(p.name) = lower(search_term) THEN 100 ELSE 0 END
        -- Partial name match (ilike)
        + CASE WHEN lower(p.name) LIKE '%' || lower(search_term) || '%' THEN 70 ELSE 0 END
        -- Tag match
        + CASE WHEN p.tags IS NOT NULL AND EXISTS (
            SELECT 1 FROM unnest(p.tags) t 
            WHERE t LIKE '%' || lower(search_term) || '%'
          ) THEN 50 ELSE 0 END
        -- Description match
        + CASE WHEN p.description IS NOT NULL AND lower(p.description) LIKE '%' || lower(search_term) || '%' THEN 30 ELSE 0 END
        -- Category name match
        + CASE WHEN EXISTS (
            SELECT 1 FROM categories c 
            WHERE c.id = p.category_id AND lower(c.name) LIKE '%' || lower(search_term) || '%'
          ) THEN 20 ELSE 0 END
        -- Per-word scoring for multi-word queries
        + (
          SELECT COALESCE(SUM(
            CASE WHEN lower(p.name) LIKE '%' || w || '%' THEN 15 ELSE 0 END
            + CASE WHEN p.tags IS NOT NULL AND EXISTS (
                SELECT 1 FROM unnest(p.tags) t WHERE t LIKE '%' || w || '%'
              ) THEN 10 ELSE 0 END
          ), 0)
          FROM unnest(search_words) w
          WHERE w != lower(search_term)
        )
        -- Fuzzy name match (typo tolerance)
        + CASE WHEN similarity(p.name, search_term) > 0.2 THEN 
            (similarity(p.name, search_term) * 40)::numeric ELSE 0 END
        -- Fuzzy tag match
        + CASE WHEN p.tags IS NOT NULL AND EXISTS (
            SELECT 1 FROM unnest(p.tags) t 
            WHERE similarity(t, lower(search_term)) > 0.3
          ) THEN 25 ELSE 0 END
        -- Stock bonus
        + CASE WHEN p.current_stock > 10 THEN 5 ELSE 0 END
      )::numeric as relevance_score
    FROM products p
    WHERE p.is_active = true
      AND (category_filter IS NULL OR p.category_id = category_filter)
      AND (brand_filter IS NULL OR p.brand_id = brand_filter)
      AND (min_price IS NULL OR p.selling_price >= min_price)
      AND (max_price IS NULL OR p.selling_price <= max_price)
      AND (
        lower(p.name) LIKE '%' || lower(search_term) || '%'
        OR (p.description IS NOT NULL AND lower(p.description) LIKE '%' || lower(search_term) || '%')
        OR (p.tags IS NOT NULL AND EXISTS (
          SELECT 1 FROM unnest(p.tags) t WHERE t LIKE '%' || lower(search_term) || '%'
        ))
        OR similarity(p.name, search_term) > 0.2
        OR (p.tags IS NOT NULL AND EXISTS (
          SELECT 1 FROM unnest(p.tags) t WHERE similarity(t, lower(search_term)) > 0.3
        ))
        OR EXISTS (
          SELECT 1 FROM categories c 
          WHERE c.id = p.category_id AND lower(c.name) LIKE '%' || lower(search_term) || '%'
        )
        OR EXISTS (
          SELECT 1 FROM unnest(search_words) w
          WHERE lower(p.name) LIKE '%' || w || '%'
            OR (p.tags IS NOT NULL AND EXISTS (
              SELECT 1 FROM unnest(p.tags) t WHERE t LIKE '%' || w || '%'
            ))
        )
      )
  )
  SELECT * FROM scored
  WHERE scored.relevance_score > 0
  ORDER BY scored.relevance_score DESC, scored.current_stock DESC, scored.name ASC
  LIMIT max_results;
END;
$$;
