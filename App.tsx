import React, { useState, useEffect, useCallback } from 'react';
import Controls from './components/Controls';
import Calendar from './components/Calendar';
import { fetchBankHolidays, fetchSchoolHolidays, getDefaultSchoolHolidays } from './services/holidayService';
import { Country, Holiday, SchoolHoliday, Theme } from './types';

const App: React.FC = () => {
  const [year, setYear] = useState<number>(2026);
  const [country, setCountry] = useState<Country>('england-and-wales');

  const [postcode, setPostcode] = useState<string>('');
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Check system preference or local storage on mount could go here
    // For now defaulting to light as per state init, but let's check basic system pref
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [publicHolidays, setPublicHolidays] = useState<Holiday[]>([]);
  const [schoolHolidays, setSchoolHolidays] = useState<SchoolHoliday[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [searchingSchool, setSearchingSchool] = useState<boolean>(false);

  // Initial Data Load & Country Change
  const loadData = useCallback(async () => {
    setLoading(true);

    // 1. Fetch Bank Holidays
    const bankHolidays = await fetchBankHolidays(country);
    setPublicHolidays(bankHolidays);

    // 2. Set Default School Holidays for the selected Country
    const defaultSchoolHolidays = getDefaultSchoolHolidays(country);
    const sortedDefaults = [...defaultSchoolHolidays].sort((a, b) => a.startDate.localeCompare(b.startDate));
    setSchoolHolidays(sortedDefaults);

    setLoading(false);
  }, [country]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearchSchoolHolidays = async () => {
    if (!postcode) return;
    setSearchingSchool(true);
    try {
      const holidays = await fetchSchoolHolidays(postcode);
      // Sort the fetched holidays
      const sorted = [...holidays].sort((a, b) => a.startDate.localeCompare(b.startDate));
      setSchoolHolidays(sorted);
    } catch (e) {
      console.error("Error fetching school holidays", e);
      alert("Could not fetch school holidays. Please try again.");
    } finally {
      setSearchingSchool(false);
    }
  };

  const handleAddSchoolHoliday = (holiday: SchoolHoliday) => {
    setSchoolHolidays(prev => {
      const updated = [...prev, holiday];
      return updated.sort((a, b) => a.startDate.localeCompare(b.startDate));
    });
  };

  const handleUpdateSchoolHoliday = (oldHoliday: SchoolHoliday, newHoliday: SchoolHoliday) => {
    setSchoolHolidays(prev => {
      const filtered = prev.filter(h => h !== oldHoliday);
      const updated = [...filtered, newHoliday];
      return updated.sort((a, b) => a.startDate.localeCompare(b.startDate));
    });
  };

  const handleRemoveSchoolHoliday = (holidayToRemove: SchoolHoliday) => {
    setSchoolHolidays(prev => prev.filter(h => h !== holidayToRemove));
  };

  const handleSaveConfig = () => {
    const data = {
      year,
      country,
      postcode,
      schoolHolidays
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-config-${year}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        if (typeof data.year === 'number') setYear(data.year);
        if (data.country) setCountry(data.country as Country);
        if (typeof data.postcode === 'string') setPostcode(data.postcode);
        if (Array.isArray(data.schoolHolidays)) {
          // Ensure dates are sorted when loading
          const sorted = [...data.schoolHolidays].sort((a: SchoolHoliday, b: SchoolHoliday) => a.startDate.localeCompare(b.startDate));
          setSchoolHolidays(sorted);
        }

      } catch (error) {
        alert('Failed to load configuration file. Please ensure it is a valid JSON file.');
        console.error(error);
      }
    };
    reader.readAsText(file);
    // Reset input to allow reloading the same file if needed
    e.target.value = '';
  };

  const getCountryDisplayName = (c: Country) => {
    switch (c) {
      case 'england-and-wales': return 'England & Wales';
      case 'scotland': return 'Scotland';
      case 'northern-ireland': return 'Northern Ireland';
      default: return 'UK';
    }
  };

  return (
    <div className="min-h-screen pb-12 transition-colors duration-300 dark:bg-slate-900">
      {/* Navigation / Brand - Hide on Print */}
      <nav className="bg-[#0b0c0c] border-b-4 border-[#005ea5] text-white py-4 px-6 mb-8 no-print dark:border-blue-500">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-white text-black font-serif px-1.5 rounded-sm text-lg">UK</span>
            Holiday Planner
          </h1>
          <div className="text-sm text-gray-300">
            Official Gov.uk Data Compatible
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 print:px-0 print:max-w-none">
        <Controls
          year={year}
          country={country}
          postcode={postcode}

          schoolHolidays={schoolHolidays}
          theme={theme}
          onThemeChange={setTheme}
          onYearChange={setYear}
          onCountryChange={setCountry}
          onPostcodeChange={setPostcode}
          onSearchSchoolHolidays={handleSearchSchoolHolidays}
          onAddHoliday={handleAddSchoolHoliday}
          onUpdateHoliday={handleUpdateSchoolHoliday}
          onRemoveHoliday={handleRemoveSchoolHoliday}
          onSaveConfig={handleSaveConfig}
          onLoadConfig={handleLoadConfig}
          isSearching={searchingSchool}
        />

        <div className="shadow-2xl print:shadow-none">
          <Calendar
            year={year}
            publicHolidays={publicHolidays}
            schoolHolidays={schoolHolidays}
            loading={loading}
            countryName={getCountryDisplayName(country)}
          />
        </div>
      </main>
    </div>
  );
};

export default App;