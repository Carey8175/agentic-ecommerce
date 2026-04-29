import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubble } from "@medusajs/icons"
import { useState, useEffect, useRef } from "react"

export const config = defineRouteConfig({
  label: "Support Tickets",
  icon: ChatBubble,
})

const AGENT_URL = "http://69.5.8.150"

type Ticket = {
  id: string
  customer_id: string
  customer_email: string
  customer_name: string
  order_id?: string
  order_display_id?: number
  type: string
  status: string
  subject: string
  created_at: number
  updated_at: number
}

type Message = {
  id: string
  sender_role: "customer" | "admin"
  content: string
  created_at: number
}

const STATUS_OPTIONS = ["open", "pending_admin", "pending_customer", "resolved", "closed"]

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  pending_admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  pending_customer: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-ui-bg-subtle text-ui-fg-muted border-ui-border-base",
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
  // Convert Unix timestamp (seconds) back to milliseconds
  const diff = Date.now() - (dateNum * 1000)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filtered, setFiltered] = useState<Ticket[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${AGENT_URL}/agent/tickets/admin`)
      .then(r => r.json())
      .then(d => { setTickets(d.tickets ?? []); setFiltered(d.tickets ?? []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (statusFilter === "all") setFiltered(tickets)
    else setFiltered(tickets.filter(t => t.status === statusFilter))
  }, [statusFilter, tickets])

  useEffect(() => {
    if (!selectedId) return
    setConfirmDelete(false)
    setThreadLoading(true)
    fetch(`${AGENT_URL}/agent/tickets/${selectedId}`)
      .then(r => r.json())
      .then(d => { setMessages(d.messages ?? []); setSelectedTicket(d.ticket ?? null) })
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
      const res = await fetch(`${AGENT_URL}/agent/tickets/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply.trim(), sender_role: "admin" }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setMessages(prev => [...prev, json.message])
      setReply("")
      setTickets(prev => prev.map(t => t.id === selectedId ? { ...t, status: "pending_customer", updated_at: Math.floor(Date.now() / 1000) } : t))
      setSelectedTicket(prev => prev ? { ...prev, status: "pending_customer" } : prev)
    } catch {}
    setSending(false)
  }

  async function deleteSelected() {
    if (!selectedId || deleting) return
    setDeleting(true)
    try {
      await fetch(`${AGENT_URL}/agent/tickets/${selectedId}`, { method: "DELETE" })
      setTickets(prev => prev.filter(t => t.id !== selectedId))
      setSelectedId(null)
      setSelectedTicket(null)
      setMessages([])
    } catch {}
    setDeleting(false)
    setConfirmDelete(false)
  }

  async function updateStatus(newStatus: string) {
    if (!selectedId || updatingStatus) return
    setUpdatingStatus(true)
    try {
      const res = await fetch(`${AGENT_URL}/agent/tickets/${selectedId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setTickets(prev => prev.map(t => t.id === selectedId ? { ...t, status: newStatus } : t))
      setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : prev)
    } catch {}
    setUpdatingStatus(false)
  }

  return (
    <div className="flex flex-col gap-4 p-6 h-screen">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-ui-fg-base text-2xl font-semibold">Support Tickets</h1>
          <p className="text-ui-fg-muted text-sm mt-0.5">{tickets.length} total ticket{tickets.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-ui-fg-muted text-xs">Filter:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-ui-border-base rounded-md px-2 py-1.5 bg-ui-bg-base text-ui-fg-base outline-none"
          >
            <option value="all">All</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Ticket list */}
        <div className="w-80 flex-shrink-0 flex flex-col border border-ui-border-base rounded-xl overflow-hidden bg-ui-bg-base">
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center h-24">
                <div className="w-5 h-5 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="px-4 py-10 text-center">
                <p className="text-ui-fg-muted text-sm">No tickets found.</p>
              </div>
            )}
            {filtered.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => setSelectedId(ticket.id)}
                className={`w-full text-left px-4 py-4 border-b border-ui-border-base transition-colors ${
                  selectedId === ticket.id ? "bg-ui-bg-subtle" : "hover:bg-ui-bg-base-hover"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs text-ui-fg-muted font-mono">#{ticket.id.slice(0, 8)}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[ticket.status] ?? ""}`}>
                    {STATUS_LABEL[ticket.status] ?? ticket.status}
                  </span>
                </div>
                <p className="text-sm text-ui-fg-base font-medium line-clamp-1">{ticket.subject}</p>
                <p className="text-xs text-ui-fg-muted line-clamp-1 mt-0.5">{ticket.customer_email}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-ui-fg-subtle uppercase tracking-wider font-semibold">{TYPE_LABEL[ticket.type] ?? ticket.type}</span>
                  <span className="text-[10px] text-ui-fg-subtle">{timeAgo(ticket.updated_at)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Thread panel */}
        <div className="flex-1 flex flex-col border border-ui-border-base rounded-xl overflow-hidden bg-ui-bg-base min-h-0">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-2xl">🎫</p>
                <p className="text-sm text-ui-fg-muted">Select a ticket to view the thread</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-5 py-3 border-b border-ui-border-base flex-shrink-0">
                {selectedTicket && (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-ui-fg-base">{selectedTicket.subject}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {selectedTicket.customer_id && (
                          <span className="text-xs font-mono bg-ui-bg-subtle border border-ui-border-base px-2 py-0.5 rounded text-ui-fg-subtle">
                            {selectedTicket.customer_id.split("_")[1] ? `cus_${selectedTicket.customer_id.split("_")[1].slice(0, 8)}` : selectedTicket.customer_id.slice(0, 8)}
                          </span>
                        )}
                        {selectedTicket.customer_name && (
                          <span className="text-xs font-medium text-ui-fg-base flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-ui-border-strong"></span>
                            {selectedTicket.customer_name}
                          </span>
                        )}
                        <span className="text-xs text-ui-fg-muted flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-ui-border-strong"></span>
                          {selectedTicket.customer_email}
                        </span>
                        {selectedTicket.order_display_id && (
                          <span className="text-xs text-ui-fg-subtle flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-ui-border-strong"></span>
                            Order #{selectedTicket.order_display_id}
                          </span>
                        )}
                        <span className="text-xs text-ui-fg-subtle flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-ui-border-strong"></span>
                          {TYPE_LABEL[selectedTicket.type] ?? selectedTicket.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={selectedTicket.status}
                        onChange={e => updateStatus(e.target.value)}
                        disabled={updatingStatus}
                        className={`text-xs border rounded-full px-2.5 py-1 outline-none font-medium cursor-pointer ${STATUS_COLORS[selectedTicket.status] ?? "border-ui-border-base"} [&>option]:bg-ui-bg-base [&>option]:text-ui-fg-base`}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                      {confirmDelete ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-red-400">Delete?</span>
                          <button onClick={deleteSelected} disabled={deleting} className="text-xs px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-colors disabled:opacity-50">
                            {deleting ? "..." : "Yes"}
                          </button>
                          <button onClick={() => setConfirmDelete(false)} className="text-xs px-2.5 py-1 border border-ui-border-base text-ui-fg-muted rounded-full hover:bg-ui-bg-subtle transition-colors">
                            No
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(true)} className="text-xs px-2.5 py-1 border border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-full font-medium transition-colors">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {threadLoading && (
                  <div className="flex items-center justify-center h-16">
                    <div className="w-5 h-5 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
                  </div>
                )}
                {!threadLoading && messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_role === "admin" ? "justify-end" : "justify-start"} gap-3`}>
                    {msg.sender_role === "customer" && (
                      <div className="w-6 h-6 rounded-full bg-ui-bg-subtle border border-ui-border-base flex items-center justify-center text-ui-fg-base text-[10px] font-bold flex-shrink-0 mt-1">C</div>
                    )}
                    <div className={`max-w-[75%] space-y-1`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.sender_role === "admin"
                          ? "bg-violet-600 text-white rounded-tr-sm"
                          : "bg-ui-bg-subtle text-ui-fg-base rounded-tl-sm border border-ui-border-base"
                      }`}>
                        {msg.content}
                      </div>
                      <div className={`text-[10px] px-1 ${msg.sender_role === "admin" ? "text-right text-ui-fg-subtle" : "text-left text-ui-fg-subtle"}`}>
                        {timeAgo(msg.created_at)}
                      </div>
                    </div>
                    {msg.sender_role === "admin" && (
                      <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-1 shadow-sm">A</div>
                    )}
                  </div>
                ))}
                {!threadLoading && messages.length === 0 && (
                  <p className="text-sm text-ui-fg-muted text-center py-10">No messages in this ticket yet.</p>
                )}
              </div>

              {/* Reply box */}
              {selectedTicket && !["closed"].includes(selectedTicket.status) && (
                <div className="px-5 py-4 border-t border-ui-border-base bg-ui-bg-subtle flex-shrink-0">
                  <div className="flex gap-3">
                    <textarea
                      className="flex-1 bg-ui-bg-base border border-ui-border-base rounded-xl px-4 py-3 text-sm text-ui-fg-base placeholder:text-ui-fg-muted outline-none focus:ring-2 focus:ring-ui-border-interactive resize-none shadow-sm"
                      placeholder="Reply to customer..."
                      rows={2}
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                      disabled={sending}
                    />
                    <div className="flex flex-col gap-2 justify-end">
                      <button
                        onClick={sendReply}
                        disabled={sending || !reply.trim()}
                        className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl disabled:opacity-40 transition-colors shadow-sm"
                      >
                        {sending ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
