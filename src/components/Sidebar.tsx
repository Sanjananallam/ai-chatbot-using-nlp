import React, { useState, useMemo } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Settings,
  ChevronLeft,
  Info,
  Sparkles,
} from 'lucide-react';
import { Conversation } from '../types/chat';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onOpenSettings: () => void;
  onOpenAboutModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onClearAll,
  isOpen,
  onToggleOpen,
  onOpenSettings,
  onOpenAboutModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter conversations
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  // Group by time
  const groupedConversations = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const groups: { [key: string]: Conversation[] } = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: [],
    };

    filtered.forEach((conv) => {
      const diff = now - conv.updatedAt;
      if (diff < oneDay) {
        groups.Today.push(conv);
      } else if (diff < 2 * oneDay) {
        groups.Yesterday.push(conv);
      } else if (diff < 7 * oneDay) {
        groups['Previous 7 Days'].push(conv);
      } else {
        groups.Older.push(conv);
      }
    });

    return groups;
  }, [filtered]);

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteConversation(id);
    setConfirmDeleteId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={onToggleOpen}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col bg-[#0f172a] border-r border-slate-800 text-slate-300 transition-all duration-300 ease-in-out ${
          isOpen
            ? 'w-72 translate-x-0'
            : 'w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden'
        }`}
      >
        {/* Sidebar Header & Brand: TheTrio AI (no NLP architecture tag) */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h1 className="font-semibold text-sm tracking-tight text-white truncate">
                Instant AI
              </h1>
            </div>
          </div>
          <button
            onClick={onToggleOpen}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white md:hidden cursor-pointer"
            title="Close sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium text-sm shadow-md shadow-sky-500/20 transition-all active:scale-[0.99] group cursor-pointer"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation History List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
          {Object.entries(groupedConversations).map(([groupName, convs]) => {
            if (convs.length === 0) return null;
            return (
              <div key={groupName} className="space-y-1">
                <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {groupName}
                </div>
                {convs.map((conv) => {
                  const isActive = conv.id === activeId;
                  const isEditing = editingId === conv.id;
                  const isConfirming = confirmDeleteId === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => onSelectConversation(conv.id)}
                      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-slate-800/90 text-white font-medium border border-sky-500/30'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate pr-2 flex-1">
                        <MessageSquare
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-400'
                          }`}
                        />
                        {isEditing ? (
                          <form
                            onSubmit={handleSaveRename}
                            className="flex items-center space-x-1 flex-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full bg-slate-900 border border-sky-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="submit"
                              className="text-emerald-400 hover:text-emerald-300 p-0.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="text-slate-400 hover:text-slate-200 p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        ) : (
                          <span className="truncate">{conv.title}</span>
                        )}
                      </div>

                      {/* Action buttons (Rename, Delete) */}
                      {!isEditing && (
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isConfirming ? (
                            <div
                              className="flex items-center space-x-1 bg-red-950/80 px-1 py-0.5 rounded border border-red-500/40"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-[10px] text-red-300 font-normal">Del?</span>
                              <button
                                onClick={(e) => handleConfirmDelete(conv.id, e)}
                                className="text-red-400 hover:text-red-200 p-0.5"
                                title="Confirm Delete"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(null);
                                }}
                                className="text-slate-400 hover:text-slate-200 p-0.5"
                                title="Cancel"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={(e) => handleStartRename(conv, e)}
                                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700/60"
                                title="Rename Chat"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteClick(conv.id, e)}
                                className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-700/60"
                                title="Delete Chat"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              No conversations found.
            </div>
          )}
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60 space-y-1">
          {/* About TheTrio AI Modal Trigger */}
          <button
            onClick={onOpenAboutModal}
            className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>About Instant AI</span>
          </button>

          {/* Settings Modal */}
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Settings & Persona</span>
          </button>

          {/* Clear all confirm */}
          {conversations.length > 0 && (
            <div className="pt-1">
              {showClearConfirm ? (
                <div className="bg-red-950/70 border border-red-500/40 rounded-lg p-2 text-center text-xs space-y-1.5">
                  <p className="text-[11px] text-red-200 font-medium">Delete all conversations?</p>
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => {
                        onClearAll();
                        setShowClearConfirm(false);
                      }}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-medium cursor-pointer"
                    >
                      Yes, Clear
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-400 hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear all chats</span>
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
