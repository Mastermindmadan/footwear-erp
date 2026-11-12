import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import InvoiceModal from '../components/InvoiceModal';
import {
  Receipt,
  User,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Phone,
  Search,
  Plus,
} from 'lucide-react';

const BillingPage = () => {
  const { items, totals, clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Customer State
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [existingCustomer, setExistingCustomer] = useState(null);
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  // Payment Method: CASH, UPI, CARD, SPLIT
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashTendered, setCashTendered] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Processing & Invoice Modal
  const [processing, setProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  // Set default cash tender to grandTotal
  useEffect(() => {
    if (totals.grandTotal > 0 && !cashTendered) {
      setCashTendered(totals.grandTotal.toString());
      setCashAmount(totals.grandTotal.toString());
    }
  }, [totals.grandTotal]);

  // Customer phone lookup
  const handlePhoneLookup = async () => {
    if (!customerPhone || customerPhone.trim().length < 6) return;
    try {
      setSearchingCustomer(true);
      const res = await api.get(`/customers?search=${customerPhone.trim()}`);
      if (res.data.customers?.length > 0) {
        const found = res.data.customers[0];
        setExistingCustomer(found);
        setCustomerName(found.name);
        setCustomerEmail(found.email || '');
        showToast(`Customer recognized: ${found.name}`);
      } else {
        setExistingCustomer(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingCustomer(false);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast('Cart is empty. Add shoes to cart first.', 'error');
      navigate('/sales/search');
      return;
    }

    try {
      setProcessing(true);

      const payload = {
        customerId: existingCustomer?.id,
        customerDetails: {
          name: customerName || 'Walk-in Customer',
          phone: customerPhone || '9999999999',
          email: customerEmail,
        },
        items: items.map((it) => ({
          variantId: it.variant.id,
          quantity: it.quantity,
          discountPercent: it.discountPercent || 0,
        })),
        paymentMethod,
        discountAmount: totals.discountAmount,
        notes,
      };

      if (paymentMethod === 'CASH') {
        payload.cashAmount = totals.grandTotal;
      } else if (paymentMethod === 'UPI') {
        payload.upiAmount = totals.grandTotal;
      } else if (paymentMethod === 'CARD') {
        payload.cardAmount = totals.grandTotal;
      } else if (paymentMethod === 'SPLIT') {
        payload.cashAmount = parseFloat(cashAmount || 0);
        payload.upiAmount = parseFloat(upiAmount || 0);
        payload.cardAmount = parseFloat(cardAmount || 0);

        const splitSum = payload.cashAmount + payload.upiAmount + payload.cardAmount;
        if (Math.abs(splitSum - totals.grandTotal) > 1) {
          showToast(`Split total (₹${splitSum}) must equal bill total (₹${totals.grandTotal})`, 'error');
          setProcessing(false);
          return;
        }
      }

      const res = await api.post('/sales/checkout', payload);
      showToast('Bill generated and stock deducted successfully!');
      setCompletedSale(res.data.sale);
      clearCart();
    } catch (err) {
      showToast(err.response?.data?.error || 'Billing checkout failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const changeDue = Math.max(0, parseFloat(cashTendered || 0) - totals.grandTotal);

  if (items.length === 0 && !completedSale) {
    return (
      <div className="p-12 max-w-xl mx-auto text-center space-y-5 my-12">
        <Receipt className="w-16 h-16 text-slate-400 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-800">No Items to Bill</h2>
        <p className="text-sm text-slate-500">Add footwear products from search or barcode scanner first.</p>
        <button
          onClick={() => navigate('/sales/search')}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs"
        >
          Browse Footwear Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80">
        <div className="flex items-center space-x-2">
          <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <Receipt className="w-5 h-5" />
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Express POS Checkout Terminal</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1 pl-11">
          Atomic database transaction &bull; Live inventory deduction &bull; Printable thermal invoice receipt
        </p>
      </div>

      <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer and Payment Mode */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Lookup Card */}
          <div className="erp-card bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Customer Identification & Loyalty</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Mobile Number (Look-up)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    onBlur={handlePhoneLookup}
                    placeholder="e.g. 9845012340"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar (or Walk-in)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {existingCustomer && (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs text-emerald-950">
                <span>Recognized Loyalty Customer: <strong>{existingCustomer.name}</strong></span>
                <span className="font-mono font-bold">Total Spent: ₹{existingCustomer.totalPurchases?.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="erp-card bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>Select Payment Method</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'CASH', label: 'Cash Tender', icon: Banknote },
                { id: 'UPI', label: 'UPI / QR Scan', icon: QrCode },
                { id: 'CARD', label: 'Debit / Card', icon: CreditCard },
                { id: 'SPLIT', label: 'Split Payment', icon: Receipt },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-3 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Cash Tender Calculation */}
            {paymentMethod === 'CASH' && (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Cash Handed by Customer (₹)</label>
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Change Return to Customer</span>
                    <p className="text-2xl font-extrabold font-mono text-emerald-600">₹{changeDue.toLocaleString()}</p>
                  </div>
                </div>

                {/* Quick Cash Buttons */}
                <div className="flex flex-wrap gap-2 pt-1 text-xs">
                  <span className="text-xs text-slate-400 mr-1 self-center font-medium">Quick Tender:</span>
                  {[totals.grandTotal, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashTendered(amt.toString())}
                      className="px-3 py-1.5 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg font-mono font-bold text-slate-800 transition-colors shadow-2xs"
                    >
                      ₹{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Split Payment Inputs */}
            {paymentMethod === 'SPLIT' && (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5 text-xs">
                <span className="font-bold text-slate-800 uppercase tracking-wider block">Allocate Split Payment Amounts</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Cash Part (₹)</label>
                    <input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">UPI Part (₹)</label>
                    <input
                      type="number"
                      value={upiAmount}
                      onChange={(e) => setUpiAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Card Part (₹)</label>
                    <input
                      type="number"
                      value={cardAmount}
                      onChange={(e) => setCardAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Bill Summary & Complete Sale Button */}
        <div className="erp-card bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5 h-fit">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            Bill Line Items ({totals.totalPairs} pairs)
          </h2>

          <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 text-sm">
            {items.map((it) => (
              <div key={it.variant.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900 leading-tight">{it.variant.product?.name}</p>
                  <p className="text-xs text-slate-400 font-medium">
                    {it.variant.colour} &bull; Size {it.variant.size} &bull; <strong className="text-slate-800">{it.quantity}x</strong>
                  </p>
                </div>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ₹{(it.variant.sellingPrice * it.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold text-slate-900">₹{totals.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Footwear GST:</span>
              <span className="font-mono font-semibold text-slate-900">₹{totals.totalTax.toLocaleString()}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Special Discount:</span>
                <span className="font-mono">-₹{totals.discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-black text-slate-900 pt-3 border-t border-slate-200 items-baseline">
              <span>Payable Total:</span>
              <span className="font-mono text-2xl font-extrabold text-emerald-700">₹{totals.grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-base font-extrabold flex items-center justify-center space-x-2 transition-all shadow-md mt-4"
          >
            {processing ? (
              <span>Deducting Stock & Generating Bill...</span>
            ) : (
              <>
                <Receipt className="w-5 h-5" />
                <span>Complete POS Sale & Print Bill</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Printable Invoice Modal */}
      {completedSale && (
        <InvoiceModal
          isOpen={!!completedSale}
          onClose={() => setCompletedSale(null)}
          sale={completedSale}
        />
      )}
    </div>
  );
};

export default BillingPage;
