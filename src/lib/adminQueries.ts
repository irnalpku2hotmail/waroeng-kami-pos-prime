import { supabase } from '@/integrations/supabase/client';

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [20, 50, 100];

const bounds = (page: number, size: number) => {
  const from = (page - 1) * size;
  return { from, to: from + size - 1 };
};

/* ---------------- PRODUCTS ---------------- */
export const productsKey = (search: string, category: string, page: number, size: number) =>
  ['products', search, category, page, size] as const;

export async function fetchProducts(search: string, category: string, page: number, size: number) {
  const { from, to } = bounds(page, size);
  let query = supabase
    .from('products')
    .select('*, categories(name), units(name), price_variants(*), product_brands(name, logo_url)', {
      count: 'exact',
    });
  if (search) query = query.or(`name.ilike.%${search}%,barcode.ilike.%${search}%`);
  if (category && category !== 'all') query = query.eq('category_id', category);
  const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

/* ---------------- CUSTOMERS ---------------- */
export const customersKey = (search: string, page: number, size: number) =>
  ['customers', search, page, size] as const;

export async function fetchCustomers(search: string, page: number, size: number) {
  const { from, to } = bounds(page, size);
  let query = supabase
    .from('customers')
    .select('id, name, email, phone, address, date_of_birth, total_points, created_at, updated_at', {
      count: 'exact',
    });
  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }
  const { data: customers, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;

  const ids = (customers || []).map((c) => c.id);
  if (ids.length === 0) return { data: [], count: count || 0 };

  // 2 batched aggregate queries instead of 2 queries per customer (N+1 removed)
  const [{ data: txns }, { data: ords }] = await Promise.all([
    supabase.from('transactions').select('customer_id,total_amount').in('customer_id', ids),
    supabase.from('orders').select('customer_id,total_amount,status').in('customer_id', ids),
  ]);

  const agg = new Map<string, { spent: number; orders: number }>();
  ids.forEach((id) => agg.set(id, { spent: 0, orders: 0 }));
  (txns || []).forEach((t: any) => {
    const a = agg.get(t.customer_id);
    if (!a) return;
    a.spent += Number(t.total_amount) || 0;
    a.orders += 1;
  });
  (ords || []).forEach((o: any) => {
    const a = agg.get(o.customer_id);
    if (!a) return;
    if (o.status === 'delivered') a.spent += Number(o.total_amount) || 0;
    a.orders += 1;
  });

  return {
    data: (customers || []).map((c) => ({
      ...c,
      total_spent: agg.get(c.id)?.spent || 0,
      total_orders: agg.get(c.id)?.orders || 0,
    })),
    count: count || 0,
  };
}

/* ---------------- ORDERS ---------------- */
export const ordersKey = (search: string, status: string, page: number, size: number) =>
  ['orders', search, status, page, size] as const;

export async function fetchOrders(search: string, status: string, page: number, size: number) {
  const { from, to } = bounds(page, size);
  let query = supabase
    .from('orders')
    .select(
      // List view only: narrow order columns + the minimum item fields the
      // "Status Stok" column needs. Full detail (prices, images) is fetched
      // on demand by OrderDetailsModal.
      'id, order_number, customer_name, customer_phone, order_date, total_amount, delivery_fee, status, payment_method, delivery_method, created_at, order_items(id, quantity, products(name, current_stock, min_stock))',
      { count: 'exact' }
    );
  if (search) query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%`);
  if (status !== 'all') query = query.eq('status', status);
  const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

/** Full single-order detail — used by the details modal / receipt only. */
export const orderDetailKey = (id: string) => ['order-detail', id] as const;

export async function fetchOrderDetail(id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name, image_url, current_stock, min_stock))')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/* ---------------- BUNDLES ---------------- */
export const bundlesKey = (search: string, page: number, size: number) =>
  ['admin-bundles', search, page, size] as const;

export async function fetchBundles(search: string, page: number, size: number) {
  const { from, to } = bounds(page, size);
  let query = supabase
    .from('bundles')
    .select(
      'id, name, slug, description, image_url, bundle_type, status, discount_price, original_price, savings_amount, savings_percentage, created_at, bundle_items(id)',
      { count: 'exact' }
    );
  if (search) query = query.ilike('name', `%${search}%`);
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

/* ---------------- REWARD REDEMPTION REQUESTS ---------------- */
export const redemptionsKey = (status: string, page: number, size: number) =>
  ['admin-redemption-requests', status, page, size] as const;

export async function fetchRedemptions(status: string, page: number, size: number) {
  const { from, to } = bounds(page, size);
  let query = supabase
    .from('reward_redemption_requests')
    .select(
      'id, status, points_used, quantity, notes, review_notes, requested_at, reviewed_at, customers(id, name, total_points), rewards(id, name, stock_quantity)',
      { count: 'exact' }
    );
  if (status !== 'all') query = query.eq('status', status);
  const { data, error, count } = await query
    .order('requested_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

/* ---------------- ADMIN NOTIFICATIONS (server-side) ---------------- */
export const adminNotificationsKey = (priority: string, type: string, page: number, size: number) =>
  ['admin-notifications', priority, type, page, size] as const;

export interface AdminNotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  event_time: string;
  priority: string;
  total_count: number;
}

export async function fetchAdminNotifications(
  priority: string,
  type: string,
  page: number,
  size: number
) {
  const { from } = bounds(page, size);
  const { data, error } = await (supabase.rpc as any)('get_admin_notifications', {
    p_priority: priority,
    p_type: type,
    p_limit: size,
    p_offset: from,
  });
  if (error) throw error;
  const rows = (data || []) as AdminNotificationRow[];
  return { data: rows, count: Number(rows[0]?.total_count || 0) };
}

/* ---------------- INVENTORY (stock levels) ---------------- */
export const inventoryProductsKey = (search: string, page: number, size: number) =>
  ['inventory-products', search, page, size] as const;

export async function fetchInventoryProducts(search: string, page: number, size: number) {
  const { from, to } = bounds(page, size);
  let query = supabase
    .from('products')
    .select(
      'id, name, barcode, image_url, current_stock, min_stock, base_price, selling_price, category_id, unit_id, categories(name), units(name, abbreviation)',
      { count: 'exact' }
    );
  if (search) query = query.or(`name.ilike.%${search}%,barcode.ilike.%${search}%`);
  const { data, error, count } = await query.order('name').range(from, to);
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

/* ---------------- SUPPLIERS ---------------- */
export const suppliersKey = (search: string, page: number, size: number) =>
  ['suppliers', search, page, size] as const;

export async function fetchSuppliers(search: string, page: number, size: number) {
  const { from, to } = bounds(page, size);
  let query = supabase
    .from('suppliers')
    .select('id, name, contact_person, phone, email, address, notes, created_at', { count: 'exact' });
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,contact_person.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}
