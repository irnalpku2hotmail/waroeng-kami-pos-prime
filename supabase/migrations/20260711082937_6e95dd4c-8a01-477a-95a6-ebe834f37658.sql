
-- Performance indexes for admin list/search/sort paths.
-- All CREATE INDEX statements use IF NOT EXISTS so re-runs are safe.

-- Products: search by name/barcode, filter by category, sort by created_at
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin (lower(name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products (barcode);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);

-- Orders: filter by status, sort by created_at, join by customer_id
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);

-- Order items: join by order_id (very hot in orders + inventory pages)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);

-- Transactions: date range + customer_id + cashier lookups
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON public.transactions (customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_number ON public.transactions (transaction_number);

CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON public.transaction_items (transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id ON public.transaction_items (product_id);

-- Customers: search by name/email/phone
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON public.customers USING gin (lower(name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers (email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers (created_at DESC);

-- Suppliers: search by name/contact/phone
CREATE INDEX IF NOT EXISTS idx_suppliers_name_trgm ON public.suppliers USING gin (lower(name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_at ON public.suppliers (created_at DESC);

-- Purchases: search purchase/invoice number, join by supplier, sort by created_at
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_number ON public.purchases (purchase_number);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON public.purchases (supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON public.purchase_items (purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON public.purchase_items (product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_payments_purchase_id ON public.purchase_payments (purchase_id);

-- Stock movements: hot on inventory audit pages
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements (created_at DESC);

-- Stock adjustments
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product_id ON public.stock_adjustments (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_created_at ON public.stock_adjustments (created_at DESC);
