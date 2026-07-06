import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "sales_summary",
  title: "Sales summary",
  description:
    "Summarize transactions between two dates: total revenue, transaction count, and count grouped by source (POS vs FRONTEND_ORDER).",
  inputSchema: {
    start_date: z.string().describe("ISO date, e.g. 2026-07-01."),
    end_date: z.string().describe("ISO date, inclusive end, e.g. 2026-07-06."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ start_date, end_date }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await supabase
      .from("transactions")
      .select("id, total, source, created_at")
      .gte("created_at", `${start_date}T00:00:00Z`)
      .lte("created_at", `${end_date}T23:59:59Z`);
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    const rows = data ?? [];
    const revenue = rows.reduce((acc, r: any) => acc + Number(r.total ?? 0), 0);
    const bySource = rows.reduce<Record<string, { count: number; revenue: number }>>((acc, r: any) => {
      const key = r.source ?? "UNKNOWN";
      acc[key] ??= { count: 0, revenue: 0 };
      acc[key].count += 1;
      acc[key].revenue += Number(r.total ?? 0);
      return acc;
    }, {});
    const summary = { start_date, end_date, transaction_count: rows.length, total_revenue: revenue, by_source: bySource };
    return {
      content: [{ type: "text", text: JSON.stringify(summary) }],
      structuredContent: summary,
    };
  },
});