import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  RotateCcw, 
  CreditCard, 
  Coins, 
  Smartphone, 
  User as UserIcon, 
  Phone, 
  Mail, 
  FileText, 
  Tag, 
  Zap, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Send,
  ChevronDown
} from 'lucide-react';
import { Item, Order, OrderStatus, Category, PaymentMethod } from '../types';
import { api } from '../services/api';
import { NotebookDropdownSelector } from './NotebookDropdownSelector';
import { PenDropdownSelector } from './PenDropdownSelector';

interface BillLineItem {
  id: string; // unique key in current bill
  itemId: string;
  name: string;
  category: Category;
  price: number;
  qty: number;
  unit: string;
}

interface OfflineBillingProps {
  items: Item[];
  onOrderCreated: (order: Order) => void;
  onSelectReceipt: (order: Order) => void;
  isDark?: boolean;
}

export const OfflineBilling: React.FC<OfflineBillingProps> = ({
  items,
  onOrderCreated,
  onSelectReceipt,
  isDark = false,
}) => {
  // Billing Mode: Standard items bill vs Domestic Money Transfer
  const [billType, setBillType] = useState<'order' | 'money_transfer'>('order');

  // Customer Details
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('8747991688');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderNote, setOrderNote] = useState('');

  // Payment Details
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [upiRef, setUpiRef] = useState('');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('completed');

  // Items in current bill
  const [billLines, setBillLines] = useState<BillLineItem[]>([]);

  // Money transfer fields
  const [transferAmount, setTransferAmount] = useState<number>(1000);
  const [serviceFee, setServiceFee] = useState<number>(20);
  const [beneficiaryDetails, setBeneficiaryDetails] = useState('');

  // Autocomplete Search input state
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Creation & feedback states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter items based on user typed query and selected category
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchCat) return false;
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    });
  }, [items, searchQuery, selectedCategory]);

  // Handle adding an item to the bill
  const handleAddItemToBill = (item: Item, count: number = 1) => {
    const addCount = count > 0 ? count : 1;
    setBillLines((prev) => {
      const existingIndex = prev.findIndex((line) => line.itemId === item.id);
      if (existingIndex > -1) {
        // Increment quantity if already exists
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty + addCount,
        };
        return updated;
      } else {
        // Add new line item
        return [
          ...prev,
          {
            id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            itemId: item.id,
            name: item.name,
            category: item.category,
            price: item.price,
            qty: addCount,
            unit: item.unit || 'per piece',
          },
        ];
      }
    });

    // Reset search query and keep input ready for rapid counter billing
    setSearchQuery('');
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
    searchInputRef.current?.focus();
  };

  // Add custom line item if item not found in catalog
  const handleAddCustomItem = () => {
    if (!searchQuery.trim()) return;
    const customItem: BillLineItem = {
      id: `custom-${Date.now()}`,
      itemId: `custom-${Date.now()}`,
      name: searchQuery.trim(),
      category: 'Printing',
      price: 10,
      qty: 1,
      unit: 'per piece',
    };
    setBillLines((prev) => [...prev, customItem]);
    setSearchQuery('');
    setIsDropdownOpen(false);
    searchInputRef.current?.focus();
  };

  // Update quantity of line item
  const handleUpdateQty = (lineId: string, delta: number) => {
    setBillLines((prev) =>
      prev
        .map((line) => {
          if (line.id === lineId) {
            const newQty = line.qty + delta;
            return newQty > 0 ? { ...line, qty: newQty } : null;
          }
          return line;
        })
        .filter(Boolean) as BillLineItem[]
    );
  };

  // Set explicit quantity
  const handleSetExactQty = (lineId: string, qty: number) => {
    if (isNaN(qty) || qty < 1) return;
    setBillLines((prev) =>
      prev.map((line) => (line.id === lineId ? { ...line, qty } : line))
    );
  };

  // Update line price (for special counter discounts/adjustments)
  const handleUpdatePrice = (lineId: string, price: number) => {
    if (isNaN(price) || price < 0) return;
    setBillLines((prev) =>
      prev.map((line) => (line.id === lineId ? { ...line, price } : line))
    );
  };

  // Remove line item
  const handleRemoveLine = (lineId: string) => {
    setBillLines((prev) => prev.filter((line) => line.id !== lineId));
  };

  // Clear current bill
  const handleResetBill = () => {
    setBillLines([]);
    setCustomerName('Walk-in Customer');
    setCustomerPhone('8747991688');
    setCustomerEmail('');
    setOrderNote('');
    setPaymentMethod('cash');
    setUpiRef('');
    setCashReceived('');
    setTransferAmount(1000);
    setServiceFee(20);
    setBeneficiaryDetails('');
    setErrorMessage('');
    setSuccessOrder(null);
  };

  // Calculations
  const itemsSubtotal = useMemo(() => {
    return billLines.reduce((acc, line) => acc + line.price * line.qty, 0);
  }, [billLines]);

  const totalPayable = useMemo(() => {
    if (billType === 'money_transfer') {
      return Number(transferAmount || 0) + Number(serviceFee || 0);
    }
    return itemsSubtotal;
  }, [billType, itemsSubtotal, transferAmount, serviceFee]);

  const totalQuantity = useMemo(() => {
    return billLines.reduce((acc, line) => acc + line.qty, 0);
  }, [billLines]);

  // Cash change calculation
  const cashChange = useMemo(() => {
    const received = parseFloat(cashReceived);
    if (isNaN(received) || received < totalPayable) return null;
    return received - totalPayable;
  }, [cashReceived, totalPayable]);

  // Keyboard navigation for dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsDropdownOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredItems.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredItems.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredItems.length) {
        handleAddItemToBill(filteredItems[highlightedIndex]);
      } else if (filteredItems.length === 1) {
        handleAddItemToBill(filteredItems[0]);
      } else if (searchQuery.trim()) {
        handleAddCustomItem();
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  // Submit and create order
  const handleGenerateBill = async () => {
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Please provide customer name (or use "Walk-in Customer").');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please provide a valid 10-digit mobile number.');
      return;
    }

    if (billType === 'order' && billLines.length === 0) {
      setErrorMessage('Cannot generate an empty bill. Please add at least 1 item.');
      return;
    }

    if (billType === 'money_transfer' && (!transferAmount || transferAmount <= 0)) {
      setErrorMessage('Please enter a valid transfer amount.');
      return;
    }

    setSubmitting(true);
    try {
      let linesPayload = billLines.map((l) => ({
        itemId: l.itemId,
        name: l.name,
        price: l.price,
        qty: l.qty,
        category: l.category,
      }));

      if (billType === 'money_transfer') {
        linesPayload = [
          {
            itemId: 'm-transfer',
            name: 'Domestic Money Transfer (DMT / IMPS)',
            price: Number(serviceFee || 20),
            qty: 1,
            category: 'Money Transfer',
          },
        ];
      }

      const combinedNote = billType === 'money_transfer'
        ? `${beneficiaryDetails ? `Beneficiary / A/C: ${beneficiaryDetails}. ` : ''}${orderNote}`.trim()
        : orderNote.trim();

      const newOrder = await api.createOrder({
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: customerEmail.trim() || undefined,
        note: combinedNote || undefined,
        lines: linesPayload,
        kind: billType,
        transferAmount: billType === 'money_transfer' ? Number(transferAmount) : undefined,
        serviceFee: billType === 'money_transfer' ? Number(serviceFee) : undefined,
        subtotal: billType === 'money_transfer' ? Number(serviceFee) : itemsSubtotal,
        total: totalPayable,
        paymentMethod,
        upiRef: paymentMethod === 'upi' ? upiRef.trim() || undefined : undefined,
        status: orderStatus,
      });

      setSuccessOrder(newOrder);
      onOrderCreated(newOrder);

      // Automatically redirect to receipt view so admin can immediately print receipt
      onSelectReceipt(newOrder);
    } catch (err: any) {
      console.error('Failed to generate offline bill:', err);
      setErrorMessage(err?.message || 'Failed to create offline order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Popular items for instant 1-click counter addition
  const popularItems = useMemo(() => {
    return items.slice(0, 5);
  }, [items]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Mode Toggle */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#0a1538] via-[#102257] to-[#0a1538] border border-[#1d3370] text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold shadow-inner">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg text-white font-display">
                Counter Offline Billing &amp; POS
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-400 text-slate-950">
                Instant Billing
              </span>
            </div>
            <p className="text-xs text-blue-200/80 mt-0.5">
              Quick walk-in billing terminal: search catalog items with autocomplete dropdown, print receipts, and log transactions.
            </p>
          </div>
        </div>

        {/* Bill Type Selector: Store items vs DMT */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#060d24] border border-[#1b2f66] self-start md:self-auto">
          <button
            type="button"
            onClick={() => setBillType('order')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              billType === 'order'
                ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Store / Xerox Bill</span>
          </button>
          <button
            type="button"
            onClick={() => setBillType('money_transfer')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              billType === 'money_transfer'
                ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Money Transfer (DMT)</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Item Search, Autocomplete Dropdown & Current Bill Items */}
        <div className="lg:col-span-7 space-y-5">
          {billType === 'order' ? (
            <>
              {/* Item Autocomplete Search Box */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 relative">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-amber-600" />
                    <span>Search Catalog Items (Type to view related items):</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {filteredItems.length} items available
                  </span>
                </div>

                {/* Input Container */}
                <div className="relative">
                  <div className="relative flex items-center">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsDropdownOpen(true);
                        setHighlightedIndex(0);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type item name (e.g. Printout, Xerox, Pen, Binding, Spiral, Lamination)..."
                      className="w-full pl-10 pr-10 py-3 text-sm rounded-2xl border-2 border-slate-200 bg-slate-50/70 text-slate-900 font-medium focus:outline-none focus:border-amber-500 focus:bg-white transition-all shadow-inner"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          searchInputRef.current?.focus();
                        }}
                        className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Dropdown List */}
                  {isDropdownOpen && (
                    <div
                      ref={dropdownRef}
                      className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-amber-400/60 shadow-2xl overflow-hidden max-h-80 flex flex-col animate-in fade-in-50 zoom-in-95 duration-150"
                    >
                      {/* Filter category pills within dropdown */}
                      <div className="p-2 border-b border-slate-100 bg-slate-50/90 flex items-center gap-1 overflow-x-auto text-[11px]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Filter:</span>
                        {['all', 'Printing', 'Xerox', 'Stationery', 'Money Transfer'].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat);
                              searchInputRef.current?.focus();
                            }}
                            className={`px-2 py-0.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                              selectedCategory === cat
                                ? 'bg-[#0a1538] text-amber-300 shadow-xs'
                                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            {cat === 'all' ? 'All Items' : cat}
                          </button>
                        ))}
                      </div>

                      {/* Dropdown Items List */}
                      <div className="overflow-y-auto divide-y divide-slate-100">
                        {filteredItems.length > 0 ? (
                          filteredItems.map((item, index) => {
                            const isSelected = index === highlightedIndex;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleAddItemToBill(item)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                  isSelected ? 'bg-amber-50/90 border-l-4 border-amber-500' : 'hover:bg-slate-50'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                      {item.name}
                                    </span>
                                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                      {item.category}
                                    </span>
                                  </div>
                                  {item.description && (
                                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                      {item.description}
                                    </p>
                                  )}
                                </div>

                                <div className="text-right shrink-0">
                                  <div className="text-sm font-black text-slate-900 font-mono">
                                    ₹{item.price}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {item.unit || 'per piece'}
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-5 text-center text-slate-500 text-xs">
                            <p className="font-semibold text-slate-700">No matching items in catalog.</p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              You can add this as a custom bill line item below:
                            </p>
                            {searchQuery.trim() && (
                              <button
                                type="button"
                                onClick={handleAddCustomItem}
                                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add &quot;{searchQuery}&quot; as Custom Item (₹10)</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Custom item quick add option at bottom if query exists */}
                      {searchQuery.trim() && filteredItems.length > 0 && (
                        <div className="p-2 border-t border-slate-100 bg-amber-50/50 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-600">Don&apos;t see exact item?</span>
                          <button
                            type="button"
                            onClick={handleAddCustomItem}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-bold cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add &quot;{searchQuery}&quot; as custom item</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Popular Counter Items Strip */}
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Quick-Add Popular Items:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {popularItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddItemToBill(item)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 border border-slate-200 text-xs font-semibold text-slate-800 transition-all cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3 h-3 text-amber-600" />
                        <span>{item.name}</span>
                        <strong className="text-amber-700 font-mono text-[11px]">₹{item.price}</strong>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notebooks & Brand Pens Dropdown Selectors for Counter */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <NotebookDropdownSelector
                    items={items}
                    onAddItem={(item, count) => handleAddItemToBill(item, count || 1)}
                    buttonLabel="Notebooks & Registers Dropdown (100p-5Q)"
                  />
                  <PenDropdownSelector
                    items={items}
                    onAddItem={(item, count) => handleAddItemToBill(item, count || 1)}
                    buttonLabel="Brand Pens & Inks Dropdown (Cello, Reynolds, Hauser...)"
                  />
                </div>
              </div>

              {/* Bill Items Table */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-600" />
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Bill Line Items ({billLines.length})
                    </h4>
                  </div>
                  {billLines.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBillLines([])}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear Items</span>
                    </button>
                  )}
                </div>

                {billLines.length === 0 ? (
                  <div className="py-10 text-center text-slate-400">
                    <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-slate-600">No items added to bill yet.</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Type in the search field above or click any popular item to add it to the bill.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 uppercase text-[10px] tracking-wider">
                          <th className="py-2 font-bold w-10 text-center">Sl.No</th>
                          <th className="py-2 font-bold">Item Description</th>
                          <th className="py-2 font-bold w-24">Rate (₹)</th>
                          <th className="py-2 font-bold w-32 text-center">Qty</th>
                          <th className="py-2 font-bold w-24 text-right">Subtotal</th>
                          <th className="py-2 font-bold w-10 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {billLines.map((line, index) => (
                          <tr key={line.id} className="group hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 text-center text-slate-500 font-mono font-bold text-xs">
                              {index + 1}
                            </td>
                            <td className="py-2.5 pr-2">
                              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                {line.name}
                              </div>
                              <span className="text-[10px] uppercase font-bold text-slate-500">
                                {line.category} · {line.unit}
                              </span>
                            </td>

                            {/* Editable Rate */}
                            <td className="py-2.5 pr-2">
                              <div className="flex items-center">
                                <span className="text-slate-400 font-mono mr-1">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={line.price}
                                  onChange={(e) => handleUpdatePrice(line.id, parseFloat(e.target.value))}
                                  className="w-16 px-1.5 py-1 text-xs rounded-lg border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </td>

                            {/* Quantity Controls */}
                            <td className="py-2.5 px-2 text-center">
                              <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(line.id, -1)}
                                  className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-xs"
                                  title="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={line.qty}
                                  onChange={(e) => handleSetExactQty(line.id, parseInt(e.target.value, 10))}
                                  className="w-10 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(line.id, 1)}
                                  className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-xs"
                                  title="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            {/* Line Total */}
                            <td className="py-2.5 pl-2 text-right font-black font-mono text-slate-900 text-xs sm:text-sm">
                              ₹{(line.price * line.qty).toFixed(0)}
                            </td>

                            {/* Delete line */}
                            <td className="py-2.5 pl-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(line.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* MONEY TRANSFER REMITTANCE FORM */
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Send className="w-5 h-5 text-amber-600" />
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Domestic Money Transfer (DMT / IMPS)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Record walk-in remittance transfer and generate customer proof receipt.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transfer Amount (₹)*
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="e.g. 2000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Merchant Service Fee (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={serviceFee}
                      onChange={(e) => setServiceFee(Number(e.target.value))}
                      className="w-full pl-8 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="e.g. 20"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Beneficiary Account / Bank Details
                </label>
                <input
                  type="text"
                  value={beneficiaryDetails}
                  onChange={(e) => setBeneficiaryDetails(e.target.value)}
                  placeholder="e.g. SBI A/C 30981293812, IFSC SBIN0001234, Beneficiary: Ramesh"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* DMT Quick Amount Chips */}
              <div className="pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Quick Amount Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[500, 1000, 2000, 3000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTransferAmount(amt)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        transferAmount === amt
                          ? 'bg-[#0a1538] text-amber-300 border-[#0a1538] shadow-xs'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Customer Details, Payment, Summary & Generate Bill */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-amber-600" />
              <span>Customer Information</span>
            </h4>

            {/* Customer Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Customer Name*</label>
                <button
                  type="button"
                  onClick={() => setCustomerName('Walk-in Customer')}
                  className="text-[10px] text-amber-700 font-bold hover:underline"
                >
                  Set as Walk-in
                </button>
              </div>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name"
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            {/* Customer Phone */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Mobile Phone*</label>
                <button
                  type="button"
                  onClick={() => setCustomerPhone('8747991688')}
                  className="text-[10px] text-amber-700 font-bold hover:underline"
                >
                  Counter Mobile (8747991688)
                </button>
              </div>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="tel"
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile number"
                  className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            {/* Customer Email (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address <span className="text-[11px] text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Leave empty if not required on receipt"
                  className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Note: If left blank, customer email will not appear on the printed receipt.
              </p>
            </div>

            {/* Order Note / Instructions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Note / Print Specifications <span className="text-[11px] text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="e.g. Spiral bind front cover, 2 sets A4"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Payment & Settlement Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-600" />
              <span>Payment &amp; Settlement</span>
            </h4>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Cash Payment</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'upi'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>UPI</span>
              </button>
            </div>

            {/* Cash Calculator if Cash is selected */}
            {paymentMethod === 'cash' && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Cash Received from Customer:</span>
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1.5 font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder={String(totalPayable)}
                      className="w-full pl-6 pr-2 py-1 text-xs rounded-lg border border-slate-300 font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-amber-500 text-right"
                    />
                  </div>
                </div>

                {cashChange !== null && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs font-bold">
                    <span className="text-slate-600">Change to Return:</span>
                    <span className="text-emerald-700 font-mono text-sm">
                      ₹{cashChange.toFixed(0)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* UPI Reference if UPI is selected */}
            {paymentMethod === 'upi' && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  UPI Ref / UTR No. <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={upiRef}
                  onChange={(e) => setUpiRef(e.target.value)}
                  placeholder="e.g. UPI-9847120938"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Fulfillment Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fulfillment Status
              </label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="completed">Completed &amp; Handed Over</option>
                <option value="paid">Paid (Processing Job)</option>
                <option value="pending">Pending Payment / Pickup</option>
              </select>
            </div>

            {/* Bill Summary Calculations */}
            <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Count:</span>
                <span className="font-mono font-bold text-slate-800">
                  {billType === 'order' ? `${billLines.length} (${totalQuantity} pcs)` : '1 Remittance'}
                </span>
              </div>

              {billType === 'money_transfer' ? (
                <>
                  <div className="flex justify-between">
                    <span>Remittance Principal:</span>
                    <span className="font-mono text-slate-800">₹{transferAmount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Merchant Service Fee:</span>
                    <span className="font-mono text-slate-800">₹{serviceFee || 0}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-800">₹{itemsSubtotal}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total Net Payable:</span>
                <span className="text-2xl font-black text-[#0a1538] font-display">
                  ₹{totalPayable}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleGenerateBill}
                disabled={submitting || (billType === 'order' && billLines.length === 0)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 active:scale-95 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/25 border border-amber-300 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                {submitting ? (
                  <span>Generating Bill &amp; Receipt...</span>
                ) : (
                  <>
                    <Printer className="w-4 h-4 text-slate-950" />
                    <span>Generate Bill &amp; Print Receipt</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResetBill}
                className="w-full py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Reset &amp; Start Fresh Bill
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
