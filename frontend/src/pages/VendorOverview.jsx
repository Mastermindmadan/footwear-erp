import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { Building2, Plus, Phone, Mail, MapPin, CreditCard, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

const VendorOverview = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Form Add
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [creditPeriodDays, setCreditPeriodDays] = useState(30);

  // Form Pay
  const [payAmount, setPayAmount] = useState('');

  const { showToast } = useToast();

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vendors');
      setVendors(res.data.vendors || []);
    } catch (err) {
      showToast('Failed to load vendors', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/vendors', {
        name,
        contactPerson,
        phone,
        email,
        address,
        gstin,
        creditPeriodDays,
      });
      showToast('Vendor added successfully');
      setShowAddModal(false);
      setName('');
      setPhone('');
      fetchVendors();
    } catch (err) {
      showToast('Failed to create vendor', 'error');
    }
  };

  const handlePayVendor = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/vendors/${selectedVendor.id}/pay`, {
        amount: payAmount,
      });
      showToast(res.data.message || 'Payment recorded!');
      setShowPayModal(false);
      setPayAmount('');
      fetchVendors();
    } catch (err) {
      showToast('Payment failed', 'error');
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Vendor & Supplier Overview</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 pl-11">
            Footwear manufacturers, distributors, credit period terms, and supplier payment reconciliations
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vendor</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {vendors.map((v) => (
          <div
            key={v.id}
            className="erp-card bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{v.name}</h3>
                  <p className="text-xs font-mono text-slate-400 font-medium mt-0.5">{v.code}</p>
                </div>
                <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                  {v.creditPeriodDays}d Credit
                </span>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                <p className="font-bold text-slate-800 text-sm">{v.contactPerson}</p>
                <div className="flex items-center space-x-2 text-slate-500 font-medium">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="font-mono">{v.phone}</span>
                </div>
                {v.gstin && (
                  <p className="text-xs font-mono text-slate-400">GST: {v.gstin}</p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Purchases</span>
                  <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">₹{v.totalPurchases?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Outstanding</span>
                  <p
                    className={`font-mono font-bold text-sm mt-0.5 ${
                      v.outstandingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    ₹{v.outstandingAmount?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedVendor(v);
                setPayAmount(v.outstandingAmount > 0 ? v.outstandingAmount.toString() : '');
                setShowPayModal(true);
              }}
              className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-2 shadow-2xs"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Vendor Payment</span>
            </button>
          </div>
        ))}
      </div>

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-7 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Add Supplier / Distributor</h3>
            <p className="text-xs text-slate-500 mt-1">Register footwear manufacturer credentials and payment terms</p>

            <form onSubmit={handleCreateVendor} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Company / Vendor Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Action Footwear Agency"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Rajesh Shah"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+91..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">GSTIN</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="29..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono uppercase focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Credit Period (Days)</label>
                  <input
                    type="number"
                    value={creditPeriodDays}
                    onChange={(e) => setCreditPeriodDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-sm"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Vendor Modal */}
      {showPayModal && selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 sm:p-7 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Record Vendor Payment</h3>
            <p className="text-xs text-slate-500 mt-1">{selectedVendor.name}</p>

            <form onSubmit={handlePayVendor} className="space-y-4 mt-5">
              <div className="p-3.5 bg-rose-50 rounded-xl text-sm flex justify-between items-center font-bold text-rose-900 border border-rose-200">
                <span>Current Outstanding:</span>
                <span className="font-mono text-base">₹{selectedVendor.outstandingAmount.toLocaleString()}</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Payment Amount (₹)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                  placeholder="e.g. 50000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 shadow-sm"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOverview;
