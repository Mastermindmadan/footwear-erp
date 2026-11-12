import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import InvoiceModal from '../components/InvoiceModal';
import {
  DollarSign,
  Receipt,
  Boxes,
  Target,
  ArrowRight,
  Search,
  ScanBarcode,
  ShoppingCart,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

const SalesDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const { showToast } = useToast();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/sales-exec');
      setData(res.data);
    } catch (err) {
      showToast('Failed to load sales stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3 text-slate-600">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
          <span className="text-sm font-semibold tracking-tight">Loading POS terminal statistics...</span>
        </div>
      </div>
    );
  }

  const {
    todaySales,
    todayBills,
    todayProductsSold,
    monthSales,
    dailyTarget,
    dailyAchievement,
    monthlyTarget,
    monthlyAchievement,
    recentSales,
  } = data;

  return (
    <div className="p-6 md:p-8 w-full max-w-[1550px] mx-auto space-y-6">
      {/* Top Banner with High-contrast CTA */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-7 text-white shadow-xl shadow-emerald-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-emerald-700/40">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
              Shift Terminal Active
            </span>
            <span className="text-xs text-slate-300 font-medium">&bull; Bangalore Flagship</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-2">Welcome back, {user?.name}!</h1>
          <p className="text-sm text-slate-300 font-medium mt-1">
            Ready for fast customer checkout, instant barcode scanning, and inventory check
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <Link
            to="/sales/scanner"
            className="inline-flex items-center space-x-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-2xl text-xs transition-all shadow-md hover:scale-102 cursor-pointer"
          >
            <ScanBarcode className="w-4 h-4" />
            <span>Scan Shoe Barcode</span>
          </Link>
          <Link
            to="/sales/billing"
            className="inline-flex items-center space-x-2 px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 font-extrabold rounded-2xl text-xs transition-all shadow-md hover:scale-102 cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>New POS Bill</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="erp-card p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">₹{todaySales.toLocaleString()}</p>
            <p className="text-xs font-bold text-emerald-600 mt-1">{todayBills} bills closed today</p>
          </div>
        </div>

        {/* Pairs Sold */}
        <div className="erp-card p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pairs Sold</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">{todayProductsSold} pairs</p>
            <p className="text-xs font-medium text-slate-400 mt-1">Deducted live from inventory</p>
          </div>
        </div>

        {/* Daily Shift Target */}
        <div className="erp-card p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Daily Shift Target</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">₹{dailyTarget.toLocaleString()}</p>
              <span className="text-xs font-bold text-indigo-600">{dailyAchievement}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, dailyAchievement)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Monthly Target Progress */}
        <div className="erp-card p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Quota</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-purple-700 font-mono tracking-tight">₹{monthSales.toLocaleString()}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              {monthlyAchievement}% of ₹{monthlyTarget.toLocaleString()} quota
            </p>
          </div>
        </div>
      </div>

      {/* POS Quick Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Link
          to="/sales/search"
          className="erp-card p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-500 flex items-center space-x-4 group cursor-pointer transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors flex-shrink-0">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Product Search</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Lookup sizes, colours & prices</p>
          </div>
        </Link>

        <Link
          to="/sales/scanner"
          className="erp-card p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-500 flex items-center space-x-4 group cursor-pointer transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
            <ScanBarcode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Barcode Scanner</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Scan box to pinpoint shelf slot</p>
          </div>
        </Link>

        <Link
          to="/sales/billing"
          className="erp-card p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-500 flex items-center space-x-4 group cursor-pointer transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors flex-shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Express POS Billing</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Instant checkout & thermal receipt</p>
          </div>
        </Link>
      </div>

      {/* Recent Transactions by this Salesperson */}
      <div className="erp-card rounded-3xl border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Recent Closed Transactions</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Click any row to re-print or inspect receipt</p>
          </div>
          <span className="text-xs text-slate-400 font-mono font-medium">{recentSales.length} bills generated</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Footwear Items</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-5 text-right">Bill Total</th>
                <th className="py-3 px-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSales.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setSelectedSale(s)}
                  className="hover:bg-emerald-50/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-5 font-mono font-bold text-emerald-700 group-hover:underline">
                    {s.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-xs">
                    {new Date(s.saleDate).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {s.customer?.name || 'Walk-in Customer'}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 font-medium text-xs">
                    {s.items?.map((it) => `${it.quantity}x ${it.variant?.product?.name}`).join(', ')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 font-bold text-slate-800 text-xs border border-slate-200/80">
                      {s.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right font-black text-slate-900 font-mono">
                    ₹{s.grandTotal.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSale(s);
                      }}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSale && (
        <InvoiceModal
          isOpen={!!selectedSale}
          onClose={() => setSelectedSale(null)}
          sale={selectedSale}
        />
      )}
    </div>
  );
};

export default SalesDashboard;
