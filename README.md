# 🕊️ NayePankh AI Assistant

> A production-quality AI-powered chatbot for [NayePankh Foundation](https://nayepankh.com/) — a UP Government registered NGO helping underprivileged communities across India.

Built with React + Vite + FastAPI + Gemini AI. Designed to answer questions about the foundation, guide users through internship and volunteering processes, and serve as a digital first point of contact.

---

## ✨ Features

### Core Chat
- 🤖 **AI-powered responses** using Google Gemini (swappable to OpenAI/Anthropic)
- 💬 **ChatGPT-like interface** — clean, modern, responsive
- 📝 **Markdown support** — bold, bullets, headers, code blocks
- 💻 **Code block syntax highlighting**
- ⌨️ **Typing animation** while AI responds
- 🔄 **Regenerate response** button
- ⏹️ **Stop generation** button
- 🧠 **Conversational memory** — context maintained across turns

### Smart Workflows
- 🎯 **Multi-step internship flow** — domain → student status → year → email → confirm
- 🤝 **Volunteering guidance** — interest → tailored next steps
- 🛡️ **Fallback handling** — never hallucinates; redirects to official website

### UI/UX
- 🌙 **Dark mode toggle**
- 📱 **Fully responsive** — mobile, tablet, desktop
- 📜 **Chat history** in sidebar — click to reopen
- 💡 **Suggested prompts** on welcome screen
- 🔗 **Quick links** (About, Volunteer, Internship, Donate, Contact)
- 📋 **Copy response** button on each message
- 📋 **Copy entire conversation**
- 💾 **Export chat as .txt file**
- 🔢 **Character counter** in input
- ⌨️ **Enter to send, Shift+Enter for new line**
- 🔄 **Auto-scroll** to latest message

### Backend
- 🚀 **FastAPI** with full REST API
- 🗄️ **SQLite** for session and message storage
- 📚 **Structured knowledge base** (JSON)
- 🔌 **LLM-agnostic architecture** — swap Gemini for any LLM in minutes

---

## 🗂️ Project Structure

```
nayepankh-ai/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx           # Main app component
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── backend/
│   ├── main.py               # FastAPI app (all endpoints)
│   └── requirements.txt
├── knowledge/
│   └── nayepankh.json        # Structured knowledge base
├── .env.example              # Environment variables template
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Icons | React Icons |
| Markdown | react-markdown + remark-gfm |
| Syntax | react-syntax-highlighter |
| Backend | FastAPI (Python) |
| AI | Google Gemini 1.5 Flash |
| Database | SQLite |
| HTTP | Axios |

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- A Google Gemini API key (free tier available)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/nayepankh-ai.git
cd nayepankh-ai
```

### 2. Environment Variables
```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 3. Run the Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Backend runs at: `http://localhost:8000`

### 4. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/chat` | Send a message, get AI response |
| `POST` | `/clear` | Clear a session's messages |
| `GET` | `/history` | Get all sessions or a session's messages |
| `POST` | `/save` | Save/update a named session |
| `GET` | `/knowledge` | Return the full knowledge base |

### Example: POST /chat
```json
{
  "session_id": "uuid-here",
  "message": "I want to apply for an internship",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help?" }
  ]
}
```

---

## 🔄 Swapping the AI Provider

The backend is designed to make LLM swapping trivial. In `backend/main.py`:

```python
# Current: Google Gemini
import google.generativeai as genai
model = genai.GenerativeModel("gemini-1.5-flash")

# To switch to OpenAI:
# from openai import OpenAI
# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
# response = client.chat.completions.create(model="gpt-4o-mini", messages=[...])

# To switch to Anthropic Claude:
# import anthropic
# client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
```

---

## 📸 Screenshots

_Add screenshots of your running application here_

---

## 🌐 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy the dist/ folder to Vercel
```

### Backend (Railway / Render)
```bash
# Add GEMINI_API_KEY as environment variable
# Deploy backend/ directory
# Update VITE_API_URL in frontend/.env to point to deployed backend
```

---

## 👨‍💻 Author

Built for NayePankh Foundation as a portfolio project demonstrating:
- Full-stack AI application development
- FastAPI backend architecture
- Modern React patterns (hooks, state management)
- LLM integration and prompt engineering
- Production UI/UX design

---

## 📄 License

MIT License — feel free to use and adapt for educational and NGO purposes.

---

> *"If we all do something, then together there is no problem that we cannot solve!"*  
> — Prashant Shukla, Founder & President, NayePankh Foundation
