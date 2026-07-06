import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_products",
  title: "Search products",
  description:
    "Search the LAPAU.ID product catalog by name, barcode, or tag. Returns id, name, selling price, current stock, category, and barcode.",
  inputSchema: {
    query: z.string().min(1).describe("Search text: product name, barcode, or tag."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const max = limit ?? 10;
    const { data, error } = await supabase
      .from("products")
      .select("id, name, selling_price, current_stock, barcode, categories(name)")
      .or(`name.ilike.%${query}%,barcode.ilike.%${query}%`)
      .limit(max);
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { products: data ?? [] },
    };
  },
});