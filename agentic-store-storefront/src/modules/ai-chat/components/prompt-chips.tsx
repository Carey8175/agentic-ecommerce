"use client"

const DEFAULT_CHIPS = [
  "Recommend a gift under $50",
  "What's popular right now?",
  "I need something for summer",
  "Help me find a stylish shirt",
]

export default function PromptChips({ onSelect, chips = DEFAULT_CHIPS }: { onSelect: (text: string) => void, chips?: string[] }) {
  return (
    <div className="flex flex-wrap gap-2 w-full max-w-2xl mx-auto mt-4 px-4 justify-center">
      {chips.map((chip, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(chip)}
          className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm whitespace-nowrap"
        >
          {chip}
        </button>
      ))}
    </div>
  )
}
