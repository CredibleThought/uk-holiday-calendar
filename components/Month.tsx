import React from 'react';
import { formatDate, getDaysInMonth, isDateInRange, MONTH_NAMES } from '../utils/dateUtils';
import { Holiday, SchoolHoliday } from '../types';

interface MonthProps {
  year: number;
  monthIndex: number;
  publicHolidays: Holiday[];
  schoolHolidays: SchoolHoliday[];
}

const Month: React.FC<MonthProps> = ({ year, monthIndex, publicHolidays, schoolHolidays }) => {
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
          // Only search for school holiday if not a public holiday (visual priority)
          const schoolHoliday = !publicHoliday
            ? schoolHolidays.find(h => isDateInRange(dateStr, h.startDate, h.endDate))
            : undefined;

          let bgClass = '';
          let tooltip = '';

          if (publicHoliday) {
            bgClass = 'bg-[#ffcc00] font-bold text-black dark:bg-[#b45309] dark:text-white'; // Public holiday: Gold/Amber
            tooltip = publicHoliday.title;
          } else if (schoolHoliday) {
            bgClass = 'bg-[#89d6e8] text-black dark:bg-[#155e75] dark:text-white'; // School holiday: Cyan/Blue
            tooltip = schoolHoliday.term;
          } else if (date.getDay() === 0 || date.getDay() === 6) {
            bgClass = 'bg-slate-50 text-slate-500 dark:bg-slate-700/30 dark:text-slate-500'; // Weekend light gray
          }

          return (
            <div
              key={dateStr}
              className={`h-8 print:h-6 flex items-center justify-center border-b border-r border-slate-100 print:border relative ${bgClass} ${tooltip ? 'cursor-help' : 'cursor-default'} dark:border-slate-700 dark:text-slate-300`}
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
