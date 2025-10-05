-- Create security definer function to check if customer owns transaction
CREATE OR REPLACE FUNCTION public.customer_owns_transaction(transaction_customer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM customers c
    WHERE c.id = transaction_customer_id
      AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
  )
$$;

-- Drop the old policy that accesses auth.users directly
DROP POLICY IF EXISTS "Customers can view their own transactions" ON public.transactions;

-- Create new policy using security definer function
CREATE POLICY "Customers can view their own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (
  customer_owns_transaction(customer_id)
);