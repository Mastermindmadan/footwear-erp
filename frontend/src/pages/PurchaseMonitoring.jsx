import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { Truck, Plus, Search, Building2, Calendar, CheckCircle2, Clock, PackageCheck, AlertCircle } from 'lucide-react';

const PurchaseMonitoring = () => {
  const [purchases, setPurchases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [variantsList, setVariantsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [itemQty, setItemQty] = useState(10);
  const [itemCost, setItemCost] = useState('');
  const [items, setItems] = useState([]);
  const [paidAmount, setPaidAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('0');
  const [notes, setNotes] = useState('');

  const { showToast } = useToast();

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await api.get('/purchases');
      setPurchases(res.data.purchases || []);

      const vRes = await api.get('/vendors');
      setVendors(vRes.data.vendors || []);

      const pRes = await api.get('/products');
      const allVars = [];
      pRes.data.products?.forEach((p) => {
        p.variants?.forEach((v) => {
          allVars.push({
            id: v.id,
            label: `${p.name} (${v.colour} / ${v.size}) - SKU: ${v.sku}`,
            cost: v.purchasePrice,
          });
        });
      });
      setVariantsList(allVars);
    } catch (err) {
      showToast('Failed to load purchases', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleAddItem = () => {
    if (!selectedVariantId || !itemQty || !itemCost) {
      showToast('Select variant, quantity and cost', 'error');
      return;
    }
    const found = variantsList.find((v) => v.id === selectedVariantId);
    setItems([
      ...items,
      {
        variantId: selectedVariantId,
        label: found?.label || 'Variant',
        quantity: parseInt(itemQty, 10),
        unitCost: parseFloat(itemCost),
      },
    ]);
    setSelectedVariantId('');
    setItemQty(10);
    setItemCost('');
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotalCost = items.reduce((acc, it) => acc + it.quantity * it.unitCost, 0);
  const grandTotalCost = subtotalCost + parseFloat(taxAmount || 0);

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    if (!invoiceNumber || !vendorId || items.length === 0) {
      showToast('Please fill invoice number, vendor, and add at least one item', 'error');
      return;
    }

    try {
      await api.post('/purchases', {
        invoiceNumber,
        vendorId,
        purchaseDate,
        totalAmount: subtotalCost,
        taxAmount: parseFloat(taxAmount || 0),
        paidAmount: parseFloat(paidAmount || 0),
        items,
        notes,
      });

      showToast('Purchase consignment inwarded successfully! Inventory updated.');
      setShowModal(false);
      setInvoiceNumber('');
      setItems([]);
      setPaidAmount('');
      setNotes('');
      fetchPurchases();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to record purchase', 'error');
    }
  };

  const totalConsignmentVal = purchases.reduce((a, b) => a + b.grandTotal, 0);
  const totalOutstanding = purchases.reduce((a, b) => a + b.outstandingAmount, 0);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Truck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Purchase Monitoring</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 pl-11">
            Vendor consignments • Stock inward batches • Supplier invoices & payables reconciliation
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Inward Consignment</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Purchases Inwarded</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-1">₹{totalConsignmentVal.toLocaleString()}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">{purchases.length} consignments logged</p>
        </div>

        <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Amount Paid</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 mt-1">
            ₹{purchases.reduce((a, b) => a + b.paidAmount, 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">Disbursed via bank transfer / RTGS</p>
        </div>

        <div className="erp-card bg-white p-5 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Outstanding Payables</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-700 mt-1">₹{totalOutstanding.toLocaleString()}</p>
          <p className="text-xs text-rose-600 font-medium mt-1">Due to footwear manufacturers</p>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="erp-card bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200/80">
              <tr>
                <th className="py-4 px-5">Purchase Invoice</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4">Supplier / Vendor</th>
                <th className="py-4 px-4">Footwear Consignment Items</th>
                <th className="py-4 px-4 text-right">Consignment Val</th>
                <th className="py-4 px-4 text-right">Paid</th>
                <th className="py-4 px-4 text-right">Outstanding</th>
                <th className="py-4 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Loading inward consignments...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No purchase consignments on record.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5 font-mono font-bold text-slate-900">{p.invoiceNumber}</td>
                    <td className="py-4 px-4 text-slate-600 font-medium">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900">{p.vendor.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{p.vendor.contactPerson} • {p.vendor.phone}</p>
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <div className="space-y-1">
                        {p.items?.map((it, idx) => (
                          <div key={idx} className="truncate text-xs text-slate-600 font-medium">
                            <strong className="text-slate-900">{it.quantity} pairs</strong> • {it.variant?.product?.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-slate-800">
                      ₹{p.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-emerald-600 font-semibold">
                      ₹{p.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-rose-600">
                      ₹{p.outstandingAmount.toLocaleString()}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          p.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : p.paymentStatus === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inward Purchase Consignment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 sm:p-7 border border-slate-200 my-8">
            <h3 className="text-lg font-bold text-slate-900">Inward Purchase Consignment</h3>
            <p className="text-xs text-slate-500 mt-1">Record incoming footwear stock from distributor into warehouse inventory</p>

            <form onSubmit={handleCreatePurchase} className="space-y-4 mt-5">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Supplier Invoice #</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    required
                    placeholder="e.g. PUR-2026-089"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Supplier / Vendor</label>
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">Select Vendor...</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Variant Item Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Add Footwear Variant to Consignment</span>
                <div>
                  <select
                    value={selectedVariantId}
                    onChange={(e) => {
                      setSelectedVariantId(e.target.value);
                      const f = variantsList.find((v) => v.id === e.target.value);
                      if (f) setItemCost(f.cost.toString());
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">Select Product Variant / Size / Colour...</option>
                    {variantsList.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <input
                      type="number"
                      placeholder="Qty (pairs)"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Unit Cost (₹)"
                      value={itemCost}
                      onChange={(e) => setItemCost(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3.5 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-colors shadow-xs"
                  >
                    + Add Line Item
                  </button>
                </div>

                {/* Items List */}
                {items.length > 0 && (
                  <div className="mt-2 divide-y divide-slate-200 text-xs">
                    {items.map((it, idx) => (
                      <div key={idx} className="py-2 flex justify-between items-center text-slate-700">
                        <span className="font-medium">
                          <strong className="text-slate-900">{it.quantity}x</strong> {it.label} @ ₹{it.unitCost}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900">₹{it.quantity * it.unitCost}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-500 hover:text-rose-700 text-sm font-bold ml-2"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals & Payments */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Tax Amount (₹)</label>
                  <input
                    type="number"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Paid Amount (₹)</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-indigo-50/70 rounded-xl flex justify-between items-center text-sm font-bold text-indigo-950 border border-indigo-100">
                <span>Grand Total Consignment Value:</span>
                <span className="font-mono text-base">₹{grandTotalCost.toLocaleString()}</span>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
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
                  Confirm Inward & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseMonitoring;
