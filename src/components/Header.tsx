import React from 'react';
import { 
  ShoppingBag, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  LogIn, 
  Receipt,
  Lock
} from 'lucide-react';
import { User } from '../types';
import jmLogo from '../assets/logo.png';

interface HeaderProps {
  currentView: 'shop' | 'receipt' | 'admin' | 'account';
  onNavigate: (view: 'shop' | 'receipt' | 'admin' | 'account') => void;
  cartCount: number;
  cartTotal: number;
  user: User | null;
  onOpenAuth: (initialTab?: 'login' | 'register') => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  cartCount,
  cartTotal,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const isAdmin = user && user.role === 'admin';

  return (
    <header className="no-print sticky top-0 z-30 bg-[#0a1538] border-b border-[#1b2f6b] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-[#081333] via-[#0d1d4d] to-[#081333]">
        {/* Brand identity */}
        <div 
          onClick={() => onNavigate(isAdmin ? 'admin' : 'shop')}
          className="cursor-pointer flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-black border border-amber-400/50 p-0.5 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform overflow-hidden">
            <img src={jmLogo} alt="JM Enterprises Logo" className="w-full h-full object-contain rounded-lg" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight font-display text-white flex items-center gap-2">
              JM ENTERPRISES
              <span className="text-[10px] uppercase font-sans font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                Official
              </span>
            </h1>
            <p className="text-xs text-blue-200/80 font-medium">
              Stationery · Quality Xerox · Printouts · Money Transfer
            </p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <nav className="flex items-center gap-1 p-1 rounded-xl bg-[#060e26]/90 border border-[#192b60]">
            {/* Products & Services - Public for customers, completely removed for Admin login */}
            {!isAdmin && (
              <button
                onClick={() => onNavigate('shop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'shop'
                    ? 'bg-gradient-to-r from-[#1c337a] to-[#2546a3] text-amber-300 shadow-xs border border-[#3b62c4]'
                    : 'text-blue-100 hover:text-white hover:bg-[#12214e]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                <span>Products &amp; Services</span>
                {cartCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* If logged in: Show Dashboard */}
            {user ? (
              <>
                <button
                  onClick={() => onNavigate(isAdmin ? 'admin' : 'account')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentView === 'account' || currentView === 'admin'
                      ? 'bg-gradient-to-r from-[#1c337a] to-[#2546a3] text-amber-300 shadow-xs border border-[#3b62c4]'
                      : 'text-blue-100 hover:text-white hover:bg-[#12214e]'
                  }`}
                >
                  {isAdmin ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Admin Dashboard</span>
                    </>
                  ) : (
                    <>
                      <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>My Dashboard</span>
                    </>
                  )}
                </button>

                {/* CRITICAL REQUIREMENT: Print Receipt ONLY for Admin! Removed for regular user login */}
                {isAdmin && (
                  <button
                    onClick={() => onNavigate('receipt')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentView === 'receipt'
                        ? 'bg-gradient-to-r from-[#1c337a] to-[#2546a3] text-amber-300 shadow-xs border border-[#3b62c4]'
                        : 'text-blue-100 hover:text-white hover:bg-[#12214e]'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-400" />
                    <span>Print Receipts</span>
                  </button>
                )}
              </>
            ) : (
              /* When not logged in: Protected Dashboard Button (NO print receipt button) */
              <button
                onClick={() => onOpenAuth('login')}
                title="Login required to access dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-200/70 hover:text-white hover:bg-[#12214e] cursor-pointer"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Dashboard (Login Required)</span>
              </button>
            )}
          </nav>

          {/* User Account / Auth trigger */}
          {user ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onNavigate(isAdmin ? 'admin' : 'account')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#264494] bg-[#0e1d4b] hover:bg-[#142866] text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-black border border-amber-400/50 flex items-center justify-center overflow-hidden p-0.5 shrink-0">
                  <img src={jmLogo} alt="User Avatar" className="w-full h-full object-contain rounded-full" />
                </div>
                <span className="max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  isAdmin 
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' 
                    : 'bg-blue-400/20 text-blue-200 border border-blue-400/40'
                }`}>
                  {user.role}
                </span>
              </button>
              <button
                onClick={onLogout}
                title="Log out"
                className="p-2 rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-600 hover:border-rose-500 text-rose-300 hover:text-white transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 border border-amber-300 active:scale-95 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-950" />
              <span>Login / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
