CREATE OR REPLACE FUNCTION public.set_transaction_item_sale_unit_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  v_base_unit_id uuid;
  v_base_unit_name text;
  v_base_unit_abbreviation text;
  v_unit_name text;
  v_unit_abbreviation text;
BEGIN
  IF NEW.conversion_factor IS NULL THEN
    NEW.conversion_factor := 1;
  END IF;

  IF NEW.sold_quantity IS NULL THEN
    NEW.sold_quantity := NEW.quantity;
  END IF;

  IF NEW.sale_unit_price IS NULL THEN
    NEW.sale_unit_price := NEW.unit_price;
  END IF;

  SELECT p.unit_id, u.name, u.abbreviation
    INTO v_base_unit_id, v_base_unit_name, v_base_unit_abbreviation
  FROM public.products p
  LEFT JOIN public.units u ON u.id = p.unit_id
  WHERE p.id = NEW.product_id;

  IF NEW.sale_unit_id IS NULL THEN
    NEW.sale_unit_id := v_base_unit_id;
  END IF;

  IF NEW.sale_unit_name IS NULL OR NEW.sale_unit_abbreviation IS NULL THEN
    SELECT name, abbreviation
      INTO v_unit_name, v_unit_abbreviation
    FROM public.units
    WHERE id = NEW.sale_unit_id;

    NEW.sale_unit_name := COALESCE(NEW.sale_unit_name, v_unit_name, v_base_unit_name);
    NEW.sale_unit_abbreviation := COALESCE(NEW.sale_unit_abbreviation, v_unit_abbreviation, v_base_unit_abbreviation);
  END IF;

  IF NEW.sold_quantity <= 0 THEN
    RAISE EXCEPTION 'Jumlah satuan penjualan harus lebih besar dari nol';
  END IF;

  IF NEW.conversion_factor <= 0 THEN
    RAISE EXCEPTION 'Faktor konversi satuan penjualan tidak valid';
  END IF;

  IF NEW.sold_quantity * NEW.conversion_factor <> NEW.quantity THEN
    RAISE EXCEPTION 'Jumlah stok dasar tidak sesuai dengan jumlah dan faktor konversi';
  END IF;

  IF NEW.sale_unit_price < 0 OR NEW.unit_price < 0 THEN
    RAISE EXCEPTION 'Harga satuan penjualan tidak valid';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.set_transaction_item_sale_unit_snapshot() FROM PUBLIC, anon, authenticated;