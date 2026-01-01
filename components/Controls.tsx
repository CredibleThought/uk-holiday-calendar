import React, { useState, useMemo, useRef } from 'react';
import { Country, SchoolHoliday } from '../types';
import { Search, Printer, Edit2, Plus, Trash2, ExternalLink, ChevronDown, ChevronUp, Save, X, Download, Upload } from 'lucide-react';

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
}) => {
  const [showManual, setShowManual] = useState(false);
  const [newHoliday, setNewHoliday] = useState<SchoolHoliday>({ startDate: '', endDate: '', term: '' });
  const [editingHoliday, setEditingHoliday] = useState<SchoolHoliday | null>(null);
  
  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        onAddHoliday({ ...newHoliday });
      }
      setNewHoliday({ startDate: '', endDate: '', term: '' });
    }
  };

  const startEdit = (holiday: SchoolHoliday) => {
    setNewHoliday({ ...holiday });
    setEditingHoliday(holiday);
  };

  const cancelEdit = () => {
    setNewHoliday({ startDate: '', endDate: '', term: '' });
    setEditingHoliday(null);
  };

  // Filter holidays to only show those relevant to the selected year
  const filteredHolidays = useMemo(() => {
    return schoolHolidays.filter(h => {
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;
      // Check if holiday overlaps with the year
      return h.startDate <= yearEnd && h.endDate >= yearStart;
    });
  }, [schoolHolidays, year]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-8 no-print">
      {/* Top Row: Basic Controls */}
      <div className="flex flex-col md:flex-row gap-6 items-end mb-6">
        
        {/* Year Selection */}
        <div className="w-full md:w-32">
          <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
          <div className="relative">
            <input
              type="number"
              value={year}
              onChange={(e) => onYearChange(parseInt(e.target.value))}
              className="w-full pl-3 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Country Selection */}
        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-slate-700 mb-1">Country (Public Holidays)</label>
          <select
            value={country}
            onChange={(e) => onCountryChange(e.target.value as Country)}
            className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="england-and-wales">England & Wales</option>
            <option value="scotland">Scotland</option>
            <option value="northern-ireland">Northern Ireland</option>
          </select>
        </div>

        {/* Postcode Input */}
        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-slate-700 mb-1">Postcode (Auto-Estimate)</label>
          <div className="flex">
            <input
              type="text"
              placeholder="e.g. SW1A 1AA"
              value={postcode}
              onChange={(e) => onPostcodeChange(e.target.value.toUpperCase())}
              className="w-full pl-3 pr-3 py-2 border border-slate-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
          {/* File Operations */}
          <div className="flex gap-1 border-r border-slate-200 pr-2 mr-1">
             <button
              onClick={onSaveConfig}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors"
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
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors"
              title="Load Configuration from File"
             >
               <Upload size={16} />
               <span className="hidden sm:inline text-xs font-medium">Load</span>
             </button>
          </div>

          {/* Edit Toggle */}
          <button
            onClick={() => setShowManual(!showManual)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all border ${showManual ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
            title="Edit Dates Manually"
          >
            <Edit2 size={16} />
            <span className="hidden sm:inline">Edit Dates</span>
            {showManual ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-md transition-all shadow-md hover:shadow-lg"
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
                      onChange={e => setNewHoliday({...newHoliday, startDate: e.target.value})}
                      className="w-full p-2 text-sm border border-slate-300 rounded"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                    <input 
                      type="date" 
                      required
                      value={newHoliday.endDate}
                      onChange={e => setNewHoliday({...newHoliday, endDate: e.target.value})}
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
                      onChange={e => setNewHoliday({...newHoliday, term: e.target.value})}
                      className="w-full p-2 text-sm border border-slate-300 rounded"
                    />
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

                {/* List */}
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-md">
                   {filteredHolidays.length === 0 ? (
                     <div className="p-4 text-center text-sm text-slate-400 italic">No school holidays found for {year}.</div>
                   ) : (
                     <table className="w-full text-sm text-left">
                       <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
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
        <div className="mt-4 text-xs text-slate-500 bg-blue-50 p-3 rounded border border-blue-100 flex items-start gap-2">
          <div className="mt-0.5 text-blue-500 flex-shrink-0">
             <ExternalLink size={14} />
          </div>
          <p>
            <strong>Note:</strong> Public holidays are official (Gov.uk). School holidays are estimated based on postcode. 
            For exact dates, use the <strong>"Edit Dates"</strong> button to manually adjust them according to your local council website.
          </p>
        </div>
      )}
    </div>
  );
};

export default Controls;
