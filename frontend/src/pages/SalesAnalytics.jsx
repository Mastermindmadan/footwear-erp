import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { TrendingUp, Award, Clock, ArrowRight, BarChart3, PieChart as PieIcon, LineChart } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

const SalesAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/sales');
        setData(res.data);
      } catch (err) {
        showToast('Failed to load sales analytics', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return <div className="p-12 text-center text-slate-500 text-sm font-medium">Aggregating multi-dimensional sales intelligence metrics...</div>;
  }

  const {
    brandSales,
    categorySales,
    productSales,
    sizeSales,
    colourSales,
    salespersonSales,
    bestSellers,
    slowMoving,
  } = data;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80">
        <div className="flex items-center space-x-2">
          <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Sales Analytics & Intelligence</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1 pl-11">
          Footwear size preferences • Brand market share • Slow-moving inventory liquidation indicators
        </p>
      </div>

      {/* Row 1: Brand Revenue & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand Sales Bar Chart */}
        <div className="erp-card bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Brand-Wise Sales Revenue (₹)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Total retail turnover captured per footwear brand</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              Top 8 Brands
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandSales.slice(0, 8)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v.toLocaleString()}`}
                />
                <Tooltip
                  formatter={(val) => [`₹${val.toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                  }}
                />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Pie Chart */}
        <div className="erp-card bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Category-Wise Distribution</h2>
              <p className="text-xs text-slate-500 mt-0.5">Footwear volume share across store departments</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySales}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="revenue"
                  label={({ name }) => name}
                >
                  {categorySales.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`₹${val.toLocaleString()}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Footwear Size-Wise & Colour-Wise Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Size Demand Analysis */}
        <div className="erp-card bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Footwear Size Demand Curve</h2>
              <p className="text-xs text-slate-500 mt-0.5">Pairs sold per size (e.g. UK 7, UK 8, UK 9)</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sizeSales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val} pairs`, 'Sold']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                  }}
                />
                <Bar dataKey="pairs" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Colour Preferences */}
        <div className="erp-card bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Colourway Sales Velocity</h2>
            <p className="text-xs text-slate-500 mb-5">Customer demand volume across footwear finishes</p>

            <div className="space-y-3.5">
              {colourSales.slice(0, 6).map((c, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                  <span className="font-bold text-slate-800">{c.name}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-slate-500 font-medium">{c.pairs} pairs sold</span>
                    <span className="font-mono font-bold text-indigo-700 text-sm">₹{c.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Best Sellers & Slow-Moving Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Sellers */}
        <div className="erp-card bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-base mb-4">
            <Award className="w-5 h-5 text-emerald-600" />
            <span>Top-Selling Footwear Articles</span>
          </div>

          <div className="space-y-3 text-sm">
            {bestSellers.map((prod, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-900">{prod.name}</span>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{prod.pairs} total pairs sold</p>
                </div>
                <span className="font-mono font-extrabold text-emerald-700 text-base">₹{prod.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Slow-Moving Stock */}
        <div className="erp-card bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex items-center space-x-2 text-rose-700 font-bold text-base mb-4">
            <Clock className="w-5 h-5 text-rose-600" />
            <span>Slow-Moving Footwear (Liquidation Recommended)</span>
          </div>

          <div className="space-y-3 text-sm">
            {slowMoving.map((sm) => (
              <div
                key={sm.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900">{sm.name}</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{sm.brand} &bull; Tier: {sm.tier}</p>
                </div>
                <span className="font-mono font-bold text-amber-700 text-sm">{sm.stock} pairs unsold</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalytics;
