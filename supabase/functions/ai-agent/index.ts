import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyticsData {
  products: any[];
  transactions: any[];
  purchases: any[];
  searchAnalytics: any[];
  lowStockProducts: any[];
  customers: any[];
  expenses: any[];
}

async function fetchAnalyticsData(supabase: any): Promise<AnalyticsData> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const [
    productsRes,
    transactionsRes,
    purchasesRes,
    searchAnalyticsRes,
    customersRes,
    expensesRes
  ] = await Promise.all([
    supabase.from('products').select(`
      id, name, current_stock, min_stock, selling_price, base_price, 
      categories(name), units(name, abbreviation)
    `).eq('is_active', true),
    
    supabase.from('transactions').select(`
      id, total_amount, created_at, payment_type,
      transaction_items(quantity, total_price, products(name, id))
    `).gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: false }),
    
    supabase.from('purchases').select(`
      id, total_amount, purchase_date, supplier_id,
      suppliers(name),
      purchase_items(quantity, unit_cost, product_id, expiration_date, products(name))
    `).gte('purchase_date', thirtyDaysAgo.toISOString()).order('purchase_date', { ascending: false }),
    
    supabase.from('search_analytics').select('*')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(500),
    
    supabase.from('customers').select('*').order('total_spent', { ascending: false }).limit(100),
    
    supabase.from('expenses').select('*')
      .gte('expense_date', thirtyDaysAgo.toISOString())
      .order('expense_date', { ascending: false })
  ]);

  const products = productsRes.data || [];
  const lowStockProducts = products.filter((p: any) => p.current_stock <= p.min_stock);

  return {
    products,
    transactions: transactionsRes.data || [],
    purchases: purchasesRes.data || [],
    searchAnalytics: searchAnalyticsRes.data || [],
    lowStockProducts,
    customers: customersRes.data || [],
    expenses: expensesRes.data || []
  };
}

function buildSystemPrompt(data: AnalyticsData): string {
  // Calculate key metrics
  const totalRevenue = data.transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
  const totalTransactions = data.transactions.length;
  const totalExpenses = data.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  
  // Product sales analysis
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  data.transactions.forEach(t => {
    t.transaction_items?.forEach((item: any) => {
      const productId = item.products?.id;
      const productName = item.products?.name || 'Unknown';
      if (productId) {
        if (!productSales[productId]) {
          productSales[productId] = { name: productName, quantity: 0, revenue: 0 };
        }
        productSales[productId].quantity += item.quantity || 0;
        productSales[productId].revenue += item.total_price || 0;
      }
    });
  });
  
  const topSellingProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
  
  // Search analytics
  const searchTerms: Record<string, { count: number; noResults: number }> = {};
  data.searchAnalytics.forEach(s => {
    const term = s.search_query?.toLowerCase().trim();
    if (term) {
      if (!searchTerms[term]) {
        searchTerms[term] = { count: 0, noResults: 0 };
      }
      searchTerms[term].count++;
      if (s.results_count === 0) {
        searchTerms[term].noResults++;
      }
    }
  });
  
  const topSearches = Object.entries(searchTerms)
    .map(([term, data]) => ({ term, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  
  const noResultSearches = Object.entries(searchTerms)
    .filter(([_, data]) => data.noResults > 0)
    .map(([term, data]) => ({ term, noResultCount: data.noResults }))
    .sort((a, b) => b.noResultCount - a.noResultCount)
    .slice(0, 10);

  // Purchase suggestions based on stock and sales
  const purchaseSuggestions = data.products.map(p => {
    const sales = productSales[p.id];
    const avgDailySales = sales ? sales.quantity / 30 : 0;
    const daysOfStock = avgDailySales > 0 ? p.current_stock / avgDailySales : 999;
    const suggestedPurchase = Math.max(0, Math.ceil(avgDailySales * 14) - p.current_stock); // 2 weeks buffer
    
    return {
      name: p.name,
      currentStock: p.current_stock,
      minStock: p.min_stock,
      avgDailySales: avgDailySales.toFixed(1),
      daysOfStock: daysOfStock.toFixed(0),
      suggestedPurchase,
      category: p.categories?.name || 'Tanpa Kategori'
    };
  }).filter(p => p.suggestedPurchase > 0 || p.currentStock <= p.minStock)
    .sort((a, b) => a.daysOfStock - b.daysOfStock)
    .slice(0, 20);

  return `Kamu adalah AI Agent cerdas untuk aplikasi POS (Point of Sale) toko retail. Kamu membantu admin menganalisa data bisnis dan memberikan saran yang actionable.

## DATA REAL-TIME APLIKASI (30 hari terakhir):

### RINGKASAN KEUANGAN:
- Total Pendapatan: Rp ${totalRevenue.toLocaleString('id-ID')}
- Jumlah Transaksi: ${totalTransactions}
- Total Pengeluaran: Rp ${totalExpenses.toLocaleString('id-ID')}
- Laba Kotor: Rp ${(totalRevenue - totalExpenses).toLocaleString('id-ID')}

### PRODUK TERLARIS:
${topSellingProducts.map((p, i) => `${i + 1}. ${p.name}: ${p.quantity} unit (Rp ${p.revenue.toLocaleString('id-ID')})`).join('\n')}

### PRODUK STOK RENDAH (${data.lowStockProducts.length} produk):
${data.lowStockProducts.slice(0, 10).map(p => `- ${p.name}: ${p.current_stock}/${p.min_stock} (${p.categories?.name || 'Tanpa Kategori'})`).join('\n')}

### SARAN PEMBELIAN PRODUK:
${purchaseSuggestions.slice(0, 10).map(p => `- ${p.name}: Stok ${p.currentStock}, Rata-rata jual ${p.avgDailySales}/hari, Sisa ${p.daysOfStock} hari, BELI ${p.suggestedPurchase} unit`).join('\n')}

### ANALITIK PENCARIAN PELANGGAN:
Top Pencarian:
${topSearches.slice(0, 10).map((s, i) => `${i + 1}. "${s.term}": ${s.count}x`).join('\n')}

Pencarian Tanpa Hasil (Peluang Produk Baru):
${noResultSearches.map(s => `- "${s.term}": ${s.noResultCount}x dicari tapi tidak ada`).join('\n')}

### PELANGGAN TOP:
${data.customers.slice(0, 5).map((c, i) => `${i + 1}. ${c.name}: Rp ${c.total_spent?.toLocaleString('id-ID') || 0} (${c.total_points || 0} poin)`).join('\n')}

## KEMAMPUANMU:
1. Analisa laporan penjualan dan keuangan
2. Berikan saran pembelian produk berdasarkan histori penjualan dan stok
3. Analisa perilaku pencarian pelanggan dan identifikasi peluang
4. Identifikasi tren dan pola bisnis
5. Berikan rekomendasi aksi yang spesifik dan terukur

## ATURAN RESPONS:
- Jawab dalam Bahasa Indonesia yang natural dan profesional
- Berikan jawaban ringkas namun lengkap
- Gunakan angka dan data konkret dari konteks
- Berikan rekomendasi yang actionable
- Jika diminta analisa, berikan insight mendalam
- Format respons dengan bullet points atau numbering untuk kemudahan baca
- Konfirmasi setiap perintah dengan ringkasan hasil`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch analytics data
    const analyticsData = await fetchAnalyticsData(supabase);
    
    // Build system prompt with real data
    const systemPrompt = buildSystemPrompt(analyticsData);

    // Prepare messages
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Silakan coba lagi dalam beberapa saat." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kredit AI habis. Silakan tambahkan kredit di pengaturan workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Gagal terhubung ke AI gateway" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Agent error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
