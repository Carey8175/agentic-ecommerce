"use client"

import { useState, useEffect, useRef } from "react"

type Ticket = {
  id: string
  type: string
  status: string
  subject: string
  order_display_id?: number
  created_at: number
  updated_at: number
}

type Message = {
  id: string
  sender_role: "customer" | "admin"
  content: string
  created_at: number
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400",
  pending_admin: "bg-blue-500/20 text-blue-400",
  pending_customer: "bg-indigo-500/20 text-indigo-400",
  resolved: "bg-green-500/20 text-green-400",
  closed: "bg-white/10 text-white/40",
}

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  pending_admin: "Awaiting Support",
  pending_customer: "Reply Needed",
  resolved: "Resolved",
  closed: "Closed",
}

const TYPE_LABEL: Record<string, string> = {
  cancellation: "Cancellation",
  return: "Return",
  refund: "Refund",
  damaged: "Damaged Item",
  missing: "Missing Item",
  general: "General",
}

function timeAgo(dateNum: number) {
  // Convert Unix timestamp to milliseconds
  const diff = Date.now() - (dateNum * 1000)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function SupportTicketsPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const fetchTickets = (autoSelectId?: string) => {
    fetch("/api/agent/tickets")
      .then(r => r.json())
      .then(d => {
        setTickets(d.tickets ?? [])
        // Auto-select ticket if requested (from View My Requests button)
        const id = autoSelectId ?? (() => {
          try { return sessionStorage.getItem("_open_ticket_id") } catch { return null }
        })()
        if (id) {
          setSelectedId(id)
          try { sessionStorage.removeItem("_open_ticket_id") } catch {}
          setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTickets()
    window.addEventListener("ticket_created", () => fetchTickets())
    return () => window.removeEventListener("ticket_created", () => fetchTickets())
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setThreadLoading(true)
    fetch(`/api/agent/tickets/${selectedId}`)
      .then(r => r.json())
      .then(d => {
        setMessages(d.messages ?? [])
        setSelectedTicket(d.ticket ?? null)
      })
      .catch(() => {})
      .finally(() => setThreadLoading(false))
  }, [selectedId])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  async function sendReply() {
    if (!reply.trim() || !selectedId || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/agent/tickets/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setMessages(prev => [...prev, json.message])
      setReply("")
      setTickets(prev => prev.map(t => t.id === selectedId ? { ...t, status: "pending_admin", updated_at: Math.floor(Date.now() / 1000) } : t))
    } catch {}
    setSending(false)
  }

  return (
    <div ref={panelRef} className="flex w-full h-full gap-4">
      {/* Ticket list */}
      <div className="w-72 flex-shrink-0 flex flex-col bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Requests</p>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {loading && (
            <div className="flex items-center justify-center h-24">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          )}
          {!loading && tickets.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-gray-400">No support requests yet.</p>
              <p className="text-[10px] text-gray-400 mt-1">Ask the AI assistant for help — it will open a ticket if needed.</p>
            </div>
          )}
          {tickets.map(ticket => (
            <button
              key={ticket.id}
              onClick={() => setSelectedId(ticket.id)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                selectedId === ticket.id ? "bg-indigo-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] text-gray-400 font-mono">#{ticket.id.slice(0, 8)}</span>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-500"}`}>
                  {STATUS_LABEL[ticket.status] ?? ticket.status}
                </span>
              </div>
              <p className="text-xs text-gray-800 font-medium truncate">{ticket.subject}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-gray-500">{TYPE_LABEL[ticket.type] ?? ticket.type}</span>
                <span className="text-[10px] text-gray-400">{timeAgo(ticket.updated_at)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Thread view */}
      <div className="flex-1 flex flex-col bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-2xl">🎫</p>
              <p className="text-sm text-gray-400">Select a request to view the thread</p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="px-5 py-3 border-b border-gray-200 flex-shrink-0">
              {selectedTicket && (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedTicket.subject}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {selectedTicket.order_display_id && (
                        <span className="text-[10px] text-gray-500">Order #{selectedTicket.order_display_id}</span>
                      )}
                      <span className="text-[10px] text-gray-500">{TYPE_LABEL[selectedTicket.type] ?? selectedTicket.type}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[selectedTicket.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {STATUS_LABEL[selectedTicket.status] ?? selectedTicket.status}
                  </span>
                </div>
              )}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 no-scrollbar">
              {threadLoading && (
                <div className="flex items-center justify-center h-16">
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                </div>
              )}
              {!threadLoading && messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_role === "customer" ? "justify-end" : "justify-start"} gap-2`}>
                  {msg.sender_role === "admin" && (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 mt-1">S</div>
                  )}
                  <div className={`max-w-[75%] px-3 py-2 text-sm leading-relaxed ${
                    msg.sender_role === "customer"
                      ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm"
                      : "bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm"
                  }`}>
                    {msg.content}
                    <div className={`text-[9px] mt-1 ${msg.sender_role === "customer" ? "text-white/50" : "text-gray-400"}`}>
                      {timeAgo(msg.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              {!threadLoading && messages.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-8">No messages yet. Our team will respond shortly.</p>
              )}
            </div>

            {/* Reply box — only if not resolved/closed */}
            {selectedTicket && !["resolved", "closed"].includes(selectedTicket.status) && (
              <div className="px-4 pb-4 flex-shrink-0">
                <div className="flex gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                  <textarea
                    className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none resize-none"
                    placeholder="Reply to support..."
                    rows={2}
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                    disabled={sending}
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="self-end w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white disabled:opacity-40 transition-opacity flex-shrink-0"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                  </button>
                </div>
              </div>
            )}
            {selectedTicket && ["resolved", "closed"].includes(selectedTicket.status) && (
              <div className="px-5 pb-4 flex-shrink-0">
                <p className="text-[10px] text-gray-400 text-center">This ticket is {selectedTicket.status}. Contact support to reopen.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
