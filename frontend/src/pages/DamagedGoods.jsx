import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { AlertTriangle, Plus, CheckCircle2, Wrench, RefreshCw, Trash2, ArrowRight } from 'lucide-react';

const DamagedGoods = () => {
  const [damagedList, setDamagedList] = useState([]);
  const [variantsList, setVariantsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Register Form
  const [variantId, setVariantId] = useState('');
  const [damageType, setDamageType] = useState('SOLE_DETACHMENT');
  const [quantity, setQuantity] = useState(1);
  const [responsibleUserId, setResponsibleUserId] = useState('');
  const [estimatedRepairCost, setEstimatedRepairCost] = useState('250');
  const [expectedCorrectionDate, setExpectedCorrectionDate] = useState('');
  const [notes, setNotes] = useState('');

  // Status Update Form
  const [targetStatus, setTargetStatus] = useState('UNDER_INSPECTION');
  const [actualRepairCost, setActualRepairCost] = useState('');
  const [disposalDetails, setDisposalDetails] = useState('');

  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/damaged');
      setDamagedList(res.data.damagedList || []);

      const pRes = await api.get('/products');
      const allVars = [];
      pRes.data.products?.forEach((p) => {
        p.variants?.forEach((v) => {
          allVars.push({
            id: v.id,
            label: `${p.name} (${v.colour} / ${v.size})`,
          });
        });
      });
      setVariantsList(allVars);

      const sRes = await api.get('/settings');
      setUsersList(sRes.data.staff || []);
      if (allVars.length > 0 && !variantId) setVariantId(allVars[0].id);
      if (sRes.data.staff?.length > 0 && !responsibleUserId) {
        setResponsibleUserId(sRes.data.staff[0].id);
      }
    } catch (err) {
      showToast('Failed to load damaged goods', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegisterDamaged = async (e) => {
    e.preventDefault();
    try {
      await api.post('/damaged', {
        variantId,
        damageType,
        quantity,
        responsibleUserId,
        estimatedRepairCost,
        expectedCorrectionDate,
        notes,
      });

      showToast('Damaged product registered and deducted from active stock');
      setShowRegisterModal(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to record damaged item', 'error');
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/damaged/${selectedItem.id}`, {
        status: targetStatus,
        actualRepairCost: actualRepairCost || selectedItem.actualRepairCost,
        disposalDetails: disposalDetails || selectedItem.disposalDetails,
      });

      showToast(`Status updated to ${targetStatus}! Inventory updated if returned.`);
      setShowStatusModal(false);
      fetchData();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const openStatusUpdate = (item) => {
    setSelectedItem(item);
    setTargetStatus(item.status);
    setActualRepairCost(item.actualRepairCost ? item.actualRepairCost.toString() : '');
    setDisposalDetails(item.disposalDetails || '');
    setShowStatusModal(true);
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Damaged Goods & Repairs</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 pl-11">
            Defect logging • Cobbler repair workflow • Inventory auto-adjustment upon restoration or write-off
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register Damaged Item</span>
        </button>
      </div>

      {/* Table */}
      <div className="erp-card bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200/80">
              <tr>
                <th className="py-4 px-5">Footwear Article</th>
                <th className="py-4 px-4">Damage Type</th>
                <th className="py-4 px-4">Date Logged</th>
                <th className="py-4 px-4">Responsible Staff</th>
                <th className="py-4 px-4">Repair Est. / Cost</th>
                <th className="py-4 px-4">Current Status</th>
                <th className="py-4 px-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    Loading damaged inventory...
                  </td>
                </tr>
              ) : damagedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No damaged footwear items logged. Zero defect rate!
                  </td>
                </tr>
              ) : (
                damagedList.map((item) => {
                  let statusBadge = 'bg-slate-100 text-slate-800 border-slate-200';
                  if (item.status === 'UNDER_REPAIR') statusBadge = 'bg-amber-100 text-amber-800 border-amber-200';
                  else if (item.status === 'REPAIRED') statusBadge = 'bg-blue-100 text-blue-800 border-blue-200';
                  else if (item.status === 'RETURNED_TO_STOCK') statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  else if (item.status === 'WRITTEN_OFF') statusBadge = 'bg-rose-100 text-rose-800 border-rose-200';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <p className="font-bold text-slate-900">{item.variant?.product?.name}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {item.variant?.colour} &bull; Size {item.variant?.size} &bull; Qty: <strong>{item.quantity} pair</strong>
                        </p>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-700">
                        {item.damageType.replace('_', ' ')}
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium">{new Date(item.damageDate).toLocaleDateString()}</td>
                      <td className="py-4 px-4 text-slate-700 font-medium">
                        {item.responsibleUser?.name || 'Store'}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-slate-900">
                          ₹{item.actualRepairCost || item.estimatedRepairCost}
                        </span>
                        {item.actualRepairCost > 0 && (
                          <span className="block text-xs text-emerald-600 font-semibold mt-0.5">Actual bill</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={() => openStatusUpdate(item)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Damaged Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-7 border border-slate-200 my-8">
            <h3 className="text-lg font-bold text-slate-900">Register Damaged Footwear</h3>
            <p className="text-xs text-slate-500 mt-1">Item will be automatically removed from active store stock</p>

            <form onSubmit={handleRegisterDamaged} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Footwear Variant</label>
                <select
                  value={variantId}
                  onChange={(e) => setVariantId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {variantsList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Damage Type</label>
                  <select
                    value={damageType}
                    onChange={(e) => setDamageType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="SOLE_DETACHMENT">Sole Detachment</option>
                    <option value="STITCH_TEAR">Stitch Tear</option>
                    <option value="SCUFF_SCRATCH">Scuff / Scratch</option>
                    <option value="COLOR_FADE">Color Fade</option>
                    <option value="TRANSIT_DAMAGE">Transit Box Damage</option>
                    <option value="WATER_DAMAGE">Water Damage</option>
                    <option value="OTHER">Other Defect</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Quantity (pairs)</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Responsible Staff</label>
                  <select
                    value={responsibleUserId}
                    onChange={(e) => setResponsibleUserId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Est. Repair Cost (₹)</label>
                  <input
                    type="number"
                    value={estimatedRepairCost}
                    onChange={(e) => setEstimatedRepairCost(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Notes / Description</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Detail the issue (e.g. glue separation at heel)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 shadow-sm"
                >
                  Log Damaged Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-7 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Update Defect & Repair Status</h3>
            <p className="text-xs text-slate-500 mt-1">
              {selectedItem.variant?.product?.name} ({selectedItem.damageType})
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Workflow Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="DAMAGED">Damaged (Logged)</option>
                  <option value="UNDER_INSPECTION">Under Inspection</option>
                  <option value="REPAIR_REQUIRED">Repair Required</option>
                  <option value="UNDER_REPAIR">Under Repair (Cobbler)</option>
                  <option value="REPAIRED">Repaired (Inspection Passed)</option>
                  <option value="RETURNED_TO_STOCK">
                    Returned to Stock (+{selectedItem.quantity} to Inventory)
                  </option>
                  <option value="DISPOSED">Disposed</option>
                  <option value="WRITTEN_OFF">Written Off (Confirmed Loss)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Actual Repair Cost (₹)</label>
                <input
                  type="number"
                  value={actualRepairCost}
                  onChange={(e) => setActualRepairCost(e.target.value)}
                  placeholder="e.g. 180"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {targetStatus === 'WRITTEN_OFF' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Disposal / Write-off Reason</label>
                  <input
                    type="text"
                    value={disposalDetails}
                    onChange={(e) => setDisposalDetails(e.target.value)}
                    placeholder="e.g. Beyond repair, discarded for scrap"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-sm"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DamagedGoods;
