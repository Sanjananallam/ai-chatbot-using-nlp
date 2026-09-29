# 🤖 AI Chatbot Using NLP

An AI-powered conversational chatbot built with Natural Language Processing (NLP) and Google's Gemini AI. The application provides a modern ChatGPT-style interface for interacting with an intelligent conversational assistant.

## 📌 Project Overview

The **AI Chatbot Using NLP** project is designed to provide users with an interactive conversational experience through a web-based chatbot.

The system combines a modern React-based frontend with a backend API and Gemini AI to process user messages and generate relevant responses.

## ✨ Features

- 💬 Interactive chatbot interface
- 🤖 AI-powered conversational responses
- 🧠 Natural Language Processing
- ⚡ Real-time message interaction
- 📝 Chat history management
- 🎨 Modern and responsive user interface
- ⚙️ Settings and chat controls
- 🔐 Secure API key configuration using environment variables
- 📱 Responsive design for different screen sizes

## 🛠️ Technologies Used

### Frontend
- React
- TypeScript
- Vite
- CSS

### Backend
- Node.js
- TypeScript
- Express/server-side API

### AI & NLP
- Google Gemini API
- Natural Language Processing
- AI-based response generation

### Development Tools
- Git
- GitHub
- VS Code
- npm

## 🏗️ Project Structure

```text
ai-chatbot-using-nlp/
│
├── src/
│   ├── components/
│   │   ├── AboutModal.tsx
│   │   ├── ChatHeader.tsx
│   │   ├── ChatInput.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TypingIndicator.tsx
│   │   └── WelcomeView.tsx
│   │
│   ├── services/
│   │   ├── api.ts
│   │   └── storage.ts
│   │
│   ├── types/
│   │   └── chat.ts
│   │
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── server.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
└── .gitignore
