/**
 * Formatting utilities for Eyadati Dental Clinic Management System
 * Conforms to medical and financial architectural constraints.
 */

/**
 * Formats monetary amounts stored as integer halalas/cents into SAR string.
 * All financial amounts are stored as integers (halalas) and divided by 100 for display.
 * @example formatCurrency(350000) => "3,500 ريال"
 */
export function formatCurrency(halalas: number): string {
  const riyals = halalas / 100;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: riyals % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(riyals);
  return `${formatted} ريال`;
}

export const formatCurrencyHalalas = formatCurrency;

/**
 * Formats a date to full Arabic string with Gregorian month name and Latin numerals.
 * @example formatDateAr(new Date("2023-10-14")) => "السبت، 14 أكتوبر 2023"
 */
export function formatDateAr(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Formats a time to 12-hour format in Arabic with Latin numerals.
 * @example formatTime(new Date("2023-10-14T09:00:00Z")) => "09:00 ص"
 */
export function formatTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('ar-SA-u-nu-latn', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Converts a Gregorian date into Umm al-Qura Hijri representation with Arabic month and Latin numerals.
 * @example toHijri(new Date("2023-10-14")) => "29 ربيع الأول 1445 هـ"
 */
export function toHijri(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  const formatted = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
  return `${formatted} هـ`;
}

/**
 * Formats patient sequential numbering into standardized patient code (e.g. P12345).
 * @example formatPatientCode(12345) => "P12345"
 * @example formatPatientCode(42) => "P00042"
 */
export function formatPatientCode(n: number | string): string {
  if (typeof n === 'string' && n.startsWith('P')) {
    return n;
  }
  const numericPart = String(n).replace(/\D/g, '');
  return `P${numericPart.padStart(5, '0')}`;
}
