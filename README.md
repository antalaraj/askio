# AskAnything – AI Chat Assistant

**AskAnything** is a modern, lightweight, and responsive AI chat application that enables users to communicate with an intelligent AI assistant powered by the **Groq API** and state-of-the-art Llama models.

Built with a **React.js + Vite** frontend styled with **Tailwind CSS**, and backed by a robust **Python Flask** API, AskAnything delivers instantaneous, context-aware responses with full conversation persistence and comprehensive error handling.

---

## 🌟 Key Features

1. **Intelligent Conversational AI**:
   - Direct integration with the high-speed Groq API.
   - Dynamic model support via `GROQ_MODEL` (default: `llama-3.3-70b-versatile` or `llama-3.1-8b-instant`).
   - Context-aware conversation history management with token-safe truncation.

2. **Full Local Persistence**:
   - Conversation history is automatically saved to browser `localStorage`.
   - Messages remain intact across browser refreshes and tab closures.
   - Self-healing storage parser that filters corrupted payloads and temporary states.
   - One-click **New Chat** button to cleanly reset the conversation.

3. **Robust Loading & Error Handling**:
   - Animated typing indicator (`AskAnything is thinking...`).
   - Granular status handling: Groq rate limits (429), authentication/key errors (401/500), API timeouts (504), network disconnects (503), and input validation (400).
   - One-click **Retry** functionality for failed requests without duplicating user messages.

4. **Premium SaaS UI/UX Design**:
   - Clean, minimal, professional aesthetic with Plus Jakarta Sans typography.
   - Distinct message bubbles: user messages in vibrant blue on the right, assistant responses in crisp white cards with subtle borders on the left.
   - Welcome screen with clickable prompt suggestions:
     - *"Explain artificial intelligence in simple terms."*
     - *"Give me five productive habits for students."*
     - *"Write a professional email for a job application."*
   - Copy-to-clipboard button with visual feedback for AI responses.
   - Formatted timestamps for every message.
   - Expanding multiline composer: `Enter` to send, `Shift + Enter` for new lines.

5. **100% Responsive Design**:
   - Flawless experience across mobile (375px+), tablet (768px+), and wide desktop (1440px+) viewports.
   - Sticky header and bottom composer with mobile keyboard accommodation.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React.js 18
- **Bundler & Dev Server**: Vite 6
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons**: Lucide React
- **Typography**: Plus Jakarta Sans (Google Fonts)
- **API Client**: Native Fetch API with `AbortController` timeouts

### Backend
- **Runtime**: Python 3.11+
- **Web Framework**: Flask 3
- **CORS Management**: Flask-CORS
- **AI Provider**: Official Groq Python SDK (`groq`)
- **Configuration**: `python-dotenv`
- **WSGI Production Server**: Gunicorn

---

## 🏛️ Project Architecture

```
askanything/
│
├── frontend/
│   ├── public/
│   │   └── logo.svg
│   ├── src/
│   │   ├── assets/
│   │   │   └── logo.svg
│   │   ├── components/
│   │   │   ├── ChatHeader.jsx       # Sticky header with status & New Chat button
│   │   │   ├── ChatMessage.jsx      # Message bubble with avatars & copy action
│   │   │   ├── ChatInput.jsx        # Multiline auto-expanding message composer
│   │   │   ├── TypingIndicator.jsx  # Animated 3-dot thinking state
│   │   │   ├── WelcomeScreen.jsx    # Hero welcome state & suggested prompts
│   │   │   └── ErrorMessage.jsx     # Alert banner with Retry and Dismiss buttons
│   │   ├── hooks/
│   │   │   └── useChat.js           # State, API orchestration, and persistence hook
│   │   ├── services/
│   │   │   └── chatService.js       # Fetch client, timeout handling, error normalization
│   │   ├── utils/
│   │   │   └── storage.js           # LocalStorage CRUD and validation utility
│   │   ├── App.jsx                  # Root UI composition & auto-scrolling
│   │   ├── main.jsx                 # React root entry
│   │   └── index.css                # Tailwind CSS v4 setup & custom animations
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app.py                       # Flask application routes (/api/health, /api/chat)
│   ├── requirements.txt             # Pinned backend dependencies
│   ├── .env.example
│   ├── services/
│   │   ├── __init__.py
│   │   └── groq_service.py          # Groq SDK integration, prompt & history sanitation
│   └── tests/
│       └── test_api.py              # Unit & mock test suite
│
├── .gitignore
├── README.md
└── render.yaml                      # Render Blueprint specification
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default / Example |
|---|---|---|
| `GROQ_API_KEY` | Your official API key from [console.groq.com](https://console.groq.com) | `gsk_...` |
| `GROQ_MODEL` | Supported Groq Llama model identifier | `llama-3.3-70b-versatile` |
| `PORT` | Local server port | `5000` |
| `FRONTEND_URL` | Allowed CORS origin (comma-separated or `*`) | `http://localhost:5173` |

### Frontend (`frontend/.env`)
| Variable | Description | Default / Example |
|---|---|---|
| `VITE_API_URL` | Base URL of the Flask backend API | `http://localhost:5000` |

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js** (v18 or newer) & **npm**
- **Python** (v3.11 or newer)
- A free **Groq Cloud API Key** from [console.groq.com](https://console.groq.com)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/askanything.git
cd askanything
```

---

### Step 2: Backend Setup
1. Navigate into the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   - On Windows:
     ```powershell
     python -m venv venv
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create your local `.env` file:
   ```bash
   cp .env.example .env
   ```
   Add your `GROQ_API_KEY`:
   ```env
   GROQ_API_KEY=gsk_your_actual_groq_api_key
   GROQ_MODEL=llama-3.3-70b-versatile
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   ```
5. Run the backend server:
   ```bash
   python app.py
   ```
   The API will be available at `http://localhost:5000`. You can verify by visiting `http://localhost:5000/api/health`.

---

### Step 3: Frontend Setup
1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Create your local `.env` file:
   ```bash
   cp .env.example .env
   ```
   Ensure it points to the Flask backend:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`.

---

## 🧪 Testing & Verification

### Backend Automated Tests
Execute the unit and mock test suite:
```bash
cd backend
python -m unittest tests/test_api.py
```
This tests:
- `GET /api/health` status and schema.
- Rejection of malformed / non-JSON requests.
- Rejection of empty messages and invalid roles.
- Context truncation and system prompt injection.
- Handling of missing `GROQ_API_KEY`.
- Groq completion generation using mocks.

### Frontend Production Build
Validate that the production bundle builds without errors:
```bash
cd frontend
npm run build
```

---

## ☁️ Deployment Guide (Render)

This repository includes a pre-configured `render.yaml` Blueprint for seamless zero-downtime deployment on Render.

### Option A: Using the Render Blueprint (Recommended)
1. Push this repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** → **Blueprint**.
3. Connect your GitHub repository. Render will automatically detect `render.yaml` and configure:
   - **`askanything-backend`**: Python Web Service running Gunicorn.
   - **`askanything-frontend`**: Static Site hosting the built React app.
4. Set the `GROQ_API_KEY` environment variable in the `askanything-backend` service settings.
5. Deploy!

### Option B: Manual Setup on Render

#### 1. Backend Web Service
- **Environment**: Python
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app:app`
- **Environment Variables**:
  - `PYTHON_VERSION`: `3.11.9`
  - `GROQ_API_KEY`: *(Your Groq API Key)*
  - `GROQ_MODEL`: `llama-3.3-70b-versatile`
  - `FRONTEND_URL`: `https://your-frontend-service.onrender.com` (or `*`)

#### 2. Frontend Static Site
- **Environment**: Static Site
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: `https://your-backend-service.onrender.com`

---

## 🛡️ Security & Best Practices

- **API Key Protection**: `GROQ_API_KEY` is exclusively handled on the backend server and never exposed to the client browser.
- **CORS Configuration**: Restricts API calls to approved frontend origins.
- **Payload Sanitization**: User inputs are sanitized, capped in length, and restricted to valid roles (`system`, `user`, `assistant`).
- **Context Truncation**: Safeguards against exceeding token limits and malicious context inflation.
- **Safe Persistence**: Local storage only saves clean conversation turns and never stores sensitive secrets or failed states.

---

## 📄 License
MIT License. Created for the AskAnything – AI Chat Assistant assessment.
