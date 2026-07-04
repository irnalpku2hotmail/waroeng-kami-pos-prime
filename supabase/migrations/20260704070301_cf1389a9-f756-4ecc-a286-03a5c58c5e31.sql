
CREATE TABLE public.stock_opname_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_opname_sessions TO authenticated;
GRANT ALL ON public.stock_opname_sessions TO service_role;

ALTER TABLE public.stock_opname_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view opname sessions" ON public.stock_opname_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role::text IN ('admin','manager','staff','cashier'))
  );

CREATE POLICY "Staff can insert opname sessions" ON public.stock_opname_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role::text IN ('admin','manager','staff'))
  );

CREATE POLICY "Staff can update opname sessions" ON public.stock_opname_sessions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role::text IN ('admin','manager','staff'))
  );

CREATE POLICY "Admin can delete opname sessions" ON public.stock_opname_sessions
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role::text IN ('admin','manager'))
  );

CREATE TRIGGER update_stock_opname_sessions_updated_at
  BEFORE UPDATE ON public.stock_opname_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.stock_opname_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.stock_opname_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  barcode TEXT,
  physical_qty NUMERIC,
  system_qty NUMERIC NOT NULL DEFAULT 0,
  variance NUMERIC GENERATED ALWAYS AS (COALESCE(physical_qty,0) - COALESCE(system_qty,0)) STORED,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  checked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, product_id)
);

CREATE INDEX idx_soi_session ON public.stock_opname_items(session_id);
CREATE INDEX idx_soi_product ON public.stock_opname_items(product_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_opname_items TO authenticated;
GRANT ALL ON public.stock_opname_items TO service_role;

ALTER TABLE public.stock_opname_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view opname items" ON public.stock_opname_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role::text IN ('admin','manager','staff','cashier'))
  );

CREATE POLICY "Staff can manage opname items" ON public.stock_opname_items
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role::text IN ('admin','manager','staff'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role::text IN ('admin','manager','staff'))
  );

CREATE TRIGGER update_stock_opname_items_updated_at
  BEFORE UPDATE ON public.stock_opname_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
