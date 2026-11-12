import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import {
  Grid,
  Plus,
  Layers,
  MapPin,
  Boxes,
  Eye,
  CheckCircle,
  HelpCircle,
  FolderTree,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const RackDisplayOverview = () => {
  const [racks, setRacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRack, setSelectedRack] = useState(null);
  const [showAddRackModal, setShowAddRackModal] = useState(false);
  const [hierarchyData, setHierarchyData] = useState([]);

  // Form
  const [newRackName, setNewRackName] = useState('');
  const [newRackCode, setNewRackCode] = useState('');
  const [newDeptId, setNewDeptId] = useState('');
  const [newRackType, setNewRackType] = useState('NORMAL');
  const [shelvesCount, setShelvesCount] = useState(4);
  const [positionsPerShelf, setPositionsPerShelf] = useState(6);

  const { showToast } = useToast();

  const fetchRacks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/locations/racks');
      setRacks(res.data.racks || []);

      const hRes = await api.get('/locations/hierarchy');
      setHierarchyData(hRes.data.floors || []);

      if (hRes.data.floors?.[0]?.departments?.[0] && !newDeptId) {
        setNewDeptId(hRes.data.floors[0].departments[0].id);
      }
    } catch (err) {
      showToast('Failed to load store racks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRacks();
  }, []);

  const handleCreateRack = async (e) => {
    e.preventDefault();
    try {
      await api.post('/locations/rack', {
        name: newRackName,
        code: newRackCode,
        departmentId: newDeptId,
        rackType: newRackType,
        shelvesCount,
        positionsPerShelf,
      });

      showToast('Store rack and shelf locations created successfully!');
      setShowAddRackModal(false);
      setNewRackName('');
      setNewRackCode('');
      fetchRacks();
    } catch (err) {
      showToast('Failed to create rack', 'error');
    }
  };

  const totalOccupied = racks.reduce((a, b) => a + b.occupiedLocations, 0);
  const totalEmpty = racks.reduce((a, b) => a + b.emptyLocations, 0);
  const totalDisplayStock = racks.reduce((a, b) => a + b.totalDisplayPairs, 0);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Grid className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Rack & Display Store Layout</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 pl-11">
            Physical Store Hierarchy: Floor &rarr; Department &rarr; Rack &rarr; Shelf &rarr; Position Slot
          </p>
        </div>

        <button
          onClick={() => setShowAddRackModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Store Rack</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Store Racks</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-1">{racks.length}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Ground & First floor sections</p>
        </div>

        <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Occupied Shelf Positions</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-600 mt-1">{totalOccupied}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Holding active footwear inventory</p>
        </div>

        <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Empty Slots</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 mt-1">{totalEmpty}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Ready for consignment allocations</p>
        </div>

        <div className="erp-card bg-white p-5 rounded-2xl border border-purple-200 shadow-xs bg-purple-50/20">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Display Stock Tracked</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-900 mt-1">{totalDisplayStock}</p>
          <p className="text-xs text-purple-600 font-medium mt-1">Single shoes displayed on showcase</p>
        </div>
      </div>

      {/* Hierarchy Visualizer Banner */}
      <div className="erp-card bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between text-indigo-950 gap-4 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <strong className="block text-sm font-bold text-indigo-950">Store Location Hierarchy Protocol</strong>
            <span className="text-xs text-indigo-800 font-medium">Floor (e.g. First Floor) &rarr; Department (e.g. Men's Section) &rarr; Rack (M12) &rarr; Shelf (3) &rarr; Position (08)</span>
          </div>
        </div>
        <span className="bg-white px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-indigo-700 border border-indigo-200 shadow-2xs">
          L1-MEN-M12-S3-P08
        </span>
      </div>

      {/* Racks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {racks.map((rack) => (
          <div
            key={rack.id}
            className="erp-card bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all space-y-5"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    {rack.floorName} &bull; {rack.departmentName}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-1">{rack.name}</h3>
                  <p className="text-xs font-mono text-slate-500 font-semibold">{rack.code}</p>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    rack.rackType === 'ASSORTED'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : rack.rackType === 'DEEP_DISCOUNT'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : rack.rackType === 'DISPLAY'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {rack.rackType}
                </span>
              </div>

              {/* Occupancy Rate Bar */}
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">Rack Occupancy</span>
                  <span className="font-mono font-bold text-slate-900">
                    {rack.occupiedLocations} / {rack.totalLocations} ({rack.occupancyRate}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      rack.occupancyRate >= 80 ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${rack.occupancyRate}%` }}
                  />
                </div>
              </div>

              {/* Stock numbers */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Stock</span>
                  <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{rack.totalPairsStored} pairs</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Display Showcase</span>
                  <p className="font-mono font-bold text-purple-700 text-sm mt-0.5">{rack.totalDisplayPairs} pairs</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedRack(rack)}
              className="w-full py-2.5 bg-slate-50 hover:bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-xl border border-slate-200 transition-colors flex items-center justify-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Inspect Footwear on Rack ({rack.items?.length || 0})</span>
            </button>
          </div>
        ))}
      </div>

      {/* Inspect Rack Footwear Modal */}
      {selectedRack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 sm:p-7 border border-slate-200 max-h-[85vh] flex flex-col my-8">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  {selectedRack.floorName} &bull; {selectedRack.departmentName}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedRack.name} ({selectedRack.code})</h3>
                <p className="text-xs text-slate-500 font-medium">Footwear variants stored in physical shelf slots</p>
              </div>
              <button
                onClick={() => setSelectedRack(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 divide-y divide-slate-100 text-sm">
              {selectedRack.items.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium">This rack is currently empty.</div>
              ) : (
                selectedRack.items.map((it, idx) => (
                  <div key={idx} className="py-3.5 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{it.productName}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {it.brand} &bull; {it.colour} &bull; Size {it.size}
                      </p>
                      <p className="text-xs font-mono font-semibold text-indigo-600 mt-1">
                        Location: Shelf {it.shelfNumber} &bull; Pos {it.position} ({it.locationCode})
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900">{it.quantity} pairs in stock</span>
                      <p className="text-xs text-purple-600 font-semibold mt-0.5">Display: {it.displayQty} pair</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedRack(null)}
                className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 shadow-sm"
              >
                Close Rack View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Rack Modal */}
      {showAddRackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-7 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Add New Store Rack</h3>
            <p className="text-xs text-slate-500 mt-1">Automatically generates shelves and indexed position slots</p>

            <form onSubmit={handleCreateRack} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Rack Name</label>
                <input
                  type="text"
                  value={newRackName}
                  onChange={(e) => setNewRackName(e.target.value)}
                  required
                  placeholder="e.g. Sports Sneaker Wall SP03"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Rack Code</label>
                  <input
                    type="text"
                    value={newRackCode}
                    onChange={(e) => setNewRackCode(e.target.value)}
                    required
                    placeholder="e.g. RACK-SP03"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono uppercase focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Rack Type</label>
                  <select
                    value={newRackType}
                    onChange={(e) => setNewRackType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="NORMAL">Normal Storage</option>
                    <option value="ASSORTED">Assorted Clearance (20%)</option>
                    <option value="DEEP_DISCOUNT">Deep Discount (50%)</option>
                    <option value="DISPLAY">Entrance Display</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Department</label>
                <select
                  value={newDeptId}
                  onChange={(e) => setNewDeptId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {hierarchyData.map((fl) =>
                    fl.departments?.map((d) => (
                      <option key={d.id} value={d.id}>
                        {fl.name} &rarr; {d.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Shelves Count</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={shelvesCount}
                    onChange={(e) => setShelvesCount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Slots Per Shelf</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={positionsPerShelf}
                    onChange={(e) => setPositionsPerShelf(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRackModal(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-sm"
                >
                  Create Rack
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RackDisplayOverview;
