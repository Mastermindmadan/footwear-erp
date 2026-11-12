import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { Landmark, Plus, ArrowUpRight, ArrowDownLeft, ShieldCheck, DollarSign } from 'lucide-react';

const CapitalOverview = () => {
  const [capital, setCapital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [type, setType] = useState('ADDITIONAL_INVESTMENT');
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('Partner Equity');
  const [description, setDescription] = useState('');

  const { showToast } = useToast();

  const fetchCapital = async () => {
    try {
      setLoading(true);
      const res = await api.get('/financials/capital');
      setCapital(res.data);
    } catch (err) {
      showToast('Failed to load capital records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapital();
  }, []);

  const handleAddCapital = async (e) => {
    e.preventDefault();
    try {
      await api.post('/financials/capital', {
        type,
        amount,
        source,
        description,
      });
      showToast('Capital transaction recorded successfully');
      setShowModal(false);
      setAmount('');
      setDescription('');
      fetchCapital();
    } catch (err) {
      showToast('Failed to add capital transaction', 'error');
    }
  };

  if (loading || !capital) {
    return <div className="p-12 text-center text-slate-500 text-sm font-medium">Loading store capital structure...</div>;
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Landmark className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Capital & Equity Overview</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 pl-11">
            Store initial investments • Working capital infusions • Partner equity & owner drawings ledger
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record Capital Transaction</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Initial Store Investment</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-1">₹{capital.initialInvestment.toLocaleString()}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Founders base equity</p>
        </div>

        <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Working Capital Added</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-600 mt-1">₹{capital.additionalInvestment.toLocaleString()}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Expansion loans & cash injections</p>
        </div>

        <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Owner Drawings</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-600 mt-1">₹{capital.withdrawals.toLocaleString()}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Cumulative capital withdrawals</p>
        </div>

        <div className="erp-card bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Net Invested Capital</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-800 mt-1">₹{capital.currentCapitalBalance.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">Active net store capital</p>
        </div>
      </div>

      {/* Capital History Table */}
      <div className="erp-card bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Capital Transaction Ledger</h2>
          <span className="text-xs text-slate-400 font-medium">{capital.records?.length || 0} entries on record</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200/80">
              <tr>
                <th className="py-4 px-5">Transaction Date</th>
                <th className="py-4 px-4">Type</th>
                <th className="py-4 px-4">Funding Source</th>
                <th className="py-4 px-4">Description / Purpose</th>
                <th className="py-4 px-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {capital.records?.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-5 text-slate-600 font-medium">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                        r.type === 'INITIAL_INVESTMENT'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : r.type === 'ADDITIONAL_INVESTMENT'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {r.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-900">{r.source}</td>
                  <td className="py-4 px-4 text-slate-600 font-medium">{r.description || '—'}</td>
                  <td className="py-4 px-5 text-right font-mono font-bold text-slate-900 text-base">
                    ₹{r.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Capital Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-7 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Record Capital Transaction</h3>
            <p className="text-xs text-slate-500 mt-1">Log equity capital infusions or withdrawals to the store balance</p>

            <form onSubmit={handleAddCapital} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Transaction Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="ADDITIONAL_INVESTMENT">Additional Investment (Capital Inward)</option>
                  <option value="WITHDRAWAL">Capital Withdrawal (Owner Drawing)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="e.g. 200000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Funding Source</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  required
                  placeholder="e.g. Partner Loan, Retained Earnings"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Description / Purpose</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Festival inventory pre-funding"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-sm">
                  Record Capital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CapitalOverview;
