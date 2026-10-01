DROP POLICY IF EXISTS "System can insert stock movements" ON public.stock_movements;
REVOKE INSERT ON public.stock_movements FROM anon, authenticated;
GRANT ALL ON public.stock_movements TO service_role;
CREATE POLICY "Only system can insert stock movements" ON public.stock_movements FOR INSERT TO service_role WITH CHECK (true);