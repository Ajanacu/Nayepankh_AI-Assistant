"""
NayePankh AI Assistant — FastAPI Backend
Author: [Your Name]
Description: REST API backend with Gemini AI, SQLite storage, and conversational memory
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai
import sqlite3
import json
import os
from datetime import datetime
from dotenv import load_dotenv
import traceback

load_dotenv()
print(os.getenv("GEMINI_API_KEY"))
# ─── App Setup ────────────────────────────────────────────────────────────────
app = FastAPI(title="NayePankh AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://nayepankh-ai-assistant.vercel.app",
        "https://nayepankh-ai-assistant-git-main-ajanacus-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Gemini Config ────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")
else:
    model = None
    print("⚠️  GEMINI_API_KEY not set. AI responses will be unavailable.")

# ─── Knowledge Base ───────────────────────────────────────────────────────────
with open("../knowledge/nayepankh.json", "r") as f:
    KNOWLEDGE_BASE = json.load(f)

SYSTEM_PROMPT = f"""You are NayePankh AI Assistant — a helpful, warm, and professional AI for NayePankh Foundation, a UP Government registered NGO in India.

KNOWLEDGE BASE:
{json.dumps(KNOWLEDGE_BASE, indent=2)}

YOUR ROLE:
1. Answer questions about NayePankh Foundation using ONLY the knowledge base above
2. Guide users through volunteering and internship processes step by step (multi-turn)
3. Be conversational, professional, encouraging, and concise
4. Use markdown for formatting (bold, bullets, headers)

STRICT RULES:
- If information is not in the knowledge base, say: "I couldn't find reliable information for that question based on the available knowledge. Please visit nayepankh.com or contact contact@nayepankh.com"
- Never invent facts, statistics, names, or dates
- For internships: collect domain → student status → year → email → confirm
- For volunteering: collect area of interest → then provide guidance
- End helpful responses with a follow-up suggestion
"""

# ─── Database Setup ───────────────────────────────────────────────────────────
def init_db():
    conn = sqlite3.connect("nayepankh.db")
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            title TEXT,
            created_at TEXT,
            updated_at TEXT
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            role TEXT,
            content TEXT,
            timestamp TEXT,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
    """)
    conn.commit()
    conn.close()

init_db()

# ─── Pydantic Models ──────────────────────────────────────────────────────────
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    session_id: str
    message: str

class SaveRequest(BaseModel):
    session_id: str
    title: str
    messages: List[Message]

# ─── Helper: DB Operations ────────────────────────────────────────────────────
def db_conn():
    return sqlite3.connect("nayepankh.db")

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "service": "NayePankh AI API", "version": "1.0.0"}


@app.post("/chat")
async def chat(req: ChatRequest):
    """Main chat endpoint with conversational memory"""
    if not model:
        raise HTTPException(status_code=503, detail="AI service not configured. Set GEMINI_API_KEY.")
    
    try:
        # Build conversation history for Gemini
        conn = db_conn()
        c = conn.cursor()

        c.execute("""
        SELECT role, content
        FROM messages
        WHERE session_id=?
        ORDER BY id DESC
        LIMIT 10
        """, (req.session_id,))

        rows = c.fetchall()

        rows.reverse()  # oldest → newest

        history = []

        for role, content in rows:
            history.append({
                "role": "model" if role == "assistant" else "user",
                "parts": [content]
            })
        
        # Start chat with system context + history
        chat_session = model.start_chat(history=history)
        response = chat_session.send_message(req.message)
        ai_text = response.text
        
        # Persist to DB
        now = datetime.utcnow().isoformat()
        conn = db_conn()
        c = conn.cursor()
        
        # Upsert session
        c.execute("INSERT OR IGNORE INTO sessions VALUES (?, ?, ?, ?)",
                  (req.session_id, req.message[:40] + "...", now, now))
        c.execute("UPDATE sessions SET updated_at=? WHERE id=?", (now, req.session_id))
        
        # Save user message
        c.execute("INSERT INTO messages (session_id,role,content,timestamp) VALUES (?,?,?,?)",
                  (req.session_id, "user", req.message, now))
        # Save AI message
        c.execute("INSERT INTO messages (session_id,role,content,timestamp) VALUES (?,?,?,?)",
                  (req.session_id, "assistant", ai_text, now))
        
        conn.commit()
        conn.close()
        
        return {"response": ai_text, "session_id": req.session_id}
    
    except Exception as e:
        traceback.print_exc()
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/clear")
def clear_session(data: dict):
    """Clear all messages in a session"""
    session_id = data.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    conn = db_conn()
    c = conn.cursor()
    c.execute("DELETE FROM messages WHERE session_id=?", (session_id,))
    conn.commit()
    conn.close()
    return {"status": "cleared", "session_id": session_id}


@app.get("/history")
def get_history(session_id: Optional[str] = None):
    """Get all sessions or messages for a specific session"""
    conn = db_conn()
    c = conn.cursor()
    
    if session_id:
        c.execute("SELECT role, content, timestamp FROM messages WHERE session_id=? ORDER BY id",
                  (session_id,))
        rows = c.fetchall()
        conn.close()
        return {"session_id": session_id, "messages": [
            {"role": r[0], "content": r[1], "timestamp": r[2]} for r in rows
        ]}
    else:
        c.execute("SELECT id, title, created_at, updated_at FROM sessions ORDER BY updated_at DESC LIMIT 20")
        rows = c.fetchall()
        conn.close()
        return {"sessions": [
            {"id": r[0], "title": r[1], "created_at": r[2], "updated_at": r[3]} for r in rows
        ]}


@app.post("/save")
def save_session(req: SaveRequest):
    """Save/update a named session"""
    now = datetime.utcnow().isoformat()
    conn = db_conn()
    c = conn.cursor()
    c.execute("INSERT OR REPLACE INTO sessions VALUES (?,?,?,?)",
              (req.session_id, req.title, now, now))
    c.execute("DELETE FROM messages WHERE session_id=?", (req.session_id,))
    for msg in req.messages:
        c.execute("INSERT INTO messages (session_id,role,content,timestamp) VALUES (?,?,?,?)",
                  (req.session_id, msg.role, msg.content, now))
    conn.commit()
    conn.close()
    return {"status": "saved", "session_id": req.session_id}


@app.get("/knowledge")
def get_knowledge():
    """Return the full knowledge base"""
    return KNOWLEDGE_BASE


# ─── Run ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
