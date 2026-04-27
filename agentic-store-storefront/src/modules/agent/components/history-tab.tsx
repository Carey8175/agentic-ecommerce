"use client"

import { useEffect, useState } from "react"

type Session = { id: string; title: string | null; created_at: number; updated_at: number; surface: string }

export default function HistoryTab({ onResumeSession, currentSessionId, isLight, surface }: { onResumeSession: (id: string) => void; currentSessionId?: string | null; isLight?: boolean; surface?: string }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("_agent_session_id")
    fetch(surface ? `/api/agent/history?surface=${surface}` : "/api/agent/history")
      .then(r => r.json())
      .then(d => { 
        // Filter out current active session from history list to avoid confusion
        const historyList = (d.sessions ?? []).filter((s: Session) => s.id !== stored && s.id !== currentSessionId)
        setSessions(historyList) 
        setLoading(false) 
      })
      .catch(() => setLoading(false))
  }, [])

  function formatDate(ts: number) {
    const d = new Date(ts * 1000)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return "Just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 86400 * 2) return "Yesterday"
    return d.toLocaleDateString()
  }

  if (loading) return <div className={`flex-1 flex items-center justify-center text-sm ${isLight ? "text-gray-400" : "text-white/30"}`}>Loading...</div>
  if (sessions.length === 0) return (
    <div className={`flex-1 flex flex-col items-center justify-center text-sm gap-2 ${isLight ? "text-gray-400" : "text-white/30"}`}>
      <span>No past chat history yet</span>
      <span className="text-xs">Start a conversation to see it here</span>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
      <p className={`text-[10px] font-semibold uppercase tracking-widest mb-3 ${isLight ? "text-gray-400" : "text-white/30"}`}>Chat History</p>
      {sessions.map(s => (
        <button
          key={s.id}
          onClick={() => onResumeSession(s.id)}
          className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${isLight ? "bg-gray-50 hover:bg-gray-100 border border-gray-200" : "bg-white/5 hover:bg-white/10"}`}
        >
          <p className={`text-sm font-medium truncate ${isLight ? "text-gray-800" : "text-white/80"}`}>{s.title ?? "Untitled conversation"}</p>
          <p className={`text-[10px] mt-0.5 ${isLight ? "text-gray-500" : "text-white/30"}`}>{formatDate(s.updated_at)}</p>
        </button>
      ))}
    </div>
  )
}
