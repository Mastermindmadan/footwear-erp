import React, { useState, useEffect } from 'react';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { Search, ShoppingCart, MapPin, Tag, Boxes, Check, AlertCircle, X } from 'lucide-react';

const ProductSearch = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ brands: [], categories: [] });
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // Active Variant Selection Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [orderQty, setOrderQty] = useState(1);

  const { addToCart } = useCart();
  const { showToast } = useToast();

  const fetchFilters = async () => {
    try {
      const res = await api.get('/products/meta/filters');
      setFilters(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedBrand) params.brandId = selectedBrand;
      if (selectedCategory) params.categoryId = selectedCategory;

      const res = await api.get('/products', { params });
      setProducts(res.data.products || []);
    } catch (err) {
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedBrand, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const openProductSelector = (product) => {
    setSelectedProduct(product);
    if (product.variants?.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
    setOrderQty(1);
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    try {
      addToCart(selectedVariant, orderQty);
      showToast(`Added ${orderQty} pair of ${selectedProduct.name} to cart!`);
      setSelectedProduct(null);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Footwear Store Catalog</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Instant multi-variable search &bull; Variant-level stock validation &bull; Add directly to POS bill
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="erp-card p-5 rounded-2xl border border-slate-200/80">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by shoe name, article #, brand, or barcode..."
              className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Brands</option>
              {filters.brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              {filters.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Footwear Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-sm font-medium">
            Fetching product catalog from database...
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-sm font-medium">
            No footwear found matching the search criteria.
          </div>
        ) : (
          products.map((prod) => {
            const sizes = [...new Set(prod.variants?.map((v) => v.size))];
            const colours = [...new Set(prod.variants?.map((v) => v.colour))];
            const totalStock = prod.variants?.reduce(
              (acc, v) => acc + (v.inventory ? v.inventory.quantity : 0),
              0
            );

            return (
              <div
                key={prod.id}
                className="erp-card rounded-3xl border border-slate-200/80 overflow-hidden flex flex-col justify-between group transition-all"
              >
                <div>
                  {/* Image Header with Brand Badge */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg">
                      {prod.brand.name}
                    </span>
                    <span
                      className={`absolute top-3 right-3 text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm ${
                        totalStock > 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {totalStock > 0 ? `${totalStock} in stock` : 'Out of Stock'}
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm leading-tight line-clamp-1">
                        {prod.name}
                      </h3>
                      <p className="text-xs font-mono text-slate-400 font-medium uppercase mt-0.5">
                        {prod.articleNumber} &bull; {prod.gender}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline space-x-2 pt-1">
                      <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
                        ₹{prod.baseSellingPrice.toLocaleString()}
                      </span>
                      {prod.mrp > prod.baseSellingPrice && (
                        <span className="text-xs text-slate-400 line-through font-mono">
                          MRP ₹{prod.mrp.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Available Sizes Badge List */}
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Sizes Available:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {sizes.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 bg-slate-100 text-slate-800 text-xs font-bold rounded-md font-mono"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Colours */}
                    <div className="pt-1">
                      <span className="text-xs text-slate-500 font-medium truncate block">
                        Colours: <strong className="text-slate-800 font-semibold">{colours.join(', ')}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/70 border-t border-slate-100">
                  <button
                    onClick={() => openProductSelector(prod)}
                    disabled={totalStock <= 0}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Select Size & Add to Cart</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Variant Selection Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3.5">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                />
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    {selectedProduct.brand.name} &bull; {selectedProduct.category.name}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedProduct.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedProduct.articleNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Select Size & Colourway
                </label>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {selectedProduct.variants?.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const stock = v.inventory ? v.inventory.quantity : 0;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 font-semibold'
                            : 'border-slate-200 hover:border-slate-300 bg-white font-medium'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {v.colour} &bull; Size {v.size}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">Barcode: {v.barcode}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-bold text-xs ${
                              stock <= 0 ? 'text-red-600' : stock <= 3 ? 'text-amber-600' : 'text-emerald-700'
                            }`}
                          >
                            {stock > 0 ? `${stock} available` : 'Sold out'}
                          </span>
                          <span className="block text-sm font-extrabold text-slate-900 font-mono mt-0.5">
                            ₹{v.sellingPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Physical Location Hierarchy Display */}
              {selectedVariant?.rackLocation && (
                <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200/60 flex items-start space-x-3 text-xs text-indigo-950">
                  <MapPin className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-indigo-900">Physical Store Location:</span>
                    <p className="text-xs text-indigo-800 font-medium mt-0.5">
                      {selectedVariant.rackLocation.shelf?.rack?.department?.floor?.name} &rarr;{' '}
                      {selectedVariant.rackLocation.shelf?.rack?.department?.name} &rarr; Rack{' '}
                      <strong>{selectedVariant.rackLocation.shelf?.rack?.code}</strong> &bull; Shelf #{' '}
                      {selectedVariant.rackLocation.shelf?.shelfNumber} &bull; Position{' '}
                      <strong>{selectedVariant.rackLocation.position}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Quantity (Pairs):</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setOrderQty(Math.max(1, orderQty - 1))}
                    className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 font-bold hover:bg-slate-200 flex items-center justify-center cursor-pointer text-sm"
                  >
                    -
                  </button>
                  <span className="w-9 text-center font-extrabold text-sm font-mono">{orderQty}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const maxStock = selectedVariant?.inventory?.quantity || 1;
                      setOrderQty(Math.min(maxStock, orderQty + 1));
                    }}
                    className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 font-bold hover:bg-slate-200 flex items-center justify-center cursor-pointer text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || (selectedVariant.inventory?.quantity || 0) <= 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-xs cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Active POS Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
