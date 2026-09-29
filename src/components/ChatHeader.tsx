import React, { useState } from 'react';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Download,
  Share2,
  Sparkles,
  Edit2,
  Check,
  X,
  SlidersHorizontal,
  Bot,
} from 'lucide-react';
import { Conversation } from '../types/chat';

interface ChatHeaderProps {
  conversation: Conversation | null;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onClearCurrentChat: () => void;
  onRenameChat: (newTitle: string) => void;
  onOpenSettings: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  sidebarOpen,
  onToggleSidebar,
  onNewChat,
  onClearCurrentChat,
  onRenameChat,
  onOpenSettings,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const startEditing = () => {
    if (!conversation) return;
    setTitleInput(conversation.title);
    setIsEditing(true);
  };

  const saveTitle = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (titleInput.trim()) {
      onRenameChat(titleInput.trim());
    }
    setIsEditing(false);
  };

  const handleExport = (format: 'markdown' | 'json') => {
    if (!conversation) return;
    setShowExportMenu(false);

    let content = '';
    let filename = `${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;

    if (format === 'markdown') {
      content = `# ${conversation.title}\n\n*Created on ${new Date(conversation.createdAt).toLocaleString()}*\n\n---\n\n`;
      conversation.messages.forEach((msg) => {
        content += `### ${msg.role === 'user' ? 'User' : 'Instant AI'} (${new Date(msg.timestamp).toLocaleTimeString()})\n\n${msg.content}\n\n---\n\n`;
      });
      filename += '.md';
    } else {
      content = JSON.stringify(conversation, null, 2);
      filename += '.json';
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const turnCount = conversation?.messages.length || 0;

  return (
    <header className="h-14 border-b border-slate-800 bg-[#0b0f19]/90 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
      {/* Left side: Toggle button and Title */}
      <div className="flex items-center space-x-3 overflow-hidden">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        <div className="flex items-center space-x-2 truncate">
          {isEditing ? (
            <form onSubmit={saveTitle} className="flex items-center space-x-1.5">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="bg-slate-900 border border-sky-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                autoFocus
              />
              <button type="submit" className="text-emerald-400 hover:text-emerald-300">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-center space-x-2 group">
              <span className="font-semibold text-sm text-slate-100 truncate max-w-[200px] sm:max-w-md">
                {conversation ? conversation.title : 'Instant AI'}
              </span>
              {conversation && (
                <button
                  onClick={startEditing}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-slate-300 rounded transition-opacity"
                  title="Rename title"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {conversation && turnCount > 0 && (
            <div className="hidden lg:flex items-center space-x-1.5 px-2 py-0.5 bg-slate-800/80 border border-slate-700/60 rounded-full text-[11px] text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{turnCount} messages</span>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        <button
          onClick={onNewChat}
          className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-xs text-slate-200 hover:text-white transition-colors cursor-pointer"
          title="Start a new chat conversation"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>

        {/* Export dropdown */}
        {conversation && conversation.messages.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Export Conversation"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Export</span>
            </button>
            {showExportMenu && (
              <div
                className="absolute right-0 mt-1.5 w-40 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 text-xs text-slate-300 z-30"
                onClick={() => setShowExportMenu(false)}
              >
                <button
                  onClick={() => handleExport('markdown')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 hover:text-white flex items-center justify-between"
                >
                  <span>Export Markdown</span>
                  <span className="text-[10px] text-slate-400">.md</span>
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 hover:text-white flex items-center justify-between"
                >
                  <span>Export JSON</span>
                  <span className="text-[10px] text-slate-400">.json</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Clear messages */}
        {conversation && conversation.messages.length > 0 && (
          <button
            onClick={onClearCurrentChat}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800/60 hover:bg-red-950/80 hover:text-red-300 text-slate-400 text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Clear all messages in this conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Clear</span>
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Settings and system persona"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
