import React, { useState, useEffect } from 'react';
import { User, Order, OrderStatus } from '../types';
import { api } from '../services/api';
import { 
  User as UserIcon, 
  Receipt, 
  Clock, 
  Phone, 
  Mail, 
  ArrowRight, 
  FileText, 
  RefreshCw, 
  ShoppingBag,
  CheckCircle2,
  X,
  CreditCard,
  Building,
  Store
} from 'lucide-react';
import jmLogo from '../assets/logo.png';

interface AccountViewProps {
  user: User;
  onGoToShop: () => void;
  onLogout: () => void;
  isDark?: boolean;
}

export const AccountView: React.FC<AccountViewProps> = ({
  user,
  onGoToShop,
  onLogout,
  isDark = false,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchUserOrders = async () => {
    setLoading(true);
    try {
      const list = await api.getOrders({ customerId: user.id, phone: user.phone });
      setOrders(list);
    } catch (err) {
      console.error('Failed to fetch customer orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserOrders();
  }, [user]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'paid':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      case 'pending':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-300';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Profile Overview Card with Royal Navy Accents & JM Brand Emblem */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-black border-2 border-amber-400/60 p-1 flex items-center justify-center shadow-md overflow-hidden">
              <img src={jmLogo} alt="JM Enterprises Profile" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-xs" title="Verified Customer Account">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-display text-slate-900">{user.name}</h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                Customer Account
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-amber-600" />
                {user.phone}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                {user.email}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onGoToShop}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0a1538] to-[#162760] hover:from-[#122256] hover:to-[#21377a] text-amber-300 hover:text-amber-200 text-xs font-bold cursor-pointer shadow-xs border border-[#2b449b] transition-all active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>Browse Products</span>
          </button>
          <button
            onClick={onLogout}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer transition-all active:scale-95"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Orders List (No Print Receipt for User Login) */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              My Orders &amp; Transaction History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live tracking of your stationery, Xerox, printouts, and money transfer orders
            </p>
          </div>
          <button
            onClick={fetchUserOrders}
            className="p-2 rounded-xl border border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading your transactions...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <FileText className="w-10 h-10 mx-auto opacity-30 mb-2 text-slate-400" />
            <p className="font-semibold text-slate-700">No orders placed yet</p>
            <p className="mt-0.5 text-slate-500">Orders made with your phone or email will automatically appear here.</p>
            <button
              onClick={onGoToShop}
              className="mt-3 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 border border-amber-300 transition-all cursor-pointer active:scale-95"
            >
              Start Ordering
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 mt-2">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2.5 rounded-2xl transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0a1538]">
                      {ord.receiptNumber}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {ord.kind === 'money_transfer' ? 'Money Transfer' : 'Store Order'}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(ord.status)}`}>
                      {ord.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(ord.createdAt).toLocaleString()} · {ord.lines.length} item(s)
                  </div>
                  <div className="text-xs text-slate-700 mt-0.5 truncate max-w-md">
                    {ord.lines.map((l) => `${l.name} (x${l.qty})`).join(', ')}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-base font-extrabold text-[#0a1538] font-display">
                      ₹{ord.total}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">{ord.paymentMethod}</div>
                  </div>

                  {/* Strictly View Details (NO Print Receipt for User Login) */}
                  <button
                    onClick={() => setSelectedOrder(ord)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 border border-slate-300 text-slate-800 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Order Details Modal (View Only - No Print Receipt) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 bg-[#0a1538] text-white flex items-center justify-between border-b border-[#1b2f6b]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#162760] text-amber-400 font-brand font-bold text-sm flex items-center justify-center border border-[#2b449b]">
                  JM
                </div>
                <div>
                  <h4 className="text-sm font-bold font-display text-white">
                    Order Details: {selectedOrder.receiptNumber}
                  </h4>
                  <p className="text-[11px] text-blue-200">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Status Banner */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Fulfillment Status</span>
                  <span className={`inline-block mt-0.5 text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Payment Mode</span>
                  <span className="font-bold text-slate-800 uppercase">{selectedOrder.paymentMethod}</span>
                  {selectedOrder.upiRef && (
                    <span className="block font-mono text-[10px] text-slate-500">Ref: {selectedOrder.upiRef}</span>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div>
                <h5 className="font-bold text-slate-800 mb-2 uppercase text-[11px] tracking-wide">
                  Purchased Items &amp; Services
                </h5>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedOrder.lines.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between bg-white text-slate-800">
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-[11px] text-slate-500">
                          Qty: {item.qty} × ₹{item.price}
                        </div>
                      </div>
                      <div className="font-bold font-mono">
                        ₹{item.price * item.qty}
                      </div>
                    </div>
                  ))}

                  {selectedOrder.transferAmount && (
                    <div className="p-2.5 bg-blue-50/50 flex items-center justify-between text-blue-900 border-t border-blue-100">
                      <div>
                        <div className="font-semibold">Remittance Principal Amount</div>
                        <div className="text-[11px] text-blue-700">Bank Transfer / IMPS</div>
                      </div>
                      <div className="font-bold font-mono">
                        ₹{selectedOrder.transferAmount}
                      </div>
                    </div>
                  )}

                  {selectedOrder.serviceFee && (
                    <div className="p-2.5 bg-slate-50 flex items-center justify-between text-slate-700 border-t border-slate-100">
                      <div className="font-semibold">Service / Convenience Fee</div>
                      <div className="font-bold font-mono">
                        ₹{selectedOrder.serviceFee}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Total */}
              <div className="p-3 rounded-xl bg-slate-100 flex items-center justify-between border border-slate-200">
                <span className="font-bold text-slate-700">Total Amount Paid</span>
                <span className="font-black text-base text-[#0a1538] font-display">₹{selectedOrder.total}</span>
              </div>

              {/* Note / Notice about Physical Receipt Printing */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <span className="font-bold block mb-0.5">ℹ️ Official Physical Paper Receipt Notice:</span>
                For physical printed receipts, thermal POS printouts, or store seals, please collect your paper receipt directly from the JM Enterprises shop counter (Phone: 8747991688).
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0a1538] to-[#162760] hover:from-[#122256] hover:to-[#21377a] text-amber-300 border border-[#2b449b] text-xs font-bold cursor-pointer shadow-xs transition-all active:scale-95"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
