import { NLPAnalysisResult } from '../types/chat';

export interface StreamChatParams {
  message: string;
  history: Array<{ role: 'user' | 'model'; text: string }>;
  systemInstruction?: string;
  temperature?: number;
  onNLPAnalysis?: (nlp: NLPAnalysisResult) => void;
  onChunk: (chunk: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}

export async function sendChatMessageStream(params: {
  message: string;
  history: Array<{ role: 'user' | 'model'; text: string }>;
  systemInstruction?: string;
  temperature?: number;
  onNLPAnalysis?: (nlp: NLPAnalysisResult) => void;
  onChunk: (chunk: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}): Promise<void> {
  const {
    message,
    history,
    systemInstruction,
    temperature = 0.7,
    onNLPAnalysis,
    onChunk,
    onError,
    onDone,
    signal,
  } = params;

  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history,
        systemInstruction,
        temperature,
      }),
      signal,
    });

    if (!response.ok) {
      let errMsg = `Server returned status ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson?.error) errMsg = errJson.error;
      } catch {
        // ignore
      }
      onError(errMsg);
      return;
    }

    if (!response.body) {
      onError('No response stream available from server.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        const eventMatch = line.match(/^event:\s*(.+)$/m);
        const dataMatch = line.match(/^data:\s*(.+)$/m);

        const eventType = eventMatch ? eventMatch[1].trim() : 'message';
        const dataStr = dataMatch ? dataMatch[1].trim() : '';

        if (!dataStr) continue;

        try {
          const parsed = JSON.parse(dataStr);
          if (eventType === 'nlp_analysis' && onNLPAnalysis) {
            onNLPAnalysis(parsed as NLPAnalysisResult);
          } else if (eventType === 'chunk' && parsed.text) {
            onChunk(parsed.text);
          } else if (eventType === 'error') {
            onError(parsed.error || 'Unknown server error');
            return;
          } else if (eventType === 'done') {
            // completion
          }
        } catch {
          // If non-JSON text chunk fallback
          if (eventType === 'chunk') {
            onChunk(dataStr);
          }
        }
      }
    }

    onDone();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      onDone();
      return;
    }
    console.error('Stream request error:', err);
    onError(err.message || 'Failed to connect to the AI server.');
  }
}

export async function sendChatMessageFallback(params: {
  message: string;
  history: Array<{ role: 'user' | 'model'; text: string }>;
  systemInstruction?: string;
  temperature?: number;
}): Promise<{ reply: string; nlp: NLPAnalysisResult }> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: Failed to get response`);
  }

  return await response.json();
}

export async function generateChatTitle(prompt: string): Promise<string> {
  try {
    const response = await fetch('/api/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) throw new Error('Title generation failed');
    const data = await response.json();
    return data.title || 'New Chat';
  } catch {
    const words = prompt.trim().split(/\s+/).slice(0, 4).join(' ');
    return words || 'New Chat';
  }
}

export async function checkServerHealth(): Promise<{
  status: string;
  hasApiKey: boolean;
  model: string;
}> {
  try {
    const response = await fetch('/api/health');
    return await response.json();
  } catch {
    return { status: 'offline', hasApiKey: false, model: 'unknown' };
  }
}
