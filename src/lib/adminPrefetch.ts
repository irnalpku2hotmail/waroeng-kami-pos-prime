import type { QueryClient } from '@tanstack/react-query';
import {
  DEFAULT_PAGE_SIZE,
  customersKey,
  fetchCustomers,
  fetchInventoryProducts,
  fetchOrders,
  fetchProducts,
  fetchSuppliers,
  inventoryProductsKey,
  ordersKey,
  productsKey,
  suppliersKey,
} from './adminQueries';

/** Route chunk loaders — same module specifiers as App.tsx so Vite reuses the chunk. */
const routeChunks: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('@/pages/Dashboard'),
  '/products': () => import('@/pages/Products'),
  '/customers': () => import('@/pages/Customers'),
  '/orders': () => import('@/pages/Orders'),
  '/inventory': () => import('@/pages/Inventory'),
  '/purchases': () => import('@/pages/Purchases'),
  '/suppliers': () => import('@/pages/Suppliers'),
  '/categories': () => import('@/pages/Categories'),
  '/expenses': () => import('@/pages/Expenses'),
  '/reports': () => import('@/pages/Reports'),
  '/credit-management': () => import('@/pages/CreditManagement'),
  '/user-management': () => import('@/pages/UserManagement'),
  '/returns': () => import('@/pages/Returns'),
  '/settings': () => import('@/pages/Settings'),
  '/stock-opname': () => import('@/pages/StockOpname'),
  '/points-rewards': () => import('@/pages/PointsRewards'),
  '/flash-sales': () => import('@/pages/FlashSales'),
  '/bundles': () => import('@/pages/Bundles'),
  '/reward-redemptions': () => import('@/pages/RewardRedemptions'),
};

/** First-page query prefetchers for the highest-traffic admin lists. */
const queryPrefetchers: Record<string, (qc: QueryClient) => Promise<unknown>> = {
  '/products': (qc) =>
    qc.prefetchQuery({
      queryKey: productsKey('', 'all', 1, DEFAULT_PAGE_SIZE),
      queryFn: () => fetchProducts('', 'all', 1, DEFAULT_PAGE_SIZE),
    }),
  '/customers': (qc) =>
    qc.prefetchQuery({
      queryKey: customersKey('', 1, DEFAULT_PAGE_SIZE),
      queryFn: () => fetchCustomers('', 1, DEFAULT_PAGE_SIZE),
    }),
  '/orders': (qc) =>
    qc.prefetchQuery({
      queryKey: ordersKey('', 'all', 1, DEFAULT_PAGE_SIZE),
      queryFn: () => fetchOrders('', 'all', 1, DEFAULT_PAGE_SIZE),
    }),
  '/inventory': (qc) =>
    qc.prefetchQuery({
      queryKey: inventoryProductsKey('', 1, DEFAULT_PAGE_SIZE),
      queryFn: () => fetchInventoryProducts('', 1, DEFAULT_PAGE_SIZE),
    }),
  '/suppliers': (qc) =>
    qc.prefetchQuery({
      queryKey: suppliersKey('', 1, DEFAULT_PAGE_SIZE),
      queryFn: () => fetchSuppliers('', 1, DEFAULT_PAGE_SIZE),
    }),
};

const donePaths = new Set<string>();

/** True when the device/connection is too constrained for speculative prefetch. */
export function isSaveDataOrSlow(): boolean {
  const conn = (navigator as any)?.connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  return ['slow-2g', '2g'].includes(conn.effectiveType);
}

/** Prefetch the route chunk (and page-1 data) for a path. Safe to call repeatedly. */
export function prefetchAdminRoute(path: string, queryClient?: QueryClient) {
  if (donePaths.has(path)) return;
  donePaths.add(path);
  routeChunks[path]?.().catch(() => donePaths.delete(path));
  if (queryClient) queryPrefetchers[path]?.(queryClient).catch(() => {});
}

/** Idle-time prefetch of the most commonly opened admin menus. */
export function prefetchCommonAdminRoutes(queryClient: QueryClient) {
  if (isSaveDataOrSlow()) return;
  const priority = ['/dashboard', '/products', '/customers', '/orders', '/inventory', '/purchases'];
  const run = () => priority.forEach((p) => routeChunks[p]?.().catch(() => {}));
  const ric = (window as any).requestIdleCallback;
  if (typeof ric === 'function') ric(run, { timeout: 3000 });
  else setTimeout(run, 1500);
}
