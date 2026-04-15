"use client"

import { useDummyChat } from "../hooks/use-dummy-chat"
import ChatMessages from "./chat-messages"
import ChatInput from "./chat-input"
import PromptChips from "./prompt-chips"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

const FAQ = [
  {
    q: "How do I track my order?",
    a: "Once your order ships you'll receive an email with a tracking number. You can also visit My Account → Orders to see live tracking updates.",
  },
  {
    q: "Can I cancel or change my order?",
    a: "Orders can be cancelled or modified within 1 hour of placement. After that they enter fulfilment and can no longer be changed. Contact support immediately if you need to act fast.",
  },
  {
    q: "How do I return an item?",
    a: "We accept returns within 30 days of delivery. Go to My Account → Orders, select the item, and click 'Start Return'. A prepaid label will be emailed to you.",
  },
  {
    q: "When will I receive my refund?",
    a: "Refunds are processed within 2 business days of us receiving your return. It may take an additional 3–5 business days to appear on your statement depending on your bank.",
  },
  {
    q: "My payment was declined — what should I do?",
    a: "Double-check your card details and billing address. If the issue persists, try a different payment method or contact your bank. Our support team can also help investigate.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes! We ship to most countries worldwide. Shipping costs and estimated delivery times are shown at checkout based on your location.",
  },
  {
    q: "How do I contact a human agent?",
    a: "Type your issue in the chat above and if the AI can't resolve it, it will escalate to a human agent. You can also email support@byteshop.com for non-urgent queries.",
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`border border-gray-100 rounded-xl overflow-hidden transition-shadow ${open ? "shadow-sm" : ""}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left gap-4 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-800">{q}</span>
        <span className={`flex-shrink-0 w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 transition-transform duration-200 ${open ? "rotate-45" : ""}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-4 bg-gray-50/50">
          {a}
        </div>
      )}
    </div>
  )
}

const CUSTOMER_SERVICE_CHIPS = [
  "Track my order",
  "I need a refund",
  "How to cancel my order?",
  "Payment declined",
]

export default function CustomerServiceChat() {
  const searchParams = useSearchParams()
  const q = searchParams.get("q")
  const hasInitialized = useRef(false)

  const { messages, input, setInput, send } = useDummyChat(
    "Hi! I'm your support assistant. How can I help you today?",
    "support"
  )

  useEffect(() => {
    if (q && !hasInitialized.current) {
      hasInitialized.current = true
      send(q)
    }
  }, [q, send])

  return (
    <div className="w-full bg-gray-50/50 min-h-[calc(100vh-4rem)]">
      <div className="content-container py-16 md:py-20 flex flex-col items-center">

        {/* Header */}
        <div className="text-center mb-10 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-medium px-4 py-1.5 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            AI Support
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Customer Support
          </h1>
          <p className="text-gray-400 text-base leading-relaxed">
            Need help with your order? Ask our AI assistant for quick answers regarding tracking, refunds, and more.
          </p>
        </div>

        {/* Chat box — same structure as hero, light variant */}
        <div className="w-full max-w-3xl bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">

          {/* Chat chrome bar */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
            </div>
            <span className="text-gray-400 text-xs mx-auto">Support Assistant</span>
          </div>

          {/* Messages */}
          <div className="h-[420px] overflow-y-auto p-6 flex flex-col gap-1 no-scrollbar bg-white">
            <ChatMessages messages={messages} variant="light" />
          </div>

          {/* Input area */}
          <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-3">
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={() => send()}
              placeholder="Describe your issue..."
              variant="light"
            />
            <PromptChips
              onSelect={(text) => setInput(text)}
              chips={CUSTOMER_SERVICE_CHIPS}
              variant="light"
            />
          </div>
        </div>

        {/* FAQ */}
        <div className="w-full max-w-3xl mt-12 mb-4">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">Self-serve</p>
            <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="flex flex-col gap-2">
            {FAQ.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
