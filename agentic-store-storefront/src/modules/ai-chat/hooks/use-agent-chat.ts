"use client"

import { useState, useRef, useCallback } from "react"
import { streamChat } from "@modules/agent/hooks/use-agent-stream"

export type Message = {
  id: string
  role: "user" | "ai"
  text: string
}

let _counter = 0
const uid = () => `m-${++_counter}`

export function useAgentChat(initialMessage?: string, surface = "floating") {
  const [messages, setMessages] = useState<Message[]>(
    initialMessage ? [{ id: uid(), role: "ai", text: initialMessage }] : []
  )
  const [input, setInput] = useState("")
  const sessionId = useRef<string | null>(null)

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content) return

    setInput("")
    const userMsg: Message = { id: uid(), role: "user", text: content }
    const aiId = uid()
    setMessages((prev) => [...prev, userMsg, { id: aiId, role: "ai", text: "" }])

    let accumulated = ""
    try {
      for await (const event of streamChat({
        message: content,
        sessionId: sessionId.current,
        cartId: null,
        surface,
        onSessionId: (id) => { sessionId.current = id },
      })) {
        if (event.type === "token") {
          accumulated += event.content
          setMessages((prev) =>
            prev.map((m) => m.id === aiId ? { ...m, text: accumulated } : m)
          )
        } else if (event.type === "error") {
          setMessages((prev) =>
            prev.map((m) => m.id === aiId ? { ...m, text: "Sorry, something went wrong. Please try again." } : m)
          )
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => m.id === aiId ? { ...m, text: "Sorry, I couldn't connect. Please try again." } : m)
      )
    }
  }, [input, surface])

  return { messages, input, setInput, send }
}
