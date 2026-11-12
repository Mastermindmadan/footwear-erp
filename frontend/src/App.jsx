import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import ManagementSidebar from './components/ManagementSidebar';
import SalesSidebar from './components/SalesSidebar';

// Pages
import Login from './pages/Login';

// Management Pages
import ManagementDashboard from './pages/ManagementDashboard';
import BudgetTargets from './pages/BudgetTargets';
import SalesMonitoring from './pages/SalesMonitoring';
import PurchaseMonitoring from './pages/PurchaseMonitoring';
import InventoryOverview from './pages/InventoryOverview';
import RackDisplayOverview from './pages/RackDisplayOverview';
import AgeingClearance from './pages/AgeingClearance';
import DamagedGoods from './pages/DamagedGoods';
import VendorOverview from './pages/VendorOverview';
import FinancialOverview from './pages/FinancialOverview';
import CapitalOverview from './pages/CapitalOverview';
import SalesAnalytics from './pages/SalesAnalytics';
import PurchaseAnalytics from './pages/PurchaseAnalytics';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';

// Sales Executive Pages
import SalesDashboard from './pages/SalesDashboard';
import ProductSearch from './pages/ProductSearch';
import BarcodeScannerPage from './pages/BarcodeScannerPage';
import StockAvailability from './pages/StockAvailability';
import CartPage from './pages/CartPage';
import BillingPage from './pages/BillingPage';
import SalesHistory from './pages/SalesHistory';
import MySalesActivity from './pages/MySalesActivity';
import UserProfile from './pages/UserProfile';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Verifying Session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Role mismatch protection
    if (user.role === 'MANAGEMENT') {
      return <Navigate to="/management/dashboard" replace />;
    } else {
      return <Navigate to="/sales/dashboard" replace />;
    }
  }

  return children;
};

// Layout with contextual sidebar
const AppLayout = ({ children, moduleType }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        {moduleType === 'management' ? <ManagementSidebar /> : <SalesSidebar />}
        <main className="flex-1 overflow-y-auto bg-slate-50 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
};

// Root index redirector
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'MANAGEMENT') {
    return <Navigate to="/management/dashboard" replace />;
  } else {
    return <Navigate to="/sales/dashboard" replace />;
  }
};

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<RootRedirect />} />

              {/* Management Module Routes */}
              <Route
                path="/management/*"
                element={
                  <ProtectedRoute allowedRole="MANAGEMENT">
                    <AppLayout moduleType="management">
                      <Routes>
                        <Route path="dashboard" element={<ManagementDashboard />} />
                        <Route path="targets" element={<BudgetTargets />} />
                        <Route path="sales" element={<SalesMonitoring />} />
                        <Route path="purchases" element={<PurchaseMonitoring />} />
                        <Route path="inventory" element={<InventoryOverview />} />
                        <Route path="racks" element={<RackDisplayOverview />} />
                        <Route path="ageing" element={<AgeingClearance />} />
                        <Route path="damaged" element={<DamagedGoods />} />
                        <Route path="vendors" element={<VendorOverview />} />
                        <Route path="financials" element={<FinancialOverview />} />
                        <Route path="capital" element={<CapitalOverview />} />
                        <Route path="sales-analytics" element={<SalesAnalytics />} />
                        <Route path="purchase-analytics" element={<PurchaseAnalytics />} />
                        <Route path="reports" element={<ReportsPage />} />
                        <Route path="notifications" element={<NotificationsPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="*" element={<Navigate to="/management/dashboard" replace />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Sales Executive Module Routes */}
              <Route
                path="/sales/*"
                element={
                  <ProtectedRoute allowedRole="SALES_EXECUTIVE">
                    <AppLayout moduleType="sales">
                      <Routes>
                        <Route path="dashboard" element={<SalesDashboard />} />
                        <Route path="search" element={<ProductSearch />} />
                        <Route path="scanner" element={<BarcodeScannerPage />} />
                        <Route path="stock" element={<StockAvailability />} />
                        <Route path="cart" element={<CartPage />} />
                        <Route path="billing" element={<BillingPage />} />
                        <Route path="history" element={<SalesHistory />} />
                        <Route path="activity" element={<MySalesActivity />} />
                        <Route path="profile" element={<UserProfile />} />
                        <Route path="*" element={<Navigate to="/sales/dashboard" replace />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
