import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer, Download, X, CheckCircle2, Store } from 'lucide-react';

const InvoiceModal = ({ isOpen, onClose, sale }) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
      });

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FOOTWEAR RETAIL MANAGEMENT SYSTEM', 74, 15, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Plot #42, Commercial Street, Bangalore, Karnataka - 560001', 74, 20, { align: 'center' });
      doc.text('Phone: +91 98450 12345 | GSTIN: 29AABCS1429B1Z8', 74, 24, { align: 'center' });

      doc.setLineWidth(0.3);
      doc.line(10, 27, 138, 27);

      // Meta info
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Tax Invoice: ${sale.invoiceNumber}`, 10, 33);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date(sale.saleDate).toLocaleString()}`, 138, 33, { align: 'right' });

      doc.text(`Cashier: ${sale.salesExecutive?.name || 'Store Staff'}`, 10, 38);
      doc.text(`Customer: ${sale.customer ? `${sale.customer.name} (${sale.customer.phone})` : 'Walk-in Customer'}`, 10, 43);
      doc.text(`Payment Mode: ${sale.paymentMethod}`, 138, 43, { align: 'right' });

      // Table
      const tableRows = sale.items.map((item) => {
        const pName = item.variant?.product?.name || 'Footwear';
        const variantDesc = `${pName}\n${item.variant?.colour || ''} | Size ${item.variant?.size || ''}`;
        return [
          variantDesc,
          item.quantity,
          `Rs. ${item.unitPrice}`,
          `${item.taxPercent}%`,
          `Rs. ${item.finalPrice}`,
        ];
      });

      autoTable(doc, {
        startY: 48,
        head: [['Item & Variant', 'Qty', 'Rate', 'GST', 'Amount']],
        body: tableRows,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 15, halign: 'center' },
          2: { cellWidth: 20, halign: 'right' },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 23, halign: 'right' },
        },
      });

      const finalY = doc.lastAutoTable.finalY + 6;

      // Summary
      doc.setFontSize(9);
      doc.text(`Subtotal: Rs. ${sale.subtotal}`, 138, finalY, { align: 'right' });
      doc.text(`GST: Rs. ${sale.taxAmount}`, 138, finalY + 5, { align: 'right' });
      if (sale.discountAmount > 0) {
        doc.text(`Discount: -Rs. ${sale.discountAmount}`, 138, finalY + 10, { align: 'right' });
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Grand Total: Rs. ${sale.grandTotal}`, 138, finalY + 16, { align: 'right' });

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('Thank you for shopping with us! Exchange within 7 days with invoice and box.', 74, finalY + 28, {
        align: 'center',
      });

      doc.save(`Invoice-${sale.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 my-8">
        {/* Header Actions */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm tracking-tight">Tax Invoice & Receipt</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-6 sm:p-7 text-slate-800 font-sans text-xs">
          {/* Store branding */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Footwear Retail Management System</h2>
            <p className="text-xs text-slate-500 font-medium">Bangalore Flagship Store</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Plot #42, Commercial Street, Bangalore - 560001</p>
            <p className="text-xs text-slate-400 font-mono font-medium">Ph: +91 98450 12345 | GSTIN: 29AABCS1429B1Z8</p>
          </div>

          {/* Meta Details */}
          <div className="py-4 border-b border-dashed border-slate-300 space-y-1.5 text-xs">
            <div className="flex justify-between font-bold">
              <span>Invoice: <span className="font-mono text-indigo-700">{sale.invoiceNumber}</span></span>
              <span className="text-slate-600 font-medium">
                {new Date(sale.saleDate).toLocaleDateString()} {new Date(sale.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Cashier: <strong className="text-slate-900">{sale.salesExecutive?.name}</strong></span>
              <span>Mode: <strong className="text-slate-900">{sale.paymentMethod}</strong></span>
            </div>
            <div className="text-slate-600 font-medium">
              Customer: <strong className="text-slate-900">{sale.customer ? `${sale.customer.name} (${sale.customer.phone})` : 'Walk-in Customer'}</strong>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-4 border-b border-dashed border-slate-300">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                  <th className="pb-2">Item / Variant</th>
                  <th className="pb-2 text-center">Qty</th>
                  <th className="pb-2 text-right">Rate</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items?.map((it, idx) => (
                  <tr key={idx} className="text-xs">
                    <td className="py-2.5">
                      <p className="font-bold text-slate-900">{it.variant?.product?.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {it.variant?.colour} &bull; Size {it.variant?.size} &bull; GST {it.taxPercent}%
                      </p>
                    </td>
                    <td className="py-2.5 text-center font-mono font-bold text-slate-900">{it.quantity}</td>
                    <td className="py-2.5 text-right font-mono text-slate-600">₹{it.unitPrice}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">₹{it.finalPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="py-4 border-b border-dashed border-slate-300 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Subtotal:</span>
              <span className="font-mono">₹{sale.subtotal?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Footwear GST:</span>
              <span className="font-mono">₹{sale.taxAmount?.toLocaleString()}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Discount Applied:</span>
                <span className="font-mono">-₹{sale.discountAmount?.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200 items-baseline">
              <span>Grand Total:</span>
              <span className="font-mono text-lg font-black text-emerald-700">₹{sale.grandTotal?.toLocaleString()}</span>
            </div>
          </div>

          {/* Return Policy & Footer */}
          <div className="pt-4 text-center text-[11px] text-slate-400 space-y-1">
            <p className="font-bold text-slate-700">Thank you for visiting us!</p>
            <p>Exchange policy valid within 7 days against unsoiled shoes with original box and invoice.</p>
            <p className="font-mono text-[10px] text-slate-300 pt-1">*** END OF FISCAL RECEIPT ***</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end no-print">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
