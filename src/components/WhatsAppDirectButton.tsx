import React from 'react';
import { MessageCircle, ArrowUpRight } from 'lucide-react';
import { STORE_PHONE, getWhatsAppUrl } from '../utils/whatsapp';

interface WhatsAppDirectButtonProps {
  customQuery?: string;
  variant?: 'header' | 'floating' | 'banner' | 'inline';
  className?: string;
  label?: string;
}

export const WhatsAppDirectButton: React.FC<WhatsAppDirectButtonProps> = ({
  customQuery,
  variant = 'inline',
  className = '',
  label,
}) => {
  const url = getWhatsAppUrl(customQuery);

  if (variant === 'header') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title="Direct WhatsApp Support: 8747991688"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-sm transition-all border border-emerald-400/40 hover:shadow-emerald-500/25 active:scale-95 group ${className}`}
      >
        <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <MessageCircle className="w-3 h-3 text-white fill-white/80" />
        </div>
        <span className="hidden sm:inline font-display">{label || 'WhatsApp Us'}</span>
        <span className="sm:hidden font-display">{label || 'WhatsApp'}</span>
        <span className="text-[10px] text-emerald-100/90 font-mono hidden md:inline">8747991688</span>
      </a>
    );
  }

  if (variant === 'floating') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title="Direct WhatsApp Query: 8747991688"
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer border border-emerald-300 active:scale-95 group ${className}`}
      >
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <MessageCircle className="w-4 h-4 text-white fill-white" />
        </div>
        <div className="text-left leading-tight pr-1">
          <div className="text-[11px] font-black uppercase tracking-wider text-emerald-950/80">Direct Query</div>
          <div className="text-xs font-black">WhatsApp 8747991688</div>
        </div>
        <ArrowUpRight className="w-3.5 h-3.5 text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </a>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-900/90 via-[#0d2a23] to-[#0a1538] text-white border border-emerald-500/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 shrink-0">
            <MessageCircle className="w-6 h-6 fill-white text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-extrabold text-white font-display">
                Direct WhatsApp Customer Help &amp; Print Service
              </h4>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40">
                Online
              </span>
            </div>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              Send documents for xerox/print, check notebook stock, or ask any query directly to store owner: <strong>{STORE_PHONE}</strong>
            </p>
          </div>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 fill-slate-950 text-slate-950" />
          <span>Chat on WhatsApp Now</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-emerald-800 dark:text-emerald-300 border border-emerald-400/40 text-xs font-bold transition-all cursor-pointer ${className}`}
    >
      <MessageCircle className="w-3.5 h-3.5 text-[#25D366] fill-[#25D366]" />
      <span>{label || 'Ask on WhatsApp'}</span>
      <ArrowUpRight className="w-3 h-3 text-emerald-600" />
    </a>
  );
};
