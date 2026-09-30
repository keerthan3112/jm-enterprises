import React from 'react';
import { Phone, Mail, MapPin, Clock, ShieldCheck, ArrowUpRight, MessageCircle } from 'lucide-react';
import { STORE_PHONE, getWhatsAppUrl } from '../utils/whatsapp';

export const Footer: React.FC = () => {
  return (
    <footer className="no-print border-t border-slate-200 bg-white text-slate-600 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#1d2547] text-amber-400 flex items-center justify-center font-brand font-black text-base shadow-xs">
                JM
              </div>
              <h3 className="font-display font-extrabold text-lg text-[#1d2547]">
                JM ENTERPRISES
              </h3>
            </div>
            <p className="text-xs max-w-sm leading-relaxed text-slate-500">
              Your trusted shop for instant Xerox &amp; Laser printing (B&amp;W ₹2, Colour ₹10), passport size photos, project spiral binding, and domestic money transfer services with computerized printed receipts.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Verified Store &amp; Instant Computerized Printed Receipts</span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-900">
              Store Contact
            </h4>
            <div className="space-y-1.5">
              <p className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366] fill-[#25D366] flex-shrink-0" />
                <a 
                  href={getWhatsAppUrl()} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                >
                  <span>WhatsApp: {STORE_PHONE}</span>
                  <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <a href="tel:8747991688" className="hover:text-amber-700 font-medium">
                  Call: {STORE_PHONE}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <a href="mailto:jm.enterprises.3112@gmail.com" className="hover:text-amber-700 break-all font-medium">
                  jm.enterprises.3112@gmail.com
                </a>
              </p>
              <p className="flex items-center gap-2 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <a 
                  href="https://maps.app.goo.gl/f5GFb2hiNUnub8mE6?g_st=ac" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-amber-700 font-medium text-slate-800"
                >
                  <span>Google Maps Location</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-900">
              Working Hours
            </h4>
            <div className="space-y-1 text-slate-500">
              <p className="flex items-center gap-1.5 font-bold text-slate-800">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Monday – Sunday
              </p>
              <p className="font-medium">8:30 AM – 9:30 PM (All 7 Days)</p>
              <p className="text-[11px] text-slate-400 pt-1">
                Printouts, copies, and money transfers handled continuously.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} JM Enterprises. All rights reserved.</p>
          <p>Web developed by <strong className="font-semibold text-slate-600">NaNu</strong></p>
        </div>
      </div>
    </footer>
  );
};
