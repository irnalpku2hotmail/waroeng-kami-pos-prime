import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "get_product",
  title: "Get product details",
  description: "Fetch full details for a single product by id or barcode.",
  inputSchema: {
    id: z.string().uuid().optional().describe("Product UUID."),
    barcode: z.string().optional().describe("Product barcode."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, barcode }) => {
    if (!id && !barcode) {
      return { content: [{ type: "text", text: "Provide id or barcode." }], isError: true };
    }
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    let q = supabase.from("products").select("*, categories(name), brands(name)").limit(1);
    q = id ? q.eq("id", id) : q.eq("barcode", barcode!);
    const { data, error } = await q.maybeSingle();
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    if (!data) {
      return { content: [{ type: "text", text: "Product not found." }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { product: data },
    };
  },
});