import React from 'react';
import { X, Sparkles, MessageSquare, Zap, ShieldCheck, Cpu } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-white">About Instant AI</h2>
              <p className="text-[11px] text-slate-400">Intelligent Conversational Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Short & crisp description */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          <p className="text-slate-300 leading-relaxed text-xs">
            <strong>Instant AI</strong> is a smart, context-aware AI assistant designed to deliver fast, natural, and helpful conversations across coding, learning, problem solving, writing, and everyday questions.
          </p>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-start space-x-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <MessageSquare className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-200">Context Memory</div>
                <div className="text-[11px] text-slate-400">Remembers previous conversation turns and seamlessly understands follow-up questions.</div>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <Zap className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-200">Real-Time Streaming</div>
                <div className="text-[11px] text-slate-400">Powered by Google Gemini with instant live responses and markdown code formatting.</div>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-200">Local & Secure</div>
                <div className="text-[11px] text-slate-400">Your chat history is saved locally in your browser with secure server-side API processing.</div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-center text-[11px] text-slate-500">
           Built by me
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
