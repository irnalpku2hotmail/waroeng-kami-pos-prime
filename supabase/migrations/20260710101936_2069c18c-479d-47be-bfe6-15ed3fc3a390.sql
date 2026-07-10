
-- 1. Add lock columns
ALTER TABLE public.stock_opname_sessions
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by uuid;

-- Backfill: any session already in review/approved/closed is locked
UPDATE public.stock_opname_sessions
SET is_locked = true, locked_at = COALESCE(locked_at, updated_at, now())
WHERE status IN ('review','approved','closed') AND is_locked = false;

-- 2. Auto-lock trigger based on status transitions
CREATE OR REPLACE FUNCTION public.stock_opname_auto_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('review','approved','closed') THEN
    IF COALESCE(OLD.is_locked, false) = false THEN
      NEW.is_locked := true;
      NEW.locked_at := now();
      NEW.locked_by := COALESCE(NEW.locked_by, auth.uid());
    END IF;
  ELSIF NEW.status IN ('draft','in_progress') THEN
    -- Reopen: clear lock when session returns to editable state
    NEW.is_locked := false;
    NEW.locked_at := NULL;
    NEW.locked_by := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stock_opname_auto_lock ON public.stock_opname_sessions;
CREATE TRIGGER trg_stock_opname_auto_lock
  BEFORE UPDATE OF status ON public.stock_opname_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.stock_opname_auto_lock();

-- 3. Block item edits when parent session is locked
CREATE OR REPLACE FUNCTION public.stock_opname_items_guard_locked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_locked boolean;
  v_status text;
BEGIN
  SELECT is_locked, status INTO v_locked, v_status
    FROM public.stock_opname_sessions
   WHERE id = COALESCE(NEW.session_id, OLD.session_id);

  IF v_locked THEN
    RAISE EXCEPTION 'Sesi Stock Opname terkunci (status: %). Buka kunci terlebih dahulu untuk mengubah item.', v_status
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_stock_opname_items_guard ON public.stock_opname_items;
CREATE TRIGGER trg_stock_opname_items_guard
  BEFORE UPDATE OR DELETE ON public.stock_opname_items
  FOR EACH ROW
  EXECUTE FUNCTION public.stock_opname_items_guard_locked();

-- 4. RLS: only admin/manager may manually flip is_locked via direct update
-- (Trigger already handles auto-locking on status change with SECURITY DEFINER.)
CREATE OR REPLACE FUNCTION public.can_manage_opname_lock(_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
     WHERE id = _user AND role IN ('admin','manager')
  );
$$;
