import React, { useState, useEffect } from 'react';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { Boxes, Search, ShoppingCart, RefreshCw, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

const StockAvailability = () => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart();
  const { showToast } = useToast();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      const prods = res.data.products || [];
      setProducts(prods);
      if (prods.length > 0 && !selectedProductId) {
        setSelectedProductId(prods[0].id);
      }
    } catch (err) {
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Group variants by colour
  const colourGroups = {};
  if (selectedProduct) {
    selectedProduct.variants?.forEach((v) => {
      if (!colourGroups[v.colour]) {
        colourGroups[v.colour] = [];
      }
      colourGroups[v.colour].push(v);
    });
  }

  const handleQuickAdd = (variant) => {
    try {
      addToCart(variant, 1);
      showToast(`Added 1 pair (${variant.colour} / ${variant.size}) to cart!`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Boxes className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Stock Availability Matrix</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 pl-11">
            Real-time footwear size & colour inventory levels fetched directly from store registers
          </p>
        </div>

        <button
          onClick={fetchProducts}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-xs transition-all"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Refresh Live Stock</span>
        </button>
      </div>

      {/* Product Selector Dropdown & Filter */}
      <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Select Footwear Style</label>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.brand.name} - {p.name} ({p.articleNumber})
            </option>
          ))}
        </select>
      </div>

      {/* Selected Footwear Matrix Cards */}
      {selectedProduct && (
        <div className="erp-card bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center space-x-4">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
              />
              <div>
                <span className="text-xs font-bold uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {selectedProduct.brand.name} &bull; {selectedProduct.category.name}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedProduct.name}</h2>
                <p className="text-xs text-slate-400 font-mono font-medium">Article: {selectedProduct.articleNumber}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl font-extrabold font-mono text-slate-900">
                ₹{selectedProduct.baseSellingPrice.toLocaleString()}
              </span>
              <p className="text-xs text-slate-400 font-medium">Retail Selling Price</p>
            </div>
          </div>

          {/* Colour-Wise Size Stock Matrices */}
          <div className="space-y-6">
            {Object.entries(colourGroups).map(([colourName, variants]) => (
              <div key={colourName} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-slate-800" />
                    <span>Colourway: {colourName}</span>
                  </h3>
                  <span className="text-xs text-slate-600 font-medium">
                    Total: <strong className="text-slate-900">{variants.reduce((a, b) => a + (b.inventory ? b.inventory.quantity : 0), 0)} pairs</strong>
                  </span>
                </div>

                {/* Size Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
                  {variants.map((v) => {
                    const qty = v.inventory ? v.inventory.quantity : 0;
                    const isAvailable = qty > 0;
                    return (
                      <div
                        key={v.id}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                          !isAvailable
                            ? 'bg-white border-slate-200 opacity-60'
                            : qty <= 2
                            ? 'bg-amber-50/70 border-amber-200 shadow-2xs'
                            : 'bg-white border-slate-200 shadow-2xs hover:border-emerald-500'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-900 font-mono">{v.size}</span>
                            {isAvailable ? (
                              qty <= 2 ? (
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              )
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            )}
                          </div>
                          <span
                            className={`text-xs font-bold block mt-1.5 ${
                              !isAvailable ? 'text-rose-600' : qty <= 2 ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            {isAvailable ? `${qty} pairs available` : 'Out of Stock'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleQuickAdd(v)}
                          disabled={!isAvailable}
                          className="mt-3.5 w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAvailability;
