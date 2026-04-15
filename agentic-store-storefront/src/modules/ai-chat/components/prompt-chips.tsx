"use client"

const DEFAULT_CHIPS = [
  "Recommend a gift under $50",
  "What's popular right now?",
  "I need something for summer",
  "Help me find a stylish shirt",
]

type Props = {
  onSelect: (text: string) => void
  chips?: string[]
  variant?: "dark" | "light"
}

export default function PromptChips({ onSelect, chips = DEFAULT_CHIPS, variant = "dark" }: Props) {
  const isLight = variant === "light"

  return (
    <div className="flex flex-wrap gap-2 justify-start">
      {chips.map((chip, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(chip)}
          className={`text-xs px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
            isLight
              ? "border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50"
              : "border border-white/20 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/40"
          }`}
        >
          {chip}
        </button>
      ))}
    </div>
  )
}
