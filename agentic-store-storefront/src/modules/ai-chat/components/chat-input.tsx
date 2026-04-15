"use client"

type ChatInputProps = {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  placeholder?: string
  variant?: "dark" | "light"
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  placeholder = "Ask me anything...",
  variant = "dark",
}: ChatInputProps) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const isLight = variant === "light"

  return (
    <div className={`flex items-center gap-3 w-full rounded-full px-5 py-3 transition-colors ${
      isLight
        ? "bg-gray-50 border border-gray-200 focus-within:border-indigo-300"
        : "bg-white/10 border border-white/20 focus-within:border-indigo-400/60"
    }`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        className={`flex-1 text-sm bg-transparent outline-none ${
          isLight
            ? "text-gray-800 placeholder-gray-400"
            : "text-white placeholder-white/30"
        }`}
      />
      <button
        onClick={onSend}
        disabled={!value.trim()}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white disabled:opacity-30 hover:bg-indigo-500 transition-all flex-shrink-0 shadow-md shadow-indigo-900/20"
        aria-label="Send"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  )
}
