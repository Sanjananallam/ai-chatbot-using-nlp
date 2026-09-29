import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { WelcomeView } from './components/WelcomeView';
import { MessageBubble } from './components/MessageBubble';
import { ChatInput } from './components/ChatInput';
import { TypingIndicator } from './components/TypingIndicator';
import { SettingsModal } from './components/SettingsModal';
import { AboutModal } from './components/AboutModal';
import {
  loadConversations,
  saveConversations,
  loadActiveConversationId,
  saveActiveConversationId,
  loadSettings,
  saveSettings,
} from './services/storage';
import { sendChatMessageStream, generateChatTitle } from './services/api';
import { Conversation, Message, ChatSettings, NLPAnalysisResult } from './types/chat';
import { ArrowDown } from 'lucide-react';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeId, setActiveId] = useState<string | null>(() => {
    const savedId = loadActiveConversationId();
    const convs = loadConversations();
    if (savedId && convs.some((c) => c.id === savedId)) {
      return savedId;
    }
    return convs[0]?.id || null;
  });

  const [settings, setSettings] = useState<ChatSettings>(() => loadSettings());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync conversations to storage
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Sync active id to storage
  useEffect(() => {
    saveActiveConversationId(activeId);
  }, [activeId]);

  // Sync settings to storage
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Responsive sidebar collapse on initial load for small mobile screens
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  // Auto-scroll to bottom of chat
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Scroll handler to show "Scroll to bottom" button when user scrolls up
  const handleScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 150);
  };

  // Create new conversation
  const handleNewChat = () => {
    const newConv: Conversation = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Select conversation
  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Delete conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      if (activeId === id) {
        setActiveId(updated[0]?.id || null);
      }
      return updated;
    });
  };

  // Rename conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Clear current conversation messages
  const handleClearCurrentChat = () => {
    if (!activeId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, messages: [], updatedAt: Date.now() } : c))
    );
  };

  // Clear all chats
  const handleClearAll = () => {
    setConversations([]);
    setActiveId(null);
  };

  // Stop generating
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);

    // Finalize any streaming message
    if (activeId) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeId) return c;
          const updatedMessages = c.messages.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m
          );
          return { ...c, messages: updatedMessages };
        })
      );
    }
  };

  // Send message
  const handleSendMessage = async (userPrompt: string) => {
    if (!userPrompt.trim() || isGenerating) return;

    let targetConvId = activeId;
    let currentConv = activeConversation;

    // If no active conversation exists, create one immediately
    if (!targetConvId || !currentConv) {
      const newConv: Conversation = {
        id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: userPrompt.slice(0, 30),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(newConv.id);
      targetConvId = newConv.id;
      currentConv = newConv;
    }

    const userMessageId = `msg-${Date.now()}-user`;
    const aiMessageId = `msg-${Date.now() + 1}-ai`;

    const newUserMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: userPrompt,
      timestamp: Date.now(),
    };

    const newAiMessage: Message = {
      id: aiMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now() + 1,
      isStreaming: true,
    };

    // Update conversation with user message & placeholder AI message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== targetConvId) return c;
        return {
          ...c,
          updatedAt: Date.now(),
          messages: [...c.messages, newUserMessage, newAiMessage],
        };
      })
    );

    setIsGenerating(true);
    setTimeout(() => scrollToBottom(), 50);

    // Prepare history for API
    const historyPayload = currentConv.messages
      .filter((m) => !m.error && m.content)
      .map((m) => ({
        role: m.role,
        text: m.content,
      }));

    // Generate title in background if this is the first turn
    if (currentConv.messages.length === 0 || currentConv.title === 'New Chat') {
      generateChatTitle(userPrompt).then((autoTitle) => {
        if (autoTitle) {
          handleRenameConversation(targetConvId!, autoTitle);
        }
      });
    }

    // Prepare custom instruction based on Persona
    let personaInstruction = '';
    if (settings.persona === 'academic') {
      personaInstruction = 'You are an academic instructor and tutor. Focus on structured explanations, definitions, and step-by-step guidance.';
    } else if (settings.persona === 'technical') {
      personaInstruction = 'You are a senior software engineer. Provide robust, clean, efficient code implementations with best practices, time/space complexity analysis, and modern design patterns.';
    } else if (settings.persona === 'concise') {
      personaInstruction = 'You are a concise, direct AI assistant. Provide high-density, accurate answers without conversational filler or redundant greetings.';
    }

    const effectiveSystemInstruction = settings.customInstruction
      ? `${personaInstruction} ${settings.customInstruction}`.trim()
      : personaInstruction || undefined;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedText = '';
    let latestNLP: NLPAnalysisResult | undefined = undefined;

    await sendChatMessageStream({
      message: userPrompt,
      history: historyPayload,
      systemInstruction: effectiveSystemInstruction,
      temperature: settings.temperature,
      signal: controller.signal,
      onNLPAnalysis: (nlpData) => {
        latestNLP = nlpData;
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== targetConvId) return c;
            const updated = c.messages.map((m) => {
              if (m.id === userMessageId || m.id === aiMessageId) {
                return { ...m, nlpAnalysis: nlpData };
              }
              return m;
            });
            return { ...c, messages: updated };
          })
        );
      },
      onChunk: (textChunk) => {
        accumulatedText += textChunk;
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== targetConvId) return c;
            const updated = c.messages.map((m) => {
              if (m.id === aiMessageId) {
                return {
                  ...m,
                  content: accumulatedText,
                  nlpAnalysis: latestNLP || m.nlpAnalysis,
                };
              }
              return m;
            });
            return { ...c, messages: updated };
          })
        );
        scrollToBottom('auto');
      },
      onError: (errMsg) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== targetConvId) return c;
            const updated = c.messages.map((m) => {
              if (m.id === aiMessageId) {
                return {
                  ...m,
                  content: accumulatedText || 'Failed to generate response.',
                  error: true,
                  errorMessage: errMsg,
                  isStreaming: false,
                };
              }
              return m;
            });
            return { ...c, messages: updated };
          })
        );
        setIsGenerating(false);
      },
      onDone: () => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== targetConvId) return c;
            const updated = c.messages.map((m) => {
              if (m.id === aiMessageId) {
                return { ...m, isStreaming: false };
              }
              return m;
            });
            return { ...c, messages: updated };
          })
        );
        setIsGenerating(false);
        abortControllerRef.current = null;
      },
    });
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (!activeConversation || activeConversation.messages.length === 0 || isGenerating) return;

    // Find the last user message
    const msgs = activeConversation.messages;
    const lastUserIndex = [...msgs].reverse().findIndex((m) => m.role === 'user');

    if (lastUserIndex === -1) return;
    const realUserIndex = msgs.length - 1 - lastUserIndex;
    const userPrompt = msgs[realUserIndex].content;

    // Truncate messages after this user turn
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeId) return c;
        return {
          ...c,
          messages: c.messages.slice(0, realUserIndex),
        };
      })
    );

    // Re-send prompt
    handleSendMessage(userPrompt);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f19] text-slate-100 antialiased font-sans select-none">
      {/* Left Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onClearAll={handleClearAll}
        isOpen={sidebarOpen}
        onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenAboutModal={() => setAboutModalOpen(true)}
      />

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <ChatHeader
          conversation={activeConversation}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNewChat={handleNewChat}
          onClearCurrentChat={handleClearCurrentChat}
          onRenameChat={(newTitle) => activeId && handleRenameConversation(activeId, newTitle)}
          onOpenSettings={() => setSettingsModalOpen(true)}
        />

        {/* Chat Message Scroll Area */}
        <div
          ref={chatScrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col"
        >
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <WelcomeView onSelectPrompt={(prompt) => handleSendMessage(prompt)} />
          ) : (
            <div className="flex-1 pb-4">
              {activeConversation.messages.map((message, index) => {
                const isLatest = index === activeConversation.messages.length - 1;
                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isLatest={isLatest}
                    isGenerating={isGenerating}
                    onRegenerate={handleRegenerate}
                  />
                );
              })}

              {/* Typing indicator while generating before first text chunk arrives */}
              {isGenerating &&
                activeConversation.messages[activeConversation.messages.length - 1]?.role ===
                  'model' &&
                !activeConversation.messages[activeConversation.messages.length - 1]?.content && (
                  <TypingIndicator />
                )}

              <div ref={messagesEndRef} className="h-1" />
            </div>
          )}

          {/* Scroll to bottom button */}
          {showScrollBottom && (
            <button
              onClick={() => scrollToBottom('smooth')}
              className="fixed bottom-24 right-6 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 shadow-xl transition-all hover:scale-105 active:scale-95 z-30 cursor-pointer"
              title="Scroll to bottom"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Fixed Message Input at bottom */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={handleSendMessage}
          onStop={handleStopGenerating}
          isGenerating={isGenerating}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
      />

      {/* About TheTrio AI Modal */}
      <AboutModal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
      />
    </div>
  );
}
