import { useState, useCallback, useRef, useEffect } from 'react';

interface UseGoogleTransliterateOptions {
  maxSuggestions?: number;
}

interface UseGoogleTransliterateReturn {
  suggestions: string[];
  isLoading: boolean;
  getSuggestions: (text: string) => Promise<void>;
  clearSuggestions: () => void;
}

const GOOGLE_INPUT_TOOLS_API = 'https://inputtools.google.com/request';

export function useGoogleTransliterate(
  options: UseGoogleTransliterateOptions = {}
): UseGoogleTransliterateReturn {
  const { maxSuggestions = 5 } = options;

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getSuggestions = useCallback(
    async (text: string) => {
      // Don't transliterate if the text is empty or only whitespace
      if (!text || !text.trim()) {
        setSuggestions([]);
        return;
      }

      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          text: text,
          itc: 'ta-t-i0-und', // Tamil transliteration
          num: maxSuggestions.toString(),
        });

        const response = await fetch(`${GOOGLE_INPUT_TOOLS_API}?${params}`, {
          method: 'GET',
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error('Transliteration request failed');
        }

        const data = await response.json();

        // Parse the response format from Google Input Tools
        // Response format: [status, [request_id, [word, [suggestions], metadata]]]
        if (data && data[1] && data[1][0] && data[1][0][1]) {
          const transliterations = data[1][0][1];
          setSuggestions(transliterations);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Transliteration error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [maxSuggestions]
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    suggestions,
    isLoading,
    getSuggestions,
    clearSuggestions,
  };
}
