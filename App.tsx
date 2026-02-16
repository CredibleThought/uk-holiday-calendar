import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Controls from './components/Controls';
import Calendar from './components/Calendar';
import EventsList from './components/EventsList';
import { fetchBankHolidays, fetchSchoolHolidays, getDefaultSchoolHolidays } from './services/holidayService';
import { Country, Holiday, SchoolHoliday, Theme } from './types';
import { Coffee } from 'lucide-react';
import { matchesFilter } from './utils/filterUtils';
import { importCalendarFromUrl } from './utils/importUtils';

const App: React.FC = () => {
  const [year, setYear] = useState<number>(2026);
  const [country, setCountry] = useState<Country>('england-and-wales');

  const [postcode, setPostcode] = useState<string>('');
  const [theme, setTheme] = useState<Theme>('light');

  // Manual Entry State (Lifted from Controls)
  const [showManual, setShowManual] = useState(false);
  const [newHoliday, setNewHoliday] = useState<SchoolHoliday>({ startDate: '', endDate: '', term: '', isManual: true, type: 'user' });
  const [editingHoliday, setEditingHoliday] = useState<SchoolHoliday | null>(null);

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

  // Filter State (Lifted from Controls)
  const [searchText, setSearchText] = useState('');
  const [filterText, setFilterText] = useState('');
  const [showEventsList, setShowEventsList] = useState(false);
  const [showSchoolHolidays, setShowSchoolHolidays] = useState(true);

  // Filter holidays logic
  const filteredHolidays = useMemo(() => {
    console.log('Filtering holidays...', { showSchoolHolidays, count: schoolHolidays.length });
    return schoolHolidays.filter(h => {
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;
      // Check if holiday overlaps with the year
      const inYear = h.startDate <= yearEnd && h.endDate >= yearStart;
      if (!inYear) return false;

      // Debug Log (only once per render cycle effectively)
      if (h === schoolHolidays[0]) {
        console.log('Filtering check:', { showSchoolHolidays, type: h.type, term: h.term });
      }

      // Filter Logic for School Holidays Toggle
      if (!showSchoolHolidays && h.type === 'school') {
        return false;
      }

      // Filter text check
      if (!filterText) return true;

      const searchTerms = [
        h.term,
        h.startDate,
        h.endDate
      ].join(' '); // Combine fields to search against

      return matchesFilter(searchTerms, filterText);
    });
  }, [schoolHolidays, year, filterText, showSchoolHolidays]);

  // Filter Public Holidays Logic
  const filteredPublicHolidays = useMemo(() => {
    return publicHolidays.filter(h => {
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;
      // Check if public holiday falls in the year (though typically they are fetched per year/country, 
      // but bank holiday endpoint usually returns multiple years so strict filtering is good).
      // Actually gov.uk bank holidays endpoint usually returns fairly localized list but let's be safe.
      if (!h.date.startsWith(String(year))) return false;

      // Public holidays are ALWAYS shown, regardless of filter text
      return true;
    });
  }, [publicHolidays, year, filterText]);

  // Ref to track if we are currently loading a config file
  const loadingConfigRef = useRef(false);

  // Initial Data Load & Country Change
  const loadData = useCallback(async () => {
    setLoading(true);

    // 1. Fetch Bank Holidays
    const bankHolidays = await fetchBankHolidays(country);
    setPublicHolidays(bankHolidays);

    // 2. Set Default School Holidays for the selected Country
    // Only if NOT loading from a config file
    if (!loadingConfigRef.current) {
      const defaultSchoolHolidays = getDefaultSchoolHolidays(country);
      const sortedDefaults = [...defaultSchoolHolidays].sort((a, b) => a.startDate.localeCompare(b.startDate));
      setSchoolHolidays(sortedDefaults);
    } else {
      // Reset the flag efficiently
      loadingConfigRef.current = false;
    }

    setLoading(false);
  }, [country]);



  useEffect(() => {
    loadData();
  }, [loadData]);


  // Check for URL parameters (calendarUrl)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const calendarUrl = params.get('calendarUrl');

    if (calendarUrl) {
      // Small delay to ensure initial data load doesn't conflict, though state updates are batched.
      // But better to let the main loadData finish or at least start.
      // Actually, since we want to appending to schoolHolidays, we need to be careful about strict mode double invocation.
      const handleUrlImport = async () => {
        setLoading(true); // Re-use loading state or maybe just let it run in background?
        // Let's run in background but show a loading indicator if possible?
        // For now, re-using loading might be jarring if it flickers.
        // Let's just do it.

        try {
          // function importCalendarFromUrl(url: string, existingHolidays: SchoolHoliday[])
          // We pass [] as existing because at this exact mounting point, schoolHolidays might still be empty from initial state,
          // or populated by loadData which is also async.
          // This is a bit tricky with React 18 strict mode and async race conditions.
          // However, the import logic does its own duplicate checking against the list we pass it.
          // If we pass [], it won't dedup against loaded defaults.
          // But `importCalendarFromUrl` returns valid holidays.

          let decodedUrl = calendarUrl;
          try {
            decodedUrl = decodeURIComponent(calendarUrl);
          } catch (e) {
            console.warn('Failed to decode calendar URL, using raw:', e);
          }

          const result = await importCalendarFromUrl(decodedUrl, []);
          // We pass empty array for "existing" to the utility, but we will handle deduping when adding to state below.
          // Actually, the utility uses the passed array to check for duplicates. 
          // If we want to dedup against *eventually* loaded defaults, we might have an issue if this runs faster or slower.
          // But generally, the user presumably wants these URL holidays *in addition* to defaults, or they might duplicate.
          // Let's trust the utility for internal dedup (within the ICS) and then merging.

          if (result.success && result.holidays.length > 0) {
            console.log('Sample imported:', result.holidays.slice(0, 3));
            setSchoolHolidays(prev => {
              const combined = [...prev];

              result.holidays.forEach(newH => {
                // Dedup by date AND term (title) to allow multiple events on same day
                const isDuplicate = combined.some(h =>
                  h.startDate === newH.startDate &&
                  h.endDate === newH.endDate &&
                  h.term === newH.term
                );

                if (!isDuplicate) {
                  combined.push(newH);
                }
              });
              return combined.sort((a, b) => a.startDate.localeCompare(b.startDate));
            });
            // Notify user of success
            // Console log is enough for success, alert is too intrusive for auto-load
            console.log(`Auto-imported ${result.count} events from URL.`);
          } else if (!result.success) {
            // Notify user of failure
            setTimeout(() => alert(`Failed to auto-import calendar: ${result.message}`), 100);
          }
        } catch (err: any) {
          console.error("Failed to auto-import from URL param", err);
          setTimeout(() => alert(`Error auto-importing calendar: ${err.message}`), 100);
        } finally {
          setLoading(false);
        }
      };

      handleUrlImport();
    }
  }, []); // Run once on mount


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

  const handleAddHolidays = (holidays: SchoolHoliday[]) => {
    setSchoolHolidays(prev => {
      const combined = [...prev];
      holidays.forEach(newH => {
        // Simple duplicate check (exact match)
        const exists = combined.some(h =>
          h.startDate === newH.startDate &&
          h.endDate === newH.endDate &&
          h.term === newH.term
        );
        if (!exists) combined.push(newH);
      });
      return combined.sort((a, b) => a.startDate.localeCompare(b.startDate));
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

  const handleSaveConfig = async () => {
    const data = {
      year,
      country,
      postcode,
      schoolHolidays
    };
    const json = JSON.stringify(data, null, 2);

    try {
      // Check for File System Access API support
      // @ts-ignore
      if (typeof window.showSaveFilePicker === 'function') {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
          suggestedName: `calendar-config-${year}.json`,
          types: [{
            description: 'JSON Configuration',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
        return;
      }
    } catch (err: any) {
      // If user cancelled, don't fallback to auto-download
      if (err.name === 'AbortError') {
        return;
      }
      console.error('File System Access API error:', err);
      // Proceed to fallback if it was a technical error
    }

    // Fallback: Auto-download
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
          // Flag that we are loading config so loadData doesn't overwrite school holidays
          // if country state change triggers it.
          // Note: If country in file is different from current state,
          // setCountry will trigger useEffect -> loadData.
          if (data.country && data.country !== country) {
            loadingConfigRef.current = true;
          } else {
            // If country is same, loadData won't run, so we don't need the flag.
            // But to be safe, clear it.
            loadingConfigRef.current = false;
          }

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

  const handleDateClick = (dateStr: string) => {
    if (!showManual) return;

    setNewHoliday(prev => {
      // If we are editing a specific holiday or creating a new one
      const currentStart = prev.startDate;
      const currentEnd = prev.endDate;

      if (!currentStart || (currentStart && currentEnd)) {
        // Start new range (or reset if both were set)
        return { ...prev, startDate: dateStr, endDate: '', isManual: true, type: prev.type || 'user' };
      } else {
        // Completing the range
        if (dateStr < currentStart) {
          // User clicked earlier date, swap
          return { ...prev, startDate: dateStr, endDate: currentStart, isManual: true, type: prev.type || 'user' };
        } else {
          // Standard range
          // Standard range
          return { ...prev, endDate: dateStr, isManual: true, type: prev.type || 'user' };
        }
      }
    });
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
          <a
            href="https://buymeacoffee.com/stevefernandes"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 bg-[#FFDD00] text-black px-4 py-2 rounded-full font-['Cookie'] text-2xl hover:bg-[#ffea00] transition-colors shadow-sm ml-4 border-2 border-black/10"
            title="Support the developer"
          >
            <Coffee size={20} className="text-black/80" />
            Buy me a coffee
          </a>
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
          showManual={showManual}
          setShowManual={setShowManual}
          newHoliday={newHoliday}
          setNewHoliday={setNewHoliday}
          editingHoliday={editingHoliday}
          setEditingHoliday={setEditingHoliday}

          // Filter Props
          searchText={searchText}
          setSearchText={setSearchText}
          filterText={filterText}
          setFilterText={setFilterText}
          filteredHolidays={filteredHolidays}
          showEventsList={showEventsList}
          setShowEventsList={setShowEventsList}
          showSchoolHolidays={showSchoolHolidays}
          setShowSchoolHolidays={setShowSchoolHolidays}
        />

        <div className="shadow-2xl print:shadow-none">
          <Calendar
            year={year}
            publicHolidays={filteredPublicHolidays}
            schoolHolidays={filteredHolidays}
            loading={loading}
            countryName={getCountryDisplayName(country)}
            onDateClick={handleDateClick}
            selectionRange={showManual ? { start: newHoliday.startDate, end: newHoliday.endDate } : null}
          />

          {showEventsList && (
            <EventsList
              year={year}
              publicHolidays={filteredPublicHolidays}
              schoolHolidays={filteredHolidays}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;