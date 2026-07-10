# Admin Dashboard — Performance Audit (Turn 1, read-only)

Dokumen ini adalah hasil pemetaan awal. Belum ada refactor yang diterapkan di Turn 1 selain fitur lock Stock Opname.

## 1. Halaman yang menarik SELURUH data (tidak paginated di DB)

| Halaman | Query | Masalah |
|---|---|---|
| `src/pages/Inventory.tsx` | `inventory-products`, `stock-adjustments`, `supplier-returns` | fetch semua row lalu `.slice()` di client |
| `src/pages/Products.tsx` | (perlu dicek turn 2) | dilaporkan sama |
| `src/pages/Customers.tsx` | fetch all | filter/sort client-side |
| `src/pages/Suppliers.tsx` | fetch all | idem |
| `src/pages/Purchases.tsx` | fetch all | idem |
| `src/pages/Expenses.tsx` | fetch all | idem |
| `src/pages/FlashSales.tsx` | fetch all | idem |
| `src/pages/Bundles.tsx` | fetch all | idem |
| `src/pages/PointsRewards.tsx` | fetch all | idem |
| `src/pages/CreditManagement.tsx` | fetch all | idem |
| `src/pages/RewardRedemptions.tsx` | fetch all | idem |
| `src/pages/UserManagement.tsx` | fetch all profiles | risiko besar bila user > 10k |
| `src/hooks/useOrdersData.ts` | `all-orders` query ambil seluruh data hanya untuk export | perlu dipindah ke tombol Export saja |

`useOrdersData` sendiri untuk list utama sudah `.range()` — hanya export yang boros.

## 2. Query pakai `select('*')` / nested join berat

- `useOrdersData`: `orders.select('*, order_items(*, products(name,image_url,current_stock,min_stock))')` — dua level nested per row.
- `Inventory`: `products.select('*, categories(name), units(name,abbreviation), suppliers:purchase_items(purchases!inner(suppliers(name))))` — 4-level embed, sangat berat.
- `StockOpnameDetail`: `stock_opname_items.select('*, products(id,name,barcode,image_url))` — OK, tapi `*` bisa dipersempit.
- Banyak halaman admin memakai `select('*')` default.

## 3. Filter / sort / pagination di browser

- `Inventory.tsx`: `usePagination` + `allProducts.slice(...)` — semua di JS.
- `StockOpnameDetail`: filter status + search dilakukan pada array di memory (OK untuk single session, tidak untuk list).
- `OrdersTable` sudah server-side; **tapi** `useOrdersData` masih fetch `all-orders` untuk export.
- Halaman-halaman di §1 mayoritas melakukan `.filter().sort().slice()` di client.

## 4. Komponen berat yang belum lazy-loaded

Semua di-import statis via `App.tsx` → masuk main bundle:

- `recharts` — dipakai `Dashboard`, `Reports*`, `PriceHistoryChart`.
- `xlsx` (`utils/excelExport.ts`) — dipakai banyak halaman tapi hanya saat klik Export.
- `jsPDF` (`utils/receiptGenerator.ts`) — hanya untuk cetak struk.
- `html5-qrcode` (`BarcodeScanner`, `MultiBarcodeScanner`) — hanya untuk POS & Stock Opname.
- `leaflet` + `react-leaflet` (`SecureLocationPicker`, `InteractiveLocationPicker`) — hanya di checkout & user locations.
- Halaman admin: `Reports.tsx`, `AuditReport.tsx`, `SearchAnalytics.tsx`, `StockOpname*` sebaiknya `React.lazy`.

## 5. React Query cache — belum dioptimalkan

- Default `staleTime` = 0 → refetch tiap mount/focus.
- `refetchOnWindowFocus` aktif secara global.
- Tidak ada `placeholderData: keepPreviousData` di listing paginated → flicker + skeleton tiap pindah halaman.

## 6. Debounce

- Tidak ada satupun `useDebouncedValue` di admin. `Products`, `Customers`, `Suppliers`, `Inventory` men-trigger query setiap keystroke.

## 7. Bundle terbesar (estimasi urutan berdasarkan import)

1. `recharts` (~350KB gzipped raw, terlihat besar setelah tree-shaking parsial)
2. `xlsx`
3. `leaflet` + `react-leaflet`
4. `jsPDF`
5. `html5-qrcode`
6. `@radix-ui/*` (sudah tree-shaken per komponen — OK)
7. `date-fns` — cek apakah masih pakai import default.

## 8. Rekomendasi index DB (Turn 3)

```sql
CREATE INDEX IF NOT EXISTS idx_products_active_name    ON public.products(is_active, name);
CREATE INDEX IF NOT EXISTS idx_products_barcode         ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_orders_status_created    ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_created  ON public.orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_created               ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_customer_created      ON public.transactions(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product   ON public.purchase_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_prod_at  ON public.stock_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_email          ON public.customers(lower(email));
CREATE INDEX IF NOT EXISTS idx_transaction_items_tx     ON public.transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order        ON public.order_items(order_id);
```

## 9. Estimasi impact (setelah Turn 2 + 3)

- Request Supabase per kunjungan admin: **~70% turun** (list page tidak lagi tarik ribuan row).
- Waktu render tabel: dari O(n) → O(page_size=20).
- Main bundle: turun **~40-55%** setelah code split recharts + xlsx + leaflet + jspdf + qrcode.
- Lighthouse Performance mobile admin: dari ~55 → ~80-85.

## 10. Batasan yang dijaga (tidak diubah di manapun)

- Business logic mutasi (POS, cart, checkout, credit, loyalty, stok trigger).
- Auth, RLS, schema (kecuali penambahan kolom lock di Stock Opname).
- UI/UX visual, urutan kolom, warna, layout.
- Marketplace/frontend & edge functions.

## Turn 1 selesai

- ✅ Stock Opname session lock/unlock (migration + trigger + UI).
- ✅ Laporan audit ini.
- ⏭️ Turn 2: refactor server-side (Products, Orders/Transactions, Customers, Suppliers, Inventory, Purchases).
- ⏭️ Turn 3: bundle split + index DB + lazy load chart/excel/pdf/leaflet/qr.