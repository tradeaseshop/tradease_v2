import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Search, ChevronRight, Globe, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { NIGERIAN_STATES } from '../data';

interface LocationSelectorProps {
  onLocationSelected: (location: { state: string; city: string }) => void;
}

export default function LocationSelector({ onLocationSelected }: LocationSelectorProps) {
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [stateSearch, setStateSearch] = useState<string>('');
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  // Find cities for the selected state
  const stateData = NIGERIAN_STATES.find(s => s.name === selectedState);
  const cities = stateData ? stateData.cities : [];

  const filteredStates = NIGERIAN_STATES.filter(state =>
    state.name.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const handleStateClick = (stateName: string) => {
    setSelectedState(stateName);
    setSelectedCity(''); // Reset city when state changes
    setIsStateDropdownOpen(false);
  };

  const handleConfirm = () => {
    if (selectedState && selectedCity) {
      onLocationSelected({ state: selectedState, city: selectedCity });
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950 font-sans justify-between overflow-hidden">
      {/* Upper header */}
      <div className="p-6 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg shadow-sm">
            🇳🇬
          </div>
          <div>
            <span className="text-[10px] tracking-wider font-extrabold text-gray-400 uppercase">Country Hub</span>
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">Nigeria Delivery Base</h2>
          </div>
        </div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
          Where should we deliver?
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Select your State and Local Hub to browse nearby vendors and enjoy ultra-fast shipping logistics.
        </p>
      </div>

      {/* Main Form Fields */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        
        {/* State Selection */}
        <div className="space-y-2 relative">
          <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
            1. Select State
          </label>
          
          {/* Custom Select Dropdown Button */}
          <button
            type="button"
            onClick={() => {
              setIsStateDropdownOpen(!isStateDropdownOpen);
              setIsCityDropdownOpen(false); // Close the other dropdown
            }}
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl py-3.5 px-4 text-sm text-left font-semibold text-gray-850 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>{selectedState || "Select a Nigerian State..."}</span>
            </div>
            {isStateDropdownOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400 animate-fade-in" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* Floating Dropdown Panel */}
          {isStateDropdownOpen && (
            <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden max-h-60 flex flex-col">
              {/* Internal Dropdown Search */}
              <div className="p-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/50 sticky top-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search state..."
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    onClick={(e) => e.stopPropagation()} // Prevent closing dropdown on search click
                  />
                </div>
              </div>

              {/* Scrollable List */}
              <div className="overflow-y-auto py-1">
                {filteredStates.length > 0 ? (
                  filteredStates.map((state) => (
                    <button
                      key={state.name}
                      type="button"
                      onClick={() => handleStateClick(state.name)}
                      className={`w-full py-2.5 px-4 text-left text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-800/80 flex items-center justify-between cursor-pointer ${
                        selectedState === state.name
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{state.name}</span>
                      {selectedState === state.name && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="py-4 px-4 text-center text-xs text-gray-400 dark:text-gray-500">
                    No states found matching "{stateSearch}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* City Selection dropdown panel */}
        <div className="space-y-2 relative">
          <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
            2. Select Hub / City
          </label>

          {selectedState ? (
            <>
              {/* Custom Select Dropdown Button for City */}
              <button
                type="button"
                onClick={() => {
                  setIsCityDropdownOpen(!isCityDropdownOpen);
                  setIsStateDropdownOpen(false); // Close the other dropdown
                }}
                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl py-3.5 px-4 text-sm text-left font-semibold text-gray-850 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span>{selectedCity || "Select your Delivery Hub..."}</span>
                </div>
                {isCityDropdownOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Floating Dropdown Panel for Cities */}
              {isCityDropdownOpen && (
                <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden max-h-56 flex flex-col animate-fade-in">
                  {/* Title Header */}
                  <div className="p-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Available shipping hubs in {selectedState}
                  </div>

                  {/* Scrollable List */}
                  <div className="overflow-y-auto py-1">
                    {cities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          setSelectedCity(city);
                          setIsCityDropdownOpen(false);
                        }}
                        className={`w-full py-2.5 px-4 text-left text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-800/80 flex items-center justify-between cursor-pointer ${
                          selectedCity === city
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span>{city}</span>
                        {selectedCity === city && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-5 text-center bg-gray-50/50 dark:bg-slate-900/40">
              <MapPin className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Please pick a Nigerian State first to see its available local shipping centers.
              </p>
            </div>
          )}
        </div>

        {/* Informative Checkout Notice Card */}
        <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/30 dark:border-emerald-900/35 flex gap-2.5">
          <Globe className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Instant Online Payouts</h4>
            <p className="text-[10px] text-emerald-700/80 dark:text-emerald-500/80 leading-relaxed mt-0.5">
              TradeEase integrates seamlessly with industry-standard payment processors for automated, secure local Naira transactions.
            </p>
          </div>
        </div>

      </div>

      {/* Button footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <button
          onClick={handleConfirm}
          disabled={!selectedState || !selectedCity}
          className={`w-full py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all ${
            selectedState && selectedCity
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-[0.99] cursor-pointer'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          <span>Continue inside TradeEase</span>
          {selectedState && selectedCity && (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
