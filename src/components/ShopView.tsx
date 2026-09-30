import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Send, 
  FileText, 
  Printer, 
  BookOpen, 
  Banknote,
  CheckCircle2,
  Lock,
  LogIn,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Sparkles,
  Receipt,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { Item, Category, CartLine, User } from '../types';
import { WhatsAppDirectButton } from './WhatsAppDirectButton';
import { GroupedProductCard, ProductGroupConfig } from './GroupedProductCard';

interface ShopViewProps {
  items: Item[];
  cart: Record<string, number>;
  user: User | null;
  onAddToCart: (itemId: string, qty?: number) => void;
  onRemoveFromCart: (itemId: string) => void;
  onOpenCheckout: (mode: 'order' | 'money_transfer') => void;
  onRequireLogin: () => void;
  onClearCart?: () => void;
  onDeleteItemFromCart?: (itemId: string) => void;
}

const CATEGORIES: ('All' | Category)[] = [
  'All',
  'Stationery',
  'Xerox',
  'Printing',
  'Money Transfer',
];

const getCategoryBadgeClass = (category: string) => {
  switch (category) {
    case 'Xerox':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Printing':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Stationery':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Money Transfer':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const ShopView: React.FC<ShopViewProps> = ({
  items,
  cart,
  user,
  onAddToCart,
  onRemoveFromCart,
  onOpenCheckout,
  onRequireLogin,
  onClearCart,
  onDeleteItemFromCart,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [lastAddedItemName, setLastAddedItemName] = useState<string | null>(null);
  const [isCartBoxOpen, setIsCartBoxOpen] = useState(false);
  const [dropdownQuantities, setDropdownQuantities] = useState<Record<string, number>>({});

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const cartBoxRef = useRef<HTMLDivElement>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close cart box on outside click
  useEffect(() => {
    const handleCartBoxClickOutside = (e: MouseEvent) => {
      if (
        isCartBoxOpen &&
        cartBoxRef.current &&
        !cartBoxRef.current.contains(e.target as Node) &&
        cartButtonRef.current &&
        !cartButtonRef.current.contains(e.target as Node)
      ) {
        setIsCartBoxOpen(false);
      }
    };
    document.addEventListener('mousedown', handleCartBoxClickOutside);
    return () => document.removeEventListener('mousedown', handleCartBoxClickOutside);
  }, [isCartBoxOpen]);

  // Filter items matching active category and search query
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [items, selectedCategory, searchQuery]);

  // Categorize all items into single unified cards (all types in one card)
  const productGroups = useMemo<ProductGroupConfig[]>(() => {
    // 1. Xerox (2 items)
    const xeroxItems = items.filter((i) => i.category === 'Xerox');

    // 2. Printing & Finishing (6 items)
    const printingItems = items.filter((i) => i.category === 'Printing');

    // 3. Notebooks & Registers (26 items)
    const notebookItems = items.filter((i) => {
      const n = i.name.toLowerCase();
      const d = (i.description || '').toLowerCase();
      return (
        i.category === 'Stationery' &&
        (i.id.startsWith('nb-') ||
          n.includes('notebook') ||
          n.includes('register') ||
          n.includes('quire') ||
          n.includes('3q') ||
          n.includes('4q') ||
          n.includes('5q') ||
          d.includes('notebook') ||
          d.includes('register'))
      );
    });

    // 4. Brand Pens & Inks (64 items)
    const penItems = items.filter((i) => {
      const n = i.name.toLowerCase();
      const d = (i.description || '').toLowerCase();
      const isPen =
        i.id.startsWith('pen-') ||
        i.id.startsWith('s-pen') ||
        i.id === 's-gel-pen' ||
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
        d.includes('gel pen');
      const isNotOther =
        !n.includes('notebook') &&
        !n.includes('register') &&
        !n.includes('pencil') &&
        !n.includes('highlighter') &&
        !n.includes('sharpener');
      return i.category === 'Stationery' && isPen && isNotOther;
    });

    // 5. Copier Paper & Presentation Files (3 items)
    const paperItems = items.filter((i) => {
      return (
        i.category === 'Stationery' &&
        (i.id === 's-a4-bundle' ||
          i.id === 's-a4-rim' ||
          i.id === 's-file' ||
          i.name.toLowerCase().includes('copier paper') ||
          i.name.toLowerCase().includes('file folder'))
      );
    });

    // 6. Pencils, Sharpeners & Erasers (3 items)
    const pencilItems = items.filter((i) => {
      return (
        i.category === 'Stationery' &&
        (i.id === 's-pencil' ||
          i.id === 's-eraser' ||
          i.id === 's-sharp' ||
          i.name.toLowerCase().includes('pencil') ||
          i.name.toLowerCase().includes('eraser') ||
          i.name.toLowerCase().includes('sharpener'))
      );
    });

    // 7. Rulers & Measuring Scales (2 items)
    const rulerItems = items.filter((i) => {
      return (
        i.category === 'Stationery' &&
        (i.id === 's-scale' ||
          i.id === 's-steel-scale' ||
          i.name.toLowerCase().includes('ruler') ||
          i.name.toLowerCase().includes('scale'))
      );
    });

    // 8. Adhesives, Tapes & Office Supplies (4 items)
    const officeItems = items.filter((i) => {
      return (
        i.category === 'Stationery' &&
        (i.id === 's-glue' ||
          i.id === 's-tape' ||
          i.id === 's-stapler' ||
          i.id === 's-envelope' ||
          i.name.toLowerCase().includes('glue') ||
          i.name.toLowerCase().includes('tape') ||
          i.name.toLowerCase().includes('stapler') ||
          i.name.toLowerCase().includes('envelope'))
      );
    });

    // 9. Permanent Markers & Highlighters (2 items)
    const markerItems = items.filter((i) => {
      return (
        i.category === 'Stationery' &&
        (i.id === 's-marker' ||
          i.id === 's-highlight' ||
          i.name.toLowerCase().includes('marker') ||
          i.name.toLowerCase().includes('highlighter'))
      );
    });

    // 10. Domestic Money Transfer & Aadhaar ATM (2 items)
    const moneyItems = items.filter((i) => i.category === 'Money Transfer');

    // Any uncategorized items
    const categorizedIds = new Set([
      ...xeroxItems.map((i) => i.id),
      ...printingItems.map((i) => i.id),
      ...notebookItems.map((i) => i.id),
      ...penItems.map((i) => i.id),
      ...paperItems.map((i) => i.id),
      ...pencilItems.map((i) => i.id),
      ...rulerItems.map((i) => i.id),
      ...officeItems.map((i) => i.id),
      ...markerItems.map((i) => i.id),
      ...moneyItems.map((i) => i.id),
    ]);
    const leftoverItems = items.filter((i) => !categorizedIds.has(i.id));

    const groups: ProductGroupConfig[] = [
      {
        id: 'group-notebooks',
        title: 'Notebooks, Long Books & Registers',
        subtitle: 'All types: Standard, Long & King Size, Quire Registers in Single Line, 2-Lines, 4-Lines, Maths & Plain',
        category: 'Stationery',
        badgeLabel: `${notebookItems.length} Book Types`,
        iconType: 'notebook',
        items: notebookItems,
      },
      {
        id: 'group-pens',
        title: 'Brand Pens & Inks Catalog',
        subtitle: 'Cello, Reynolds, Hauser, Pentonic, Flair, Pilot, Rorito, Parker & Uniball in Blue, Black, Red & Green',
        category: 'Stationery',
        badgeLabel: `${penItems.length} Pens`,
        iconType: 'pen',
        items: penItems,
      },
      {
        id: 'group-xerox',
        title: 'Xerox & Photocopy Services',
        subtitle: 'Single or double-sided crisp 75 GSM Black & White (₹2) and vibrant Colour Xerox (₹10)',
        category: 'Xerox',
        badgeLabel: `${xeroxItems.length} Services`,
        iconType: 'xerox',
        items: xeroxItems,
      },
      {
        id: 'group-printing',
        title: 'Printing & Document Finishing',
        subtitle: 'Laser prints, Passport Photos, Document Lamination, Spiral Binding & ID Card pouches',
        category: 'Printing',
        badgeLabel: `${printingItems.length} Services`,
        iconType: 'printing',
        items: printingItems,
      },
      {
        id: 'group-paper',
        title: 'Copier Paper & Presentation Files',
        subtitle: '75 GSM bright white paper (100 sheets pack & 500 sheets ream) & document display stick folders',
        category: 'Stationery',
        badgeLabel: `${paperItems.length} Products`,
        iconType: 'paper',
        items: paperItems,
      },
      {
        id: 'group-pencils',
        title: 'Pencils, Sharpeners & Erasers',
        subtitle: 'HB dark writing pencils, clean dust-free erasers, and anti-rust container sharpeners',
        category: 'Stationery',
        badgeLabel: `${pencilItems.length} Products`,
        iconType: 'pencil',
        items: pencilItems,
      },
      {
        id: 'group-rulers',
        title: 'Rulers & Measuring Scales',
        subtitle: '15cm clear transparent student ruler & 30cm (12 inch) heavy-duty stainless steel scale',
        category: 'Stationery',
        badgeLabel: `${rulerItems.length} Products`,
        iconType: 'ruler',
        items: rulerItems,
      },
      {
        id: 'group-office',
        title: 'Adhesives, Tapes & Office Supplies',
        subtitle: 'Fevistik glue stick, 1-inch transparent cello tape, No. 10 stapler with pins, official brown envelopes',
        category: 'Stationery',
        badgeLabel: `${officeItems.length} Products`,
        iconType: 'office',
        items: officeItems,
      },
      {
        id: 'group-markers',
        title: 'Permanent Markers & Highlighters',
        subtitle: 'Waterproof permanent markers and fluorescent yellow/green text highlighters',
        category: 'Stationery',
        badgeLabel: `${markerItems.length} Products`,
        iconType: 'marker',
        items: markerItems,
      },
      {
        id: 'group-money',
        title: 'Domestic Money Transfer & Aadhaar ATM',
        subtitle: 'Instant 24x7 IMPS bank transfer and Micro-ATM fingerprint cash withdrawal service',
        category: 'Money Transfer',
        badgeLabel: `${moneyItems.length} Services`,
        iconType: 'money',
        items: moneyItems,
      },
    ];

    if (leftoverItems.length > 0) {
      groups.push({
        id: 'group-other',
        title: 'Additional Store Items',
        subtitle: 'Other stationery and utility products available in store',
        category: 'Stationery',
        badgeLabel: `${leftoverItems.length} Items`,
        iconType: 'office',
        items: leftoverItems,
      });
    }

    return groups.filter((g) => g.items.length > 0);
  }, [items]);

  // Filter grouped cards based on selected category and search
  const filteredGroups = useMemo(() => {
    return productGroups.filter((group) => {
      const matchCat = selectedCategory === 'All' || group.category === selectedCategory;
      if (!matchCat) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const matchTitle =
        group.title.toLowerCase().includes(q) ||
        group.subtitle.toLowerCase().includes(q) ||
        group.category.toLowerCase().includes(q);
      const matchItem = group.items.some(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
      );

      return matchTitle || matchItem;
    });
  }, [productGroups, selectedCategory, searchQuery]);

  // Keyboard navigation for dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsDropdownOpen(true);
      return;
    }

    if (!isDropdownOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[highlightedIndex]) {
        const item = filteredItems[highlightedIndex];
        handleAddItem(item, dropdownQuantities[item.id] || 1);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

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

  const cartTotal = cartLines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const cartItemCount = cartLines.reduce((sum, line) => sum + line.qty, 0);

  const handleAddItem = (item: Item, count: number = 1) => {
    if (!user) {
      onRequireLogin();
      return;
    }
    onAddToCart(item.id, count);
    setLastAddedItemName(count > 1 ? `${count} × ${item.name}` : item.name);
    setTimeout(() => {
      setLastAddedItemName(null);
    }, 2500);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleSendMoneyClick = () => {
    if (!user) {
      onRequireLogin();
      return;
    }
    onOpenCheckout('money_transfer');
  };

  const handleCheckoutClick = () => {
    if (!user) {
      onRequireLogin();
      return;
    }
    onOpenCheckout('order');
  };

  const handleDeleteItem = (itemId: string) => {
    if (onDeleteItemFromCart) {
      onDeleteItemFromCart(itemId);
    } else {
      const count = cart[itemId] || 0;
      for (let i = 0; i < count; i++) {
        onRemoveFromCart(itemId);
      }
    }
  };

  // Automatically close cart box if cart becomes empty
  useEffect(() => {
    if (cartItemCount === 0 && isCartBoxOpen) {
      setIsCartBoxOpen(false);
    }
  }, [cartItemCount, isCartBoxOpen]);

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300">
      {/* If user is NOT logged in: Prominent requirement notice */}
      {!user && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm font-display text-amber-950">
                Sign In Required to Place Orders &amp; Access Dashboard
              </h4>
              <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                You can browse all store items and current rates below. To add products to cart, order Xerox/printing, or transfer money, please log in or register.
              </p>
            </div>
          </div>

          <button
            onClick={onRequireLogin}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1d2547] hover:bg-[#283363] text-white text-xs font-bold shadow-xs whitespace-nowrap cursor-pointer transition-colors"
          >
            <LogIn className="w-3.5 h-3.5 text-amber-400" />
            <span>Login / Register Now</span>
          </button>
        </div>
      )}

      {/* Hero Announcement & Services Bar */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 text-slate-900 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Everything in One Reliable Neighborhood Store
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-[#1d2547] leading-tight">
            Stationery, Quality Xerox, Printouts &amp; Money Transfer
          </h2>
          <p className="mt-2.5 text-slate-600 text-sm sm:text-base leading-relaxed">
            Fast Xerox &amp; Laser prints starting at <strong className="text-amber-700">₹2 per B&amp;W page</strong> and <strong className="text-amber-700">₹10 per Colour page</strong>. Passport photos, spiral binding, and domestic money transfers with instant receipts.
          </p>
        </div>

        {/* Quick Rate Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-200">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <FileText className="w-4 h-4 text-sky-600" />
              B&amp;W Xerox / Print
            </div>
            <div className="text-xl font-bold text-[#1d2547] mt-1">₹2 <span className="text-xs font-normal text-slate-500">/ page</span></div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <Printer className="w-4 h-4 text-emerald-600" />
              Colour Print / Copy
            </div>
            <div className="text-xl font-bold text-[#1d2547] mt-1">₹10 <span className="text-xs font-normal text-slate-500">/ page</span></div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <BookOpen className="w-4 h-4 text-amber-600" />
              Spiral Binding
            </div>
            <div className="text-xl font-bold text-[#1d2547] mt-1">₹40 <span className="text-xs font-normal text-slate-500">/ book</span></div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <Banknote className="w-4 h-4 text-indigo-600" />
              Money Transfer
            </div>
            <div className="text-xl font-bold text-[#1d2547] mt-1">₹10 <span className="text-xs font-normal text-slate-500">fee / ₹1000</span></div>
          </div>
        </div>
      </div>

      {/* Direct WhatsApp Contact Banner for Customers */}
      <WhatsAppDirectButton variant="banner" />

      {/* Notification banner when item added */}
      {lastAddedItemName && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Added <strong className="font-bold text-emerald-950">{lastAddedItemName}</strong> to your order.
            </span>
          </div>
          <button 
            onClick={handleCheckoutClick}
            className="font-bold underline text-emerald-800 hover:text-emerald-950 cursor-pointer"
          >
            View Cart ({cartItemCount})
          </button>
        </div>
      )}

      {/* =========================================================================
          ORDER PRODUCTS: CATEGORY AND DROPDOWN LIST (AS IN OFFLINE POS)
         ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-amber-400/40 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-[#0a1538] flex items-center gap-2 font-display">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
              Order Products &amp; Services
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Search products or browse the categories and catalog below to add to your order.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {filteredItems.length} Products Available
          </span>
        </div>

        {/* AUTOCOMPLETE SEARCH & DROPDOWN LIST */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-amber-600" />
              <span>Search Products &amp; Services:</span>
            </label>
            <span className="text-[11px] text-slate-500 font-medium">
              Click any item below to add to order
            </span>
          </div>

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
                placeholder="Type item name (e.g. Printout, Xerox, Pen, Spiral, Binding, Lamination)..."
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
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Interactive Autocomplete Dropdown List (matching Offline POS) */}
            {isDropdownOpen && (
              <div
                ref={dropdownRef}
                className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-amber-400/80 shadow-2xl overflow-hidden max-h-84 flex flex-col animate-in fade-in-50 zoom-in-95 duration-150"
              >
                {/* Filter category pills within dropdown header */}
                <div className="p-2.5 border-b border-slate-100 bg-slate-50/95 flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 shrink-0">
                      Filter:
                    </span>
                    {CATEGORIES.map((cat) => {
                      const isActive = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat);
                            searchInputRef.current?.focus();
                          }}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] whitespace-nowrap transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#0a1538] text-amber-300 shadow-xs'
                              : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          {cat === 'All' ? 'All Items' : cat}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 shrink-0 ml-2">
                    {filteredItems.length} items found
                  </span>
                </div>

                {/* Dropdown Items List */}
                <div className="overflow-y-auto divide-y divide-slate-100">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item, index) => {
                      const isSelected = index === highlightedIndex;
                      const qty = cart[item.id] || 0;
                      const displayQty = qty > 0 ? qty : (dropdownQuantities[item.id] || 1);
                      return (
                        <div
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleAddItem(item, 1)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleAddItem(item, 1);
                            }
                          }}
                          className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer select-none ${
                            isSelected ? 'bg-amber-50/90 border-l-4 border-amber-500' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                {item.name}
                              </span>
                              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${getCategoryBadgeClass(item.category)}`}>
                                {item.category}
                              </span>
                              {qty > 0 && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  {qty} in cart
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="text-sm font-black text-slate-900 font-mono">
                                ₹{item.price}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {item.unit || 'per item'}
                              </div>
                            </div>

                            {/* Quantity stepper matching image: [ - ] 1 [ + ] */}
                            <div 
                              className="flex items-center bg-white border border-slate-300 rounded-xl p-0.5 shadow-2xs shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (qty > 0) {
                                    onRemoveFromCart(item.id);
                                  } else {
                                    setDropdownQuantities((prev) => ({
                                      ...prev,
                                      [item.id]: Math.max(1, (prev[item.id] || 1) - 1),
                                    }));
                                  }
                                }}
                                disabled={displayQty <= 1}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors active:scale-95"
                                title="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5 text-slate-600" />
                              </button>
                              <span className="w-8 text-center font-bold font-mono text-sm text-slate-900 select-none">
                                {displayQty}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddItem(item, 1);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors active:scale-95"
                                title="Increase quantity / Add to order"
                              >
                                <Plus className="w-3.5 h-3.5 text-slate-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      <p className="font-semibold text-slate-700">No matching products found.</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Try adjusting your search query or reset to all categories.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('All');
                          setSearchQuery('');
                        }}
                        className="mt-3 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Reset Search Filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. CURRENT ORDER ITEMS SUMMARY TABLE (IF ITEMS ADDED) */}
        {cartLines.length > 0 && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-700" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  Current Order Items ({cartItemCount} items)
                </h4>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-black text-slate-900">
                  Total: ₹{cartTotal}
                </span>
                <button
                  type="button"
                  onClick={handleCheckoutClick}
                  className="px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                >
                  Proceed to Checkout →
                </button>
              </div>
            </div>

            <div className="divide-y divide-amber-200/40 max-h-48 overflow-y-auto">
              {cartLines.map((line) => (
                <div key={line.itemId} className="py-2 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-900">{line.name}</span>
                    <span className="text-[10px] text-slate-500 ml-2">
                      ₹{line.price} {line.unit ? `/ ${line.unit}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => onRemoveFromCart(line.itemId)}
                        className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold font-mono text-slate-900 text-xs">
                        {line.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onAddToCart(line.itemId)}
                        className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-mono font-black text-slate-900 min-w-[50px] text-right">
                      ₹{line.price * line.qty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Navigation Bar for Grouped Cards */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            const count =
              cat === 'All'
                ? productGroups.length
                : productGroups.filter((g) => g.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#0a1538] text-amber-300 shadow-md ring-2 ring-amber-400/40'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{cat === 'All' ? 'All Catalog Cards' : cat}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    isActive
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredGroups.length} categorized product card{filteredGroups.length !== 1 ? 's' : ''} ({items.length} total items organized)
        </div>
      </div>

      {/* Grouped Product Cards Grid (Each card groups all variants, e.g. all notebooks in 1 card) */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-white border border-slate-200 text-slate-500">
          <ShoppingBag className="w-10 h-10 mx-auto opacity-40 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No matching product cards found</h3>
          <p className="text-xs mt-1">Try adjusting your search query or reset category filter.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="mt-3 px-4 py-2 rounded-xl bg-slate-900 text-amber-300 font-bold text-xs cursor-pointer hover:bg-slate-800"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {filteredGroups.map((group) => (
            <GroupedProductCard
              key={group.id}
              group={group}
              cart={cart}
              user={user}
              onAddToCart={onAddToCart}
              onRemoveFromCart={onRemoveFromCart}
              onRequireLogin={onRequireLogin}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}

      {/* Floating Bottom-Center Cart Box & Proceed to Order Dock (Shown ONLY when items are added to cart) */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto w-auto max-w-[calc(100vw-1.5rem)]">
          
          {/* Accessible Expandable Cart Box */}
          {isCartBoxOpen && (
            <div
              ref={cartBoxRef}
              className="mb-3 w-[350px] sm:w-[440px] max-w-[calc(100vw-2rem)] bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50 flex flex-col"
            >
              {/* Cart Box Header */}
              <div className="bg-[#0a1538] text-white px-4 py-3.5 flex items-center justify-between border-b border-[#1b3272]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-sm">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm font-display text-white">Your Cart Box</h3>
                    <p className="text-[11px] text-slate-300 font-medium">
                      {cartItemCount} item{cartItemCount !== 1 ? 's' : ''} in cart
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {onClearCart && cartLines.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearCart}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-300 hover:text-white hover:bg-rose-900/40 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Clear all items in cart"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsCartBoxOpen(false)}
                    className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Close Cart Box"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Cart Items List */}
              <div className="max-h-[300px] sm:max-h-[340px] overflow-y-auto p-3 divide-y divide-slate-100 space-y-2">
                {cartLines.map((line) => (
                  <div key={line.itemId} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {line.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono text-amber-700 font-semibold">₹{line.price}</span>
                        {line.category && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                            {line.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Stepper, Subtotal & Trash */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => onRemoveFromCart(line.itemId)}
                          className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                          title="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-mono font-bold text-xs text-slate-900">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onAddToCart(line.itemId, 1)}
                          className="w-6 h-6 rounded-lg bg-white hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer active:scale-90"
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right w-14 font-mono font-extrabold text-xs text-slate-900">
                        ₹{line.price * line.qty}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(line.itemId)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Box Footer Summary & Direct Proceed Action */}
              <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-600">Total Payable Amount</span>
                  <span className="text-xl font-black text-[#0a1538] font-display">
                    ₹{cartTotal}
                  </span>
                </div>

                {!user ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartBoxOpen(false);
                      onRequireLogin();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer active:scale-98 transition-all"
                  >
                    <Lock className="w-4 h-4 text-slate-950" />
                    <span>Login to Place Order</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartBoxOpen(false);
                      handleCheckoutClick();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25 cursor-pointer active:scale-98 transition-all"
                  >
                    <span>{user.role === 'admin' ? 'Checkout & Print Receipt' : 'Proceed to Order'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Floating Action Menu in Bottom Center */}
          <div className="flex items-center justify-center p-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-300 shadow-2xl shadow-slate-900/30">
            {/* Cart Menu Button */}
            <button
              ref={cartButtonRef}
              type="button"
              onClick={() => setIsCartBoxOpen((prev) => !prev)}
              className={`inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 shadow-xs ${
                isCartBoxOpen
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/50'
                  : 'bg-[#0a1538] hover:bg-[#122256] text-white border border-[#1b3272]'
              }`}
              title={isCartBoxOpen ? 'Close cart box' : 'Open cart box to inspect items and proceed'}
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-amber-300" />
                <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-mono font-black flex items-center justify-center shadow-xs">
                  {cartItemCount}
                </span>
              </div>
              <span className="font-display">Cart</span>
              <span className={`font-mono text-xs ${isCartBoxOpen ? 'text-slate-950 font-black' : 'text-amber-300'}`}>
                ₹{cartTotal}
              </span>
              {isCartBoxOpen ? (
                <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 ml-0.5 text-slate-300" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
