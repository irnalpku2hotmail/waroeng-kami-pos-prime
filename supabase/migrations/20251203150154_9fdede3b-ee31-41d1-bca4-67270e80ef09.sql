-- Create price_history table to track product price changes
CREATE TABLE public.price_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  old_price numeric NOT NULL,
  new_price numeric NOT NULL,
  changed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Everyone can view price history
CREATE POLICY "Everyone can view price history" 
ON public.price_history 
FOR SELECT 
USING (true);

-- Staff can insert price history
CREATE POLICY "Staff can insert price history" 
ON public.price_history 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'staff'::user_role]));

-- Create user_notifications table for in-app notifications
CREATE TABLE public.user_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.user_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" 
ON public.user_notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
ON public.user_notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications" 
ON public.user_notifications 
FOR INSERT 
WITH CHECK (true);

-- Create function to handle price change notifications
CREATE OR REPLACE FUNCTION public.handle_product_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger if selling_price actually changed and decreased
  IF OLD.selling_price IS DISTINCT FROM NEW.selling_price AND NEW.selling_price < OLD.selling_price THEN
    -- Insert price history record
    INSERT INTO price_history (product_id, old_price, new_price)
    VALUES (NEW.id, OLD.selling_price, NEW.selling_price);
    
    -- Create notifications for users who have this product in their wishlist
    INSERT INTO user_notifications (user_id, title, message, type, product_id)
    SELECT 
      upl.user_id,
      'Harga Turun! 🎉',
      'Produk "' || NEW.name || '" turun dari Rp ' || TO_CHAR(OLD.selling_price, 'FM999,999,999') || ' menjadi Rp ' || TO_CHAR(NEW.selling_price, 'FM999,999,999'),
      'price_drop',
      NEW.id
    FROM user_product_likes upl
    WHERE upl.product_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for price changes
CREATE TRIGGER on_product_price_change
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_product_price_change();

-- Create index for faster queries
CREATE INDEX idx_price_history_product_id ON public.price_history(product_id);
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_is_read ON public.user_notifications(is_read);