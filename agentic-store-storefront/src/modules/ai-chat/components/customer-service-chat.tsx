"use client"

import { useDummyChat } from "../hooks/use-dummy-chat"
import ChatMessages from "./chat-messages"
import ChatInput from "./chat-input"
import PromptChips from "./prompt-chips"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"
import { Heading, Text, Container } from "@medusajs/ui"

export default function CustomerServiceChat() {
  const searchParams = useSearchParams()
  const q = searchParams.get("q")
  const hasInitialized = useRef(false)

  const { messages, input, setInput, send } = useDummyChat(
    "Hi there! I'm your AI support assistant. How can I help you with your order today?",
    "support"
  )

  useEffect(() => {
    if (q && !hasInitialized.current) {
      hasInitialized.current = true
      send(q)
    }
  }, [q, send])

  const handleSelectChip = (text: string) => {
    setInput(text)
  }

  const CUSTOMER_SERVICE_CHIPS = [
    "Track my order",
    "I need a refund",
    "How to cancel my order?",
    "Payment declined",
  ]

  return (
    <div className="w-full bg-ui-bg-subtle border-b border-ui-border-base">
      <div className="content-container py-16 md:py-24 flex flex-col items-center text-center">
        
        <Heading level="h1" className="text-4xl md:text-5xl font-light tracking-tight text-ui-fg-base mb-4">
          Customer Support
        </Heading>
        <Text className="text-ui-fg-subtle mb-12 max-w-lg txt-large">
          Need help with your order? Ask our AI assistant for quick answers regarding tracking, refunds, and more.
        </Text>

        <div className="w-full flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden h-[400px]">
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
            <ChatMessages messages={messages} />
          </div>
          
          <div className="p-4 bg-white border-t border-gray-100 flex flex-col gap-3">
            <ChatInput 
              value={input} 
              onChange={setInput} 
              onSend={() => send()} 
            />
            <PromptChips onSelect={handleSelectChip} chips={CUSTOMER_SERVICE_CHIPS} />
          </div>
        </div>

      </div>
    </div>
  )
}
