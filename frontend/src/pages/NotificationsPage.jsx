import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { Bell, CheckCircle2, AlertTriangle, Clock, CreditCard, ShieldAlert } from 'lucide-react';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast('All notifications marked as read');
    } catch (err) {
      showToast('Failed to update', 'error');
    }
  };

  const markSingleRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Bell className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">System Alerts & Notifications</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 pl-11">
            Store inventory alerts, clearance recommendations, vendor dues, and damaged repair updates
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-xs transition-all"
        >
          Mark All as Read
        </button>
      </div>

      <div className="erp-card bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium">No active alerts or notifications. All systems optimal.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markSingleRead(n.id)}
              className={`p-5 flex items-start space-x-4 hover:bg-slate-50/80 cursor-pointer transition-colors ${
                !n.isRead ? 'bg-indigo-50/25' : ''
              }`}
            >
              <div
                className={`p-2.5 rounded-xl mt-0.5 flex-shrink-0 ${
                  n.severity === 'CRITICAL'
                    ? 'bg-rose-100 text-rose-600 border border-rose-200'
                    : n.severity === 'WARNING'
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}
              >
                {n.type === 'LOW_STOCK' && <AlertTriangle className="w-5 h-5" />}
                {n.type === 'AGEING_STOCK' && <Clock className="w-5 h-5" />}
                {n.type === 'CLEARANCE_RECOMMENDED' && <ShieldAlert className="w-5 h-5" />}
                {n.type === 'VENDOR_PAYMENT_DUE' && <CreditCard className="w-5 h-5" />}
                {n.type === 'DAMAGED_REPAIR_DUE' && <CheckCircle2 className="w-5 h-5" />}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                    {n.title}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed font-normal">{n.message}</p>
              </div>

              {!n.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
