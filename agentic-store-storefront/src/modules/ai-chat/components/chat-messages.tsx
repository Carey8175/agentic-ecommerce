"use client"

import { useEffect, useRef } from "react"
import { Message } from "../hooks/use-dummy-chat"

export default function ChatMessages({ messages }: { messages: Message[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Prevent scrolling to bottom on initial page load (when only the greeting is present)
    if (messages.length > 1) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [messages])

  if (messages.length === 0) return null

  return (
    <div className="flex flex-col gap-3 w-full max-w-2xl mx-auto px-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`px-4 py-2 rounded-2xl text-sm max-w-[80%] ${
              msg.role === "user"
                ? "bg-gray-900 text-white rounded-br-sm"
                : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
            }`}
          >
            {msg.text}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
