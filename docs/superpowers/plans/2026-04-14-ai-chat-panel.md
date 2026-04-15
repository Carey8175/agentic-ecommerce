# AI Chat Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AI chat hero section to the home page and a floating chat widget to all other pages, both using dummy responses with keyword-based logic.

**Architecture:** A shared `useDummyChat` hook holds all message state and response logic. The hero chat on `/` is a full-width inline component replacing the current `Hero`. The floating widget is a client component mounted in the main layout so it appears on every page except `/` (detected via pathname). No external API calls — all responses are local dummy logic.

**Tech Stack:** Next.js 15, React, TypeScript, Tailwind CSS (existing stack — no new dependencies)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/modules/ai-chat/hooks/use-dummy-chat.ts` | **Create** | Shared hook — message state, dummy response logic, send handler |
| `src/modules/ai-chat/components/chat-messages.tsx` | **Create** | Renders a thread of user/AI message bubbles |
| `src/modules/ai-chat/components/chat-input.tsx` | **Create** | Pill-shaped input + send button, calls `onSend` prop |
| `src/modules/ai-chat/components/prompt-chips.tsx` | **Create** | Clickable suggestion chips that pre-fill the input |
| `src/modules/ai-chat/components/hero-chat.tsx` | **Create** | Home page hero — gradient bg, heading, chips, messages, input |
| `src/modules/ai-chat/components/floating-chat.tsx` | **Create** | Floating bubble + slide-up panel for all non-home pages |
| `src/modules/home/components/hero/index.tsx` | **Modify** | Replace with `HeroChat` |
| `src/app/[countryCode]/(main)/layout.tsx` | **Modify** | Mount `FloatingChat` (client boundary) |

---

## Task 1: Dummy Chat Hook

**Files:**
- Create: `src/modules/ai-chat/hooks/use-dummy-chat.ts`

- [ ] **Step 1: Create the hook file**

```ts
// src/modules/ai-chat/hooks/use-dummy-chat.ts
import { useState } from "react"

export type Message = {
  id: string
  role: "user" | "ai"
  text: string
}

let _msgCounter = 0
const msgId = (prefix: string) => `${prefix}-${++_msgCounter}`

const DUMMY_RESPONSES: Array<{ keywords: string[]; reply: string }> = [
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

const FALLBACK =
  "I'd be happy to help! Try browsing our store or use the search bar to find exactly what you need."

function getDummyReply(input: string): string {
  const lower = input.toLowerCase()
  for (const { keywords, reply } of DUMMY_RESPONSES) {
    if (keywords.some((k) => lower.includes(k))) {
      return reply
    }
  }
  return FALLBACK
}

export function useDummyChat(initialMessage?: string) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessage
      ? [{ id: "init", role: "ai", text: initialMessage }]
      : []
  )
  const [input, setInput] = useState("")

  const send = (text?: string) => {
    const content = (text ?? input).trim()
    if (!content) return

    const userMsg: Message = {
      id: msgId("u"),
      role: "user",
      text: content,
    }
    const aiMsg: Message = {
      id: msgId("a"),
      role: "ai",
      text: getDummyReply(content),
    }

    setMessages((prev) => [...prev, userMsg, aiMsg])
    setInput("")
  }

  return { messages, input, setInput, send }
}
```

- [ ] **Step 2: Verify the file exists**

```bash
ls "c:/Users/Admin/Desktop/E-com Platform (Medusa)/agentic-store-storefront/src/modules/ai-chat/hooks/"
```

Expected: `use-dummy-chat.ts`

---

## Task 2: ChatMessages Component

**Files:**
- Create: `src/modules/ai-chat/components/chat-messages.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/modules/ai-chat/components/chat-messages.tsx
"use client"

import { useEffect, useRef } from "react"
import { Message } from "../hooks/use-dummy-chat"

export default function ChatMessages({ messages }: { messages: Message[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
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
                : "bg-white border border-gray-200 text-gray-700 rounded-bl-sm shadow-sm"
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
```

- [ ] **Step 2: Verify the file exists**

```bash
ls "c:/Users/Admin/Desktop/E-com Platform (Medusa)/agentic-store-storefront/src/modules/ai-chat/components/"
```

Expected: `chat-messages.tsx`

---

## Task 3: ChatInput Component

**Files:**
- Create: `src/modules/ai-chat/components/chat-input.tsx`

- [x] **Step 1: Create the component**

```tsx
// src/modules/ai-chat/components/chat-input.tsx
"use client"

import React from "react"

type ChatInputProps = {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  placeholder?: string
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  placeholder = "Ask me anything...",
}: ChatInputProps) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="flex items-center gap-2 w-full max-w-2xl mx-auto bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
      />
      <button
        onClick={onSend}
        disabled={!value.trim()}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-900 text-white disabled:opacity-40 hover:bg-gray-700 transition-colors flex-shrink-0"
        aria-label="Send"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  )
}
```

- [x] **Step 2: Verify file exists**

```bash
ls "c:/Users/Admin/Desktop/E-com Platform (Medusa)/agentic-store-storefront/src/modules/ai-chat/components/"
```

Expected: `chat-input.tsx`, `chat-messages.tsx`

---

## Task 4: PromptChips Component

**Files:**
- Create: `src/modules/ai-chat/components/prompt-chips.tsx`

- [x] **Step 1: Create the component**

```tsx
// src/modules/ai-chat/components/prompt-chips.tsx
"use client"

const CHIPS = [
  "Find me something under $20",
  "What's good for home decor?",
  "Recommend a gift",
  "Show me electronics",
]

export default function PromptChips({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 px-4">
      {CHIPS.map((chip) => (
        <button
          key={chip}
          onClick={() => onSelect(chip)}
          className="px-4 py-1.5 rounded-full border border-gray-300 text-sm text-gray-600 hover:border-gray-900 hover:text-gray-900 bg-white transition-colors"
        >
          {chip}
        </button>
      ))}
    </div>
  )
}
```

- [x] **Step 2: Verify file exists**

```bash
ls "c:/Users/Admin/Desktop/E-com Platform (Medusa)/agentic-store-storefront/src/modules/ai-chat/components/"
```

Expected: `chat-input.tsx`, `chat-messages.tsx`, `prompt-chips.tsx`

---

## Task 5: HeroChat Component

**Files:**
- Create: `src/modules/ai-chat/components/hero-chat.tsx`

- [x] **Step 1: Create the component**

```tsx
// src/modules/ai-chat/components/hero-chat.tsx
"use client"

import ChatInput from "./chat-input"
import ChatMessages from "./chat-messages"
import PromptChips from "./prompt-chips"
import { useDummyChat } from "../hooks/use-dummy-chat"

export default function HeroChat() {
  const { messages, input, setInput, send } = useDummyChat(
    "Hi, I'm your Byteshop assistant. What are you looking for today?"
  )

  const handleChip = (text: string) => {
    setInput(text)
  }

  return (
    <div
      className="w-full min-h-[70vh] flex flex-col justify-center items-center gap-8 py-16 px-4 border-b border-gray-100"
      style={{
        background: "radial-gradient(ellipse at 60% 40%, #f3f4f6 0%, #ffffff 70%)",
      }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-5xl small:text-6xl font-light tracking-tight text-gray-900 leading-tight">
          Byteshop
        </h1>
        <p className="text-lg text-gray-400 font-light tracking-wide">
          Your AI-powered shopping assistant
        </p>
      </div>

      <div className="w-full flex flex-col gap-4 items-center">
        <ChatMessages messages={messages} />
        <PromptChips onSelect={handleChip} />
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => send()}
          placeholder="Ask me anything about our products..."
        />
      </div>
    </div>
  )
}
```

- [x] **Step 2: Verify file exists**

```bash
ls "c:/Users/Admin/Desktop/E-com Platform (Medusa)/agentic-store-storefront/src/modules/ai-chat/components/"
```

Expected: `chat-input.tsx`, `chat-messages.tsx`, `hero-chat.tsx`, `prompt-chips.tsx`

---

## Task 6: Replace Hero with HeroChat

**Files:**
- Modify: `src/modules/home/components/hero/index.tsx`

- [x] **Step 1: Replace hero content**

Replace the entire content of `src/modules/home/components/hero/index.tsx` with:

```tsx
import HeroChat from "@modules/ai-chat/components/hero-chat"

const Hero = () => {
  return <HeroChat />
}

export default Hero
```

- [ ] **Step 2: Start the storefront dev server and verify the home page renders the chat hero**

```bash
cd "c:/Users/Admin/Desktop/E-com Platform (Medusa)/agentic-store-storefront"
pnpm dev
```

Open `http://localhost:8000/` — should see Byteshop heading, greeting message bubble, prompt chips, and chat input.

- [ ] **Step 3: Test chip click and typing**

Click a chip (e.g. "Recommend a gift") — should show user bubble and AI reply bubble immediately. Type a message and press Enter — should do the same.

---

## Task 7: FloatingChat Component

**Files:**
- Create: `src/modules/ai-chat/components/floating-chat.tsx`

- [x] **Step 1: Create the component**

```tsx
// src/modules/ai-chat/components/floating-chat.tsx
"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import ChatInput from "./chat-input"
import ChatMessages from "./chat-messages"
import { useDummyChat } from "../hooks/use-dummy-chat"

export default function FloatingChat() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { messages, input, setInput, send } = useDummyChat(
    "Hi! How can I help you today?"
  )

  // Don't render on home page — hero chat covers it there.
  // pathname for home is /de or /de/ → one segment after filter.
  // pathname for store is /de/store → two segments.
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length <= 1) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm font-medium text-gray-800">Byteshop Assistant</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4">
            <ChatMessages messages={messages} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100">
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={() => send()}
              placeholder="Ask me anything..."
            />
          </div>
        </div>
      )}

      {/* Bubble toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 rounded-full bg-gray-900 text-white shadow-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
        aria-label="Open chat"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  )
}
```

- [x] **Step 2: Verify file exists**

```bash
ls "c:/Users/Admin/Desktop/E-com Platform (Medusa)/agentic-store-storefront/src/modules/ai-chat/components/"
```

Expected: all 5 component files present.

---

## Task 8: Mount FloatingChat in Layout

**Files:**
- Modify: `src/app/[countryCode]/(main)/layout.tsx`

- [x] **Step 1: Add FloatingChat to the layout**

Add `import FloatingChat from "@modules/ai-chat/components/floating-chat"` to the top-level imports at the top of `layout.tsx` (alongside the other imports). Then add `<FloatingChat />` in the return block after `{props.children}` and before `<Footer />`.

Full updated return block:

```tsx
return (
  <>
    <Nav />
    {customer && cart && (
      <CartMismatchBanner customer={customer} cart={cart} />
    )}
    {cart && (
      <FreeShippingPriceNudge
        variant="popup"
        cart={cart}
        shippingOptions={shippingOptions}
      />
    )}
    {props.children}
    <FloatingChat />
    <Footer />
  </>
)
```

- [x] **Step 2: Verify floating chat appears on store page**

Open `http://localhost:8000/de/store` — should see the chat bubble in the bottom-right corner.

- [x] **Step 3: Verify floating chat does NOT appear on home page**

Open `http://localhost:8000/de` — should NOT see the floating bubble (hero chat is there instead).

- [x] **Step 4: Test the floating chat**

Click the bubble → panel opens with greeting. Type a message → AI reply appears. Click X → panel closes.

---

## Task 9: Final Verification

- [x] **Step 1: Test home page hero chat end-to-end**
  - Prompt chip click sends message and gets reply
  - Typing and pressing Enter sends message and gets reply
  - Messages scroll correctly when thread gets long

- [x] **Step 2: Test floating chat on store, product, cart pages**
  - Opens and closes correctly
  - Greeting message present on open
  - Keyword responses work (type "gift", "electronics", "cheap")
  - Fallback response works (type "xyzabc")

- [x] **Step 3: Verify no console errors**

Open browser devtools — no React or TypeScript errors.
