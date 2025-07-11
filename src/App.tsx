
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { PresenceProvider } from '@/contexts/PresenceContext';
import ProtectedRoute from '@/components/ProtectedRoute';

// Import pages
import Home from '@/pages/Home';
import ProductDetail from '@/pages/ProductDetail';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import ProductDetails from '@/pages/ProductDetails';
import Orders from '@/pages/Orders';
import Customers from '@/pages/Customers';
import Suppliers from '@/pages/Suppliers';
import Purchases from '@/pages/Purchases';
import Returns from '@/pages/Returns';
import Inventory from '@/pages/Inventory';
import Reports from '@/pages/Reports';
import POS from '@/pages/POS';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import UserManagement from '@/pages/UserManagement';
import CategoriesUnits from '@/pages/CategoriesUnits';
import Expenses from '@/pages/Expenses';
import CreditManagement from '@/pages/CreditManagement';
import PointsRewards from '@/pages/PointsRewards';
import PointExchange from '@/pages/PointExchange';
import FlashSales from '@/pages/FlashSales';
import Frontend from '@/pages/Frontend';
import Notifications from '@/pages/Notifications';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <CartProvider>
            <PresenceProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
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
                <Route path="/products/:id" element={
                  <ProtectedRoute>
                    <ProductDetails />
                  </ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute>
                    <Orders />
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
                <Route path="/purchases" element={
                  <ProtectedRoute>
                    <Purchases />
                  </ProtectedRoute>
                } />
                <Route path="/returns" element={
                  <ProtectedRoute>
                    <Returns />
                  </ProtectedRoute>
                } />
                <Route path="/inventory" element={
                  <ProtectedRoute>
                    <Inventory />
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                } />
                <Route path="/pos" element={
                  <ProtectedRoute>
                    <POS />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/user-management" element={
                  <ProtectedRoute>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                <Route path="/categories-units" element={
                  <ProtectedRoute>
                    <CategoriesUnits />
                  </ProtectedRoute>
                } />
                <Route path="/expenses" element={
                  <ProtectedRoute>
                    <Expenses />
                  </ProtectedRoute>
                } />
                <Route path="/credit-management" element={
                  <ProtectedRoute>
                    <CreditManagement />
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
                <Route path="/frontend" element={
                  <ProtectedRoute>
                    <Frontend />
                  </ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } />
                
                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </PresenceProvider>
          </CartProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
