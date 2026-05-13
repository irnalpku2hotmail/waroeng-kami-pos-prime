import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    sourcemap: mode !== 'production',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router')) return 'router';
          if (id.includes('@tanstack/react-query')) return 'query';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          if (id.includes('xlsx')) return 'xlsx';
          if (id.includes('leaflet')) return 'maps';
          if (id.includes('html5-qrcode') || id.includes('react-barcode')) return 'barcode';
          if (id.includes('embla-carousel')) return 'carousel';
          if (id.includes('@radix-ui')) return 'radix';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('react-dom') || id.includes('/react/')) return 'react';
          return 'vendor';
        },
      },
    },
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
