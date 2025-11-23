'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent } from '@workspace/ui/components/card';
import NeighborVotersModal from './NeighborVotersModal';

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

interface VoterResultsProps {
  voters: Voter[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  constituency: string;
}

export default function VoterResults({ voters, pagination, onPageChange, constituency }: VoterResultsProps) {
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleVoterClick = (voter: Voter) => {
    setSelectedVoter(voter);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVoter(null);
  };

  if (voters.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No results found. Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total.toLocaleString()} results
        </p>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        {voters.map((voter) => (
          <Card
            key={voter._id}
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleVoterClick(voter)}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex-1">
                  <div className="font-semibold text-base text-gray-900">
                    {voter.fmNameV2 || '-'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {voter.rlnFmNmV2 ? `${voter.rlnFmNmV2} (${getRelationTypeName(voter.rlnType)})` : '-'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-2 border-t">
                  <div>
                    <span className="text-gray-500">Part:</span>
                    <span className="ml-1 font-medium">{voter.partNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Serial No:</span>
                    <span className="ml-1 font-medium">{voter.slNoInPart}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Age:</span>
                    <span className="ml-1 font-medium">{voter.age || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Gender:</span>
                    <span className="ml-1 font-medium">{getGenderName(voter.sex)}</span>
                  </div>
                  {voter.psName && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Polling Station:</span>
                      <span className="ml-1 text-xs">{voter.psName}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
                Part No / பாகம் எண்
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
                Serial No / வரிசை எண்
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
                Elector Name / வாக்காளர் பெயர்
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
                Relation Name / உறவினர் பெயர்
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
                Age / வயது
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
                Gender / பாலினம்
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
                Polling Station Name / வாக்குச்சாவடி பெயர்
              </th>
            </tr>
          </thead>
          <tbody>
            {voters.map((voter) => (
              <tr
                key={voter._id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleVoterClick(voter)}
              >
                <td className="border border-gray-300 px-4 py-2 text-sm">{voter.partNo}</td>
                <td className="border border-gray-300 px-4 py-2 text-sm">
                  {voter.slNoInPart}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm font-medium">
                  {voter.fmNameV2 || '-'}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm">
                  {voter.rlnFmNmV2 ? `${voter.rlnFmNmV2} (${getRelationTypeName(voter.rlnType)})` : '-'}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm">{voter.age || '-'}</td>
                <td className="border border-gray-300 px-4 py-2 text-sm">{getGenderName(voter.sex)}</td>
                <td className="border border-gray-300 px-4 py-2 text-sm">{voter.psName || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Neighbor Voters Modal */}
      {selectedVoter && (
        <NeighborVotersModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          selectedVoter={selectedVoter}
          constituency={constituency}
        />
      )}
    </div>
  );
}

