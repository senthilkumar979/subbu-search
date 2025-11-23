'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchForm, { SearchParams } from '@/components/SearchForm';
import VoterResults from '@/components/VoterResults';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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

function PageContent() {
  const searchParams = useSearchParams();
  const tscFromUrl = searchParams.get('tsc') || ''; // No default, empty means not selected

  const [voters, setVoters] = useState<Voter[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 200,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSearchParams, setCurrentSearchParams] = useState<SearchParams | null>(null);
  const [selectedTsc, setSelectedTsc] = useState<string>(tscFromUrl);

  // Sync selectedTsc with URL parameter
  useEffect(() => {
    setSelectedTsc(tscFromUrl);
  }, [tscFromUrl]);

  // Update page title and meta tags based on selected constituency
  useEffect(() => {
    const title = selectedTsc
      ? `${selectedTsc} | Special Intensive Revision | Thiruvarur District`
      : 'Special Intensive Revision | Thiruvarur District';

    const description = selectedTsc
      ? `Search electoral roll for Assembly Constituency ${selectedTsc.replace('AC', '')} - 2002 Data Thiruvarur District`
      : 'Search electoral roll for Thiruvarur District - 2002 Data';

    // Update title
    document.title = title;

    // Update or create OG meta tags
    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Remove OG image if exists
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      ogImage.remove();
    }

    // Update OG tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:type', 'website');
  }, [selectedTsc]);

  // Handler to select constituency
  const handleSelectConstituency = (tsc: string) => {
    setSelectedTsc(tsc);
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('tsc', tsc);
    window.history.pushState({}, '', url);
  };

  const performSearch = async (params: SearchParams, page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: '200',
        tsc: selectedTsc, // Add tsc parameter
      });

      if (params.name) searchParams.append('name', params.name);
      if (params.relationName) searchParams.append('relationName', params.relationName);
      if (params.partNo) searchParams.append('partNo', params.partNo);
      if (params.currentPartNo) searchParams.append('currentPartNo', params.currentPartNo);
      if (params.sex) searchParams.append('sex', params.sex);

      const response = await signedFetch(`/api/voters/search?${searchParams.toString()}`);
      const data: SearchResponse = await response.json();

      if (data.success) {
        setVoters(data.data);
        setPagination(data.pagination);
        setCurrentSearchParams(params);
      } else {
        setError(data.error || 'An error occurred while searching');
        setVoters([]);
      }
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
      setVoters([]);
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (params: SearchParams) => {
    performSearch(params, 1);
  };

  const handleReset = () => {
    setVoters([]);
    setPagination({
      total: 0,
      page: 1,
      limit: 200,
      totalPages: 0,
    });
    setCurrentSearchParams(null);
    setError(null);
  };

  const handlePageChange = (page: number) => {
    if (currentSearchParams) {
      performSearch(currentSearchParams, page);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header constituency={selectedTsc} />

      {/* Constituency Selection Grid - Show when no constituency selected */}
      {!selectedTsc && (
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Select Assembly Constituency
              </h2>
              <p className="text-lg text-gray-600">
                சட்டமன்றத் தொகுதியைத் தேர்ந்தெடுக்கவும்
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => handleSelectConstituency('AC173')}
                className="bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg p-6 text-left transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="text-xl font-bold text-blue-900 mb-1">AC 173</div>
                <div className="text-gray-700 font-medium">Nannilam</div>
                <div className="text-gray-600 text-sm mt-1">நந்நிலம்</div>
              </button>
              
              <button
                onClick={() => handleSelectConstituency('AC210')}
                className="bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg p-6 text-left transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="text-xl font-bold text-blue-900 mb-1">AC 210</div>
                <div className="text-gray-700 font-medium">Vilathikulam</div>
                <div className="text-gray-600 text-sm mt-1">விளாத்திகுளம்</div>
              </button>

              <button
                onClick={() => handleSelectConstituency('AC211')}
                className="bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg p-6 text-left transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="text-xl font-bold text-blue-900 mb-1">AC 211</div>
                <div className="text-gray-700 font-medium">Ottapidaram (SC)</div>
                <div className="text-gray-600 text-sm mt-1">ஓட்டப்பிடாரம் (தனி)</div>
              </button>

              <button
                onClick={() => handleSelectConstituency('AC212')}
                className="bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg p-6 text-left transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="text-xl font-bold text-blue-900 mb-1">AC 212</div>
                <div className="text-gray-700 font-medium">Kovilpatti</div>
                <div className="text-gray-600 text-sm mt-1">கோவில்பட்டி</div>
              </button>

              <button
                onClick={() => handleSelectConstituency('AC224')}
                className="bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg p-6 text-left transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="text-xl font-bold text-blue-900 mb-1">AC 224</div>
                <div className="text-gray-700 font-medium">Sattankulam</div>
                <div className="text-gray-600 text-sm mt-1">சாத்தான்குளம்</div>
              </button>

              <button
                onClick={() => handleSelectConstituency('AC225')}
                className="bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg p-6 text-left transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="text-xl font-bold text-blue-900 mb-1">AC 225</div>
                <div className="text-gray-700 font-medium">Tiruchendur</div>
                <div className="text-gray-600 text-sm mt-1">திருச்செந்தூர்</div>
              </button>

              <button
                onClick={() => handleSelectConstituency('AC226')}
                className="bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg p-6 text-left transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="text-xl font-bold text-blue-900 mb-1">AC 226</div>
                <div className="text-gray-700 font-medium">Srivaikuntam</div>
                <div className="text-gray-600 text-sm mt-1">ஸ்ரீவைகுண்டம்</div>
              </button>

              <button
                onClick={() => handleSelectConstituency('AC227')}
                className="bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg p-6 text-left transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="text-xl font-bold text-blue-900 mb-1">AC 227</div>
                <div className="text-gray-700 font-medium">Thoothukudi</div>
                <div className="text-gray-600 text-sm mt-1">தூத்துக்குடி</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Search Form - Desktop Only */}
      {selectedTsc && (
        <div className="hidden lg:block sticky top-[73px] z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <SearchForm onSearch={handleSearch} onReset={handleReset} isLoading={isLoading} constituency={selectedTsc} />
          </div>
        </div>
      )}

      {/* Mobile Search Form */}
      {selectedTsc && (
        <div className="lg:hidden">
          <div className="container mx-auto px-4 py-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <SearchForm onSearch={handleSearch} onReset={handleReset} isLoading={isLoading} constituency={selectedTsc} />
            </div>
          </div>
        </div>
      )}

      {selectedTsc && (
        <div className="container mx-auto px-4 py-4 lg:py-6 flex-1">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Results */}
        {voters.length > 0 && (
          <VoterResults
            voters={voters}
            pagination={pagination}
            onPageChange={handlePageChange}
            constituency={selectedTsc}
          />
        )}

        {/* Empty State - No Search Applied */}
        {!error && voters.length === 0 && !currentSearchParams && (
          <div className="p-8 lg:p-12 text-center">
            <div className="max-w-5xl mx-auto">
              <div className="mb-6">
                <svg
                  className="mx-auto h-20 w-20 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                வாக்காளர் பட்டியல் தேடல் - 2002 தரவு / Search Electoral Roll - 2002 Data
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                {/* Tamil Section */}
                <div className="space-y-3 text-sm text-gray-600">
                  <p className="font-medium text-center mb-4">
                    2002 வாக்காளர் பட்டியலிலிருந்து வாக்காளர்களைத் தேட மேலே உள்ள வடிப்பான்களைப் பயன்படுத்தவும்:
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>
                      <span className="font-medium">வாக்காளர் பெயர்:</span> வாக்காளர் பெயரால் தேடுங்கள் (தமிழ் மற்றும் ஆங்கிலம் ஆதரிக்கப்படுகிறது)
                    </li>
                    <li>
                      <span className="font-medium">உறவினர் பெயர்:</span> தந்தை/கணவர்/தாய் பெயரால் தேடுங்கள்
                    </li>
                    <li>
                      <span className="font-medium">பாலினம்:</span> பாலினத்தால் வடிகட்டவும் (ஆண்/பெண்/மற்றவை)
                    </li>
                    <li>
                      <span className="font-medium">மேலும் வடிப்பான்கள்:</span> வாக்குச் சாவடி அடிப்படையில் வடிகட்டவும்
                    </li>
                  </ul>
                  <p className="text-center mt-6 text-gray-500 italic">
                    குறைந்தபட்சம் ஒரு தேடல் அளவுகோலை உள்ளிட்டு தேடல் பொத்தானைக் கிளிக் செய்யவும்
                  </p>
                </div>

                {/* English Section */}
                <div className="space-y-3 text-sm text-gray-600">
                  <p className="font-medium text-center mb-4">
                    Use the filters above to search for electors from the 2002 electoral roll:
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>
                      <span className="font-medium">Elector Name:</span> Search by elector name (supports Tamil and English)
                    </li>
                    <li>
                      <span className="font-medium">Relation Name:</span> Search by father/husband/mother name
                    </li>
                    <li>
                      <span className="font-medium">Gender:</span> Filter by gender (Male/Female/Other)
                    </li>
                    <li>
                      <span className="font-medium">More Filters:</span> Filter by Polling Station
                    </li>
                  </ul>
                  <p className="text-center mt-6 text-gray-500 italic">
                    Enter at least one search criterion and click the Search button
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - No Results Found */}
        {!error && voters.length === 0 && currentSearchParams && (
          <div className="p-8 lg:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400"
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
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
              <p className="text-sm text-gray-600 mb-4">
                We couldn&apos;t find any electors matching your search criteria. Please try adjusting your filters or search terms.
              </p>
              <button
                onClick={handleReset}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear Search
              </button>
            </div>
          </div>
        )}
        </div>
      )}

      <Footer constituency={selectedTsc} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PageContent />
    </Suspense>
  );
}
