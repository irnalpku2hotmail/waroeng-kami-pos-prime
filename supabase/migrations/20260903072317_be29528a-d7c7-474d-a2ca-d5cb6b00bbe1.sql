-- 1) Avatars bucket: enforce per-user folder ownership
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2) Document the canonical customer statistics definitions (no logic change).
COMMENT ON FUNCTION public.get_customer_summaries(uuid[]) IS
'CANONICAL per-customer statistics. total_spent = SUM(transactions.total_amount), total_transactions = COUNT(transactions), total_orders = COUNT(orders) (ALL statuses, including cancelled), total_points = customers.total_points (point ledger cache). Aggregations use separate CTEs so no join can multiply rows. Never add orders amounts to transactions amounts.';

COMMENT ON FUNCTION public.get_customer_statistics() IS
'CANONICAL global statistics; identical definitions to get_customer_summaries: total_spent/total_transactions from transactions, total_orders from orders (ALL statuses), total_points from customers.total_points. Staff/admin only.';

COMMENT ON COLUMN public.customers.total_spent IS
'LEGACY cache maintained by triggers. NOT the source of truth for UI statistics - use get_customer_summaries().total_spent instead.';

-- 3) Diagnostics (run manually; non-destructive):
--   A) duplicate transactions per order:
--      SELECT order_id, COUNT(*) FROM public.transactions WHERE order_id IS NOT NULL GROUP BY order_id HAVING COUNT(*) > 1;
--   B) delivered orders without transaction:
--      SELECT o.id FROM public.orders o LEFT JOIN public.transactions t ON t.order_id = o.id WHERE o.status = 'delivered' AND t.id IS NULL;
--   C) frontend transactions without order:
--      SELECT t.id FROM public.transactions t WHERE t.source = 'FRONTEND_ORDER' AND t.order_id IS NULL;