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

          // Calculate specific subsets
          const standardSchoolHolidays = matchingSchoolHolidays.filter(h => !h.isManual);
          const manualSchoolHolidays = matchingSchoolHolidays.filter(h => h.isManual && h.type === 'school');
          const userHolidays = matchingSchoolHolidays.filter(h => h.isManual && (!h.type || h.type === 'user'));

          // Determine types present
          const hasStandardSchool = standardSchoolHolidays.length > 0;
          const hasManualSchool = manualSchoolHolidays.length > 0;
          const hasUser = userHolidays.length > 0;

          // Combined "School" presence needs to split for visual priority if we want distinction
          // Priority: Public > Manual School (Green) > Standard School (Cyan) > User (Purple)?
          // Or: Public > User > Manual School > Standard School?
          // If I import "School Term", I probably want it to look like a school term (Cyan) or distinct (Green).
          // If I add "My Birthday", it's User (Purple).
          // If they overlap?
          // Public Overrides all visually usually (Gold).
          // If Manual School (Green) overlaps with User (Purple) -> Gradient?

          // Determine tooltip content (aggregate all events)
          const allEvents: string[] = [];

          if (publicHoliday) {
            allEvents.push(`${publicHoliday.title} (Public Holiday)`);
          }

          // Add School/User holidays
          // standardSchoolHolidays, manualSchoolHolidays, userHolidays are subsets of matchingSchoolHolidays
          // We can just map matchingSchoolHolidays directly to get all names, but might want to distinguish types in text

          matchingSchoolHolidays.forEach(h => {
            let suffix = '';
            if (h.isManual) {
              if (!h.type || h.type === 'user') suffix = ' (Personal)';
              else if (h.type === 'school') suffix = ' (School Event)';
            } else {
              suffix = ' (School Holiday)';
            }
            allEvents.push(`${h.term}${suffix}`);
          });

          // Deduplicate if needed (though unlikely to have exact duplicates unless data issue)
          const uniqueEvents = Array.from(new Set(allEvents));
          const tooltip = uniqueEvents.join('\n');

          let bgClass = '';

          if (publicHoliday) {
            // Public holiday: Gold/Amber
            // If overlaps with others, maybe show gradient?
            // Let's keep simple hierarchy for now, or simple mix.
            if (hasUser) {
              bgClass = 'bg-[linear-gradient(135deg,#ffcc00_50%,#d8b4fe_50%)] text-black dark:bg-[linear-gradient(135deg,#b45309_50%,#581c87_50%)] dark:text-white';
            } else {
              bgClass = 'bg-[#ffcc00] font-bold text-black dark:bg-[#b45309] dark:text-white';
            }
          } else if (hasManualSchool) {
            // Manual School (Green)
            if (hasUser) {
              // Overlap with User (Purple)
              bgClass = 'bg-[linear-gradient(135deg,#6ee7b7_50%,#d8b4fe_50%)] text-black dark:bg-[linear-gradient(135deg,#064e3b_50%,#581c87_50%)] dark:text-white';
            } else if (hasStandardSchool) {
              // Overlap with Standard School (Cyan) - Green/Cyan? Or just Green overrides?
              // Manual usually overrides estimate.
              bgClass = 'bg-emerald-200 text-emerald-900 border border-emerald-300 dark:bg-emerald-900 dark:text-emerald-100 dark:border-emerald-700';
            } else {
              // Just Manual School
              bgClass = 'bg-emerald-200 text-emerald-900 border border-emerald-300 dark:bg-emerald-900 dark:text-emerald-100 dark:border-emerald-700';
            }
          } else if (hasStandardSchool) {
            // Standard School (Cyan)
            if (hasUser) {
              // Overlap with User
              bgClass = 'bg-[linear-gradient(135deg,#89d6e8_50%,#d8b4fe_50%)] text-black dark:bg-[linear-gradient(135deg,#155e75_50%,#581c87_50%)] dark:text-white';
            } else {
              bgClass = 'bg-[#89d6e8] text-black dark:bg-[#155e75] dark:text-white';
            }
          } else if (hasUser) {
            // User added: Purple
            bgClass = 'bg-purple-300 text-purple-900 border border-purple-400 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-700';
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
