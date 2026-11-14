import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  ShoppingBag,
  Truck,
  Boxes,
  Grid,
  Clock,
  AlertTriangle,
  Building2,
  DollarSign,
  Landmark,
  TrendingUp,
  BarChart3,
  FileText,
  Bell,
  Settings,
} from 'lucide-react';

const navGroups = [
  {
    title: 'OPERATIONS',
    items: [
      { name: 'Dashboard', path: '/management/dashboard', icon: LayoutDashboard },
      { name: 'Sales Monitoring', path: '/management/sales', icon: ShoppingBag },
      { name: 'Budget & Targets', path: '/management/targets', icon: Target },
      { name: 'Inventory Overview', path: '/management/inventory', icon: Boxes },
      { name: 'Rack & Display', path: '/management/racks', icon: Grid },
    ],
  },
  {
    title: 'PROCUREMENT & STOCK',
    items: [
      { name: 'Purchase Monitoring', path: '/management/purchases', icon: Truck },
      { name: 'Vendor Overview', path: '/management/vendors', icon: Building2 },
      { name: 'Ageing & Clearance', path: '/management/ageing', icon: Clock },
      { name: 'Damaged Goods', path: '/management/damaged', icon: AlertTriangle },
    ],
  },
  {
    title: 'FINANCE & ANALYTICS',
    items: [
      { name: 'Financial Overview', path: '/management/financials', icon: DollarSign },
      { name: 'Capital Overview', path: '/management/capital', icon: Landmark },
      { name: 'Sales Analytics', path: '/management/sales-analytics', icon: TrendingUp },
      { name: 'Purchase Analytics', path: '/management/purchase-analytics', icon: BarChart3 },
      { name: 'Reports & Audits', path: '/management/reports', icon: FileText },
    ],
  },
  {
    title: 'CONFIGURATION',
    items: [
      { name: 'Notifications', path: '/management/notifications', icon: Bell },
      { name: 'Store Settings', path: '/management/settings', icon: Settings },
    ],
  },
];

const ManagementSidebar = () => {
  return (
    <aside className="w-68 bg-slate-900 text-slate-300 flex flex-col h-full select-none border-r border-slate-800 shadow-xl flex-shrink-0">
      <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Management Suite</span>
        <span className="text-[10px] bg-indigo-500/15 text-indigo-400 font-mono px-2 py-0.5 rounded-full border border-indigo-500/30 font-semibold">
          ERP v2.4
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              {group.title}
            </span>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-bold'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0 text-slate-400 group-hover:text-white transition-colors" />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        ))}

        {/* Real-time telemetry badge */}
        <div className="p-3 mx-1 mt-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-300">Bangalore Flagship</span>
            <span className="inline-flex items-center space-x-1.5 text-emerald-400 font-semibold text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live DB</span>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            Dual-module sync active. Inventory & bills update instantaneously.
          </p>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400 flex items-center justify-between">
        <div>
          <p className="font-bold text-slate-200">PostgreSQL 17 Synced</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Dual-Role Connected Core</p>
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
      </div>
    </aside>
  );
};

export default ManagementSidebar;
