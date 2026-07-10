
# Rencana: Session Lock + Audit & Optimasi Performa Admin

Pekerjaan ini besar. Untuk menghormati batasan Anda ("jangan ubah business logic / UI / flow transaksi") saya bagi jadi 3 turn eksekusi berurutan. Setiap turn selesai, build hijau, aplikasi tetap jalan sebelum lanjut ke turn berikutnya.

## Turn 1 — Fitur baru + Laporan Audit (read-only)

### 1a. Stock Opname Session Lock/Unlock
- Tambah kolom `is_locked boolean default false` + `locked_at`, `locked_by` di `stock_opname_sessions` via migrasi.
- Auto-lock trigger: saat `status` berubah ke `in_review` atau `approved`, `is_locked = true`. Saat kembali ke `draft` (unlock manual admin), `is_locked = false`.
- RLS: hanya `admin`/`manager` boleh update `is_locked` langsung. Item update ditolak jika parent session `is_locked = true` (via trigger `BEFORE UPDATE` pada `stock_opname_items`).
- UI: badge "🔒 Locked" di `StockOpnameDetail.tsx`, disable input scan/qty/notes, sembunyikan tombol Save. Tombol "Unlock" hanya untuk admin bila status masih review.

### 1b. Laporan Audit Performa (dokumen, belum ubah kode lain)
Menghasilkan file `.lovable/perf-audit.md` berisi:
- Halaman yang menarik semua data (`allProducts`, `allAdjustments`, `allReturns`, `all-orders`, ...) — hasil grep.
- Query pakai `select('*')` atau nested join berat.
- Filter/sort di client (`Array.filter`, `.slice`, `.sort` setelah fetch).
- Komponen berat yang belum lazy-loaded (Charts recharts, ExcelExport, JsPDF, Leaflet, BarcodeScanner, QR).
- Rekomendasi index DB.
- Estimasi impact.

## Turn 2 — Refactor server-side (prioritas Anda)

Urutan: **Products → Orders → Transactions → Customers → Suppliers → Inventory → Purchases**.

Setiap halaman:
- Hook data: pindahkan search/filter/sort ke query Supabase (`.ilike`, `.eq`, `.gte/.lte`, `.order`, `.range`).
- Ganti `.slice()` client dengan `.range(from, to)` + `count: 'exact'` (atau `'planned'` bila cukup).
- `select()` hanya kolom yang dipakai tabel (bukan `*`).
- Selector page size 20/50/100 (default 20).
- Debounce input pencarian 400ms (`useDebouncedValue`).
- React Query: `staleTime: 30_000`, `gcTime: 5*60_000`, `refetchOnWindowFocus: false`, `keepPreviousData: true`, `placeholderData: keepPreviousData`.
- Prefetch halaman berikutnya via `queryClient.prefetchQuery` saat hover Next / idle.

Business logic (mutation, cart, POS, checkout, RLS policy, trigger) TIDAK diubah. Hanya lapisan data-fetch tabel admin.

## Turn 3 — Bundle & DB tuning

- `vite.config.ts` `manualChunks`: `react-vendor`, `charts` (recharts), `pdf` (jspdf/xlsx), `maps` (leaflet), `supabase`, `ui` (radix).
- Dynamic import: `Reports*`, `PriceHistoryChart`, `BarcodeScanner`, `SecureLocationPicker`, `ExcelImport`, `receiptGenerator`.
- Migrasi index: `products (is_active, name)`, `products (barcode)`, `orders (status, created_at desc)`, `orders (customer_id, created_at desc)`, `transactions (created_at desc)`, `transactions (customer_id, created_at desc)`, `stock_movements (product_id, created_at desc)`, `purchase_items (product_id)`. Skip yang sudah ada.
- Tambah `<img loading="lazy" decoding="async">` di tabel-tabel yang render thumbnail.

## Batasan yang saya jaga

- Tidak menyentuh: POS (`src/pages/POS.tsx`, `usePOS`), Marketplace/Home, Auth, Cart context, edge functions bisnis, RLS existing, trigger stok/loyalty.
- Tidak mengubah tampilan visual/urutan kolom/label — hanya sumber data & event handler debounce.
- Setiap perubahan halaman: jalankan build; kalau UI berubah tidak sengaja, revert halaman itu dan lapor.

## Konfirmasi

Turn 1 akan saya kerjakan segera setelah plan ini di-approve. Turn 2 & 3 saya lanjutkan di pesan berikutnya (masing-masing jadi PR mental terpisah supaya mudah di-review). Kalau ada halaman yang Anda ingin dikecualikan dari refactor server-side (mis. Reports/Dashboard yang butuh agregat), beri tahu sekarang.
