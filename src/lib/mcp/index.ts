import { defineMcp } from "@lovable.dev/mcp-js";
import searchProducts from "./tools/search-products";
import getProduct from "./tools/get-product";
import listLowStock from "./tools/list-low-stock";
import salesSummary from "./tools/sales-summary";

export default defineMcp({
  name: "lapau-id-mcp",
  title: "LAPAU.ID MCP",
  version: "0.1.0",
  instructions:
    "Read-only tools for the LAPAU.ID retail app: search the product catalog, look up product details, list low-stock products, and summarize sales over a date range.",
  tools: [searchProducts, getProduct, listLowStock, salesSummary],
});