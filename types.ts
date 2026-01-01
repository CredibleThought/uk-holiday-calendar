export type Country = 'england-and-wales' | 'scotland' | 'northern-ireland';

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
}

export interface CalendarData {
  publicHolidays: Holiday[];
  schoolHolidays: SchoolHoliday[];
}
