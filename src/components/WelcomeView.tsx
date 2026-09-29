import React from 'react';
import {
  Sparkles,
  Code2,
  ArrowRight,
  BookOpen,
  Lightbulb,
  MessageSquare,
} from 'lucide-react';

interface WelcomeViewProps {
  onSelectPrompt: (prompt: string) => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onSelectPrompt }) => {
  const suggestedCategories = [
    {
      title: 'Knowledge & Explanations',
      icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
      prompts: [
        {
          label: 'Explain Natural Language Processing',
          prompt: 'Explain Natural Language Processing (NLP), its core components, and how modern language models work.',
          desc: 'How computers understand and generate language',
        },
        {
          label: 'Explain machine learning with an example',
          prompt: 'Explain machine learning with an example, comparing traditional rule-based programming with ML.',
          desc: 'Concept overview with practical comparison',
        },
        {
          label: 'What is Artificial Intelligence?',
          prompt: 'What is Artificial Intelligence (AI)? Explain its key branches and real-world applications.',
          desc: 'Foundational concepts and practical impact',
        },
      ],
    },
    {
      title: 'Coding & Problem Solving',
      icon: <Code2 className="w-4 h-4 text-emerald-400" />,
      prompts: [
        {
          label: 'Help me learn Python',
          prompt: 'Help me learn Python. Provide a clear study roadmap from basics to data structures, with a simple code snippet.',
          desc: 'Step-by-step programming roadmap',
        },
        {
          label: 'Write a simple Python program',
          prompt: 'Write a simple Python program to sort a list of numbers and filter unique elements.',
          desc: 'Clean code snippet with explanations',
        },
        {
          label: 'How does conversation memory work?',
          prompt: 'How does conversational memory work in modern chatbots? Explain how follow-up questions are resolved.',
          desc: 'Multi-turn context and follow-up understanding',
        },
      ],
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full text-center">
      {/* Hero Badge & Title */}
      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium mb-4">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Intelligent Conversational Assistant</span>
      </div>

      <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-3">
        Instant <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-cyan-400">AI</span>
      </h1>

      <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto mb-10">
        Your smart, context-aware conversational AI assistant. Ask questions, explore ideas, solve problems, and write code with ease.
      </p>

      {/* Suggested Prompts Section */}
      <div className="w-full max-w-2xl space-y-4 text-left">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 flex items-center space-x-2">
          <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
          <span>Suggested Prompts to Get Started</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestedCategories.map((cat) => (
            <div key={cat.title} className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-medium text-slate-300 px-1">
                {cat.icon}
                <span>{cat.title}</span>
              </div>
              <div className="space-y-2">
                {cat.prompts.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => onSelectPrompt(item.prompt)}
                    className="w-full text-left p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/80 hover:border-sky-500/40 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-medium text-slate-200 group-hover:text-white mb-0.5">
                      <span>{item.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
