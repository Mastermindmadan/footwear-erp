import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  LayoutDashboard,
  Search,
  ScanBarcode,
  Boxes,
  ShoppingCart,
  Receipt,
  History,
  Activity,
  UserCheck,
} from 'lucide-react';

const salesNavItems = [
  { name: 'POS Dashboard', path: '/sales/dashboard', icon: LayoutDashboard },
  { name: 'Product Search', path: '/sales/search', icon: Search },
  { name: 'Barcode Scanner', path: '/sales/scanner', icon: ScanBarcode },
  { name: 'Stock Availability', path: '/sales/stock', icon: Boxes },
  { name: 'My Cart', path: '/sales/cart', icon: ShoppingCart, badge: true },
  { name: 'Express Billing', path: '/sales/billing', icon: Receipt },
  { name: 'Sales History', path: '/sales/history', icon: History },
  { name: 'My Sales Activity', path: '/sales/activity', icon: Activity },
  { name: 'My Profile', path: '/sales/profile', icon: UserCheck },
];

const SalesSidebar = () => {
  const { totals } = useCart();

  return (
    <aside className="w-68 bg-slate-900 text-slate-300 flex flex-col h-[calc(100vh-4rem)] sticky top-16 select-none border-r border-slate-800 shadow-xl flex-shrink-0">
      <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">POS Sales Suite</span>
        <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
          Terminal Active
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3.5 py-3 space-y-1.5">
        {salesNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 flex-shrink-0 text-slate-400 group-hover:text-white transition-colors" />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge && totals.totalPairs > 0 && (
                <span className="bg-amber-400 text-slate-950 text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                  {totals.totalPairs}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* POS Quick Summary Widget */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 rounded-b-xl space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span className="font-medium">Active Cart:</span>
          <span className="font-bold text-emerald-400">{totals.totalPairs} pairs</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span className="font-medium">Payable Amount:</span>
          <span className="font-extrabold text-white text-sm">₹{totals.grandTotal.toLocaleString()}</span>
        </div>
      </div>
    </aside>
  );
};

export default SalesSidebar;
