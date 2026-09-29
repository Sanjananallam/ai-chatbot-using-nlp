export interface NLPAnalysisResult {
  tokens: string[];
  filteredTokens: string[];
  normalizedText: string;
  tokenCount: number;
  filteredTokenCount: number;
  lexicalDiversity: number;
  primaryIntent: {
    name: string;
    label: string;
    confidence: number;
    category: string;
  };
  detectedEntities: string[];
  keywords: string[];
  coreference: {
    hasAnaphoricReference: boolean;
    referencedPronouns: string[];
    resolvedContext: string | null;
  };
  sentiment: 'Inquisitive' | 'Technical' | 'Neutral' | 'Creative' | 'Urgent';
  complexity: 'Basic' | 'Intermediate' | 'Advanced';
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  nlpAnalysis?: NLPAnalysisResult;
  isStreaming?: boolean;
  error?: boolean;
  errorMessage?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export type PersonaType = 'balanced' | 'academic' | 'technical' | 'concise';

export interface ChatSettings {
  temperature: number;
  persona: PersonaType;
  customInstruction?: string;
  enableNLPInspector?: boolean;
  streamResponses: boolean;
}
