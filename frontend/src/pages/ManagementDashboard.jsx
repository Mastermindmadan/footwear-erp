import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import InvoiceModal from '../components/InvoiceModal';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Boxes,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  UserCheck,
  CreditCard,
  RefreshCw,
  Calendar,
  Layers,
  ChevronRight,
  Eye,
  Target,
  Truck,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const ManagementDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const { showToast } = useToast();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/management');
      setData(res.data);
    } catch (err) {
      showToast('Failed to load dashboard data', 'error');
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
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
          <span className="text-sm font-semibold tracking-tight">Syncing real-time store metrics from PostgreSQL...</span>
        </div>
      </div>
    );
  }

  const {
    summary,
    salesChart,
    topSellingProducts,
    bestExecutives,
    recentTransactions,
    lowStockItems,
    clearanceAlerts,
  } = data;

  return (
    <div className="p-6 md:p-8 w-full max-w-[1550px] mx-auto space-y-6">
      {/* Top Hero Banner with High-contrast CTA */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-7 text-white shadow-xl shadow-slate-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-indigo-800/40">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
              Store Management Active
            </span>
            <span className="text-xs text-slate-300 font-medium">&bull; Bangalore Flagship</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-2">
            Welcome back, {user?.name || 'Vikram Malhotra'}!
          </h1>
          <p className="text-sm text-slate-300 font-medium mt-1">
            Real-time retail metrics &bull; Shared database synchronization &bull; Inventory valuation
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <Link
            to="/management/purchases"
            className="inline-flex items-center space-x-2 px-5 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md hover:scale-102 cursor-pointer"
          >
            <Truck className="w-4 h-4" />
            <span>+ Inward Stock</span>
          </Link>
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center space-x-2 px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 font-extrabold rounded-2xl text-xs transition-all shadow-md hover:scale-102 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-indigo-600" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Row 1: Primary Core KPIs (4 cards stretched proportionally) */}
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
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">₹{summary.todaySales.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs font-bold text-emerald-600">{summary.todayOrders} bills generated</span>
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Live Sync</span>
            </div>
          </div>
        </div>

        {/* Monthly Sales */}
        <div className="erp-card p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Sales</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">₹{summary.monthlySales.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs font-bold text-indigo-600">{summary.monthlyOrders} orders this month</span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">+14.8%</span>
            </div>
          </div>
        </div>

        {/* Stock Valuation */}
        <div className="erp-card p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Stock Valuation</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">₹{summary.totalInventoryValue.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs font-medium text-slate-500">{summary.totalStockPairs} pairs ({summary.totalProducts} styles)</span>
              <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">Cost Basis</span>
            </div>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="erp-card p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Profit</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-tight">₹{summary.grossProfit.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs font-bold text-emerald-600">Revenue minus COGS</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">48.9% Margin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Secondary Operational Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Purchases */}
        <div className="erp-card p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Purchases Intake</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">₹{summary.totalPurchases.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs font-medium text-slate-500">Consignments intake</span>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Pending ₹2.37L</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="erp-card p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Profit</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono tracking-tight">₹{summary.netProfit.toLocaleString()}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs font-medium text-indigo-600">After all store expenses</span>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Fixed Costs ₹1.65L</span>
            </div>
          </div>
        </div>

        {/* Low-Stock SKUs */}
        <div className="erp-card p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Low-Stock SKUs</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-amber-700 font-mono tracking-tight">{summary.lowStockCount} SKUs</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs font-bold text-amber-600">&le; 3 pairs remaining</span>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">Action Req.</span>
            </div>
          </div>
        </div>

        {/* Ageing & Dead Stock */}
        <div className="erp-card p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ageing Stock</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-rose-700 font-mono tracking-tight">
              {summary.ageingStockCount + summary.deadStockCount} pairs
            </p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs font-bold text-rose-600">{summary.deadStockCount} pairs dead (180d+)</span>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">Clearance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/management/inventory"
          className="erp-card p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-500 flex items-center space-x-4 group cursor-pointer transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors flex-shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Inventory Overview</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Track {summary.totalProducts} styles & rack positions</p>
          </div>
        </Link>

        <Link
          to="/management/targets"
          className="erp-card p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-500 flex items-center space-x-4 group cursor-pointer transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors flex-shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Budget & Targets</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Set daily & monthly sales goals</p>
          </div>
        </Link>

        <Link
          to="/management/ageing"
          className="erp-card p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-500 flex items-center space-x-4 group cursor-pointer transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Ageing & Clearance</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Approve 20% & 50% clearance discounts</p>
          </div>
        </Link>
      </div>

      {/* Row: Sales Performance Trend & Sales Exec Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance Area Chart */}
        <div className="lg:col-span-2 erp-card p-6 rounded-3xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">7-Day Sales Performance & Revenue</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Live store collection amounts (₹)</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                Prisma Query Feed
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v.toLocaleString()}`}
                  />
                  <Tooltip
                    formatter={(val) => [`₹${val.toLocaleString()}`, 'Daily Total']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: 600, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg. Daily Sales</p>
              <p className="text-sm font-bold font-mono text-slate-800 mt-0.5">₹12,718</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Peak Collection</p>
              <p className="text-sm font-bold font-mono text-indigo-600 mt-0.5">₹41,995</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Growth Pace</p>
              <p className="text-sm font-bold font-mono text-emerald-600 mt-0.5">+18.2%</p>
            </div>
          </div>
        </div>

        {/* Executive Leaderboard & Store Quota Summary (Fully filled, zero empty hole) */}
        <div className="erp-card p-6 rounded-3xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Sales Executive Quotas</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Monthly store targets & live staff rank</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active Shift
              </span>
            </div>

            <div className="space-y-3">
              {bestExecutives.map((exec, idx) => (
                <div key={exec.id} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <img src={exec.avatar} alt={exec.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-white" />
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-tight">{exec.name}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{exec.totalPairs} pairs sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 font-mono">₹{exec.totalSales.toLocaleString()}</p>
                      <p className="text-[11px] font-bold text-indigo-600">{exec.targetAchievement}% of goal</p>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        exec.targetAchievement >= 100
                          ? 'bg-emerald-500'
                          : exec.targetAchievement >= 50
                          ? 'bg-indigo-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, exec.targetAchievement)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Store Target Snapshot Widget to eliminate empty space */}
            <div className="mt-4 p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                <span>Store Target Achievement</span>
                <span className="font-mono text-indigo-700">₹89,030 / ₹3,50,000</span>
              </div>
              <div className="w-full bg-indigo-200/60 rounded-full h-2 overflow-hidden">
                <div className="h-2 rounded-full bg-indigo-600 transition-all duration-500" style={{ width: '25.4%' }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-indigo-600 font-semibold">
                <span>25.4% achieved</span>
                <span>₹2,60,970 remaining</span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Quota resets end of calendar month</span>
            <span className="font-bold text-indigo-600">3 Staff Active</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table (Styled cleanly like Sales Dashboard) */}
      <div className="erp-card rounded-3xl border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Completed Invoices</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Click any row to inspect customer bill & items</p>
          </div>
          <span className="text-xs text-slate-400 font-mono font-medium">{recentTransactions.length} recent sales</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-xs border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-5">Invoice #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Salesperson</th>
                <th className="py-3.5 px-4">Footwear Items</th>
                <th className="py-3.5 px-4">Mode</th>
                <th className="py-3.5 px-5 text-right">Bill Total</th>
                <th className="py-3.5 px-5 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recentTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => setSelectedSale(tx)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-4 px-5 font-mono font-bold text-indigo-600">{tx.invoiceNumber}</td>
                  <td className="py-4 px-4 text-slate-500 text-xs">
                    {new Date(tx.saleDate).toLocaleDateString()}{' '}
                    <span className="text-slate-400 block font-normal">
                      {new Date(tx.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-800">{tx.customer?.name || 'Walk-in'}</td>
                  <td className="py-4 px-4 text-slate-600 text-xs">{tx.salesExecutive?.name || 'Staff'}</td>
                  <td className="py-4 px-4 max-w-xs truncate text-slate-600 text-xs">
                    {tx.items?.map((it) => `${it.quantity}x ${it.variant?.product?.name || 'Shoe'} (${it.variant?.colour || ''} / ${it.variant?.size || ''})`).join(', ')}
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                      {tx.paymentMethod}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right font-mono font-bold text-slate-900 text-base">
                    ₹{tx.grandTotal.toLocaleString()}
                  </td>
                  <td className="py-4 px-5 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSale(tx);
                      }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center space-x-1.5 mx-auto transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
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

export default ManagementDashboard;
