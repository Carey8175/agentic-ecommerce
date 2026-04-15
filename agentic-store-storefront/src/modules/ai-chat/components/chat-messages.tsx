"use client"

import { useEffect, useRef } from "react"
import { Message } from "../hooks/use-dummy-chat"

type Props = {
  messages: Message[]
  variant?: "dark" | "light"
}

export default function ChatMessages({ messages, variant = "dark" }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messages.length > 1) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [messages])

  if (messages.length === 0) return null

  const isLight = variant === "light"

  return (
    <div className="flex flex-col gap-4 w-full">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.role === "ai" && (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0 text-white text-[10px] font-bold shadow-sm">
              AI
            </div>
          )}
          <div
            className={`px-4 py-3 rounded-2xl text-sm max-w-[78%] leading-relaxed ${
              msg.role === "user"
                ? "bg-indigo-600 text-white rounded-br-sm shadow-lg shadow-indigo-900/20"
                : isLight
                  ? "bg-gray-50 text-gray-800 rounded-bl-sm border border-gray-100 shadow-sm"
                  : "bg-white/10 text-white/90 rounded-bl-sm border border-white/10"
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
