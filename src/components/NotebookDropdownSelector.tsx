import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  ChevronDown, 
  Plus, 
  Minus, 
  Check, 
  Sparkles, 
  X, 
  Search,
  Filter,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { Item } from '../types';

export type BookType = 'all' | 'standard' | 'long' | 'king' | 'register';
export type RulingType = 'all' | 'single' | '2line' | '4line' | 'square' | 'unruled';
export type PageCount = 'all' | '100' | '200' | '3q' | '4q' | '5q';

interface NotebookDropdownSelectorProps {
  items: Item[];
  onAddItem: (item: Item, qty?: number) => void;
  cart?: Record<string, number>;
  compact?: boolean;
  buttonLabel?: string;
}

export const NotebookDropdownSelector: React.FC<NotebookDropdownSelectorProps> = ({
  items,
  onAddItem,
  cart = {},
  compact = false,
  buttonLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBookType, setSelectedBookType] = useState<BookType>('all');
  const [selectedRuling, setSelectedRuling] = useState<RulingType>('all');
  const [selectedPageCount, setSelectedPageCount] = useState<PageCount>('all');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter items that are notebooks / registers
  const notebookItems = useMemo(() => {
    return items.filter((item) => {
      const n = item.name.toLowerCase();
      const c = item.category.toLowerCase();
      const d = (item.description || '').toLowerCase();
      const isNotebook =
        n.includes('notebook') ||
        n.includes('register') ||
        n.includes('quire') ||
        n.includes('3q') ||
        n.includes('4q') ||
        n.includes('5q') ||
        d.includes('notebook') ||
        d.includes('register') ||
        item.id.startsWith('nb-');
      return c === 'stationery' && isNotebook;
    });
  }, [items]);

  // Categorize item attributes
  const getItemDetails = (item: Item) => {
    const n = item.name.toLowerCase();
    const d = (item.description || '').toLowerCase();
    const combined = `${n} ${d}`;

    let bookType: BookType = 'standard';
    if (combined.includes('long notebook') || combined.includes('long size')) {
      bookType = 'long';
    } else if (combined.includes('king size') || combined.includes('king')) {
      bookType = 'king';
    } else if (combined.includes('register') || combined.includes('quire') || combined.includes('3q') || combined.includes('4q') || combined.includes('5q')) {
      bookType = 'register';
    }

    let ruling: RulingType = 'single';
    if (combined.includes('4 line') || combined.includes('4-line') || combined.includes('4lines')) {
      ruling = '4line';
    } else if (combined.includes('2 line') || combined.includes('2-line') || combined.includes('2lines')) {
      ruling = '2line';
    } else if (combined.includes('square') || combined.includes('math')) {
      ruling = 'square';
    } else if (combined.includes('unruled') || combined.includes('plain')) {
      ruling = 'unruled';
    }

    let pages: PageCount = '100';
    if (combined.includes('200 page') || combined.includes('200p') || combined.includes('200 pages')) {
      pages = '200';
    } else if (combined.includes('3q') || combined.includes('3 quire') || combined.includes('288')) {
      pages = '3q';
    } else if (combined.includes('4q') || combined.includes('4 quire') || combined.includes('384')) {
      pages = '4q';
    } else if (combined.includes('5q') || combined.includes('5 quire') || combined.includes('480')) {
      pages = '5q';
    }

    return { bookType, ruling, pages };
  };

  // Filter notebook items by current selections
  const filteredNotebooks = useMemo(() => {
    return notebookItems.filter((item) => {
      const { bookType, ruling, pages } = getItemDetails(item);

      const matchesType = selectedBookType === 'all' || bookType === selectedBookType;
      const matchesRuling = selectedRuling === 'all' || ruling === selectedRuling;
      const matchesPages = selectedPageCount === 'all' || pages === selectedPageCount;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));

      return matchesType && matchesRuling && matchesPages && matchesSearch;
    });
  }, [notebookItems, selectedBookType, selectedRuling, selectedPageCount, searchQuery]);

  // Set default selected item when filtered list changes
  useEffect(() => {
    if (filteredNotebooks.length > 0) {
      if (!selectedItemId || !filteredNotebooks.some((i) => i.id === selectedItemId)) {
        setSelectedItemId(filteredNotebooks[0].id);
      }
    } else {
      setSelectedItemId('');
    }
  }, [filteredNotebooks, selectedItemId]);

  const activeSelectedItem = useMemo(() => {
    return notebookItems.find((i) => i.id === selectedItemId) || filteredNotebooks[0] || null;
  }, [notebookItems, selectedItemId, filteredNotebooks]);

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

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      {/* 1. THE MAIN DROPDOWN BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl font-bold transition-all shadow-sm cursor-pointer border ${
          isOpen
            ? 'bg-[#0a1538] text-amber-300 border-[#314a9c] ring-2 ring-amber-400/40 shadow-lg'
            : 'bg-gradient-to-r from-[#0a1538] to-[#162760] hover:from-[#122256] hover:to-[#22397c] text-white border-[#273c82] hover:border-amber-400/60'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs sm:text-sm font-extrabold text-amber-300 flex items-center gap-1.5 truncate font-display">
              <span>{buttonLabel || 'Notebooks & Registers Category'}</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-sans shrink-0">
                Dropdown
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium truncate">
              Standard, Long, King Size, 4-Line, 2-Line, 100p, 200p, 3Q, 4Q, 5Q
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-200 border border-blue-700/60">
            {notebookItems.length} Variants
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
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-3xl border-2 border-amber-400/80 shadow-2xl p-4 sm:p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#0a1538] font-display">
                  Notebooks, Long Books &amp; Registers Dropdown
                </h4>
                <p className="text-[11px] text-slate-500">
                  Filter by Size, Ruling &amp; Page Count or choose directly from the catalog
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

          {/* STEP 1: CATEGORY / BOOK SIZE */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>1. Book Size / Category:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'all', label: 'All Notebooks' },
                { id: 'standard', label: 'Standard Notebook' },
                { id: 'long', label: 'Long Notebook' },
                { id: 'king', label: 'King Size Notebook' },
                { id: 'register', label: 'Account Register (3Q-5Q)' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setSelectedBookType(btn.id as BookType)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer border ${
                    selectedBookType === btn.id
                      ? 'bg-[#0a1538] text-amber-300 border-[#2b449b] shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: RULING TYPE */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Ruling Type:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All Rulings' },
                { id: 'single', label: 'Single Line (1-Line)' },
                { id: '2line', label: '2 Lines (Hindi / Language)' },
                { id: '4line', label: '4 Lines (English / Cursive)' },
                { id: 'square', label: 'Square Ruled (Maths)' },
                { id: 'unruled', label: 'Unruled / Plain Blank' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setSelectedRuling(btn.id as RulingType)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    selectedRuling === btn.id
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 3: PAGE COUNT / QUIRE */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Page Count / Quire Size:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All Pages' },
                { id: '100', label: '100 Pages' },
                { id: '200', label: '200 Pages' },
                { id: '3q', label: '3Q Book (~288 pgs)' },
                { id: '4q', label: '4Q Book (~384 pgs)' },
                { id: '5q', label: '5Q Book (~480 pgs)' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setSelectedPageCount(btn.id as PageCount)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    selectedPageCount === btn.id
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 4: DIRECT SELECTION CARD & QUANTITY ADDER */}
          {activeSelectedItem && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-300 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                      Selected Configuration
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      {activeSelectedItem.unit || 'per book'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900 mt-1">
                    {activeSelectedItem.name}
                  </h4>
                  {activeSelectedItem.description && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      {activeSelectedItem.description}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-[#0a1538] font-mono">
                    ₹{activeSelectedItem.price * qty}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    ₹{activeSelectedItem.price} each
                  </div>
                </div>
              </div>

              {/* Action row: Stepper + Add Button */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-amber-200/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Quantity:</span>
                  <div className="flex items-center bg-white border border-slate-300 rounded-xl p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-bold font-mono text-sm text-slate-900">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty((prev) => prev + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddCurrent}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer border border-amber-300"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Order / Bill (₹{activeSelectedItem.price * qty})</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: MATCHING PRODUCTS LIST IN DROPDOWN */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>Matching Notebooks Catalog ({filteredNotebooks.length}):</span>
              </div>
              <div className="relative w-44 sm:w-56">
                <input
                  type="text"
                  placeholder="Search ruling or size..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-400 font-medium"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
              {filteredNotebooks.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No notebook matches this combination. Try changing ruling or size.
                </div>
              ) : (
                filteredNotebooks.map((item) => {
                  const isCurrent = item.id === selectedItemId;
                  const inCartQty = cart[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors ${
                        isCurrent ? 'bg-amber-50/60' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedItemId(item.id)}
                        className="text-left flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {item.description}
                        </div>
                      </button>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="text-right">
                          <span className="font-mono font-black text-sm text-[#0a1538]">
                            ₹{item.price}
                          </span>
                          {inCartQty > 0 && (
                            <span className="block text-[10px] text-emerald-600 font-bold">
                              {inCartQty} in cart
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDirectAdd(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-400 hover:text-slate-950 text-slate-800 text-xs font-bold transition-all border border-slate-200 cursor-pointer active:scale-95 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3 text-amber-600" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
