/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Item, Order, User } from './types';
import { api, clearAuthSession, getStoredUser } from './services/api';
import { Header } from './components/Header';
import { ShopView } from './components/ShopView';
import { ReceiptView } from './components/ReceiptView';
import { AdminView } from './components/AdminView';
import { AccountView } from './components/AccountView';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { CustomerHelpBot } from './components/CustomerHelpBot';
import { Lock, LogIn, ShoppingBag } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'shop' | 'receipt' | 'admin' | 'account'>(() => {
    const stored = getStoredUser();
    return stored?.role === 'admin' ? 'admin' : 'shop';
  });
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('jm_cart_v2');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [currentReceipt, setCurrentReceipt] = useState<Order | null>(null);

  // Modals
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<'order' | 'money_transfer'>('order');
  const [authModalOpen, setAuthModalOpen] = useState(() => !getStoredUser());
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');

  // Persist cart
  useEffect(() => {
    localStorage.setItem('jm_cart_v2', JSON.stringify(cart));
  }, [cart]);

  // Load catalog items and verify user session
  const loadInitialData = async () => {
    try {
      const fetchedItems = await api.getItems();
      setItems(fetchedItems);
    } catch (err) {
      console.error('Failed to load items:', err);
    }

    try {
      const currentUser = await api.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.role === 'admin' && (currentView === 'shop' || currentView === 'account')) {
          setCurrentView('admin');
        }
      }
    } catch (err) {
      console.error('Session check failed:', err);
    }

    try {
      const latestOrders = await api.getOrders();
      if (latestOrders && latestOrders.length > 0) {
        setCurrentReceipt(latestOrders[0]);
      }
    } catch (err) {
      console.error('Failed to load recent orders:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Cart operations
  const handleAddToCart = (itemId: string, qty: number = 1) => {
    // Ordering check: user must be logged in to order
    if (!user) {
      setAuthInitialTab('login');
      setAuthModalOpen(true);
      return;
    }

    setCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + (qty > 0 ? qty : 1),
    }));
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      if (!next[itemId]) return prev;
      next[itemId] -= 1;
      if (next[itemId] <= 0) {
        delete next[itemId];
      }
      return next;
    });
  };

  const handleClearCart = () => {
    setCart({});
  };

  const handleDeleteItemFromCart = (itemId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  // Checkout gating: without login user cannot order products or transfer money
  const handleOpenCheckout = (mode: 'order' | 'money_transfer') => {
    if (!user) {
      setAuthInitialTab('login');
      setAuthModalOpen(true);
      return;
    }
    setCheckoutMode(mode);
    setCheckoutModalOpen(true);
  };

  const handleOrderSuccess = (order: Order) => {
    setCart({});
    setCheckoutModalOpen(false);
    setCurrentReceipt(order);
    // Print receipt is strictly for admin; regular user goes to customer dashboard
    if (user?.role === 'admin') {
      setCurrentView('receipt');
    } else {
      setCurrentView('account');
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    if (currentView === 'account' || currentView === 'admin' || currentView === 'receipt') {
      setCurrentView('shop');
    }
  };

  const handleOpenAuth = (tab: 'login' | 'register' = 'login') => {
    setAuthInitialTab(tab);
    setAuthModalOpen(true);
  };

  const cartLinesCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const cartTotalAmount = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = items.find((i) => i.id === id);
    return sum + (item?.price || 0) * qty;
  }, 0);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900 transition-colors">
      {/* Global Navigation Header in Royal and Navy */}
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        cartCount={cartLinesCount}
        cartTotal={cartTotalAmount}
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {/* SHOP VIEW */}
        {currentView === 'shop' && (
          <ShopView
            items={items}
            cart={cart}
            user={user}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onDeleteItemFromCart={handleDeleteItemFromCart}
            onOpenCheckout={handleOpenCheckout}
            onRequireLogin={() => handleOpenAuth('login')}
          />
        )}

        {/* RECEIPT VIEW: Strictly for Admin; removed for regular user login */}
        {currentView === 'receipt' && (
          user?.role === 'admin' ? (
            <ReceiptView
              order={currentReceipt}
              onBackToShop={() => setCurrentView('shop')}
              onBackToAdmin={() => setCurrentView('admin')}
              onSelectOrder={(ord) => setCurrentReceipt(ord)}
            />
          ) : (
            <div className="max-w-md mx-auto py-16 px-4 text-center animate-in fade-in duration-300">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 border border-amber-300">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold font-display text-slate-900">
                  Receipt Printing Restricted to Admin
                </h2>
                <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
                  Official computerized receipt printing is reserved for the JM Enterprises counter operator. You can track all your orders and transaction status inside your Customer Dashboard.
                </p>
                <button
                  onClick={() => setCurrentView(user ? 'account' : 'shop')}
                  className="px-5 py-2.5 rounded-xl bg-[#0a1538] hover:bg-[#122256] text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  {user ? 'Go to My Dashboard' : 'Back to Store'}
                </button>
              </div>
            </div>
          )
        )}

        {/* ADMIN DASHBOARD: Admin only sees admin criteria */}
        {currentView === 'admin' && (
          user?.role === 'customer' ? (
            <div className="max-w-md mx-auto py-16 px-4 text-center animate-in fade-in duration-300">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center mx-auto mb-4 border border-rose-300">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold font-display text-slate-900">
                  Admin Criteria Clearance Required
                </h2>
                <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
                  You are logged in as customer <strong className="text-slate-800">{user.name}</strong>. Admin criteria, pricing configurations, and cash ledgers are strictly restricted to store administrators.
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                  <button
                    onClick={() => setCurrentView('account')}
                    className="px-4 py-2 rounded-xl bg-[#0a1538] hover:bg-[#122256] text-white text-xs font-bold cursor-pointer"
                  >
                    View My Dashboard
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      handleOpenAuth('login');
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Sign In with Admin ID
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <AdminView
              user={user}
              items={items}
              onRefreshItems={loadInitialData}
              onSelectReceipt={(ord) => {
                setCurrentReceipt(ord);
                setCurrentView('receipt');
              }}
              onAdminLoginSuccess={(adminUser) => {
                setUser(adminUser);
                setCurrentView('admin');
              }}
            />
          )
        )}

        {/* CUSTOMER DASHBOARD / ACCOUNT VIEW */}
        {currentView === 'account' && (
          <>
            {user ? (
              <AccountView
                user={user}
                onGoToShop={() => setCurrentView('shop')}
                onLogout={handleLogout}
              />
            ) : (
              /* RESTRICTED DASHBOARD VIEW IF NOT LOGGED IN */
              <div className="max-w-md mx-auto py-16 px-4 text-center animate-in fade-in duration-300">
                <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 border border-amber-300">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold font-display text-slate-900">
                    Dashboard Access Restricted
                  </h2>
                  <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
                    You must be logged in to view your customer dashboard, past orders, payment receipts, and account settings.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => handleOpenAuth('login')}
                      className="px-5 py-2.5 rounded-xl bg-[#1d2547] hover:bg-[#283363] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4 text-amber-400" />
                      <span>Sign In to Dashboard</span>
                    </button>
                    <button
                      onClick={() => setCurrentView('shop')}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 text-slate-500" />
                      <span>Browse Products</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer - Excluded from Admin login and terminal views */}
      {user?.role !== 'admin' && currentView !== 'admin' && currentView !== 'receipt' && (
        <Footer />
      )}

      {/* Checkout & Money Transfer Modal */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        mode={checkoutMode}
        cart={cart}
        items={items}
        user={user}
        onClose={() => setCheckoutModalOpen(false)}
        onSuccess={handleOrderSuccess}
        onRequireLogin={() => handleOpenAuth('login')}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
      />

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={authModalOpen}
        initialTab={authInitialTab}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(authUser) => {
          setUser(authUser);
          setAuthModalOpen(false);
          if (authUser.role === 'admin') {
            setCurrentView('admin');
          } else {
            setCurrentView('account');
          }
        }}
      />

      {/* Customer Help Bot & Direct WhatsApp Dock */}
      {currentView !== 'receipt' && (
        <CustomerHelpBot
          onNavigateToShop={() => setCurrentView('shop')}
          onNavigateToAccount={() => {
            if (user) {
              setCurrentView('account');
            } else {
              handleOpenAuth('login');
            }
          }}
        />
      )}
    </div>
  );
}
