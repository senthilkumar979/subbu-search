'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// Global state to track which input is currently listening
let activeInputId: string | null = null;

export function useTamilSpeechRecognition(inputId: string) {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const [isActiveInput, setIsActiveInput] = useState(false);
  const [capturedTranscript, setCapturedTranscript] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>('');

  const startListening = useCallback(async () => {
    try {
      // Check microphone permission first
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      if (permission.state === 'denied') {
        setPermissionDenied(true);
        return;
      }

      // Stop any other active input first
      if (activeInputId && activeInputId !== inputId) {
        SpeechRecognition.stopListening();
      }

      // Set this input as the active one
      activeInputId = inputId;
      setIsActiveInput(true);
      setCapturedTranscript('');
      setPermissionDenied(false);

      resetTranscript();
      lastTranscriptRef.current = '';

      await SpeechRecognition.startListening({
        language: 'ta-IN', // Tamil (India)
        continuous: true, // Keep listening
      });
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setPermissionDenied(true);
      setIsActiveInput(false);
      if (activeInputId === inputId) {
        activeInputId = null;
      }
    }
  }, [resetTranscript, inputId]);

  const stopListening = useCallback(() => {
    // Capture final transcript before stopping
    if (transcript) {
      setCapturedTranscript(transcript);
    }

    SpeechRecognition.stopListening();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Clear active input if it's this one
    if (activeInputId === inputId) {
      activeInputId = null;
    }
    setIsActiveInput(false);
  }, [inputId, transcript]);

  const clearCapturedTranscript = useCallback(() => {
    setCapturedTranscript('');
  }, []);

  // Capture transcript when this input is active
  useEffect(() => {
    if (isActiveInput && listening && transcript) {
      setCapturedTranscript(transcript);
    }
  }, [isActiveInput, listening, transcript]);

  // Auto-stop after 1 second of silence
  useEffect(() => {
    if (listening && activeInputId === inputId) {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // If transcript has changed, reset the timeout
      if (transcript !== lastTranscriptRef.current) {
        lastTranscriptRef.current = transcript;

        // Set new timeout to stop after 1 second of no new speech
        timeoutRef.current = setTimeout(() => {
          // Capture the final transcript before stopping
          if (transcript) {
            setCapturedTranscript(transcript);
          }

          SpeechRecognition.stopListening();
          if (activeInputId === inputId) {
            activeInputId = null;
          }
          setIsActiveInput(false);
        }, 1000);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [listening, transcript, inputId]);

  // Update isActiveInput when global state changes
  useEffect(() => {
    if (!listening && isActiveInput) {
      // Capture final transcript when stopping
      if (transcript) {
        setCapturedTranscript(transcript);
      }

      setIsActiveInput(false);
      if (activeInputId === inputId) {
        activeInputId = null;
      }
    }
  }, [listening, inputId, isActiveInput, transcript]);

  // Monitor listening state to detect permission issues
  useEffect(() => {
    // Clear permission denied if we successfully start listening
    if (isActiveInput && listening) {
      setPermissionDenied(false);
    }
  }, [listening, isActiveInput, inputId]);

  useEffect(() => {
    return () => {
      if (activeInputId === inputId) {
        SpeechRecognition.stopListening();
        activeInputId = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputId]);

  return {
    transcript: capturedTranscript,
    listening: isActiveInput && listening,
    startListening,
    stopListening,
    resetTranscript: clearCapturedTranscript,
    browserSupportsSpeechRecognition,
    isActiveInput,
    permissionDenied,
  };
}
