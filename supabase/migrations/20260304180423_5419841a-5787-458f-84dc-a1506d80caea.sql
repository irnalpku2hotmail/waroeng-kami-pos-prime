
-- Bundle deals table
CREATE TABLE public.bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  bundle_type text NOT NULL DEFAULT 'fixed',
  status text NOT NULL DEFAULT 'draft',
  discount_price numeric NOT NULL DEFAULT 0,
  original_price numeric NOT NULL DEFAULT 0,
  savings_amount numeric GENERATED ALWAYS AS (original_price - discount_price) STORED,
  savings_percentage numeric GENERATED ALWAYS AS (
    CASE WHEN original_price > 0 THEN ROUND(((original_price - discount_price) / original_price) * 100, 1) ELSE 0 END
  ) STORED,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Bundle items (products in a bundle)
CREATE TABLE public.bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(bundle_id, product_id)
);

-- Enable RLS
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bundles
CREATE POLICY "Everyone can view active bundles" ON public.bundles
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage bundles" ON public.bundles
  FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]));

-- RLS Policies for bundle_items
CREATE POLICY "Everyone can view bundle items" ON public.bundle_items
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage bundle items" ON public.bundle_items
  FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]));

-- Trigger to update updated_at
CREATE TRIGGER update_bundles_updated_at
  BEFORE UPDATE ON public.bundles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
