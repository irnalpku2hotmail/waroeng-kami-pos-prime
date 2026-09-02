DROP POLICY IF EXISTS "Everyone can view point transactions" ON public.point_transactions;
CREATE POLICY "Staff or owner can view point transactions"
ON public.point_transactions FOR SELECT TO authenticated
USING (
  public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::public.user_role,'manager'::public.user_role,'staff'::public.user_role,'cashier'::public.user_role])
  OR public.customer_owns_transaction(customer_id)
);

DROP POLICY IF EXISTS "Everyone can view customer return items" ON public.customer_return_items;
CREATE POLICY "Staff or owner can view customer return items"
ON public.customer_return_items FOR SELECT TO authenticated
USING (
  public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::public.user_role,'manager'::public.user_role,'staff'::public.user_role,'cashier'::public.user_role])
  OR EXISTS (
    SELECT 1 FROM public.customer_returns cr
    WHERE cr.id = customer_return_items.customer_return_id
      AND public.customer_owns_transaction(cr.customer_id)
  )
);

DROP POLICY IF EXISTS "Authenticated users can upload expense receipts" ON storage.objects;
