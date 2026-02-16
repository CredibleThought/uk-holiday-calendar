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

        // 2. Fetch via Public Proxy
        // Strategy: corsproxy.io -> allorigins.win -> codetabs.com
        let icsData = '';
        try {
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`corsproxy.io failed (${response.status})`);
            icsData = await response.text();
        } catch (e1: any) {
            console.warn('Proxy 1 failed:', e1.message);
            try {
                const fallbackProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
                const fallbackResponse = await fetch(fallbackProxyUrl);
                if (!fallbackResponse.ok) throw new Error(`allorigins.win also failed (${fallbackResponse.status})`);
                icsData = await fallbackResponse.text();
            } catch (e2: any) {
                console.warn('Proxy 2 failed:', e2.message);
                try {
                    const codeTabsUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
                    const codeTabsResponse = await fetch(codeTabsUrl);
                    if (!codeTabsResponse.ok) throw new Error(`codetabs failed (${codeTabsResponse.status})`);
                    icsData = await codeTabsResponse.text();
                } catch (e3: any) {
                    console.error('All proxies failed:', e3.message);
                    throw new Error('All CORS proxies failed to fetch the calendar. The URL may be blocked or invalid.');
                }
            }
        }

        // Simple validation check
        if (!icsData.includes('BEGIN:VCALENDAR')) {
            console.error('Invalid ICS Data Received:', icsData.substring(0, 500));
            // Provide a hint to the user about what we got instead
            const preview = icsData.substring(0, 100).replace(/\n/g, ' ');
            throw new Error(`Invalid calendar data. Received: "${preview}...". Please ensure you are using the "iCal" or "ICS" link, not the "HTML" or "Embed" link.`);
        }

        const jcalData = ICAL.parse(icsData);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents('vevent');

        const newHolidays: SchoolHoliday[] = [];
        let addedCount = 0;

        // Determine range for recurrence expansion (Current Year - 1 to +4)
        const currentYear = new Date().getFullYear();
        const expandStartYear = currentYear - 1;
        const expandEndYear = currentYear + 4;

        vevents.forEach((vevent: any) => {
            const event = new ICAL.Event(vevent);
            const summary = event.summary;

            // Exclusion Logic
            if (summary.toLowerCase().includes('re-open') || summary.toLowerCase().includes('reopen') || summary.toLowerCase().includes('school opens')) {
                return;
            }

            const processEventInstance = (startDateIcal: any, endDateIcal: any) => {
                // Helper to format ICAL.Time to YYYY-MM-DD
                const formatIcalDate = (icalTime: any) => {
                    const y = icalTime.year;
                    const m = String(icalTime.month).padStart(2, '0');
                    const d = String(icalTime.day).padStart(2, '0');
                    return `${y}-${m}-${d}`;
                };

                const startDate = formatIcalDate(startDateIcal);

                // Handle Exclusive End Date
                const endDateObj = endDateIcal.clone();
                if (endDateIcal.isDate) {
                    endDateObj.adjust(-1, 0, 0, 0);
                }
                let endDate = formatIcalDate(endDateObj);

                // Check for invalid end dates (e.g. zero duration events where we subtracted 1 day)
                if (endDate < startDate) {
                    endDate = startDate;
                }

                // Duplicate Check
                const isDuplicate = existingHolidays.some(h => h.startDate === startDate && h.endDate === endDate && h.term === summary) ||
                    newHolidays.some(h => h.startDate === startDate && h.endDate === endDate && h.term === summary);

                if (isDuplicate) return;

                // Smart Classification
                const keywords = ['half term', 'break', 'holiday', 'easter', 'christmas', 'winter', 'spring', 'summer'];
                const isStandardLike = keywords.some(k => summary.toLowerCase().includes(k));

                newHolidays.push({
                    startDate,
                    endDate,
                    term: summary,
                    isManual: !isStandardLike,
                    type: !isStandardLike ? 'event' : 'school'
                });
                addedCount++;
            };

            if (event.isRecurring()) {
                const iterator = event.iterator();
                let next;
                let loopCount = 0; // Safety break

                while ((next = iterator.next()) && loopCount < 1000) {
                    loopCount++;
                    const year = next.year;

                    if (year < expandStartYear) continue;
                    if (year > expandEndYear) break;

                    // Calculate Duration to find End Date for this occurrence
                    const duration = event.duration;
                    const end = next.clone();
                    end.addDuration(duration);

                    processEventInstance(next, end);
                }
            } else {
                // Single Event
                processEventInstance(event.startDate, event.endDate);
            }
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
