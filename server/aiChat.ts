import { db } from './db.js';
import { ChatQuickAction } from '../src/types.js';


const STORE_INFO = {
  name: 'JM Enterprises',
  phone: '8747991688',
  phoneIntl: '+91 8747991688',
  whatsappUrl: 'https://wa.me/918747991688',
  email: 'jm.enterprises.3112@gmail.com',
  hours: 'Monday to Sunday, 8:30 AM – 9:30 PM (All 7 Days open)',
  location: 'Google Maps: https://maps.app.goo.gl/f5GFb2hiNUnub8mE6?g_st=ac',
  services: {
    xerox: [
      'B&W Xerox / Photocopy: ₹2 / page (Back-to-back: ₹3)',
      'Colour Xerox / Photocopy: ₹10 / page',
      'Legal Size Xerox: ₹3 / page',
      'Certificate / ID Card Xerox: ₹5 / page',
    ],
    printing: [
      'B&W Laser Printout (A4): ₹5 / page (from WhatsApp / Email / Pen-drive)',
      'Colour Printout (A4): ₹15 / page',
      'Passport Size Photo (Set of 8 glossy photos): ₹30 / set',
      'Document Lamination (A4): ₹20 / sheet',
      'Spiral Binding with Transparent Sheet: ₹40 / book',
      'ID Card Print & Hard Lamination: ₹50 / card',
    ],
    moneyTransfer: [
      'Instant Domestic Money Transfer (IMPS / NEFT) to ANY bank account in India 24x7',
      'Very nominal service fee (e.g. ₹10 for transfers up to ₹1,000, ₹20 up to ₹5,000)',
      'Instant computerized printed receipt with UTR / Reference ID',
    ],
    stationery: [
      'Notebooks: Standard, Long Book, King Size, 4-Line, 2-Line, Single Line, Unruled',
      'Page Counts: 100 pages, 140 pages, 172 pages, 200 pages, and 1Q to 5Q Hardbound Accounts Registers',
      'Brand Pens: Cello (Butterflow ₹10, Gripper ₹15, Maxriter ₹10, Technotip ₹10, Geltech ₹15)',
      'Reynolds: 045 Fine Carbure ₹10, Jetter ₹30, Liquiflo ₹10, Racer Gel ₹15',
      'Hauser: XO Ball ₹10, Germany Carbon Fluid ₹15, Aerogel ₹20',
      'Linc Pentonic: Classic Ball ₹10, Frost Gel ₹20, BRT Retractable ₹15',
      'Flair: Writometer 10,000m ₹25, Glass Gel ₹15, Carbonix ₹15',
      'Pilot: V5 Hi-Tecpoint 0.5mm ₹50, V7 0.7mm ₹60, G2 Retractable ₹65',
      'Parker & Premium: Vector Rollerball ₹250, Jotter Ballpoint ₹200, Quink Fountain Pen Ink (60ml) ₹120',
      'Other supplies: Pencils, Erasers, Geometry Box, Highlighters, Staplers, Fevicol, Chart Papers',
    ]
  }
};

/**
 * Intelligent Fallback Responder when API is unavailable or for instant replies
 */
function getSmartFallbackReply(query: string): { reply: string; quickActions: ChatQuickAction[] } {
  const q = query.toLowerCase().trim();

  // Order tracking query
  const receiptMatch = query.match(/(?:bill|receipt|ref|order)?\s*#?([a-zA-Z0-9_-]{3,20})/i);
  const phoneMatch = query.match(/\b\d{10}\b/);

  if (q.includes('order') || q.includes('track') || q.includes('receipt') || q.includes('bill') || phoneMatch) {
    const orders = db.getOrders();
    let foundOrder = null;

    if (phoneMatch) {
      foundOrder = orders.find(o => o.customerPhone.includes(phoneMatch[0]));
    }
    if (!foundOrder && receiptMatch) {
      const target = receiptMatch[1].toLowerCase();
      foundOrder = orders.find(o => 
        o.receiptNumber.toLowerCase().includes(target) || 
        o.id.toLowerCase().includes(target)
      );
    }

    if (foundOrder) {
      const itemsList = foundOrder.lines.map(l => `${l.name} (x${l.qty})`).join(', ');
      return {
        reply: `📦 **Order Found (#${foundOrder.receiptNumber})**\n- **Customer:** ${foundOrder.customerName} (${foundOrder.customerPhone})\n- **Status:** **${foundOrder.status.toUpperCase()}**\n- **Total:** ₹${foundOrder.total} (${foundOrder.paymentMethod.toUpperCase()})\n- **Items:** ${itemsList || 'Services'}\n- **Date:** ${new Date(foundOrder.createdAt).toLocaleDateString('en-IN')}\n\nNeed to update or inquire about this order? Contact store on WhatsApp directly!`,
        quickActions: [
          { label: 'Chat on WhatsApp', actionType: 'whatsapp', payload: `Inquiry regarding Order #${foundOrder.receiptNumber}` },
          { label: 'View My Dashboard', actionType: 'view_account' },
        ]
      };
    }
  }

  // Xerox & photocopy rates
  if (q.includes('xerox') || q.includes('photocopy') || q.includes('zerox') || q.includes('copy')) {
    return {
      reply: `📄 **JM Enterprises Xerox Rates:**\n• **B&W Xerox (A4):** ₹2 per page (Back-to-back: ₹3)\n• **Colour Xerox (A4):** ₹10 per page\n• **Legal Size Xerox:** ₹3 per page\n• **ID / Certificate Xerox:** ₹5 per page\n\nHigh-speed crisp copies on 75 GSM paper. You can also send files directly to our WhatsApp (${STORE_INFO.phone}) for quick print!`,
      quickActions: [
        { label: 'Send Files on WhatsApp', actionType: 'whatsapp', payload: 'Hello, I want to send files for Xerox / Photocopy.' },
        { label: 'Browse Xerox Services', actionType: 'view_shop' }
      ]
    };
  }

  // Printing & photo lamination
  if (q.includes('print') || q.includes('photo') || q.includes('spiral') || q.includes('binding') || q.includes('lamination')) {
    return {
      reply: `🖨️ **Printing & Binding Services:**\n• **B&W Laser Printout (A4):** ₹5 per page\n• **Colour Laser Printout (A4):** ₹15 per page\n• **Passport Size Photos (Set of 8):** ₹30\n• **Document Lamination (A4):** ₹20 per sheet\n• **Spiral Binding with Cover:** ₹40 per book\n• **ID Card Print & Lamination:** ₹50 per card\n\nDirect printout available via WhatsApp or Pen-drive!`,
      quickActions: [
        { label: 'Send Document on WhatsApp', actionType: 'whatsapp', payload: 'Hello, I have documents to print out at JM Enterprises.' },
        { label: 'Order Online', actionType: 'view_shop' }
      ]
    };
  }

  // Money transfer
  if (q.includes('transfer') || q.includes('money') || q.includes('imps') || q.includes('neft') || q.includes('bank') || q.includes('cash')) {
    return {
      reply: `💸 **Domestic Money Transfer at JM Enterprises:**\n• Instant IMPS / NEFT transfer to **any Indian Bank Account**.\n• Service fee is very nominal (₹10 for transfers up to ₹1,000, ₹20 up to ₹5,000).\n• 100% verified with computerized counter receipt and UTR / Reference ID.\n• Available 7 days a week at our store counter!`,
      quickActions: [
        { label: 'Inquire on WhatsApp', actionType: 'whatsapp', payload: 'Hello, I want to inquire about domestic money transfer.' },
        { label: 'New Transfer Online', actionType: 'view_shop' }
      ]
    };
  }

  // Notebooks and registers
  if (q.includes('notebook') || q.includes('book') || q.includes('register') || q.includes('quire') || q.includes('ruling') || q.includes('pages')) {
    return {
      reply: `📓 **Notebooks & Registers:**\n• Standard, Long Books, King Size & Softbound / Hardbound.\n• Available Rulings: Single Line, 4-Line (English), 2-Line (Hindi), Square Grid (Math), Unruled / Plain.\n• Page Counts: 100p, 140p, 172p, 200p, plus heavy 1 Quire (1Q) to 5 Quire (5Q) accounts registers.\n• Brands: Classmate, Navneet, Sundaram, and JM Store selections.`,
      quickActions: [
        { label: 'Explore Notebooks in Shop', actionType: 'view_shop' },
        { label: 'Ask Available Stock on WhatsApp', actionType: 'whatsapp', payload: 'Hello, what notebook sizes and registers are in stock today?' }
      ]
    };
  }

  // Pens
  if (q.includes('pen') || q.includes('cello') || q.includes('reynolds') || q.includes('hauser') || q.includes('pentonic') || q.includes('flair') || q.includes('pilot') || q.includes('parker') || q.includes('ink')) {
    return {
      reply: `🖊️ **Brand Pens & Inks at JM Enterprises:**\n• **Cello:** Butterflow (₹10), Gripper (₹15), Maxriter (₹10), Technotip (₹10), Geltech (₹15)\n• **Reynolds:** 045 Carbure (₹10), Jetter (₹30), Liquiflo (₹10)\n• **Hauser:** XO Ball (₹10), Germany Carbon Fluid (₹15)\n• **Pentonic:** Black Classic (₹10), Frost Gel (₹20)\n• **Pilot & Parker:** Pilot V5/V7 Hi-Tecpoint (₹50/₹60), Parker Vector Roller (₹250), Parker Quink 60ml (₹120)\n• Inks available in Blue, Black, Red, and Green.`,
      quickActions: [
        { label: 'Browse Pens in Shop', actionType: 'view_shop' },
        { label: 'WhatsApp for Bulk Pen Orders', actionType: 'whatsapp', payload: 'Hello, I want to order brand pens in bulk from JM Enterprises.' }
      ]
    };
  }

  // Timings & Location
  if (q.includes('time') || q.includes('timing') || q.includes('open') || q.includes('close') || q.includes('location') || q.includes('address') || q.includes('where')) {
    return {
      reply: `📍 **Store Timings & Location:**\n• **Working Hours:** Monday to Sunday, 8:30 AM – 9:30 PM (Open 7 days a week)\n• **Phone / WhatsApp:** 8747991688\n• **Email:** jm.enterprises.3112@gmail.com\n• **Google Maps:** [Click here to view directions](https://maps.app.goo.gl/f5GFb2hiNUnub8mE6?g_st=ac)`,
      quickActions: [
        { label: 'Chat on WhatsApp', actionType: 'whatsapp', payload: 'Hello, are you open right now at JM Enterprises?' },
        { label: 'Store on Google Maps', actionType: 'whatsapp', payload: 'Send location link' }
      ]
    };
  }

  // Default welcoming reply
  return {
    reply: `Hello! Welcome to **JM Enterprises**.\n\nWe provide:\n• **Xerox & Copies:** B&W (₹2/page), Colour (₹10/page)\n• **Laser Printing:** Documents, project reports, passport photos & lamination\n• **Domestic Money Transfer:** Instant 24x7 to any bank account\n• **Stationery:** Full range of notebooks, registers & brand pens (Cello, Reynolds, Hauser, Pentonic, Pilot, Parker)\n\n📞 **WhatsApp & Call:** **8747991688**\nHow can I help you today? You can type your query or click below to message us directly on WhatsApp!`,
    quickActions: [
      { label: 'Direct WhatsApp to Store (8747991688)', actionType: 'whatsapp', payload: query },
      { label: '📄 Xerox Rates', actionType: 'query', payload: 'What are your xerox rates?' },
      { label: '🖨️ Printing & Photos', actionType: 'query', payload: 'What are your printing and binding rates?' },
      { label: '💸 Money Transfer', actionType: 'query', payload: 'Tell me about domestic money transfer' },
    ]
  };
}

/**
 * Handle customer queries entirely locally.
 *
 * This intentionally uses the built-in store knowledge base and database only.
 * No cloud AI provider, API key, or network request is required for chat.
 */
export async function handleCustomerChat(message: string, _history: Array<{ role: 'user' | 'model'; text: string }> = []) {
  const cleanMsg = message.trim();
  if (!cleanMsg) {
    return {
      reply: 'Please ask any question about JM Enterprises products, Xerox rates, printing, money transfer, or your order!',
      quickActions: [
        { label: 'Chat on WhatsApp', actionType: 'whatsapp' as const }
      ]
    };
  }

  const qLower = cleanMsg.toLowerCase();

  // Direct human/store contact is handled locally.
  if (qLower.includes('whatsapp') || qLower.includes('human') || qLower.includes('owner') || qLower.includes('call') || qLower.includes('contact number')) {
    return {
      reply: `You can reach the store owner directly on WhatsApp or call at **8747991688** (+91 8747991688).\n\nClick the button below to start a direct WhatsApp chat with your query: "${cleanMsg}"!`,
      quickActions: [
        { label: 'Open WhatsApp Chat Now', actionType: 'whatsapp' as const, payload: cleanMsg },
        { label: 'Browse Products', actionType: 'view_shop' as const }
      ]
    };
  }

  return getSmartFallbackReply(cleanMsg);
}
