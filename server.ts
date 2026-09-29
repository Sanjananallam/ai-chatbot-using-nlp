import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// English stop words for academic NLP preprocessing
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an',
  'and', 'any', 'are', "aren't", 'as', 'at', 'be', 'because', 'been',
  'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can',
  "can't", 'cannot', 'could', "couldn't", 'did', "didn't", 'do', 'does',
  "doesn't", 'doing', "don't", 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', "hadn't", 'has', "hasn't", 'have',
  "haven't", 'having', 'he', "he'd", "he'll", "he's", 'her', 'here',
  "here's", 'hers', 'herself', 'him', 'himself', 'his', 'how', "how's",
  'i', "i'd", "i'll", "i'm", "i've", 'if', 'in', 'into', 'is', "isn't",
  'it', "it's", 'its', 'itself', "let's", 'me', 'more', 'most',
  "mustn't", 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on',
  'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves',
  'out', 'over', 'own', 'same', "shan't", 'she', "she'd", "she'll",
  "she's", 'should', "shouldn't", 'so', 'some', 'such', 'than', 'that',
  "that's", 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', "there's", 'these', 'they', "they'd", "they'll", "they're",
  "they've", 'this', 'those', 'through', 'to', 'too', 'under', 'until',
  'up', 'very', 'was', "wasn't", 'we', "we'd", "we'll", "we're",
  "we've", 'were', "weren't", 'what', "what's", 'when', "when's",
  'where', "where's", 'which', 'while', 'who', "who's", 'whom', 'why',
  "why's", 'with', "won't", 'would', "wouldn't", 'you', "you'd",
  "you'll", "you're", "you've", 'your', 'yours', 'yourself', 'yourselves'
]);

// Coreference pronoun cues
const COREFERENCE_CUES = [
  'it',
  'its',
  'they',
  'them',
  'their',
  'this',
  'that',
  'these',
  'those',
  'the former',
  'the latter',
  'previous',
  'again',
];

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

/**
 * Existing TypeScript NLP analysis.
 * This is kept as a fallback and also keeps the existing
 * frontend NLP structure compatible.
 */
function analyzeQueryNLP(
  query: string,
  history: Array<{ role: 'user' | 'model'; text: string }> = []
): NLPAnalysisResult {
  const cleanStr = query.trim();
  const lower = cleanStr.toLowerCase();

  // 1. Text preprocessing & tokenization
  const rawTokens = cleanStr
    .split(/[\s,.;:!?()[\]{}"'\\/]+/)
    .filter(Boolean);

  const normalizedTokens = rawTokens.map((t) => t.toLowerCase());

  const filteredTokens = normalizedTokens.filter(
    (t) => !STOP_WORDS.has(t)
  );

  // Lexical diversity
  const uniqueTokens = new Set(normalizedTokens);

  const lexicalDiversity =
    normalizedTokens.length > 0
      ? Math.round(
          (uniqueTokens.size / normalizedTokens.length) * 100
        ) / 100
      : 1;

  // 2. Intent detection
  let intentName = 'general_qa';
  let intentLabel = 'General Question Answering';
  let intentCategory = 'Knowledge Query';
  let confidence = 0.85;

  const isGreeting =
    /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy)\b/i.test(
      lower
    );

  const isCodeQuery =
    /\b(code|python|javascript|typescript|java|c\+\+|html|css|function|class|algorithm|regex|bug|error|script|compile|syntax|loop|array|sql)\b/i.test(
      lower
    ) ||
    /^(write a program|create a function|debug|how to implement|show code)/i.test(
      lower
    );

  const isExplanation =
    /\b(explain|what is|how does|why does|define|meaning of|overview of|describe|tell me about|walk me through)\b/i.test(
      lower
    );

  const isComparison =
    /\b(difference between|compare|versus|vs|pros and cons|which is better|tradeoff)\b/i.test(
      lower
    );

  const isSummarization =
    /\b(summarize|summary|tldr|brief|in short|bullet points|key takeaways)\b/i.test(
      lower
    );

  const isTranslation =
    /\b(translate|in spanish|in french|in german|in hindi|in japanese|in chinese|how do you say)\b/i.test(
      lower
    );

  const isMathProblem =
    /\b(calculate|solve|derive|integral|derivative|formula|equation|proof|step by step)\b/i.test(
      lower
    ) || /[\d+\-*/^=]{3,}/.test(lower);

  const isCasual =
    /\b(thank you|thanks|who are you|what can you do|your name|tell a joke|are you human)\b/i.test(
      lower
    );

  // Coreference
  const foundPronouns = normalizedTokens.filter((t) =>
    COREFERENCE_CUES.includes(t)
  );

  const isFollowUpPattern =
    /^(and\b|what about\b|how about\b|why\b|how\b|give an example\b|explain more\b|continue\b|expand on that\b|now\b)/i.test(
      lower
    ) ||
    (foundPronouns.length > 0 &&
      history.length > 0 &&
      query.length < 50);

  if (isGreeting && query.length < 25) {
    intentName = 'casual_greeting';
    intentLabel = 'Conversational Greeting';
    intentCategory = 'Small Talk & Interaction';
    confidence = 0.98;
  } else if (isFollowUpPattern && history.length > 0) {
    intentName = 'contextual_follow_up';
    intentLabel = 'Contextual Follow-Up';
    intentCategory = 'Discourse & Anaphora';
    confidence = 0.94;
  } else if (isCodeQuery) {
    intentName = 'code_engineering';
    intentLabel = 'Programming & Code Generation';
    intentCategory = 'Software Development';
    confidence = 0.96;
  } else if (isComparison) {
    intentName = 'comparative_analysis';
    intentLabel = 'Comparative Analysis';
    intentCategory = 'Reasoning & Contrast';
    confidence = 0.92;
  } else if (isSummarization) {
    intentName = 'text_summarization';
    intentLabel = 'Information Summarization';
    intentCategory = 'Text Processing';
    confidence = 0.95;
  } else if (isTranslation) {
    intentName = 'language_translation';
    intentLabel = 'Multilingual Translation';
    intentCategory = 'Linguistics & Cross-Lingual';
    confidence = 0.97;
  } else if (isMathProblem) {
    intentName = 'analytical_problem_solving';
    intentLabel = 'Problem Solving & Mathematics';
    intentCategory = 'Quantitative Reasoning';
    confidence = 0.91;
  } else if (isExplanation) {
    intentName = 'concept_explanation';
    intentLabel = 'Conceptual Explanation';
    intentCategory = 'Education & Learning';
    confidence = 0.95;
  } else if (isCasual) {
    intentName = 'conversational_dialogue';
    intentLabel = 'Conversational Dialogue';
    intentCategory = 'Dialogue Management';
    confidence = 0.88;
  }

  // 3. Keywords
  const keywords = Array.from(
    new Set(filteredTokens.filter((t) => t.length > 2))
  ).slice(0, 8);

  // 4. Entity extraction
  const entityMatches =
    cleanStr.match(
      /\b([A-Z][a-z0-9]+(?:\s+[A-Z][a-z0-9]+)*)\b/g
    ) || [];

  const domainTerms =
    cleanStr.match(
      /\b(NLP|AI|ML|LLM|Python|React|JavaScript|API|SQL|REST|HTML|CSS|Git|Docker|AWS|Google|JSON|HTTP|BERT|GPT|Transformer|Neural Network)\b/gi
    ) || [];

  const detectedEntities = Array.from(
    new Set([
      ...entityMatches,
      ...domainTerms.map((d) => d.toUpperCase()),
    ])
  )
    .filter(
      (e) => !STOP_WORDS.has(e.toLowerCase()) && e.length > 1
    )
    .slice(0, 6);

  // 5. Coreference resolution
  let resolvedContext: string | null = null;

  const hasAnaphoricReference =
    foundPronouns.length > 0 || isFollowUpPattern;

  if (hasAnaphoricReference && history.length > 0) {
    const lastUserTurn = [...history]
      .reverse()
      .find((m) => m.role === 'user');

    const lastModelTurn = [...history]
      .reverse()
      .find((m) => m.role === 'model');

    if (lastUserTurn) {
      const prevTokens = lastUserTurn.text
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(
          (w) =>
            !STOP_WORDS.has(w.toLowerCase()) &&
            w.length > 2
        );

      if (prevTokens.length > 0) {
        resolvedContext = `Antecedent Topic: "${prevTokens
          .slice(0, 4)
          .join(' ')}" (Turn #${history.length})`;
      } else if (lastModelTurn) {
        resolvedContext = `Active Context from Assistant Turn #${history.length}`;
      }
    }
  }

  // 6. Sentiment
  let sentiment: NLPAnalysisResult['sentiment'] = 'Inquisitive';

  if (isCodeQuery) {
    sentiment = 'Technical';
  } else if (isCasual) {
    sentiment = 'Neutral';
  } else if (/urgent|asap|fast|quick|hurry/i.test(lower)) {
    sentiment = 'Urgent';
  } else if (/poem|story|creative|imagine|metaphor/i.test(lower)) {
    sentiment = 'Creative';
  }

  // 7. Complexity
  let complexity: NLPAnalysisResult['complexity'] = 'Basic';

  if (
    normalizedTokens.length > 30 ||
    detectedEntities.length >= 3
  ) {
    complexity = 'Advanced';
  } else if (
    normalizedTokens.length > 12 ||
    isCodeQuery ||
    isComparison
  ) {
    complexity = 'Intermediate';
  }

  return {
    tokens: rawTokens.slice(0, 20),
    filteredTokens: filteredTokens.slice(0, 15),
    normalizedText: lower,
    tokenCount: rawTokens.length,
    filteredTokenCount: filteredTokens.length,
    lexicalDiversity,
    primaryIntent: {
      name: intentName,
      label: intentLabel,
      confidence,
      category: intentCategory,
    },
    detectedEntities,
    keywords,
    coreference: {
      hasAnaphoricReference,
      referencedPronouns: Array.from(new Set(foundPronouns)),
      resolvedContext,
    },
    sentiment,
    complexity,
  };
}

/**
 * ============================================================
 * PYTHON NLP SERVICE CONNECTION
 * ============================================================
 *
 * Python Flask NLP service:
 * http://127.0.0.1:5001
 *
 * POST /process
 *
 * Request:
 * {
 *   "message": "Hello how are you?"
 * }
 */
async function analyzeWithPythonNLP(message: string) {
  try {
    const response = await fetch(
      'http://127.0.0.1:5001/process',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Python NLP service returned ${response.status}`
      );
    }

    const data = await response.json();

    console.log('=================================');
    console.log('PYTHON NLP RESULT');
    console.log(data);
    console.log('=================================');

    return data;
  } catch (error) {
    console.error(
      'Python NLP service error:',
      error
    );

    return null;
  }
}

/**
 * Combines the existing TypeScript NLP structure
 * with the Python NLP result.
 *
 * This prevents the existing React frontend from breaking.
 */
async function getCombinedNLP(
  message: string,
  history: Array<{ role: 'user' | 'model'; text: string }>
) {
  const localNLP = analyzeQueryNLP(
    message,
    history
  );

  const pythonNLP = await analyzeWithPythonNLP(
    message
  );

  return {
    ...localNLP,

    // Python NLP analysis
    pythonNLP,

    // Indicates which NLP service was contacted
    pythonNLPAvailable: pythonNLP !== null,
  };
}

const DEFAULT_SYSTEM_INSTRUCTION = `
You are a helpful, intelligent, and conversational AI assistant called "Instant AI".

Understand the user's intent and provide accurate, clear, and useful answers.

Maintain context throughout the conversation. If the user asks a follow-up question (e.g., using pronouns like "it", "they", "this", or elliptical phrases like "explain with an example", "why?"), resolve the reference using previous messages to understand what they mean.

Do not unnecessarily repeat information.

If you are uncertain, clearly state the uncertainty instead of inventing facts.

Format your responses using clean Markdown with appropriate headings, bullet points, numbered lists, tables, and formatted code blocks with language tags when relevant.

Be domain-independent and capable of handling queries across education, science, mathematics, technology, programming, business, finance, healthcare (general informational guidance only), travel, writing, translation, and everyday conversation.
`;

async function startServer() {
  const app = express();

  const PORT = process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check
  app.get(
    '/api/health',
    (_req: Request, res: Response) => {
      res.json({
        status: 'ok',
        hasApiKey: Boolean(
          process.env.GEMINI_API_KEY
        ),
        model: 'gemini-3.8-flash',
        pythonNLPService:
          'http://127.0.0.1:5001',
      });
    }
  );

  // ============================================================
  // PYTHON NLP HEALTH CHECK
  // ============================================================

  app.get(
    '/api/nlp/health',
    async (_req: Request, res: Response) => {
      try {
        const response = await fetch(
          'http://127.0.0.1:5001/health'
        );

        if (!response.ok) {
          res.status(503).json({
            status: 'error',
            message:
              'Python NLP service is not healthy.',
          });
          return;
        }

        const data = await response.json();

        res.json({
          status: 'ok',
          pythonNLP: data,
        });
      } catch (error: any) {
        res.status(503).json({
          status: 'error',
          message:
            'Python NLP service is not running.',
          details: error?.message,
        });
      }
    }
  );

  const CANDIDATE_MODELS = [
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];

  async function generateWithFallback(
    options: any
  ) {
    let lastError;

    for (const model of CANDIDATE_MODELS) {
      try {
        return await ai.models.generateContent({
          ...options,
          model,
        });
      } catch (err: any) {
        console.warn(
          `Model ${model} failed, trying next candidate:`,
          err?.message
        );

        lastError = err;
      }
    }

    throw lastError;
  }

  async function generateStreamWithFallback(
    options: any
  ) {
    let lastError;

    for (const model of CANDIDATE_MODELS) {
      try {
        return await ai.models.generateContentStream({
          ...options,
          model,
        });
      } catch (err: any) {
        console.warn(
          `Streaming model ${model} failed, trying next candidate:`,
          err?.message
        );

        lastError = err;
      }
    }

    throw lastError;
  }

  // ============================================================
  // NLP ANALYSIS ENDPOINT
  // ============================================================

  app.post(
    '/api/nlp/analyze',
    async (req: Request, res: Response) => {
      try {
        const { text, history } = req.body;

        if (
          !text ||
          typeof text !== 'string'
        ) {
          res.status(400).json({
            error: 'Text prompt is required.',
          });

          return;
        }

        const nlpResult =
          await getCombinedNLP(
            text,
            Array.isArray(history)
              ? history
              : []
          );

        res.json(nlpResult);
      } catch (err: any) {
        res.status(500).json({
          error:
            err.message ||
            'NLP analysis error.',
        });
      }
    }
  );

  // ============================================================
  // GENERATE CHAT TITLE
  // ============================================================

  app.post(
    '/api/title',
    async (req: Request, res: Response) => {
      try {
        const { prompt } = req.body;

        if (
          !prompt ||
          typeof prompt !== 'string'
        ) {
          res.json({
            title: 'New Conversation',
          });

          return;
        }

        if (!process.env.GEMINI_API_KEY) {
          const words = prompt
            .trim()
            .split(/\s+/)
            .slice(0, 4)
            .join(' ');

          res.json({
            title:
              words || 'New Conversation',
          });

          return;
        }

        const titleResponse =
          await generateWithFallback({
            contents: `
Generate a short, descriptive 2 to 5 word title for a chat conversation that begins with the user question:

"${prompt}"

Return ONLY the title text, with no quotes, markdown, or punctuation at the end.
`,
          });

        const titleText =
          titleResponse.text
            ?.trim()
            ?.replace(/^["']|["']$/g, '') ||
          '';

        res.json({
          title:
            titleText ||
            prompt.slice(0, 28),
        });
      } catch (err: any) {
        console.error(
          'Error generating title:',
          err
        );

        const fallbackTitle = (
          req.body?.prompt ||
          'New Conversation'
        ).slice(0, 28);

        res.json({
          title: fallbackTitle,
        });
      }
    }
  );

  // ============================================================
  // STREAMING CHAT
  // ============================================================

  app.post(
    '/api/chat/stream',
    async (req: Request, res: Response) => {
      const {
        message,
        history = [],
        systemInstruction,
        temperature = 0.7,
      } = req.body;

      if (
        !message ||
        typeof message !== 'string' ||
        !message.trim()
      ) {
        res.status(400).json({
          error: 'Message cannot be empty.',
        });

        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          error:
            'GEMINI_API_KEY is not configured on the server. Please ensure the API key is set in AI Studio Secrets.',
        });

        return;
      }

      // SSE headers
      res.setHeader(
        'Content-Type',
        'text/event-stream'
      );

      res.setHeader(
        'Cache-Control',
        'no-cache, no-transform'
      );

      res.setHeader(
        'Connection',
        'keep-alive'
      );

      res.flushHeaders?.();

      try {
        // ======================================================
        // 1. PYTHON + LOCAL NLP
        // ======================================================

        const nlpData =
          await getCombinedNLP(
            message,
            Array.isArray(history)
              ? history
              : []
          );

        console.log(
          'NLP data sent to frontend:',
          nlpData
        );

        // Send NLP result to React
        res.write(
          `event: nlp_analysis\ndata: ${JSON.stringify(
            nlpData
          )}\n\n`
        );

        // ======================================================
        // 2. PREPARE GEMINI HISTORY
        // ======================================================

        const contents = history.map(
          (
            item: {
              role: 'user' | 'model';
              text: string;
            }
          ) => ({
            role:
              item.role === 'user'
                ? 'user'
                : 'model',
            parts: [
              {
                text: item.text,
              },
            ],
          })
        );

        // Current user message
        contents.push({
          role: 'user',
          parts: [
            {
              text: message,
            },
          ],
        });

        // ======================================================
        // 3. SEND NLP INFORMATION TO GEMINI
        // ======================================================

        const pythonContext =
          nlpData.pythonNLP
            ? `

NLP ANALYSIS FROM PYTHON:

Intent: ${
                nlpData.pythonNLP.intent ||
                'unknown'
              }

Confidence: ${
                nlpData.pythonNLP.confidence ??
                'unknown'
              }

Processed Tokens: ${
                JSON.stringify(
                  nlpData.pythonNLP
                    .processed_tokens || []
                )
              }

Use this NLP information to better understand the user's intent, but do not mention the internal NLP pipeline unless the user asks about it.
`
            : '';

        const activeInstruction =
          (systemInstruction ||
            DEFAULT_SYSTEM_INSTRUCTION) +
          pythonContext;

        // ======================================================
        // 4. GEMINI GENERATES FINAL ANSWER
        // ======================================================

        const responseStream =
          await generateStreamWithFallback({
            contents,

            config: {
              systemInstruction:
                activeInstruction,

              temperature: Math.min(
                Math.max(
                  Number(temperature) ||
                    0.7,
                  0.1
                ),
                1.0
              ),
            },
          });

        // ======================================================
        // 5. STREAM GEMINI RESPONSE TO FRONTEND
        // ======================================================

        for await (
          const chunk of responseStream
        ) {
          const textChunk = chunk.text;

          if (textChunk) {
            res.write(
              `event: chunk\ndata: ${JSON.stringify(
                {
                  text: textChunk,
                }
              )}\n\n`
            );
          }
        }

        // Done
        res.write(
          `event: done\ndata: ${JSON.stringify(
            {
              success: true,
            }
          )}\n\n`
        );

        res.end();
      } catch (err: any) {
        console.error(
          'Error during chat streaming:',
          err
        );

        const errorMessage =
          err?.message ||
          'An error occurred while generating the response.';

        res.write(
          `event: error\ndata: ${JSON.stringify(
            {
              error: errorMessage,
            }
          )}\n\n`
        );

        res.end();
      }
    }
  );

  // ============================================================
  // NON-STREAMING CHAT
  // ============================================================

  app.post(
    '/api/chat',
    async (req: Request, res: Response) => {
      try {
        const {
          message,
          history = [],
          systemInstruction,
          temperature = 0.7,
        } = req.body;

        if (
          !message ||
          typeof message !== 'string' ||
          !message.trim()
        ) {
          res.status(400).json({
            error: 'Message cannot be empty.',
          });

          return;
        }

        if (!process.env.GEMINI_API_KEY) {
          res.status(500).json({
            error:
              'GEMINI_API_KEY is not configured on the server. Please ensure the API key is set in AI Studio Secrets.',
          });

          return;
        }

        // ======================================================
        // 1. PYTHON + LOCAL NLP
        // ======================================================

        const nlpData =
          await getCombinedNLP(
            message,
            Array.isArray(history)
              ? history
              : []
          );

        // ======================================================
        // 2. PREPARE GEMINI CONTENT
        // ======================================================

        const contents = history.map(
          (
            item: {
              role: 'user' | 'model';
              text: string;
            }
          ) => ({
            role:
              item.role === 'user'
                ? 'user'
                : 'model',
            parts: [
              {
                text: item.text,
              },
            ],
          })
        );

        contents.push({
          role: 'user',
          parts: [
            {
              text: message,
            },
          ],
        });

        // ======================================================
        // 3. SEND PYTHON NLP INFORMATION TO GEMINI
        // ======================================================

        const pythonContext =
          nlpData.pythonNLP
            ? `

NLP ANALYSIS FROM PYTHON:

Intent: ${
                nlpData.pythonNLP.intent ||
                'unknown'
              }

Confidence: ${
                nlpData.pythonNLP.confidence ??
                'unknown'
              }

Processed Tokens: ${
                JSON.stringify(
                  nlpData.pythonNLP
                    .processed_tokens || []
                )
              }

Use this information to better understand the user's request. Do not mention the internal NLP pipeline unless specifically asked.
`
            : '';

        const activeInstruction =
          (systemInstruction ||
            DEFAULT_SYSTEM_INSTRUCTION) +
          pythonContext;

        // ======================================================
        // 4. GEMINI FINAL ANSWER
        // ======================================================

        const response =
          await generateWithFallback({
            contents,

            config: {
              systemInstruction:
                activeInstruction,

              temperature: Math.min(
                Math.max(
                  Number(temperature) ||
                    0.7,
                  0.1
                ),
                1.0
              ),
            },
          });

        // ======================================================
        // 5. RETURN RESPONSE
        // ======================================================

        res.json({
          reply: response.text || '',
          nlp: nlpData,
        });
      } catch (err: any) {
        console.error(
          'Error in /api/chat:',
          err
        );

        res.status(500).json({
          error:
            err.message ||
            'Failed to generate response.',
        });
      }
    }
  );

  // ============================================================
  // VITE
  // ============================================================

  if (
    process.env.NODE_ENV ===
    'production'
  ) {
    app.use(
      express.static(
        path.resolve(
          __dirname,
          'dist'
        )
      )
    );

    app.get(
      '*',
      (
        _req: Request,
        res: Response
      ) => {
        res.sendFile(
          path.resolve(
            __dirname,
            'dist',
            'index.html'
          )
        );
      }
    );
  } else {
    const vite =
      await createViteServer({
        server: {
          middlewareMode: true,
        },
        appType: 'spa',
      });

    app.use(vite.middlewares);
  }

  // ============================================================
  // START SERVER
  // ============================================================

  app.listen(
    PORT,
    '0.0.0.0',
    () => {
      console.log(
        `Server is running at http://0.0.0.0:${PORT}`
      );
    }
  );
}

startServer().catch((err) => {
  console.error(
    'Failed to start server:',
    err
  );

  process.exit(1);
});