import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { PresenceProvider } from './contexts/PresenceContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import './index.css';

// Global cache tuning — reduces Supabase requests dramatically
// without changing any business logic or UI.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,          // 30s: treat data as fresh, skip refetch
      gcTime: 5 * 60_000,         // 5m: keep in cache for back-navigation
      refetchOnWindowFocus: false,// avoid duplicate fetches on tab switch
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SidebarProvider>
            <CartProvider>
              <PresenceProvider>
                <App />
                <Toaster />
                <Sonner />
              </PresenceProvider>
            </CartProvider>
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
);
