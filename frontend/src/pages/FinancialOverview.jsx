import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  Plus,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Receipt,
  PieChart as PieIcon,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

const FinancialOverview = () => {
  const [fin, setFin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Form
  const [category, setCategory] = useState('Rent');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');

  const { showToast } = useToast();

  const fetchFinancials = async () => {
    try {
      setLoading(true);
      const res = await api.get('/financials/overview');
      setFin(res.data);
    } catch (err) {
      showToast('Failed to load financial records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/financials/expense', {
        category,
        title,
        amount,
        paymentMethod,
      });
      showToast('Expense recorded successfully');
      setShowAddExpense(false);
      setTitle('');
      setAmount('');
      fetchFinancials();
    } catch (err) {
      showToast('Failed to add expense', 'error');
    }
  };

  if (loading || !fin) {
    return <div className="p-12 text-center text-slate-500 text-sm font-medium">Calculating store P&L and balance sheets...</div>;
  }

  const expensePieData = Object.entries(fin.expensesByCategory || {}).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Financial Overview & P&L</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 pl-11">
            Store Profit & Loss Statement • Operating Costs • Cash and Bank Reserves
          </p>
        </div>

        <button
          onClick={() => setShowAddExpense(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record Store Expense</span>
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Retail Revenue</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-1">₹{fin.revenue.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Real-time POS sales receipts</p>
        </div>

        <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cost of Goods Sold (COGS)</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-700 mt-1">₹{fin.cogs.toLocaleString()}</p>
          <p className="text-xs text-slate-400 font-medium mt-1">Acquisition cost of sold pairs</p>
        </div>

        <div className="erp-card bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Gross Profit (Margin)</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-800 mt-1">₹{fin.grossProfit.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 font-bold mt-1">{fin.grossMarginPct}% gross margin realized</p>
        </div>

        <div className="erp-card bg-white p-5 rounded-2xl border border-indigo-200 shadow-xs bg-indigo-50/20">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Net Operating Profit</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-900 mt-1">₹{fin.netProfit.toLocaleString()}</p>
          <p className="text-xs text-indigo-600 font-bold mt-1">{fin.netMarginPct}% net margin realized</p>
        </div>
      </div>

      {/* Balances and Cash Position */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cash Till Reserve</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-slate-900 mt-2">₹{fin.cashBalance.toLocaleString()}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Physical till drawer cash</p>
        </div>

        <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Store Bank Account</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-slate-900 mt-2">₹{fin.bankBalance.toLocaleString()}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Current A/C balance</p>
        </div>

        <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Receivables</span>
            <ArrowUpRight className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-slate-900 mt-2">₹{fin.receivables.toLocaleString()}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Zero credit defaults</p>
        </div>

        <div className="erp-card bg-white p-5 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Vendor Payables</span>
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-rose-800 mt-2">₹{fin.payables.toLocaleString()}</p>
          <p className="text-xs text-rose-600 font-medium mt-1">Footwear supplier balance</p>
        </div>
      </div>

      {/* Row: Expense Category Breakdown Chart & Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenses Pie Chart */}
        <div className="erp-card bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">Expenses by Category</h2>
          <p className="text-xs text-slate-500 mb-4">Total store opex: <strong className="font-mono text-slate-900">₹{fin.expenses.toLocaleString()}</strong></p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensePieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name }) => name}
                >
                  {expensePieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`₹${val.toLocaleString()}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Store Expenses Table */}
        <div className="lg:col-span-2 erp-card bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Recent Operating Expenses</h2>
              <span className="text-xs font-medium text-slate-400">Audited store ledger</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-5">Title / Purpose</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Mode</th>
                    <th className="py-3.5 px-5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fin.recentExpenses?.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900">{e.title}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{new Date(e.date).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 text-xs font-semibold">{e.paymentMethod}</td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900">₹{e.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-7 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Record Store Expense</h3>
            <p className="text-xs text-slate-500 mt-1">Adds an operating cost entry to the financial balance sheet</p>

            <form onSubmit={handleAddExpense} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Expense Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="Rent">Store Rent</option>
                  <option value="Staff Salary">Staff Salary / Incentive</option>
                  <option value="Utilities">Electricity & Water</option>
                  <option value="Packaging">Shoe Bags & Packaging</option>
                  <option value="Marketing">Marketing & Advertising</option>
                  <option value="Maintenance">Store Maintenance & Cobbler</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Title / Description</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. October BESCOM Electricity Bill"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="e.g. 14500"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-sm">
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialOverview;
