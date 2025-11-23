'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { signedFetch } from '@/lib/client-hmac';

interface PollingStation2025 {
  _id: string;
  acNo: number;
  partNo: number;
  partNameV1?: string;
  partNameTn?: string;
  localityV1?: string;
  localityTn?: string;
}

interface CurrentPollingStationSelectProps {
  value: string;
  onChange: (value: string) => void;
  constituency?: string; // 2002 AC (e.g., "AC210") to filter 2025 polling stations
  disabled?: boolean;
  id?: string;
}

export default function CurrentPollingStationSelect({
  value,
  onChange,
  constituency,
  disabled = false,
  id,
}: CurrentPollingStationSelectProps) {
  const [pollingStations, setPollingStations] = useState<PollingStation2025[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch polling stations filtered by constituency
  useEffect(() => {
    const fetchPollingStations = async () => {
      if (!constituency) {
        setPollingStations([]);
        return;
      }

      setIsLoading(true);
      try {
        // Direct mapping from 2002 AC to 2025 AC
        const directMapping: Record<string, number> = {
          'AC210': 213,
          'AC211': 217,
          'AC212': 218,
          'AC225': 215,
          'AC226': 216,
          'AC227': 214,
        };

        let url = '/api/polling-stations-2025?';

        if (directMapping[constituency]) {
          // Use direct 2025 AC number
          url += `acNo2025=${directMapping[constituency]}`;
        } else {
          // Use database mapping logic for ACs like 224
          url += `constituency=${constituency}`;
        }

        const response = await signedFetch(url);
        const data = await response.json();

        if (data.success) {
          setPollingStations(data.data);
        }
      } catch (error) {
        console.error('Error fetching current polling stations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPollingStations();
  }, [constituency]);

  // Update display value when value changes
  useEffect(() => {
    if (value) {
      const [acNo, partNo] = value.split(':');
      const selected = pollingStations.find((ps) => ps.acNo.toString() === acNo && ps.partNo.toString() === partNo);
      if (selected) {
        const tamilName = selected.partNameV1 || '';
        const englishName = selected.partNameTn || '';
        setDisplayValue(`AC ${selected.acNo} - Part ${selected.partNo} - ${englishName} / ${tamilName}`);
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
    const acNoStr = ps.acNo.toString();
    const partNoStr = ps.partNo.toString();
    const nameV1 = ps.partNameV1?.toLowerCase() || '';
    const nameTn = ps.partNameTn?.toLowerCase() || '';
    const localityV1 = ps.localityV1?.toLowerCase() || '';
    const localityTn = ps.localityTn?.toLowerCase() || '';

    return (
      acNoStr.includes(search) ||
      partNoStr.includes(search) ||
      nameV1.includes(search) ||
      nameTn.includes(search) ||
      localityV1.includes(search) ||
      localityTn.includes(search)
    );
  });

  const handleSelect = (acNo: number, partNo: number) => {
    onChange(`${acNo}:${partNo}`);
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
          disabled={disabled || isLoading}
          placeholder={
            isLoading
              ? 'Loading...'
              : 'Search by AC, part number or name...'
          }
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
        />
        <ChevronDown
          className={`absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {isOpen && !disabled && !isLoading && (
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
                onClick={() => handleSelect(ps.acNo, ps.partNo)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 ${
                  value === `${ps.acNo}:${ps.partNo}` ? 'bg-blue-100' : ''
                }`}
              >
                <div className="text-gray-500 text-xs">AC {ps.acNo} - Part {ps.partNo}</div>
                <div className="text-gray-700 text-sm">
                  {ps.partNameTn || 'No English name'}
                </div>
                <div className="text-gray-900 font-medium text-sm">
                  {ps.partNameV1 || 'No Tamil name'}
                </div>
                {ps.localityV1 && (
                  <div className="text-gray-600 text-xs mt-1">
                    {ps.localityTn} / {ps.localityV1}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
