"use client"

import { useDummyChat } from "../hooks/use-dummy-chat"
import ChatMessages from "./chat-messages"
import ChatInput from "./chat-input"
import PromptChips from "./prompt-chips"
import { Heading, Text, Container } from "@medusajs/ui"

export default function HeroChat() {
  const { messages, input, setInput, send } = useDummyChat(
    "Hi there! I'm your AI shopping assistant. How can I help you today?"
  )

  const handleSelectChip = (text: string) => {
    setInput(text)
  }

  return (
    <div className="w-full bg-ui-bg-subtle border-b border-ui-border-base">
      <div className="content-container py-16 md:py-24 flex flex-col items-center text-center">
        
        <Heading level="h1" className="text-4xl md:text-5xl font-light tracking-tight text-ui-fg-base mb-4">
          Discover your next favorite item
        </Heading>
        <Text className="text-ui-fg-subtle mb-12 max-w-lg txt-large">
          Not sure where to start? Ask our AI assistant for personalized recommendations, style tips, or gift ideas.
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
            <PromptChips onSelect={handleSelectChip} />
          </div>
        </div>

      </div>
    </div>
  )
}
