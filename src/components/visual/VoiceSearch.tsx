import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Search, X, Loader2, Volume2, Sparkles } from 'lucide-react';

interface VoiceSearchProps {
  onResult: (text: string) => void;
}

const VoiceSearch = ({ onResult }: VoiceSearchProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'zh-CN';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognitionRef.current.onresult = (event: any) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      if (transcript) onResult(transcript);
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  if (!isSupported) return null;

  return (
    <div className="fixed bottom-12 left-12 z-50">
      <motion.div className="relative">
        {/* Glow Ring */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-[#7B1FA2] rounded-full blur-2xl"
            />
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleListening}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(123,31,162,0.4)] border border-white/20 transition-all duration-500 overflow-hidden ${
            isListening ? 'bg-[#4A148C]' : 'bg-gradient-to-br from-[#7B1FA2] to-[#4A148C] backdrop-blur-3xl'
          }`}
        >
          {/* Glassmorphism Shine */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent" />
          
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div
                key="listening"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map(i => (
                    <motion.div
                      key={i}
                      animate={{ height: [4, 12, 4] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 bg-white rounded-full"
                    />
                  ))}
                </div>
                <X className="w-4 h-4 text-white/60" />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Mic className="w-8 h-8 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
              exit={{ opacity: 0, x: 20, scale: 0.9, y: 10 }}
              className="absolute left-24 bottom-0 bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[32px] w-80 shadow-[0_40px_80px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Voice Assistant</span>
                </div>
                <Sparkles className="w-4 h-4 text-[#7B1FA2]" />
              </div>
              
              <div className="min-h-[3rem]">
                <p className="text-lg font-black text-white leading-tight">
                  {transcript || '说出你想寻找的志愿活动...'}
                </p>
                {!transcript && (
                  <p className="text-xs text-white/30 mt-4 font-bold italic">
                    例如："环保类活动" 或 "空巢老人陪伴"
                  </p>
                )}
              </div>

              {/* Visualization Bars */}
              <div className="mt-8 flex items-end gap-1.5 h-8">
                {Array.from({ length: 15 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: transcript ? [4, Math.random() * 24 + 4, 4] : 4 }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                    className="flex-1 bg-gradient-to-t from-[#7B1FA2] to-[#F9D8C6] rounded-full opacity-40"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default VoiceSearch;
