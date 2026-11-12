import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle, ScanBarcode, ArrowRight } from 'lucide-react';

const CameraScannerModal = ({ isOpen, onClose, onDetected }) => {
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrCode = null;

    if (isOpen) {
      setErrorMsg('');
      const startScanner = async () => {
        try {
          html5QrCode = new Html5Qrcode('barcode-reader');
          scannerRef.current = html5QrCode;

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.777778,
          };

          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              if (decodedText) {
                stopScanner();
                onDetected(decodedText);
              }
            },
            (errorMessage) => {
              // Frame scan error - normal when barcode is not in frame yet
            }
          );
          setIsScanning(true);
        } catch (err) {
          console.warn('Camera start error or denied:', err);
          setErrorMsg(
            'Camera access unavailable or permission not granted. You can use manual barcode entry below.'
          );
          setIsScanning(false);
        }
      };

      const timer = setTimeout(startScanner, 200);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        // quiet cleanup
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      stopScanner();
      onDetected(manualCode.trim());
      setManualCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm tracking-tight">Optical Camera Barcode Scanner</h3>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Camera Viewfinder */}
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 min-h-[220px] flex items-center justify-center shadow-inner">
            <div id="barcode-reader" className="w-full" />

            {errorMsg && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-400" />
                <p className="text-xs leading-relaxed">{errorMsg}</p>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 text-center mt-3 font-medium">
            Align the footwear box barcode or hangtag within the scanner viewfinder
          </p>

          {/* Fallback Manual Barcode Entry */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center space-x-2 mb-2.5">
              <ScanBarcode className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Manual Barcode Input / Handheld Scanner</span>
            </div>
            <form onSubmit={handleManualSubmit} className="flex space-x-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter or scan barcode (e.g. 8901234500011)..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
              >
                <span>Lookup</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraScannerModal;
