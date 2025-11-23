'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { signedFetch } from '@/lib/client-hmac';

interface PollingStation {
  _id: string;
  partNo: number;
  partNameV1?: string;
  partNameEn?: string;
}

interface PollingStationSelectProps {
  value: string;
  onChange: (value: string) => void;
  constituency: string;
  disabled?: boolean;
  id?: string;
}

export default function PollingStationSelect({
  value,
  onChange,
  constituency,
  disabled = false,
  id,
}: PollingStationSelectProps) {
  const [pollingStations, setPollingStations] = useState<PollingStation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch polling stations when constituency changes
  useEffect(() => {
    if (!constituency) {
      setPollingStations([]);
      return;
    }

    const fetchPollingStations = async () => {
      setIsLoading(true);
      try {
        const response = await signedFetch(`/api/polling-stations?tsc=${constituency}`);
        const data = await response.json();

        if (data.success) {
          setPollingStations(data.data);
        }
      } catch (error) {
        console.error('Error fetching polling stations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPollingStations();
  }, [constituency]);

  // Update display value when value changes
  useEffect(() => {
    if (value) {
      const selected = pollingStations.find((ps) => ps.partNo.toString() === value);
      if (selected) {
        const tamilName = selected.partNameV1 || '';
        const englishName = selected.partNameEn || '';
        setDisplayValue(`Part ${selected.partNo} - ${englishName} / ${tamilName}`);
        setSearchTerm('');
      }
    } else {
      setDisplayValue('');
      setSearchTerm('');
    }
  }, [value, pollingStations]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter polling stations based on search term
  const filteredStations = pollingStations.filter((ps) => {
    const search = searchTerm.toLowerCase();
    const partNoStr = ps.partNo.toString();
    const nameV1 = ps.partNameV1?.toLowerCase() || '';
    const nameEn = ps.partNameEn?.toLowerCase() || '';

    return partNoStr.includes(search) || nameV1.includes(search) || nameEn.includes(search);
  });

  const handleSelect = (partNo: number) => {
    onChange(partNo.toString());
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClear = () => {
    onChange('');
    setSearchTerm('');
    setDisplayValue('');
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          id={id}
          type="text"
          value={isOpen ? searchTerm : displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={disabled || isLoading || !constituency}
          placeholder={
            isLoading
              ? 'Loading...'
              : !constituency
              ? 'Select constituency first'
              : 'Search by part number or name...'
          }
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
        />
        <ChevronDown
          className={`absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {isOpen && !disabled && !isLoading && constituency && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 border-b border-gray-200"
            >
              Clear selection
            </button>
          )}
          {filteredStations.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No polling stations found</div>
          ) : (
            filteredStations.map((ps) => (
              <button
                key={ps._id}
                type="button"
                onClick={() => handleSelect(ps.partNo)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 ${
                  value === ps.partNo.toString() ? 'bg-blue-100' : ''
                }`}
              >
                <div className="text-gray-500 text-xs">Part {ps.partNo}</div>
                <div className="text-gray-700 text-sm">
                  {ps.partNameEn || 'No English name'}
                </div>
                <div className="text-gray-900 font-medium text-sm">
                  {ps.partNameV1 || 'No Tamil name'}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
