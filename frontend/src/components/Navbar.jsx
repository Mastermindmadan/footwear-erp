import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';
import {
  Bell,
  LogOut,
  User,
  ShieldCheck,
  ShoppingBag,
  Store,
  ChevronDown,
  ArrowRightLeft,
  ExternalLink,
  Check,
  Sparkles,
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isManagement, isSales } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      // quiet fail
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showToast('All alerts marked as read', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Signed out of session');
    navigate('/login');
  };

  const isManagementSection = location.pathname.startsWith('/management');

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 h-16 flex items-center justify-between px-6 transition-all">
      {/* Brand & Module Indicator */}
      <div className="flex items-center space-x-6">
        <Link to={isManagement ? '/management/dashboard' : '/sales/dashboard'} className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900">Footwear Retail Management System</span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                ERP 2.0
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 leading-none mt-0.5">Dual-Role Integrated Store Platform</p>
          </div>
        </Link>

        {/* Module Badge & Quick Switcher */}
        <div className="hidden md:flex items-center pl-6 border-l border-slate-200 space-x-3">
          {isManagement ? (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mr-2 animate-pulse" />
                Store Management
              </span>
              <Link
                to="/sales/dashboard"
                className="text-xs font-medium text-slate-500 hover:text-indigo-600 px-2.5 py-1 rounded-md hover:bg-slate-100 transition-colors flex items-center space-x-1"
                title="Switch to POS View"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                <span>Open POS Terminal</span>
              </Link>
            </div>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              Sales Executive POS Terminal
            </span>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition-colors border border-transparent hover:border-slate-200"
            title="System Alerts & Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-84 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Alerts & Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[11px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-100">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">All systems operational &bull; Zero alerts</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3.5 text-xs cursor-pointer hover:bg-slate-50 transition-colors flex items-start space-x-3 ${
                        !n.isRead ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          n.severity === 'CRITICAL'
                            ? 'bg-rose-500 ring-4 ring-rose-100'
                            : n.severity === 'WARNING'
                            ? 'bg-amber-500 ring-4 ring-amber-100'
                            : 'bg-indigo-500'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`font-semibold ${!n.isRead ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {isManagement && (
                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60 text-center">
                  <Link
                    to="/management/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-center space-x-1"
                  >
                    <span>View all system notifications</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-3 p-1.5 pl-2.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none border border-slate-200/80"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-500 capitalize tracking-tight font-medium">
                {user?.role?.replace('_', ' ').toLowerCase()}
              </p>
            </div>
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={user?.name}
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-300"
            />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <p className="font-bold text-slate-900">{user?.name}</p>
                <p className="text-slate-500 truncate mt-0.5 text-[11px] font-mono">{user?.email}</p>
              </div>

              <Link
                to={isManagement ? '/management/settings' : '/sales/profile'}
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center space-x-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 font-medium"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile & Settings</span>
              </Link>

              {isManagement && (
                <Link
                  to="/sales/dashboard"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center space-x-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>Launch POS Terminal</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-rose-600 hover:bg-rose-50 text-left border-t border-slate-100 mt-1 font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
