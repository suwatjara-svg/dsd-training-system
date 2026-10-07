import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Mask National ID Card for PDPA compliance
 * Input: 1100400123456
 * Output: 1-1004-XXXXX-45-6
 */
export function maskIdCard(idCard: string | null | undefined): string {
  if (!idCard) return '-';
  const clean = idCard.replace(/\D/g, '');
  if (clean.length !== 13) return idCard;
  return `${clean.slice(0, 1)}-${clean.slice(1, 5)}-XXXXX-${clean.slice(10, 12)}-${clean.slice(12)}`;
}

/**
 * Format Thai Phone number
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '-';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  return phone;
}

/**
 * Format Thai Date
 */
export function formatThaiDate(date: Date | string | null | undefined, includeTime = false): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const year = d.getFullYear() + 543;

  if (includeTime) {
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${minutes} น.`;
  }

  return `${day} ${month} ${year}`;
}

/**
 * Generate sequential Application Number e.g. APP-2026-000001
 */
export function generateApplicationNumber(sequence: number): string {
  const currentYear = new Date().getFullYear();
  const padded = sequence.toString().padStart(6, '0');
  return `APP-${currentYear}-${padded}`;
}
