import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Pen,
  FileText,
  Printer,
  Layers,
  Folder,
  Pencil,
  Ruler,
  Paperclip,
  Banknote,
  CheckCircle2,
  Lock,
  Plus,
  Minus,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Search
} from 'lucide-react';
import { Item, Category, User } from '../types';

export interface ProductGroupConfig {
  id: string;
  title: string;
  subtitle: string;
  category: Category;
  badgeLabel: string;
  iconType: 'notebook' | 'pen' | 'xerox' | 'printing' | 'paper' | 'pencil' | 'ruler' | 'office' | 'marker' | 'money';
  items: Item[];
}

interface GroupedProductCardProps {
  group: ProductGroupConfig;
  cart: Record<string, number>;
  user: User | null;
  onAddToCart: (itemId: string, qty?: number) => void;
  onRemoveFromCart: (itemId: string) => void;
  onRequireLogin: () => void;
  searchQuery?: string;
}

export const GroupedProductCard: React.FC<GroupedProductCardProps> = ({
  group,
  cart,
  user,
  onAddToCart,
  onRemoveFromCart,
  onRequireLogin,
  searchQuery = '',
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [isAllListOpen, setIsAllListOpen] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Sub-filters for Notebooks
  const [nbSizeFilter, setNbSizeFilter] = useState<'all' | 'standard' | 'long' | 'king' | 'register'>('all');
  const [nbRulingFilter, setNbRulingFilter] = useState<'all' | 'single' | '2line' | '4line' | 'square' | 'unruled'>('all');

  // Sub-filters for Pens
  const [penBrandFilter, setPenBrandFilter] = useState<string>('all');
  const [penColorFilter, setPenColorFilter] = useState<'all' | 'blue' | 'black' | 'red' | 'green'>('all');

  // Quick in-card search
  const [inCardSearch, setInCardSearch] = useState<string>('');

  // Filtered items inside this specific group based on sub-filters or search
  const filteredGroupItems = useMemo(() => {
    let list = group.items;

    // Filter for Notebooks
    if (group.iconType === 'notebook') {
      if (nbSizeFilter !== 'all') {
        list = list.filter((item) => {
          const t = `${item.name} ${item.description || ''}`.toLowerCase();
          if (nbSizeFilter === 'long') return t.includes('long');
          if (nbSizeFilter === 'king') return t.includes('king');
          if (nbSizeFilter === 'register') return t.includes('register') || t.includes('quire') || t.includes('3q') || t.includes('4q') || t.includes('5q');
          if (nbSizeFilter === 'standard') return !t.includes('long') && !t.includes('king') && !t.includes('register') && !t.includes('quire');
          return true;
        });
      }

      if (nbRulingFilter !== 'all') {
        list = list.filter((item) => {
          const t = `${item.name} ${item.description || ''}`.toLowerCase();
          if (nbRulingFilter === 'single') return t.includes('single line') || t.includes('single-line') || (!t.includes('2 line') && !t.includes('4 line') && !t.includes('square') && !t.includes('unruled'));
          if (nbRulingFilter === '2line') return t.includes('2 line') || t.includes('2-line') || t.includes('2 lines');
          if (nbRulingFilter === '4line') return t.includes('4 line') || t.includes('4-line') || t.includes('4 lines');
          if (nbRulingFilter === 'square') return t.includes('square') || t.includes('math');
          if (nbRulingFilter === 'unruled') return t.includes('unruled') || t.includes('plain');
          return true;
        });
      }
    }

    // Filter for Pens
    if (group.iconType === 'pen') {
      if (penBrandFilter !== 'all') {
        list = list.filter((item) => {
          const t = `${item.name} ${item.description || ''} ${item.id}`.toLowerCase();
          return t.includes(penBrandFilter.toLowerCase());
        });
      }

      if (penColorFilter !== 'all') {
        list = list.filter((item) => {
          const t = `${item.name} ${item.description || ''}`.toLowerCase();
          return t.includes(penColorFilter.toLowerCase());
        });
      }
    }

    // External search or in-card search
    const q = (inCardSearch || searchQuery).toLowerCase().trim();
    if (q) {
      const matched = list.filter((item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
      if (matched.length > 0) {
        return matched;
      }
    }

    return list.length > 0 ? list : group.items;
  }, [group.items, group.iconType, nbSizeFilter, nbRulingFilter, penBrandFilter, penColorFilter, inCardSearch, searchQuery]);

  // Keep an active selected item
  useEffect(() => {
    if (filteredGroupItems.length > 0) {
      if (!selectedItemId || !filteredGroupItems.some((i) => i.id === selectedItemId)) {
        setSelectedItemId(filteredGroupItems[0].id);
      }
    } else if (group.items.length > 0) {
      setSelectedItemId(group.items[0].id);
    }
  }, [filteredGroupItems, group.items, selectedItemId]);

  const selectedItem = useMemo(() => {
    return group.items.find((i) => i.id === selectedItemId) || filteredGroupItems[0] || group.items[0];
  }, [group.items, selectedItemId, filteredGroupItems]);

  const inCartCount = selectedItem ? (cart[selectedItem.id] || 0) : 0;
  const totalGroupInCart = useMemo(() => {
    return group.items.reduce((sum, item) => sum + (cart[item.id] || 0), 0);
  }, [group.items, cart]);

  const handleAdd = () => {
    if (!user) {
      onRequireLogin();
      return;
    }
    if (!selectedItem) return;
    onAddToCart(selectedItem.id, qty);
    setAddedToast(`Added ${qty} × ${selectedItem.name}`);
    setTimeout(() => setAddedToast(null), 2000);
    setQty(1);
  };

  const handleDirectAddOne = (item: Item) => {
    if (!user) {
      onRequireLogin();
      return;
    }
    onAddToCart(item.id, 1);
    setAddedToast(`Added 1 × ${item.name}`);
    setTimeout(() => setAddedToast(null), 2000);
  };

  const getCategoryTheme = () => {
    switch (group.category) {
      case 'Xerox':
        return {
          headerBg: 'bg-blue-50/70 border-blue-200',
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
          accentColor: 'text-blue-700',
          btnBg: 'bg-[#0a1538] hover:bg-[#152865] text-amber-300',
        };
      case 'Printing':
        return {
          headerBg: 'bg-emerald-50/70 border-emerald-200',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          accentColor: 'text-emerald-700',
          btnBg: 'bg-[#0a1538] hover:bg-[#152865] text-amber-300',
        };
      case 'Money Transfer':
        return {
          headerBg: 'bg-indigo-50/70 border-indigo-200',
          badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          accentColor: 'text-indigo-700',
          btnBg: 'bg-[#0a1538] hover:bg-[#152865] text-amber-300',
        };
      default:
        return {
          headerBg: 'bg-amber-50/60 border-amber-200',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
          accentColor: 'text-amber-800',
          btnBg: 'bg-[#0a1538] hover:bg-[#152865] text-amber-300',
        };
    }
  };

  const theme = getCategoryTheme();

  const renderIcon = () => {
    const iconClass = 'w-5 h-5 text-slate-800';
    switch (group.iconType) {
      case 'notebook':
        return <BookOpen className={iconClass} />;
      case 'pen':
        return <Pen className={iconClass} />;
      case 'xerox':
        return <FileText className={iconClass} />;
      case 'printing':
        return <Printer className={iconClass} />;
      case 'paper':
        return <Layers className={iconClass} />;
      case 'pencil':
        return <Pencil className={iconClass} />;
      case 'ruler':
        return <Ruler className={iconClass} />;
      case 'office':
        return <Paperclip className={iconClass} />;
      case 'marker':
        return <Sparkles className={iconClass} />;
      case 'money':
        return <Banknote className={iconClass} />;
      default:
        return <Folder className={iconClass} />;
    }
  };

  return (
    <div className="rounded-3xl bg-white border-2 border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
      {/* 1. CARD HEADER */}
      <div className={`p-4 sm:p-5 border-b ${theme.headerBg}`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${theme.badgeBg}`}>
              {group.category}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-slate-800">
              {group.badgeLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {totalGroupInCart > 0 && (
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                {totalGroupInCart} in cart
              </span>
            )}
            <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> In Stock
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center shrink-0">
            {renderIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug font-display">
              {group.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
              {group.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* 2. CARD BODY & SELECTION SECTION */}
      <div className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
        
        {/* Quick Success Toast */}
        {addedToast && (
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs animate-in fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{addedToast}</span>
          </div>
        )}

        {/* SPECIAL SUB-FILTERS FOR NOTEBOOKS (Size & Ruling) */}
        {group.iconType === 'notebook' && (
          <div className="space-y-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
            {/* Book Size Filter */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Filter Size:
              </span>
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'all', label: 'All Sizes' },
                  { id: 'standard', label: 'Standard' },
                  { id: 'long', label: 'Long' },
                  { id: 'king', label: 'King Size' },
                  { id: 'register', label: 'Account Register' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setNbSizeFilter(s.id as any)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      nbSizeFilter === s.id
                        ? 'bg-[#0a1538] text-amber-300 shadow-2xs'
                        : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ruling Filter */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Filter Ruling:
              </span>
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'all', label: 'All Rulings' },
                  { id: 'single', label: '1-Line' },
                  { id: '2line', label: '2-Line' },
                  { id: '4line', label: '4-Line' },
                  { id: 'square', label: 'Square (Maths)' },
                  { id: 'unruled', label: 'Plain (Unruled)' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setNbRulingFilter(r.id as any)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      nbRulingFilter === r.id
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SPECIAL SUB-FILTERS FOR PENS (Brand & Colour) */}
        {group.iconType === 'pen' && (
          <div className="space-y-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
            {/* Brand Filter */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Filter Brand:
              </span>
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto no-scrollbar">
                {[
                  'all',
                  'Cello',
                  'Reynolds',
                  'Hauser',
                  'Pentonic',
                  'Flair',
                  'Pilot',
                  'Rorito',
                  'Parker',
                  'Uniball',
                  'Luxor'
                ].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setPenBrandFilter(b)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      penBrandFilter === b
                        ? 'bg-[#0a1538] text-amber-300 shadow-2xs'
                        : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {b === 'all' ? 'All Brands' : b}
                  </button>
                ))}
              </div>
            </div>

            {/* Ink Color Filter */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                Ink:
              </span>
              {[
                { id: 'all', label: 'All', dot: 'bg-slate-400' },
                { id: 'blue', label: 'Blue', dot: 'bg-blue-600' },
                { id: 'black', label: 'Black', dot: 'bg-slate-900' },
                { id: 'red', label: 'Red', dot: 'bg-rose-600' },
                { id: 'green', label: 'Green', dot: 'bg-emerald-600' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setPenColorFilter(c.id as any)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    penColorFilter === c.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FOR SMALL GROUPS (2-4 items): FAST-SELECT BUTTON PILLS */}
        {group.items.length <= 4 && group.iconType !== 'notebook' && group.iconType !== 'pen' && (
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Select Option:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {group.items.map((item) => {
                const isSelected = item.id === selectedItemId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0a1538] text-white border-[#1d2d66] shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className={`font-bold text-xs truncate ${isSelected ? 'text-amber-300' : 'text-slate-900'}`}>
                      {item.name}
                    </div>
                    <div className={`text-[11px] font-mono mt-0.5 ${isSelected ? 'text-white' : 'text-amber-700 font-bold'}`}>
                      ₹{item.price} <span className="text-[10px] font-normal opacity-80">{item.unit || ''}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MAIN DROPDOWN SELECTOR: SELECT ANY ITEM IN THIS GROUP */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
              Choose Product / Variant ({filteredGroupItems.length} options):
            </label>
            {filteredGroupItems.length > 8 && (
              <span className="text-[10px] text-slate-400">
                scroll to view all
              </span>
            )}
          </div>

          <div className="relative">
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2.5 text-xs sm:text-sm font-bold rounded-xl border-2 border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {filteredGroupItems.map((item) => {
                const count = cart[item.id] || 0;
                return (
                  <option key={item.id} value={item.id}>
                    {item.name} — ₹{item.price} {item.unit ? `(${item.unit})` : ''} {count > 0 ? `[✓ ${count} in cart]` : ''}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 3. SELECTED ITEM SPOTLIGHT & DETAILS */}
        {selectedItem && (
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-300/80 shadow-2xs space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                  Selected Item
                </span>
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 mt-1 line-clamp-2">
                  {selectedItem.name}
                </h4>
                {selectedItem.description && (
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                    {selectedItem.description}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <div className="text-xl sm:text-2xl font-black text-[#0a1538] font-display">
                  ₹{selectedItem.price}
                </div>
                <div className="text-[10px] text-slate-500">
                  {selectedItem.unit || 'per item'}
                </div>
              </div>
            </div>

            {/* In Cart Indicator */}
            {inCartCount > 0 && (
              <div className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md flex items-center justify-between">
                <span>Currently in your cart:</span>
                <span className="font-mono font-extrabold">{inCartCount} added (₹{selectedItem.price * inCartCount})</span>
              </div>
            )}
          </div>
        )}

        {/* 4. QUANTITY STEPPER & ADD BUTTON ROW */}
        {selectedItem && (
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Quantity Stepper: [-] [qty] [+] */}
            <div className="flex items-center justify-between sm:justify-start gap-2.5">
              <span className="text-xs font-bold text-slate-700">Quantity:</span>
              <div className="flex items-center bg-white border border-slate-300 rounded-xl p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                  disabled={qty <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors active:scale-95"
                  title="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-9 text-center font-bold font-mono text-sm text-slate-900 select-none">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((prev) => prev + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors active:scale-95"
                  title="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Add to Order Button */}
            <button
              type="button"
              onClick={handleAdd}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer border border-[#2b449b] ${theme.btnBg}`}
            >
              {!user ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Plus className="w-4 h-4 text-amber-300" />}
              <span>
                Add to Order {selectedItem ? `(₹${selectedItem.price * qty})` : ''}
              </span>
            </button>
          </div>
        )}

        {/* 5. ACCORDION / DRAWER: VIEW ALL ITEMS IN THIS CATEGORY */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsAllListOpen(!isAllListOpen)}
            className="w-full py-1.5 px-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>
              {isAllListOpen ? 'Hide full list of variants' : `View all ${group.items.length} variants in this card`}
            </span>
            {isAllListOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          {isAllListOpen && (
            <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100 bg-white">
              {group.items.map((item) => {
                const count = cart[item.id] || 0;
                const isCurrent = item.id === selectedItemId;
                return (
                  <div
                    key={item.id}
                    className={`p-2.5 flex items-center justify-between gap-2.5 hover:bg-slate-50 transition-colors ${
                      isCurrent ? 'bg-amber-50/60' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedItemId(item.id)}
                      className="text-left flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {item.description || item.unit}
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          ₹{item.price}
                        </span>
                        {count > 0 && (
                          <span className="block text-[9px] font-extrabold text-emerald-700">
                            {count} in cart
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDirectAddOne(item)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-amber-400 hover:text-slate-950 text-slate-800 text-[11px] font-bold transition-all border border-slate-200 cursor-pointer active:scale-95 flex items-center gap-1"
                        title={`Add 1 × ${item.name}`}
                      >
                        <Plus className="w-3 h-3 text-amber-600" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
