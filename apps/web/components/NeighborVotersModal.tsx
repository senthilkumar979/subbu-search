'use client';

import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { signedFetch } from '@/lib/client-hmac';

interface Voter {
  _id: string;
  acNo: number;
  partNo: number;
  slNoInPart: number;
  houseNo?: string;
  sectionNo?: string;
  fmNameV2?: string;
  rlnFmNmV2?: string;
  rlnType?: string;
  age?: number;
  sex?: string;
  idCardNo?: string;
  psName?: string;
}

interface NeighborVotersModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoter: Voter;
  constituency: string;
}

// Helper function to get full relation type name
const getRelationTypeName = (rlnType?: string): string => {
  if (!rlnType) return '';

  const relationMap: Record<string, string> = {
    'H': 'Husband',
    'F': 'Father',
    'M': 'Mother',
    'W': 'Wife',
    'S': 'Son',
    'D': 'Daughter',
    'B': 'Brother',
    'SI': 'Sister',
    'O': 'Others',
  };

  return relationMap[rlnType.toUpperCase()] || rlnType;
};

// Helper function to get full gender name
const getGenderName = (sex?: string): string => {
  if (!sex) return '-';

  const genderMap: Record<string, string> = {
    'M': 'Male',
    'F': 'Female',
    'O': 'Other',
  };

  return genderMap[sex.toUpperCase()] || sex;
};

export default function NeighborVotersModal({
  isOpen,
  onClose,
  selectedVoter,
  constituency,
}: NeighborVotersModalProps) {
  const [neighbors, setNeighbors] = useState<Voter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && selectedVoter) {
      fetchNeighbors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedVoter]);

  const fetchNeighbors = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tsc: constituency,
        partNo: selectedVoter.partNo.toString(),
        slNoInPart: selectedVoter.slNoInPart.toString(),
      });

      const response = await signedFetch(`/api/voters/neighbors?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch neighboring voters');
      }

      const result = await response.json();

      if (result.success) {
        setNeighbors(result.data);
      } else {
        setError(result.error || 'Failed to fetch neighbors');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Neighboring Voters</h2>
            <p className="text-sm text-gray-600">
              Serial No: {selectedVoter.slNoInPart} | Part No: {selectedVoter.partNo}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && neighbors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No neighboring voters found.</p>
            </div>
          )}

          {!isLoading && !error && neighbors.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">
                      Part No
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">
                      Serial No
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">
                      Elector Name
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">
                      Relation Name
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">
                      Age
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">
                      Gender
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {neighbors.map((voter) => {
                    const isSelected = voter.slNoInPart === selectedVoter.slNoInPart;
                    return (
                      <tr
                        key={voter._id}
                        className={`${
                          isSelected
                            ? 'bg-blue-100 font-semibold border-2 border-blue-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="border border-gray-300 px-3 py-2 text-sm">
                          {voter.partNo}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">
                          {voter.slNoInPart}
                          {isSelected && (
                            <span className="ml-2 text-xs text-blue-600">(Selected)</span>
                          )}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">
                          {voter.fmNameV2 || '-'}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">
                          {voter.rlnFmNmV2
                            ? `${voter.rlnFmNmV2} (${getRelationTypeName(voter.rlnType)})`
                            : '-'}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">
                          {voter.age || '-'}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">
                          {getGenderName(voter.sex)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
