import { SchoolHoliday } from '../types';
import { addDays, extendHolidayWithWeekends } from './dateUtils';

/**
 * Removes hyphens from YYYY-MM-DD for ICS/URL format (YYYYMMDD).
 */
function formatForUrl(dateStr: string): string {
    return dateStr.replace(/-/g, '');
}

export const generateGoogleCalendarLink = (holiday: SchoolHoliday): string => {
    // Apply extension logic
    const { startDate, endDate, term } = extendHolidayWithWeekends(holiday);

    // Google All Day events: End date is exclusive.
    // Our system data: End date is inclusive.
    // So we add 1 day to end date.
    const exclusiveEndDate = addDays(endDate, 1);

    const start = formatForUrl(startDate);
    const end = formatForUrl(exclusiveEndDate);

    const title = encodeURIComponent(term);
    const details = encodeURIComponent('School Holiday');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&srp=true`;
};

export const generateOutlookLink = (holiday: SchoolHoliday): string => {
    const { startDate, endDate, term } = extendHolidayWithWeekends(holiday);

    // Outlook / Office 365 Web also usually prefer exclusive end dates for all day events,
    // same as Google.
    const exclusiveEndDate = addDays(endDate, 1);

    const title = encodeURIComponent(term);
    const body = encodeURIComponent('School Holiday');

    return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${startDate}&enddt=${exclusiveEndDate}&subject=${title}&body=${body}&allday=true`;
};

export const generateOffice365Link = (holiday: SchoolHoliday): string => {
    const { startDate, endDate, term } = extendHolidayWithWeekends(holiday);

    const exclusiveEndDate = addDays(endDate, 1);

    const title = encodeURIComponent(term);
    const body = encodeURIComponent('School Holiday');

    return `https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${startDate}&enddt=${exclusiveEndDate}&subject=${title}&body=${body}&allday=true`;
};

export const generateIcsContent = (holiday: SchoolHoliday): string => {
    const { startDate, endDate, term } = extendHolidayWithWeekends(holiday);

    // ICS All Day: DTSTART;VALUE=DATE:YYYYMMDD
    // DTEND is exclusive.
    const exclusiveEndDate = addDays(endDate, 1);

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//UK Holiday Calendar//EN
BEGIN:VEVENT
UID:${Date.now()}-${Math.floor(Math.random() * 10000)}@ukholidaycalendar
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART;VALUE=DATE:${formatForUrl(startDate)}
DTEND;VALUE=DATE:${formatForUrl(exclusiveEndDate)}
SUMMARY:${term}
DESCRIPTION:School Holiday
END:VEVENT
END:VCALENDAR`;
};
