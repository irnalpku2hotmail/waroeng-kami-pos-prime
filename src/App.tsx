
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import { CartProvider } from './contexts/CartContext';

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const Products = lazy(() => import('./pages/Products'));
const CategoriesAndUnits = lazy(() => import('./pages/CategoriesUnits'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Purchases = lazy(() => import('./pages/Purchases'));
const Returns = lazy(() => import('./pages/Returns'));
const Orders = lazy(() => import('./pages/Orders'));
const CreditManagement = lazy(() => import('./pages/CreditManagement'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Rewards = lazy(() => import('./pages/Rewards'));
const FlashSales = lazy(() => import('./pages/FlashSales'));
const Settings = lazy(() => import('./pages/Settings'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Website = lazy(() => import('./pages/Website'));
const POS = lazy(() => import('./pages/POS'));
const Frontend = lazy(() => import('./pages/Frontend'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute><Layout><Customers /></Layout></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute><Layout><Products /></Layout></ProtectedRoute>} />
              <Route path="/products/:id" element={<ProtectedRoute><Layout><ProductDetails /></Layout></ProtectedRoute>} />
              <Route path="/categories-units" element={<ProtectedRoute><Layout><CategoriesAndUnits /></Layout></ProtectedRoute>} />
              <Route path="/suppliers" element={<ProtectedRoute><Layout><Suppliers /></Layout></ProtectedRoute>} />
              <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
              <Route path="/pos/:id" element={<ProtectedRoute><POS /></ProtectedRoute>} />
              <Route path="/frontend" element={<Frontend />} />
              <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
              <Route path="/purchases" element={<ProtectedRoute><Layout><Purchases /></Layout></ProtectedRoute>} />
              <Route path="/returns" element={<ProtectedRoute><Layout><Returns /></Layout></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Layout><Orders /></Layout></ProtectedRoute>} />
              <Route path="/credit-management" element={<ProtectedRoute><Layout><CreditManagement /></Layout></ProtectedRoute>} />
              <Route path="/expenses" element={<ProtectedRoute><Layout><Expenses /></Layout></ProtectedRoute>} />
              <Route path="/rewards" element={<ProtectedRoute><Layout><Rewards /></Layout></ProtectedRoute>} />
              <Route path="/flash-sales" element={<ProtectedRoute><Layout><FlashSales /></Layout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
              <Route path="/user-management" element={<ProtectedRoute><Layout><UserManagement /></Layout></ProtectedRoute>} />
              <Route path="/website" element={<ProtectedRoute><Layout><Website /></Layout></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </Router>
        <Toaster />
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
