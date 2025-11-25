"use client";

import { Button } from "@workspace/ui/components/button";
import { Loader2, Search, X } from "lucide-react";
import { useState } from "react";
import TransliterateInput from "./TransliterateInput";

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  onReset?: () => void;
  isLoading: boolean;
  constituency: string;
}

export interface SearchParams {
  name?: string;
  relationName?: string;
  partNo?: string;
  currentPartNo?: string;
  sex?: string;
}

export default function SearchForm({
  onSearch,
  onReset,
  isLoading,
  constituency,
}: SearchFormProps) {
  const [name, setName] = useState("");
  const [relationName, setRelationName] = useState("");
  const [partNo, setPartNo] = useState("");
  const [currentPartNo, setCurrentPartNo] = useState("");
  const [sex, setSex] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if at least one search field is filled
    if (!name.trim() && !relationName.trim()) {
      return;
    }

    onSearch({
      name: name.trim() || undefined,
      relationName: relationName.trim() || undefined,
      partNo: partNo.trim() || undefined,
      currentPartNo: currentPartNo.trim() || undefined,
      sex: sex.trim() || undefined,
    });
  };

  const handleReset = () => {
    setName("");
    setRelationName("");
    setPartNo("");
    setCurrentPartNo("");
    setSex("");
    setShowAdvancedFilters(false);

    // Call parent reset handler to clear results
    if (onReset) {
      onReset();
    }
  };

  const hasSearchCriteria = name.trim() || relationName.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Mobile: Two column layout */}
      <div className="grid grid-cols-1 gap-3 lg:hidden place-items-center text-center">
        <TransliterateInput
          id="name"
          value={name}
          onChange={setName}
          placeholder="Enter name in tamil"
          label="Elector Name / வாக்காளர் பெயர்"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <TransliterateInput
          id="relation-name-mobile-primary"
          value={relationName}
          onChange={setRelationName}
          placeholder="Enter name in tamil"
          label="Relation Name / உறவினர் பெயர்"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div>
          <label
            htmlFor="sex-mobile-primary"
            className="block text-xs font-medium mb-1.5"
          >
            Gender / பாலினம்
          </label>
          <select
            id="sex-mobile-primary"
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
          <div className="h-5 mt-1"></div>
        </div>

        {/* <div>
          <label htmlFor="current-part-no-mobile-main" className="block text-xs font-medium mb-1.5">
            Current Polling Station (2025) / வாக்குச்சாவடி எண் 2025
          </label>
          <CurrentPollingStationSelect
            id="current-part-no-mobile-main"
            value={currentPartNo}
            onChange={setCurrentPartNo}
            constituency={constituency}
            disabled={isLoading}
          />
        </div> */}
      </div>

      {/* Desktop: First row - Name, Relation Name, Gender */}
      <div className="hidden lg:flex lg:gap-3 lg:items-center">
        <div className="flex-1">
          <TransliterateInput
            id="name-desktop"
            value={name}
            onChange={setName}
            placeholder="Enter name in tamil"
            label="Elector Name / வாக்காளர் பெயர்"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1">
          <TransliterateInput
            id="relation-name-desktop"
            value={relationName}
            onChange={setRelationName}
            placeholder="Enter name in tamil"
            label="Relation Name / உறவினர் பெயர்"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1">
          <label
            htmlFor="sex-desktop"
            className="block text-xs font-medium mb-1.5"
          >
            Gender / பாலினம்
          </label>
          <select
            id="sex-desktop"
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
          <div className="h-5 mt-1"></div>
        </div>
        <div className="flex-1 flex items-center">
          <div className="flex-1 gap-2 flex items-middle justify-center text-center">
            <Button
              type="submit"
              disabled={isLoading || !hasSearchCriteria}
              size="sm"
              className="whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-1.5">Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span className="ml-1.5">Search</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile: Action Buttons */}
      <div className="flex gap-2 pt-3 lg:hidden justify-center items-center text-center">
        <Button
          type="submit"
          disabled={isLoading || !hasSearchCriteria}
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2">Searching...</span>
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              <span className="ml-2">Search</span>
            </>
          )}
        </Button>

        <Button type="button" variant="outline" onClick={handleReset} size="sm">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile: Advanced Filters */}
      {/* <div
        className={`space-y-3 lg:hidden ${showAdvancedFilters ? "block" : "hidden"}`}
      >
        <div>
          <label
            htmlFor="part-no-mobile"
            className="block text-xs font-medium mb-1.5"
          >
            Polling Station (2002) / வாக்குச் சாவடி (2002)
          </label>
          <PollingStationSelect
            id="part-no-mobile"
            value={partNo}
            onChange={setPartNo}
            constituency={constituency}
            disabled={isLoading}
          />
        </div>
      </div> */}
    </form>
  );
}
