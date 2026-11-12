import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import {
  Boxes,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  History,
  AlertTriangle,
  ArrowUpDown,
  Barcode,
  Layers,
  CheckCircle,
  MapPin,
  X,
} from 'lucide-react';

const InventoryOverview = () => {
  const [inventory, setInventory] = useState([]);
  const [filters, setFilters] = useState({ brands: [], categories: [], sizes: [], colours: [] });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Stock Adjust Form
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Manual physical count audit');
  const [historyMovements, setHistoryMovements] = useState([]);

  // Add Product Form
  const [newProdName, setNewProdName] = useState('');
  const [newArticleNumber, setNewArticleNumber] = useState('');
  const [newBrandId, setNewBrandId] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newGender, setNewGender] = useState('MEN');
  const [newBasePrice, setNewBasePrice] = useState('');
  const [newMrp, setNewMrp] = useState('');
  const [newPurchasePrice, setNewPurchasePrice] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVariants, setNewVariants] = useState([
    { size: 'UK 7', colour: 'Black', quantity: 5, barcode: '' },
    { size: 'UK 8', colour: 'Black', quantity: 5, barcode: '' },
  ]);

  const { showToast } = useToast();

  const fetchFilters = async () => {
    try {
      const res = await api.get('/products/meta/filters');
      setFilters(res.data);
      if (res.data.brands.length > 0 && !newBrandId) setNewBrandId(res.data.brands[0].id);
      if (res.data.categories.length > 0 && !newCategoryId) setNewCategoryId(res.data.categories[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedBrand) params.brandId = selectedBrand;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (lowStockOnly) params.lowStockOnly = 'true';

      const res = await api.get('/inventory', { params });
      setInventory(res.data.inventory || []);
    } catch (err) {
      showToast('Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [selectedBrand, selectedCategory, lowStockOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInventory();
  };

  // Stock Adjustment
  const handleOpenAdjust = (item) => {
    setSelectedVariant(item);
    setAdjustQty(item.quantity.toString());
    setShowAdjustModal(true);
  };

  const handleSubmitAdjust = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/inventory/${selectedVariant.id}/adjust`, {
        quantity: parseInt(adjustQty, 10),
        reason: adjustReason,
      });
      showToast('Inventory quantity updated successfully!');
      setShowAdjustModal(false);
      fetchInventory();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to adjust stock', 'error');
    }
  };

  // Stock Movement History
  const handleOpenHistory = async (item) => {
    setSelectedVariant(item);
    try {
      const res = await api.get(`/inventory/${item.id}/history`);
      setHistoryMovements(res.data.movements || []);
      setShowHistoryModal(true);
    } catch (err) {
      showToast('Failed to load stock history', 'error');
    }
  };

  // Add Product Handlers
  const handleAddVariantRow = () => {
    setNewVariants([...newVariants, { size: 'UK 9', colour: 'Black', quantity: 5, barcode: '' }]);
  };

  const handleRemoveVariantRow = (index) => {
    if (newVariants.length <= 1) return;
    setNewVariants(newVariants.filter((_, i) => i !== index));
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', {
        name: newProdName,
        articleNumber: newArticleNumber,
        brandId: newBrandId,
        categoryId: newCategoryId,
        gender: newGender,
        basePrice: parseFloat(newBasePrice),
        mrp: newMrp ? parseFloat(newMrp) : parseFloat(newBasePrice),
        purchasePrice: newPurchasePrice ? parseFloat(newPurchasePrice) : 0,
        imageUrl: newImageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
        variants: newVariants.map((v) => ({
          ...v,
          quantity: parseInt(v.quantity || 0, 10),
        })),
      });

      showToast('Footwear product & variants created successfully!');
      setShowAddModal(false);
      setNewProdName('');
      setNewArticleNumber('');
      setNewBasePrice('');
      fetchInventory();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create product', 'error');
    }
  };

  const totalPairs = inventory.reduce((a, b) => a + b.quantity, 0);
  const totalStockVal = inventory.reduce((a, b) => a + b.quantity * b.purchasePrice, 0);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Boxes className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Footwear Inventory Overview</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 pl-11">
            Variant-level footwear catalog • Separate Size & Colour tracking • Physical rack assignments
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Footwear Product</span>
        </button>
      </div>

      {/* Aggregate Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Footwear SKUs</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-1">{inventory.length}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Unique size/colour combinations</p>
        </div>

        <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pairs on Hand</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-600 mt-1">{totalPairs}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">In-store & warehouse pairs</p>
        </div>

        <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Stock Cost Valuation</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 mt-1">₹{totalStockVal.toLocaleString()}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">At wholesale purchase cost</p>
        </div>

        <div className="erp-card bg-white p-5 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Low-Stock Alert SKUs</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-800 mt-1">
            {inventory.filter((i) => i.isLowStock).length}
          </p>
          <p className="text-xs text-amber-600 font-medium mt-1">&le; 3 pairs remaining in store</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Search Inventory</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product name, article, barcode, size, or colour..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Status Filter</label>
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer h-[42px] flex-1">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="truncate">Low Stock</span>
              </label>
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors h-[42px]"
              >
                Filter
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Inventory Table */}
      <div className="erp-card bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200/80">
              <tr>
                <th className="py-4 px-5">Footwear Product</th>
                <th className="py-4 px-4">Brand / Cat</th>
                <th className="py-4 px-4">Colour & Size</th>
                <th className="py-4 px-4">Barcode / SKU</th>
                <th className="py-4 px-4">Rack Location</th>
                <th className="py-4 px-4 text-right">Cost Price</th>
                <th className="py-4 px-4 text-right">Selling Price</th>
                <th className="py-4 px-4 text-center">Available Stock</th>
                <th className="py-4 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    Loading footwear inventory...
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No footwear products match the selected criteria.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center space-x-3.5">
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{item.productName}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{item.articleNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-800">{item.brand}</span>
                      <p className="text-xs text-slate-400 font-medium">{item.category}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-slate-800">{item.colour}</p>
                      <span className="inline-block mt-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-bold border border-slate-200">
                        {item.size}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-600 text-xs font-semibold">{item.barcode}</td>
                    <td className="py-4 px-4 max-w-xs">
                      <span className="text-xs text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg font-semibold border border-indigo-100 block truncate">
                        {item.rackLocation}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-500 font-medium">₹{item.purchasePrice}</td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-mono font-bold text-slate-900">₹{item.sellingPrice}</span>
                      {item.clearanceDiscount > 0 && (
                        <span className="block text-xs text-rose-600 font-extrabold">
                          -{item.clearanceDiscount}% OFF
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${
                          item.quantity <= 0
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : item.isLowStock
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {item.quantity} pairs
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenAdjust(item)}
                          className="p-2 rounded-lg hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors"
                          title="Adjust Physical Stock Quantity"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenHistory(item)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                          title="View Stock Movement Audit Trail"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustModal && selectedVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-7 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Adjust Inventory Stock</h3>
            <p className="text-xs text-slate-500 mt-1">
              {selectedVariant.productName} ({selectedVariant.colour} / {selectedVariant.size})
            </p>

            <form onSubmit={handleSubmitAdjust} className="space-y-4 mt-5">
              <div className="p-3.5 bg-slate-50 rounded-xl flex justify-between items-center text-sm text-slate-600 border border-slate-200">
                <span>Current In-Store Quantity:</span>
                <span className="font-mono font-bold text-slate-900 text-base">{selectedVariant.quantity} pairs</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">New Verified Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Reason for Adjustment</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="Manual physical count audit">Manual physical count audit</option>
                  <option value="Damage / Discarded pair">Damage / Discarded pair</option>
                  <option value="Display stock reconciliation">Display stock reconciliation</option>
                  <option value="Vendor return discrepancy">Vendor return discrepancy</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-sm"
                >
                  Update Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock History Audit Modal */}
      {showHistoryModal && selectedVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 max-h-[85vh] flex flex-col">
            <h3 className="text-lg font-bold text-slate-900">Stock Movement Audit Trail</h3>
            <p className="text-xs text-slate-500 mt-1">
              {selectedVariant.productName} ({selectedVariant.colour} / {selectedVariant.size})
            </p>

            <div className="flex-1 overflow-y-auto mt-5 divide-y divide-slate-100 text-sm">
              {historyMovements.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-medium">No movement history logged yet</div>
              ) : (
                historyMovements.map((m) => (
                  <div key={m.id} className="py-3 flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-xs ${
                            m.type === 'SALE'
                              ? 'bg-rose-100 text-rose-800'
                              : m.type === 'PURCHASE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {m.type}
                        </span>
                        <span className="font-semibold text-slate-900">{m.reason}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(m.createdAt).toLocaleString()} • User: {m.user?.name || 'System'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {m.previousQty} &rarr; {m.newQty}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 shadow-sm"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Footwear Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 sm:p-7 border border-slate-200 my-8">
            <h3 className="text-lg font-bold text-slate-900">Add Footwear Product & Variants</h3>
            <p className="text-xs text-slate-500 mt-1">
              Footwear sizes and colours are maintained separately in the shared PostgreSQL database
            </p>

            <form onSubmit={handleCreateProduct} className="space-y-4 mt-5">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Product Name</label>
                  <input
                    type="text"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    required
                    placeholder="e.g. Nike Air Max Pulse"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Article Number</label>
                  <input
                    type="text"
                    value={newArticleNumber}
                    onChange={(e) => setNewArticleNumber(e.target.value)}
                    required
                    placeholder="e.g. NKE-PLS-01"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono uppercase focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Brand</label>
                  <select
                    value={newBrandId}
                    onChange={(e) => setNewBrandId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {filters.brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Category</label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {filters.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="MEN">Men</option>
                    <option value="WOMEN">Women</option>
                    <option value="KIDS">Kids</option>
                    <option value="UNISEX">Unisex</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={newBasePrice}
                    onChange={(e) => setNewBasePrice(e.target.value)}
                    required
                    placeholder="e.g. 5999"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">MRP (₹)</label>
                  <input
                    type="number"
                    value={newMrp}
                    onChange={(e) => setNewMrp(e.target.value)}
                    placeholder="e.g. 7999"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Purchase Price (₹)</label>
                  <input
                    type="number"
                    value={newPurchasePrice}
                    onChange={(e) => setNewPurchasePrice(e.target.value)}
                    placeholder="e.g. 3500"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Product Image URL</label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Variants Builder */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Footwear Size & Colour Combinations</span>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                  >
                    + Add Size / Colour
                  </button>
                </div>

                <div className="space-y-2.5">
                  {newVariants.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-2.5 items-center">
                      <input
                        type="text"
                        placeholder="Size (e.g. UK 8)"
                        value={v.size}
                        onChange={(e) => {
                          const updated = [...newVariants];
                          updated[idx].size = e.target.value;
                          setNewVariants(updated);
                        }}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <input
                        type="text"
                        placeholder="Colour (e.g. Black)"
                        value={v.colour}
                        onChange={(e) => {
                          const updated = [...newVariants];
                          updated[idx].colour = e.target.value;
                          setNewVariants(updated);
                        }}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <input
                        type="number"
                        placeholder="Initial Stock"
                        value={v.quantity}
                        onChange={(e) => {
                          const updated = [...newVariants];
                          updated[idx].quantity = e.target.value;
                          setNewVariants(updated);
                        }}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          placeholder="Barcode"
                          value={v.barcode}
                          onChange={(e) => {
                            const updated = [...newVariants];
                            updated[idx].barcode = e.target.value;
                            setNewVariants(updated);
                          }}
                          className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono flex-1 focus:ring-2 focus:ring-indigo-500/20"
                        />
                        {newVariants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantRow(idx)}
                            className="text-rose-500 hover:text-rose-700 font-bold px-2 text-base"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
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
                  Create Product & Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryOverview;
