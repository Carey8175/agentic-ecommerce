"use client"

import { useState } from "react"
import { useSelectedLayoutSegments } from "next/navigation"
import { ChatBubbleLeftRightSolid, XMark } from "@medusajs/icons"
import { Container, Heading, IconButton } from "@medusajs/ui"

import { useDummyChat } from "../hooks/use-dummy-chat"
import ChatMessages from "./chat-messages"
import ChatInput from "./chat-input"

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const segments = useSelectedLayoutSegments()
  
  const { messages, input, setInput, send } = useDummyChat(
    "Hi there! Need help finding anything?"
  )

  // Do not show on the home page since we have the HeroChat there.
  // The home page layout segment array will typically be empty.
  // Store pages will have segments like ["store"]
  if (segments.length === 0 || segments[0] === "customer-service") {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white border border-gray-200 rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
            <h3 className="font-semibold text-sm">AI Shopping Assistant</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMark />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
            <ChatMessages messages={messages} />
          </div>
          
          <div className="p-3 bg-white border-t border-gray-100">
            <ChatInput 
              value={input} 
              onChange={setInput} 
              onSend={() => send()} 
              placeholder="Ask me anything..."
            />
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-elevation-card-rest transition-transform hover:scale-105 active:scale-95 ${
          isOpen ? "bg-white text-gray-900 border border-gray-200" : "bg-gray-900 text-white"
        }`}
        aria-label="Toggle AI Chat"
      >
        {isOpen ? (
          <XMark />
        ) : (
          <ChatBubbleLeftRightSolid />
        )}
      </button>
    </div>
  )
}
