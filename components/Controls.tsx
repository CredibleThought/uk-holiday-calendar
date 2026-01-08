import React, { useState, useRef } from 'react';
import ICAL from 'ical.js';
import { Country, SchoolHoliday, Theme } from '../types';
import { Search, Printer, Edit2, Plus, Trash2, ExternalLink, ChevronDown, ChevronUp, Save, X, Download, Upload, Sun, Moon, CalendarPlus } from 'lucide-react';
import { generateGoogleCalendarLink, generateOutlookLink, generateOffice365Link, generateIcsContent } from '../utils/calendarUtils';

interface ControlsProps {
  year: number;
  country: Country;
  postcode: string;
  schoolHolidays: SchoolHoliday[];
  onYearChange: (y: number) => void;
  onCountryChange: (c: Country) => void;
  onPostcodeChange: (p: string) => void;
  onSearchSchoolHolidays: () => void;
  onAddHoliday: (h: SchoolHoliday) => void;
  onUpdateHoliday: (oldH: SchoolHoliday, newH: SchoolHoliday) => void;
  onRemoveHoliday: (h: SchoolHoliday) => void;
  onSaveConfig: () => void;
  onLoadConfig: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSearching: boolean;
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  // Lifted State Props
  showManual: boolean;
  setShowManual: (show: boolean) => void;
  newHoliday: SchoolHoliday;
  setNewHoliday: (h: SchoolHoliday) => void;
  editingHoliday: SchoolHoliday | null;
  setEditingHoliday: (h: SchoolHoliday | null) => void;
  // Filter Props
  searchText: string;
  setSearchText: (text: string) => void;
  filterText: string;
  setFilterText: (text: string) => void;
  filteredHolidays: SchoolHoliday[];
}


const Controls: React.FC<ControlsProps> = ({
  year,
  country,
  postcode,
  schoolHolidays,
  onYearChange,
  onCountryChange,
  onPostcodeChange,
  onSearchSchoolHolidays,
  onAddHoliday,
  onUpdateHoliday,
  onRemoveHoliday,
  onSaveConfig,
  onLoadConfig,
  isSearching,
  theme,
  onThemeChange,
  showManual,
  setShowManual,
  newHoliday,
  setNewHoliday,
  editingHoliday,
  setEditingHoliday,
  // Filter Props
  searchText,
  setSearchText,
  filterText,
  setFilterText,
  filteredHolidays,
}) => {
  // Local state removed, using props now

  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import Status State
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState<string>('');

  // Track which calendar menu is open (by holiday object reference or index)
  // Using index for simplicity in the map loop, or unique ID if available. 
  // Since holidays don't have IDs, we'll try to use a composite key or just track the currently open index in the filtered list.
  const [openCalendarMenuIndex, setOpenCalendarMenuIndex] = useState<number | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const triggerLoad = () => {
    fileInputRef.current?.click();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHoliday.startDate && newHoliday.endDate && newHoliday.term) {
      if (editingHoliday) {
        onUpdateHoliday(editingHoliday, { ...newHoliday });
        setEditingHoliday(null);
      } else {
        onAddHoliday({ ...newHoliday, isManual: true, type: newHoliday.type || 'user' });
      }
      setNewHoliday({ startDate: '', endDate: '', term: '', isManual: true, type: 'user' });
    }
  };

  const startEdit = (holiday: SchoolHoliday) => {
    // If it's manual, we want to map 'school' type to 'other_school' for the UI radio button
    // because "Manual School" = "Other School" in our new logic.
    let inferredType = holiday.type;

    if (holiday.isManual) {
      if (!holiday.type || holiday.type === 'school') {
        inferredType = 'other_school';
      }
    } else {
      inferredType = 'school';
    }

    setNewHoliday({ ...holiday, type: inferredType });
    setEditingHoliday(holiday);
  };

  const cancelEdit = () => {
    setNewHoliday({ startDate: '', endDate: '', term: '', isManual: true, type: 'user' });
    setEditingHoliday(null);
  };

  // Filter State and Logic Removed (Moved to App.tsx)

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-8 no-print dark:bg-slate-800 dark:border-slate-700">
      {/* Top Row: Basic Controls */}
      <div className="flex flex-col md:flex-row gap-6 items-end mb-6">

        {/* Year Selection */}
        <div className="w-full md:w-32">
          <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Year</label>
          <div className="relative">
            <input
              type="number"
              value={year}
              onChange={(e) => onYearChange(parseInt(e.target.value))}
              className="w-full pl-3 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
        </div>

        {/* Country Selection */}
        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Country (Public Holidays)</label>
          <select
            value={country}
            onChange={(e) => onCountryChange(e.target.value as Country)}
            className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            <option value="england-and-wales">England & Wales</option>
            <option value="scotland">Scotland</option>
            <option value="northern-ireland">Northern Ireland</option>
          </select>
        </div>

        {/* Postcode Input */}
        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">Postcode (Auto-Estimate)</label>
          <div className="flex">
            <input
              type="text"
              placeholder="e.g. SW1A 1AA"
              value={postcode}
              onChange={(e) => onPostcodeChange(e.target.value.toUpperCase())}
              className="w-full pl-3 pr-3 py-2 border border-slate-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
            <button
              onClick={onSearchSchoolHolidays}
              disabled={isSearching || !postcode}
              className="bg-[#005ea5] hover:bg-[#004f8c] text-white px-4 py-2 rounded-r-md flex items-center transition-colors disabled:opacity-50"
              title="Estimate dates based on postcode"
            >
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search size={20} />
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="ml-auto flex flex-wrap gap-2 md:gap-3">
          {/* Theme Toggle */}
          <button
            onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
            className="flex items-center justify-center p-2 rounded-md transition-all border bg-white border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-slate-600 dark:border-slate-500 dark:text-white dark:hover:bg-slate-500"
            title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* File Operations */}
          <div className="flex gap-1 border-r border-slate-200 pr-2 mr-1">
            <button
              onClick={onSaveConfig}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors dark:bg-slate-600 dark:border-slate-500 dark:text-white dark:hover:bg-slate-500"
              title="Save Configuration to File"
            >
              <Download size={16} />
              <span className="hidden sm:inline text-xs font-medium">Save</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={onLoadConfig}
              className="hidden"
              accept=".json"
            />
            <button
              onClick={triggerLoad}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors dark:bg-slate-600 dark:border-slate-500 dark:text-white dark:hover:bg-slate-500"
              title="Load Configuration from File"
            >
              <Upload size={16} />
              <span className="hidden sm:inline text-xs font-medium">Load</span>
            </button>
          </div>

          {/* Edit Toggle */}
          <button
            onClick={() => setShowManual(!showManual)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all border ${showManual ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-100' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-slate-600 dark:border-slate-500 dark:text-white dark:hover:bg-slate-500'}`}
            title="Edit Dates Manually"
          >
            <Edit2 size={16} />
            <span className="hidden sm:inline">Edit Dates</span>
            {showManual ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-md transition-all shadow-md hover:shadow-lg dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <Printer size={18} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Manual Entry Section */}
      {showManual && (
        <div className="border-t border-slate-200 pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col md:flex-row gap-8">

            {/* Left: Instructions & External Link */}
            <div className="md:w-1/3 space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">Step 1</span>
                Find Official Dates
              </h3>
              <p className="text-sm text-slate-600">
                Because school terms vary by council, use the official GOV.UK finder to locate your local council's specific holiday calendar.
              </p>
              <a
                href="https://www.gov.uk/school-term-holiday-dates"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#005ea5] hover:underline"
              >
                Open GOV.UK School Term Finder <ExternalLink size={14} />
              </a>
            </div>

            {/* Right: Manual Entry Form & List */}
            <div className="md:w-2/3 space-y-4 border-l border-slate-200 pl-0 md:pl-8">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">Step 2</span>
                Add / Edit Holidays ({year})
              </h3>

              {/* Form */}
              <form onSubmit={handleManualSubmit} className={`p-4 rounded-md border ${editingHoliday ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'} grid grid-cols-1 sm:grid-cols-7 gap-3 items-end transition-colors`}>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newHoliday.startDate}
                    onChange={e => setNewHoliday({ ...newHoliday, startDate: e.target.value })}
                    className="w-full p-2 text-sm border border-slate-300 rounded"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newHoliday.endDate}
                    onChange={e => setNewHoliday({ ...newHoliday, endDate: e.target.value })}
                    className="w-full p-2 text-sm border border-slate-300 rounded"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Easter"
                    required
                    value={newHoliday.term}
                    onChange={e => setNewHoliday({ ...newHoliday, term: e.target.value })}
                    className="w-full p-2 text-sm border border-slate-300 rounded"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                  <div className="flex gap-4 pt-1 items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="holidayType"
                        value="user"
                        checked={!newHoliday.type || newHoliday.type === 'user'}
                        onChange={() => setNewHoliday({ ...newHoliday, type: 'user' })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Personal</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="holidayType"
                        value="school"
                        checked={newHoliday.type === 'school'}
                        onChange={() => setNewHoliday({ ...newHoliday, type: 'school' })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">School</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="holidayType"
                        value="other_school"
                        checked={newHoliday.type === 'other_school'}
                        onChange={() => setNewHoliday({ ...newHoliday, type: 'other_school' })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Other School</span>
                    </label>
                  </div>
                </div>
                <div className="sm:col-span-1 flex gap-1">
                  <button
                    type="submit"
                    className={`w-full ${editingHoliday ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white p-2 rounded flex justify-center items-center`}
                    title={editingHoliday ? "Update holiday" : "Add holiday"}
                  >
                    {editingHoliday ? <Save size={20} /> : <Plus size={20} />}
                  </button>
                  {editingHoliday && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="w-full bg-slate-400 hover:bg-slate-500 text-white p-2 rounded flex justify-center items-center"
                      title="Cancel edit"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </form>

              {/* Filter Input */}
              <div className="mb-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setFilterText(searchText);
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                    {searchText && (
                      <button
                        onClick={() => {
                          setSearchText('');
                          setFilterText('');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setFilterText(searchText)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={searchText === filterText}
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-md dark:border-slate-700">
                {filteredHolidays.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400 italic">
                    {filterText ? "No matching holidays found." : `No school holidays found for ${year}.`}
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                      <tr>
                        <th className="p-2 pl-4">Term</th>
                        <th className="p-2">Start</th>
                        <th className="p-2">End</th>
                        <th className="p-2 text-right pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredHolidays.map((h, idx) => {
                        const isEditing = h === editingHoliday;
                        return (
                          <tr key={idx} className={`hover:bg-slate-50 ${isEditing ? 'bg-blue-50' : ''}`}>
                            <td className="p-2 pl-4 font-medium text-slate-700">{h.term}</td>
                            <td className="p-2 text-slate-600">{h.startDate}</td>
                            <td className="p-2 text-slate-600">{h.endDate}</td>
                            <td className="p-2 text-right pr-4 flex justify-end gap-1">
                              <div className="relative">
                                <button
                                  onClick={() => setOpenCalendarMenuIndex(openCalendarMenuIndex === idx ? null : idx)}
                                  className="text-slate-500 hover:text-blue-600 p-1 hover:bg-blue-100 rounded"
                                  title="Add to Calendar"
                                >
                                  <CalendarPlus size={16} />
                                </button>

                                {openCalendarMenuIndex === idx && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-10"
                                      onClick={() => setOpenCalendarMenuIndex(null)}
                                    />
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 z-20 py-1">
                                      <a
                                        href={generateGoogleCalendarLink(h)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                        onClick={() => setOpenCalendarMenuIndex(null)}
                                      >
                                        Google Calendar
                                      </a>
                                      <a
                                        href={generateOutlookLink(h)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                        onClick={() => setOpenCalendarMenuIndex(null)}
                                      >
                                        Outlook.com
                                      </a>
                                      <a
                                        href={generateOffice365Link(h)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                        onClick={() => setOpenCalendarMenuIndex(null)}
                                      >
                                        Office 365
                                      </a>
                                      <button
                                        onClick={() => {
                                          const icsContent = generateIcsContent(h);
                                          const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                                          const url = URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = `${h.term.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
                                          document.body.appendChild(a);
                                          a.click();
                                          document.body.removeChild(a);
                                          setOpenCalendarMenuIndex(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                      >
                                        Apple / Outlook (.ics)
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                              <button
                                onClick={() => startEdit(h)}
                                className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-100 rounded"
                                title="Edit holiday"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => onRemoveHoliday(h)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                title="Remove holiday"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!showManual && (
        <div className="mt-4 space-y-4">
          {/* Import Section */}
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-3">
              <Download size={18} />
              Import Outlook Calendar
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Paste Outlook Shared Calendar Link (e.g. .../calendar.html)"
                className="flex-1 p-2 text-sm border border-blue-300 rounded outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                id="outlook-url-input"
                disabled={importStatus === 'loading'}
              />
              <button
                onClick={async () => {
                  const input = document.getElementById('outlook-url-input') as HTMLInputElement;
                  const url = input.value.trim();
                  if (!url) return;

                  setImportStatus('loading');
                  setImportMessage('');

                  try {
                    // 1. Transform URL: https://outlook.office365.com/.../calendar.html -> /api/outlook/.../calendar.ics
                    let fetchUrl = url;
                    // Always try to use the proxy if it's an absolute URL to avoid CORS, 
                    // unless it's already a relative path or we are sure about CORS.
                    // For now, keep the specific Outlook check but maybe expand it later or improve error msg.
                    if (url.includes('outlook.office365.com')) {
                      const urlObj = new URL(url);
                      fetchUrl = `/api/outlook${urlObj.pathname}`;
                    }

                    fetchUrl = fetchUrl.replace(/\.html$/, '.ics');

                    const response = await fetch(fetchUrl);
                    if (!response.ok) throw new Error(`Network response was not ok (${response.status})`);

                    const icsData = await response.text();

                    // Simple validation check
                    if (!icsData.includes('BEGIN:VCALENDAR')) {
                      throw new Error('Invalid calendar file format');
                    }

                    const jcalData = ICAL.parse(icsData);
                    const comp = new ICAL.Component(jcalData);
                    const vevents = comp.getAllSubcomponents('vevent');

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
                      const isDuplicate = schoolHolidays.some(h => h.startDate === startDate && h.endDate === endDate);
                      if (isDuplicate) {
                        return; // Skip duplicate
                      }

                      // Smart Classification:
                      const keywords = ['half term', 'break', 'holiday', 'easter', 'christmas', 'winter', 'spring', 'summer'];
                      const isStandardLike = keywords.some(k => summary.toLowerCase().includes(k));

                      onAddHoliday({
                        startDate,
                        endDate,
                        term: summary,
                        isManual: !isStandardLike,
                        type: !isStandardLike ? 'other_school' : 'school'
                      });
                      addedCount++;
                    });

                    setImportStatus('success');
                    setImportMessage(`Successfully imported ${addedCount} events!`);
                    input.value = '';

                    // Reset success message after 3 seconds
                    setTimeout(() => {
                      setImportStatus('idle');
                      setImportMessage('');
                    }, 5000);

                  } catch (e: any) {
                    console.error(e);
                    setImportStatus('error');
                    setImportMessage(e.message || 'Failed to import. Check URL & CORS.');
                  }
                }}
                disabled={importStatus === 'loading'}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${importStatus === 'loading' ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
              >
                {importStatus === 'loading' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Fetching...</span>
                  </>
                ) : (
                  'Fetch'
                )}
              </button>
            </div>
            {importMessage && (
              <div className={`mt-2 text-sm p-2 rounded ${importStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {importStatus === 'success' ? (
                  <span className="flex items-center gap-1">✓ {importMessage}</span>
                ) : (
                  <span className="flex items-center gap-1">⚠ {importMessage}</span>
                )}
              </div>
            )}
            <p className="text-xs text-blue-800 dark:text-blue-300 mt-2">
              <strong>Note:</strong> This uses a proxy to bypass CORS. Ensure you are running locally.
            </p>
          </div>

          <div className="text-xs text-slate-500 bg-white p-3 rounded border border-slate-200 flex items-start gap-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
            <div className="mt-0.5 text-blue-500 flex-shrink-0 dark:text-blue-400">
              <ExternalLink size={14} />
            </div>
            <p>
              <strong>Note:</strong> Public holidays are official (Gov.uk). School holidays are estimated based on postcode.
              For exact dates, use the <strong>"Edit Dates"</strong> button to manually adjust them according to your local council website.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Controls;
