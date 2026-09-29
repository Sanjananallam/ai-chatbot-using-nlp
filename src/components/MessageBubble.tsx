import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Message } from '../types/chat';

interface MessageBubbleProps {
  message: Message;
  isLatest: boolean;
  isGenerating: boolean;
  onRegenerate?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isLatest,
  isGenerating,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeechToggle = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      // Strip markdown syntax for natural voice output
      const plainText = message.content
        .replace(/```[\s\S]*?```/g, 'Code block omitted.')
        .replace(/[#*_`~>-]/g, '');

      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      className={`py-4 px-3 sm:px-6 transition-colors ${
        isUser ? 'bg-transparent' : 'bg-slate-900/40 border-y border-slate-800/40'
      }`}
    >
      <div className="max-w-3xl mx-auto flex space-x-3 sm:space-x-4">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-xs font-semibold text-white shadow-sm border border-slate-600">
              You
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Content & Extras */}
        <div className="flex-1 overflow-hidden space-y-2">
          {/* Header Row: Role & Timestamp */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">
              {isUser ? 'You' : 'Instant AI'}
            </span>
            <span className="text-[11px] text-slate-400">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Error Message banner */}
          {message.error ? (
            <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-medium text-red-300">Generation Error</div>
                <div>{message.errorMessage || message.content}</div>
                {onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="mt-1 px-2.5 py-1 bg-red-900/60 hover:bg-red-800 text-white rounded text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    Retry Question
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Clean Markdown rendering */
            <div className="markdown-content text-sm text-slate-200 select-text leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !String(children).includes('\n');
                    const codeString = String(children).replace(/\n$/, '');

                    if (isInline) {
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }

                    return (
                      <CodeBlock
                        language={match ? match[1] : 'code'}
                        code={codeString}
                      />
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* Streaming Cursor */}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-sky-400 animate-pulse align-middle" />
              )}
            </div>
          )}

          {/* Action Toolbar for AI message */}
          {!isUser && !message.error && !isStreaming && (
            <div className="pt-2 flex items-center space-x-1.5 border-t border-slate-800/40">
              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                title="Copy response to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-[11px]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>

              {/* Read aloud button */}
              <button
                onClick={handleSpeechToggle}
                className="flex items-center space-x-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                title={isSpeaking ? 'Stop reading' : 'Read aloud'}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                    <span className="text-sky-400 text-[11px]">Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Speak</span>
                  </>
                )}
              </button>

              {/* Regenerate (if latest AI message) */}
              {isLatest && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  disabled={isGenerating}
                  className="flex items-center space-x-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer disabled:opacity-50"
                  title="Regenerate this response"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span className="text-[11px]">Regenerate</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Subcomponent: Custom Code Block with Copy feedback
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-slate-700/80 bg-[#0d1117] text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-slate-800 text-slate-400">
        <span className="font-mono uppercase tracking-wider text-[11px] text-slate-300 font-semibold">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-[10px]">Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto font-mono text-[13px] text-slate-200 leading-relaxed bg-[#0b0f19]">
        <code>{code}</code>
      </pre>
    </div>
  );
};
