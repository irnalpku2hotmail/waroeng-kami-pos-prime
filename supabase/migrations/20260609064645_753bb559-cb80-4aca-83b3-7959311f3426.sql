
-- 1) Reward redemption requests table (approval workflow)
CREATE TABLE IF NOT EXISTS public.reward_redemption_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES public.rewards(id) ON DELETE RESTRICT,
  points_used integer NOT NULL CHECK (points_used >= 0),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','completed')),
  notes text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.reward_redemption_requests TO authenticated;
GRANT ALL ON public.reward_redemption_requests TO service_role;

ALTER TABLE public.reward_redemption_requests ENABLE ROW LEVEL SECURITY;

-- Customer can read their own requests (linked via customers.profile_id = auth.uid())
CREATE POLICY "rrr_select_own"
  ON public.reward_redemption_requests FOR SELECT
  TO authenticated
  USING (
    customer_id IN (SELECT id FROM public.customers WHERE profile_id = auth.uid())
  );

-- Staff/admin can read all
CREATE POLICY "rrr_select_staff"
  ON public.reward_redemption_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','manager','staff','cashier'))
  );

-- Customer can insert their own pending requests
CREATE POLICY "rrr_insert_own"
  ON public.reward_redemption_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    status = 'pending'
    AND customer_id IN (SELECT id FROM public.customers WHERE profile_id = auth.uid())
  );

-- Staff/admin can update (approve/reject)
CREATE POLICY "rrr_update_staff"
  ON public.reward_redemption_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','manager','staff','cashier'))
  );

CREATE INDEX IF NOT EXISTS rrr_status_idx ON public.reward_redemption_requests(status, requested_at DESC);
CREATE INDEX IF NOT EXISTS rrr_customer_idx ON public.reward_redemption_requests(customer_id, requested_at DESC);

CREATE TRIGGER rrr_set_updated_at
  BEFORE UPDATE ON public.reward_redemption_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Approve function: atomic deduction of points + reward stock + log
CREATE OR REPLACE FUNCTION public.approve_reward_redemption(p_request_id uuid, p_review_notes text DEFAULT NULL)
RETURNS public.reward_redemption_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.reward_redemption_requests;
  v_customer_points integer;
  v_reward_stock integer;
  v_user_role text;
BEGIN
  -- Authorization: only staff/admin
  SELECT role::text INTO v_user_role FROM public.profiles WHERE id = auth.uid();
  IF v_user_role NOT IN ('admin','manager','staff','cashier') THEN
    RAISE EXCEPTION 'Not authorized to approve redemptions';
  END IF;

  SELECT * INTO v_req FROM public.reward_redemption_requests
    WHERE id = p_request_id FOR UPDATE;

  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request already %', v_req.status;
  END IF;

  -- Validate points and stock at approval time
  SELECT total_points INTO v_customer_points FROM public.customers WHERE id = v_req.customer_id FOR UPDATE;
  IF COALESCE(v_customer_points,0) < v_req.points_used THEN
    RAISE EXCEPTION 'Customer does not have enough points';
  END IF;

  SELECT stock_quantity INTO v_reward_stock FROM public.rewards WHERE id = v_req.reward_id FOR UPDATE;
  IF COALESCE(v_reward_stock,0) < v_req.quantity THEN
    RAISE EXCEPTION 'Reward stock insufficient';
  END IF;

  -- Deduct points and stock
  UPDATE public.customers SET total_points = total_points - v_req.points_used WHERE id = v_req.customer_id;
  UPDATE public.rewards SET stock_quantity = stock_quantity - v_req.quantity WHERE id = v_req.reward_id;

  -- Log point transaction
  INSERT INTO public.point_transactions (customer_id, reward_id, points_change, description)
  VALUES (v_req.customer_id, v_req.reward_id, -v_req.points_used, 'Penukaran reward (approved)');

  -- Record in point_exchanges for historical view
  INSERT INTO public.point_exchanges (customer_id, reward_id, points_used, quantity, total_points_cost, status, processed_by, notes)
  VALUES (v_req.customer_id, v_req.reward_id, v_req.points_used, v_req.quantity, v_req.points_used, 'completed', auth.uid(), p_review_notes);

  -- Update request status
  UPDATE public.reward_redemption_requests
    SET status = 'approved',
        reviewed_at = now(),
        reviewed_by = auth.uid(),
        review_notes = p_review_notes
    WHERE id = p_request_id
    RETURNING * INTO v_req;

  RETURN v_req;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_reward_redemption(uuid, text) TO authenticated;

-- 3) Reject function (poin & stok tidak disentuh)
CREATE OR REPLACE FUNCTION public.reject_reward_redemption(p_request_id uuid, p_review_notes text DEFAULT NULL)
RETURNS public.reward_redemption_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.reward_redemption_requests;
  v_user_role text;
BEGIN
  SELECT role::text INTO v_user_role FROM public.profiles WHERE id = auth.uid();
  IF v_user_role NOT IN ('admin','manager','staff','cashier') THEN
    RAISE EXCEPTION 'Not authorized to reject redemptions';
  END IF;

  SELECT * INTO v_req FROM public.reward_redemption_requests WHERE id = p_request_id FOR UPDATE;
  IF v_req.id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_req.status <> 'pending' THEN RAISE EXCEPTION 'Request already %', v_req.status; END IF;

  UPDATE public.reward_redemption_requests
    SET status='rejected', reviewed_at=now(), reviewed_by=auth.uid(), review_notes=p_review_notes
    WHERE id = p_request_id RETURNING * INTO v_req;

  RETURN v_req;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_reward_redemption(uuid, text) TO authenticated;
