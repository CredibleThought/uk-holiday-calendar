export type Country = 'england-and-wales' | 'scotland' | 'northern-ireland';
export type Theme = 'light' | 'dark';

export interface Holiday {
  date: string; // YYYY-MM-DD
  title: string;
  notes?: string;
  bunting?: boolean;
}

export interface SchoolHoliday {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  term: string;
  isManual?: boolean;
  type?: 'school' | 'user' | 'event' | 'other_school'; // other_school is legacy
  time?: string; // Optional time string (HH:mm) for non-all-day events
  details?: string; // Optional details (e.g. competition name)
}

export interface CalendarData {
  publicHolidays: Holiday[];
  schoolHolidays: SchoolHoliday[];
}
