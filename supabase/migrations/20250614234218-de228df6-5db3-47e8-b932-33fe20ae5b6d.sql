
-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_items table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for orders table
CREATE POLICY "Users can view all orders" 
  ON public.orders 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert orders" 
  ON public.orders 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update orders" 
  ON public.orders 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete orders" 
  ON public.orders 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Create policies for order_items table
CREATE POLICY "Users can view all order items" 
  ON public.order_items 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert order items" 
  ON public.order_items 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update order items" 
  ON public.order_items 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete order items" 
  ON public.order_items 
  FOR DELETE 
  USING (auth.role() = 'authenticated');
