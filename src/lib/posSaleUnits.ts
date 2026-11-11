export interface SaleUnit {
  id: string;
  name: string;
  abbreviation: string;
  conversionFactor: number;
}

export interface UnitConversionRow {
  from_unit_id: string | null;
  to_unit_id: string | null;
  conversion_factor: number;
}

export interface UnitDetails {
  id: string;
  name: string;
  abbreviation: string;
}

/**
 * Inventory quantities are integers in the product's master/base unit.
 * Return only direct, unambiguous conversions that preserve that invariant.
 */
export function buildSaleUnits(
  baseUnit: UnitDetails | null,
  conversions: UnitConversionRow[],
  units: UnitDetails[],
): SaleUnit[] {
  if (!baseUnit) return [];

  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const factorsByUnit = new Map<string, number[]>();

  for (const conversion of conversions) {
    const factor = Number(conversion.conversion_factor);
    if (!Number.isFinite(factor) || factor <= 0) continue;

    let saleUnitId: string | null = null;
    let toBaseFactor = 0;
    if (conversion.to_unit_id === baseUnit.id && conversion.from_unit_id) {
      saleUnitId = conversion.from_unit_id;
      toBaseFactor = factor;
    } else if (conversion.from_unit_id === baseUnit.id && conversion.to_unit_id) {
      saleUnitId = conversion.to_unit_id;
      toBaseFactor = 1 / factor;
    }

    if (!saleUnitId || saleUnitId === baseUnit.id || !byId.has(saleUnitId)) continue;
    const factors = factorsByUnit.get(saleUnitId) ?? [];
    factors.push(toBaseFactor);
    factorsByUnit.set(saleUnitId, factors);
  }

  const result: SaleUnit[] = [{
    id: baseUnit.id,
    name: baseUnit.name,
    abbreviation: baseUnit.abbreviation,
    conversionFactor: 1,
  }];

  for (const [unitId, factors] of factorsByUnit) {
    const firstFactor = factors[0];
    // Conflicting duplicate master rules are unsafe: do not offer that unit.
    if (factors.some((factor) => Math.abs(factor - firstFactor) > 1e-9)) continue;
    const unit = byId.get(unitId);
    if (!unit) continue;
    result.push({ ...unit, conversionFactor: firstFactor });
  }

  return result;
}

export function getBaseQuantity(saleQuantity: number, conversionFactor: number): number | null {
  if (!Number.isSafeInteger(saleQuantity) || saleQuantity <= 0) return null;
  if (!Number.isFinite(conversionFactor) || conversionFactor <= 0) return null;
  const baseQuantity = saleQuantity * conversionFactor;
  if (!Number.isSafeInteger(Math.round(baseQuantity)) || Math.abs(baseQuantity - Math.round(baseQuantity)) > 1e-9) {
    return null;
  }
  return Math.round(baseQuantity);
}

export function getTierUnitPrice(product: {
  selling_price: number;
  price_variants?: Array<{
    is_active?: boolean | null;
    minimum_quantity: number;
    price: number;
  }> | null;
}, baseQuantity: number): number {
  const applicable = (product.price_variants ?? [])
    .filter((variant) => variant.is_active && baseQuantity >= variant.minimum_quantity)
    .sort((a, b) => b.minimum_quantity - a.minimum_quantity);
  return Number(applicable[0]?.price ?? product.selling_price);
}