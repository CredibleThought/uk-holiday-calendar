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
}

export interface CalendarData {
  publicHolidays: Holiday[];
  schoolHolidays: SchoolHoliday[];
}
