
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";

// Import pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import ProductDetail from "./pages/ProductDetail";
import Categories from "./pages/Categories";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import Purchases from "./pages/Purchases";
import Returns from "./pages/Returns";
import POS from "./pages/POS";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Expenses from "./pages/Expenses";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import FlashSales from "./pages/FlashSales";
import PointsRewards from "./pages/PointsRewards";
import PointExchange from "./pages/PointExchange";
import CreditManagement from "./pages/CreditManagement";
import UserManagement from "./pages/UserManagement";
import UserLocations from "./pages/UserLocations";
import Inventory from "./pages/Inventory";
import SearchResults from "./pages/SearchResults";
import OrderHistory from "./pages/OrderHistory";
import Notifications from "./pages/Notifications";
import SearchAnalytics from "./pages/SearchAnalytics";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// 404 page
import NotFound from "./pages/NotFound";

function App() {
  return (
    <TooltipProvider>
      <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/order-history" element={<OrderHistory />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                <Route path="/products/:id" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
                <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
                <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
                <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
                <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
                <Route path="/returns" element={<ProtectedRoute><Returns /></ProtectedRoute>} />
                <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/flash-sales" element={<ProtectedRoute><FlashSales /></ProtectedRoute>} />
                <Route path="/points-rewards" element={<ProtectedRoute><PointsRewards /></ProtectedRoute>} />
                <Route path="/point-exchange" element={<ProtectedRoute><PointExchange /></ProtectedRoute>} />
                <Route path="/credit-management" element={<ProtectedRoute><CreditManagement /></ProtectedRoute>} />
                <Route path="/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
                <Route path="/user-locations" element={<ProtectedRoute><UserLocations /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/search-analytics" element={<ProtectedRoute><SearchAnalytics /></ProtectedRoute>} />
                
                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  );
}

export default App;
