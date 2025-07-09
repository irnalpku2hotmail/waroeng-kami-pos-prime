
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import CategoriesUnits from "./pages/CategoriesUnits";
import Suppliers from "./pages/Suppliers";
import POS from "./pages/POS";
import Inventory from "./pages/Inventory";
import Customers from "./pages/Customers";
import Purchases from "./pages/Purchases";
import Returns from "./pages/Returns";
import Expenses from "./pages/Expenses";
import PointsRewards from "./pages/PointsRewards";
import PointExchange from "./pages/PointExchange";
import FlashSales from "./pages/FlashSales";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import CreditManagement from "./pages/CreditManagement";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories-units" element={<CategoriesUnits />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/points-rewards" element={<PointsRewards />} />
            <Route path="/point-exchange" element={<PointExchange />} />
            <Route path="/flash-sales" element={<FlashSales />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/credit-management" element={<CreditManagement />} />
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
