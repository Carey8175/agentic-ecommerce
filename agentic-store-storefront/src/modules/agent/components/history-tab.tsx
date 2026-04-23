"use client"

import { useEffect, useState } from "react"

type Session = { id: string; title: string | null; created_at: number; updated_at: number; surface: string }

export default function HistoryTab({ onResumeSession, currentSessionId }: { onResumeSession: (id: string) => void; currentSessionId?: string | null }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("_agent_session_id")
    fetch("/api/agent/history")
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

  if (loading) return <div className="flex-1 flex items-center justify-center text-white/30 text-sm">Loading...</div>
  if (sessions.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center text-white/30 text-sm gap-2">
      <span>No past chat history yet</span>
      <span className="text-xs">Start a conversation to see it here</span>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-3">Chat History</p>
      {sessions.map(s => (
        <button
          key={s.id}
          onClick={() => onResumeSession(s.id)}
          className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
        >
          <p className="text-sm text-white/80 font-medium truncate">{s.title ?? "Untitled conversation"}</p>
          <p className="text-[10px] text-white/30 mt-0.5">{formatDate(s.updated_at)}</p>
        </button>
      ))}
    </div>
  )
}
