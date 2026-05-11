## Diagnosa: Mengapa frontend lambat (Lighthouse 50)

Saya menelusuri Lighthouse report, kode komponen homepage, dan memori proyek. Penyebab utama dapat dikelompokkan menjadi 4 masalah besar — dengan dampak terukur dari laporan:

### 1. Gambar TIDAK dioptimasi (penghemat ~10.582 KiB / penyebab LCP 4,1s)
Memory proyek menyatakan **"Always use getOptimizedImageUrl"**, tapi `rg getOptimizedImageUrl` di `src/components/home`, `src/components/frontend`, dan `src/components/bundles` **tidak menemukan satu pun pemakaian**. Akibatnya:

- **Banner LCP** (`storage.googleapis.com/.../1731662827256...jpg`) diunduh sebesar **906 KB** padahal ditampilkan 858×363 → boros 854 KB.
- **Ikon kategori** 48×48 px dimuat dalam ukuran asli 800–1080 px:
  - `1750026111209.jpg` = 670 KB (boros 669 KB)
  - `1762655053932.png` = 470 KB
  - `1749879821272.jpg` = 425 KB
  - dsb. (puluhan file ≥50 KB)
- **Logo brand** 48×48 px dimuat dalam resolusi 300–1500 px (puluhan file 40–60 KB).
- **Gambar produk** card 168×168 px dimuat dari file 300–1000 px.
- Banyak file JPG/PNG yang seharusnya WebP/AVIF.

File terkonfirmasi tanpa optimasi: `CategoryGrid.tsx`, `BrandScroller.tsx`, `CompactBannerCarousel.tsx`, `BundleCarousel.tsx`, `TrendingProducts.tsx`, `ModernFrontendFlashSale.tsx`, `PromoProducts.tsx`, `AllProducts.tsx`.

### 2. Cumulative Layout Shift = 0.519 (target <0.1) — penyebab CLS-culprit utama
Pola di `src/pages/Home.tsx`: setiap section dibungkus `LazySection` dengan placeholder kecil (mis. `h-28`, `h-48`) lalu **diganti komponen jauh lebih tinggi** saat di-mount. Ini terjadi pada `TrendingProducts`, `ModernFrontendFlashSale`, `BundleCarousel`, `PromoProducts`, `AllProducts` → menggeser semua konten di bawahnya.

Lighthouse menyorot satu wadah `div.px-4.max-w-7xl.mx-auto.space-y-4.mt-4` menyumbang **0.51** dari 0.52 total CLS.

### 3. JS bundle terlalu besar (penghemat ~586 KiB)
- `index-Boztu6TC.js` = **781 KB** transfer, 76% tidak terpakai pada load awal.
- Tidak ada `manualChunks` di `vite.config.ts` → React, Supabase, react-query, lucide, semua shadcn-radix, recharts/chart, dll. masuk satu chunk.
- `EnhancedFrontendCartModal`, `AuthModal`, `WhatsAppFloatingButton`, `AIAgentButton`, dan halaman admin masuk bundle awal walau tidak dipakai.

### 4. Resource hints & cache headers
- `index.html` mem-preload banner LCP `storage.googleapis.com/...` tapi **tanpa `fetchpriority="high"`**, dan tag `<img>`-nya pakai `loading="lazy"` (terlihat di audit `lcp-discovery-insight: priorityHinted=false`).
- Tidak ada `<link rel="preconnect">` ke `https://fkqfdwxunnymmsutbeuu.supabase.co` (origin paling dominan untuk image+REST). Memory proyek mengklaim sudah ada — perlu diverifikasi & ditambahkan kalau hilang.
- Cache TTL Supabase Storage hanya 1 jam (12 MB "wasted bytes") — ini batasan platform Supabase Storage default, tidak bisa kita ubah dari sisi app, tapi bisa dimitigasi dengan transformasi gambar yang menghasilkan file jauh lebih kecil.

---

## Rencana Perbaikan (tanpa mengubah desain)

### A. Aktifkan Supabase image transformation di SEMUA gambar dinamis
Menggunakan helper `getOptimizedImageUrl` yang sudah ada di proyek (sesuai memory). Ganti `src={url}` menjadi `src={getOptimizedImageUrl(url, { width, quality, format:'webp' })}` untuk:

| Komponen | Ukuran target |
|---|---|
| `CategoryGrid.tsx` (icon) | 96×96 webp q70 |
| `BrandScroller.tsx` (logo) | 96×96 webp q70 |
| `CompactBannerCarousel.tsx` | 1200 lebar webp q75 + `srcset` mobile 720 |
| `BundleCarousel.tsx`, `TrendingProducts.tsx`, `PromoProducts.tsx`, `AllProducts.tsx`, `ModernFrontendFlashSale.tsx` | 360×360 webp q70 (card 4:3) |

Estimasi penghematan: **~10 MB → ~1 MB** image payload.

### B. Cegah CLS dari LazySection
Ubah placeholder di `Home.tsx` agar **tinggi mendekati tinggi konten final**:
- `CategoryGrid` → `h-44` (2 baris ikon 64px)
- `TrendingProducts`/`PromoProducts`/`AllProducts` → `h-[280px]`/`h-[560px]` sesuai grid
- `ModernFrontendFlashSale`, `BundleCarousel` → `h-56`

Tambahan: pastikan tiap `<img>` punya `width`/`height` eksplisit atau `aspect-ratio` (sebagian sudah pakai `aspect-[4/3]`, tapi banner dan ikon kategori belum).

### C. Code splitting & pengurangan bundle
1. Tambah `build.rollupOptions.output.manualChunks` di `vite.config.ts`:
   ```text
   react        → react, react-dom, react-router-dom
   supabase     → @supabase/*
   query        → @tanstack/react-query
   ui           → @radix-ui/*, lucide-react
   charts       → recharts (jika ada)
   ```
2. Lazy-load `EnhancedFrontendCartModal`, `AuthModal`, `WhatsAppFloatingButton`, `AIAgentButton`, `MobileBottomNav` (sebagian sudah).
3. Pastikan halaman admin (`Layout`, sidebar, dsb.) tidak ikut tertarik dari `App.tsx` saat user di Home — verifikasi semua route admin pakai `lazy()`.

### D. Resource hints di `index.html`
- Tambah `<link rel="preconnect" href="https://fkqfdwxunnymmsutbeuu.supabase.co" crossorigin>`.
- Pada banner preload, tambah `fetchpriority="high"` dan ganti URL ke versi ter-resize (jika di-host di Supabase). Untuk gambar `googleusercontent`/`googleapis` di banner, **upload ulang ke Supabase Storage** agar bisa di-transform & cache lebih efisien.
- Pada `<img>` LCP banner pertama, set `loading="eager"` + `fetchpriority="high"` (saat ini `loading="lazy"`).

### E. Quick wins tambahan
- Hapus dependency yang tidak dipakai di Home (audit `unused-javascript`).
- Tambah `decoding="async"` di semua `<img>` non-LCP.
- Pertimbangkan virtualisasi `BrandScroller` (saat ini render ratusan `<img>` brand sekaligus).

---

## Ekspektasi setelah perbaikan
| Metrik | Sekarang | Target |
|---|---|---|
| Performance score | 50 | 80–90 |
| LCP | 4,1 s | <2,5 s |
| CLS | 0,519 | <0,1 |
| Total payload | 17 MB | ~3–4 MB |
| JS transfer | 781 KB | ~350 KB awal |

Desain visual **tidak berubah** — semua perbaikan bersifat optimasi aset & loading. Setelah Anda menyetujui plan ini, saya akan mengeksekusinya bertahap (A & B dulu karena dampak terbesar, lalu C–E).
