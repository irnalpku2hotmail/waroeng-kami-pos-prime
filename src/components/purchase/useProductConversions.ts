
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ProductConversionsCache = Record<string, any[]>;

export const useProductConversions = () => {
  const [productConversions, setProductConversions] = useState<ProductConversionsCache>({});

  const fetchConversions = async (productId: string) => {
    if (!productId || productConversions[productId]) return;
    const { data, error } = await supabase
      .from('unit_conversions')
      .select('*')
      .eq('product_id', productId);

    if (!error && data) {
      setProductConversions(prev => ({ ...prev, [productId]: data }));
    }
  };

  const getConversionFactor = (
    productId: string,
    purchaseUnitId: string,
    baseUnitId: string
  ) => {
    if (!productId || !purchaseUnitId || !baseUnitId || purchaseUnitId === baseUnitId) return 1;

    const conversions = productConversions[productId] || [];
    // direct: dari purchase_unit ke base_unit
    const direct = conversions.find(
      (conv: any) => conv.from_unit_id === purchaseUnitId && conv.to_unit_id === baseUnitId
    );
    if (direct && Number(direct.conversion_factor) > 0) return Number(direct.conversion_factor);

    // reverse: dari base_unit ke purchase_unit
    const reverse = conversions.find(
      (conv: any) => conv.from_unit_id === baseUnitId && conv.to_unit_id === purchaseUnitId
    );
    if (reverse && Number(reverse.conversion_factor) > 0) return 1 / Number(reverse.conversion_factor);

    // If no conversion found, default to 1
    return 1;
  };

  return {
    productConversions,
    fetchConversions,
    getConversionFactor,
  };
};
