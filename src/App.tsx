import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { PresenceProvider } from '@/contexts/PresenceContext';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import SearchResults from '@/pages/SearchResults';
import ProductDetail from '@/pages/ProductDetail';
import UserLocation from '@/pages/UserLocation';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import ProductDetails from '@/pages/ProductDetails';
import CategoriesUnits from '@/pages/CategoriesUnits';
import Inventory from '@/pages/Inventory';
import POS from '@/pages/POS';
import Orders from '@/pages/Orders';
import OrderHistory from '@/pages/OrderHistory';
import Customers from '@/pages/Customers';
import Suppliers from '@/pages/Suppliers';
import Purchases from '@/pages/Purchases';
import Returns from '@/pages/Returns';
import Expenses from '@/pages/Expenses';
import Reports from '@/pages/Reports';
import FlashSales from '@/pages/FlashSales';
import PointsRewards from '@/pages/PointsRewards';
import PointExchange from '@/pages/PointExchange';
import CreditManagement from '@/pages/CreditManagement';
import UserManagement from '@/pages/UserManagement';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import Notifications from '@/pages/Notifications';
import NotFound from '@/pages/NotFound';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { MapPin } from 'lucide-react';

function App() {
  return (
    <QueryClient>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <PresenceProvider>
              <Toaster />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/user-location" element={<UserLocation />} />
                
                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                  <Route path="/products" element={<Layout><Products /></Layout>} />
                  <Route path="/product-details/:id" element={<Layout><ProductDetails /></Layout>} />
                  <Route path="/categories-units" element={<Layout><CategoriesUnits /></Layout>} />
                  <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
                  <Route path="/pos" element={<Layout><POS /></Layout>} />
                  <Route path="/orders" element={<Layout><Orders /></Layout>} />
                  <Route path="/order-history" element={<Layout><OrderHistory /></Layout>} />
                  <Route path="/customers" element={<Layout><Customers /></Layout>} />
                  <Route path="/suppliers" element={<Layout><Suppliers /></Layout>} />
                  <Route path="/purchases" element={<Layout><Purchases /></Layout>} />
                  <Route path="/returns" element={<Layout><Returns /></Layout>} />
                  <Route path="/expenses" element={<Layout><Expenses /></Layout>} />
                  <Route path="/reports" element={<Layout><Reports /></Layout>} />
                  <Route path="/flash-sales" element={<Layout><FlashSales /></Layout>} />
                  <Route path="/points-rewards" element={<Layout><PointsRewards /></Layout>} />
                  <Route path="/point-exchange" element={<Layout><PointExchange /></Layout>} />
                  <Route path="/credit-management" element={<Layout><CreditManagement /></Layout>} />
                  <Route path="/user-management" element={<Layout><UserManagement /></Layout>} />
                  <Route path="/settings" element={<Layout><Settings /></Layout>} />
                  <Route path="/profile" element={<Layout><Profile /></Layout>} />
                  <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PresenceProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClient>
  );
}

export default App;
