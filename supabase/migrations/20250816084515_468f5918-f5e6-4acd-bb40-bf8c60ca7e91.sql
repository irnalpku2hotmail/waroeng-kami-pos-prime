-- Restrict read access on transactions and transaction_items to staff or the owning customer

-- 1) TRANSACTIONS: Replace overly permissive SELECT policy
DROP POLICY IF EXISTS "Everyone can view transactions" ON public.transactions;

-- Staff can view all transactions
CREATE POLICY "Staff can view all transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'cashier'::user_role])
);

-- Customers can view their own transactions (matched by email)
CREATE POLICY "Customers can view their own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (
  customer_id = (
    SELECT c.id
    FROM public.customers c
    JOIN auth.users u ON u.id = auth.uid()
    WHERE c.email = u.email
    LIMIT 1
  )
);

-- 2) TRANSACTION_ITEMS: Replace overly permissive SELECT policy
DROP POLICY IF EXISTS "Everyone can view transaction items" ON public.transaction_items;

-- Staff can view all transaction items
CREATE POLICY "Staff can view all transaction items"
ON public.transaction_items
FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role, 'cashier'::user_role])
);

-- Customers can view their own transaction items (via their transactions)
CREATE POLICY "Customers can view their own transaction items"
ON public.transaction_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.transactions t
    JOIN auth.users u ON u.id = auth.uid()
    JOIN public.customers c ON c.email = u.email
    WHERE t.id = transaction_items.transaction_id
      AND t.customer_id = c.id
  )
);
