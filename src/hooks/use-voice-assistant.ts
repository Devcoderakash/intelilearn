
import { useEffect, useState, useCallback } from 'react';

/**
 * useVoiceAssistant Hook
 * Enhances existing AI Tutor with Speech-to-Text and Text-to-Speech.
 * Zero UI changes; just logic for handling audio.
 */
export function useVoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // 1. Speech to Text (STT) - Using Web Speech API for Vercel/Edge compatibility
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log("[Voice] Detection started...");
      setIsListening(true);
    };
    
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      console.log("[Voice] Result captured:", text);
      setTranscript(text);
    };

    recognition.onerror = (event: any) => {
      console.error("[Voice] Recognition error:", event.error);
      
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        alert("Microphone access is blocked. Please enable it in your browser settings to use voice search.");
      } else if (event.error === 'network') {
        alert("Network error detected. Voice recognition requires an active internet connection.");
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        // Only alert for non-trivial errors
        console.warn("[Voice] Unexpected recognition state:", event.error);
      }

      setIsListening(false);
    };

    recognition.onend = () => {
      console.log("[Voice] Detection ended.");
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("[Voice] Start error:", e);
      setIsListening(false);
    }
  }, [isListening]);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    if ('speechSynthesis' in window) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // 2. Text to Speech (TTS)
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;

    // 1. Heavy Cleanup for Natural Speech
    const cleanText = text
      .replace(/[*#_~`>\[\]()\\/]/g, ' ') // Remove all MD and framing symbols
      .replace(/!+/, '!')                // Normalize punctuation
      .replace(/\?+/, '?')
      .replace(/:+/g, '.')               // Colons sound robotic, dots give natural pause
      .replace(/\s+/g, ' ')              // Normalize whitespace
      .trim();

    if (!cleanText) return;

    // 2. Advanced Language Detection (Devanagari + Common Hinglish patterns)
    const hasDevanagari = /[\u0900-\u097F]/.test(cleanText);
    const hasIndianLexicon = /\b(hai|ka|ki|ke|ko|se|ho|kar|karo|raha|rahi|tutor|study|plan)\b/i.test(cleanText);
    
    // We treat it as Indian Accent if it has Hindi characters OR common Hindi words in Roman script
    const isIndianAccent = hasDevanagari || hasIndianLexicon;

    // 3. Cancel existing speech immediately
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // 4. Advanced Voice Selection (High-Priority Whitelist for Indian Accents)
    let selectedVoice = null;
    const currentVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();

    // Whitelist keywords for Indian Accents
    const indianVoiceKeywords = ['hindi', 'india', 'hi-in', 'en-in', 'google hi', 'microsoft hemant', 'microsoft kalpana'];

    if (isIndianAccent) {
      utterance.lang = hasDevanagari ? 'hi-IN' : 'en-IN';
      
      // Strict Priority Search
      selectedVoice = 
        // 1. Natural Google Hindi
        currentVoices.find(v => v.name.toLowerCase().includes('google') && v.lang.startsWith('hi')) ||
        // 2. Microsoft Native Hindi (Windows)
        currentVoices.find(v => (v.name.toLowerCase().includes('hemant') || v.name.toLowerCase().includes('kalpana'))) ||
        // 3. Any Indian English (Excellent for Hinglish)
        currentVoices.find(v => v.lang.includes('IN') && (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('google'))) ||
        // 4. Any voice with 'Hindi' or 'India' in the name
        currentVoices.find(v => indianVoiceKeywords.some(key => v.name.toLowerCase().includes(key))) ||
        // 5. Generic Fallback for hi
        currentVoices.find(v => v.lang.startsWith('hi'));
    } else {
      utterance.lang = 'en-US';
      selectedVoice = currentVoices.find(v => v.lang.startsWith('en') && v.name.includes('Natural')) ||
                      currentVoices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                      currentVoices.find(v => v.lang.startsWith('en-US'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      // Critical: Ensure the lang property matches the voice property for some browsers
      utterance.lang = selectedVoice.lang;
      console.log(`[TTS] Hinglish Master Sync: ${selectedVoice.name} | Locale: ${selectedVoice.lang}`);
    } else {
      console.warn("[TTS] Native Indian node not found. Using generic fallback.");
    }
    
    // 5. Dynamic Pace Tuning
    utterance.rate = isIndianAccent ? 0.92 : 1.05; // Hindi/Indian accents are clearer slightly slower
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e: any) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn("[TTS] Secondary node failure:", e.error);
      }
      setIsSpeaking(false);
    };
    
    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("[TTS] Engine lock detected. Re-calibrating...");
      setIsSpeaking(false);
    }
  }, [voices]);

  // Professional Cleanup: Ensure audio stops when component unmounts or section changes
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    startListening,
    speak,
    stopSpeaking,
    isListening,
    isSpeaking,
    transcript
  };
}
