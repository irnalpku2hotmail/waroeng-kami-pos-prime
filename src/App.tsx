import { lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";

// Eagerly load the public homepage so first-paint is fast
import Home from "./pages/Home";

// Lazy-load all other routes to shrink the initial JS bundle.
// Each route is fetched only when the user navigates to it.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Categories = lazy(() => import("./pages/Categories"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Customers = lazy(() => import("./pages/Customers"));
const Purchases = lazy(() => import("./pages/Purchases"));
const Returns = lazy(() => import("./pages/Returns"));
const POS = lazy(() => import("./pages/POS"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Profile = lazy(() => import("./pages/Profile"));
const Orders = lazy(() => import("./pages/Orders"));
const FlashSales = lazy(() => import("./pages/FlashSales"));
const PointsRewards = lazy(() => import("./pages/PointsRewards"));
const PointExchange = lazy(() => import("./pages/PointExchange"));
const CreditManagement = lazy(() => import("./pages/CreditManagement"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const UserLocations = lazy(() => import("./pages/UserLocations"));
const Inventory = lazy(() => import("./pages/Inventory"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const Notifications = lazy(() => import("./pages/Notifications"));
const SearchAnalytics = lazy(() => import("./pages/SearchAnalytics"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Bundles = lazy(() => import("./pages/Bundles"));
const BundleDetail = lazy(() => import("./pages/BundleDetail"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CustomerAccount = lazy(() => import("./pages/CustomerAccount"));
const RewardRedemptions = lazy(() => import("./pages/RewardRedemptions"));
const AuditReport = lazy(() => import("./pages/AuditReport"));
const StockOpname = lazy(() => import("./pages/StockOpname"));
const StockOpnameDetail = lazy(() => import("./pages/StockOpnameDetail"));

// Lightweight fallback (no large skeleton — just keeps layout from jumping)
const RouteFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
  </div>
);

function App() {
  return (
    <TooltipProvider>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/order-history" element={<OrderHistory />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/bundle/:slug" element={<BundleDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/account" element={<CustomerAccount />} />
                
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
                <Route path="/bundles" element={<ProtectedRoute><Bundles /></ProtectedRoute>} />
                <Route path="/reward-redemptions" element={<ProtectedRoute><RewardRedemptions /></ProtectedRoute>} />
                <Route path="/audit-report" element={<ProtectedRoute><AuditReport /></ProtectedRoute>} />
                <Route path="/stock-opname" element={<ProtectedRoute><StockOpname /></ProtectedRoute>} />
                <Route path="/stock-opname/:id" element={<ProtectedRoute><StockOpnameDetail /></ProtectedRoute>} />
                
                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </TooltipProvider>
  );
}

export default App;
