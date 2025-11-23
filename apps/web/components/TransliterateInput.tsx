'use client';

import { useState, useEffect, useRef } from 'react';
import { useGoogleTransliterate } from '@/hooks/useGoogleTransliterate';
import { useTamilSpeechRecognition } from '@/hooks/useTamilSpeechRecognition';
import { Mic, MicOff, XCircle } from 'lucide-react';

interface TransliterateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export default function TransliterateInput({
  id,
  value,
  onChange,
  placeholder,
  className,
  label,
}: TransliterateInputProps) {
  const [currentWord, setCurrentWord] = useState('');
  const [wordStartPos, setWordStartPos] = useState(0);
  const [wordEndPos, setWordEndPos] = useState(0);
  const { suggestions, getSuggestions, clearSuggestions } = useGoogleTransliterate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Speech recognition - use the input id to isolate each input field
  const {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    permissionDenied,
  } = useTamilSpeechRecognition(id);

  // Auto-select first suggestion when available
  useEffect(() => {
    if (suggestions.length > 0 && currentWord) {
      const before = value.substring(0, wordStartPos);
      const after = value.substring(wordEndPos);
      const newValue = before + suggestions[0] + ' ' + after;

      onChange(newValue);
      clearSuggestions();
      setCurrentWord('');

      // Set cursor position after the inserted text
      setTimeout(() => {
        if (inputRef.current) {
          const newPos = (before + suggestions[0] + ' ').length;
          inputRef.current.setSelectionRange(newPos, newPos);
          inputRef.current.focus();
        }
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions]);

  // Helper function to get Tamil transliteration directly
  const getTransliteration = async (text: string): Promise<string> => {
    try {
      const params = new URLSearchParams({
        text: text,
        itc: 'ta-t-i0-und',
        num: '1',
      });

      const response = await fetch(`https://inputtools.google.com/request?${params}`, {
        method: 'GET',
      });

      if (!response.ok) {
        return text;
      }

      const data = await response.json();

      if (data && data[1] && data[1][0] && data[1][0][1] && data[1][0][1][0]) {
        return data[1][0][1][0];
      }

      return text;
    } catch (error) {
      console.error('Transliteration error:', error);
      return text;
    }
  };

  // Handle speech recognition transcript
  useEffect(() => {
    const processTranscript = async () => {
      // Process when we have a transcript and we're not listening anymore
      if (transcript && !listening) {
        console.log('Processing transcript:', transcript);

        // Check if transcript is in English and needs transliteration
        const isEnglish = /^[a-zA-Z\s]+$/.test(transcript);

        if (isEnglish) {
          // Transliterate English to Tamil word by word
          const words = transcript.trim().split(/\s+/);
          let currentValue = '';

          for (const word of words) {
            if (word.trim()) {
              const tamilWord = await getTransliteration(word);
              console.log(`Transliterated "${word}" to "${tamilWord}"`);
              currentValue = currentValue ? `${currentValue} ${tamilWord}` : tamilWord;
            }
          }

          console.log('Final value:', currentValue);
          onChange(currentValue);
        } else {
          // Tamil text - replace existing value
          console.log('Tamil text - replacing value:', transcript);
          onChange(transcript);
        }

        // Clear the transcript after processing
        resetTranscript();
      }
    };

    processTranscript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, listening]);

  const getCurrentWord = () => {
    const cursorPos = inputRef.current?.selectionStart || value.length;
    const textBeforeCursor = value.substring(0, cursorPos);
    const textAfterCursor = value.substring(cursorPos);

    // Find the start of the current word (last space or beginning)
    const lastSpaceIndex = textBeforeCursor.lastIndexOf(' ');
    const wordStart = lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1;

    // Find the end of the current word (next space or end)
    const nextSpaceIndex = textAfterCursor.indexOf(' ');
    const wordEnd = nextSpaceIndex === -1 ? value.length : cursorPos + nextSpaceIndex;

    const word = value.substring(wordStart, wordEnd);
    return { word, wordStart, wordEnd };
  };

  const transliterateCurrentWord = async () => {
    const { word, wordStart, wordEnd } = getCurrentWord();

    if (word.trim() && /^[a-zA-Z]+$/.test(word)) {
      // Only transliterate if it's English letters
      setCurrentWord(word);
      setWordStartPos(wordStart);
      setWordEndPos(wordEnd);

      // Get suggestions and auto-select first one
      await getSuggestions(word);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Trigger transliteration on Space, Enter, or Tab
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'Tab') {
      const { word } = getCurrentWord();

      if (word.trim() && /^[a-zA-Z]+$/.test(word)) {
        e.preventDefault();
        await transliterateCurrentWord();
      }
    }
  };

  const handleBlur = async () => {
    // Transliterate on blur (focus change)
    await transliterateCurrentWord();
  };

  const handleMicClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (listening) {
      stopListening();
    } else {
      await startListening();
    }
  };

  return (
    <div className="relative">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`${className} pr-10`}
          autoComplete="off"
        />
        {browserSupportsSpeechRecognition && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={permissionDenied}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors ${
              permissionDenied
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                : listening
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label={
              permissionDenied
                ? 'Microphone permission denied'
                : listening
                ? 'Stop recording'
                : 'Start recording'
            }
            title={
              permissionDenied
                ? 'Microphone permission denied. Please allow microphone access in browser settings.'
                : listening
                ? 'Stop recording'
                : 'Click to speak in Tamil'
            }
          >
            {permissionDenied ? (
              <div className="relative">
                <Mic className="h-4 w-4" />
                <XCircle className="h-3 w-3 absolute -top-1 -right-1 bg-white rounded-full" />
              </div>
            ) : listening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      <div className="h-5 mt-1">
        {listening && (
          <div className="text-xs text-red-600 flex items-center gap-1">
            <span className="animate-pulse">●</span>
            <span>Listening... {transcript && `"${transcript}"`}</span>
          </div>
        )}
        {permissionDenied && (
          <div className="text-xs text-red-600 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            <span>Microphone access denied. Please allow microphone permission in your browser.</span>
          </div>
        )}
      </div>
    </div>
  );
}
