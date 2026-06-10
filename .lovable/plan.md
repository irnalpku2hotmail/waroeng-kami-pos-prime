# Audit Customer + Loyalty + Order + Stock — Temuan & Rencana Perbaikan

## Akar masalah utama
Saya cek `information_schema.triggers` schema `public` → **0 trigger**.
Artinya semua function trigger (`update_stock_on_sale`, `update_stock_on_purchase`, `update_stock_on_order_delivery`, `update_stock_on_return_status_change`, `set_order_number`, `set_credit_due_date`, `set_customer_return_number`, `handle_product_price_change`, `update_updated_at_column`) **ada tapi tidak pernah terpasang ke tabel apapun**.

Konsekuensi yang cocok dengan keluhan user:
- Order frontend → `order_items` masuk tapi `products.current_stock` **tidak berkurang** saat status `delivered`.
- POS `transaction_items` → stok tidak berkurang (kecuali ada manual update di kode).
- Purchase received → stok tidak bertambah.
- Return approved → stok tidak kembali.
- **Tidak ada trigger apapun yang menambah poin / total_spent / total_orders dari `orders`** — itulah kenapa customer signup yang checkout dari frontend: poin 0, belanja 0, jumlah pesanan 0.
- POS (`transactions`) punya kolom `points_earned` & `points_used` tapi tidak otomatis menambah `customers.total_points` / `total_spent` lewat trigger (perlu cek apakah `usePOS` melakukannya manual — meskipun begitu, frontend order tetap tidak tersentuh).

## Identitas customer — sudah benar
- `CartModal`, `FrontendCartModal`, `EnhancedFrontendCartModal` semua memanggil RPC `get_or_create_customer_for_current_user()` → `orders.customer_id` selalu menunjuk ke `public.customers.id` yang ter-link via `profile_id`.
- POS pakai `customers.id` langsung.
- **Tidak ada percampuran `profile_id` vs `customer_id`** di tabel transaksi. Customer manual & customer signup pakai tabel + kolom yang sama. ✅
- Yang bermasalah bukan identitas — tapi **agregasi** (poin/spent/orders) tidak pernah dihitung ulang.

## Order History — sudah benar secara query
`OrderHistory.tsx` & `CustomerAccount.tsx` memfilter `orders.customer_id = customer.id` (hasil RPC). Begitu agregasi diperbaiki dan order tersimpan, riwayat akan langsung muncul.

## Rencana perbaikan (1 migration besar, idempotent)

### A. Pasang ulang seluruh trigger stok yang hilang
```text
transaction_items   AFTER INSERT/UPDATE/DELETE → update_stock_on_sale
purchase_items      AFTER INSERT/UPDATE/DELETE → update_stock_on_purchase
orders              AFTER UPDATE OF status     → update_stock_on_order_delivery
returns             AFTER INSERT/UPDATE/DELETE → update_stock_on_return_status_change
products            AFTER UPDATE OF selling_price → handle_product_price_change
orders/purchases/customer_returns BEFORE INSERT → set_*_number
purchases           BEFORE INSERT             → set_credit_due_date
updated_at triggers untuk tabel yang punya kolom updated_at
```

### B. Tambah ledger `stock_movements` (baru)
Kolom: `product_id`, `movement_type` (`PURCHASE_IN|SALE_OUT|ONLINE_ORDER_OUT|RETURN_IN|ADJUSTMENT|REWARD_OUT`), `quantity` (signed), `reference_table`, `reference_id`, `notes`, `created_by`, `created_at`.
Trigger pencatatan dipasang di: `transaction_items`, `purchase_items`, `order_items` (saat order jadi `delivered`), `returns`, `customer_returns`, `stock_adjustments`, `point_exchanges`/`reward_redemption_requests` (saat approved).
RLS: read khusus staff/admin (via `profiles.role`), service_role full.

### C. Loyalty otomatis untuk order frontend
Function baru `apply_order_loyalty_on_delivered()`:
- Trigger di `orders AFTER UPDATE OF status` saat `NEW.status='delivered'` dan `OLD.status<>'delivered'`.
- Hitung `points = SUM(products.loyalty_points * order_items.quantity)` untuk order tersebut.
- `UPDATE customers SET total_points = total_points + points, total_spent = total_spent + NEW.total_amount WHERE id = NEW.customer_id`.
- `INSERT INTO point_transactions(customer_id, points_change, description)`.
- Reverse saat status pindah dari `delivered` ke status lain (rollback).

### D. Loyalty otomatis untuk POS
Function `apply_pos_loyalty()` trigger `transactions AFTER INSERT`:
- Jika `customer_id IS NOT NULL` → tambah `points_earned` ke `customers.total_points`, kurangi `points_used`, tambah `total_amount` ke `total_spent`. Catat `point_transactions`.
- (Hanya dipasang bila kode `usePOS` belum melakukannya — saya akan cek dulu sebelum aktifkan untuk hindari double-count.)

### E. Backfill historis
Satu kali, dalam migration yang sama:
```sql
-- Rebuild customers.total_spent / total_points dari data nyata
WITH order_agg AS (
  SELECT customer_id, SUM(total_amount) spent
  FROM orders WHERE status='delivered' GROUP BY customer_id
), pos_agg AS (
  SELECT customer_id, SUM(total_amount) spent, SUM(points_earned) earned, SUM(points_used) used
  FROM transactions WHERE customer_id IS NOT NULL GROUP BY customer_id
)
UPDATE customers c SET
  total_spent = COALESCE(o.spent,0) + COALESCE(p.spent,0),
  total_points = GREATEST(0, COALESCE(p.earned,0) - COALESCE(p.used,0) + <order_points_backfill>)
FROM ... ;
```
Plus backfill `stock_movements` dari `transaction_items`, `purchase_items`, `order_items` (delivered), `returns`, `customer_returns`.

### F. Tidak diubah
- UI checkout, cart, dan reward approval workflow tidak disentuh.
- RLS policies existing tetap.
- Schema `auth` / `storage` tidak disentuh.

## Output setelah migration
- Trigger terpasang (bukti: `information_schema.triggers` non-kosong).
- `customers.total_spent / total_points` ter-rebuild untuk semua customer historis.
- Order baru `delivered` → poin & spent customer naik otomatis, muncul di Account & Order History.
- Stok bergerak otomatis untuk POS / purchase / online order / return / reward.
- `stock_movements` jadi ledger tunggal untuk audit.

## Risiko
- Bila `usePOS` sudah menambah poin manual, trigger POS akan dobel — saya akan baca file dulu, baru putuskan aktifkan trigger D atau tidak.
- Backfill mengasumsikan order historis yang sudah `delivered` belum pernah memberi poin → poin akan masuk sekarang (sesuai keinginan user "rebuild berdasarkan data historis").
- Trigger `update_stock_on_order_delivery` yang dipasang sekarang **tidak** mengurangi stok untuk order historis yang sudah `delivered` sebelum migration (karena trigger jalan di event UPDATE baru) — backfill stock_movements akan mencatat, tapi `current_stock` tidak diutak-atik agar tidak merusak data yang sudah dikoreksi manual. Bisa ditambah opsi rebuild stok bila diminta.

Setujui rencana ini? Kalau ada bagian yang ingin di-skip (misal jangan rebuild poin historis, atau jangan pasang trigger POS), beri tahu sebelum saya jalankan migration.