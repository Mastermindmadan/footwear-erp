import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { Target, TrendingUp, Users, Plus, CheckCircle, RefreshCw, Award, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BudgetTargets = () => {
  const [period, setPeriod] = useState('MONTHLY');
  const [targetsData, setTargetsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetPairs, setTargetPairs] = useState('');
  const { showToast } = useToast();

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/targets?type=${period}`);
      setTargetsData(res.data.targets || []);
      if (res.data.targets?.length > 0 && !selectedEmp) {
        setSelectedEmp(res.data.targets[0].employeeId);
      }
    } catch (err) {
      showToast('Failed to fetch budget targets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, [period]);

  const handleSaveTarget = async (e) => {
    e.preventDefault();
    try {
      await api.post('/targets', {
        userId: selectedEmp,
        targetType: period,
        targetAmount,
        targetPairs,
      });
      showToast('Sales target updated successfully!');
      setShowModal(false);
      setTargetAmount('');
      setTargetPairs('');
      fetchTargets();
    } catch (err) {
      showToast('Failed to save sales target', 'error');
    }
  };

  const chartData = targetsData.map((t) => ({
    name: t.employeeName.split(' ')[0],
    Target: t.targetAmount,
    Achieved: t.achievedAmount,
  }));

  const totalStoreTarget = targetsData.reduce((acc, t) => acc + t.targetAmount, 0);
  const totalStoreAchieved = targetsData.reduce((acc, t) => acc + t.achievedAmount, 0);
  const storeAchievementPct = totalStoreTarget > 0 ? Math.round((totalStoreAchieved / totalStoreTarget) * 100) : 0;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Target className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Budget & Sales Targets</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 pl-11">
            Store performance benchmarks • Daily & Monthly quota monitoring for sales executives
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Period Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex space-x-1 border border-slate-200/60 shadow-2xs">
            <button
              onClick={() => setPeriod('DAILY')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === 'DAILY' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Quota
            </button>
            <button
              onClick={() => setPeriod('MONTHLY')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === 'MONTHLY' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Quota
            </button>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Set New Target</span>
          </button>
        </div>
      </div>

      {/* Aggregate Goal Progress Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Total Store Goal ({period})
            </span>
            <p className="text-3xl font-extrabold font-mono mt-1 text-white">₹{totalStoreTarget.toLocaleString()}</p>
            <p className="text-xs text-slate-300 mt-1">Sum of active executive quotas</p>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Total Sales Achieved
            </span>
            <p className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">₹{totalStoreAchieved.toLocaleString()}</p>
            <p className="text-xs text-slate-300 mt-1">Verified from POS cash registers</p>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Remaining Target
            </span>
            <p className="text-3xl font-extrabold font-mono text-amber-400 mt-1">
              ₹{Math.max(0, totalStoreTarget - totalStoreAchieved).toLocaleString()}
            </p>
            <p className="text-xs text-slate-300 mt-1">Remaining deficit for 100% quota</p>
          </div>

          <div className="md:border-l border-white/10 md:pl-6">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Store Goal Attainment
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-4xl font-extrabold text-white">{storeAchievementPct}%</span>
              <span className="text-xs font-medium text-indigo-200">completed</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5 mt-2.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, storeAchievementPct)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="erp-card p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Sales Executive Quota vs. Actual Revenue</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time team revenue comparison in Indian Rupees (₹)</p>
          </div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span>Target vs. Realized</span>
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `₹${val.toLocaleString()}`}
              />
              <Tooltip
                formatter={(val) => [`₹${val.toLocaleString()}`, '']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '13px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                }}
              />
              <Bar dataKey="Target" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Achieved" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Individual Employee Target Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Executive Performance Scorecards</h2>
          <span className="text-xs text-slate-500 font-medium">{targetsData.length} active sales staff</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {targetsData.map((emp) => (
            <div
              key={emp.employeeId}
              className="erp-card bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    <img src={emp.avatar} alt={emp.employeeName} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{emp.employeeName}</h3>
                      <p className="text-xs text-slate-500 font-medium">{emp.email}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      emp.achievementPct >= 100
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : emp.achievementPct >= 50
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {emp.achievementPct}%
                  </span>
                </div>

                {/* Target & Achieved Metrics */}
                <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Assigned Target</span>
                    <p className="text-base font-bold font-mono text-slate-900 mt-0.5">₹{emp.targetAmount.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 font-medium">({emp.targetPairs} pairs goal)</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Actual Achieved</span>
                    <p className="text-base font-bold font-mono text-emerald-600 mt-0.5">₹{emp.achievedAmount.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 font-medium">({emp.achievedPairs} pairs sold)</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-500">Progress:</span>
                    <span className="text-slate-700">
                      Remaining: <strong className="font-mono text-slate-900">₹{emp.remainingAmount.toLocaleString()}</strong>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        emp.achievementPct >= 100
                          ? 'bg-emerald-500'
                          : emp.achievementPct >= 50
                          ? 'bg-indigo-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, emp.achievementPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">{emp.billsCount} invoices registered</span>
                <button
                  onClick={() => {
                    setSelectedEmp(emp.employeeId);
                    setTargetAmount(emp.targetAmount.toString());
                    setTargetPairs(emp.targetPairs.toString());
                    setShowModal(true);
                  }}
                  className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  <span>Edit Target</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target Setting Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-7 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Set Sales Quota ({period})</h3>
            <p className="text-xs text-slate-500 mt-1">Assign benchmark sales targets to retail staff</p>

            <form onSubmit={handleSaveTarget} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Sales Executive</label>
                <select
                  value={selectedEmp}
                  onChange={(e) => setSelectedEmp(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {targetsData.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.employeeName} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Target Revenue (₹)</label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                  placeholder="e.g. 250000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Target Footwear Pairs</label>
                <input
                  type="number"
                  value={targetPairs}
                  onChange={(e) => setTargetPairs(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-sm"
                >
                  Save Quota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetTargets;
