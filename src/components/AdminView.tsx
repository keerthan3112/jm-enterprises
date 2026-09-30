import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  IndianRupee, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  Database, 
  Printer, 
  Lock, 
  Loader2, 
  AlertCircle, 
  Receipt,
  Search,
  Check,
  X,
  Eye,
  EyeOff,
  KeyRound,
  Server,
  HardDrive,
  Download,
  Users,
  UserX,
  AlertTriangle,
  FileCode,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Item, Order, OrderStatus, Category, DatabaseStats, User, DatabaseUser, BackendDatabaseInfo, LoginAuditRecord, JmDbUserCredential, JmDbResponse } from '../types';
import { api } from '../services/api';
import { OfflineBilling } from './OfflineBilling';
import jmLogo from '../assets/logo.png';

interface AdminViewProps {
  user: User | null;
  items: Item[];
  onRefreshItems: () => void;
  onSelectReceipt: (order: Order) => void;
  onAdminLoginSuccess: (user: User) => void;
  isDark?: boolean;
}

const CATEGORIES: Category[] = ['Stationery', 'Xerox', 'Printing', 'Money Transfer'];

export const AdminView: React.FC<AdminViewProps> = ({
  user,
  items,
  onRefreshItems,
  onSelectReceipt,
  onAdminLoginSuccess,
  isDark = false,
}) => {
  const isAdmin = user && user.role === 'admin';

  // Admin login states (distinct from customer phone/email credentials)
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Admin dashboard states
  const [activeTab, setActiveTab] = useState<'billing' | 'tx' | 'items' | 'database'>('billing');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [txFilter, setTxFilter] = useState<'all' | OrderStatus>('all');
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Backend Database states
  const [dbUsers, setDbUsers] = useState<DatabaseUser[]>([]);
  const [dbInfo, setDbInfo] = useState<BackendDatabaseInfo | null>(null);
  const [auditLogs, setAuditLogs] = useState<LoginAuditRecord[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [resetPwdUserId, setResetPwdUserId] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [dbActionMsg, setDbActionMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [clearingUsers, setClearingUsers] = useState(false);

  // jm.db Reference File Viewer states
  const [showJmDbModal, setShowJmDbModal] = useState(false);
  const [jmDbContent, setJmDbContent] = useState('');
  const [jmDbCredentials, setJmDbCredentials] = useState<JmDbUserCredential[]>([]);
  const [loadingJmDb, setLoadingJmDb] = useState(false);
  const [copiedPwdId, setCopiedPwdId] = useState<string | null>(null);
  const [jmDbViewMode, setJmDbViewMode] = useState<'table' | 'raw'>('table');

  // New item form states
  const [niName, setNiName] = useState('');
  const [niCat, setNiCat] = useState<Category>('Stationery');
  const [niPrice, setNiPrice] = useState<number>(10);
  const [niUnit, setNiUnit] = useState('per piece');
  const [niDesc, setNiDesc] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  // Catalog items table search & filter states
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [itemCatFilter, setItemCatFilter] = useState<'All' | Category>('All');
  const [itemUpdateMsg, setItemUpdateMsg] = useState<string | null>(null);

  // Load orders and stats
  const fetchAdminData = async () => {
    if (!isAdmin) return;
    setLoadingOrders(true);
    try {
      const [orderList, dbStats] = await Promise.all([
        api.getOrders(),
        api.getStats(),
      ]);
      setOrders(orderList);
      setStats(dbStats);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Load backend database user credentials and diagnostics
  const fetchDatabaseData = async () => {
    if (!isAdmin) return;
    setLoadingDb(true);
    try {
      const [usersList, info, audits] = await Promise.all([
        api.getDatabaseUsers(),
        api.getDatabaseInfo(),
        api.getLoginAuditLogs(),
      ]);
      setDbUsers(usersList);
      setDbInfo(info);
      setAuditLogs(audits);
    } catch (err) {
      console.error('Failed to load database data:', err);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
      fetchDatabaseData();
    }
  }, [isAdmin]);

  // Handle Admin Quick Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const idToTest = adminId.trim() || 'admin';
      const { user: authUser } = await api.login(idToTest, adminPassword);
      if (authUser.role !== 'admin') {
        setLoginError('Account does not meet Administrator Security Criteria.');
        return;
      }
      onAdminLoginSuccess(authUser);
    } catch (err: any) {
      setLoginError(err?.message || 'Invalid admin credentials. ID: admin, Passcode: admin123');
    } finally {
      setLoginLoading(false);
    }
  };

  // Status Change
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      const updatedStats = await api.getStats();
      setStats(updatedStats);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Add Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niName.trim()) return;
    setAddingItem(true);
    try {
      await api.addItem({
        name: niName.trim(),
        category: niCat,
        price: Number(niPrice),
        unit: niUnit.trim() || 'per piece',
        description: niDesc.trim() || undefined,
        inStock: true,
      });
      setNiName('');
      setNiPrice(10);
      setNiDesc('');
      onRefreshItems();
    } catch (err) {
      console.error('Failed to add item:', err);
    } finally {
      setAddingItem(false);
    }
  };

  // Update Item Name / Price / Unit inline
  const handleUpdateItem = async (id: string, updates: Partial<Item>) => {
    try {
      const updated = await api.updateItem(id, updates);
      if (updates.name) {
        setItemUpdateMsg(`Updated item name to "${updated.name}"`);
      } else if (updates.price !== undefined) {
        setItemUpdateMsg(`Updated price for "${updated.name}" to ₹${updated.price}`);
      } else if (updates.unit !== undefined) {
        setItemUpdateMsg(`Updated unit for "${updated.name}" to "${updated.unit}"`);
      }
      setTimeout(() => setItemUpdateMsg(null), 3000);
      onRefreshItems();
    } catch (err) {
      console.error('Failed to update item:', err);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to remove this item from the catalog?')) return;
    try {
      await api.deleteItem(id);
      onRefreshItems();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  // User Database Handlers
  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove user "${name}" from the database? This action is permanent.`)) return;
    setDeletingUserId(id);
    try {
      const res = await api.deleteDatabaseUser(id);
      setDbActionMsg({ text: res.message || 'User deleted successfully from database' });
      await fetchDatabaseData();
    } catch (err: any) {
      setDbActionMsg({ text: err?.message || 'Failed to delete user', isError: true });
    } finally {
      setDeletingUserId(null);
      setTimeout(() => setDbActionMsg(null), 4000);
    }
  };

  const handleClearRegisteredUsers = async () => {
    try {
      setClearingUsers(true);
      const res = await api.clearRegisteredUsers();
      setDbActionMsg({ text: res.message || 'All registered users cleared from database.', isError: false });
      await fetchDatabaseData();
      setShowClearConfirmModal(false);
    } catch (err: any) {
      setDbActionMsg({ text: err?.message || 'Failed to clear registered users from database', isError: true });
    } finally {
      setClearingUsers(false);
      setTimeout(() => setDbActionMsg(null), 5000);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwdUserId) return;
    if (newPasswordVal.length < 8) {
      setDbActionMsg({ text: 'New password must be at least 8 characters long.', isError: true });
      return;
    }
    try {
      const res = await api.resetUserPassword(resetPwdUserId, newPasswordVal);
      setDbActionMsg({ text: res.message || 'Password successfully updated in backend database.' });
      setResetPwdUserId(null);
      setNewPasswordVal('');
      await fetchDatabaseData();
    } catch (err: any) {
      setDbActionMsg({ text: err?.message || 'Failed to reset password', isError: true });
    } finally {
      setTimeout(() => setDbActionMsg(null), 4000);
    }
  };

  const handleExportUsersJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dbUsers, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `jm_users_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleOpenJmDbModal = async () => {
    setShowJmDbModal(true);
    setLoadingJmDb(true);
    try {
      const res = await api.getJmDb();
      setJmDbContent(res.content);
      setJmDbCredentials(res.credentials);
    } catch (err) {
      console.error('Failed to load jm.db file:', err);
    } finally {
      setLoadingJmDb(false);
    }
  };

  const handleCopyPassword = (userId: string, pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedPwdId(userId);
    setTimeout(() => setCopiedPwdId(null), 2000);
  };

  const handleDownloadJmDb = () => {
    window.open('/api/admin/jm-db/download', '_blank');
  };

  const filteredUsers = dbUsers.filter((u) => {
    const q = userSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  });

  // Filtered Orders
  const filteredOrders = orders.filter((o) => txFilter === 'all' || o.status === txFilter);

  // Filtered Catalog Items for editing
  const filteredCatalogItems = items.filter((item) => {
    const matchesCat = itemCatFilter === 'All' || item.category === itemCatFilter;
    const q = itemSearchQuery.trim().toLowerCase();
    const matchesSearch = !q || item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  // If not logged in as Admin, show admin unlock screen with explicit admin criteria
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 animate-in fade-in duration-300">
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl bg-white text-slate-900">
          <div className="w-16 h-16 rounded-2xl bg-black border border-amber-400/50 p-1 flex items-center justify-center mx-auto mb-4 shadow-md overflow-hidden">
            <img src={jmLogo} alt="JM Enterprises Admin" className="w-full h-full object-contain rounded-xl" />
          </div>
          <h2 className="text-xl font-bold font-display text-center text-slate-900">
            Admin Sign In
          </h2>
          <p className="text-xs text-center text-slate-500 mt-1 mb-5">
            Store Administrator access for orders, inventory and billing
          </p>

          {loginError && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700">
                Admin Clearance ID
              </label>
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700">
                Store Master Passcode
              </label>
              <div className="relative">
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
                  title={showAdminPassword ? 'Hide passcode' : 'Show passcode'}
                  aria-label={showAdminPassword ? 'Hide passcode' : 'Show passcode'}
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0a1538] hover:bg-[#162760] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Sign In as Admin</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Administrator Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#071333] via-[#0d1d4d] to-[#071333] border border-[#1b3272] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black border border-amber-400/50 p-0.5 flex items-center justify-center shrink-0 shadow-md overflow-hidden">
            <img src={jmLogo} alt="JM Enterprises" className="w-full h-full object-contain rounded-lg" />
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base tracking-wide font-display text-white">
              Authorized Admin Terminal
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs self-end sm:self-auto">
          <span className="text-xs text-amber-300 bg-amber-400/15 border border-amber-400/30 px-3 py-1.5 rounded-xl font-bold font-mono shadow-xs">
            Operator: JM ADMIN (jm.enterprises.3112@gmail.com)
          </span>
        </div>
      </div>

      {/* Admin Stats Banner */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white border-stone-200 text-stone-900 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-4 h-4" /> Shop Management Console
            </div>
            <h2 className="text-2xl font-bold font-display mt-1">JM Enterprises Admin Dashboard</h2>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              Real-time store management: orders, customer requests, and product catalog
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('billing')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 border border-amber-300 shadow-sm active:scale-95 text-xs font-black transition-all cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-slate-950" />
              <span>Offline POS Billing</span>
            </button>

            <button
              onClick={fetchAdminData}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0d1e4c] to-[#1c357f] hover:from-[#132b6b] hover:to-[#2546a3] text-amber-300 hover:text-amber-200 border border-[#2c4ca8] shadow-xs active:scale-95 text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Attractive Cards / Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
          {/* Total Revenue */}
          <button
            type="button"
            onClick={() => { setActiveTab('tx'); setTxFilter('all'); }}
            className="text-left p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-600/20 border-2 border-emerald-500/40 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/15 transition-all cursor-pointer group active:scale-[0.98]"
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Total Revenue
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-110 transition-transform">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 font-display mt-2">
              ₹{stats?.totalRevenue ?? 0}
            </div>
            <div className="inline-flex items-center text-[10px] font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full mt-1.5">
              Paid &amp; completed orders
            </div>
          </button>

          {/* Total Orders */}
          <button
            type="button"
            onClick={() => { setActiveTab('tx'); setTxFilter('all'); }}
            className="text-left p-4 rounded-2xl bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-sky-600/20 border-2 border-blue-500/40 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/15 transition-all cursor-pointer group active:scale-[0.98]"
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-blue-800 dark:text-blue-300">
                Total Orders
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-300 font-display mt-2">
              {stats?.totalOrders ?? 0}
            </div>
            <div className="inline-flex items-center text-[10px] font-bold text-blue-900 dark:text-blue-200 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-full mt-1.5">
              All customer transactions
            </div>
          </button>

          {/* Pending Orders */}
          <button
            type="button"
            onClick={() => { setActiveTab('tx'); setTxFilter('pending'); }}
            className="text-left p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-yellow-500/20 border-2 border-amber-500/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/20 transition-all cursor-pointer group active:scale-[0.98]"
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                Pending Orders
              </span>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-display mt-2">
              {stats?.pendingOrders ?? 0}
            </div>
            <div className="inline-flex items-center text-[10px] font-bold text-amber-950 dark:text-amber-200 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full mt-1.5">
              Requires pickup or fulfillment
            </div>
          </button>

          {/* User Database */}
          <button
            type="button"
            onClick={() => { setActiveTab('database'); fetchDatabaseData(); }}
            className="text-left p-4 rounded-2xl bg-gradient-to-br from-indigo-500/15 via-blue-500/10 to-indigo-600/20 border-2 border-indigo-500/40 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/15 transition-all cursor-pointer group active:scale-[0.98]"
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                User Database
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-700 dark:text-indigo-300 font-display mt-2">
              {dbUsers.length || stats?.totalUsers || 0}
            </div>
            <div className="inline-flex items-center text-[10px] font-bold text-indigo-950 dark:text-indigo-200 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full mt-1.5">
              SQLite ACID backend store
            </div>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'billing'
              ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 font-black shadow-md border border-amber-300'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Offline POS Billing</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
            activeTab === 'billing' ? 'bg-[#0a1538] text-amber-300' : 'bg-amber-100 text-amber-800'
          }`}>Instant</span>
        </button>

        <button
          onClick={() => setActiveTab('tx')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'tx'
              ? 'bg-gradient-to-r from-[#0a1538] to-[#162760] text-amber-300 border border-[#2b449b] shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Transactions &amp; Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'items'
              ? 'bg-gradient-to-r from-[#0a1538] to-[#162760] text-amber-300 border border-[#2b449b] shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Catalog Items &amp; Prices ({items.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('database'); fetchDatabaseData(); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'database'
              ? 'bg-gradient-to-r from-[#0a1538] to-[#162760] text-amber-300 border border-[#2b449b] shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-amber-400" />
          <span>User Database ({dbUsers.length || stats?.totalUsers || 0})</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800">
            Backend SQLite
          </span>
        </button>
      </div>

      {/* TAB: OFFLINE POS BILLING */}
      {activeTab === 'billing' && (
        <OfflineBilling
          items={items}
          onOrderCreated={(newOrder) => {
            setOrders((prev) => [newOrder, ...prev]);
            fetchAdminData();
          }}
          onSelectReceipt={onSelectReceipt}
          isDark={isDark}
        />
      )}

      {/* TAB 1: TRANSACTIONS */}
      {activeTab === 'tx' && (
        <div className="space-y-4">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(['all', 'pending', 'paid', 'completed', 'cancelled'] as const).map((st) => {
              const isActive = txFilter === st;
              let activeStyle = 'bg-[#0a1538] text-amber-300 border-[#2b449b] shadow-sm';
              if (st === 'pending') activeStyle = 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm';
              if (st === 'paid') activeStyle = 'bg-blue-600 text-white border-blue-500 font-bold shadow-sm';
              if (st === 'completed') activeStyle = 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-sm';
              if (st === 'cancelled') activeStyle = 'bg-rose-600 text-white border-rose-500 font-bold shadow-sm';

              return (
                <button
                  key={st}
                  onClick={() => setTxFilter(st)}
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-all cursor-pointer border ${
                    isActive
                      ? activeStyle
                      : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500 rounded-2xl border border-stone-200">
              No transactions match this filter.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-stone-200 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#1d2547] dark:text-amber-400">
                          {ord.receiptNumber}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300">
                          {ord.kind === 'money_transfer' ? 'Money Transfer' : 'Order'}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          ord.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : ord.status === 'paid'
                            ? 'bg-blue-50 text-blue-700 border-blue-300'
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}>
                          {ord.status}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-stone-900 dark:text-white mt-1">
                        {ord.customerName} · <span className="font-mono text-xs text-stone-500">{ord.customerPhone}</span>
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5">
                        {new Date(ord.createdAt).toLocaleString()} · {ord.paymentMethod.toUpperCase()}
                      </div>
                    </div>

                    <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
                      <div className="text-xl font-extrabold text-[#1d2547] dark:text-white font-display">
                        ₹{ord.total}
                      </div>
                      <button
                        onClick={() => onSelectReceipt(ord)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 border border-amber-300 transition-all cursor-pointer mt-1"
                        title={`Open official print terminal for ${ord.receiptNumber}`}
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-950" />
                        <span>Print Receipt</span>
                      </button>
                    </div>
                  </div>

                  {/* Lines list */}
                  <div className="mt-3 pt-3 border-t border-stone-100 dark:border-slate-800 text-xs text-stone-600 dark:text-slate-300 space-y-1">
                    {ord.lines.map((l, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{l.name} × {l.qty}</span>
                        <span className="font-mono">₹{l.price * l.qty}</span>
                      </div>
                    ))}
                    {ord.transferAmount && (
                      <div className="text-amber-700 dark:text-amber-400 text-[11px]">
                        Transfer Amount: ₹{ord.transferAmount} (Fee: ₹{ord.serviceFee || 0})
                      </div>
                    )}
                    {ord.note && (
                      <div className="text-[11px] text-stone-500 italic mt-1">
                        Note: {ord.note}
                      </div>
                    )}
                  </div>

                  {/* Status Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-stone-400 mr-1">Update Status:</span>
                    <button
                      onClick={() => handleStatusChange(ord.id, 'pending')}
                      disabled={ord.status === 'pending'}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                        ord.status === 'pending'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 cursor-default shadow-xs'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 cursor-pointer'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => handleStatusChange(ord.id, 'paid')}
                      disabled={ord.status === 'paid'}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                        ord.status === 'paid'
                          ? 'bg-blue-600 text-white border-blue-500 cursor-default shadow-xs'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-300 cursor-pointer'
                      }`}
                    >
                      Mark Paid
                    </button>
                    <button
                      onClick={() => handleStatusChange(ord.id, 'completed')}
                      disabled={ord.status === 'completed'}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                        ord.status === 'completed'
                          ? 'bg-emerald-600 text-white border-emerald-500 cursor-default shadow-xs'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300 cursor-pointer'
                      }`}
                    >
                      Mark Completed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CATALOG MANAGEMENT */}
      {activeTab === 'items' && (
        <div className="space-y-6">
          {/* Add Item Form */}
          <form onSubmit={handleAddItem} className="p-5 rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              Add New Product / Service to Database
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold mb-1 text-slate-800">Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Colour Printout A3"
                  value={niName}
                  onChange={(e) => setNiName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a1538] focus:border-transparent font-medium shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1 text-slate-800">Category *</label>
                <select
                  value={niCat}
                  onChange={(e) => setNiCat(e.target.value as Category)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a1538] focus:border-transparent font-medium shadow-2xs"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1 text-slate-800">Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  value={niPrice}
                  onChange={(e) => setNiPrice(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a1538] focus:border-transparent font-medium shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1 text-slate-800">Unit Label</label>
                <input
                  type="text"
                  placeholder="per piece / per page"
                  value={niUnit}
                  onChange={(e) => setNiUnit(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a1538] focus:border-transparent font-medium shadow-2xs"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <input
                type="text"
                placeholder="Optional description / details..."
                value={niDesc}
                onChange={(e) => setNiDesc(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a1538] focus:border-transparent font-medium shadow-2xs"
              />
              <button
                type="submit"
                disabled={addingItem}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 border border-emerald-500"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>+ Add Item</span>
              </button>
            </div>
          </form>

          {/* Item Update Toast Notification */}
          {itemUpdateMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{itemUpdateMsg}</span>
            </div>
          )}

          {/* Items Table */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm space-y-4">
            {/* Search & Category Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search item name to edit..."
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0a1538] focus:border-transparent font-medium transition-all shadow-2xs"
                />
                {itemSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setItemSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(['All', ...CATEGORIES] as const).map((cat) => {
                  const isActive = itemCatFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setItemCatFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                        isActive
                          ? 'bg-[#0a1538] text-amber-300 border-[#0a1538] shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Helper Note */}
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Tip: Click any <strong>Item Name</strong>, <strong>Price</strong>, or <strong>Unit</strong> to edit. Press <strong>Enter</strong> or click away to save.</span>
              </span>
              <span className="font-semibold text-slate-700">
                Showing {filteredCatalogItems.length} of {items.length} items
              </span>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="pb-2.5 font-bold uppercase text-[11px] min-w-[240px]">
                      Item Name <span className="text-[10px] font-semibold text-blue-600 lowercase">(editable)</span>
                    </th>
                    <th className="pb-2.5 font-bold uppercase text-[11px] w-36">Category</th>
                    <th className="pb-2.5 font-bold uppercase text-[11px] w-32">Price (₹)</th>
                    <th className="pb-2.5 font-bold uppercase text-[11px] w-36">Unit Label</th>
                    <th className="pb-2.5 font-bold uppercase text-[11px] text-right w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCatalogItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Editable Item Name */}
                      <td className="py-2.5 pr-3">
                        <div className="relative flex items-center">
                          <input
                            key={`name-${item.id}-${item.name}`}
                            type="text"
                            defaultValue={item.name}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (val && val !== item.name) {
                                handleUpdateItem(item.id, { name: val });
                              } else if (!val) {
                                e.target.value = item.name; // reset to original if empty
                              }
                            }}
                            className="w-full pl-2.5 pr-8 py-1.5 text-xs font-bold rounded-xl border border-slate-200 hover:border-slate-400 focus:border-[#0a1538] focus:ring-2 focus:ring-[#0a1538]/20 bg-slate-50/70 hover:bg-white focus:bg-white text-slate-900 transition-all shadow-2xs"
                            placeholder="Enter item name..."
                            title="Click to edit item name (press Enter or click outside to save)"
                          />
                          <Edit3 className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </td>

                      {/* Category Dropdown */}
                      <td className="py-2.5 pr-2">
                        <select
                          value={item.category}
                          onChange={(e) => handleUpdateItem(item.id, { category: e.target.value as Category })}
                          className="px-2.5 py-1.5 border border-slate-200 hover:border-slate-400 focus:border-[#0a1538] focus:ring-2 focus:ring-[#0a1538]/20 rounded-xl text-xs bg-slate-50/70 hover:bg-white focus:bg-white text-slate-800 font-semibold cursor-pointer shadow-2xs transition-all w-full"
                          title="Change Category"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>

                      {/* Editable Price */}
                      <td className="py-2.5 pr-2">
                        <div className="relative flex items-center">
                          <span className="absolute left-2.5 text-slate-400 text-xs font-bold pointer-events-none">₹</span>
                          <input
                            key={`price-${item.id}-${item.price}`}
                            type="number"
                            min="0"
                            defaultValue={item.price}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            onBlur={(e) => {
                              const val = Number(e.target.value);
                              if (!isNaN(val) && val !== item.price) {
                                handleUpdateItem(item.id, { price: val });
                              }
                            }}
                            className="w-full pl-6 pr-2 py-1.5 border border-slate-200 hover:border-slate-400 focus:border-[#0a1538] focus:ring-2 focus:ring-[#0a1538]/20 rounded-xl text-xs bg-slate-50/70 hover:bg-white focus:bg-white text-slate-900 font-black shadow-2xs transition-all"
                            title="Click to edit price (press Enter or click outside to save)"
                          />
                        </div>
                      </td>

                      {/* Editable Unit Label */}
                      <td className="py-2.5 pr-2">
                        <input
                          key={`unit-${item.id}-${item.unit}`}
                          type="text"
                          defaultValue={item.unit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val && val !== item.unit) {
                              handleUpdateItem(item.id, { unit: val });
                            }
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 hover:border-slate-400 focus:border-[#0a1538] focus:ring-2 focus:ring-[#0a1538]/20 rounded-xl text-xs bg-slate-50/70 hover:bg-white focus:bg-white text-slate-900 font-medium shadow-2xs transition-all"
                          placeholder="e.g. per piece"
                          title="Click to edit unit (press Enter or click outside to save)"
                        />
                      </td>

                      {/* Delete Action */}
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 cursor-pointer transition-colors"
                          title="Delete item from catalog"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredCatalogItems.length === 0 && (
                <div className="p-8 text-center text-slate-500 space-y-1">
                  <p className="text-xs font-bold text-slate-700">No items found matching &quot;{itemSearchQuery}&quot;</p>
                  <p className="text-[11px] text-slate-400">Try searching a different item name or select &quot;All&quot; categories.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BACKEND USER DATABASE & CREDENTIAL STORAGE */}
      {activeTab === 'database' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Action Message Alert */}
          {dbActionMsg && (
            <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold border shadow-xs animate-in slide-in-from-top-2 ${
              dbActionMsg.isError 
                ? 'bg-rose-50 text-rose-800 border-rose-200' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              <div className="flex items-center gap-2">
                {dbActionMsg.isError ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>{dbActionMsg.text}</span>
              </div>
              <button 
                onClick={() => setDbActionMsg(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Reset Password Modal */}
          {resetPwdUserId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
              <div className="w-full max-w-sm rounded-3xl p-6 bg-white border border-slate-200 shadow-2xl text-slate-900 animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-950 font-black text-sm">
                    <KeyRound className="w-4 h-4 text-amber-500" />
                    <span>Reset User Password</span>
                  </div>
                  <button
                    onClick={() => { setResetPwdUserId(null); setNewPasswordVal(''); }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleResetPasswordSubmit} className="mt-4 space-y-4">
                  <p className="text-xs text-slate-600">
                    Set a new password for account: <strong className="text-slate-900">{dbUsers.find(u => u.id === resetPwdUserId)?.name || resetPwdUserId}</strong>
                  </p>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      New Password (min 8 characters)
                    </label>
                    <input
                      type="password"
                      value={newPasswordVal}
                      onChange={(e) => setNewPasswordVal(e.target.value)}
                      placeholder="Minimum 8 characters..."
                      required
                      minLength={8}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-xs font-mono"
                    />
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                      <span>Length: {newPasswordVal.length}/8</span>
                      {newPasswordVal.length >= 8 && (
                        <span className="text-emerald-600 font-bold">Requirement met ✓</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { setResetPwdUserId(null); setNewPasswordVal(''); }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={newPasswordVal.length < 8}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Clear Registered Users Confirmation Modal */}
          {showClearConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
              <div className="w-full max-w-md rounded-3xl p-6 bg-white border border-rose-200 shadow-2xl text-slate-900 animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-rose-600 font-black text-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <span>Clear Registered Users</span>
                  </div>
                  <button
                    onClick={() => setShowClearConfirmModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Are you sure you want to clear <strong>all registered customer accounts</strong> from the database?
                  </p>

                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-950">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Administrator Account Preserved</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Your master administrator account (<code className="font-mono font-bold">admin@jmenterprises.com</code>) will remain untouched and active.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-xs text-rose-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-950">
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Database Cleanup Summary:</span>
                    </div>
                    <ul className="text-[11px] text-rose-800 list-disc list-inside space-y-0.5">
                      <li>Clears registered users in SQLite (<code className="font-mono font-bold">users.db</code>)</li>
                      <li>Clears registered users in legacy <code className="font-mono font-bold">db.json</code></li>
                      <li>Clears customer login audit trail records</li>
                      <li>Synchronizes &amp; updates <code className="font-mono font-bold">jm.db</code> reference file</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
                  <button
                    type="button"
                    disabled={clearingUsers}
                    onClick={() => setShowClearConfirmModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={clearingUsers}
                    onClick={handleClearRegisteredUsers}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-black shadow-md cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {clearingUsers ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Clearing Database...</span>
                      </>
                    ) : (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        <span>Yes, Clear Registered Users</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* jm.db Reference Modal */}
          {showJmDbModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl bg-white border border-slate-200 shadow-2xl flex flex-col text-slate-900 overflow-hidden animate-in zoom-in-95">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#0a1538] text-amber-400 flex items-center justify-center shadow-md shrink-0">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold font-display text-slate-950">
                          jm.db Credentials Reference
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-800 border border-amber-400/40">
                          File: /jm.db
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        View all User IDs, Accounts &amp; Passwords stored in <code className="font-mono text-slate-800 font-bold">jm.db</code> for reference.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* View Switcher */}
                    <div className="p-1 rounded-xl bg-slate-200/80 border border-slate-300 flex items-center gap-1 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setJmDbViewMode('table')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          jmDbViewMode === 'table'
                            ? 'bg-white text-slate-950 shadow-xs font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Credentials Table
                      </button>
                      <button
                        type="button"
                        onClick={() => setJmDbViewMode('raw')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          jmDbViewMode === 'raw'
                            ? 'bg-white text-slate-950 shadow-xs font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Raw jm.db File
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowJmDbModal(false)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1">
                  {loadingJmDb ? (
                    <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                      <span className="text-xs font-bold">Reading jm.db file...</span>
                    </div>
                  ) : jmDbViewMode === 'table' ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs text-slate-600 bg-amber-50 border border-amber-200/80 p-3 rounded-2xl">
                        <div className="flex items-center gap-2 font-medium">
                          <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>All User IDs and passwords are authenticated and kept in sync with the backend database.</span>
                        </div>
                        <span className="font-bold text-slate-800 shrink-0">
                          {jmDbCredentials.length} Accounts
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 text-[11px] uppercase tracking-wider font-extrabold">
                              <th className="py-2.5 px-3">User ID</th>
                              <th className="py-2.5 px-3">Account Name</th>
                              <th className="py-2.5 px-3">Contact (Email/Phone)</th>
                              <th className="py-2.5 px-3">Role</th>
                              <th className="py-2.5 px-3">Password (Reference)</th>
                              <th className="py-2.5 px-3 text-right">Copy</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {jmDbCredentials.map((c) => (
                              <tr key={c.id} className="hover:bg-amber-50/40 transition-colors">
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-[11px]">
                                  {c.id}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-slate-950">
                                  {c.name}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                                  {c.email || c.phone}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    c.role === 'admin' 
                                      ? 'bg-amber-400/20 text-amber-800 border border-amber-400/40' 
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}>
                                    {c.role.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono font-black text-amber-900 bg-amber-400/10 px-2 rounded-md">
                                  {c.password}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPassword(c.id, c.password)}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-600 hover:text-slate-950 font-bold transition-all cursor-pointer inline-flex items-center gap-1 text-[11px]"
                                    title="Copy password"
                                  >
                                    {copiedPwdId === c.id ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-emerald-700 text-[10px]">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-500">
                          Workspace Path: /jm.db
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(jmDbContent);
                            setCopiedPwdId('raw-content');
                            setTimeout(() => setCopiedPwdId(null), 2000);
                          }}
                          className="px-3 py-1 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          {copiedPwdId === 'raw-content' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Content Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy All</span>
                            </>
                          )}
                        </button>
                      </div>

                      <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[55vh] border border-slate-800 shadow-inner select-all">
                        {jmDbContent || '-- jm.db is empty'}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                  <span className="text-[11px] text-slate-500 font-medium">
                    File location: <code className="font-mono font-bold text-slate-700">/jm.db</code> &amp; <code className="font-mono font-bold text-slate-700">/data/jm.db</code>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadJmDb}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download jm.db</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowJmDbModal(false)}
                      className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Database System Diagnostics Card */}
          <div className="p-6 rounded-3xl border bg-white border-slate-200 shadow-xs text-slate-900">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0a1538] to-[#1e3477] text-amber-400 flex items-center justify-center shadow-md">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold font-display text-slate-950">
                      Backend Database &amp; User Credential Store
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      SQLite 3 Online
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Persistent backend credential storage with PBKDF2-HMAC-SHA512 cryptographic hashing and salted credentials.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleOpenJmDbModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 text-xs font-black shadow-md border border-amber-300 transition-all cursor-pointer active:scale-95"
                  title="View jm.db file with all User IDs and Passwords"
                >
                  <FileCode className="w-3.5 h-3.5 text-slate-950" />
                  <span>View jm.db File</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-slate-950 text-amber-300">
                    Passwords
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleExportUsersJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
                  title="Export user accounts as backup JSON"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Export Backup</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowClearConfirmModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-bold border border-rose-200 transition-all cursor-pointer active:scale-95"
                  title="Clear all registered customer users from database"
                >
                  <UserX className="w-3.5 h-3.5 text-rose-600" />
                  <span>Clear Registered Users</span>
                </button>

                <button
                  type="button"
                  onClick={fetchDatabaseData}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0d1e4c] to-[#1c357f] hover:from-[#132b6b] hover:to-[#2546a3] text-amber-300 border border-[#2c4ca8] text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? 'animate-spin' : ''}`} />
                  <span>Refresh Database</span>
                </button>
              </div>
            </div>

            {/* Diagnostics Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Database Engine
                </span>
                <span className="text-xs font-black text-slate-900 mt-1 block">
                  {dbInfo?.engine || 'SQLite 3 (Node.js DatabaseSync)'}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                  ACID Compliant · Synchronous
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Storage Location
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 mt-1 block truncate" title={dbInfo?.filePath || 'data/users.db'}>
                  {dbInfo?.filePath || 'data/users.db'}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
                  Size: {dbInfo?.sizeBytes ? `${(dbInfo.sizeBytes / 1024).toFixed(1)} KB` : '40.0 KB'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Credential Security
                </span>
                <span className="text-xs font-black text-slate-900 mt-1 block">
                  PBKDF2-HMAC-SHA512
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold mt-0.5 block">
                  10,000 Rounds + 16-byte Salt
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Registered Accounts
                </span>
                <span className="text-sm font-black text-slate-900 mt-1 block">
                  {dbUsers.length} Users · {auditLogs.length} Audits
                </span>
                <span className="text-[10px] text-amber-600 font-semibold mt-0.5 block">
                  Active Database Store
                </span>
              </div>
            </div>
          </div>

          {/* Registered Users Table Card */}
          <div className="rounded-3xl border bg-white border-slate-200 shadow-xs overflow-hidden text-slate-900">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-600" />
                  <span>Stored User Accounts &amp; Access Controls ({filteredUsers.length})</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Manage accounts stored in backend SQLite table &quot;users&quot;. Passwords are encrypted with PBKDF2 SHA-512.
                </p>
              </div>

              {/* Search Bar & Action */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search name, phone, email, ID..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-xs text-slate-900 bg-white shadow-2xs"
                  />
                </div>

                {dbUsers.some((u) => u.role !== 'admin') && (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirmModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-xs font-bold transition-all cursor-pointer shrink-0 inline-flex items-center gap-1.5"
                    title="Clear registered users from database"
                  >
                    <UserX className="w-3.5 h-3.5 text-rose-600" />
                    <span className="hidden sm:inline">Clear Users</span>
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 text-[11px] uppercase tracking-wider font-extrabold">
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Encryption &amp; Security</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4">Last Login</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const isMasterAdmin = u.role === 'admin';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                              isMasterAdmin 
                                ? 'bg-amber-400/20 text-amber-800 border border-amber-400/40' 
                                : 'bg-blue-500/15 text-blue-700 border border-blue-400/30'
                            }`}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-950 flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isMasterAdmin && (
                                  <span title="Store Administrator">
                                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 block">
                                {u.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <div className="text-slate-900 font-medium">{u.email}</div>
                            <div className="text-[11px] font-mono text-slate-500">{u.phone}</div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {isMasterAdmin ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/15 text-amber-800 border border-amber-400/30 inline-flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-amber-600" />
                              Admin
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                              Customer
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Lock className="w-2.5 h-2.5" />
                              PBKDF2 SHA-512
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              16-byte Salt · 10k rounds
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : (
                            <span className="text-slate-400 italic">No record</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => { setResetPwdUserId(u.id); setNewPasswordVal(''); }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 hover:text-slate-950 font-bold text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Reset user password"
                            >
                              <KeyRound className="w-3 h-3 text-amber-500" />
                              <span>Reset Pwd</span>
                            </button>

                            {!isMasterAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                disabled={deletingUserId === u.id}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete user from database"
                              >
                                {deletingUserId === u.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  <p className="text-xs font-bold text-slate-700">No users found matching &quot;{userSearchQuery}&quot;</p>
                  <p className="text-[11px] text-slate-400 mt-1">Try searching by a different name, phone, or email.</p>
                </div>
              )}
            </div>
          </div>

          {/* Login Audit Trail Table Card */}
          <div className="rounded-3xl border bg-white border-slate-200 shadow-xs overflow-hidden text-slate-900">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Real-Time Backend Login Audit Trail</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Logged into SQLite table &quot;login_audit&quot; whenever users register or sign in.
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full font-bold">
                {auditLogs.length} Events Logged
              </span>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 text-[11px] uppercase tracking-wider font-extrabold sticky top-0">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Identifier / Username</th>
                    <th className="py-2.5 px-4">Result</th>
                    <th className="py-2.5 px-4">Client IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {log.identifier}
                      </td>
                      <td className="py-2.5 px-4">
                        {log.success ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Success (Authorized)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <X className="w-3 h-3 text-rose-600" />
                            Failed (Invalid Password)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400 text-xs">
                        No login events recorded yet. Perform a sign in or register to see audit logs.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
