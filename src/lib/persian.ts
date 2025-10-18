/**
 * Persian utilities for the inventory management system
 */

import jalaali from 'jalaali-js';

// Persian to English number mapping
const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Convert Persian numbers to English
 */
export function persianToEnglish(str: string): string {
  let result = str;
  for (let i = 0; i < persianNumbers.length; i++) {
    result = result.replace(new RegExp(persianNumbers[i], 'g'), englishNumbers[i]);
  }
  return result;
}

/**
 * Convert English numbers to Persian
 */
export function englishToPersian(str: string | number): string {
  let result = str.toString();
  for (let i = 0; i < englishNumbers.length; i++) {
    result = result.replace(new RegExp(englishNumbers[i], 'g'), persianNumbers[i]);
  }
  return result;
}

/**
 * Format number with Persian digits and thousand separators
 */
export function formatPersianNumber(num: number): string {
  const formatted = num.toLocaleString('fa-IR');
  return englishToPersian(formatted);
}

/**
 * Format currency with Persian digits
 */
export function formatPersianCurrency(amount: number, currency = 'ریال'): string {
  const formatted = formatPersianNumber(amount);
  return `${formatted} ${currency}`;
}

/**
 * Persian date formatter using Intl
 */
export function formatPersianDate(date: Date): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'persian'
  }).format(date);
}

/**
 * Persian short date formatter
 */
export function formatPersianShortDate(date: Date): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    calendar: 'persian'
  }).format(date);
}

/**
 * Convert Gregorian date to Persian calendar
 */
export function gregorianToPersian(date: Date): string {
  return formatPersianDate(date);
}

/**
 * Convert Gregorian date to Jalaali (Persian) date object
 */
export function gregorianToJalaali(date: Date): { jy: number; jm: number; jd: number } {
  return jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * Convert Jalaali (Persian) date to Gregorian date
 */
export function jalaaliToGregorian(jy: number, jm: number, jd: number): Date {
  const gregorian = jalaali.toGregorian(jy, jm, jd);
  return new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd);
}

/**
 * Parse Persian date string (YYYY/MM/DD) to Gregorian Date
 */
export function parsePersianDate(persianDateStr: string): Date | null {
  try {
    const normalizedStr = persianToEnglish(persianDateStr.trim());
    const parts = normalizedStr.split('/');
    
    if (parts.length !== 3) return null;
    
    const jy = parseInt(parts[0]);
    const jm = parseInt(parts[1]);
    const jd = parseInt(parts[2]);
    
    if (isNaN(jy) || isNaN(jm) || isNaN(jd)) return null;
    if (jm < 1 || jm > 12 || jd < 1) return null;
    
    // Check if day is valid for the specific month and year
    const maxDaysInMonth = getPersianMonthDays(jy, jm);
    if (jd > maxDaysInMonth) return null;
    
    return jalaaliToGregorian(jy, jm, jd);
  } catch {
    return null;
  }
}

/**
 * Format Gregorian date to Persian date string (YYYY/MM/DD)
 */
export function formatPersianDateString(date: Date): string {
  const jalaaliDate = gregorianToJalaali(date);
  const year = englishToPersian(jalaaliDate.jy.toString().padStart(4, '0'));
  const month = englishToPersian(jalaaliDate.jm.toString().padStart(2, '0'));
  const day = englishToPersian(jalaaliDate.jd.toString().padStart(2, '0'));
  return `${year}/${month}/${day}`;
}

/**
 * Get Persian date components from Gregorian date
 */
export function getPersianDateComponents(date: Date): {
  year: number;
  month: number;
  day: number;
  yearStr: string;
  monthStr: string;
  dayStr: string;
  monthName: string;
} {
  const jalaaliDate = gregorianToJalaali(date);
  return {
    year: jalaaliDate.jy,
    month: jalaaliDate.jm,
    day: jalaaliDate.jd,
    yearStr: englishToPersian(jalaaliDate.jy.toString()),
    monthStr: englishToPersian(jalaaliDate.jm.toString().padStart(2, '0')),
    dayStr: englishToPersian(jalaaliDate.jd.toString().padStart(2, '0')),
    monthName: persianMonths[jalaaliDate.jm - 1]
  };
}

/**
 * Check if a Persian year is leap year
 */
export function isPersianLeapYear(year: number): boolean {
  return jalaali.isLeapJalaaliYear(year);
}

/**
 * Get number of days in Persian month
 */
export function getPersianMonthDays(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isPersianLeapYear(year) ? 30 : 29;
}

/**
 * Validate Persian date string
 */
export function validatePersianDate(dateStr: string): boolean {
  const date = parsePersianDate(dateStr);
  return date !== null;
}

/**
 * Get Persian month names
 */
export const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

/**
 * Get Persian day names
 */
export const persianDays = [
  'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'
];

/**
 * Validate Persian national code (کد ملی)
 */
export function validateNationalCode(code: string): boolean {
  const normalizedCode = persianToEnglish(code);
  
  if (!/^\d{10}$/.test(normalizedCode)) {
    return false;
  }
  
  // Check for invalid patterns
  if (/^(\d)\1{9}$/.test(normalizedCode)) {
    return false;
  }
  
  // Calculate check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(normalizedCode[i]) * (10 - i);
  }
  
  const remainder = sum % 11;
  const checkDigit = parseInt(normalizedCode[9]);
  
  return (remainder < 2 && checkDigit === remainder) || 
         (remainder >= 2 && checkDigit === 11 - remainder);
}

/**
 * Format text for RTL display
 */
export function formatRTLText(text: string): string {
  // Add Right-to-Left Mark (RLM) for proper text direction
  return '\u200F' + text;
}

/**
 * Persian text utilities
 */
export const persianText = {
  // Common inventory terms
  inventory: 'انبار',
  product: 'کالا',
  quantity: 'تعداد',
  price: 'قیمت',
  total: 'جمع کل',
  purchase: 'خرید',
  sale: 'فروش',
  invoice: 'فاکتور',
  document: 'سند',
  company: 'شرکت',
  date: 'تاریخ',
  description: 'شرح',
  unit: 'واحد',
  
  // Financial terms
  financialYear: 'سال مالی',
  startDate: 'تاریخ شروع',
  endDate: 'تاریخ پایان',
  averagePrice: 'قیمت میانگین',
  unitPrice: 'قیمت واحد',
  totalValue: 'ارزش کل',
  
  // Actions
  save: 'ذخیره',
  cancel: 'لغو',
  edit: 'ویرایش',
  delete: 'حذف',
  add: 'افزودن',
  search: 'جستجو',
  filter: 'فیلتر',
  export: 'خروجی',
  print: 'چاپ',
  
  // Status
  active: 'فعال',
  inactive: 'غیرفعال',
  pending: 'در انتظار',
  completed: 'تکمیل شده',
  cancelled: 'لغو شده',
  
  // Messages
  success: 'عملیات با موفقیت انجام شد',
  error: 'خطا در انجام عملیات',
  confirm: 'آیا مطمئن هستید؟',
  loading: 'در حال بارگذاری...',
  
  // Validation
  required: 'این فیلد الزامی است',
  invalidFormat: 'فرمت وارد شده صحیح نیست',
  invalidNationalCode: 'کد ملی وارد شده صحیح نیست',
};