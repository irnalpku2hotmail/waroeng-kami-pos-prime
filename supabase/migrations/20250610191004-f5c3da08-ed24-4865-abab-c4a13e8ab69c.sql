
-- Create enums
CREATE TYPE public.transaction_type AS ENUM ('cash', 'transfer', 'credit');
CREATE TYPE public.user_role AS ENUM ('admin', 'cashier', 'manager', 'staff');
CREATE TYPE public.adjustment_type AS ENUM ('increase', 'decrease', 'correction');
CREATE TYPE public.expense_category AS ENUM ('operational', 'maintenance', 'utilities', 'supplies', 'other');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create units table
CREATE TABLE public.units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  abbreviation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  barcode TEXT UNIQUE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  base_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 1,
  tier1_quantity INTEGER DEFAULT 0,
  tier1_price DECIMAL(12,2) DEFAULT 0,
  tier2_quantity INTEGER DEFAULT 0,
  tier2_price DECIMAL(12,2) DEFAULT 0,
  tier3_quantity INTEGER DEFAULT 0,
  tier3_price DECIMAL(12,2) DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 10,
  current_stock INTEGER NOT NULL DEFAULT 0,
  loyalty_points INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  date_of_birth DATE,
  total_points INTEGER NOT NULL DEFAULT 0,
  total_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
  member_card_url TEXT,
  qr_code_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  cashier_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  points_used INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  payment_type transaction_type NOT NULL DEFAULT 'cash',
  payment_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  change_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_credit BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transaction_items table
CREATE TABLE public.transaction_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchases table
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_items table
CREATE TABLE public.purchase_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create returns table
CREATE TABLE public.returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create return_items table
CREATE TABLE public.return_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_id UUID REFERENCES public.returns(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock_adjustments table
CREATE TABLE public.stock_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  adjustment_type adjustment_type NOT NULL,
  quantity_change INTEGER NOT NULL DEFAULT 0,
  previous_stock INTEGER NOT NULL DEFAULT 0,
  new_stock INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category expense_category NOT NULL DEFAULT 'operational',
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  receipt_url TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rewards table
CREATE TABLE public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  points_required INTEGER NOT NULL DEFAULT 100,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create point_transactions table
CREATE TABLE public.point_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  reward_id UUID REFERENCES public.rewards(id) ON DELETE SET NULL,
  points_change INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create credit_payments table
CREATE TABLE public.credit_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  payment_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_payments ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "System can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');

-- Create RLS policies for categories
CREATE POLICY "Everyone can view categories" ON public.categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage categories" ON public.categories FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);

-- Create RLS policies for units
CREATE POLICY "Everyone can view units" ON public.units FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage units" ON public.units FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);

-- Create RLS policies for suppliers
CREATE POLICY "Everyone can view suppliers" ON public.suppliers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage suppliers" ON public.suppliers FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);

-- Create RLS policies for products
CREATE POLICY "Everyone can view products" ON public.products FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage products" ON public.products FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);

-- Create RLS policies for customers
CREATE POLICY "Everyone can view customers" ON public.customers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage customers" ON public.customers FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff', 'cashier')
);

-- Create RLS policies for transactions
CREATE POLICY "Everyone can view transactions" ON public.transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Cashiers can create transactions" ON public.transactions FOR INSERT WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff', 'cashier')
);
CREATE POLICY "Staff can update transactions" ON public.transactions FOR UPDATE USING (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);
CREATE POLICY "Admins can delete transactions" ON public.transactions FOR DELETE USING (
  public.get_user_role(auth.uid()) = 'admin'
);

-- Create RLS policies for transaction_items
CREATE POLICY "Everyone can view transaction items" ON public.transaction_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Cashiers can create transaction items" ON public.transaction_items FOR INSERT WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff', 'cashier')
);
CREATE POLICY "Staff can update transaction items" ON public.transaction_items FOR UPDATE USING (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);
CREATE POLICY "Admins can delete transaction items" ON public.transaction_items FOR DELETE USING (
  public.get_user_role(auth.uid()) = 'admin'
);

-- Create RLS policies for purchases
CREATE POLICY "Everyone can view purchases" ON public.purchases FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage purchases" ON public.purchases FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);

-- Create RLS policies for purchase_items
CREATE POLICY "Everyone can view purchase items" ON public.purchase_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage purchase items" ON public.purchase_items FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);

-- Create RLS policies for returns
CREATE POLICY "Everyone can view returns" ON public.returns FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage returns" ON public.returns FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);

-- Create RLS policies for return_items
CREATE POLICY "Everyone can view return items" ON public.return_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage return items" ON public.return_items FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);

-- Create RLS policies for stock_adjustments
CREATE POLICY "Everyone can view stock adjustments" ON public.stock_adjustments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can create stock adjustments" ON public.stock_adjustments FOR INSERT WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff') AND auth.uid() = user_id
);
CREATE POLICY "Staff can update stock adjustments" ON public.stock_adjustments FOR UPDATE USING (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);
CREATE POLICY "Admins can delete stock adjustments" ON public.stock_adjustments FOR DELETE USING (
  public.get_user_role(auth.uid()) = 'admin'
);

-- Create RLS policies for expenses
CREATE POLICY "Everyone can view expenses" ON public.expenses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can create expenses" ON public.expenses FOR INSERT WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff') AND auth.uid() = user_id
);
CREATE POLICY "Staff can update expenses" ON public.expenses FOR UPDATE USING (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);
CREATE POLICY "Admins can delete expenses" ON public.expenses FOR DELETE USING (
  public.get_user_role(auth.uid()) = 'admin'
);

-- Create RLS policies for rewards
CREATE POLICY "Everyone can view rewards" ON public.rewards FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage rewards" ON public.rewards FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);

-- Create RLS policies for point_transactions
CREATE POLICY "Everyone can view point transactions" ON public.point_transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage point transactions" ON public.point_transactions FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff', 'cashier')
);

-- Create RLS policies for credit_payments
CREATE POLICY "Everyone can view credit payments" ON public.credit_payments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can create credit payments" ON public.credit_payments FOR INSERT WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff', 'cashier') AND auth.uid() = user_id
);
CREATE POLICY "Staff can update credit payments" ON public.credit_payments FOR UPDATE USING (
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);
CREATE POLICY "Admins can delete credit payments" ON public.credit_payments FOR DELETE USING (
  public.get_user_role(auth.uid()) = 'admin'
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('product-images', 'product-images', true),
  ('receipts', 'receipts', true),
  ('expense-receipts', 'expense-receipts', true),
  ('member-cards', 'member-cards', true),
  ('reward-images', 'reward-images', true),
  ('avatars', 'avatars', true);

-- Create storage policies for product-images
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Staff can upload product images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND 
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);
CREATE POLICY "Staff can update product images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'product-images' AND 
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);
CREATE POLICY "Staff can delete product images" ON storage.objects FOR DELETE USING (
  bucket_id = 'product-images' AND 
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);

-- Create storage policies for receipts
CREATE POLICY "Staff can view receipts" ON storage.objects FOR SELECT USING (
  bucket_id = 'receipts' AND 
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff', 'cashier')
);
CREATE POLICY "Staff can upload receipts" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'receipts' AND 
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff', 'cashier')
);

-- Create storage policies for expense-receipts
CREATE POLICY "Staff can view expense receipts" ON storage.objects FOR SELECT USING (
  bucket_id = 'expense-receipts' AND 
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);
CREATE POLICY "Staff can upload expense receipts" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'expense-receipts' AND 
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);

-- Create storage policies for member-cards
CREATE POLICY "Staff can view member cards" ON storage.objects FOR SELECT USING (
  bucket_id = 'member-cards' AND 
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff', 'cashier')
);
CREATE POLICY "Staff can upload member cards" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'member-cards' AND 
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff', 'cashier')
);

-- Create storage policies for reward-images
CREATE POLICY "Anyone can view reward images" ON storage.objects FOR SELECT USING (bucket_id = 'reward-images');
CREATE POLICY "Staff can upload reward images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'reward-images' AND 
  public.get_user_role(auth.uid()) IN ('admin', 'manager', 'staff')
);

-- Create storage policies for avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid() IS NOT NULL
);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND auth.uid() IS NOT NULL
);

-- Create trigger function for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'staff'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update stock after transactions
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Decrease stock when transaction item is created
    UPDATE public.products 
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Adjust stock based on quantity change
    UPDATE public.products 
    SET current_stock = current_stock + OLD.quantity - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Increase stock when transaction item is deleted
    UPDATE public.products 
    SET current_stock = current_stock + OLD.quantity
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for stock updates
CREATE TRIGGER transaction_items_stock_update
  AFTER INSERT OR UPDATE OR DELETE ON public.transaction_items
  FOR EACH ROW EXECUTE FUNCTION public.update_product_stock();

-- Create function to update stock after purchases
CREATE OR REPLACE FUNCTION public.update_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increase stock when purchase item is created
    UPDATE public.products 
    SET current_stock = current_stock + NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Adjust stock based on quantity change
    UPDATE public.products 
    SET current_stock = current_stock - OLD.quantity + NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrease stock when purchase item is deleted
    UPDATE public.products 
    SET current_stock = current_stock - OLD.quantity
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for purchase stock updates
CREATE TRIGGER purchase_items_stock_update
  AFTER INSERT OR UPDATE OR DELETE ON public.purchase_items
  FOR EACH ROW EXECUTE FUNCTION public.update_stock_on_purchase();

-- Create function to update stock after returns
CREATE OR REPLACE FUNCTION public.update_stock_on_return()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Decrease stock when return item is created
    UPDATE public.products 
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Adjust stock based on quantity change
    UPDATE public.products 
    SET current_stock = current_stock + OLD.quantity - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Increase stock when return item is deleted
    UPDATE public.products 
    SET current_stock = current_stock + OLD.quantity
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for return stock updates
CREATE TRIGGER return_items_stock_update
  AFTER INSERT OR UPDATE OR DELETE ON public.return_items
  FOR EACH ROW EXECUTE FUNCTION public.update_stock_on_return();
