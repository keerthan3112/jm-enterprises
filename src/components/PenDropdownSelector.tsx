import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Pen,
  ChevronDown,
  Plus,
  Minus,
  Check,
  X,
  Search,
  Filter,
  Palette,
  Sparkles,
  Layers,
  ShoppingBag
} from 'lucide-react';
import { Item } from '../types';

export type PenBrand =
  | 'all'
  | 'Cello'
  | 'Reynolds'
  | 'Hauser'
  | 'Pentonic'
  | 'Flair'
  | 'Pilot'
  | 'Rorito'
  | 'Uniball'
  | 'Parker'
  | 'Montex'
  | 'Luxor';

export type PenType =
  | 'all'
  | 'ballpoint'
  | 'gel'
  | 'rollerball'
  | 'fountain'
  | 'fineliner';

export type PenColor = 'all' | 'blue' | 'black' | 'red' | 'green' | 'assorted';

interface PenDropdownSelectorProps {
  items: Item[];
  onAddItem: (item: Item, qty?: number) => void;
  cart?: Record<string, number>;
  compact?: boolean;
  buttonLabel?: string;
}

export const PenDropdownSelector: React.FC<PenDropdownSelectorProps> = ({
  items,
  onAddItem,
  cart = {},
  compact = false,
  buttonLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<PenBrand>('all');
  const [selectedType, setSelectedType] = useState<PenType>('all');
  const [selectedColor, setSelectedColor] = useState<PenColor>('all');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter items that are pens or pen refills
  const penItems = useMemo(() => {
    return items.filter((item) => {
      const n = item.name.toLowerCase();
      const c = item.category.toLowerCase();
      const d = (item.description || '').toLowerCase();
      const id = item.id.toLowerCase();

      const isPen =
        id.startsWith('pen-') ||
        id.startsWith('s-pen') ||
        id === 's-gel-pen' ||
        n.includes('pen') ||
        n.includes('ballpoint') ||
        n.includes('rollerball') ||
        n.includes('fineliner') ||
        n.includes('trimax') ||
        n.includes('butterflow') ||
        n.includes('pentonic') ||
        n.includes('pilot v') ||
        n.includes('writometer') ||
        d.includes('ballpoint') ||
        d.includes('gel pen') ||
        d.includes('rollerball');

      // Exclude notebooks or pencil or highlighters unless pen is specifically intended
      const isNotHighlighterOrBook =
        !n.includes('notebook') &&
        !n.includes('register') &&
        !n.includes('pencil') &&
        !n.includes('highlighter') &&
        !n.includes('sharpener');

      return c === 'stationery' && isPen && isNotHighlighterOrBook;
    });
  }, [items]);

  // Extract pen details (Brand, Type, Color)
  const getPenDetails = (item: Item): { brand: PenBrand; type: PenType; color: PenColor } => {
    const text = `${item.name} ${item.description || ''} ${item.id}`.toLowerCase();

    // Brand detection
    let brand: PenBrand = 'all';
    if (text.includes('cello')) brand = 'Cello';
    else if (text.includes('reynolds')) brand = 'Reynolds';
    else if (text.includes('hauser')) brand = 'Hauser';
    else if (text.includes('pentonic') || text.includes('linc')) brand = 'Pentonic';
    else if (text.includes('flair')) brand = 'Flair';
    else if (text.includes('pilot')) brand = 'Pilot';
    else if (text.includes('rorito')) brand = 'Rorito';
    else if (text.includes('uniball') || text.includes('uni-ball') || text.includes('jetstream')) brand = 'Uniball';
    else if (text.includes('parker')) brand = 'Parker';
    else if (text.includes('montex')) brand = 'Montex';
    else if (text.includes('luxor')) brand = 'Luxor';

    // Type detection
    let type: PenType = 'ballpoint';
    if (text.includes('fountain') || text.includes('iridium')) {
      type = 'fountain';
    } else if (text.includes('fineliner') || text.includes('micro-tip') || text.includes('graphic')) {
      type = 'fineliner';
    } else if (text.includes('roller') || text.includes('hi-tec') || text.includes('liquid ink') || text.includes('fluid')) {
      type = 'rollerball';
    } else if (text.includes('gel')) {
      type = 'gel';
    } else {
      type = 'ballpoint';
    }

    // Color detection
    let color: PenColor = 'blue';
    if (text.includes('multicolor') || text.includes('assorted') || text.includes('pack of 10') || text.includes('set of 10')) {
      color = 'assorted';
    } else if (text.includes('black')) {
      color = 'black';
    } else if (text.includes('red')) {
      color = 'red';
    } else if (text.includes('green')) {
      color = 'green';
    } else if (text.includes('blue')) {
      color = 'blue';
    }

    return { brand, type, color };
  };

  // Filter items by current user selections
  const filteredPens = useMemo(() => {
    return penItems.filter((item) => {
      const { brand, type, color } = getPenDetails(item);

      const matchesBrand = selectedBrand === 'all' || brand === selectedBrand;
      const matchesType = selectedType === 'all' || type === selectedType;
      const matchesColor = selectedColor === 'all' || color === selectedColor;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));

      return matchesBrand && matchesType && matchesColor && matchesSearch;
    });
  }, [penItems, selectedBrand, selectedType, selectedColor, searchQuery]);

  // Keep first item selected in dropdown preview
  useEffect(() => {
    if (filteredPens.length > 0) {
      if (!selectedItemId || !filteredPens.some((i) => i.id === selectedItemId)) {
        setSelectedItemId(filteredPens[0].id);
      }
    } else {
      setSelectedItemId('');
    }
  }, [filteredPens, selectedItemId]);

  const activeSelectedItem = useMemo(() => {
    return penItems.find((i) => i.id === selectedItemId) || filteredPens[0] || null;
  }, [penItems, selectedItemId, filteredPens]);

  const handleAddCurrent = () => {
    if (!activeSelectedItem) return;
    onAddItem(activeSelectedItem, qty);
    setShowSuccessToast(`Added ${qty} × ${activeSelectedItem.name}`);
    setTimeout(() => setShowSuccessToast(null), 2500);
    setQty(1);
  };

  const handleDirectAdd = (item: Item) => {
    onAddItem(item, 1);
    setShowSuccessToast(`Added 1 × ${item.name}`);
    setTimeout(() => setShowSuccessToast(null), 2500);
  };

  // Color Swatch Pill helper
  const getColorBadge = (color: PenColor) => {
    switch (color) {
      case 'blue':
        return {
          dotBg: 'bg-blue-600',
          textColor: 'text-blue-700',
          badgeBg: 'bg-blue-50 border-blue-200',
          label: 'Blue Ink',
        };
      case 'black':
        return {
          dotBg: 'bg-slate-900',
          textColor: 'text-slate-900',
          badgeBg: 'bg-slate-100 border-slate-300',
          label: 'Black Ink',
        };
      case 'red':
        return {
          dotBg: 'bg-rose-600',
          textColor: 'text-rose-700',
          badgeBg: 'bg-rose-50 border-rose-200',
          label: 'Red Ink',
        };
      case 'green':
        return {
          dotBg: 'bg-emerald-600',
          textColor: 'text-emerald-700',
          badgeBg: 'bg-emerald-50 border-emerald-200',
          label: 'Green Ink',
        };
      case 'assorted':
        return {
          dotBg: 'bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500',
          textColor: 'text-purple-700',
          badgeBg: 'bg-purple-50 border-purple-200',
          label: 'Multi / Assorted',
        };
      default:
        return {
          dotBg: 'bg-slate-400',
          textColor: 'text-slate-600',
          badgeBg: 'bg-slate-50 border-slate-200',
          label: 'All Inks',
        };
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      {/* 1. THE MAIN DROPDOWN BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl font-bold transition-all shadow-sm cursor-pointer border ${
          isOpen
            ? 'bg-[#0a1538] text-amber-300 border-[#314a9c] ring-2 ring-amber-400/40 shadow-lg'
            : 'bg-gradient-to-r from-[#0a1538] to-[#1a2f6c] hover:from-[#122256] hover:to-[#223d8c] text-white border-[#273c82] hover:border-amber-400/60'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/30 to-amber-400/30 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0 shadow-xs">
            <Pen className="w-4 h-4 text-amber-300" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs sm:text-sm font-extrabold text-amber-300 flex items-center gap-1.5 truncate font-display">
              <span>{buttonLabel || 'Brand Pens & Colours Selector'}</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500 text-white font-sans shrink-0">
                Dropdown
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium truncate flex items-center gap-1.5">
              <span>Cello, Reynolds, Hauser, Pentonic, Flair, Pilot, Rorito, Parker &amp; Inks</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-200 border border-blue-700/60">
            {penItems.length} Pens
          </span>
          <ChevronDown
            className={`w-4 h-4 text-amber-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* 2. DROPDOWN POPUP MENU / CATALOG SELECTOR */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-3xl border-2 border-blue-500/80 shadow-2xl p-4 sm:p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <Pen className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#0a1538] font-display">
                  Brand Pens &amp; Inks
                </h4>
                <p className="text-[11px] text-slate-500">
                  Filter by Brand, Pen Type (Ball/Gel/Roller) &amp; Ink Colour or pick directly
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Success Toast */}
          {showSuccessToast && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{showSuccessToast}</span>
            </div>
          )}

          {/* STEP 1: BRAND SELECTOR */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Choose Pen Brand:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  'all',
                  'Cello',
                  'Reynolds',
                  'Hauser',
                  'Pentonic',
                  'Flair',
                  'Pilot',
                  'Rorito',
                  'Uniball',
                  'Parker',
                  'Montex',
                  'Luxor',
                ] as PenBrand[]
              ).map((brand) => {
                const isActive = selectedBrand === brand;
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {brand === 'all' ? 'All Brands' : brand}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: PEN TYPE & INK COLOUR FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1 border-t border-slate-100">
            {/* Pen Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                <span>2. Pen Mechanism / Type:</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'all', label: 'All Types' },
                  { id: 'ballpoint', label: 'Ball Pen' },
                  { id: 'gel', label: 'Gel Pen' },
                  { id: 'rollerball', label: 'Rollerball' },
                  { id: 'fineliner', label: 'Fineliner' },
                  { id: 'fountain', label: 'Fountain' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedType(item.id as PenType)}
                    className={`px-2 py-1.5 rounded-xl text-xs font-bold text-center transition-all cursor-pointer border ${
                      selectedType === item.id
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ink Colour Selection with Visual Dots */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-600" />
                <span>3. Ink Colour:</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'all', label: 'All Inks', dot: 'bg-slate-400' },
                  { id: 'blue', label: 'Blue Ink', dot: 'bg-blue-600 ring-2 ring-blue-300' },
                  { id: 'black', label: 'Black Ink', dot: 'bg-slate-900 ring-2 ring-slate-400' },
                  { id: 'red', label: 'Red Ink', dot: 'bg-rose-600 ring-2 ring-rose-300' },
                  { id: 'green', label: 'Green Ink', dot: 'bg-emerald-600 ring-2 ring-emerald-300' },
                  { id: 'assorted', label: 'Rainbow / Multi', dot: 'bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 ring-1 ring-purple-300' },
                ].map((col) => {
                  const isActive = selectedColor === col.id;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setSelectedColor(col.id as PenColor)}
                      className={`px-2 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dot}`} />
                      <span className="truncate">{col.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STEP 3: SEARCH & QUICK DROPDOWN LIST */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Choose Pen from Matches ({filteredPens.length} available):</span>
              </label>

              {/* Quick in-dropdown search */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search model, e.g. V5, Trimax..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Select Dropdown Box & Quantity Stepper */}
            {filteredPens.length > 0 ? (
              <div className="flex flex-col sm:flex-row gap-2 items-center bg-slate-50/90 p-2.5 rounded-2xl border border-slate-200">
                <div className="relative flex-1 w-full">
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {filteredPens.map((item) => {
                      const { brand, color, type } = getPenDetails(item);
                      return (
                        <option key={item.id} value={item.id}>
                          {item.name} — ₹{item.price} [{brand} · {color.toUpperCase()} · {type}]
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl p-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                    disabled={qty <= 1}
                    className="w-7 h-7 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-mono font-black text-slate-900">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((prev) => prev + 1)}
                    className="w-7 h-7 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                    title="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Add Button */}
                <button
                  type="button"
                  onClick={handleAddCurrent}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Order</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                No pens found matching your filter selection. Try selecting &quot;All Brands&quot; or clear the search.
              </div>
            )}
          </div>

          {/* STEP 4: VISUAL ITEMS LIST (QUICK 1-CLICK ADD) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span>Matching Pen Items ({filteredPens.length})</span>
              <span className="text-[10px] text-slate-400 lowercase font-normal">
                Click + to add 1 piece instantly
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
              {filteredPens.map((item) => {
                const inCart = cart[item.id] || 0;
                const { brand, type, color } = getPenDetails(item);
                const badge = getColorBadge(color);

                return (
                  <div
                    key={item.id}
                    className="pt-2 first:pt-0 flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-blue-50/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Color swatch dot */}
                      <div className="shrink-0 flex items-center justify-center">
                        <span
                          className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-xs ${badge.dotBg}`}
                          title={badge.label}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-blue-950 truncate flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {inCart > 0 && (
                            <span className="text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                              {inCart} in cart
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {brand}
                          </span>
                          <span className="capitalize text-[10px] text-slate-600">
                            {type}
                          </span>
                          <span className={`text-[10px] font-bold ${badge.textColor}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs font-black text-amber-700">
                        ₹{item.price}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDirectAdd(item)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 shadow-2xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                        title={`Add 1 × ${item.name}`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
