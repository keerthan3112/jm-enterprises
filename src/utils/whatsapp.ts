/**
 * WhatsApp Direct Contact Utility for JM Enterprises
 * Official Store Contact: 8747991688 / +91 8747991688
 */

export const STORE_PHONE = '8747991688';
export const STORE_PHONE_INTL = '+91 8747991688';
export const STORE_WHATSAPP_NUMBER = '918747991688';
export const STORE_EMAIL = 'jm.enterprises.3112@gmail.com';
export const STORE_MAPS_LINK = 'https://maps.app.goo.gl/f5GFb2hiNUnub8mE6?g_st=ac';

// Security Morphed / Masked Representations for UI
export const STORE_PHONE_MASKED = '8747••••88';
export const STORE_PHONE_INTL_MASKED = '+91 8747••••88';

/**
 * Morphs/masks any phone number to prevent full plain-text exposure on UI
 * Example: 8747991688 -> 8747••••88
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    return `${last10.slice(0, 4)}••••${last10.slice(-2)}`;
  }
  if (digits.length >= 6) {
    return `${digits.slice(0, 2)}••••${digits.slice(-2)}`;
  }
  return '••••••••';
}

export function getWhatsAppUrl(customQuery?: string): string {
  const baseGreeting = 'Hello JM Enterprises, ';
  const message = customQuery?.trim()
    ? `${baseGreeting}I have a query: ${customQuery.trim()}`
    : `${baseGreeting}I would like to inquire about your stationery, xerox/print services, or my order.`;
  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppDirect(customQuery?: string): void {
  const url = getWhatsAppUrl(customQuery);
  window.open(url, '_blank', 'noopener,noreferrer');
}
