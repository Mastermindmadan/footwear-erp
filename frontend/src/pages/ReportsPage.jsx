import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { FileText, Download, Calendar, Filter, RefreshCw } from 'lucide-react';

const ReportsPage = () => {
  const [reportType, setReportType] = useState('SALES');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const generateReport = async () => {
    try {
      setLoading(true);
      const params = { type: reportType };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/reports/generate', { params });
      setReportData(res.data.reportData || []);
      setSummary(res.data.summary || {});
    } catch (err) {
      showToast('Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [reportType]);

  const downloadCSV = () => {
    if (!reportData || reportData.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    const headers = Object.keys(reportData[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    reportData.forEach((row) => {
      const values = headers.map((header) => {
        const escaped = ('' + (row[header] || '')).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportType}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV Report downloaded successfully!');
  };

  const headers = reportData.length > 0 ? Object.keys(reportData[0]) : [];

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Store Reports & Audits</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 pl-11">
            On-demand fiscal reporting • Full dataset CSV export • Regulatory store auditing
          </p>
        </div>

        <button
          onClick={downloadCSV}
          disabled={reportData.length === 0}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export to CSV File</span>
        </button>
      </div>

      {/* Report Selector & Date Filter Controls */}
      <div className="erp-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Report Module</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="SALES">Sales Transactions & GST Audit</option>
              <option value="PURCHASES">Procurement & Supplier Invoices</option>
              <option value="INVENTORY">Inventory Valuation & SKU Levels</option>
              <option value="DAMAGED">Damaged Goods & Defect Log</option>
              <option value="SALESPERSON">Salesperson Attainment & Productivity</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <button
              onClick={generateReport}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors h-[42px]"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Report Data Preview Table */}
      <div className="erp-card bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">{reportType} Report Records</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">{reportData.length} records compiled</span>
        </div>

        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200 sticky top-0 backdrop-blur-xs">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="py-3.5 px-4 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={headers.length || 1} className="py-12 text-center text-slate-400 font-sans font-medium">
                    Generating report data from database...
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={headers.length || 1} className="py-12 text-center text-slate-400 font-sans font-medium">
                    No records found for the selected criteria.
                  </td>
                </tr>
              ) : (
                reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    {headers.map((h) => (
                      <td key={h} className="py-3 px-4 text-slate-700 whitespace-nowrap text-xs">
                        {row[h]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
