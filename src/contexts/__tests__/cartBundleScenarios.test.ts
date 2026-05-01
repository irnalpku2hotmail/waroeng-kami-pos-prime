/**
 * Cart Bundle Integrity — Scenario Tests
 *
 * These pure-function tests mirror the reducer logic in CartContext.tsx and
 * validate the rules requested by the user:
 *  1. Bundle items MUST NEVER merge with a manually-added item of the same product.
 *  2. If any bundle item is short on stock, the bundle cannot be added at all
 *     (bundle pricing is disabled).
 *  3. Updating quantity on a bundle item must preserve bundle status and must
 *     not allow exceeding the original bundle quantity at the discounted price
 *     (anti price-manipulation).
 *
 * Run with: bun src/contexts/__tests__/cartBundleScenarios.test.ts
 */

type Item = {
  id: string;
  product_id: string;
  name: string;
  price: number;
  unit_price: number;
  total_price: number;
  quantity: number;
  stock: number;
  bundle_id?: string | null;
  is_bundle?: boolean;
  original_price?: number;
  bundle_price?: number;
  bundle_quantity?: number;
};

// --- Reducer fns extracted from CartContext (kept in sync) ---
function addToCart(prev: Item[], newItem: Item): Item[] {
  const idx = prev.findIndex(
    (i) => i.id === newItem.id && (i.bundle_id ?? null) === (newItem.bundle_id ?? null)
  );
  if (idx > -1) {
    const existing = prev[idx];
    const q = existing.quantity + newItem.quantity;
    if (q > newItem.stock) return prev;
    const next = [...prev];
    next[idx] = { ...existing, quantity: q, total_price: existing.unit_price * q };
    return next;
  }
  if (newItem.quantity > newItem.stock) return prev;
  return [...prev, { ...newItem, total_price: newItem.unit_price * newItem.quantity }];
}

function updateQuantity(prev: Item[], id: string, quantity: number, bundleId?: string | null): Item[] {
  return prev.map((item) => {
    const idMatch = item.id === id || item.product_id === id;
    const bMatch = bundleId === undefined ? true : (item.bundle_id ?? null) === (bundleId ?? null);
    if (!idMatch || !bMatch) return item;
    if (quantity > item.stock) return item;
    if (item.bundle_id && item.bundle_quantity && quantity > item.bundle_quantity) {
      return { ...item, quantity: item.bundle_quantity, total_price: item.unit_price * item.bundle_quantity };
    }
    return {
      ...item,
      quantity,
      total_price: item.unit_price * quantity,
      is_bundle: item.is_bundle,
      bundle_id: item.bundle_id,
      bundle_price: item.bundle_price,
    };
  });
}

function removeFromCart(prev: Item[], id: string): Item[] {
  const target = prev.find((i) => i.id === id);
  const bid = target?.bundle_id;
  if (bid) {
    return prev
      .filter((i) => i.id !== id)
      .map((i) => {
        if (i.bundle_id === bid) {
          const original = i.original_price ?? i.unit_price;
          return { ...i, unit_price: original, price: original, total_price: original * i.quantity, is_bundle: false, bundle_id: null, bundle_price: undefined };
        }
        return i;
      });
  }
  return prev.filter((i) => i.id !== id);
}

// All-or-nothing bundle add (mirrors BundleDetail.handleAddAllToCart)
function addBundle(prev: Item[], bundleId: string, items: { product: { id: string; name: string; selling_price: number; current_stock: number }; quantity: number }[], discountRatio: number): { cart: Item[]; ok: boolean; reason?: string } {
  const insufficient = items.find((it) => it.product.current_stock < it.quantity);
  if (insufficient) return { cart: prev, ok: false, reason: `stok ${insufficient.product.name} kurang` };
  let cart = prev;
  for (const it of items) {
    const unit = Math.round(it.product.selling_price * discountRatio);
    cart = addToCart(cart, {
      id: it.product.id,
      product_id: it.product.id,
      name: it.product.name,
      price: unit,
      unit_price: unit,
      total_price: unit * it.quantity,
      quantity: it.quantity,
      stock: it.product.current_stock,
      bundle_id: bundleId,
      is_bundle: true,
      original_price: it.product.selling_price,
      bundle_price: unit,
      bundle_quantity: it.quantity,
    });
  }
  return { cart, ok: true };
}

// --- Mini test harness ---
let passed = 0;
let failed = 0;
function test(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`✓ ${name}`); }
  catch (e) { failed++; console.error(`✗ ${name}\n  ${(e as Error).message}`); }
}
function eq(a: unknown, b: unknown, msg = '') {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg} expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`);
}
function truthy(v: unknown, msg = '') { if (!v) throw new Error(msg || 'expected truthy'); }

const PROD_A = { id: 'prod-a', name: 'Beras 5kg', selling_price: 70000, current_stock: 10 };
const PROD_B = { id: 'prod-b', name: 'Minyak 1L', selling_price: 20000, current_stock: 10 };

// --- Tests ---

test('Bundle item & manual item of the same product stay isolated (no merge)', () => {
  let cart: Item[] = [];
  // Add manual at normal price
  cart = addToCart(cart, { id: PROD_A.id, product_id: PROD_A.id, name: PROD_A.name, price: 70000, unit_price: 70000, total_price: 70000, quantity: 1, stock: 10, bundle_id: null });
  // Add same product as part of a bundle (discounted)
  const r = addBundle(cart, 'bundle-1', [{ product: PROD_A, quantity: 2 }, { product: PROD_B, quantity: 1 }], 0.9);
  truthy(r.ok, 'bundle should add');
  cart = r.cart;
  const a = cart.filter((i) => i.id === PROD_A.id);
  eq(a.length, 2, 'two distinct lines for prod-a');
  eq(a.find((i) => !i.bundle_id)?.unit_price, 70000, 'manual line keeps normal price');
  eq(a.find((i) => i.bundle_id === 'bundle-1')?.unit_price, 63000, 'bundle line uses discounted price');
});

test('Bundle cannot be added if any item is short on stock', () => {
  const lowStockB = { ...PROD_B, current_stock: 0 };
  const r = addBundle([], 'bundle-2', [{ product: PROD_A, quantity: 1 }, { product: lowStockB, quantity: 1 }], 0.9);
  eq(r.ok, false);
  eq(r.cart.length, 0, 'cart untouched — no partial bundle');
});

test('Updating bundle item quantity preserves bundle pricing & flags', () => {
  const r = addBundle([], 'bundle-3', [{ product: PROD_A, quantity: 2 }, { product: PROD_B, quantity: 2 }], 0.9);
  let cart = r.cart;
  // Allowed: lower the quantity
  cart = updateQuantity(cart, PROD_A.id, 1, 'bundle-3');
  const line = cart.find((i) => i.id === PROD_A.id && i.bundle_id === 'bundle-3')!;
  eq(line.quantity, 1);
  eq(line.is_bundle, true, 'still marked as bundle');
  eq(line.unit_price, 63000, 'still discounted price');
  eq(line.total_price, 63000);
});

test('Bundle quantity cannot exceed original bundle_quantity (anti price exploit)', () => {
  const r = addBundle([], 'bundle-4', [{ product: PROD_A, quantity: 2 }, { product: PROD_B, quantity: 1 }], 0.9);
  let cart = r.cart;
  // Attempt: push prod-a from 2 → 5 at the discounted price
  cart = updateQuantity(cart, PROD_A.id, 5, 'bundle-4');
  const line = cart.find((i) => i.id === PROD_A.id && i.bundle_id === 'bundle-4')!;
  eq(line.quantity, 2, 'capped to original bundle_quantity');
  eq(line.unit_price, 63000, 'price unchanged');
});

test('Updating manual line does not affect bundle line of same product', () => {
  let cart: Item[] = [];
  cart = addToCart(cart, { id: PROD_A.id, product_id: PROD_A.id, name: PROD_A.name, price: 70000, unit_price: 70000, total_price: 70000, quantity: 1, stock: 10, bundle_id: null });
  const r = addBundle(cart, 'bundle-5', [{ product: PROD_A, quantity: 2 }, { product: PROD_B, quantity: 1 }], 0.9);
  cart = r.cart;
  cart = updateQuantity(cart, PROD_A.id, 3, null); // manual line only
  const manual = cart.find((i) => i.id === PROD_A.id && !i.bundle_id)!;
  const bundle = cart.find((i) => i.id === PROD_A.id && i.bundle_id === 'bundle-5')!;
  eq(manual.quantity, 3);
  eq(bundle.quantity, 2, 'bundle line untouched');
  eq(bundle.unit_price, 63000);
});

test('Removing one bundle item reverts siblings to original price', () => {
  const r = addBundle([], 'bundle-6', [{ product: PROD_A, quantity: 1 }, { product: PROD_B, quantity: 1 }], 0.9);
  let cart = r.cart;
  cart = removeFromCart(cart, PROD_A.id);
  const sibling = cart.find((i) => i.id === PROD_B.id)!;
  eq(sibling.unit_price, 20000, 'reverted to original price');
  eq(sibling.is_bundle, false);
  eq(sibling.bundle_id, null);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);