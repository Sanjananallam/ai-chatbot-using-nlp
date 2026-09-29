import React, { useState } from 'react';
import { X, Sliders, Sparkles, Cpu, RefreshCw, Check } from 'lucide-react';
import { ChatSettings, PersonaType } from '../types/chat';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ChatSettings;
  onSaveSettings: (settings: ChatSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [temp, setTemp] = useState(settings.temperature);
  const [persona, setPersona] = useState<PersonaType>(settings.persona);
  const [customPrompt, setCustomPrompt] = useState(settings.customInstruction || '');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const personas: Array<{
    id: PersonaType;
    title: string;
    description: string;
  }> = [
    {
      id: 'balanced',
      title: 'Balanced Assistant',
      description: 'Clear, polite, and well-rounded explanations for any topic.',
    },
    {
      id: 'academic',
      title: 'Academic Tutor',
      description: 'Emphasizes clear explanations, educational structure, and step-by-step guidance.',
    },
    {
      id: 'technical',
      title: 'Senior Software Engineer',
      description: 'Focuses on production-grade code, efficiency, algorithms, and technical accuracy.',
    },
    {
      id: 'concise',
      title: 'Concise & Direct',
      description: 'Short, high-density answers without conversational filler.',
    },
  ];

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      temperature: temp,
      persona,
      customInstruction: customPrompt.trim() || undefined,
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    setTemp(0.7);
    setPersona('balanced');
    setCustomPrompt('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h2 className="font-semibold text-base text-white">Instant AI Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs sm:text-sm text-slate-300">
          {/* Persona selector */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
              AI Persona & Tone
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {personas.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPersona(p.id)}
                  className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                    persona === p.id
                      ? 'bg-sky-500/10 border-sky-500 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-xs text-white mb-0.5">{p.title}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                    {p.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Temperature slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-200 uppercase tracking-wider">
                Creativity & Temperature ({temp.toFixed(2)})
              </label>
              <span className="text-[11px] font-mono text-sky-400">
                {temp < 0.4 ? 'Precise & Factual' : temp > 0.8 ? 'Creative' : 'Balanced'}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={temp}
              onChange={(e) => setTemp(parseFloat(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0.1 (Strict)</span>
              <span>0.7 (Default)</span>
              <span>1.0 (Creative)</span>
            </div>
          </div>

          {/* Model info banner */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-sky-400 shrink-0" />
            <div className="space-y-0.5">
              <div className="font-medium text-slate-200">Instant AI Engine</div>
              <div className="text-[11px] text-slate-400">
                Powered by Google Gemini • Real-time streaming • Multi-turn conversational memory
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              {savedNotice ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
