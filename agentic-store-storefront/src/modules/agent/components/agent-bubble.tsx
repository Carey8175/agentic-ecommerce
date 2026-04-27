"use client"

import { useState, useEffect } from "react"
import AgentPanel from "./agent-panel"

type Props = { cartId?: string | null }

export default function AgentBubble({ cartId }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener("agent_open_and_send", handleOpen)
    return () => window.removeEventListener("agent_open_and_send", handleOpen)
  }, [])

  return (
    <>
      {/* Floating panel — always mounted to preserve state, hidden via CSS */}
      <div className={`fixed bottom-20 right-5 w-[360px] h-[560px] z-50 shadow-2xl rounded-2xl overflow-hidden border border-white/10 transition-all duration-200 ${open ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none translate-y-2"}`}>
        <AgentPanel mode="floating" cartId={cartId} />
      </div>

      {/* Bubble trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 z-50 w-13 h-13 w-[52px] h-[52px] rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center"
        aria-label="Open AI Assistant"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        )}
      </button>
    </>
  )
}
