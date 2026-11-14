import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import ManagementSidebar from './components/ManagementSidebar';
import SalesSidebar from './components/SalesSidebar';

// Pages - Lazy Loaded for Fast Initial Page Load & Code Splitting
const Login = lazy(() => import('./pages/Login'));

// Management Pages
const ManagementDashboard = lazy(() => import('./pages/ManagementDashboard'));
const BudgetTargets = lazy(() => import('./pages/BudgetTargets'));
const SalesMonitoring = lazy(() => import('./pages/SalesMonitoring'));
const PurchaseMonitoring = lazy(() => import('./pages/PurchaseMonitoring'));
const InventoryOverview = lazy(() => import('./pages/InventoryOverview'));
const RackDisplayOverview = lazy(() => import('./pages/RackDisplayOverview'));
const AgeingClearance = lazy(() => import('./pages/AgeingClearance'));
const DamagedGoods = lazy(() => import('./pages/DamagedGoods'));
const VendorOverview = lazy(() => import('./pages/VendorOverview'));
const FinancialOverview = lazy(() => import('./pages/FinancialOverview'));
const CapitalOverview = lazy(() => import('./pages/CapitalOverview'));
const SalesAnalytics = lazy(() => import('./pages/SalesAnalytics'));
const PurchaseAnalytics = lazy(() => import('./pages/PurchaseAnalytics'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Sales Executive Pages
const SalesDashboard = lazy(() => import('./pages/SalesDashboard'));
const ProductSearch = lazy(() => import('./pages/ProductSearch'));
const BarcodeScannerPage = lazy(() => import('./pages/BarcodeScannerPage'));
const StockAvailability = lazy(() => import('./pages/StockAvailability'));
const CartPage = lazy(() => import('./pages/CartPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const SalesHistory = lazy(() => import('./pages/SalesHistory'));
const MySalesActivity = lazy(() => import('./pages/MySalesActivity'));
const UserProfile = lazy(() => import('./pages/UserProfile'));

// Fast loading skeleton spinner
const PageLoader = () => (
  <div className="flex-1 min-h-[400px] flex items-center justify-center">
    <div className="flex items-center space-x-3 px-4 py-3 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-slate-600">Loading view...</span>
    </div>
  </div>
);

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
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        {moduleType === 'management' ? <ManagementSidebar /> : <SalesSidebar />}
        <main className="flex-1 overflow-y-auto bg-slate-50">
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
            <Suspense fallback={<PageLoader />}>
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
                        <Suspense fallback={<PageLoader />}>
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
                        </Suspense>
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
                        <Suspense fallback={<PageLoader />}>
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
                        </Suspense>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all */}
                <Route path="*" element={<RootRedirect />} />
              </Routes>
            </Suspense>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
