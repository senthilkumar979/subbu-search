"use client";

import { signedFetch } from "@/lib/client-hmac";
import { Button } from "@workspace/ui/components/button";
import {
  Fingerprint,
  Hash,
  Home,
  IdCard,
  Loader2,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { pollingStations } from "../lib/pollingStations";
import Man from "./Man";
import Woman from "./Woman";

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

// --- Copied/standardized utility from VoterResults.tsx ---
const getRelationTypeName = (rlnType?: string): string => {
  if (!rlnType) return "";
  const relationMap: Record<string, string> = {
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
  return relationMap[rlnType.toUpperCase()] || rlnType;
};

const getGenderName = (sex?: string): string => {
  if (!sex) return "-";
  const genderMap: Record<string, string> = {
    M: "Male",
    F: "Female",
    O: "Other",
  };
  return genderMap[sex.toUpperCase()] || sex;
};

// Table/row should look like VoterResults
function getPollingStationName(partNo: number, acNo: number) {
  const pollingStation = pollingStations.find(
    (pollingStation) =>
      pollingStation.POLL_NO === partNo.toString() &&
      pollingStation.AC_NO === acNo.toString()
  );
  return pollingStation?.POLL_NAME_TA || "-";
}

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
        throw new Error("Failed to fetch neighboring voters");
      }

      const result = await response.json();

      if (result.success) {
        setNeighbors(result.data);
      } else {
        setError(result.error || "Failed to fetch neighbors");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-blue-100 bg-opacity-10">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[98vh] overflow-hidden flex flex-col border border-blue-100">
        {/* Header */}
        <div className="flex justify-between items-start px-4 py-4 border-b bg-blue-50 gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <User className="h-6 w-6 text-blue-700" />
              <h2 className="text-lg font-bold tracking-tight">
                Neighboring Voters
              </h2>
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-[13px] text-gray-700">
              <span>
                <Hash className="inline h-3 w-3 mb-0.5 text-blue-400" />
                <span className="ml-0.5">Serial No:</span>{" "}
                <span className="font-semibold text-blue-800 bg-blue-50 px-2 py-[1px] text-xs text-blue-600 shadow-md font-semibold tracking-wide rounded-full">
                  {selectedVoter.slNoInPart}
                </span>
              </span>
              <span>
                <IdCard className="inline h-3 w-3 mb-0.5 text-green-400" />
                <span className="ml-0.5">Part No:</span>{" "}
                <span className="font-semibold text-green-600 bg-green-50 px-2 py-[1px] text-xs text-green-600 shadow-md font-semibold tracking-wide rounded-full">
                  {selectedVoter.partNo}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-semibold text-[14px]">
                {getPollingStationName(
                  selectedVoter.partNo,
                  selectedVoter.acNo
                )}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-100 rounded-md transition-colors ml-2"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-white">
          {isLoading && (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {error && (
            <div className="text-center py-10 text-red-700 font-medium">
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && neighbors.length === 0 && (
            <div className="text-center py-10 text-gray-400 font-medium">
              <p>No neighboring voters found.</p>
            </div>
          )}

          {!isLoading && !error && neighbors.length > 0 && (
            <>
              {/* Mobile Card Layout */}
              <div className="block md:hidden space-y-3">
                {neighbors.map((voter) => {
                  const isSelected =
                    voter.slNoInPart === selectedVoter.slNoInPart;
                  return (
                    <div
                      key={voter._id}
                      className={`
                        rounded-lg border group relative transition
                        py-3 px-4 bg-gradient-to-br from-blue-50/[.2] to-white
                        ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-md font-semibold"
                            : "border-gray-200 hover:bg-blue-50/60"
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="absolute right-0 top-0 m-1 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full shadow font-mono font-semibold tracking-tight">
                          <div className="flex items-center gap-1">
                            <Fingerprint className="h-4 w-4" />
                            <span className="text-[11px] font-bold text-red-700">
                              You
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        {voter.sex === "M" && <Man isLarge />}
                        {voter.sex === "F" && <Woman isLarge />}
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-gray-900 text-base">
                            {voter.fmNameV2 || (
                              <span className="italic text-gray-400">
                                Unknown Name
                              </span>
                            )}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {voter.rlnFmNmV2 ? (
                              <>
                                <span>{voter.rlnFmNmV2}</span>
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
                      <div className="grid grid-cols-2 gap-2 text-[13px] mt-3">
                        <div className="flex items-center gap-1 text-gray-600 font-medium">
                          <Hash className="h-4 w-4" />
                          Part:
                          <span className="ml-1 text-gray-900 bg-pink-50 px-2 py-[1px] text-xs text-pink-600 shadow-md font-semibold tracking-wide rounded-full">
                            {voter.partNo}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 font-medium">
                          <Home className="h-4 w-4" />
                          Serial No:
                          <div className="m-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-l-full shadow font-mono font-semibold tracking-tight">
                            {voter.slNoInPart}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 font-medium">
                          <Users className="h-4 w-4" />
                          Age:
                          <span className="ml-1 text-gray-900">
                            {voter.age ?? (
                              <span className="italic text-gray-400">--</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 font-medium">
                          <IdCard className="h-4 w-4" />
                          Gender:
                          <span className="ml-1 text-gray-900 flex items-center gap-1">
                            {voter.sex === "M" && <Man />}
                            {voter.sex === "F" && <Woman />}
                            {getGenderName(voter.sex)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* --- Desktop Table: Redesigned Like VoterResults --- */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-blue-50 text-blue-900">
                      <th className="border-b border-blue-100 px-4 py-2 text-left">
                        Part No
                      </th>
                      <th className="border-b border-blue-100 px-4 py-2 text-left">
                        Serial No
                      </th>
                      <th className="border-b border-blue-100 px-4 py-2 text-left">
                        Elector Name
                      </th>
                      <th className="border-b border-blue-100 px-4 py-2 text-left">
                        Relation Name
                      </th>
                      <th className="border-b border-blue-100 px-4 py-2 text-right">
                        Age
                      </th>
                      <th className="border-b border-blue-100 px-4 py-2 text-left">
                        Gender
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {neighbors.map((voter, idx) => {
                      const isSelected =
                        voter.slNoInPart === selectedVoter.slNoInPart;
                      return (
                        <tr
                          key={voter._id}
                          className={`hover:bg-blue-50 hover:shadow transition cursor-pointer ${
                            isSelected
                              ? "bg-blue-100 font-semibold border-b-2 border-blue-400"
                              : idx % 2 === 0
                                ? "bg-white"
                                : "bg-gray-50"
                          }`}
                        >
                          <td className="border-b border-gray-100 px-4 py-2 text-sm font-mono text-blue-800">
                            {voter.partNo}
                          </td>
                          <td className="border-b border-gray-100 px-4 py-2 text-sm font-mono text-purple-700">
                            {voter.slNoInPart}
                            {isSelected && (
                              <span className="ml-2 text-xs text-blue-700 font-bold">
                                (You)
                              </span>
                            )}
                          </td>
                          <td className="border-b border-gray-100 px-4 py-2 text-sm font-bold text-gray-900 whitespace-nowrap">
                            {voter.fmNameV2 ? (
                              voter.fmNameV2
                            ) : (
                              <span className="italic text-gray-400">
                                Unknown
                              </span>
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
                              className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                                voter.sex === "M"
                                  ? "bg-blue-100 text-blue-800"
                                  : voter.sex === "F"
                                    ? "bg-pink-100 text-pink-700"
                                    : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {voter.sex === "M" && <Man />}
                              {voter.sex === "F" && <Woman />}
                              {getGenderName(voter.sex)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t bg-blue-50">
          <Button onClick={onClose} variant="outline" className="min-w-[90px]">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
