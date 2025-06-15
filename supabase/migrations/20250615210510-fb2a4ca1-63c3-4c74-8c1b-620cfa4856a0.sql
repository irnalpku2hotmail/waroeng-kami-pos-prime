
-- Perbaiki struktur tabel purchase_items untuk memastikan foreign key yang jelas
ALTER TABLE purchase_items 
DROP CONSTRAINT IF EXISTS purchase_items_purchase_unit_id_fkey;

ALTER TABLE purchase_items 
ADD CONSTRAINT purchase_items_purchase_unit_id_fkey 
FOREIGN KEY (purchase_unit_id) REFERENCES units(id);

-- Pastikan unit_conversions memiliki foreign key yang jelas
ALTER TABLE unit_conversions 
DROP CONSTRAINT IF EXISTS unit_conversions_from_unit_id_fkey,
DROP CONSTRAINT IF EXISTS unit_conversions_to_unit_id_fkey;

ALTER TABLE unit_conversions 
ADD CONSTRAINT unit_conversions_from_unit_id_fkey 
FOREIGN KEY (from_unit_id) REFERENCES units(id),
ADD CONSTRAINT unit_conversions_to_unit_id_fkey 
FOREIGN KEY (to_unit_id) REFERENCES units(id);

-- Update trigger untuk purchase_items agar menggunakan foreign key yang benar
DROP TRIGGER IF EXISTS purchase_items_stock_trigger ON purchase_items;

CREATE TRIGGER purchase_items_stock_trigger
  AFTER INSERT OR UPDATE OR DELETE ON purchase_items
  FOR EACH ROW EXECUTE FUNCTION update_stock_on_purchase();

-- Pastikan ada index untuk performa yang lebih baik
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_unit_id ON products(unit_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON purchase_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_unit_id ON purchase_items(purchase_unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_conversions_product_id ON unit_conversions(product_id);
