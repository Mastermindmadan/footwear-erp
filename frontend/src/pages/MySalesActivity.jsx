import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Activity, Target, Award, TrendingUp, DollarSign, Boxes, Receipt, Calendar } from 'lucide-react';

const MySalesActivity = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/sales-exec');
        setData(res.data);
      } catch (err) {
        showToast('Failed to load sales activity', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  if (loading || !data) {
    return <div className="p-12 text-center text-slate-500 text-sm font-medium">Loading activity benchmarks...</div>;
  }

  const {
    todaySales,
    todayBills,
    todayProductsSold,
    monthSales,
    monthBills,
    monthProductsSold,
    dailyTarget,
    dailyAchievement,
    monthlyTarget,
    monthlyAchievement,
  } = data;

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80">
        <div className="flex items-center space-x-2">
          <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <Activity className="w-5 h-5" />
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Sales Performance & Activity</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1 pl-11">
          Track personal daily targets, customer conversions, and month-to-date achievement quotas
        </p>
      </div>

      {/* Daily Activity vs Target Card */}
      <div className="erp-card bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Today's Sales Target Performance</h2>
              <p className="text-xs text-slate-500">Daily retail shift target quota</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            {dailyAchievement}% Achieved
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Today's Sales</span>
            <p className="text-2xl font-extrabold font-mono text-slate-900 mt-1">₹{todaySales.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Assigned Target</span>
            <p className="text-2xl font-extrabold font-mono text-slate-700 mt-1">₹{dailyTarget.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Pairs Handed</span>
            <p className="text-2xl font-extrabold font-mono text-indigo-600 mt-1">{todayProductsSold} pairs</p>
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, dailyAchievement)}%` }}
          />
        </div>
      </div>

      {/* Monthly Activity vs Target Card */}
      <div className="erp-card bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Monthly Sales Goal Attainment</h2>
              <p className="text-xs text-slate-500">Cumulative month-to-date retail metrics</p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-800 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-200">
            {monthlyAchievement}% Achieved
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Month-to-Date Revenue</span>
            <p className="text-2xl font-extrabold font-mono text-slate-900 mt-1">₹{monthSales.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Monthly Goal</span>
            <p className="text-2xl font-extrabold font-mono text-slate-700 mt-1">₹{monthlyTarget.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Total Invoices Closed</span>
            <p className="text-2xl font-extrabold font-mono text-indigo-600 mt-1">{monthBills} bills</p>
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, monthlyAchievement)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default MySalesActivity;
