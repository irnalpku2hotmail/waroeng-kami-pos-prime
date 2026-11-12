import { buildSaleUnits, getBaseQuantity, getTierUnitPrice } from '../posSaleUnits';

let passed = 0;
let failed = 0;

function test(name: string, run: () => void) {
  try {
    run();
    passed += 1;
    console.log(`✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`✗ ${name}: ${(error as Error).message}`);
  }
}

function equal(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}; expected ${String(expected)}, got ${String(actual)}`);
}

const renteng = { id: 'renteng', name: 'Renteng', abbreviation: 'rtg' };
const karton = { id: 'karton', name: 'Karton', abbreviation: 'ktn' };
const pcs = { id: 'pcs', name: 'Pcs', abbreviation: 'pcs' };

test('TOP gula aren uses Renteng as base and offers configured Karton = 12 Renteng only', () => {
  const options = buildSaleUnits(renteng, [{
    from_unit_id: karton.id,
    to_unit_id: renteng.id,
    conversion_factor: 12,
  }], [renteng, karton, pcs]);
  equal(options.length, 2, 'only base Renteng and configured Karton are offered');
  equal(options[0]?.id, renteng.id, 'master base unit remains the first option');
  equal(options[1]?.id, karton.id, 'configured Karton is available');
  equal(options[1]?.conversionFactor, 12, 'Karton converts to 12 Renteng');
  equal(options.some((option) => option.id === pcs.id), false, 'unconfigured Pcs is never invented');
});

test('two cartons reserve 24 Renteng and reject a fractional base-stock quantity', () => {
  equal(getBaseQuantity(2, 12), 24, 'two cartons reserve 24 base units');
  equal(getBaseQuantity(1, 0.5), null, 'half base unit is rejected for integer inventory');
});

test('quantity tier pricing is evaluated using aggregate base-unit quantity', () => {
  const unitPrice = getTierUnitPrice({
    selling_price: 18000,
    price_variants: [{ is_active: true, minimum_quantity: 12, price: 17250 }],
  }, 24);
  equal(unitPrice, 17250, 'tier price applies to 24 Renteng units');
  equal(unitPrice * 12 * 2, 414000, 'two cartons use the selected base-unit tier price');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);