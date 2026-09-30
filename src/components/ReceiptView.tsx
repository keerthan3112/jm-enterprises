import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Printer, 
  ArrowLeft, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  Search, 
  FileText,
  AlertCircle,
  Download,
  ShieldCheck,
  RefreshCw,
  LayoutGrid,
  ChevronDown,
  Sparkles,
  Zap,
  FileDown
} from 'lucide-react';
import { Order } from '../types';
import { api } from '../services/api';
import jmLogo from '../assets/logo.png';

interface ReceiptViewProps {
  order: Order | null;
  onBackToShop: () => void;
  onBackToAdmin?: () => void;
  onSelectOrder: (order: Order) => void;
}

export const ReceiptView: React.FC<ReceiptViewProps> = ({
  order,
  onBackToShop,
  onBackToAdmin,
  onSelectOrder,
}) => {
  const [receiptMode, setReceiptMode] = useState<'standard' | 'thermal'>('standard');
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);

  // Fetch recent orders list to populate quick switcher and auto-load if no order selected
  const fetchRecentOrders = async () => {
    setLoadingOrders(true);
    try {
      const orders = await api.getOrders();
      // sort latest first
      const sorted = [...orders].sort((a, b) => b.createdAt - a.createdAt);
      setRecentOrders(sorted);

      // If no order currently selected, automatically select the latest one!
      if (!order && sorted.length > 0) {
        onSelectOrder(sorted[0]);
      }
    } catch (err) {
      console.error('Failed to load orders for receipt printing:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  // Update order if current order changed or is null
  useEffect(() => {
    if (!order && recentOrders.length > 0) {
      onSelectOrder(recentOrders[0]);
    }
  }, [order, recentOrders]);

  // Dedicated, bulletproof print function
  // Triggers native browser print engine with full CSS & fonts, avoiding iframe sandbox traps
  const executePrint = (forcedMode?: 'standard' | 'thermal') => {
    const activeMode = forcedMode || receiptMode;
    const printEl = document.getElementById('printable-receipt-card');
    if (!printEl || !order) {
      window.print();
      return;
    }

    setIsPrinting(true);

    const prevTitle = document.title;
    document.title = `Receipt_${order.receiptNumber}`;

    if (activeMode === 'thermal') {
      document.body.classList.add('print-thermal-mode');
    } else {
      document.body.classList.remove('print-thermal-mode');
    }

    setTimeout(() => {
      try {
        window.print();
      } catch (e) {
        console.error('Print trigger failed:', e);
      } finally {
        setTimeout(() => {
          setIsPrinting(false);
          document.title = prevTitle;
          document.body.classList.remove('print-thermal-mode');
        }, 600);
      }
    }, 150);
  };

  const handleDownloadPDF = () => {
    if (!order) return;
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Colors
      const primaryColor: [number, number, number] = [10, 21, 56]; // #0a1538
      const secondaryColor: [number, number, number] = [100, 116, 139]; // slate-500
      const textColor: [number, number, number] = [15, 23, 42]; // slate-900

      // Header Banner
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('JM ENTERPRISES', 105, 11, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('Stationery  |  Quality Xerox  |  Laser Printing  |  Domestic Money Transfer', 105, 17, { align: 'center' });
      doc.setFontSize(7.5);
      doc.text('Phone: 8747991688  |  Email: jm.enterprises.3112@gmail.com', 105, 22, { align: 'center' });

      // Receipt Meta Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, 31, 180, 20, 2, 2, 'FD');

      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`RECEIPT / BILL NO: ${order.receiptNumber}`, 20, 39);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...secondaryColor);
      doc.text(`Ref ID: ${order.id}`, 20, 46);

      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 145, 39);
      doc.setFont('helvetica', 'normal');
      doc.text(`Time: ${new Date(order.createdAt).toLocaleTimeString('en-IN')}`, 145, 46);

      // Customer Particulars Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, 54, 180, 20, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...primaryColor);
      doc.text('CUSTOMER DETAILS:', 20, 61);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...textColor);
      doc.text(order.customerName, 20, 68);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Mobile: ${order.customerPhone}`, 110, 61);
      if (order.customerEmail && !order.customerEmail.toLowerCase().includes('customer@example.com')) {
        doc.text(`Email: ${order.customerEmail}`, 110, 66);
        doc.text(`Payment: ${order.paymentMethod.toUpperCase()}${order.upiRef ? ` (${order.upiRef})` : ''}`, 110, 71);
      } else {
        doc.text(`Payment: ${order.paymentMethod.toUpperCase()}${order.upiRef ? ` (${order.upiRef})` : ''}`, 110, 68);
      }

      // Items Table Header
      let y = 80;
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y, 180, 7.5, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.line(15, y + 7.5, 195, y + 7.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...primaryColor);
      doc.text('SL.NO', 23, y + 5, { align: 'center' });
      doc.text('ITEM / SERVICE PARTICULAR', 35, y + 5);
      doc.text('QTY', 125, y + 5, { align: 'center' });
      doc.text('RATE (INR)', 155, y + 5, { align: 'right' });
      doc.text('AMOUNT (INR)', 190, y + 5, { align: 'right' });

      y += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...textColor);

      order.lines.forEach((line, index) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        doc.text(String(index + 1), 23, y, { align: 'center' });
        doc.text(line.name, 35, y);
        doc.text(String(line.qty), 125, y, { align: 'center' });
        doc.text(`Rs. ${line.price}`, 155, y, { align: 'right' });
        doc.text(`Rs. ${line.price * line.qty}`, 190, y, { align: 'right' });
        
        doc.setDrawColor(241, 245, 249);
        doc.line(15, y + 2.5, 195, y + 2.5);
        y += 7;
      });

      y += 3;
      // Subtotals & Transfer breakdown
      doc.setDrawColor(203, 213, 225);
      doc.line(120, y, 195, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('Items Subtotal:', 140, y);
      doc.text(`Rs. ${order.subtotal}`, 190, y, { align: 'right' });

      if (order.transferAmount) {
        y += 5;
        doc.text('Transfer Principal:', 140, y);
        doc.text(`Rs. ${order.transferAmount}`, 190, y, { align: 'right' });
        y += 5;
        doc.text('Remittance Fee:', 140, y);
        doc.text(`Rs. ${order.serviceFee || 0}`, 190, y, { align: 'right' });
      }

      y += 6;
      // Grand Total Box
      doc.setFillColor(...primaryColor);
      doc.roundedRect(120, y, 75, 11, 1.5, 1.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('GRAND TOTAL:', 125, y + 7.5);
      doc.setFontSize(11);
      doc.text(`Rs. ${order.total}`, 190, y + 7.5, { align: 'right' });

      // Verification stamp & footer
      y = Math.max(y + 22, 235);
      doc.setDrawColor(203, 213, 225);
      doc.line(15, y, 195, y);

      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...secondaryColor);
      doc.text('Thank you for visiting JM Enterprises!', 20, y);
      doc.text('• Goods once sold can be exchanged within 2 days with original receipt and non refundable', 20, y + 4.5);

      // Signatory line
      doc.setDrawColor(100, 116, 139);
      doc.line(140, y + 12, 190, y + 12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...primaryColor);
      doc.text('Authorized Signatory & Stamp', 165, y + 17, { align: 'center' });
      doc.setFontSize(7);
      doc.setTextColor(...secondaryColor);
      doc.text('JM Enterprises Counter Bill', 165, y + 21, { align: 'center' });

      // Save PDF file
      doc.save(`Receipt_${order.receiptNumber}.pdf`);
    } catch (err) {
      console.error('Error generating PDF with jsPDF:', err);
      window.print();
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    const q = lookupQuery.trim();
    if (!q) return;

    setLookupLoading(true);
    try {
      const found = await api.getOrderById(q);
      if (found) {
        onSelectOrder(found);
        setLookupQuery('');
      } else {
        setLookupError('No receipt found with this Receipt # or Order ID.');
      }
    } catch {
      try {
        const phoneOrders = await api.getOrders({ phone: q });
        if (phoneOrders && phoneOrders.length > 0) {
          onSelectOrder(phoneOrders[0]);
          setLookupQuery('');
        } else {
          setLookupError('Receipt not found. Please verify the ID or Phone number.');
        }
      } catch {
        setLookupError('Receipt not found. Please verify the ID or Phone number.');
      }
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-20 animate-in fade-in duration-300">
      {/* Admin Official Terminal Header & Toolbar (Hidden during print) */}
      <div className="no-print p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#071333] via-[#0d1d4d] to-[#071333] border border-[#1b3272] text-white shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#162760] text-amber-400 border border-[#2b449b] flex items-center justify-center font-bold shadow-md">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-white">
                Admin Receipt Printing Terminal
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToAdmin || onBackToShop}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#142866] to-[#1c388c] hover:from-[#1c388c] hover:to-[#2548ad] text-amber-300 border border-[#3558b5] shadow-xs text-xs font-bold transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Back to Admin Dashboard</span>
            </button>
          </div>
        </div>

        {/* Action Controls & Format Switcher */}
        <div className="pt-3 border-t border-[#1b3272] flex flex-wrap items-center justify-between gap-3">
          {/* Format selection */}
          <div className="flex items-center gap-1.5 bg-[#050c22] p-1 rounded-xl border border-[#162a63]">
            <button
              type="button"
              onClick={() => setReceiptMode('standard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                receiptMode === 'standard'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black shadow-md border border-amber-300'
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              }`}
            >
              A4 Standard Invoice
            </button>
            <button
              type="button"
              onClick={() => setReceiptMode('thermal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                receiptMode === 'thermal'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black shadow-md border border-amber-300'
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              }`}
            >
              80mm Thermal POS Slip
            </button>
          </div>

          {/* Quick Actions: PDF Download */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={!order}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 border border-indigo-400/40 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-40 active:scale-95"
              title="Download official receipt in PDF format"
            >
              <FileDown className="w-3.5 h-3.5 text-amber-300" />
              <span>Save as PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Recent Receipts Switcher & Search Bar (Hidden during print) */}
      <div className="no-print p-4 rounded-2xl border bg-white border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Recent orders dropdown / selector */}
        <div className="relative flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              Select Order:
            </span>
            <div className="relative flex-1">
              <select
                value={order?.id || ''}
                onChange={(e) => {
                  const selected = recentOrders.find((o) => o.id === e.target.value);
                  if (selected) onSelectOrder(selected);
                }}
                className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0a1538] cursor-pointer"
              >
                {recentOrders.length === 0 ? (
                  <option value="">No past receipts recorded</option>
                ) : (
                  recentOrders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      {ord.receiptNumber} — {ord.customerName} (₹{ord.total}) · {ord.kind === 'money_transfer' ? 'Money Remittance' : 'Store Job'} · {new Date(ord.createdAt).toLocaleDateString()}
                    </option>
                  ))
                )}
              </select>
            </div>
            <button
              type="button"
              onClick={fetchRecentOrders}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search by receipt # or customer phone */}
        <form onSubmit={handleLookup} className="flex gap-2 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Receipt # / Phone..."
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a1538]"
            />
          </div>
          <button
            type="submit"
            disabled={lookupLoading}
            className="px-3 py-2 rounded-xl bg-[#0a1538] hover:bg-[#122256] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            {lookupLoading ? '...' : 'Search'}
          </button>
        </form>
      </div>

      {lookupError && (
        <div className="no-print p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{lookupError}</span>
        </div>
      )}

      {/* ========================================================
          RECEIPT CANVAS: Rendered for Screen & Print
         ======================================================== */}
      {!order ? (
        <div className="p-12 text-center rounded-3xl border bg-white border-slate-200 text-slate-500 shadow-sm">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <h3 className="text-base font-bold text-slate-800">No Receipt Found</h3>
          <p className="text-xs mt-1">Please select an order above or record a transaction from the counter shop.</p>
          <button
            onClick={fetchRecentOrders}
            className="mt-4 px-4 py-2 rounded-xl bg-[#0a1538] text-white text-xs font-bold cursor-pointer hover:bg-[#122256]"
          >
            Reload Orders
          </button>
        </div>
      ) : (
        <div
          ref={receiptRef}
          id="printable-receipt-card"
          className={`printable-area mx-auto transition-all ${
            receiptMode === 'thermal'
              ? 'thermal-mode max-w-[340px] p-5 bg-white text-slate-900 border-2 border-dashed border-slate-300 rounded-2xl shadow-md font-mono text-xs'
              : 'max-w-2xl p-8 sm:p-10 bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-xl'
          }`}
        >
          {/* Shop Header */}
          <div className="text-center pb-5 border-b border-dashed border-slate-300">
            <div className="w-14 h-14 rounded-2xl bg-black border-2 border-amber-400/60 p-1 mx-auto mb-2.5 flex items-center justify-center shadow-md overflow-hidden">
              <img src={jmLogo} alt="JM Enterprises" className="w-full h-full object-contain rounded-xl" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-[#0a1538]">
              JM ENTERPRISES
            </h2>
            <p className="text-xs font-bold text-slate-700 mt-0.5">
              Stationery · Quality Xerox · Printouts · Money Transfer
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-600 mt-2 font-medium">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-500" />
                <strong>8747991688</strong>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-500" />
                jm.enterprises.3112@gmail.com
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>JM Enterprises · Verified Counter Bill</span>
            </div>
          </div>

          {/* Receipt Meta (ID, Date, Status) */}
          <div className="py-4 border-b border-slate-200 grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Receipt / Bill No.</div>
              <div className="font-mono font-bold text-sm sm:text-base text-[#0a1538]">
                {order.receiptNumber}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">Ref ID: {order.id}</div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Date &amp; Time</div>
              <div className="font-semibold text-slate-800">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
              <div className="text-[11px] text-slate-500">
                {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 text-xs text-slate-600">
            <div>
              Payment: <strong className="uppercase text-slate-900 font-mono">{order.paymentMethod}</strong>
              {order.upiRef && <span className="ml-1.5 text-[11px] font-mono text-slate-500">({order.upiRef})</span>}
            </div>
          </div>

          {/* Customer Particulars */}
          <div className="py-3.5 border-b border-slate-200 text-xs">
            <div className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">
              Customer Particulars:
            </div>
            <div className="font-bold text-sm text-slate-900">{order.customerName}</div>
            <div className="text-slate-600 flex flex-wrap gap-x-4 mt-0.5">
              <span>Mobile: <strong className="font-mono text-slate-800">{order.customerPhone}</strong></span>
              {order.customerEmail && 
               order.customerEmail.trim() !== '' && 
               !order.customerEmail.toLowerCase().includes('customer@example.com') && (
                <span>Email: <strong className="font-normal text-slate-800">{order.customerEmail}</strong></span>
              )}
            </div>
            {order.note && (
              <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                <strong>Customer Note:</strong> {order.note}
              </div>
            )}
          </div>

          {/* Particulars Table */}
          <div className="py-4 border-b border-slate-200">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="pb-2 text-center font-bold w-12">Sl.No</th>
                  <th className="pb-2 font-bold">Item / Service Particulars</th>
                  <th className="pb-2 text-center font-bold w-16">Qty</th>
                  <th className="pb-2 text-right font-bold w-20">Rate</th>
                  <th className="pb-2 text-right font-bold w-24">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.lines.map((line, idx) => (
                  <tr key={idx} className="py-2">
                    <td className="py-2.5 text-center text-slate-500 font-mono font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 pr-2">
                      <div className="font-semibold text-slate-900">{line.name}</div>
                      {line.category && (
                        <div className="text-[10px] text-slate-400">{line.category}</div>
                      )}
                    </td>
                    <td className="py-2.5 text-center text-slate-600 font-mono">
                      {line.qty}
                    </td>
                    <td className="py-2.5 text-right text-slate-600 font-mono">
                      ₹{line.price}
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-900 font-mono">
                      ₹{line.price * line.qty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="py-4 border-b border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-mono font-medium">₹{order.subtotal}</span>
            </div>

            {order.transferAmount && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Transfer Remittance Principal</span>
                  <span className="font-mono font-bold text-slate-800">₹{order.transferAmount}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Merchant Remittance Service Fee</span>
                  <span className="font-mono">₹{order.serviceFee || 0}</span>
                </div>
              </>
            )}

            <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Total Net Payable:</span>
              <span className="text-2xl font-black text-[#0a1538] font-display">
                ₹{order.total}
              </span>
            </div>
          </div>

          {/* Barcode Verification Section */}
          <div className="py-4 border-b border-slate-200 flex flex-col items-center justify-center text-center barcode-section">
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Official Verification Barcode
            </div>
            <div className="inline-block p-1.5 sm:p-2 rounded-lg bg-slate-50 border border-slate-200">
              <svg className={`${receiptMode === 'thermal' ? 'w-36 h-7' : 'w-48 h-10'}`} viewBox="0 0 160 36">
                <rect x="0" y="0" width="160" height="36" fill="#f8fafc" />
                <g fill="#0f172a">
                  <rect x="4" y="2" width="2" height="32" />
                  <rect x="8" y="2" width="1" height="32" />
                  <rect x="11" y="2" width="3" height="32" />
                  <rect x="16" y="2" width="1" height="32" />
                  <rect x="19" y="2" width="2" height="32" />
                  <rect x="23" y="2" width="4" height="32" />
                  <rect x="29" y="2" width="1" height="32" />
                  <rect x="32" y="2" width="2" height="32" />
                  <rect x="36" y="2" width="3" height="32" />
                  <rect x="42" y="2" width="1" height="32" />
                  <rect x="45" y="2" width="4" height="32" />
                  <rect x="51" y="2" width="2" height="32" />
                  <rect x="55" y="2" width="1" height="32" />
                  <rect x="58" y="2" width="3" height="32" />
                  <rect x="63" y="2" width="1" height="32" />
                  <rect x="66" y="2" width="2" height="32" />
                  <rect x="70" y="2" width="4" height="32" />
                  <rect x="76" y="2" width="2" height="32" />
                  <rect x="80" y="2" width="1" height="32" />
                  <rect x="83" y="2" width="3" height="32" />
                  <rect x="88" y="2" width="2" height="32" />
                  <rect x="92" y="2" width="4" height="32" />
                  <rect x="98" y="2" width="1" height="32" />
                  <rect x="101" y="2" width="2" height="32" />
                  <rect x="105" y="2" width="3" height="32" />
                  <rect x="110" y="2" width="2" height="32" />
                  <rect x="114" y="2" width="1" height="32" />
                  <rect x="117" y="2" width="3" height="32" />
                  <rect x="122" y="2" width="2" height="32" />
                  <rect x="126" y="2" width="4" height="32" />
                  <rect x="132" y="2" width="1" height="32" />
                  <rect x="135" y="2" width="2" height="32" />
                  <rect x="139" y="2" width="3" height="32" />
                  <rect x="144" y="2" width="1" height="32" />
                  <rect x="147" y="2" width="3" height="32" />
                  <rect x="152" y="2" width="2" height="32" />
                </g>
              </svg>
              <div className="text-[10px] font-mono text-center tracking-widest text-slate-700 mt-1 font-bold">
                *{order.receiptNumber}*
              </div>
            </div>
          </div>

          {/* Terms & Authorized Signatory */}
          <div className={`pt-4 flex ${
            receiptMode === 'thermal'
              ? 'flex-col items-center text-center gap-3'
              : 'flex-col sm:flex-row items-start sm:items-end justify-between gap-6'
          } text-xs text-slate-500`}>
            <div className={`space-y-1 text-[11px] ${receiptMode === 'thermal' ? 'text-center' : 'max-w-sm'}`}>
              <p className="font-bold text-slate-800">Thank you for visiting JM Enterprises!</p>
              <p>• Goods once sold can be exchanged within 2 days with original receipt and non refundable</p>
            </div>

            <div className={`text-center ${receiptMode === 'thermal' ? 'w-full pt-1' : 'sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto'}`}>
              <div className="h-6"></div>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Authorized Signatory &amp; Stamp
              </div>
              <div className="text-[10px] text-slate-500">JM Enterprises · Authorized Store Counter</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BOTTOM PRINT ACTION: Only Print Receipt Button Centered Below Receipt
         ======================================================== */}
      {order && (
        <div className="no-print mt-6 flex justify-center items-center">
          <button
            type="button"
            onClick={() => executePrint()}
            disabled={isPrinting}
            className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 active:scale-95 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/25 border border-amber-300 transition-all cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-5 h-5 text-slate-950" />
            <span>{isPrinting ? 'Printing...' : 'Print Receipt'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
