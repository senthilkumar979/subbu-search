"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SearchForm, { SearchParams } from "@/components/SearchForm";
import VoterResults from "@/components/VoterResults";
import { signedFetch } from "@/lib/client-hmac";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// --- Types and Data ---
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
interface SearchResponse {
  success: boolean;
  data: Voter[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

const CONSTITUENCIES = [
  {
    tsc: "AC173",
    number: "173",
    nameEn: "Nannilam",
    nameTa: "நன்னிலம்",
    color: "from-blue-100 to-blue-50",
    border: "border-blue-300",
    highlight: "ring-blue-400",
  },
  {
    tsc: "AC174",
    number: "174",
    nameEn: "Tiruvarur",
    nameTa: "திருவாரூர்",
    color: "from-teal-100 to-teal-50",
    border: "border-teal-300",
    highlight: "ring-teal-400",
  },
  {
    tsc: "AC177",
    number: "177",
    nameEn: "Tiruthuraipoondi",
    nameTa: "திருத்துறைப்பூண்டி",
    color: "from-pink-100 to-pink-50",
    border: "border-pink-300",
    highlight: "ring-pink-400",
  },
  {
    tsc: "AC178",
    number: "178",
    nameEn: "Mannargudi",
    nameTa: "மன்னார்குடி",
    color: "from-yellow-100 to-yellow-50",
    border: "border-yellow-300",
    highlight: "ring-yellow-400",
  },
];

// --- Main Page Content ---
function PageContent() {
  const searchParams = useSearchParams();
  const tscFromUrl = searchParams.get("tsc") || "";
  const [selectedTsc, setSelectedTsc] = useState<string>(tscFromUrl);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 200,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSearchParams, setCurrentSearchParams] =
    useState<SearchParams | null>(null);

  // Sync selectedTsc with URL parameter
  useEffect(() => {
    setSelectedTsc(tscFromUrl);
    setCurrentSearchParams(null);
    setVoters([]);
    setPagination({ total: 0, page: 1, limit: 200, totalPages: 0 });
    setError(null);
  }, [tscFromUrl]);

  // Meta and Title update
  useEffect(() => {
    const cMeta = CONSTITUENCIES.find((c) => c.tsc === selectedTsc);
    const title = cMeta
      ? `${cMeta.number} (${cMeta.nameEn}) | Special Intensive Revision | Thiruvarur District`
      : "Special Intensive Revision | Thiruvarur District";
    const description = cMeta
      ? `Search Electoral Roll for Assembly Constituency ${cMeta.number} - ${cMeta.nameEn} | Thiruvarur District`
      : "Search Electoral Roll for Thiruvarur District - 2002 Data";

    document.title = title;
    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.remove();

    updateMetaTag("og:title", title);
    updateMetaTag("og:description", description);
    updateMetaTag("og:type", "website");
  }, [selectedTsc]);

  // Handlers
  const handleSelectConstituency = (tsc: string) => {
    setSelectedTsc(tsc);
    const url = new URL(window.location.href);
    url.searchParams.set("tsc", tsc);
    window.history.pushState({}, "", url);
  };
  const performSearch = async (params: SearchParams, page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: "200",
        tsc: selectedTsc,
      });
      if (params.name) searchParams.append("name", params.name);
      if (params.relationName)
        searchParams.append("relationName", params.relationName);
      if (params.partNo) searchParams.append("partNo", params.partNo);
      if (params.currentPartNo)
        searchParams.append("currentPartNo", params.currentPartNo);
      if (params.sex) searchParams.append("sex", params.sex);

      const response = await signedFetch(
        `/api/voters/search?${searchParams.toString()}`
      );
      const data: SearchResponse = await response.json();
      if (data.success) {
        setVoters(data.data);
        setPagination(data.pagination);
        setCurrentSearchParams(params);
      } else {
        setError(data.error || "An error occurred while searching");
        setVoters([]);
      }
    } catch (err) {
      setError("Failed to connect to server. Please try again.");
      setVoters([]);
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSearch = (params: SearchParams) => {
    performSearch(params, 1);
  };
  const handleReset = () => {
    setVoters([]);
    setPagination({ total: 0, page: 1, limit: 200, totalPages: 0 });
    setCurrentSearchParams(null);
    setError(null);
  };
  const handlePageChange = (page: number) => {
    if (currentSearchParams) performSearch(currentSearchParams, page);
  };

  // --- Main Render ---

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col">
      <Header constituency={selectedTsc} />

      {/* --- Constituency Selection --- */}
      {!selectedTsc && (
        <div className="flex-grow flex items-center justify-center">
          <div className="w-full max-w-4xl px-4 py-8">
            <div className="text-center mb-10 animate-fade-in">
              <div className="flex justify-center items-center mb-4">
                <Image
                  src="/eci-logo.png"
                  alt="ECI Logo"
                  width={100}
                  height={100}
                />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
                <span className="bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
                  Thiruvarur District Voter Roll{" "}
                  <br className="hidden md:inline" />
                </span>
              </h2>
              <p className="text-lg md:text-xl text-gray-600 font-medium">
                2002 Data | Special Intensive Revision
              </p>
              <div className="mt-2 text-blue-900/80 text-sm font-semibold tracking-wider">
                சட்டமன்றத் தொகுதியைத் தேர்ந்தெடுக்கவும்
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {CONSTITUENCIES.map((c) => (
                <button
                  key={c.tsc}
                  onClick={() => handleSelectConstituency(c.tsc)}
                  className={`
                    group transform transition-all duration-250
                    bg-gradient-to-br ${c.color}
                    cursor-pointer
                    border-2 ${c.border} hover:ring-4 hover:${c.highlight}
                    rounded-2xl shadow hover:shadow-xl p-7 flex flex-col items-center gap-2
                    hover:scale-105 focus:ring-2 focus:${c.highlight}
                    box-shadow-none
                  `}
                  aria-label={`Select ${c.nameEn}`}
                >
                  <span className="flex items-center gap-2 text-2xl font-extrabold text-indigo-900 group-hover:text-sky-700">
                    <span className="rounded bg-white/60 px-2">{`AC ${c.number}`}</span>
                  </span>
                  <span className="text-base font-medium text-gray-700">
                    {c.nameEn}
                  </span>
                  <span className="text-gray-500 font-semibold">
                    {c.nameTa}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <span className="flex items-center gap-2 text-gray-400 text-xs">
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  className="inline mr-1"
                  strokeWidth={2.2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 12a3 3 0 006 0 3 3 0 10-6 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.17 16.26A8 8 0 0021 12c0-4.42-3.58-8-8-8S5 7.58 5 12c0 1.11.22 2.18.63 3.13"
                  ></path>
                </svg>
                Powered by 2002 archival data
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Search Form (Sticky desktop / mobile) */}
      {selectedTsc && (
        <>
          <div className="top-[73px] z-10">
            <div className="hidden md:block bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm px-4 py-3">
              <div className="max-w-5xl mx-auto">
                <SearchForm
                  onSearch={handleSearch}
                  onReset={handleReset}
                  isLoading={isLoading}
                  constituency={selectedTsc}
                />
              </div>
            </div>
            <div className="md:hidden px-2 pt-3">
              <div className="bg-white/90 rounded-xl shadow-sm p-4">
                <SearchForm
                  onSearch={handleSearch}
                  onReset={handleReset}
                  isLoading={isLoading}
                  constituency={selectedTsc}
                />
              </div>
            </div>
          </div>

          {/* --- Content Area --- */}
          <main className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 py-4">
            {/* --- Error --- */}
            {error && (
              <div className="rounded-lg bg-gradient-to-r from-red-100 via-red-50 to-white border border-red-300 text-red-700 px-4 py-3 mb-6 animate-shake">
                {error}
              </div>
            )}

            {/* --- Results Table --- */}
            {voters.length > 0 && (
              <VoterResults
                voters={voters}
                pagination={pagination}
                onPageChange={handlePageChange}
                constituency={selectedTsc}
              />
            )}

            {/* --- Empty State --- */}
            {!error && voters.length === 0 && !currentSearchParams && (
              <section className="flex flex-col md:flex-row md:gap-8 justify-between mt-12 md:mt-16 bg-gradient-to-r from-indigo-50 to-teal-50 rounded-xl shadow p-7 md:p-11 animate-in fade-in duration-500">
                <div className="md:w-1/2 flex flex-col items-center">
                  <svg
                    className="h-20 w-20 text-sky-400 mb-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                    Search the 2002 Electoral Roll
                  </h3>
                  <p className="text-md text-gray-700 mb-4 text-center">
                    வாக்காளர் பட்டியல் தேடல் - 2002 தரவு
                  </p>
                </div>
                <div className="md:w-1/2 grid grid-cols-1 gap-8">
                  <div className="space-y-3 text-[0.98rem] text-gray-700">
                    <ul className="list-disc list-inside space-y-1 mb-3">
                      <li>
                        <span className="font-semibold">Name:</span> Search by
                        voter's name (support in Tamil & English)
                        <br />
                        <span className="font-semibold">பெயர்:</span> வாக்காளர்
                        பெயரில் தேடலாம் (தமிழ் மற்றும் ஆங்கிலம்)
                      </li>
                      <li>
                        <span className="font-semibold">
                          Relation Name:&nbsp;
                        </span>
                        Search by father's/husband's/mother's name
                        <br />
                        <span className="font-semibold">
                          உறவினர் பெயர்:&nbsp;
                        </span>
                        தந்தை/கணவர்/தாய் பெயரைப் பயன்படுத்தலாம்
                      </li>
                      <li>
                        <span className="font-semibold">Gender:&nbsp;</span>
                        Filter results by gender (Male/Female/Other)
                        <br />
                        <span className="font-semibold">பாலினம்:&nbsp;</span>
                        பாலினத்தை கொண்டு வடிகட்டலாம்
                      </li>
                    </ul>
                    <div className="bg-blue-50 text-blue-800 text-center px-3 py-1 rounded font-medium mt-2">
                      At least one search field is required
                      <br />
                      (குறைந்தபட்சம் ஒரு தேடல் அளவுகோல் வேண்டும்)
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* --- No Results Found --- */}
            {!error && voters.length === 0 && currentSearchParams && (
              <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
                <svg
                  className="mx-auto h-14 w-14 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-1 mt-4">
                  No Results Found
                </h3>
                <div className="text-gray-600 text-center mb-4 max-w-sm">
                  We couldn&apos;t find any electors matching your search. Try
                  changing filters or names.
                </div>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded bg-gradient-to-br from-blue-400 to-emerald-400 text-white font-bold shadow hover:scale-105 transition"
                >
                  <svg
                    width={18}
                    height={18}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="inline"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Clear Search
                </button>
              </div>
            )}
          </main>
        </>
      )}

      <Footer constituency={selectedTsc} />
    </div>
  );
}

// --- Suspense Loader Wrapper ---
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-emerald-50">
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-blue-600/80 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-sky-700/70">Loading…</p>
        </div>
      }
    >
      <PageContent />
    </Suspense>
  );
}
