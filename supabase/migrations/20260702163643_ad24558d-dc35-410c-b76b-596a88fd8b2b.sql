
-- Buyers can view their own customer row (linked via profile_id)
CREATE POLICY "Customers can view own record"
  ON public.customers FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid() OR customer_owns_transaction(id));

-- Buyers can view their own transactions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transactions'
      AND policyname='Customers can view own transactions'
  ) THEN
    CREATE POLICY "Customers can view own transactions"
      ON public.transactions FOR SELECT
      TO authenticated
      USING (customer_id IS NOT NULL AND customer_owns_transaction(customer_id));
  END IF;
END $$;

-- Buyers can view items of their own transactions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transaction_items'
      AND policyname='Customers can view own transaction items'
  ) THEN
    CREATE POLICY "Customers can view own transaction items"
      ON public.transaction_items FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.transactions t
        WHERE t.id = transaction_items.transaction_id
          AND t.customer_id IS NOT NULL
          AND customer_owns_transaction(t.customer_id)
      ));
  END IF;
END $$;
