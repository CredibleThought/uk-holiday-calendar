import React, { useMemo } from 'react';
import Month from './Month';
import { Holiday, SchoolHoliday } from '../types';
import { getDaysInMonth, formatDate, isDateInRange } from '../utils/dateUtils';

interface CalendarProps {
  year: number;
  publicHolidays: Holiday[];
  schoolHolidays: SchoolHoliday[];
  loading: boolean;
  countryName: string;
  onDateClick?: (date: string) => void;
  selectionRange?: { start: string; end: string } | null;
}

const Calendar: React.FC<CalendarProps> = ({ year, publicHolidays, schoolHolidays, loading, countryName, onDateClick, selectionRange }) => {
  // Render 12 months
  const months = Array.from({ length: 12 }, (_, i) => i);

  // Calculate counts for the legend
  const { publicHolidayCount, schoolHolidayCount, manualSchoolCount, standardSchoolCount, manualUserCount } = useMemo(() => {
    let pCount = 0;
    let sCount = 0;
    let msCount = 0; // Manual School
    let muCount = 0; // Manual User

    for (let m = 0; m < 12; m++) {
      const days = getDaysInMonth(year, m);
      for (const date of days) {
        const dateStr = formatDate(date);
        const isPublic = publicHolidays.some(h => h.date === dateStr);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        // Find all school holidays for this date
        const matchingSchoolHolidays = schoolHolidays.filter(h => isDateInRange(dateStr, h.startDate, h.endDate));

        // Categorize
        const hasStandard = matchingSchoolHolidays.some(h => !h.isManual);
        const hasManualSchool = matchingSchoolHolidays.some(h => h.isManual && (h.type === 'school' || h.type === 'other_school'));

        // Manual User (Default to user if type missing AND isManual is true, though Controls mostly sets it now)
        // Actually earlier code assumed isManual -> User. Now we have types.
        // If type is explicitly 'user' OR (isManual is true and type is undefined/null)
        const hasManualUser = matchingSchoolHolidays.some(h => h.isManual && (!h.type || h.type === 'user'));

        if (isPublic) {
          pCount++;
        }

        if (!isWeekend) {
          // Public holiday dominates everything for counts usually, or we exclude it from others to avoid double counting "days off"
          if (!isPublic) {
            if (hasManualUser) {
              muCount++;
            }

            // Count School Holidays. 
            // If a day is BOTH Standard and Manual School? Count once.
            // If a day is Manual School (but not Standard)? Count it.
            // If a day is Standard? Count it.
            if (hasStandard || hasManualSchool) {
              // We distinguish them for the legend maybe, or lump them?
              // User asked to "not add these to the user added days total".
              // They didn't explicitly say add to school total, but it makes sense.
              // Let's track Manual School separately for the Legend if we show it separately.

              if (hasManualSchool && !hasStandard) {
                msCount++;
              } else if (hasStandard) {
                sCount++;
              }
            }
          }
        }
      }
    }
    return {
      publicHolidayCount: pCount,
      schoolHolidayCount: sCount + msCount, // Combined for total? Or keep separate? Let's keep separate in variable but maybe show combined or separate in legend. 
      // Actually, simplest is to show "School Holiday (Standard)" and "School Holiday (Manual)" or just "School Holiday" (Combined).
      // "show manual school events a different colour" -> implies separate legend key.
      manualSchoolCount: msCount,
      standardSchoolCount: sCount,
      manualUserCount: muCount
    };
  }, [year, publicHolidays, schoolHolidays]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] bg-white rounded-lg shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4 dark:border-blue-800 dark:border-t-blue-500"></div>
        <p className="text-slate-500 dark:text-slate-400">Generating Calendar...</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white print:bg-white p-4 print:p-0 mx-auto max-w-[1200px] dark:bg-slate-900">
      {/* Title Header */}
      <div className="text-center mb-6 print:mb-2 print:mt-0">
        <h1 className="text-5xl print:text-5xl font-serif font-bold text-slate-900 mb-2 print:mb-0.5 dark:text-white">{year}</h1>
        <p className="text-sm print:text-xs text-slate-500 print:text-slate-600 uppercase tracking-widest print:tracking-wide dark:text-slate-400">
          {countryName} • School Holidays Highlighted
        </p>
      </div>

      {/* Grid Layout: 3 Columns x 4 Rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-3 print:gap-1.5 print:text-xs">
        {months.map((monthIndex) => (
          <Month
            key={monthIndex}
            year={year}
            monthIndex={monthIndex}
            publicHolidays={publicHolidays}
            schoolHolidays={schoolHolidays}
            onDateClick={onDateClick}
            selectionRange={selectionRange}
          />
        ))}
      </div>

      {/* Footer / Legend */}
      <div className="mt-8 pt-4 border-t border-slate-200 print:mt-2 print:pt-2 print:border-t border-slate-300 dark:border-slate-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 print:mb-2">

          {/* Standard School Holidays */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center border border-slate-300 bg-[#89d6e8] px-4 py-1.5 print:px-2 print:py-1 text-sm print:text-[10px] font-medium justify-center text-center dark:border-slate-600 dark:bg-[#89d6e8] dark:text-black">
              School Holiday ({standardSchoolCount} days)
            </div>
            <div className="hidden md:block text-xs text-slate-700 print:text-[9px] dark:text-slate-300 text-center">
              Official Terms
            </div>
          </div>

          {/* Manual School Holidays (Imported) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center border border-emerald-300 bg-emerald-200 px-4 py-1.5 print:px-2 print:py-1 text-sm print:text-[10px] font-medium justify-center text-center dark:border-emerald-700 dark:bg-emerald-900 dark:text-emerald-100">
              Other School ({manualSchoolCount} days)
            </div>
            <div className="hidden md:block text-xs text-slate-700 print:text-[9px] dark:text-slate-300 text-center">
              Manually Added / Imported
            </div>
          </div>

          {/* User Added Holidays (Personal) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center border border-purple-400 bg-purple-300 px-4 py-1.5 print:px-2 print:py-1 text-sm print:text-[10px] font-medium justify-center text-center dark:border-purple-400 dark:bg-purple-300 dark:text-purple-900">
              Personal ({manualUserCount} days)
            </div>
            <div className="hidden md:block text-xs text-slate-700 print:text-[9px] dark:text-slate-300 text-center">
              User Events
            </div>
          </div>

          {/* Public Holidays */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center border border-slate-300 bg-[#ffcc00] px-4 py-1.5 print:px-2 print:py-1 text-sm print:text-[10px] font-medium justify-center text-center dark:border-slate-600 dark:bg-[#ffcc00] dark:text-black">
              Public Holiday ({publicHolidayCount} days)
            </div>
            <div className="hidden md:block text-xs text-slate-700 print:text-[9px] dark:text-slate-300 text-center">
              Bank Holidays
            </div>
          </div>
        </div>

        <div className="print:hidden">
          <div className="text-xs text-slate-400 italic mt-2">
            Generated by UK Holiday Calendar App. Check local council websites for exact school term variations.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;