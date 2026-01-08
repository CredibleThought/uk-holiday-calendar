import { SchoolHoliday } from '../types';

export const getDaysInMonth = (year: number, month: number): Date[] => {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const isDateInRange = (dateStr: string, startDateStr: string, endDateStr: string): boolean => {
  return dateStr >= startDateStr && dateStr <= endDateStr;
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Helper to adjust date string (YYYY-MM-DD) by N days.
 * Returns YYYY-MM-DD.
 */
export function addDays(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Checks if a holiday spans Mon-Fri and extends it to include surrounding weekends.
 * @param holiday
 */
export function extendHolidayWithWeekends(holiday: SchoolHoliday): { startDate: string, endDate: string, term: string } {
  const { startDate, endDate, term } = holiday;
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Get Day of Week (0=Sun, 1=Mon, ..., 5=Fri, 6=Sat)
  const startDay = start.getDay();
  const endDay = end.getDay();

  // Calculate duration in days (approx)
  // We want to target "entire week" which usually means Mon-Fri
  // Logic: If starts on Monday (1) AND ends on Friday (5) or later...

  let newStartDate = startDate;
  let newEndDate = endDate;

  // IF Starts on Monday (1), extend to previous Saturday (-2 days)
  if (startDay === 1) {
    newStartDate = addDays(startDate, -2);
  }

  // IF Ends on Friday (5), extend to following Sunday (+2 days)
  if (endDay === 5) {
    newEndDate = addDays(endDate, 2);
  }

  return { ...holiday, startDate: newStartDate, endDate: newEndDate };
}
