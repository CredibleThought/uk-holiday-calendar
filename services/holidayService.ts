import { Country, Holiday, SchoolHoliday } from '../types';
import { extendHolidayWithWeekends } from '../utils/dateUtils';

const BANK_HOLIDAY_API = 'https://www.gov.uk/bank-holidays.json';

// Fallback data in case the API call fails (CORS or other issues)
const FALLBACK_DATA: Record<Country, Holiday[]> = {
  'england-and-wales': [
    { date: '2025-01-01', title: 'New Year’s Day' },
    { date: '2025-04-18', title: 'Good Friday' },
    { date: '2025-04-21', title: 'Easter Monday' },
    { date: '2025-05-05', title: 'Early May bank holiday' },
    { date: '2025-05-26', title: 'Spring bank holiday' },
    { date: '2025-08-25', title: 'Summer bank holiday' },
    { date: '2025-12-25', title: 'Christmas Day' },
    { date: '2025-12-26', title: 'Boxing Day' },
    // 2026 Fallback
    { date: '2026-01-01', title: 'New Year’s Day' },
    { date: '2026-04-03', title: 'Good Friday' },
    { date: '2026-04-06', title: 'Easter Monday' },
    { date: '2026-05-04', title: 'Early May bank holiday' },
    { date: '2026-05-25', title: 'Spring bank holiday' },
    { date: '2026-08-31', title: 'Summer bank holiday' },
    { date: '2026-12-25', title: 'Christmas Day' },
    { date: '2026-12-28', title: 'Boxing Day (substitute day)' },
  ],
  'scotland': [
    { date: '2025-01-01', title: 'New Year’s Day' },
    { date: '2025-01-02', title: '2nd January' },
    { date: '2025-04-18', title: 'Good Friday' },
    { date: '2025-05-05', title: 'Early May bank holiday' },
    { date: '2025-05-26', title: 'Spring bank holiday' },
    { date: '2025-08-04', title: 'Summer bank holiday' },
    { date: '2025-12-01', title: 'St Andrew’s Day (substitute day)' },
    { date: '2025-12-25', title: 'Christmas Day' },
    { date: '2025-12-26', title: 'Boxing Day' },
    // 2026 Fallback
    { date: '2026-01-01', title: 'New Year’s Day' },
    { date: '2026-01-02', title: '2nd January' },
    { date: '2026-04-03', title: 'Good Friday' },
    { date: '2026-05-04', title: 'Early May bank holiday' },
    { date: '2026-05-25', title: 'Spring bank holiday' },
    { date: '2026-08-03', title: 'Summer bank holiday' },
    { date: '2026-11-30', title: 'St Andrew’s Day' },
    { date: '2026-12-25', title: 'Christmas Day' },
    { date: '2026-12-28', title: 'Boxing Day (substitute day)' },
  ],
  'northern-ireland': [
    { date: '2025-01-01', title: 'New Year’s Day' },
    { date: '2025-03-17', title: 'St Patrick’s Day' },
    { date: '2025-04-18', title: 'Good Friday' },
    { date: '2025-04-21', title: 'Easter Monday' },
    { date: '2025-05-05', title: 'Early May bank holiday' },
    { date: '2025-05-26', title: 'Spring bank holiday' },
    { date: '2025-07-14', title: 'Battle of the Boyne (Orangemen’s Day)' },
    { date: '2025-08-25', title: 'Summer bank holiday' },
    { date: '2025-12-25', title: 'Christmas Day' },
    { date: '2025-12-26', title: 'Boxing Day' },
    // 2026 Fallback
    { date: '2026-01-01', title: 'New Year’s Day' },
    { date: '2026-03-17', title: 'St Patrick’s Day' },
    { date: '2026-04-03', title: 'Good Friday' },
    { date: '2026-04-06', title: 'Easter Monday' },
    { date: '2026-05-04', title: 'Early May bank holiday' },
    { date: '2026-05-25', title: 'Spring bank holiday' },
    { date: '2026-07-13', title: 'Battle of the Boyne (Orangemen’s Day) (substitute day)' },
    { date: '2026-08-31', title: 'Summer bank holiday' },
    { date: '2026-12-25', title: 'Christmas Day' },
    { date: '2026-12-28', title: 'Boxing Day (substitute day)' },
  ],
};

// England & Wales Defaults (Based on Hillingdon Council)
const HILLINGDON_SCHOOL_HOLIDAYS: SchoolHoliday[] = [
  // 2024-2025 Academic Year
  { startDate: '2024-12-23', endDate: '2025-01-03', term: 'Christmas Break' },
  { startDate: '2025-02-17', endDate: '2025-02-21', term: 'February Half Term' },
  { startDate: '2025-04-07', endDate: '2025-04-21', term: 'Easter Break' },
  { startDate: '2025-05-26', endDate: '2025-05-30', term: 'May Half Term' },
  { startDate: '2025-07-23', endDate: '2025-08-31', term: 'Summer Break' },

  // 2025-2026 Academic Year
  { startDate: '2025-10-27', endDate: '2025-10-31', term: 'October Half Term' },
  { startDate: '2025-12-22', endDate: '2026-01-02', term: 'Christmas Break' },
  { startDate: '2026-02-16', endDate: '2026-02-20', term: 'February Half Term' },
  { startDate: '2026-03-30', endDate: '2026-04-10', term: 'Easter Break' },
  { startDate: '2026-05-25', endDate: '2026-05-29', term: 'May Half Term' },
  { startDate: '2026-07-22', endDate: '2026-09-01', term: 'Summer Break' },

  // Start of 2026-2027
  { startDate: '2026-10-26', endDate: '2026-10-30', term: 'October Half Term' },
  { startDate: '2026-12-21', endDate: '2027-01-01', term: 'Christmas Break' }
];

// Scotland Defaults (Based on Edinburgh Council)
const EDINBURGH_SCHOOL_HOLIDAYS: SchoolHoliday[] = [
  // 2024-2025
  { startDate: '2024-12-23', endDate: '2025-01-06', term: 'Christmas Break' },
  { startDate: '2025-02-10', endDate: '2025-02-14', term: 'February Break' },
  { startDate: '2025-04-07', endDate: '2025-04-21', term: 'Easter Break' },
  { startDate: '2025-06-27', endDate: '2025-08-12', term: 'Summer Break' },
  // 2025-2026
  { startDate: '2025-10-13', endDate: '2025-10-20', term: 'October Break' },
  { startDate: '2025-12-22', endDate: '2026-01-05', term: 'Christmas Break' },
  { startDate: '2026-02-09', endDate: '2026-02-13', term: 'February Break' },
  { startDate: '2026-04-03', endDate: '2026-04-17', term: 'Easter Break' },
  { startDate: '2026-06-26', endDate: '2026-08-11', term: 'Summer Break' },
  // 2026-2027
  { startDate: '2026-09-14', endDate: '2026-09-14', term: 'Autumn Holiday' },
  { startDate: '2026-10-12', endDate: '2026-10-19', term: 'October Break' },
  { startDate: '2026-12-21', endDate: '2027-01-05', term: 'Christmas Break' }
];

// Northern Ireland Defaults (Dept of Education NI)
const NI_SCHOOL_HOLIDAYS: SchoolHoliday[] = [
  // 2024-2025
  { startDate: '2024-12-23', endDate: '2025-01-02', term: 'Christmas Break' },
  { startDate: '2025-02-13', endDate: '2025-02-14', term: 'Mid-Term Break' },
  { startDate: '2025-04-17', endDate: '2025-04-25', term: 'Easter Break' },
  { startDate: '2025-07-01', endDate: '2025-08-31', term: 'Summer Break' },
  // 2025-2026
  { startDate: '2025-10-30', endDate: '2025-10-31', term: 'Halloween Break' },
  { startDate: '2025-12-22', endDate: '2026-01-02', term: 'Christmas Break' },
  { startDate: '2026-02-12', endDate: '2026-02-13', term: 'Mid-Term Break' },
  { startDate: '2026-04-02', endDate: '2026-04-10', term: 'Easter Break' },
  { startDate: '2026-07-01', endDate: '2026-08-31', term: 'Summer Break' }
];

// Manchester specific dates (detected via 'M' postcode)
const MANCHESTER_SCHOOL_HOLIDAYS: SchoolHoliday[] = [
  // 2024-2025 Academic Year
  { startDate: '2024-12-23', endDate: '2025-01-03', term: 'Christmas Break' },
  { startDate: '2025-02-17', endDate: '2025-02-21', term: 'February Half Term' },
  { startDate: '2025-04-07', endDate: '2025-04-21', term: 'Easter Break' },
  { startDate: '2025-05-26', endDate: '2025-05-30', term: 'May Half Term' },
  { startDate: '2025-07-23', endDate: '2025-08-31', term: 'Summer Break' },

  // 2025-2026 Academic Year
  { startDate: '2025-10-27', endDate: '2025-10-31', term: 'October Half Term' },
  { startDate: '2025-12-22', endDate: '2026-01-02', term: 'Christmas Break' },
  { startDate: '2026-02-16', endDate: '2026-02-20', term: 'February Half Term' },
  { startDate: '2026-04-03', endDate: '2026-04-17', term: 'Easter Break' },
  { startDate: '2026-05-25', endDate: '2026-05-29', term: 'May Half Term' },
  { startDate: '2026-07-20', endDate: '2026-08-31', term: 'Summer Break' },

  // Start of 2026-2027
  { startDate: '2026-10-26', endDate: '2026-10-30', term: 'October Half Term' },
  { startDate: '2026-12-21', endDate: '2027-01-04', term: 'Christmas Break' }
];

export const fetchBankHolidays = async (country: Country): Promise<Holiday[]> => {
  try {
    const response = await fetch(BANK_HOLIDAY_API);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data[country].events;
  } catch (error) {
    console.warn('Failed to fetch official bank holidays, using fallback data.', error);
    return FALLBACK_DATA[country];
  }
};

// NOTE: In a real environment, finding school holidays by postcode requires accessing
// 3rd party APIs for local councils which don't have a single unified public API.
// We are simulating this by checking the postcode area.
export const fetchSchoolHolidays = async (postcode: string): Promise<SchoolHoliday[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();

  // Simple heuristic for Manchester postcodes (starts with M followed by a number, e.g., M13...)
  if (/^M\d/.test(cleanPostcode)) {
    return MANCHESTER_SCHOOL_HOLIDAYS.map(extendHolidayWithWeekends);
  }

  // Default fallback (matches typical London/South East dates like HA4)
  return HILLINGDON_SCHOOL_HOLIDAYS.map(extendHolidayWithWeekends);
};

export const getDefaultSchoolHolidays = (country: Country): SchoolHoliday[] => {
  switch (country) {
    case 'scotland':
      return EDINBURGH_SCHOOL_HOLIDAYS.map(extendHolidayWithWeekends);
    case 'northern-ireland':
      return NI_SCHOOL_HOLIDAYS.map(extendHolidayWithWeekends);
    case 'england-and-wales':
    default:
      return HILLINGDON_SCHOOL_HOLIDAYS.map(extendHolidayWithWeekends);
  }
};
