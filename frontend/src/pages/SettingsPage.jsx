import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { Settings, Store, Users, ShieldCheck, CheckCircle2, Save } from 'lucide-react';

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [storeName, setStoreName] = useState('');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [footwearGstThreshold, setFootwearGstThreshold] = useState('1000');
  const [lowGstPercent, setLowGstPercent] = useState('5');
  const [highGstPercent, setHighGstPercent] = useState('12');

  const { showToast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      const s = res.data.settings;
      setSettings(s);
      setStaff(res.data.staff || []);

      if (s) {
        setStoreName(s.storeName);
        setTagline(s.tagline || '');
        setPhone(s.phone);
        setEmail(s.email);
        setAddress(s.address);
        setGstin(s.gstin);
        setFootwearGstThreshold(s.footwearGstThreshold.toString());
        setLowGstPercent(s.lowGstPercent.toString());
        setHighGstPercent(s.highGstPercent.toString());
      }
    } catch (err) {
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings', {
        storeName,
        tagline,
        phone,
        email,
        address,
        gstin,
        footwearGstThreshold,
        lowGstPercent,
        highGstPercent,
      });
      showToast('Store ERP settings & tax rules updated successfully!');
      fetchSettings();
    } catch (err) {
      showToast('Failed to update settings', 'error');
    }
  };

  if (loading || !settings) {
    return <div className="p-12 text-center text-slate-500 text-sm font-medium">Loading store configuration...</div>;
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80">
        <div className="flex items-center space-x-2">
          <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Settings className="w-5 h-5" />
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Store Settings & Configuration</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1 pl-11">
          Store profile • Indian Footwear GST rate slabs • Role-based staff directory
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Store Profile Form */}
        <div className="lg:col-span-2 erp-card bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base mb-5 pb-3 border-b border-slate-100">
            <Store className="w-5 h-5 text-indigo-600" />
            <span>Store Profile & Invoicing Details</span>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Store / Entity Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Physical Store Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">GSTIN (India Goods & Services Tax)</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono uppercase focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* GST Footwear Slab Rule */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-900 block text-sm">Indian Footwear GST Taxation Slabs</span>
              <p className="text-xs text-slate-500">
                Footwear sold at or below threshold is taxed at lower GST, while footwear above threshold is taxed at higher GST.
              </p>

              <div className="grid grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Threshold (₹)</label>
                  <input
                    type="number"
                    value={footwearGstThreshold}
                    onChange={(e) => setFootwearGstThreshold(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Rate &le; Threshold</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={lowGstPercent}
                      onChange={(e) => setLowGstPercent(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono"
                    />
                    <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold text-xs">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Rate &gt; Threshold</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={highGstPercent}
                      onChange={(e) => setHighGstPercent(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono"
                    />
                    <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold text-xs">%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Store Configuration</span>
              </button>
            </div>
          </form>
        </div>

        {/* Staff Directory */}
        <div className="erp-card bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-base mb-5 pb-3 border-b border-slate-100">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Store Staff Accounts</span>
            </div>

            <div className="space-y-3.5 text-sm">
              {staff.map((u) => (
                <div key={u.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{u.name}</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        u.role === 'MANAGEMENT'
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {u.role.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate">{u.email}</p>
                  <p className="text-xs font-mono text-slate-400">{u.phone || 'No phone recorded'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 font-medium text-center">
            Role-Based Access Control (RBAC) Active
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
