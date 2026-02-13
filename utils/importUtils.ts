import ICAL from 'ical.js';
import { SchoolHoliday } from '../types';

export interface ImportResult {
    success: boolean;
    count: number;
    message: string;
    holidays: SchoolHoliday[];
}

export const importCalendarFromUrl = async (
    url: string,
    existingHolidays: SchoolHoliday[]
): Promise<ImportResult> => {
    try {
        // 1. URL Normalization
        let targetUrl = url;

        // Handle webcal:// protocol
        if (targetUrl.startsWith('webcal://')) {
            targetUrl = 'https://' + targetUrl.slice(9);
        }

        // Handle Outlook HTML links -> converted to ICS automatically
        if (targetUrl.includes('outlook.office365.com') && targetUrl.endsWith('.html')) {
            targetUrl = targetUrl.replace(/\.html$/, '.ics');
        }

        // 2. Fetch via Public Proxy (Try corsproxy.io first, then allorigins.win)
        let icsData = '';
        try {
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`corsproxy.io failed (${response.status})`);
            icsData = await response.text();
        } catch (e) {
            console.warn('corsproxy.io failed, trying allorigins.win...', e);
            const fallbackProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
            const fallbackResponse = await fetch(fallbackProxyUrl);
            if (!fallbackResponse.ok) throw new Error(`allorigins.win also failed (${fallbackResponse.status})`);
            icsData = await fallbackResponse.text();
        }

        // Simple validation check
        if (!icsData.includes('BEGIN:VCALENDAR')) {
            console.error('Invalid ICS Data Received:', icsData.substring(0, 500));
            throw new Error('Invalid calendar file format or content. The URL might be blocked or invalid.');
        }

        const jcalData = ICAL.parse(icsData);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents('vevent');

        const newHolidays: SchoolHoliday[] = [];
        let addedCount = 0;

        vevents.forEach((vevent: any) => {
            const event = new ICAL.Event(vevent);
            const summary = event.summary;

            // Exclusion Logic
            if (summary.toLowerCase().includes('re-open') || summary.toLowerCase().includes('reopen') || summary.toLowerCase().includes('school opens')) {
                return;
            }

            // Helper to format ICAL.Time to YYYY-MM-DD (local time, ignoring timezone shifts)
            const formatIcalDate = (icalTime: any) => {
                const y = icalTime.year;
                const m = String(icalTime.month).padStart(2, '0');
                const d = String(icalTime.day).padStart(2, '0');
                return `${y}-${m}-${d}`;
            };

            const startDate = formatIcalDate(event.startDate);

            // Handle Exclusive End Date
            // ICS End Dates are exclusive.
            // For All Day events (isDate=true), we subtract 1 day to show the correct inclusive end date.
            // For Timed events (isDate=false), we keep as is (e.g. 10:00 to 11:00 is same day).
            const endDateObj = event.endDate.clone();
            if (event.endDate.isDate) {
                endDateObj.adjust(-1, 0, 0, 0);
            }
            const endDate = formatIcalDate(endDateObj);

            // Duplicate Check: Ignore if an existing holiday (Standard or Manual) has the same start/end date
            // Also check against new holidays we are about to add
            const isDuplicate = existingHolidays.some(h => h.startDate === startDate && h.endDate === endDate) ||
                newHolidays.some(h => h.startDate === startDate && h.endDate === endDate);

            if (isDuplicate) {
                return; // Skip duplicate
            }

            // Smart Classification:
            const keywords = ['half term', 'break', 'holiday', 'easter', 'christmas', 'winter', 'spring', 'summer'];
            const isStandardLike = keywords.some(k => summary.toLowerCase().includes(k));

            newHolidays.push({
                startDate,
                endDate,
                term: summary,
                isManual: !isStandardLike,
                type: !isStandardLike ? 'other_school' : 'school'
            });
            addedCount++;
        });

        return {
            success: true,
            count: addedCount,
            message: `Successfully imported ${addedCount} events!`,
            holidays: newHolidays
        };

    } catch (e: any) {
        console.error(e);
        return {
            success: false,
            count: 0,
            message: e.message || 'Failed to import. Check URL & CORS.',
            holidays: []
        };
    }
};
