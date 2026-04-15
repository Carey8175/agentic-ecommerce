"use client"

import { useDummyChat } from "../hooks/use-dummy-chat"
import ChatMessages from "./chat-messages"
import ChatInput from "./chat-input"
import PromptChips from "./prompt-chips"

export default function HeroChat() {
  const { messages, input, setInput, send } = useDummyChat(
    "Hi there! I'm your AI shopping assistant. How can I help you today?"
  )

  return (
    <div className="w-full relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)" }}>
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      {/* Glow orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />

      <div className="relative content-container py-20 md:py-28 flex flex-col items-center text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-xs font-medium px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          AI-Powered Shopping
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-none mb-4">
          Shop smarter with
        </h1>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-none mb-6" style={{ background: "linear-gradient(90deg, #a78bfa, #6366f1, #38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          AI assistance
        </h1>

        <p className="text-white/50 text-lg max-w-md mb-12 font-light">
          Describe what you&apos;re looking for and let our AI find the perfect match for you.
        </p>

        {/* Chat box */}
        <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10 bg-white/5">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
            </div>
            <span className="text-white/40 text-xs mx-auto">Byteshop Assistant</span>
          </div>

          {/* Messages */}
          <div className="h-[260px] overflow-y-auto p-5 flex flex-col gap-3 no-scrollbar">
            <ChatMessages messages={messages} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-white/10 bg-white/5 flex flex-col gap-3">
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={() => send()}
            />
            <PromptChips onSelect={(text) => { setInput(text) }} />
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-10 mt-14">
          {[
            { value: "500+", label: "Products" },
            { value: "AI", label: "Recommendations" },
            { value: "24/7", label: "Assistance" },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-white">{value}</span>
              <span className="text-white/40 text-xs uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
