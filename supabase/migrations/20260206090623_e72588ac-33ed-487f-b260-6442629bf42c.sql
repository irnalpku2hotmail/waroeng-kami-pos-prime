-- Add has_service_fee column to products table
ALTER TABLE public.products 
ADD COLUMN has_service_fee BOOLEAN NOT NULL DEFAULT false;