"use client"

import { useState } from "react"
import { useSelectedLayoutSegments } from "next/navigation"
import { XMark } from "@medusajs/icons"
import { useDummyChat } from "../hooks/use-dummy-chat"

function ChatBubbleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const segments = useSelectedLayoutSegments()

  const { messages, input, setInput, send } = useDummyChat(
    "Hi there! Need help finding anything?"
  )

  if (segments.length === 0 || segments[0] === "customer-service") {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[360px] h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100" style={{ background: "#fff" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100" style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                AI
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-none">Byteshop Assistant</p>
                <p className="text-white/40 text-xs mt-0.5">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white transition-colors p-1"
            >
              <XMark />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3 no-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "ai" && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 text-white text-[9px] font-bold">
                    AI
                  </div>
                )}
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm max-w-[80%] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-white text-gray-800 rounded-bl-sm border border-gray-100 shadow-sm"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:border-indigo-300 transition-colors">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask me anything..."
                className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim()}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-indigo-600 text-white disabled:opacity-30 hover:bg-indigo-500 transition-all flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center text-white"
        style={{ background: isOpen ? "#fff" : "linear-gradient(135deg, #6366f1, #4f46e5)", color: isOpen ? "#4f46e5" : "#fff", border: isOpen ? "1px solid #e5e7eb" : "none" }}
        aria-label="Toggle AI Chat"
      >
        {isOpen ? <XMark /> : <ChatBubbleIcon />}
      </button>
    </div>
  )
}
