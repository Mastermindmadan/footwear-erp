import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import {
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  XCircle,
  Tag,
  Boxes,
  Percent,
  Flame,
  Archive,
} from 'lucide-react';

const AgeingClearance = () => {
  const [tiers, setTiers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const { showToast } = useToast();

  const fetchAgeing = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ageing/summary');
      setTiers(res.data.tiers || {});
    } catch (err) {
      showToast('Failed to load ageing analysis', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgeing();
  }, []);

  const handleAction = async (variantId, action, discountPercent = 0) => {
    try {
      await api.post('/ageing/action', {
        variantId,
        action,
        discountPercent,
      });
      showToast('Clearance workflow action applied successfully!');
      fetchAgeing();
    } catch (err) {
      showToast('Failed to apply clearance action', 'error');
    }
  };

  if (loading || !tiers) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm font-medium">
        Analyzing footwear stock entry dates and velocity...
      </div>
    );
  }

  const tierKeys = ['FRESH', 'NORMAL', 'AGEING', 'CLEARANCE_RECOMMENDED', 'DEEP_CLEARANCE', 'DEAD_STOCK'];
  let displayItems = [];
  if (activeTab === 'ALL') {
    tierKeys.forEach((k) => {
      if (tiers[k]) displayItems = [...displayItems, ...tiers[k].items];
    });
  } else if (tiers[activeTab]) {
    displayItems = tiers[activeTab].items;
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Ageing & Clearance Management</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 pl-11">
            Automated stock shelf-life tracking • Inventory velocity analysis • 4-Stage clearance discount approval protocol
          </p>
        </div>
      </div>

      {/* 6 Ageing Tiers Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {tierKeys.map((k) => {
          const t = tiers[k];
          if (!t) return null;
          const isSelected = activeTab === k;
          return (
            <div
              key={k}
              onClick={() => setActiveTab(k === activeTab ? 'ALL' : k)}
              className={`erp-card p-4 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50 shadow-xs'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">{t.name.split(' ')[0]}</span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    k === 'DEAD_STOCK'
                      ? 'bg-rose-600'
                      : k === 'DEEP_CLEARANCE'
                      ? 'bg-orange-600'
                      : k === 'CLEARANCE_RECOMMENDED'
                      ? 'bg-amber-500'
                      : k === 'AGEING'
                      ? 'bg-yellow-500'
                      : 'bg-emerald-500'
                  }`}
                />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 mt-2">{t.pairs} <span className="text-xs font-normal text-slate-400">pairs</span></p>
              <p className="text-xs font-mono font-medium text-slate-500 mt-1">₹{Math.round(t.value).toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {/* Clearance Lifecycle Visual Banner */}
      <div className="erp-card bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          Clearance Promotion Lifecycle Protocol
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-sm font-bold text-slate-900">1. Normal Display Rack</span>
            <p className="text-xs text-slate-500 mt-1">0–60 Days (MRP / Regular Price)</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200">
            <span className="block text-sm font-bold text-amber-950">2. Assorted Clearance Rack</span>
            <p className="text-xs text-amber-700 mt-1">61–120 Days (20% Clearance Discount)</p>
          </div>
          <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200">
            <span className="block text-sm font-bold text-rose-950">3. Deep Discount Rack</span>
            <p className="text-xs text-rose-700 mt-1">121+ Days (50%+ Discount Rack)</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200">
            <span className="block text-sm font-bold text-emerald-950">4. Liquidated / Sold Out</span>
            <p className="text-xs text-emerald-700 mt-1">Zero Dead-Stock Carry Forward</p>
          </div>
        </div>
      </div>

      {/* Ageing Items List & Action Table */}
      <div className="erp-card bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">Footwear Ageing Breakdown</h2>
            <span className="text-xs font-medium text-slate-500">({displayItems.length} styles analyzed)</span>
          </div>
          {activeTab !== 'ALL' && (
            <button
              onClick={() => setActiveTab('ALL')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
            >
              Show All Tiers &rarr;
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200/80">
              <tr>
                <th className="py-4 px-5">Product / Specification</th>
                <th className="py-4 px-4">Brand</th>
                <th className="py-4 px-4">Shelf Age</th>
                <th className="py-4 px-4">Stock Pairs</th>
                <th className="py-4 px-4">Selling Price</th>
                <th className="py-4 px-4">Clearance Status</th>
                <th className="py-4 px-5 text-center">Management Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayItems.map((item) => {
                let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                if (item.ageDays > 180) badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
                else if (item.ageDays > 120) badgeClass = 'bg-orange-100 text-orange-800 border-orange-200';
                else if (item.ageDays > 90) badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
                else if (item.ageDays > 60) badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5">
                      <p className="font-bold text-slate-900">{item.productName}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {item.colour} &bull; Size {item.size} &bull; SKU: {item.barcode}
                      </p>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-800">{item.brand}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badgeClass}`}>
                        {item.ageDays} days in store
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">{item.quantity} pairs</td>
                    <td className="py-4 px-4">
                      <span className="font-mono font-bold text-slate-900">₹{item.sellingPrice}</span>
                      {item.clearanceDiscount > 0 && (
                        <p className="text-xs font-bold text-rose-600">
                          {item.clearanceDiscount}% discount active
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                        {item.clearanceStatus?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleAction(item.id, 'APPROVE_20')}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold border border-amber-200 transition-colors shadow-2xs"
                          title="Move to Assorted Rack with 20% discount"
                        >
                          Approve 20%
                        </button>

                        <button
                          onClick={() => handleAction(item.id, 'APPROVE_50')}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 rounded-lg text-xs font-bold border border-rose-200 transition-colors shadow-2xs"
                          title="Move to Deep Discount Rack with 50% off"
                        >
                          Approve 50%
                        </button>

                        {item.clearanceDiscount > 0 && (
                          <button
                            onClick={() => handleAction(item.id, 'REJECT')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Reset to Normal Rack"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AgeingClearance;
