import React, { useState } from 'react';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import CameraScannerModal from '../components/CameraScannerModal';
import {
  ScanBarcode,
  Camera,
  MapPin,
  ShoppingCart,
  Boxes,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

const BarcodeScannerPage = () => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedVariant, setScannedVariant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [scanQty, setScanQty] = useState(1);

  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleLookup = async (codeToLookup) => {
    const code = (codeToLookup || barcodeInput).trim();
    if (!code) {
      showToast('Please enter or scan a barcode', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/products/barcode/${code}`);
      setScannedVariant(res.data.variant);
      setScanQty(1);
      showToast(`Found: ${res.data.variant.product.name}`);
    } catch (err) {
      setScannedVariant(null);
      showToast(err.response?.data?.error || `No product found with barcode ${code}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCameraDetected = (code) => {
    setShowCamera(false);
    setBarcodeInput(code);
    handleLookup(code);
  };

  const handleAddToCart = () => {
    if (!scannedVariant) return;
    try {
      addToCart(scannedVariant, scanQty);
      showToast(`Added ${scanQty} pair of ${scannedVariant.product.name} to cart!`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Barcode Scanner & Physical Locator</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Scan box barcode with your device camera or handheld scanner to instantly pinpoint shelf position and live stock
        </p>
      </div>

      {/* Barcode Search & Camera Button */}
      <div className="erp-card p-6 rounded-3xl border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            className="flex-1 flex space-x-2"
          >
            <div className="relative flex-1">
              <ScanBarcode className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan or enter 13-digit barcode (e.g. 8901234500011)..."
                className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-xs"
            >
              <span>Lookup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <button
            type="button"
            onClick={() => setShowCamera(true)}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-md hover:scale-102 transition-all cursor-pointer flex-shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span>Open Camera Scanner</span>
          </button>
        </div>

        {/* Quick Sample Barcode Pills */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Quick Barcode Demos:</span>
          {['8901234500011', '8901234500059', '8901234500110', '8901234500158', '8901234500219'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setBarcodeInput(c);
                handleLookup(c);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-xs font-semibold transition-colors cursor-pointer"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Scanned Footwear Card */}
      {scannedVariant && (
        <div className="erp-card rounded-3xl border border-slate-200/80 shadow-lg p-7 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row gap-7 items-start">
            <img
              src={scannedVariant.product.imageUrl}
              alt={scannedVariant.product.name}
              className="w-full sm:w-56 h-56 object-cover rounded-2xl border border-slate-200 flex-shrink-0"
            />

            <div className="flex-1 space-y-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  {scannedVariant.product.brand.name} &bull; {scannedVariant.product.category.name}
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-2">{scannedVariant.product.name}</h2>
                <p className="text-xs text-slate-500 font-mono font-medium mt-0.5">Article: {scannedVariant.product.articleNumber}</p>
              </div>

              {/* Spec Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider">Colourway</span>
                  <strong className="text-slate-900 text-sm font-semibold">{scannedVariant.colour}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider">Shoe Size</span>
                  <strong className="text-slate-900 text-sm font-mono font-bold">{scannedVariant.size}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider">Price</span>
                  <strong className="text-slate-900 text-base font-black font-mono">₹{scannedVariant.sellingPrice.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider">In-Store Stock</span>
                  <span
                    className={`font-black text-sm font-mono ${
                      (scannedVariant.inventory?.quantity || 0) <= 0
                        ? 'text-red-600'
                        : (scannedVariant.inventory?.quantity || 0) <= 3
                        ? 'text-amber-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    {scannedVariant.inventory?.quantity || 0} pairs
                  </span>
                </div>
              </div>

              {/* Physical Location Hierarchy Display */}
              <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200/60">
                <div className="flex items-center space-x-2 text-indigo-950 font-bold text-xs mb-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span className="uppercase tracking-wider">Exact Physical Store Location:</span>
                </div>

                {scannedVariant.rackLocation ? (
                  <div className="space-y-1.5 text-xs text-indigo-950 font-medium">
                    <p className="text-sm font-bold text-indigo-900">
                      {scannedVariant.rackLocation.shelf?.rack?.department?.floor?.name} &rarr;{' '}
                      {scannedVariant.rackLocation.shelf?.rack?.department?.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                      <span className="bg-white px-2.5 py-1 rounded-lg border border-indigo-200 font-bold text-slate-800">
                        Rack: {scannedVariant.rackLocation.shelf?.rack?.code}
                      </span>
                      <span className="bg-white px-2.5 py-1 rounded-lg border border-indigo-200 font-bold text-slate-800">
                        Shelf: #{scannedVariant.rackLocation.shelf?.shelfNumber}
                      </span>
                      <span className="bg-white px-2.5 py-1 rounded-lg border border-indigo-200 font-bold text-emerald-700">
                        Position: {scannedVariant.rackLocation.position}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-medium">Unassigned physical location</p>
                )}
              </div>

              {/* Add to Cart Actions */}
              <div className="flex items-center space-x-3 pt-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setScanQty(Math.max(1, scanQty - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-extrabold text-sm font-mono">{scanQty}</span>
                  <button
                    onClick={() => {
                      const max = scannedVariant.inventory?.quantity || 1;
                      setScanQty(Math.min(max, scanQty + 1));
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={(scannedVariant.inventory?.quantity || 0) <= 0}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add Scanned Footwear to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Browser Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onDetected={handleCameraDetected}
      />
    </div>
  );
};

export default BarcodeScannerPage;
