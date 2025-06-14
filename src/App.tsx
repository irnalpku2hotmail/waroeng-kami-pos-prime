
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/ProtectedRoute';

// Auth pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

// Main pages
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import CategoriesUnits from '@/pages/CategoriesUnits';
import Categories from '@/pages/Categories';
import Units from '@/pages/Units';
import Suppliers from '@/pages/Suppliers';
import POS from '@/pages/POS';
import Inventory from '@/pages/Inventory';
import Customers from '@/pages/Customers';
import Orders from '@/pages/Orders';
import CreditManagement from '@/pages/CreditManagement';
import Expenses from '@/pages/Expenses';
import PointsRewards from '@/pages/PointsRewards';
import PointExchange from '@/pages/PointExchange';
import FlashSales from '@/pages/FlashSales';
import Settings from '@/pages/Settings';
import UserManagement from '@/pages/UserManagement';
import Profile from '@/pages/Profile';
import Frontend from '@/pages/Frontend';
import Returns from '@/pages/Returns';
import Purchases from '@/pages/Purchases';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/frontend" element={<Frontend />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
              <Route path="/categories-units" element={<ProtectedRoute><CategoriesUnits /></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
              <Route path="/units" element={<ProtectedRoute><Units /></ProtectedRoute>} />
              <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
              <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/credit-management" element={<ProtectedRoute><CreditManagement /></ProtectedRoute>} />
              <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
              <Route path="/points-rewards" element={<ProtectedRoute><PointsRewards /></ProtectedRoute>} />
              <Route path="/point-exchange" element={<ProtectedRoute><PointExchange /></ProtectedRoute>} />
              <Route path="/flash-sales" element={<ProtectedRoute><FlashSales /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/returns" element={<ProtectedRoute><Returns /></ProtectedRoute>} />
              <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />

              {/* Catch all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
