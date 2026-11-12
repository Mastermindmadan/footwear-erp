import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ShoppingCart, Trash2, ArrowRight, ArrowLeft, Tag, Boxes, Receipt, ShoppingBag } from 'lucide-react';

const CartPage = () => {
  const { items, updateQuantity, removeFromCart, clearCart, totals, discountPercent, setDiscountPercent } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleQtyChange = (variantId, newQty) => {
    try {
      updateQuantity(variantId, newQty);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (items.length === 0) {
    return (
      <div className="p-12 max-w-xl mx-auto text-center space-y-5 my-12">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Your POS Cart is Empty</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Search footwear from the retail catalog or use the barcode camera scanner to add pairs to cart.
          </p>
        </div>
        <div className="flex justify-center space-x-3 pt-2">
          <Link
            to="/sales/search"
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-xs"
          >
            Browse Products
          </Link>
          <Link
            to="/sales/scanner"
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all shadow-xs"
          >
            Scan Barcode
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Active POS Shopping Cart</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 pl-11">
            {totals.totalPairs} pairs selected &bull; Ready for customer payment checkout
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Entire Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Line Items List */}
        <div className="lg:col-span-2 erp-card bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {items.map((it) => {
              const maxStock = it.variant.inventory ? it.variant.inventory.quantity : 0;
              let unitPrice = it.variant.sellingPrice;
              if (it.variant.clearanceApproved && it.variant.clearanceDiscount > 0) {
                unitPrice = Math.round(unitPrice * (1 - it.variant.clearanceDiscount / 100));
              }

              return (
                <div key={it.variant.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center space-x-4">
                    <img
                      src={it.variant.product?.imageUrl}
                      alt={it.variant.product?.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        {it.variant.product?.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {it.variant.colour} &bull; Size <strong className="text-slate-800">{it.variant.size}</strong>
                      </p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">SKU: {it.variant.barcode}</p>
                    </div>
                  </div>

                  {/* Quantity Controls & Price */}
                  <div className="flex items-center space-x-5">
                    <div className="flex items-center space-x-2 bg-slate-100 rounded-xl p-1 border border-slate-200/60">
                      <button
                        onClick={() => handleQtyChange(it.variant.id, it.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-white text-slate-800 font-bold text-sm hover:bg-slate-200 flex items-center justify-center shadow-xs transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-sm">{it.quantity}</span>
                      <button
                        onClick={() => handleQtyChange(it.variant.id, it.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-white text-slate-800 font-bold text-sm hover:bg-slate-200 flex items-center justify-center shadow-xs transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right w-28">
                      <span className="font-mono font-bold text-slate-900 text-base">
                        ₹{(unitPrice * it.quantity).toLocaleString()}
                      </span>
                      <p className="text-xs text-slate-400 font-mono">₹{unitPrice} / pair</p>
                    </div>

                    <button
                      onClick={() => removeFromCart(it.variant.id)}
                      className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove from Cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="erp-card bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5 h-fit">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            Order Calculation & Tax
          </h2>

          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Selected Pairs:</span>
              <span className="font-mono font-bold text-slate-900">{totals.totalPairs} pairs</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold text-slate-800">₹{totals.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Footwear GST (5% / 12%):</span>
              <span className="font-mono font-semibold text-slate-800">₹{totals.totalTax.toLocaleString()}</span>
            </div>

            {/* Special Discount */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Special Discount:</span>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  className="w-16 px-2.5 py-1.5 border border-slate-300 rounded-lg text-right text-xs font-mono font-bold"
                />
                <span className="text-slate-500 font-bold text-xs">%</span>
              </div>
            </div>

            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Discount Deduction:</span>
                <span className="font-mono">-₹{totals.discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex justify-between items-baseline text-slate-900">
              <span className="text-base font-bold">Grand Total:</span>
              <span className="font-mono text-2xl font-extrabold text-emerald-600">₹{totals.grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <Link
            to="/sales/billing"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition-all shadow-sm mt-4"
          >
            <Receipt className="w-4 h-4" />
            <span>Proceed to Express POS Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
