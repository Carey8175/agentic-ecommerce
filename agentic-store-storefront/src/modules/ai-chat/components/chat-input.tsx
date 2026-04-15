"use client"

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
