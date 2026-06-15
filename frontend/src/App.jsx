/**
 * NayePankh AI Assistant — Main App Component
 * A production-quality ChatGPT-like interface for NayePankh Foundation
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { v4 as uuidv4 } from 'uuid'
import {
  FiSend, FiPlus, FiTrash2, FiCopy, FiDownload, FiRefreshCw,
  FiSquare, FiMenu, FiSun, FiMoon, FiMessageSquare, FiExternalLink
} from 'react-icons/fi'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const MAX_CHARS = 2000

// ─── Knowledge Base (fallback if API unavailable) ─────────────────────────────
import knowledgeBase from '../../knowledge/nayepankh.json'

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are NayePankh AI Assistant — a helpful, warm, and professional conversational AI for NayePankh Foundation, a UP Government registered NGO in India.

KNOWLEDGE BASE:
${JSON.stringify(knowledgeBase, null, 2)}

YOUR ROLE:
1. Answer questions about NayePankh Foundation using the knowledge base
2. Guide users through volunteering and internship processes step by step
3. Be conversational, professional, and encouraging
4. Use markdown for readable formatting

RULES:
- If you don't know something, say: "I couldn't find reliable information for that. Please visit nayepankh.com or contact contact@nayepankh.com"
- Never hallucinate facts
- For internship flow: collect domain → student/graduate → year (if student) → email → confirm
- For volunteer flow: collect interest area → provide guidance
- End helpful responses with a follow-up suggestion`

// ─── Suggested Chips ─────────────────────────────────────────────────────────
const SUGGESTED = [
  { icon: '🤝', title: 'How can I volunteer?', desc: 'Learn about opportunities', msg: 'How can I volunteer with NayePankh Foundation?' },
  { icon: '💼', title: 'Tell me about internships', desc: 'Domains, duration & process', msg: 'Tell me about internship programs at NayePankh' },
  { icon: '❤️', title: 'How can I donate?', desc: 'Ways to contribute', msg: 'How can I donate to NayePankh Foundation?' },
  { icon: '📞', title: 'Contact details', desc: 'Email, phone & social', msg: 'What are NayePankh contact details?' },
  { icon: '🌱', title: 'What does NayePankh do?', desc: 'Programs, mission & impact', msg: 'What programs and initiatives does NayePankh run?' },
  { icon: '📅', title: 'Upcoming events', desc: 'Drives & campaigns', msg: 'Are there any upcoming events by NayePankh?' },
]

const QUICK_LINKS = [
  { label: '🏛️ About NayePankh', msg: 'Tell me about NayePankh Foundation' },
  { label: '🤝 Volunteer', msg: 'I want to volunteer with NayePankh' },
  { label: '💼 Internship', msg: 'How can I apply for an internship?' },
  { label: '❤️ Donate', msg: 'How can I donate to NayePankh?' },
  { label: '📞 Contact', msg: 'What are the contact details for NayePankh?' },
]

// ─── Markdown Renderer ────────────────────────────────────────────────────────
function MarkdownContent({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          return !inline && match ? (
            <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" {...props}>
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className="bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
              {children}
            </code>
          )
        },
        a({ href, children }) {
          return <a href={href} target="_blank" rel="noreferrer" className="text-emerald-600 underline hover:text-emerald-800">{children}</a>
        }
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sessions, setSessions] = useState(() => JSON.parse(localStorage.getItem('np_sessions') || '[]'))
  const [activeSession, setActiveSession] = useState(() => uuidv4())
  const [copiedId, setCopiedId] = useState(null)
  const [charCount, setCharCount] = useState(0)
  const abortRef = useRef(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // ─── Dark Mode ──────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // ─── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ─── Save sessions to localStorage ──────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('np_sessions', JSON.stringify(sessions))
  }, [sessions])

  // ─── Send Message ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setCharCount(0)

    const userMsg = { id: uuidv4(), role: 'user', content: msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    // Update session title
    if (messages.length === 0) {
      const newSession = { id: activeSession, title: msg.slice(0, 40), msgs: [], time: new Date().toISOString() }
      setSessions(prev => [newSession, ...prev.slice(0, 19)])
    }

    try {
      // Build history for API
      const response = await axios.post(`${API_BASE}/chat`, {
        session_id: activeSession,
        message: msg
      })

      const aiText = response.data.response
      const aiMsg = { id: uuidv4(), role: 'ai', content: aiText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      const finalMessages = [...newMessages, aiMsg]
      setMessages(finalMessages)

      // Persist session
      setSessions(prev => prev.map(s => s.id === activeSession ? { ...s, msgs: finalMessages } : s))
    } catch (err) {
      if (err.name !== 'CanceledError') {
        const errMsg = { id: uuidv4(), role: 'ai', content: "I'm having trouble connecting right now. Please try again, or visit [nayepankh.com](https://nayepankh.com) directly.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        setMessages(prev => [...prev, errMsg])
      }
    } finally {
      setLoading(false)
    }
  }, [input, messages, loading, activeSession])

  // ─── Keyboard Handler ────────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ─── Copy Handler ────────────────────────────────────────────────────────────
  const copyText = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }

  // ─── Regenerate Last Response ─────────────────────────────────────────────
  const regenerate = () => {
    const userMessages = messages.filter(m => m.role === 'user')
    if (!userMessages.length) return
    const lastUser = userMessages[userMessages.length - 1].content
    const trimmed = messages.slice(0, messages.findLastIndex(m => m.role === 'user'))
    setMessages(trimmed)
    sendMessage(lastUser)
  }

  // ─── New Chat ────────────────────────────────────────────────────────────────
  const newChat = () => {
    setMessages([])
    setActiveSession(uuidv4())
    inputRef.current?.focus()
  }

  // ─── Load Session ────────────────────────────────────────────────────────────
  const loadSession = (session) => {
    setMessages(session.msgs || [])
    setActiveSession(session.id)
  }

  // ─── Copy Entire Conversation ─────────────────────────────────────────────
  const copyConversation = () => {
    const text = messages.map(m => `${m.role === 'user' ? 'You' : 'NayePankh AI'}: ${m.content}`).join('\n\n')
    navigator.clipboard.writeText(text)
  }

  // ─── Export Chat ──────────────────────────────────────────────────────────
  const exportChat = () => {
    const text = `NayePankh AI Assistant — Chat Export\n${'='.repeat(40)}\n${new Date().toLocaleString()}\n\n` +
      messages.map(m => `[${m.role === 'user' ? 'You' : 'NayePankh AI'}]\n${m.content}`).join('\n\n---\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `nayepankh-chat-${Date.now()}.txt`
    a.click()
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'dark' : ''}`}>

      {/* SIDEBAR */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 z-10"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">NP</div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">NayePankh AI</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">UP Govt. Reg. NGO</div>
              </div>
            </div>

            {/* New Chat Button */}
            <div className="p-3">
              <button onClick={newChat} className="w-full flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
                <FiPlus size={15} />New Chat
              </button>
            </div>

            {/* History */}
            {sessions.length > 0 && (
              <div className="flex-1 overflow-y-auto">
                <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Today</div>
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => loadSession(s)}
                    className={`w-full text-left px-3 py-2 mx-2 rounded-lg text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2 transition-all hover:bg-white dark:hover:bg-gray-800 ${s.id === activeSession ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : ''}`}
                    style={{ width: 'calc(100% - 16px)' }}
                  >
                    <FiMessageSquare size={12} className="flex-shrink-0 opacity-60" />
                    <span className="truncate">{s.title}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
              <a href="https://nayepankh.com" target="_blank" rel="noreferrer" className="text-xs text-emerald-600 flex items-center justify-center gap-1 hover:underline">
                nayepankh.com <FiExternalLink size={10} />
              </a>
              <div className="text-xs text-gray-400 mt-1">contact@nayepankh.com</div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-950">

        {/* HEADER */}
        <header className="h-13 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
            <FiMenu size={18} />
          </button>
          <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">NayePankh AI Assistant</h1>
          <div className="flex items-center gap-1.5 ml-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-400">Online</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={exportChat} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <FiDownload size={12} />Export
            </button>
            <button onClick={copyConversation} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <FiCopy size={12} />Copy All
            </button>
            <button onClick={() => setMessages([])} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <FiTrash2 size={12} />Clear
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
              {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>
          </div>
        </header>

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* WELCOME SCREEN */
            <div className="max-w-2xl mx-auto px-5 pt-10 pb-4">
              <div className="text-center mb-7">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200 dark:shadow-emerald-900">
                  <span className="text-3xl">🕊️</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">NayePankh AI Assistant</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Helping volunteers, interns and supporters<br />through intelligent conversations.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {QUICK_LINKS.map(ql => (
                  <button key={ql.label} onClick={() => sendMessage(ql.msg)} className="px-3.5 py-1.5 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium hover:bg-emerald-500 hover:text-white transition-all">
                    {ql.label}
                  </button>
                ))}
              </div>
              <p className="text-center text-xs text-gray-400 mb-3 font-medium">Suggested Questions</p>
              <div className="grid grid-cols-2 gap-2.5">
                {SUGGESTED.map(s => (
                  <button key={s.title} onClick={() => sendMessage(s.msg)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 text-left hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-all group">
                    <div className="flex items-start gap-2.5">
                      <span className="text-lg mt-0.5">{s.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-emerald-800 dark:group-hover:text-emerald-300">{s.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{s.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* MESSAGES */
            <div className="max-w-3xl mx-auto px-5 py-4 space-y-1">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <div className={`flex gap-3 mb-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium ${msg.role === 'user' ? 'bg-emerald-700 text-white' : 'bg-gradient-to-br from-emerald-500 to-teal-400 text-white'}`}>
                        {msg.role === 'user' ? '👤' : '🌿'}
                      </div>
                      <div className={`max-w-[76%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed prose prose-sm max-w-none ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-sm prose-invert' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tl-sm text-gray-800 dark:text-gray-200'}`}>
                          {msg.role === 'ai' ? <MarkdownContent content={msg.content} /> : msg.content}
                        </div>
                        {msg.role === 'ai' && (
                          <div className="flex gap-1 mt-1.5 ml-1">
                            <button onClick={() => copyText(msg.content, msg.id)} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all">
                              <FiCopy size={10} />{copiedId === msg.id ? 'Copied!' : 'Copy'}
                            </button>
                            <button onClick={regenerate} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all">
                              <FiRefreshCw size={10} />Regenerate
                            </button>
                          </div>
                        )}
                        <div className={`text-xs text-gray-400 mt-0.5 ${msg.role === 'user' ? 'text-right pr-1' : 'pl-1'}`}>{msg.time}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {loading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-sm flex-shrink-0">🌿</div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1.5 items-center h-5">
                      {[0, 0.2, 0.4].map((delay, i) => (
                        <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay }} className="w-2 h-2 rounded-full bg-emerald-500 opacity-70" />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-3.5">
          <div className="max-w-3xl mx-auto">
            <div className={`flex items-end gap-2.5 bg-white dark:bg-gray-800 border-2 rounded-xl px-3.5 py-2.5 transition-colors ${input ? 'border-emerald-400' : 'border-gray-200 dark:border-gray-600'}`}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => { setInput(e.target.value); setCharCount(e.target.value.length) }}
                onKeyDown={handleKeyDown}
                maxLength={MAX_CHARS}
                placeholder="Ask me anything about NayePankh Foundation..."
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 max-h-32 min-h-6 leading-relaxed"
                rows={1}
                style={{ height: 'auto' }}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 130) + 'px' }}
              />
              {loading ? (
                <button onClick={() => { abortRef.current?.abort(); setLoading(false) }} className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-red-600 transition-colors">
                  <FiSquare size={14} className="text-white" />
                </button>
              ) : (
                <button onClick={() => sendMessage()} disabled={!input.trim()} className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${input.trim() ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer' : 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'}`}>
                  <FiSend size={14} className="text-white" />
                </button>
              )}
            </div>
            <div className="flex justify-between items-center mt-1.5 px-1">
              <span className="text-xs text-gray-400">{charCount}/{MAX_CHARS}</span>
              <span className="text-xs text-gray-400">Enter to send · Shift+Enter for new line</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
