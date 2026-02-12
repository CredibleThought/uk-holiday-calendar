import React from 'react';
import { Holiday, SchoolHoliday } from '../types';
import { formatDate } from '../utils/dateUtils';

interface EventsListProps {
  year: number;
  publicHolidays: Holiday[];
  schoolHolidays: SchoolHoliday[];
}

const EventsList: React.FC<EventsListProps> = ({ year, publicHolidays, schoolHolidays }) => {
  // Combine and sort events
  const allEvents = React.useMemo(() => {
    const events: { date: string; title: string; type: 'public' | 'school-standard' | 'school-manual' | 'user'; endDate?: string }[] = [];

    // Public Holidays
    publicHolidays.forEach(h => {
      if (h.date.startsWith(String(year))) {
        events.push({
          date: h.date,
          title: h.title,
          type: 'public'
        });
      }
    });

    // School Holidays
    schoolHolidays.forEach(h => {
      // Filter by year overlap (simple check for start date in year for now, or just include all in list? 
      // User likely wants to see relevant holidays for the calendar year displayed)
      // Let's stick to start date within the year or end date within the year.
      if (h.startDate.startsWith(String(year)) || h.endDate.startsWith(String(year))) {
        let type: 'school-standard' | 'school-manual' | 'user' = 'school-standard';

        if (h.isManual) {
          if (h.type === 'school' || h.type === 'other_school') {
            type = 'school-manual';
          } else {
            type = 'user';
          }
        }

        events.push({
          date: h.startDate,
          endDate: h.endDate,
          title: h.term,
          type: type
        });
      }
    });

    return events.sort((a, b) => a.date.localeCompare(b.date));
  }, [year, publicHolidays, schoolHolidays]);

  // Format Helper: "Day DD Mon"
  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'public': return 'bg-[#ffcc00] border-yellow-400 text-black dark:bg-[#b45309] dark:text-white dark:border-amber-700'; // Public
      case 'school-standard': return 'bg-[#89d6e8] border-cyan-400 text-black dark:bg-[#155e75] dark:text-white dark:border-cyan-800'; // Standard School
      case 'school-manual': return 'bg-emerald-200 border-emerald-400 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100 dark:border-emerald-700'; // Manual School
      case 'user': return 'bg-purple-300 border-purple-400 text-purple-900 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-700'; // User
      default: return 'bg-gray-100 dark:bg-slate-800 dark:text-white';
    }
  };

  if (allEvents.length === 0) return null;

  return (
    <div className="mt-8 print:break-before-page">
      <h2 className="text-2xl font-bold mb-4 print:mb-2 text-slate-800 dark:text-white">Events List - {year}</h2>
      <div className="space-y-2">
        {allEvents.map((event, index) => (
          <div key={index} className={`p-3 rounded-md border-l-4 ${getTypeStyle(event.type)} flex flex-col sm:flex-row sm:items-center justify-between shadow-sm print:shadow-none print:border`}>
            <div className="font-medium text-lg print:text-sm">{event.title}</div>
            <div className="text-sm font-mono opacity-90 print:text-xs whitespace-nowrap">
              {formatEventDate(event.date)}
              {event.endDate && event.endDate !== event.date && (
                <> - {formatEventDate(event.endDate)}</>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventsList;
