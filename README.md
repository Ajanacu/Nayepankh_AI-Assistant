# NayePankh AI Assistant

> An AI-powered chatbot built for **NayePankh Foundation** to help users quickly access information about the organization, internships, volunteering opportunities, donations, and contact details through a simple conversational interface.

Built using **React + Vite + FastAPI + Google Gemini AI**.

## Live Demo

**🌐 https://nayepankh-ai-assistant.vercel.app**

---



# Features

## AI Chat Assistant

* AI-powered responses using **Google Gemini**
* Answers questions about NayePankh Foundation
* Provides information on internships and volunteering
* Markdown formatted responses
* ChatGPT-inspired interface
* Typing indicator while generating responses

---

## Chat Experience

* Multiple chat sessions
* Chat history sidebar
* Suggested prompts for quick access
* Copy individual responses
* Copy entire conversation
* Export conversation as a text file
* Regenerate response option
* Character counter
* Auto-scroll to latest message
* Enter to send and Shift+Enter for a new line

---

## User Interface

* Responsive design
* Mobile and desktop friendly
* Dark mode support
* Modern clean interface
* Quick navigation buttons

---

## Backend

* FastAPI REST API
* Google Gemini integration
* SQLite database for storing chat sessions
* Environment variable support for API keys

---

# Tech Stack

| Layer       | Technology                  |
| ----------- | --------------------------- |
| Frontend    | React 18 + Vite             |
| Styling     | Tailwind CSS                |
| Backend     | FastAPI                     |
| AI          | Google Gemini               |
| Database    | SQLite                      |
| HTTP Client | Axios                       |
| Icons       | React Icons                 |
| Markdown    | react-markdown              |


---

# Project Structure

```text
Nayepankh_AI-Assistant/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── main.py
│   └── requirements.txt
│
├── knowledge/
│   └── nayepankh.json
│
└── README.md
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/Ajanacu/Nayepankh_AI-Assistant.git

cd Nayepankh_AI-Assistant
```

## Backend

```bash
cd backend

python -m venv venv

# Linux/macOS
source venv/bin/activate

# Windows
# venv\Scripts\activate

pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

Backend runs at:

```
http://localhost:8000
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

## Environment Variables

### Backend (.env)

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
```

For deployment, replace it with your backend URL:

```env
VITE_API_URL=https://your-backend.onrender.com
```

---

# API Endpoints

| Method | Endpoint   | Description                        |
| ------ | ---------- | ---------------------------------- |
| GET    | `/`        | Health check                       |
| POST   | `/chat`    | Send a message to the AI assistant |
| GET    | `/history` | Retrieve chat history              |
| POST   | `/clear`   | Clear a chat session               |
| POST   | `/save`    | Save a chat session                |

Example:

```json
{
  "session_id": "12345",
  "message": "How can I volunteer?"
}
```

---

# Deployment

### Frontend

* Vercel

### Backend

* Render

Remember to configure:

```env
VITE_API_URL=https://your-backend.onrender.com
```

and

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

---

# Author

**Ajana C U**

B.Tech Computer Science Engineering

Interested in Artificial Intelligence, Machine Learning, and Full-Stack Development.

---

## Project Goals

This project demonstrates:

* Full-stack web development
* AI API integration
* FastAPI backend development
* React frontend development
* REST API communication
* Database integration with SQLite
* Responsive UI design

---

