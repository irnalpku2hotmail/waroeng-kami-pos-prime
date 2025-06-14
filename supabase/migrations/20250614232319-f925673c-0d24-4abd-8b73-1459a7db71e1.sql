
-- Create point_exchanges table to track customer point redemptions
CREATE TABLE public.point_exchanges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  reward_id UUID NOT NULL,
  points_used INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_points_cost INTEGER NOT NULL DEFAULT 0,
  exchange_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  processed_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for point_exchanges
ALTER TABLE public.point_exchanges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view point exchanges" 
  ON public.point_exchanges 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create point exchanges" 
  ON public.point_exchanges 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update point exchanges" 
  ON public.point_exchanges 
  FOR UPDATE 
  USING (true);

-- Add some indexes for better performance
CREATE INDEX idx_point_exchanges_customer_id ON public.point_exchanges(customer_id);
CREATE INDEX idx_point_exchanges_reward_id ON public.point_exchanges(reward_id);
CREATE INDEX idx_point_exchanges_exchange_date ON public.point_exchanges(exchange_date);

-- Add foreign key constraints
ALTER TABLE public.point_exchanges 
ADD CONSTRAINT fk_point_exchanges_customer_id 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.point_exchanges 
ADD CONSTRAINT fk_point_exchanges_reward_id 
FOREIGN KEY (reward_id) REFERENCES public.rewards(id) ON DELETE CASCADE;

ALTER TABLE public.point_exchanges 
ADD CONSTRAINT fk_point_exchanges_processed_by 
FOREIGN KEY (processed_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;
