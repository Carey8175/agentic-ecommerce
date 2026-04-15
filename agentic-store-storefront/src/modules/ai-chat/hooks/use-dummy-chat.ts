import { useState } from "react"

export type Message = {
  id: string
  role: "user" | "ai"
  text: string
}

let _msgCounter = 0
const msgId = (prefix: string) => `${prefix}-${++_msgCounter}`

const SHOPPING_RESPONSES: Array<{ keywords: string[]; reply: string }> = [
  {
    keywords: ["under", "cheap", "budget", "price", "affordable", "less than"],
    reply: "Great choice going budget-friendly! Try sorting by 'Price: Low → High' in our store to find the best deals.",
  },
  {
    keywords: ["gift", "present", "birthday", "someone"],
    reply: "Looking for a gift? Browse our categories — Home & Garden and Health & Beauty are always popular choices!",
  },
  {
    keywords: ["home", "decor", "furniture", "living"],
    reply: "For home decor, check out our Home & Garden category — we have a wide range of styles and price points.",
  },
  {
    keywords: ["electronic", "tech", "gadget", "phone", "computer"],
    reply: "We have a great Electronics section! Head over to the store and filter by Electronics to explore.",
  },
  {
    keywords: ["clothing", "wear", "fashion", "apparel", "shirt", "shoe"],
    reply: "Fashion is our specialty! Check out Apparel & Accessories in the store for the latest styles.",
  },
  {
    keywords: ["recommend", "suggest", "what should", "best", "popular"],
    reply: "Our most popular items are on the home page under 'Recommended for You'. Give those a look!",
  },
  {
    keywords: ["hello", "hi", "hey", "help"],
    reply: "Hi there! I'm here to help you find the perfect product. What are you looking for today?",
  },
]

const SUPPORT_RESPONSES: Array<{ keywords: string[]; reply: string }> = [
  {
    keywords: ["track", "order", "where", "shipping", "status"],
    reply: "To track your order, please visit the 'Account' section and click on 'Orders'. You'll find tracking details for all your recent purchases.",
  },
  {
    keywords: ["refund", "return", "money back", "exchange"],
    reply: "We offer a 30-day return policy. If you need a refund or exchange, please navigate to your order history to initiate the return process, or email our support team directly.",
  },
  {
    keywords: ["cancel", "change order", "modify"],
    reply: "Orders can only be modified or canceled within 1 hour of placement. Please contact us immediately if you need to make changes.",
  },
  {
    keywords: ["payment", "card", "charge", "declined"],
    reply: "If your payment was declined, please check your card details or contact your bank. We accept all major credit cards and PayPal.",
  },
  {
    keywords: ["hello", "hi", "hey", "help"],
    reply: "Hi there! I'm here to help with your account or order issues. What can I assist you with today?",
  },
]

const SHOPPING_FALLBACK =
  "I'd be happy to help! Try browsing our store or use the search bar to find exactly what you need."

const SUPPORT_FALLBACK =
  "I'm sorry, I don't quite understand. Could you please provide your order number or rephrase your question? Alternatively, you can email support@byteshop.com."

function getDummyReply(input: string, mode: "shopping" | "support" = "shopping"): string {
  const lower = input.toLowerCase()
  const responses = mode === "shopping" ? SHOPPING_RESPONSES : SUPPORT_RESPONSES
  const fallback = mode === "shopping" ? SHOPPING_FALLBACK : SUPPORT_FALLBACK
  
  for (const { keywords, reply } of responses) {
    if (keywords.some((k) => lower.includes(k))) {
      return reply
    }
  }
  return fallback
}

export function useDummyChat(initialMessage?: string, mode: "shopping" | "support" = "shopping") {
  const [messages, setMessages] = useState<Message[]>(
    initialMessage
      ? [{ id: msgId("init"), role: "ai", text: initialMessage }]
      : []
  )
  const [input, setInput] = useState("")

  const send = (text?: string) => {
    const content = (text ?? input).trim()
    if (!content) return

    const userMsg: Message = { id: msgId("u"), role: "user", text: content }
    const aiMsg: Message = { id: msgId("a"), role: "ai", text: getDummyReply(content, mode) }

    setMessages((prev) => [...prev, userMsg, aiMsg])
    setInput("")
  }

  return { messages, input, setInput, send }
}
