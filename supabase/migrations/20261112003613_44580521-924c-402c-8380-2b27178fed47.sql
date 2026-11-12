DROP POLICY IF EXISTS "Everyone can view stock adjustments" ON public.stock_adjustments;
CREATE POLICY "Store staff can view stock adjustments"
ON public.stock_adjustments
FOR SELECT
TO authenticated
USING (public.is_staff_user());