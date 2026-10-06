// Phone numbers as typed by staff ("1 (315) 555-0123", "+353 87 123 4567").

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** True when the number carries a country code, which Call and WhatsApp need from abroad. */
export function isInternational(phone: string): boolean {
  const digits = phoneDigits(phone);
  return /^\s*(\+|00)/.test(phone) || (digits.length >= 11 && !digits.startsWith("0"));
}

export function telHref(phone: string): string | null {
  const digits = phoneDigits(phone).replace(/^00/, "");
  if (digits.length < 6) return null;
  return `tel:${isInternational(phone) ? "+" : ""}${digits}`;
}

export function whatsappHref(phone: string): string | null {
  const digits = phoneDigits(phone).replace(/^00/, "");
  if (digits.length < 8 || !isInternational(phone)) return null;
  return `https://wa.me/${digits}`;
}
