import React from 'react';
import { formatDate, getDaysInMonth, isDateInRange, MONTH_NAMES } from '../utils/dateUtils';
import { Holiday, SchoolHoliday } from '../types';

interface MonthProps {
  year: number;
  monthIndex: number;
  publicHolidays: Holiday[];
  schoolHolidays: SchoolHoliday[];
  onDateClick?: (date: string) => void;
  selectionRange?: { start: string; end: string } | null;
}

const Month: React.FC<MonthProps> = ({ year, monthIndex, publicHolidays, schoolHolidays, onDateClick, selectionRange }) => {
  const days = getDaysInMonth(year, monthIndex);

  // Create grid slots. We need to pad the start with empty slots if the month doesn't start on Sunday/Monday.
  // The example image shows Sunday as the first day of the week.
  const firstDay = days[0].getDay(); // 0 = Sunday, 1 = Monday, etc.
  const paddedSlots = Array.from({ length: firstDay }).fill(null) as (Date | null)[];
  const gridCells = [...paddedSlots, ...days];

  return (
    <div className="border border-slate-300 print:border bg-white text-xs dark:bg-slate-800 dark:border-slate-700">
      {/* Header */}
      <div className="flex bg-[#005ea5] text-white print:bg-[#005ea5]">
        <div className="py-1 px-3 print:py-2 print:px-3 font-bold text-lg print:text-lg bg-[#004f8c] w-12 print:w-10 flex items-center justify-center">
          {String(monthIndex + 1).padStart(2, '0')}
        </div>
        <div className="flex-1 py-1 px-3 print:py-2 print:px-3 font-semibold text-lg print:text-lg flex items-center">
          {MONTH_NAMES[monthIndex]}
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-gray-50 print:border-b dark:bg-slate-700 dark:border-slate-600">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="py-1 print:py-0.5 text-center font-semibold text-[10px] print:text-[10px] text-slate-700 dark:text-slate-300">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {gridCells.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="border-b border-r border-slate-100 print:border h-8 print:h-6 dark:border-slate-700" />;
          }

          const dateStr = formatDate(date);
          const dayNum = date.getDate();

          // Check holidays
          // Find specific holiday objects to retrieve their names (title or term)
          const publicHoliday = publicHolidays.find(h => h.date === dateStr);

          // Find ALL matching school holidays to check for overlaps (Always check now, to allow public + user overlap)
          const matchingSchoolHolidays = schoolHolidays.filter(h => isDateInRange(dateStr, h.startDate, h.endDate));

          // Determine types present
          const hasSchoolType = matchingSchoolHolidays.some(h => (!h.type || h.type === 'school') && !h.isManual) || matchingSchoolHolidays.some(h => h.isManual && h.type === 'school');
          // Actually, let's simplify.
          // Standard holidays are always 'school' effectively.
          // Manual holidays can be 'school' or 'user'.

          const standardSchoolHolidays = matchingSchoolHolidays.filter(h => !h.isManual);
          const manualSchoolHolidays = matchingSchoolHolidays.filter(h => h.isManual && h.type === 'school');
          const userHolidays = matchingSchoolHolidays.filter(h => h.isManual && (!h.type || h.type === 'user')); // Default to user if undefined for manual?
          // Wait, earlier I said default new holidays to 'user'.
          // Existing manual holidays (from before this change) might not have a type.
          // If isManual is true and type is undefined -> treat as 'user' (Purple) to preserve existing behavior?
          // Yes, the implementation plan said: "Current Manual is Purple (User)".

          const hasStandardSchool = standardSchoolHolidays.length > 0;
          const hasManualSchool = manualSchoolHolidays.length > 0;
          const hasUser = userHolidays.length > 0;

          // Combined "School" presence (Standard or Manual-set-as-School)
          const hasSchool = hasStandardSchool || hasManualSchool;

          let bgClass = '';
          let tooltip = '';

          if (publicHoliday && hasUser) {
            // Overlap: Public + User (Gold / Purple)
            bgClass = 'bg-[linear-gradient(135deg,#ffcc00_50%,#d8b4fe_50%)] text-black dark:bg-[linear-gradient(135deg,#b45309_50%,#581c87_50%)] dark:text-white';
            const userTerm = userHolidays[0].term;
            tooltip = `${publicHoliday.title} & ${userTerm} (User Added)`;
          } else if (publicHoliday) {
            // Public holiday: Gold/Amber (Dominates School)
            bgClass = 'bg-[#ffcc00] font-bold text-black dark:bg-[#b45309] dark:text-white';
            tooltip = publicHoliday.title;
          } else if (hasSchool && hasUser) {
            // Overlap: School (Standard/Manual) + User (Blue / Purple)
            bgClass = 'bg-[linear-gradient(135deg,#89d6e8_50%,#d8b4fe_50%)] text-black dark:bg-[linear-gradient(135deg,#155e75_50%,#581c87_50%)] dark:text-white';
            const schoolTerm = hasStandardSchool ? standardSchoolHolidays[0].term : manualSchoolHolidays[0].term;
            const userTerm = userHolidays[0].term;
            tooltip = `${schoolTerm} & ${userTerm} (User Added)`;
          } else if (hasSchool) {
            // School holiday: Cyan/Blue
            // Could be standard or manual-school
            bgClass = 'bg-[#89d6e8] text-black dark:bg-[#155e75] dark:text-white';
            const term = hasStandardSchool ? standardSchoolHolidays[0].term : manualSchoolHolidays[0].term;
            tooltip = term + (hasManualSchool && !hasStandardSchool ? ' (Manual School)' : '');
          } else if (hasUser) {
            // User added: Purple
            bgClass = 'bg-purple-300 text-purple-900 border border-purple-400 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-700';
            tooltip = userHolidays[0].term + ' (User Added)';
          } else if (date.getDay() === 0 || date.getDay() === 6) {
            bgClass = 'bg-slate-50 text-slate-500 dark:bg-slate-700/30 dark:text-slate-500'; // Weekend
          }

          // Visual Selection Override (Draft state)
          let selectionClass = '';
          if (selectionRange && selectionRange.start) {
            if (dateStr === selectionRange.start || dateStr === selectionRange.end) {
              selectionClass = 'ring-2 ring-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:ring-blue-400 z-10'; // Start/End Points
            } else if (selectionRange.end && isDateInRange(dateStr, selectionRange.start, selectionRange.end)) {
              selectionClass = 'bg-blue-50 dark:bg-blue-900/30'; // Inside range
            }
          }

          return (
            <div
              key={dateStr}
              onClick={() => onDateClick?.(dateStr)}
              className={`h-8 print:h-6 flex items-center justify-center border-b border-r border-slate-100 print:border relative ${selectionClass || bgClass} ${tooltip ? 'cursor-help' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800'} dark:border-slate-700 dark:text-slate-300 transition-colors duration-150`}
              title={tooltip}
            >
              <span className="print:text-xs">{dayNum}</span>
            </div>
          );
        })}
        {/* Fill remaining cells of the last row to maintain grid borders if needed */}
        {Array.from({ length: (7 - (gridCells.length % 7)) % 7 }).map((_, i) => (
          <div key={`end-empty-${i}`} className="border-b border-r border-slate-100 print:border h-8 print:h-6 bg-gray-50/30 dark:border-slate-700 dark:bg-slate-800" />
        ))}
      </div>
    </div>
  );
};

export default Month;
