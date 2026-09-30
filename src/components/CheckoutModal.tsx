import React, { useState, useEffect, useMemo } from 'react';
import { X, ShoppingBag, Banknote, ShieldCheck, ArrowRight, Loader2, AlertCircle, Lock, LogIn, Plus, Filter, ChevronDown, MessageCircle } from 'lucide-react';
import { Item, CartLine, Order, User, PaymentMethod, Category } from '../types';
import { api } from '../services/api';
import { getWhatsAppUrl, STORE_PHONE } from '../utils/whatsapp';

interface CheckoutModalProps {
  isOpen: boolean;
  mode: 'order' | 'money_transfer';
  cart: Record<string, number>;
  items: Item[];
  user: User | null;
  onClose: () => void;
  onSuccess: (order: Order) => void;
  onRequireLogin?: () => void;
  onAddToCart?: (itemId: string) => void;
  onRemoveFromCart?: (itemId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  mode,
  cart,
  items,
  user,
  onClose,
  onSuccess,
  onRequireLogin,
  onAddToCart,
  onRemoveFromCart,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [note, setNote] = useState('');
  const [transferAmount, setTransferAmount] = useState<number>(1000);
  const [beneficiaryInfo, setBeneficiaryInfo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [upiRef, setUpiRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalCategory, setModalCategory] = useState<string>('All');
  const [modalSelectedProduct, setModalSelectedProduct] = useState<string>('');

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
      } else {
        setCustomerName(user.name || '');
        setCustomerPhone(user.phone || '');
        if (user.email && !user.email.toLowerCase().includes('customer@example.com')) {
          setCustomerEmail(user.email);
        } else {
          setCustomerEmail('');
        }
      }
    }
  }, [user]);

  const modalFilteredItems = useMemo(() => {
    if (modalCategory === 'All') return items;
    return items.filter((i) => i.category === modalCategory);
  }, [items, modalCategory]);

  const cartLines: CartLine[] = useMemo(() => {
    return Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = items.find((i) => i.id === id);
        return {
          itemId: id,
          name: item?.name || 'Item',
          price: item?.price || 0,
          qty,
          unit: item?.unit,
          category: item?.category,
        };
      });
  }, [cart, items]);

  const cartSubtotal = useMemo(() => {
    return cartLines.reduce((sum, line) => sum + line.price * line.qty, 0);
  }, [cartLines]);

  // Money transfer service fee: ₹10 per ₹1000 or part thereof, minimum ₹10
  const serviceFee = Math.max(10, Math.ceil(Number(transferAmount || 0) / 1000) * 10);
  const totalAmount = mode === 'money_transfer' ? Number(transferAmount || 0) + serviceFee : cartSubtotal;

  if (!isOpen) return null;

  // STRICT LOGIN GUARD: If user is not logged in, show login prompt in modal
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 border border-amber-300">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold font-display text-slate-900">
            Login Required to Place Order
          </h3>
          <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
            JM Enterprises requires customer sign-in to associate your orders, provide instant computerized receipts, and track order fulfillment.
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => {
                onClose();
                if (onRequireLogin) onRequireLogin();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1d2547] hover:bg-[#283363] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              <span>Login / Register Now</span>
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('You must be logged in to complete this order.');
      return;
    }

    if (!customerName.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      setError('Please enter a valid phone number (at least 8 digits).');
      return;
    }

    if (mode === 'order' && cartLines.length === 0) {
      setError('Your cart is empty. Please add items to order.');
      return;
    }

    if (mode === 'money_transfer' && (!transferAmount || transferAmount <= 0)) {
      setError('Please enter a valid transfer amount.');
      return;
    }

    setLoading(true);

    try {
      let linesPayload = cartLines;
      if (mode === 'money_transfer') {
        linesPayload = [
          {
            itemId: 'm-transfer',
            name: `Money Transfer to: ${beneficiaryInfo.trim() || 'Beneficiary Account'}`,
            price: serviceFee,
            qty: 1,
            category: 'Money Transfer',
          },
        ];
      }

      const combinedNote = mode === 'money_transfer'
        ? `Transfer Amount: ₹${transferAmount}. Beneficiary: ${beneficiaryInfo}. ${note ? `Note: ${note}` : ''}`
        : note;

      const order = await api.createOrder({
        customerId: user.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        note: combinedNote.trim() || undefined,
        lines: linesPayload,
        kind: mode,
        transferAmount: mode === 'money_transfer' ? transferAmount : undefined,
        serviceFee: mode === 'money_transfer' ? serviceFee : undefined,
        subtotal: mode === 'money_transfer' ? serviceFee : cartSubtotal,
        total: totalAmount,
        paymentMethod,
        upiRef: paymentMethod === 'upi' ? (upiRef.trim() || undefined) : undefined,
      });

      onSuccess(order);
    } catch (err: any) {
      console.error('Order creation error:', err);
      setError(err?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user && user.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-[#1b2e66] text-slate-900 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#1b3272] flex items-center justify-between sticky top-0 bg-[#0a1538] text-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#162760] text-amber-400 border border-[#2b449b] flex items-center justify-center font-bold">
              {mode === 'money_transfer' ? <Banknote className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">
                {mode === 'money_transfer' 
                  ? 'Send Money (Instant Transfer)' 
                  : (isAdmin ? 'Confirm Order & Print Receipt' : 'Confirm Order Details')}
              </h2>
              <p className="text-xs text-blue-200/80">
                JM Enterprises Verified Merchant Terminal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Money transfer inputs */}
          {mode === 'money_transfer' && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Banknote className="w-4 h-4" /> Transfer Particulars
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount to Send (₹) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Service charge: ₹10 per ₹1,000
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Beneficiary Account / Phone Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210 or A/C 1234..."
                    value={beneficiaryInfo}
                    onChange={(e) => setBeneficiaryInfo(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Cart items review (Order Mode) */}
          {mode === 'order' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Order Summary ({cartLines.length} item kinds)
                </h3>
                <span className="text-xs font-mono font-bold text-slate-900">
                  Subtotal: ₹{cartSubtotal}
                </span>
              </div>

              {cartLines.length === 0 ? (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-center text-xs text-amber-900">
                  No items in order yet. Use the category and product dropdown below to add items.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto rounded-2xl border border-slate-200 p-3 bg-slate-50">
                  {cartLines.map((line) => (
                    <div key={line.itemId} className="py-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">
                        {line.name} <span className="text-slate-400">× {line.qty}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        {onAddToCart && onRemoveFromCart && (
                          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1">
                            <button
                              type="button"
                              onClick={() => onRemoveFromCart(line.itemId)}
                              className="text-slate-600 hover:text-black font-bold px-1"
                              title="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="text-slate-900 font-mono text-[11px] font-bold">
                              {line.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => onAddToCart(line.itemId)}
                              className="text-slate-600 hover:text-black font-bold px-1"
                              title="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        )}
                        <span className="font-mono font-semibold text-slate-900 min-w-[50px] text-right">
                          ₹{line.price * line.qty}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add item by Category & Product Dropdown List (as in offline POS) */}
              {onAddToCart && (
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-300/80 space-y-2">
                  <div className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 text-amber-600" />
                    <span>Add Products via Category &amp; Dropdown List:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <select
                        value={modalCategory}
                        onChange={(e) => {
                          setModalCategory(e.target.value);
                          setModalSelectedProduct('');
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="All">All Categories</option>
                        <option value="Stationery">Stationery</option>
                        <option value="Xerox">Xerox</option>
                        <option value="Printing">Printing</option>
                        <option value="Money Transfer">Money Transfer</option>
                      </select>
                    </div>
                    <div className="sm:col-span-5">
                      <select
                        value={modalSelectedProduct}
                        onChange={(e) => setModalSelectedProduct(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="">-- Choose Product Dropdown --</option>
                        {modalFilteredItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} (₹{item.price})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (modalSelectedProduct) {
                            onAddToCart(modalSelectedProduct);
                            setModalSelectedProduct('');
                          }
                        }}
                        disabled={!modalSelectedProduct}
                        className="w-full py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-50 transition-all cursor-pointer flex flex-col items-center justify-center leading-tight shadow-xs"
                      >
                        <span className="text-[10px] uppercase font-extrabold text-slate-900 leading-tight">Quantity:</span>
                        <span className="text-xs font-black font-mono leading-tight">1</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Customer details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Customer Details (Will appear on Printed Receipt)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full Name"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="10-digit phone number"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="For e-receipt copy"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Order Note / Print Instructions
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Back-to-back print, 2 copies"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'upi', 'card'] as PaymentMethod[]).map((pm) => (
                <button
                  type="button"
                  key={pm}
                  onClick={() => setPaymentMethod(pm)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition-all cursor-pointer ${
                    paymentMethod === pm
                      ? 'bg-gradient-to-r from-[#0a1538] to-[#162760] text-amber-300 border-[#2b449b] shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>

            {/* UPI Reference Section */}
            {paymentMethod === 'upi' && (
              <div className="mt-3 p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  UPI Reference / UTR Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9847291048 or UPI-12345"
                  value={upiRef}
                  onChange={(e) => setUpiRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono text-slate-900 focus:ring-2 focus:ring-[#1d2547] focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Totals Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">
                {mode === 'money_transfer' ? 'Total Payable (Amount + Fee)' : 'Total Bill Amount'}
              </div>
              <div className="text-2xl font-black text-[#1d2547] font-display">
                ₹{totalAmount}
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Store Receipt</span>
            </div>
          </div>

          {/* Submit & WhatsApp Help */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <a
              href={getWhatsAppUrl(`Query regarding ${mode === 'money_transfer' ? 'Money Transfer' : 'Order'}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366] fill-[#25D366]" />
              <span>Questions? WhatsApp store ({STORE_PHONE})</span>
            </a>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 active:scale-98 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer border border-emerald-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <span>{isAdmin ? 'Confirm & Print Receipt' : 'Confirm & Place Order'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
