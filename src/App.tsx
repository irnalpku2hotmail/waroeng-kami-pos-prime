
import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSkeleton from './components/inventory/LoadingSkeleton';

// Lazy load components with better chunking
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const Inventory = lazy(() => import('./pages/Inventory'));
const POS = lazy(() => import('./pages/POS'));
const Orders = lazy(() => import('./pages/Orders'));
const CategoriesUnits = lazy(() => import('./pages/CategoriesUnits'));
const Customers = lazy(() => import('./pages/Customers'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Expenses = lazy(() => import('./pages/Expenses'));
const PointsRewards = lazy(() => import('./pages/PointsRewards'));
const PointExchange = lazy(() => import('./pages/PointExchange'));
const FlashSales = lazy(() => import('./pages/FlashSales'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Settings = lazy(() => import('./pages/Settings'));
const CreditManagement = lazy(() => import('./pages/CreditManagement'));
const Profile = lazy(() => import('./pages/Profile'));
const Website = lazy(() => import('./pages/Website'));
const Frontend = lazy(() => import('./pages/Frontend'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Suspense fallback={<LoadingSkeleton />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Frontend />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/products" element={
                  <ProtectedRoute>
                    <Products />
                  </ProtectedRoute>
                } />
                
                <Route path="/inventory" element={
                  <ProtectedRoute>
                    <Inventory />
                  </ProtectedRoute>
                } />
                
                <Route path="/pos" element={
                  <ProtectedRoute>
                    <POS />
                  </ProtectedRoute>
                } />
                
                <Route path="/orders" element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                } />
                
                <Route path="/categories-units" element={
                  <ProtectedRoute>
                    <CategoriesUnits />
                  </ProtectedRoute>
                } />
                
                <Route path="/customers" element={
                  <ProtectedRoute>
                    <Customers />
                  </ProtectedRoute>
                } />
                
                <Route path="/suppliers" element={
                  <ProtectedRoute>
                    <Suppliers />
                  </ProtectedRoute>
                } />
                
                <Route path="/expenses" element={
                  <ProtectedRoute>
                    <Expenses />
                  </ProtectedRoute>
                } />
                
                <Route path="/points-rewards" element={
                  <ProtectedRoute>
                    <PointsRewards />
                  </ProtectedRoute>
                } />
                
                <Route path="/point-exchange" element={
                  <ProtectedRoute>
                    <PointExchange />
                  </ProtectedRoute>
                } />
                
                <Route path="/flash-sales" element={
                  <ProtectedRoute>
                    <FlashSales />
                  </ProtectedRoute>
                } />
                
                <Route path="/user-management" element={
                  <ProtectedRoute>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                
                <Route path="/credit" element={
                  <ProtectedRoute>
                    <CreditManagement />
                  </ProtectedRoute>
                } />
                
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                
                <Route path="/website" element={
                  <ProtectedRoute>
                    <Website />
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
