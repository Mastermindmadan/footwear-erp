import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { BarChart3, Building2, Truck, TrendingUp, Calendar } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

const PurchaseAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchPurchaseAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/purchases');
        setData(res.data);
      } catch (err) {
        showToast('Failed to load purchase analytics', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPurchaseAnalytics();
  }, []);

  if (loading || !data) {
    return <div className="p-12 text-center text-slate-500 text-sm font-medium">Aggregating purchase procurement analytics...</div>;
  }

  const { vendorPurchases, brandPurchases, sizePurchases, monthlyPurchases } = data;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80">
        <div className="flex items-center space-x-2">
          <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Truck className="w-5 h-5" />
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Purchase Procurement Analytics</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1 pl-11">
          Supplier procurement shares • Brand stocking costs • Monthly consignment intake trends
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Inward Trends Chart */}
        <div className="erp-card bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Monthly Procurement Trend (₹)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Footwear inventory replenishment capital over time</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyPurchases} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v.toLocaleString()}`}
                />
                <Tooltip
                  formatter={(val) => [`₹${val.toLocaleString()}`, 'Total Inwarded']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                  }}
                />
                <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2.5} fill="#dbeafe" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vendor-Wise Spend */}
        <div className="erp-card bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Supplier Spend Share (₹)</h2>
            <p className="text-xs text-slate-500 mb-5">Procurement volume distributed across vendor partners</p>

            <div className="space-y-3.5">
              {vendorPurchases.map((v, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                  <div className="flex justify-between items-center font-bold text-slate-900">
                    <span>{v.name}</span>
                    <span className="font-mono text-indigo-700 text-base">₹{v.amount.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-1">{v.consignments} purchase consignments</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Brand-wise and Size-wise Purchasing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand Procurement Cost */}
        <div className="erp-card bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">Brand-Wise Purchase Inward Spend</h2>
          <p className="text-xs text-slate-500 mb-5">Stock investment allocated across footwear brands</p>

          <div className="space-y-3 text-sm">
            {brandPurchases.map((b, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="font-bold text-slate-800">{b.name}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-slate-500 font-medium">{b.pairs} pairs procured</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">₹{b.cost.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Size Inward Distribution */}
        <div className="erp-card bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">Procured Footwear Sizes Breakdown</h2>
          <p className="text-xs text-slate-500 mb-5">Volume of incoming sizes from manufacturers</p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {sizePurchases.map((s, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-800">Size: {s.name}</span>
                <span className="font-mono font-bold text-indigo-600">{s.pairs} pairs</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseAnalytics;
