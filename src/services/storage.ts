import { Conversation, ChatSettings, Message } from '../types/chat';

const STORAGE_KEY_CONVERSATIONS = 'ai_nlp_chatbot_conversations';
const STORAGE_KEY_ACTIVE_ID = 'ai_nlp_chatbot_active_id';
const STORAGE_KEY_SETTINGS = 'ai_nlp_chatbot_settings';

export const DEFAULT_SETTINGS: ChatSettings = {
  temperature: 0.7,
  persona: 'balanced',
  enableNLPInspector: true,
  streamResponses: true,
};

// Seed conversation illustrating NLP Context Memory & Follow-up understanding as required in brief
export const INITIAL_DEMO_CONVERSATION: Conversation = {
  id: 'demo-conversation-nlp-1',
  title: 'Machine Learning & Example',
  createdAt: Date.now() - 1000 * 60 * 30, // 30 mins ago
  updatedAt: Date.now() - 1000 * 60 * 25,
  messages: [
    {
      id: 'demo-msg-1',
      role: 'user',
      content: 'What is machine learning?',
      timestamp: Date.now() - 1000 * 60 * 30,
      nlpAnalysis: {
        tokens: ['What', 'is', 'machine', 'learning'],
        filteredTokens: ['machine', 'learning'],
        normalizedText: 'what is machine learning?',
        tokenCount: 4,
        filteredTokenCount: 2,
        lexicalDiversity: 1,
        primaryIntent: {
          name: 'concept_explanation',
          label: 'Conceptual Explanation',
          confidence: 0.98,
          category: 'Education & Learning',
        },
        detectedEntities: ['Machine Learning', 'AI'],
        keywords: ['machine', 'learning'],
        coreference: {
          hasAnaphoricReference: false,
          referencedPronouns: [],
          resolvedContext: null,
        },
        sentiment: 'Inquisitive',
        complexity: 'Basic',
      },
    },
    {
      id: 'demo-msg-2',
      role: 'model',
      content: `**Machine Learning (ML)** is a subset of Artificial Intelligence (AI) that enables computational systems to learn patterns from historical data and make accurate decisions or predictions without being explicitly programmed with deterministic rules.

### Key Pillars of Machine Learning:
1. **Supervised Learning**: Learning from labeled datasets (e.g., predicting house prices, email spam detection).
2. **Unsupervised Learning**: Discovering hidden patterns or groupings in unlabeled data (e.g., customer segmentation via clustering).
3. **Reinforcement Learning**: An agent learns optimal actions through trial, error, rewards, and penalties (e.g., robotics, game playing).

Through statistical algorithms and iterative optimization, machine learning models continuously refine their parameters as they ingest more data.`,
      timestamp: Date.now() - 1000 * 60 * 29,
    },
    {
      id: 'demo-msg-3',
      role: 'user',
      content: 'Explain it with an example.',
      timestamp: Date.now() - 1000 * 60 * 26,
      nlpAnalysis: {
        tokens: ['Explain', 'it', 'with', 'an', 'example'],
        filteredTokens: ['explain', 'example'],
        normalizedText: 'explain it with an example.',
        tokenCount: 5,
        filteredTokenCount: 2,
        lexicalDiversity: 1,
        primaryIntent: {
          name: 'contextual_follow_up',
          label: 'Contextual Follow-Up',
          confidence: 0.96,
          category: 'Discourse & Anaphora',
        },
        detectedEntities: ['ML Context'],
        keywords: ['explain', 'example'],
        coreference: {
          hasAnaphoricReference: true,
          referencedPronouns: ['it'],
          resolvedContext: 'Antecedent: "Machine Learning" (Turn #1)',
        },
        sentiment: 'Inquisitive',
        complexity: 'Intermediate',
      },
    },
    {
      id: 'demo-msg-4',
      role: 'model',
      content: `By maintaining our conversational context, I understand that **"it"** refers to **Machine Learning**. Here is a clear, real-world example: **Email Spam Filtering**.

---

### The Real-World Scenario: Email Spam Classifier

#### 1. Traditional Programming (Rule-Based):
In a rule-based system, a developer manually writes thousands of rigid rules:
\`\`\`python
# Rigid Rule-Based Approach
if "win $1,000,000" in email.body or "urgent transfer" in email.body:
    mark_as_spam()
\`\`\`
*Limitation*: Spammers easily bypass this by changing spelling to *"win $1,000,00O"* or using novel phrasing.

---

#### 2. The Machine Learning Approach:
Instead of manual rules, we feed an ML algorithm (like a Naive Bayes or Logistic Regression classifier) 100,000 historical emails labeled as either \`Spam\` or \`Not Spam\`.

* **Feature Extraction & NLP**: The algorithm tokenizes text, calculates word frequency, and identifies patterns (e.g., senders with low reputation score, mismatched header domains, excessive exclamation marks).
* **Pattern Learning**: It learns probabilities:
  $$\\text{If email contains ["claim", "free", "lottery"]} \\implies 99.4\\% \\text{ probability of Spam}$$
* **Generalization**: When a brand new email arrives tomorrow with slightly varied wording, the model still accurately identifies it as spam based on weighted probabilistic patterns, not rigid keywords!`,
      timestamp: Date.now() - 1000 * 60 * 25,
    },
  ],
};

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
    if (!raw) {
      // Seed with initial demo conversation for great first impression
      saveConversations([INITIAL_DEMO_CONVERSATION]);
      return [INITIAL_DEMO_CONVERSATION];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [INITIAL_DEMO_CONVERSATION];
  } catch (err) {
    console.error('Failed to load conversations from storage:', err);
    return [INITIAL_DEMO_CONVERSATION];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
  } catch (err) {
    console.error('Failed to save conversations to storage:', err);
  }
}

export function loadActiveConversationId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_ID) || null;
  } catch {
    return null;
  }
}

export function saveActiveConversationId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
    }
  } catch (err) {
    console.error('Failed to save active conversation id:', err);
  }
}

export function loadSettings(): ChatSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: ChatSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to storage:', err);
  }
}
