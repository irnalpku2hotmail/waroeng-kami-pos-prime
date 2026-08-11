ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_method text NOT NULL DEFAULT 'COD';

UPDATE public.orders SET delivery_method = 'COD' WHERE delivery_method IS NULL OR delivery_method NOT IN ('COD','PICKUP');

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_delivery_method_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_method_check CHECK (delivery_method IN ('COD','PICKUP'));