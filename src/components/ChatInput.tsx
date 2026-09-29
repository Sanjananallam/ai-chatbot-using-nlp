import React, { useRef, useEffect } from 'react';
import { Send, Square, Sparkles, CornerDownLeft } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: (message: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  onStop,
  isGenerating,
  disabled,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${Math.max(newHeight, 48)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isGenerating) {
      onStop();
      return;
    }
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }
  };

  return (
    <div className="border-t border-slate-800/80 bg-[#0b0f19]/95 backdrop-blur-md px-3 sm:px-4 pt-3 pb-4 shrink-0">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end rounded-2xl bg-slate-900 border border-slate-700/80 focus-within:border-sky-500/80 focus-within:ring-2 focus-within:ring-sky-500/20 shadow-xl transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isGenerating
                ? 'Instant AI is generating a response...'
                : 'Ask Instant AI anything (e.g. explanations, coding, writing)...'
            }
            disabled={disabled}
            className="w-full resize-none bg-transparent px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none max-h-44 leading-relaxed"
          />

          <div className="flex items-center space-x-1.5 p-2 shrink-0">
            {isGenerating ? (
              <button
                type="button"
                onClick={onStop}
                className="p-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white shadow-md transition-all active:scale-95 cursor-pointer flex items-center space-x-1"
                title="Stop generating"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!input.trim() || disabled}
                className="p-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
                title="Send message (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Footnote / Context Hint */}
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <div className="flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>Instant AI • Context-aware intelligent assistant</span>
          </div>
          <div className="hidden sm:flex items-center space-x-1">
            <span>Use</span>
            <kbd className="px-1 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
              Shift + Enter
            </kbd>
            <span>for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
};
