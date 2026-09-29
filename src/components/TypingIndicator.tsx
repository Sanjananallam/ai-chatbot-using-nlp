import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="py-4 px-3 sm:px-6 bg-slate-900/40 border-y border-slate-800/40">
      <div className="max-w-3xl mx-auto flex space-x-3 sm:space-x-4">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0 mt-0.5 animate-pulse">
          <Sparkles className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Instant AI</span>
            <span className="text-[10px] text-sky-400 flex items-center space-x-1">
              <span>Thinking ({seconds}s)</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 py-1">
            <div className="flex space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 dot-1" />
              <span className="w-2 h-2 rounded-full bg-indigo-400 dot-2" />
              <span className="w-2 h-2 rounded-full bg-cyan-400 dot-3" />
            </div>
            <span className="text-xs text-slate-400 italic">
              Generating response...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
