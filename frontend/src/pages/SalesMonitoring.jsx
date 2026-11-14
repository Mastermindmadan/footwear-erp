import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import InvoiceModal from '../components/InvoiceModal';
import {
  ShoppingBag,
  Search,
  Filter,
  Calendar,
  Eye,
  RefreshCw,
  Printer,
  CreditCard,
  User,
  IndianRupee,
  Receipt,
} from 'lucide-react';

const SalesMonitoring = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const { showToast } = useToast();

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (paymentMethod) params.paymentMethod = paymentMethod;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/sales', { params });
      setSales(res.data.sales || []);
    } catch (err) {
      showToast('Failed to fetch sales records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [paymentMethod, startDate, endDate]);

  const handleProcessReturn = async (sale) => {
    if (!window.confirm(`Process return & refund for Invoice #${sale.invoiceNumber}? Stock will be automatically restocked into inventory.`)) return;
    try {
      await api.post(`/sales/${sale.id}/return`, { reason: 'Customer Return' });
      showToast(`Invoice #${sale.invoiceNumber} returned and stock restocked!`);
      setSelectedSale(null);
      fetchSales();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to process return', 'error');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSales();
  };

  const totalRevenue = sales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalTax = sales.reduce((acc, s) => acc + s.taxAmount, 0);
  const totalPairsSold = sales.reduce(
    (acc, s) => acc + s.items.reduce((sum, it) => sum + it.quantity, 0),
    0
  );

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Receipt className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Sales Monitoring</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 pl-11">
            Store POS audit log • Invoice traceability • Staff attributions & live GST collections
          </p>
        </div>

        <button
          onClick={fetchSales}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-xs transition-all"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Refresh Invoices</span>
        </button>
      </div>

      {/* Aggregate Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Filtered Sales</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-1">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">{sales.length} customer invoices completed</p>
        </div>

        <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Footwear Pairs Sold</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-600 mt-1">{totalPairsSold} pairs</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Atomic real-time inventory deductions</p>
        </div>

        <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">GST Collected</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 mt-1">₹{totalTax.toLocaleString()}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Footwear statutory tax (5% / 12%)</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Search Records</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoice #, customer name, phone, or staff..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Payment Mode</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Payment Modes</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="SPLIT">Split Payment</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">To Date</label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
              >
                Filter
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Sales Invoices Table */}
      <div className="erp-card bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200/80">
              <tr>
                <th className="py-4 px-5">Invoice #</th>
                <th className="py-4 px-4">Date & Time</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Cashier / Staff</th>
                <th className="py-4 px-4">Footwear Items</th>
                <th className="py-4 px-4">Mode</th>
                <th className="py-4 px-4 text-right">Subtotal</th>
                <th className="py-4 px-4 text-right">GST</th>
                <th className="py-4 px-5 text-right">Grand Total</th>
                <th className="py-4 px-5 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    Loading sales records...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5 font-mono font-bold text-indigo-600">
                      {sale.invoiceNumber}
                      {sale.paymentStatus === 'RETURNED' && (
                        <span className="block mt-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 w-fit">
                          RETURNED
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {new Date(sale.saleDate).toLocaleDateString()}{' '}
                      <span className="text-xs text-slate-400 block font-normal">
                        {new Date(sale.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-900">{sale.customer?.name || 'Walk-in Customer'}</p>
                      {sale.customer?.phone && (
                        <p className="text-xs text-slate-400 font-mono">{sale.customer.phone}</p>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-700 font-medium">{sale.salesExecutive?.name}</td>
                    <td className="py-4 px-4 max-w-xs">
                      <div className="space-y-1">
                        {sale.items?.map((it, idx) => (
                          <div key={idx} className="truncate text-xs text-slate-600 font-medium">
                            <strong className="text-slate-900">{it.quantity}x</strong> {it.variant?.product?.name} ({it.variant?.colour} / {it.variant?.size})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-600">₹{sale.subtotal?.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right font-mono text-slate-600">₹{sale.taxAmount?.toLocaleString()}</td>
                    <td className="py-4 px-5 text-right font-mono font-extrabold text-slate-900">
                      ₹{sale.grandTotal?.toLocaleString()}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
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
          onReturn={handleProcessReturn}
        />
      )}
    </div>
  );
};

export default SalesMonitoring;
