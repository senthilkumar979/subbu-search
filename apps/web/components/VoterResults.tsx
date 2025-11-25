"use client";

import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  ChevronLeft,
  ChevronRight,
  User,
  IdCard,
  Users,
  Home,
  Hash,
  UserCircle2,
} from "lucide-react";
import { useState } from "react";
import { pollingStations } from "../lib/pollingStations";
import NeighborVotersModal from "./NeighborVotersModal";

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

const RELATION_LABELS: Record<string, string> = {
  H: "Husband",
  F: "Father",
  M: "Mother",
  W: "Wife",
  S: "Son",
  D: "Daughter",
  B: "Brother",
  SI: "Sister",
  O: "Others",
};

const GENDER_LABELS: Record<string, string> = {
  M: "Male",
  F: "Female",
  O: "Other",
};

// Helper function to get full relation type name
const getRelationTypeName = (rlnType?: string): string => {
  if (!rlnType) return "";
  return RELATION_LABELS[rlnType.toUpperCase()] || rlnType;
};

// Helper function to get full gender name
const getGenderName = (sex?: string): string => {
  if (!sex || sex === "" || sex === undefined) return "-";
  if(sex !== "M" && sex !== "F" && sex !== "O") return "-";
  return GENDER_LABELS[sex.toUpperCase()] || sex;
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

function getPollingStationName(partNo: number, acNo: number) {
  const pollingStation = pollingStations.find(
    (pollingStation) =>
      pollingStation.POLL_NO === partNo.toString() &&
      pollingStation.AC_NO === acNo.toString()
  );
  return pollingStation?.POLL_NAME_TA || "-";
}

export default function VoterResults({
  voters,
  pagination,
  onPageChange,
  constituency,
}: VoterResultsProps) {
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

  // --- Redesigned: Empty State ---
  if (voters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-3">
        <UserCircle2 className="h-10 w-10 mb-2" />
        <div className="font-semibold text-lg">No Voters Found</div>
        <div className="text-sm text-gray-500 max-w-md">
          Try adjusting your search criteria.
          <br />
          You can search by{" "}
          <span className="font-medium text-blue-500">name</span>,{" "}
          <span className="font-medium text-blue-500">relation</span> or{" "}
          <span className="font-medium text-blue-500">gender</span>.
        </div>
      </div>
    );
  }

  // --- Redesigned: Header & Paging ---
  const startIdx = (pagination.page - 1) * pagination.limit + 1;
  const endIdx = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-5">
      {/* Results Summary Bar */}
      <div className="py-2 px-3 rounded-md border border-gray-200 bg-gray-50 flex flex-col md:flex-row md:justify-between md:items-center gap-1">
        <span className="text-xs md:text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold text-blue-700">{startIdx}</span> to{" "}
          <span className="font-semibold text-blue-700">{endIdx}</span> of{" "}
          <span className="font-semibold text-blue-700">
            {pagination.total.toLocaleString()}
          </span>{" "}
          results
        </span>
        {pagination.totalPages > 1 && (
          <div className="flex justify-center md:justify-end items-center gap-2 pt-1 md:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>
            <span className="text-xs text-gray-600">
              Page <span className="font-medium">{pagination.page}</span> of{" "}
              {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* --- Redesigned: Mobile Card View --- */}
      <div className="block lg:hidden space-y-3">
        {voters.map((voter) => (
          <Card
            key={voter._id}
            className="relative overflow-hidden cursor-pointer transition-all group border-2 border-transparent hover:border-blue-400 shadow-sm"
            onClick={() => handleVoterClick(voter)}
            tabIndex={0}
          >
            <CardContent className="p-4">
              <div className="absolute right-0 top-0 m-1 rounded-l-full bg-blue-50 px-2 py-[1px] text-xs text-blue-600 shadow-md font-semibold tracking-wide">
                #{voter.slNoInPart}
              </div>
              <div className="flex items-center gap-4">
                <User className="h-8 w-8 text-blue-600 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 text-base leading-tight">
                    {voter.fmNameV2 ? (
                      voter.fmNameV2
                    ) : (
                      <span className="italic text-gray-400">Unknown Name</span>
                    )}
                  </span>
                  <span className="text-gray-500 text-xs leading-none">
                    {voter.rlnFmNmV2 ? (
                      <>
                        {voter.rlnFmNmV2}
                        <span className="text-gray-400">
                          {" "}
                          ({getRelationTypeName(voter.rlnType)})
                        </span>
                      </>
                    ) : (
                      <span className="italic text-gray-300">
                        No relation info
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-y-0.5 gap-x-2 mt-3 text-[13px]">
                <div className="flex items-center gap-1 text-gray-500">
                  <Hash className="h-3 w-3" />
                  <span>Part:</span>
                  <span className="ml-1 text-gray-900 font-medium">
                    {voter.partNo}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Users className="h-3 w-3" />
                  <span>Age:</span>
                  <span className="ml-1 text-gray-900 font-medium">
                    {voter.age ?? (
                      <span className="italic text-gray-400">--</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <IdCard className="h-3 w-3" />
                  <span>Gender:</span>
                  <span className="ml-1 text-gray-900 font-medium">
                    {getGenderName(voter.sex)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-gray-500 text-[14px]">
                <Home className="h-3 w-3" />
                <span>PS:</span>
                <span className="ml-1 text-gray-900 font-medium">
                  {getPollingStationName(voter.partNo, voter.acNo)}
                </span>
              </div>
            </CardContent>
            <span className="block absolute bottom-0 left-0 w-full h-1 rounded-b bg-gradient-to-r from-blue-400 to-blue-100 opacity-0 group-hover:opacity-100 transition" />
          </Card>
        ))}
      </div>

      {/* --- Redesigned: Desktop Table View --- */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 shadow-sm rounded-md ring-1 ring-gray-200 bg-white">
          <thead>
            <tr className="bg-blue-50">
              <th className="border-b border-gray-200 px-4 py-2 text-left text-xs font-semibold tracking-wide text-blue-900">
                Part No
              </th>
              <th className="border-b border-gray-200 px-4 py-2 text-left text-xs font-semibold tracking-wide text-blue-900">
                Serial No
              </th>
              <th className="border-b border-gray-200 px-4 py-2 text-left text-xs font-semibold tracking-wide text-blue-900">
                Elector Name
              </th>
              <th className="border-b border-gray-200 px-4 py-2 text-left text-xs font-semibold tracking-wide text-blue-900">
                Relation Name
              </th>
              <th className="border-b border-gray-200 px-4 py-2 text-left text-xs font-semibold tracking-wide text-blue-900">
                Age
              </th>
              <th className="border-b border-gray-200 px-4 py-2 text-left text-xs font-semibold tracking-wide text-blue-900">
                Gender
              </th>
              <th className="border-b border-gray-200 px-4 py-2 text-left text-xs font-semibold tracking-wide text-blue-900">
                Polling Station Name
              </th>
            </tr>
          </thead>
          <tbody>
            {voters.map((voter, idx) => (
              <tr
                key={voter._id}
                className={`hover:bg-blue-50 hover:shadow transition cursor-pointer ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                onClick={() => handleVoterClick(voter)}
                tabIndex={0}
              >
                <td className="border-b border-gray-100 px-4 py-2 text-sm font-mono text-blue-800">
                  {voter.partNo}
                </td>
                <td className="border-b border-gray-100 px-4 py-2 text-sm font-mono text-purple-700">
                  {voter.slNoInPart}
                </td>
                <td className="border-b border-gray-100 px-4 py-2 text-sm font-bold text-gray-900 whitespace-nowrap">
                  {voter.fmNameV2 ? (
                    voter.fmNameV2
                  ) : (
                    <span className="italic text-gray-400">Unknown</span>
                  )}
                </td>
                <td className="border-b border-gray-100 px-4 py-2 text-sm text-gray-700">
                  {voter.rlnFmNmV2 ? (
                    <>
                      {voter.rlnFmNmV2}
                      <span className="text-gray-400">
                        {" "}
                        ({getRelationTypeName(voter.rlnType)})
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-300 italic">-</span>
                  )}
                </td>
                <td className="border-b border-gray-100 px-4 py-2 text-sm text-right">
                  {voter.age ?? (
                    <span className="italic text-gray-400">--</span>
                  )}
                </td>
                <td className="border-b border-gray-100 px-4 py-2 text-sm">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                      voter.sex === "M"
                        ? "bg-blue-100 text-blue-800"
                        : voter.sex === "F"
                          ? "bg-pink-100 text-pink-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {getGenderName(voter.sex)}
                  </span>
                </td>
                <td className="border-b border-gray-100 px-4 py-2 text-sm whitespace-normal max-w-xs">
                  <span className="block text-blue-800 font-semibold">
                    {getPollingStationName(voter.partNo, voter.acNo)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Neighbor Voters Modal */}
      <NeighborVotersModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedVoter={selectedVoter}
        constituency={constituency}
      />
    </div>
  );
}
