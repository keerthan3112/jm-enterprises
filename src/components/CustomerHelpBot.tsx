import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  MessageCircle, 
  Sparkles, 
  ChevronDown, 
  RefreshCw, 
  ArrowUpRight,
  ExternalLink,
  ShoppingBag,
  Clock,
  Phone,
  HelpCircle,
  FileText
} from 'lucide-react';
import { ChatMessage, ChatQuickAction } from '../types';
import { api } from '../services/api';
import { STORE_PHONE, STORE_PHONE_INTL, getWhatsAppUrl, openWhatsAppDirect } from '../utils/whatsapp';

interface CustomerHelpBotProps {
  onNavigateToShop?: () => void;
  onNavigateToAccount?: () => void;
}

const INITIAL_QUICK_CHIPS: Array<{ label: string; query: string; icon?: React.ReactNode }> = [
  { label: '📄 Xerox Rates', query: 'What are your xerox and photocopy rates?', icon: <FileText className="w-3 h-3" /> },
  { label: '🖨️ Printing & Photos', query: 'What are your laser printing and photo rates?', icon: <FileText className="w-3 h-3" /> },
  { label: '📓 Notebooks & Registers', query: 'Tell me about available notebooks and registers', icon: <ShoppingBag className="w-3 h-3" /> },
  { label: '🖊️ Brand Pens & Inks', query: 'What pen brands and ink colors do you sell?', icon: <ShoppingBag className="w-3 h-3" /> },
  { label: '💸 Money Transfer', query: 'How does domestic money transfer work and what are charges?', icon: <HelpCircle className="w-3 h-3" /> },
  { label: '📦 Track Order', query: 'How can I track my order status?', icon: <Clock className="w-3 h-3" /> },
  { label: '🕒 Timings & Location', query: 'What are your store timings and location?', icon: <Phone className="w-3 h-3" /> },
  { label: '💬 WhatsApp Store Owner', query: 'Connect me to store owner on WhatsApp', icon: <MessageCircle className="w-3 h-3" /> },
];

export const CustomerHelpBot: React.FC<CustomerHelpBotProps> = ({
  onNavigateToShop,
  onNavigateToAccount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: `👋 Hello! Welcome to **JM Enterprises Store Help**!\n\nI'm your 24x7 Store Assistant. Ask me anything about:\n• **Xerox & Printouts:** B&W (₹2/page), Colour (₹10/page), Laser prints & photos\n• **Stationery:** Notebooks, Long Books, Accounts Registers & Brand Pens (Cello, Reynolds, Pentonic, Pilot, Parker)\n• **Money Transfer:** Domestic IMPS / NEFT to all Indian bank accounts\n• **Order Tracking:** Check order status with receipt number or phone\n\nNeed immediate human support? You can also message our store owner directly on WhatsApp at **${STORE_PHONE}**!`,
      timestamp: Date.now(),
      quickActions: [
        { label: 'Direct WhatsApp (8747991688)', actionType: 'whatsapp', payload: 'Hello JM Enterprises, I need help.' },
        { label: '📄 Xerox Rates', actionType: 'query', payload: 'What are your xerox rates?' },
        { label: '💸 Money Transfer', actionType: 'query', payload: 'Tell me about domestic money transfer' },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      // Build conversation history
      const history = messages.slice(-4).map((m) => ({
        role: (m.sender === 'bot' ? 'model' : 'user') as 'model' | 'user',
        text: m.text,
      }));

      const res = await api.askHelpBot(text, history);

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.reply,
        timestamp: Date.now(),
        quickActions: res.quickActions || [
          { label: 'Chat on WhatsApp', actionType: 'whatsapp', payload: text },
        ],
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Bot query failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: `You can reach our store owner directly on WhatsApp or call at **${STORE_PHONE}**.\n\nWe can answer all queries regarding xerox, printing, stationery stock, and money transfers right away.`,
          timestamp: Date.now(),
          quickActions: [
            { label: 'Open WhatsApp (8747991688)', actionType: 'whatsapp', payload: text },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: ChatQuickAction) => {
    if (action.actionType === 'whatsapp') {
      openWhatsAppDirect(action.payload);
    } else if (action.actionType === 'view_shop' && onNavigateToShop) {
      onNavigateToShop();
      setIsOpen(false);
    } else if (action.actionType === 'view_account' && onNavigateToAccount) {
      onNavigateToAccount();
      setIsOpen(false);
    } else if (action.actionType === 'query' && action.payload) {
      handleSendMessage(action.payload);
    }
  };

  // Helper to format text with simple markdown formatting (bold, bullets)
  const formatText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Process bold **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-extrabold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <span key={idx} className="block min-h-[1.1rem]">
          {formattedParts}
        </span>
      );
    });
  };

  return (
    <div className="no-print fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-40 flex flex-col items-end pointer-events-auto">
      {/* 1. CHAT WINDOW CONTAINER */}
      {isOpen && (
        <div className="w-[calc(100vw-24px)] sm:w-[410px] h-[550px] max-h-[82vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#0a1538] via-[#12245b] to-[#0a1538] text-white flex items-center justify-between border-b border-[#233878] shadow-xs shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md">
                  <Bot className="w-5 h-5 text-slate-950" />
                </div>
                <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0a1538] absolute -bottom-0.5 -right-0.5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-extrabold text-white font-display truncate">
                    JM Store Help Bot
                  </h3>
                  <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-blue-200/80 truncate">
                  Instant Xerox, Print, Pens &amp; Order queries
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* WhatsApp Quick Switch Button */}
              <button
                type="button"
                onClick={() => openWhatsAppDirect()}
                title="Direct chat on WhatsApp (8747991688)"
                className="p-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-slate-950 text-xs font-bold transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-slate-950" />
                <span className="hidden sm:inline text-[10px]">WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Persistent Store WhatsApp Direct Banner */}
          <div className="px-3.5 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200/80 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-950 font-medium truncate">
              <span className="w-2 h-2 rounded-full bg-[#25D366] shrink-0" />
              <span className="truncate">Direct Store WhatsApp: <strong>{STORE_PHONE_INTL}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => openWhatsAppDirect(inputQuery)}
              className="text-[11px] font-black text-emerald-800 hover:text-emerald-950 underline flex items-center gap-0.5 shrink-0 cursor-pointer"
            >
              <span>Chat</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 bg-slate-50/60 text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5 max-w-[88%] ${isUser ? 'ml-auto' : 'mr-auto'}`}
                >
                  <div
                    className={`p-3 rounded-2xl leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-gradient-to-r from-[#0a1538] to-[#172960] text-white rounded-br-xs font-medium'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                    }`}
                  >
                    <div className="space-y-1">{formatText(msg.text)}</div>
                  </div>

                  {/* Message Timestamp */}
                  <span className="text-[10px] text-slate-400 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {/* Quick Action Chips attached to Bot response */}
                  {!isUser && msg.quickActions && msg.quickActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {msg.quickActions.map((action, aIdx) => {
                        const isWhatsApp = action.actionType === 'whatsapp';
                        return (
                          <button
                            key={aIdx}
                            type="button"
                            onClick={() => handleActionClick(action)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 border ${
                              isWhatsApp
                                ? 'bg-[#25D366]/15 hover:bg-[#25D366]/25 text-emerald-900 border-emerald-300'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
                            }`}
                          >
                            {isWhatsApp ? (
                              <MessageCircle className="w-3 h-3 text-[#25D366] fill-[#25D366]" />
                            ) : (
                              <Sparkles className="w-3 h-3 text-amber-500" />
                            )}
                            <span>{action.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs bg-white p-2.5 rounded-2xl border border-slate-200 w-fit shadow-2xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span className="font-semibold text-[11px]">JM Bot is finding information...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips Carousel */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">Quick:</span>
            {INITIAL_QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip.query)}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
              >
                {chip.icon}
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything (e.g. Xerox rate, pens, track order)..."
              disabled={loading}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0a1538] focus:border-transparent bg-slate-50 focus:bg-white text-slate-900 transition-all font-medium"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-[#0a1538] to-[#1c357c] hover:from-[#122254] hover:to-[#2547a4] disabled:opacity-40 text-white cursor-pointer transition-all active:scale-95 shrink-0 shadow-sm"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* 2. FLOATING CONTROLS DOCK (Always visible at bottom right) */}
      <div className="flex items-center gap-2.5">
        {/* WhatsApp Direct Action Pill */}
        <a
          href={getWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          title="Direct WhatsApp with Store Owner (8747991688)"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-black text-xs shadow-xl hover:shadow-2xl transition-all cursor-pointer border-2 border-white hover:scale-105 active:scale-95 group"
        >
          <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center shrink-0">
            <MessageCircle className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
          </div>
          <span className="hidden sm:inline">WhatsApp Us</span>
          <span className="sm:hidden">WhatsApp</span>
        </a>

        {/* JM Customer Help Bot Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-xl hover:shadow-2xl transition-all cursor-pointer border-2 border-white hover:scale-105 active:scale-95 ${
            isOpen
              ? 'bg-[#0a1538] text-amber-300 ring-2 ring-amber-400/40'
              : 'bg-gradient-to-r from-[#0a1538] via-[#12245b] to-[#1a3582] text-white hover:border-amber-400'
          }`}
          title="Open JM Store Customer Help Bot"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a1538] absolute -top-1 -right-1 animate-ping" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a1538] absolute -top-1 -right-1" />
          </div>
          <div className="text-left leading-none pr-0.5">
            <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Help Bot</div>
            <div className="text-xs font-black">{isOpen ? 'Close' : 'Ask Query'}</div>
          </div>
        </button>
      </div>
    </div>
  );
};
